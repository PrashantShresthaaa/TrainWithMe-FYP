import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  Clock3,
  FileBadge2,
  IdCard,
  ImagePlus,
  Loader,
  ShieldAlert,
  ShieldCheck,
  Upload,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const API = 'http://localhost:5000';

const statusConfig = {
  not_submitted: {
    title: 'Documents not submitted yet',
    text: 'Upload your certificate and citizenship images so the admin can review your trainer profile.',
    chip: 'bg-gray-100 text-gray-600 border border-gray-200',
  },
  pending: {
    title: 'Verification in review',
    text: 'Your documents are under review. You can still explore the trainer dashboard, but clients cannot book you yet.',
    chip: 'bg-amber-50 text-amber-700 border border-amber-200',
  },
  approved: {
    title: 'Trainer verified',
    text: 'You are now approved and visible to clients across the platform.',
    chip: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  },
  rejected: {
    title: 'Verification rejected',
    text: 'Your submission was rejected. Please review the admin note, correct the issue, and upload again.',
    chip: 'bg-red-50 text-red-600 border border-red-200',
  },
  resubmit_required: {
    title: 'Resubmission requested',
    text: 'The admin needs clearer or updated documents before approving your trainer account.',
    chip: 'bg-orange-50 text-brandOrange border border-orange-200',
  },
};

const emptyProfile = {
  verificationStatus: 'not_submitted',
  verificationNote: '',
  verificationDocuments: {
    certificateImage: '',
    citizenshipFrontImage: '',
    citizenshipBackImage: '',
  },
};

const TrainerVerification = () => {
  const navigate = useNavigate();
  const { user, getToken } = useAuth();

  const [profile, setProfile] = useState(emptyProfile);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [files, setFiles] = useState({
    certificate: null,
    citizenshipFront: null,
    citizenshipBack: null,
  });

  useEffect(() => {
    if (!user) return;
    if (user.role !== 'trainer') {
      navigate('/login');
    }
  }, [user, navigate]);

  useEffect(() => {
    const loadProfile = async () => {
      if (!user || user.role !== 'trainer') return;

      try {
        const res = await fetch(`${API}/api/trainers/me`, {
          headers: { Authorization: `Bearer ${getToken()}` },
        });

        if (!res.ok) {
          throw new Error('Failed to load trainer profile');
        }

        const data = await res.json();
        setProfile(data);
      } catch (err) {
        setError(err.message || 'Failed to load trainer verification details.');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [user, getToken]);

  const status = profile?.verificationStatus || 'not_submitted';
  const config = statusConfig[status] || statusConfig.not_submitted;
  const canSubmit = ['not_submitted', 'rejected', 'resubmit_required'].includes(status);

  const documentCards = useMemo(
    () => [
      {
        key: 'certificate',
        label: 'Training Certificate',
        description: 'Upload your primary trainer certificate or certification image.',
        required: true,
        icon: <FileBadge2 size={18} />,
        existingUrl: profile?.verificationDocuments?.certificateImage,
      },
      {
        key: 'citizenshipFront',
        label: 'Citizenship Front',
        description: 'Upload the front image of your citizenship or government ID.',
        required: true,
        icon: <IdCard size={18} />,
        existingUrl: profile?.verificationDocuments?.citizenshipFrontImage,
      },
      {
        key: 'citizenshipBack',
        label: 'Citizenship Back',
        description: 'Optional, but recommended if your ID details continue on the back side.',
        required: false,
        icon: <ImagePlus size={18} />,
        existingUrl: profile?.verificationDocuments?.citizenshipBackImage,
      },
    ],
    [profile]
  );

  const handleFileChange = (key, file) => {
    setFiles((prev) => ({ ...prev, [key]: file || null }));
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  setSubmitting(true);
  setError('');
  setSuccess('');

  const formData = new FormData();
  if (files.certificate) formData.append('certificate', files.certificate);
  if (files.citizenshipFront) formData.append('citizenshipFront', files.citizenshipFront);
  if (files.citizenshipBack) formData.append('citizenshipBack', files.citizenshipBack);

  try {
    const res = await fetch(`${API}/api/trainers/verification`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
      body: formData,
    });

    const contentType = res.headers.get('content-type') || '';
    const data = contentType.includes('application/json')
      ? await res.json()
      : { message: await res.text() };

    if (!res.ok) {
      throw new Error(data.message || 'Failed to submit verification documents');
    }

    setProfile(data);
    setFiles({
      certificate: null,
      citizenshipFront: null,
      citizenshipBack: null,
    });
    setSuccess('Verification documents submitted successfully. The admin has been notified.');
  } catch (err) {
    setError(err.message || 'Failed to submit verification documents');
  } finally {
    setSubmitting(false);
  }
};


  if (!user) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f6f8] flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-500">
          <Loader size={20} className="animate-spin" />
          <span className="font-semibold">Loading verification workspace...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f6f8] px-6 py-10">
      <div className="max-w-6xl mx-auto">
        <button
          onClick={() => navigate('/trainer-dashboard')}
          className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-brandOrange transition mb-6"
        >
          <ArrowLeft size={16} />
          Back to trainer dashboard
        </button>

        <div className="grid xl:grid-cols-[1.05fr_0.95fr] gap-6">
          <div className="bg-[#111111] text-white rounded-[28px] p-8 relative overflow-hidden border border-[#1f1f1f]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,103,0,0.22),_transparent_38%)]" />
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/8 border border-white/10 text-xs font-bold text-orange-200">
                <ShieldCheck size={14} />
                Trainer Trust Review
              </div>

              <h1 className="text-[clamp(2rem,3vw,3.2rem)] font-black leading-[1.05] tracking-tight mt-6">
                Complete your
                <br />
                verification setup.
              </h1>

              <p className="text-gray-300 mt-5 max-w-xl leading-7 text-sm">
                Upload your trainer certificate and citizenship images once. Until the admin approves your account, you can still manage your profile, but clients will not see or book you publicly.
              </p>

              <div className={`mt-8 inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-bold ${config.chip}`}>
                {status === 'approved' ? <BadgeCheck size={16} /> : status === 'pending' ? <Clock3 size={16} /> : <ShieldAlert size={16} />}
                {config.title}
              </div>

              <div className="mt-8 grid md:grid-cols-3 gap-3">
                <StepCard
                  number="01"
                  title="Upload"
                  text="Share certificate and citizenship images securely."
                />
                <StepCard
                  number="02"
                  title="Review"
                  text="Admin checks document clarity and authenticity."
                />
                <StepCard
                  number="03"
                  title="Go Live"
                  text="Approved trainers become visible and bookable."
                />
              </div>

              <div className="mt-8 bg-white/6 border border-white/10 rounded-2xl p-5">
                <p className="text-xs uppercase tracking-[0.18em] text-gray-400 font-bold mb-2">
                  Current Status
                </p>
                <p className="text-lg font-bold">{config.title}</p>
                <p className="text-sm text-gray-300 mt-2 leading-6">{config.text}</p>
                {profile?.verificationNote && (
                  <div className="mt-4 rounded-xl bg-white/8 border border-white/10 px-4 py-3 text-sm text-orange-100 leading-6">
                    <span className="font-bold text-white">Admin note:</span> {profile.verificationNote}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {(error || success) && (
              <div
                className={`rounded-2xl border px-5 py-4 text-sm font-medium ${
                  error
                    ? 'border-red-200 bg-red-50 text-red-600'
                    : 'border-emerald-200 bg-emerald-50 text-emerald-700'
                }`}
              >
                {error || success}
              </div>
            )}

            {status === 'approved' ? (
              <div className="bg-white rounded-[28px] border border-gray-100 p-8 shadow-sm">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-5">
                  <CheckCircle2 size={28} />
                </div>
                <h2 className="text-2xl font-black text-[#111111]">You are verified and live.</h2>
                <p className="text-sm text-gray-500 mt-3 leading-6">
                  Your trainer profile is approved. Clients can now discover you, view your packages, and send bookings through the platform.
                </p>
                <button
                  onClick={() => navigate('/trainer-dashboard')}
                  className="mt-6 inline-flex items-center gap-2 bg-brandOrange text-white px-5 py-3 rounded-2xl font-bold text-sm hover:bg-orange-600 transition"
                >
                  Go to trainer dashboard
                  <ArrowRight size={16} />
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="bg-white rounded-[28px] border border-gray-100 p-7 shadow-sm">
                <div className="flex items-start justify-between gap-4 mb-6">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-gray-400 font-bold">Verification Documents</p>
                    <h2 className="text-2xl font-black text-[#111111] mt-2">
                      {canSubmit ? 'Submit your documents' : 'Documents submitted'}
                    </h2>
                    <p className="text-sm text-gray-500 mt-2 leading-6">
                      {canSubmit
                        ? 'Use clear images. Both required documents must be visible and readable.'
                        : 'Your latest document set is already under review. You can return to the dashboard while the admin checks it.'}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  {documentCards.map((item) => (
                    <label
                      key={item.key}
                      className={`block rounded-2xl border p-4 transition ${
                        canSubmit ? 'border-gray-200 hover:border-brandOrange/30' : 'border-gray-100 bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-11 h-11 rounded-2xl bg-orange-50 text-brandOrange flex items-center justify-center shrink-0">
                          {item.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-bold text-[#111111] text-sm">{item.label}</p>
                            {item.required && (
                              <span className="text-[10px] font-bold uppercase tracking-wider text-brandOrange">
                                Required
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-1 leading-5">{item.description}</p>

                          {files[item.key] ? (
                            <p className="text-xs font-bold text-brandOrange mt-3">
                              Selected: {files[item.key].name}
                            </p>
                          ) : item.existingUrl ? (
                            <a
                              href={item.existingUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-2 text-xs font-bold text-gray-700 mt-3 hover:text-brandOrange"
                            >
                              <ShieldCheck size={13} />
                              View uploaded file
                            </a>
                          ) : (
                            <p className="text-xs text-gray-400 mt-3">No file uploaded yet.</p>
                          )}
                        </div>

                        {canSubmit && (
                          <div className="shrink-0">
                            <span className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-[#111111] text-white text-xs font-bold">
                              <Upload size={13} />
                              Choose file
                            </span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => handleFileChange(item.key, e.target.files?.[0])}
                            />
                          </div>
                        )}
                      </div>
                    </label>
                  ))}
                </div>

                <div className="flex flex-wrap gap-3 mt-7">
                  {canSubmit && (
                    <button
                      type="submit"
                      disabled={submitting}
                      className="inline-flex items-center gap-2 bg-brandOrange text-white px-5 py-3 rounded-2xl font-bold text-sm hover:bg-orange-600 transition disabled:opacity-50"
                    >
                      {submitting ? <Loader size={16} className="animate-spin" /> : <Upload size={16} />}
                      {submitting ? 'Submitting...' : status === 'not_submitted' ? 'Submit for review' : 'Resubmit documents'}
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => navigate('/trainer-dashboard')}
                    className="inline-flex items-center gap-2 bg-gray-100 text-[#111111] px-5 py-3 rounded-2xl font-bold text-sm hover:bg-gray-200 transition"
                  >
                    Go to dashboard
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const StepCard = ({ number, title, text }) => (
  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
    <p className="text-[10px] uppercase tracking-[0.18em] text-orange-200 font-bold">{number}</p>
    <p className="text-sm font-bold mt-2">{title}</p>
    <p className="text-xs text-gray-300 mt-2 leading-5">{text}</p>
  </div>
);

export default TrainerVerification;
