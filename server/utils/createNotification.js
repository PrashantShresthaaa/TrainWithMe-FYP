const Notification = require('../models/notificationModel');

const createNotification = async ({
  io,
  user,
  title,
  message,
  type = 'system',
  targetTab = '',
  metadata = {},
}) => {
  if (!user) return null;

  const notification = await Notification.create({
    user,
    title,
    message,
    type,
    targetTab,
    metadata,
  });

  if (io) {
    io.to(String(user)).emit('notification:new', notification);
  }

  return notification;
};

module.exports = createNotification;
