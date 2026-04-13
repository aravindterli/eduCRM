import React from 'react';
import { X, Send, MessageSquare, Loader2, Info, Image as ImageIcon, Trash2, Upload, FileText } from 'lucide-react';
import { useLeadStore } from '@/store/useLeadStore';
import { useTemplateStore } from '@/store/useTemplateStore';

interface BulkWhatsAppDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedLeadIds: string[];
  onSuccess: () => void;
}

export function BulkWhatsAppDrawer({ isOpen, onClose, selectedLeadIds, onSuccess }: BulkWhatsAppDrawerProps) {
  const [message, setMessage] = React.useState('');
  const [selectedTemplateName, setSelectedTemplateName] = React.useState('');
  const [imageUrl, setImageUrl] = React.useState<string | null>(null);
  const [isUploading, setIsUploading] = React.useState(false);
  const [isSending, setIsSending] = React.useState(false);
  const { bulkSendWhatsApp, uploadMedia, leads } = useLeadStore();
  const { templates, fetchTemplates } = useTemplateStore();

  React.useEffect(() => {
    if (isOpen) {
      fetchTemplates();
    }
  }, [isOpen, fetchTemplates]);

  const whatsappTemplates = templates.filter(t => t.channel === 'WHATSAPP');

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const selectedLeads = leads.filter(l => selectedLeadIds.includes(l.id));

  const handleSend = async () => {
    const isTemplateOnly = selectedTemplateName !== '';
    if (!isTemplateOnly && !message.trim()) return;
    if (selectedLeadIds.length === 0) return;
    
    setIsSending(true);
    const result = await bulkSendWhatsApp(selectedLeadIds, message, imageUrl || undefined, selectedTemplateName || undefined);
    setIsSending(false);

    if (result && result.success) {
      onSuccess();
      onClose();
      setMessage('');
      setImageUrl(null);
      setSelectedTemplateName('');
    }
  };

  const handleTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const templateName = e.target.value;
    setSelectedTemplateName(templateName);
    if (templateName) {
      // Clear manual message content if a template is selected to avoid confusion
      setMessage('');
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const url = await uploadMedia(file);
    setIsUploading(false);

    if (url) {
      setImageUrl(url);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex justify-end">
      <div 
        className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md h-full bg-slate-900/90 backdrop-blur-xl border-l border-white/10 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <MessageSquare size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold">Bulk WhatsApp</h2>
              <p className="text-xs text-slate-400">Send message to {selectedLeadIds.length} leads</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/5 rounded-xl transition-colors text-slate-400 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="space-y-4">
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 flex gap-3">
              <Info className="text-blue-400 shrink-0" size={18} />
              <p className="text-sm text-blue-100/80 leading-relaxed">
                You can use <code className="bg-blue-500/20 px-1.5 py-0.5 rounded text-blue-300">{"${name}"}</code> to personalize the message for each lead.
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-400 ml-1">Use Pre-approved Template</label>
                <div className="relative">
                  <select
                    value={selectedTemplateName}
                    onChange={handleTemplateChange}
                    className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-sm outline-none focus:ring-2 ring-primary/20 transition-all appearance-none text-white"
                  >
                    <option value="" className="bg-slate-900">None (Custom Message)</option>
                    {whatsappTemplates.map(template => (
                      <option key={template.id} value={template.name} className="bg-slate-900">
                        {template.name}
                      </option>
                    ))}
                  </select>
                  <FileText size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
                {selectedTemplateName && (
                  <p className="text-xs text-amber-500 ml-1">
                    Custom messages and images are disabled when a template is selected.
                  </p>
                )}
              </div>

              <div className={`space-y-2 transition-opacity duration-300 ${selectedTemplateName ? 'opacity-50 pointer-events-none' : ''}`}>
                <label className="text-sm font-medium text-slate-400 ml-1">Standard Message Content</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type your custom message here..."
                  className="w-full h-32 bg-white/5 border border-white/10 rounded-2xl p-4 text-sm outline-none focus:ring-2 ring-primary/20 transition-all resize-none"
                  disabled={!!selectedTemplateName}
                />
              </div>
            </div>

            <div className={`space-y-2 transition-opacity duration-300 ${selectedTemplateName ? 'opacity-50 pointer-events-none' : ''}`}>
              <label className="text-sm font-medium text-slate-400 ml-1">Attach Photo (Optional)</label>
              {!imageUrl ? (
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-32 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center gap-2 hover:border-primary/50 hover:bg-primary/5 cursor-pointer transition-all group"
                >
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    accept="image/*" 
                    className="hidden" 
                  />
                  {isUploading ? (
                    <Loader2 size={24} className="text-primary animate-spin" />
                  ) : (
                    <>
                      <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform text-slate-400 group-hover:text-primary">
                        <Upload size={20} />
                      </div>
                      <p className="text-xs text-slate-500 font-medium">Click to upload photo</p>
                    </>
                  )}
                </div>
              ) : (
                <div className="relative rounded-2xl overflow-hidden border border-white/10 group aspect-video">
                  <img src={imageUrl} alt="Upload preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                    <button 
                      onClick={() => setImageUrl(null)}
                      className="p-3 bg-red-500/20 text-red-400 rounded-xl hover:bg-red-500/40 transition-colors"
                    >
                      <Trash2 size={20} />
                    </button>
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="p-3 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-colors"
                    >
                      <Upload size={20} />
                    </button>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleFileChange} 
                      accept="image/*" 
                      className="hidden" 
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 ml-1">Recipients ({selectedLeads.length})</h3>
              <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                {selectedLeads.map(lead => (
                  <div key={lead.id} className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/5 text-[11px] font-medium flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/50" />
                    {lead.name}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-white/5 bg-white/[0.02]">
          <button
            onClick={handleSend}
            disabled={isSending || (!message.trim() && !selectedTemplateName)}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold py-3 rounded-2xl transition-all shadow-lg shadow-emerald-900/20 disabled:opacity-50 disabled:grayscale"
          >
            {isSending ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>Sending Messages...</span>
              </>
            ) : (
              <>
                <Send size={18} />
                <span>Send WhatsApp Message</span>
              </>
            )}
          </button>
          <p className="text-[10px] text-center text-slate-500 mt-4 leading-relaxed">
            By sending this message, you agree to comply with WhatsApp's anti-spam policies. Message delivery may take a few moments.
          </p>
        </div>
      </div>
    </div>
  );
}
