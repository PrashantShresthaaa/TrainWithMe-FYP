const asyncHandler = require('express-async-handler');
const Booking = require('../models/bookingModel');
const User = require('../models/userModel');
const createNotification = require('../utils/createNotification');

const KHALTI_SECRET_KEY = process.env.KHALTI_SECRET_KEY;
const KHALTI_GATEWAY_URL =
  process.env.KHALTI_GATEWAY_URL || 'https://dev.khalti.com/api/v2/epayment';
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

const getScheduleLabel = (booking) => {
  return `${booking.sessionDate} at ${booking.sessionTime} (${booking.sessionType})`;
};

const initiateKhaltiPayment = asyncHandler(async (req, res) => {
  const { bookingId } = req.body;

  if (!bookingId) {
    res.status(400);
    throw new Error('Booking ID is required');
  }

  const booking = await Booking.findById(bookingId)
    .populate('trainer', 'name email')
    .populate('client', 'name email');

  if (!booking) {
    res.status(404);
    throw new Error('Booking not found');
  }

  if (booking.client._id.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to pay for this booking');
  }

  if (booking.status !== 'accepted_awaiting_payment') {
    res.status(400);
    throw new Error('This booking is not ready for payment');
  }

  if (!KHALTI_SECRET_KEY) {
    res.status(500);
    throw new Error('Khalti secret key is missing in server .env');
  }

  const amountInPaisa = Math.round((booking.totalAmount || booking.price) * 100);

  const payload = {
    return_url: `${CLIENT_URL}/payment/khalti/callback`,
    website_url: CLIENT_URL,
    amount: amountInPaisa,
    purchase_order_id: booking._id.toString(),
    purchase_order_name: `TrainWithMe session with ${booking.trainer?.name || 'Trainer'}`,
    customer_info: {
      name: booking.client?.name || req.user.name || 'Client',
      email: booking.client?.email || req.user.email || 'client@example.com',
    },
  };

  const khaltiRes = await fetch(`${KHALTI_GATEWAY_URL}/initiate/`, {
    method: 'POST',
    headers: {
      Authorization: `Key ${KHALTI_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = await khaltiRes.json();

  if (!khaltiRes.ok) {
    res.status(400);
    throw new Error(data.detail || data.message || 'Failed to initiate Khalti payment');
  }

  booking.khaltiPidx = data.pidx || '';
  booking.paymentMethod = 'khalti';
  booking.paymentStatus = 'pending';
  await booking.save();

  res.status(200).json({
    payment_url: data.payment_url,
    pidx: data.pidx,
  });
});

const verifyKhaltiPayment = asyncHandler(async (req, res) => {
  const { pidx, bookingId } = req.body;

  if (!pidx || !bookingId) {
    res.status(400);
    throw new Error('pidx and bookingId are required');
  }

  const booking = await Booking.findById(bookingId);

  if (!booking) {
    res.status(404);
    throw new Error('Booking not found');
  }

  if (booking.client.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to verify this payment');
  }

  if (!KHALTI_SECRET_KEY) {
    res.status(500);
    throw new Error('Khalti secret key is missing in server .env');
  }

  const khaltiRes = await fetch(`${KHALTI_GATEWAY_URL}/lookup/`, {
    method: 'POST',
    headers: {
      Authorization: `Key ${KHALTI_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ pidx }),
  });

  const data = await khaltiRes.json();

  if (!khaltiRes.ok) {
    booking.paymentStatus = 'failed';
    await booking.save();

    res.status(400);
    throw new Error(data.detail || data.message || 'Failed to verify Khalti payment');
  }

  if (data.status !== 'Completed') {
    booking.paymentStatus = 'failed';
    await booking.save();

    res.status(400);
    throw new Error(`Payment not completed. Current status: ${data.status}`);
  }

  booking.paymentStatus = 'paid';
  booking.status = 'confirmed';
  booking.paidAt = new Date();
  booking.paymentExpiresAt = null;
  booking.khaltiPidx = pidx;
  booking.khaltiTransactionId = data.transaction_id || data.idx || '';
  await booking.save();

  const trainerUser = await User.findById(booking.trainer).select('name');
  const clientUser = await User.findById(booking.client).select('name');
  const scheduleLabel = getScheduleLabel(booking);

  await createNotification({
    io: req.app.get('io'),
    user: booking.client,
    title: 'Booking confirmed',
    message: `Payment successful. Your ${booking.sessionType.toLowerCase()} workout with ${trainerUser?.name || 'trainer'} is scheduled for ${scheduleLabel}.`,
    type: 'payment',
    targetTab: 'mytrainers',
    metadata: { bookingId: booking._id },
  });

  await createNotification({
    io: req.app.get('io'),
    user: booking.trainer,
    title: 'Client payment received',
    message: `${clientUser?.name || 'A client'} has paid for the ${booking.sessionType.toLowerCase()} workout scheduled on ${scheduleLabel}.`,
    type: 'payment',
    targetTab: 'requests',
    metadata: { bookingId: booking._id },
  });

  res.status(200).json({
    message: 'Payment verified successfully',
    booking,
  });
});

module.exports = {
  initiateKhaltiPayment,
  verifyKhaltiPayment,
};
