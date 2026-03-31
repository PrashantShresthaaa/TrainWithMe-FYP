import React from 'react';
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  Clock3,
  FileImage,
  ShieldCheck,
} from 'lucide-react';

const configMap = {
  not_submitted: {
    title: 'Finish verification to go live',
    text: 'Upload your trainer certificate and citizenship documents to start the admin review process. Until then, clients cannot see or book you.',
    chip: 'bg-gray-100 text-gray-600 border border-gray-200',
    icon: <FileImage size={18} />,
    cta: 'Upload documents',
  },
  pending: {
    title: 'Verification is under review',
    text: 'Your documents are with the admin team now. You can continue setting up your trainer profile, but you will stay hidden from clients until approval.',
    chip: 'bg-amber-50 text-amber-700 border border-amber-200',
    icon: <Clock3 size={18} />,
    cta: 'View verification status',
  },
  rejected: {
    title: 'Verification was rejected',
    text: 'Your documents need correction before approval. Review the admin note and upload a cleaner or correct document set.',
    chip: 'bg-red-50 text-red-600 border border-red-200',
    icon: <AlertTriangle size={18} />,
    cta: 'Resubmit documents',
  },
  resubmit_required: {
    title: 'New documents are needed',
    text: 'The admin requested a resubmission. Open the verification page, update the document set, and send it again.',
    chip: 'bg-orange-50 text-brandOrange border border-orange-200',
    icon: <AlertTriangle size={18} />,
    cta: 'Update documents',
  },
};

const TrainerVerificationGate = ({ profile, onOpenVerification }) => {
  const status = profile?.verificationStatus || 'not_submitted';

  if (status === 'approved') {
    return null;
  }

  const current = configMap[status] || configMap.not_submitted;
  const uploadedCount = [
    profile?.verificationDocuments?.certificateImage,
    profile?.verificationDocuments?.citizenshipFrontImage,
    profile?.verificationDocuments?.citizenshipBackImage,
  ].filter(Boolean).length;

  return (
    <div className="grid xl:grid-cols-[1.2fr_0.8fr] gap-6">
      <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold ${current.chip}`}>
          {current.icon}
          {current.title}
        </div>

        <h2 className="text-3xl font-black text-brandBlack mt-6 leading-tight">
          Your trainer account is not public yet.
        </h2>
        <p className="text-sm text-gray-500 mt-4 leading-7 max-w-2xl">
          {current.text}
        </p>

        {profile?.verificationNote && (
          <div className="mt-6 rounded-2xl border border-orange-100 bg-orange-50 px-5 py-4 text-sm text-gray-700 leading-6">
            <span className="font-bold text-brandOrange">Admin note:</span> {profile.verificationNote}
          </div>
        )}

        <div className="mt-8 flex flex-wrap gap-3">
          <button
            onClick={onOpenVerification}
            className="inline-flex items-center gap-2 bg-brandOrange text-white px-5 py-3 rounded-2xl font-bold text-sm hover:bg-orange-600 transition"
          >
            {current.cta}
            <ArrowRight size={16} />
          </button>
        </div>
      </div>

      <div className="bg-[#111111] rounded-3xl border border-[#222] p-7 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,103,0,0.24),_transparent_36%)]" />
        <div className="relative z-10">
          <p className="text-xs uppercase tracking-[0.18em] text-orange-200 font-bold">Verification Snapshot</p>

          <div className="mt-6 space-y-4">
            <StatRow label="Current status" value={status.replace(/_/g, ' ')} />
            <StatRow label="Documents uploaded" value={`${uploadedCount}/3`} />
            <StatRow
              label="Public visibility"
              value="Hidden"
              tone="text-red-300"
            />
          </div>

          <div className="mt-8 rounded-2xl bg-white/6 border border-white/10 p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-orange-500/15 text-orange-300 flex items-center justify-center shrink-0">
                <ShieldCheck size={18} />
              </div>
              <div>
                <p className="font-bold">What unlocks after approval</p>
                <p className="text-sm text-gray-300 mt-2 leading-6">
                  Your profile becomes searchable, your packages go public, and clients can send booking requests.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-2xl bg-white/6 border border-white/10 p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 text-emerald-300 flex items-center justify-center shrink-0">
                <BadgeCheck size={18} />
              </div>
              <div>
                <p className="font-bold">What you can still do now</p>
                <p className="text-sm text-gray-300 mt-2 leading-6">
                  Update your trainer bio, add pricing, create packages, and prepare your schedule while admin review is in progress.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatRow = ({ label, value, tone = 'text-white' }) => (
  <div className="flex items-center justify-between gap-3 rounded-2xl bg-white/6 border border-white/10 px-4 py-3">
    <span className="text-sm text-gray-300">{label}</span>
    <span className={`text-sm font-bold capitalize ${tone}`}>{value}</span>
  </div>
);

export default TrainerVerificationGate;
