'use client';

import React from 'react';
import { X, Copy, Download, Link as LinkIcon, Check } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';

interface WebinarQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  webinarId: string;
  webinarTitle: string;
}

export const WebinarQRModal = ({ isOpen, onClose, webinarId, webinarTitle }: WebinarQRModalProps) => {
  const [copied, setCopied] = React.useState(false);

  if (!isOpen) return null;

  // In Next.js, window is only available on client-side
  const registrationUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/webinars/${webinarId}/register`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(registrationUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadQR = () => {
    const canvas = document.getElementById('webinar-qr') as HTMLCanvasElement;
    if (!canvas) return;

    // Create a temporary link to download the image
    const pngUrl = canvas.toDataURL('image/png').replace('image/png', 'image/octet-stream');
    const downloadLink = document.createElement('a');
    downloadLink.href = pngUrl;
    downloadLink.download = `qr-${webinarTitle.toLowerCase().replace(/\s+/g, '-')}.png`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-sm glass rounded-3xl border-white/10 shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
              <LinkIcon size={20} />
            </div>
            <h2 className="text-xl font-bold">Share Webinar</h2>
          </div>
          <button type="button" onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl text-slate-400 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-8 flex flex-col items-center gap-6">
          <div className="p-4 bg-white rounded-2xl shadow-inner overflow-hidden">
            <QRCodeCanvas
              id="webinar-qr"
              value={registrationUrl}
              size={200}
              level={"H"}
              includeMargin={true}
            />
          </div>

          <div className="text-center space-y-1">
            <h3 className="font-semibold text-slate-200">{webinarTitle}</h3>
            <p className="text-xs text-slate-500">Scan to register for this webinar</p>
          </div>

          <div className="w-full space-y-3">
            <div className="flex items-center gap-2 p-3 bg-white/5 rounded-xl border border-white/10">
              <span className="flex-1 text-[10px] text-slate-400 truncate font-mono">
                {registrationUrl}
              </span>
              <button
                onClick={copyToClipboard}
                className="p-2 hover:bg-white/10 rounded-lg text-blue-400 transition-all flex-shrink-0"
                title="Copy Link"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
              </button>
            </div>

            <button
              onClick={downloadQR}
              className="w-full bg-blue-600 hover:bg-blue-500 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
            >
              <Download size={18} />
              Download QR Code
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
