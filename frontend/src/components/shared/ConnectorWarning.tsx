'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

interface ConnectorWarningProps {
  connector: string;
  message?: string;
  onDismiss?: () => void;
  /** If true, renders as a full modal overlay. If false (default), renders as an inline banner. */
  modal?: boolean;
}

const CONNECTOR_ICONS: Record<string, string> = {
  'Twilio': '📞',
  'Meta (WhatsApp)': '💬',
  'Meta': '💬',
  'Razorpay': '💳',
  'SMTP Email': '📧',
  'Google Ads': '📣',
};

const CONNECTOR_DOCS: Record<string, string> = {
  'Twilio': 'connectors&highlight=twilio',
  'Meta (WhatsApp)': 'connectors&highlight=meta',
  'Meta': 'connectors&highlight=meta',
  'Razorpay': 'connectors&highlight=razorpay',
  'SMTP Email': 'connectors&highlight=smtp',
  'Google Ads': 'connectors&highlight=googleAds',
};

export default function ConnectorWarning({
  connector,
  message,
  onDismiss,
  modal = false,
}: ConnectorWarningProps) {
  const router = useRouter();

  const icon = CONNECTOR_ICONS[connector] || '🔌';
  const docFragment = CONNECTOR_DOCS[connector] || 'connectors';
  const settingsUrl = `/settings?tab=${docFragment}`;

  const defaultMessage =
    message ||
    `Your ${connector} integration is not configured yet. Set it up in Settings → Connectors to use this feature.`;

  const handleGoToSettings = () => {
    router.push(settingsUrl);
    onDismiss?.();
  };

  if (modal) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm">
        <div
          className="mx-4 w-full max-w-md rounded-[16px] border border-black/10 bg-white p-8 shadow-2xl"
          style={{ fontFamily: "'Inter', 'Outfit', sans-serif" }}
        >
          {/* Icon */}
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-[12px] bg-amber-50 border border-amber-200 text-3xl">
            {icon}
          </div>

          {/* Title */}
          <h2 className="mb-2 text-center text-lg font-semibold text-[#1A1A1A]">
            {connector} Not Configured
          </h2>

          {/* Message */}
          <p className="mb-6 text-center text-sm leading-relaxed text-[#1A1A1A]/60">
            {defaultMessage}
          </p>

          {/* Action buttons */}
          <div className="flex flex-col gap-3">
            <button
              onClick={handleGoToSettings}
              className="w-full rounded-[8px] bg-[#1A1A1A] py-3 text-sm font-semibold text-white transition hover:bg-[#1A1A1A]/80"
            >
              Go To Settings → Connectors
            </button>
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="w-full rounded-[8px] border border-black/10 py-3 text-sm font-medium text-[#1A1A1A]/60 transition hover:bg-gray-50"
              >
                Dismiss
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Inline banner (default)
  return (
    <div
      className="flex items-start gap-3 rounded-[12px] border border-amber-200 bg-amber-50 p-4"
      style={{ fontFamily: "'Inter', 'Outfit', sans-serif" }}
      role="alert"
    >
      {/* Icon */}
      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] bg-amber-100 border border-amber-200 text-lg">
        {icon}
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-amber-800">
          {connector} Integration Not Set Up
        </p>
        <p className="mt-0.5 text-xs leading-relaxed text-amber-700">
          {defaultMessage}
        </p>
      </div>

      {/* Action button */}
      <div className="flex shrink-0 items-center gap-2">
        <button
          onClick={handleGoToSettings}
          className="rounded-[8px] bg-amber-800 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-amber-900"
        >
          Configure
        </button>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="rounded-[6px] border border-amber-200 px-2.5 py-1.5 text-xs font-medium text-amber-700 transition hover:bg-amber-100"
            aria-label="Dismiss warning"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}
