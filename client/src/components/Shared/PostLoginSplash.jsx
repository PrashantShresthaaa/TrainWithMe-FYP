import React, { useEffect, useRef, useState } from 'react';

export default function PostLoginSplash({
  userName = '',
  duration = 1400,
  onComplete,
  preview = false,
  hold = false,
}) {
  const [isExiting, setIsExiting] = useState(false);
  const [isMounted, setIsMounted] = useState(true);
  const mountedAtRef = useRef(Date.now());

  const safeDuration = Math.min(Math.max(duration, 1200), 2200);
  const firstName = userName?.trim()?.split(' ')[0] || '';

  useEffect(() => {
    if (preview) return;
    if (hold) return;

    const elapsed = Date.now() - mountedAtRef.current;
    const remaining = Math.max(safeDuration - elapsed, 0);

    const exitTimer = window.setTimeout(() => {
      setIsExiting(true);
    }, remaining);

    const doneTimer = window.setTimeout(() => {
      setIsMounted(false);
      onComplete?.();
    }, remaining + 320);

    return () => {
      window.clearTimeout(exitTimer);
      window.clearTimeout(doneTimer);
    };
  }, [hold, onComplete, preview, safeDuration]);

  if (!isMounted) return null;

  return (
    <>
      <style>{`
        @keyframes twmSplashIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes twmSplashOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }

        @keyframes twmRise {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes twmProgress {
          from { transform: scaleX(0); }
          to { transform: scaleX(1); }
        }

        @keyframes twmGlow {
          0%, 100% { opacity: 0.55; }
          50% { opacity: 0.95; }
        }
      `}</style>

      <div
        className="fixed inset-0 z-[200] flex items-center justify-center overflow-hidden bg-[#111111]/76 backdrop-blur-xl"
        style={{
          fontFamily: "'Inter', system-ui, sans-serif",
          animation: isExiting
            ? 'twmSplashOut 320ms ease both'
            : 'twmSplashIn 280ms ease both',
        }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,103,0,0.16),transparent_42%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.18),rgba(0,0,0,0.34))]" />

        <div className="relative w-full max-w-2xl px-6 text-center">
          <div
            className="mx-auto mb-5 h-px w-24 bg-gradient-to-r from-transparent via-[#FF6700] to-transparent"
            style={{ animation: 'twmGlow 2s ease-in-out infinite' }}
          />

          <p
            className="text-[11px] font-semibold uppercase tracking-[0.32em] text-[#FF6700]"
            style={{ animation: 'twmRise 480ms ease 80ms both' }}
          >
            Welcome Back
          </p>

          <h1
            className="mt-4 text-[clamp(2.8rem,7vw,5rem)] leading-none text-center"
            style={{
              animation: 'twmRise 520ms ease 140ms both',
              letterSpacing: '-0.035em',
            }}
          >
            <span
              className="text-white"
              style={{
                fontFamily: '"Playfair Display", Georgia, serif',
                fontStyle: 'italic',
                fontWeight: 600,
              }}
            >
              Train
            </span>
            <span
              className="text-[#FF6700]"
              style={{
                fontFamily: '"Playfair Display", Georgia, serif',
                fontStyle: 'italic',
                fontWeight: 600,
              }}
            >
              With
            </span>
            <span
              className="text-white"
              style={{
                fontFamily: '"Playfair Display", Georgia, serif',
                fontStyle: 'italic',
                fontWeight: 600,
              }}
            >
              Me
            </span>
          </h1>

          <p
            className="mt-5 text-[clamp(1.15rem,2.2vw,1.5rem)] font-semibold text-white"
            style={{ animation: 'twmRise 520ms ease 220ms both' }}
          >
            Your training world is ready.
          </p>

          <p
            className="mt-2 text-sm text-white/70"
            style={{ animation: 'twmRise 520ms ease 300ms both' }}
          >
            {firstName ? `${firstName}, let's get moving.` : "Let's get moving."}
          </p>

          <div
            className="mx-auto mt-8 w-full max-w-xs"
            style={{ animation: 'twmRise 520ms ease 360ms both' }}
          >
            <div className="h-[4px] overflow-hidden rounded-full bg-white/15">
              <div
                className="h-full rounded-full bg-[#FF6700]"
                style={{
                  transformOrigin: 'left center',
                  animation: preview
                    ? 'twmProgress 1800ms cubic-bezier(0.22, 1, 0.36, 1) 120ms infinite'
                    : `twmProgress ${safeDuration}ms cubic-bezier(0.22, 1, 0.36, 1) 120ms both`,
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
