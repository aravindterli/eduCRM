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
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md h-full bg-white border-l border-black/10 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 rounded-l-[16px] overflow-hidden text-[#1A1A1A]">
        <div className="p-6 border-b border-black/10 flex items-center justify-between bg-gray-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[8px] bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center">
              <MessageSquare size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#1A1A1A]">Bulk WhatsApp</h2>
              <p className="text-xs text-slate-500">Send message to {selectedLeadIds.length} leads</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-[8px] transition-colors text-slate-500 hover:text-slate-800"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-white">
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-100 rounded-[12px] p-4 flex gap-3 shadow-sm">
              <Info className="text-blue-600 shrink-0" size={18} />
              <p className="text-sm text-blue-700 leading-relaxed font-medium">
                You can use <code className="bg-blue-100 px-1.5 py-0.5 rounded text-blue-800 font-bold">{"${name}"}</code> to personalize the message for each lead.
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-600 ml-1">Use Pre-approved Template</label>
                <div className="relative">
                  <select
                    value={selectedTemplateName}
                    onChange={handleTemplateChange}
                    className="w-full h-12 bg-gray-50 border border-black/10 rounded-[8px] px-4 text-sm outline-none focus:ring-2 focus:ring-black/10 transition-all appearance-none text-[#1A1A1A] font-medium"
                  >
                    <option value="" className="bg-white text-[#1A1A1A]">None (Custom Message)</option>
                    {whatsappTemplates.map(template => (
                      <option key={template.id} value={template.name} className="bg-white text-[#1A1A1A]">
                        {template.name}
                      </option>
                    ))}
                  </select>
                  <FileText size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
                {selectedTemplateName && (
                  <p className="text-xs text-amber-600 ml-1 mt-2 font-bold">
                    Custom text is disabled for templates, but you can still attach an Image if your template requires a Media Header!
                  </p>
                )}
              </div>

              <div className={`space-y-2 transition-opacity duration-300 ${selectedTemplateName ? 'opacity-50 pointer-events-none' : ''}`}>
                <label className="text-sm font-bold text-slate-600 ml-1">Standard Message Content</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type your custom message here..."
                  className="w-full h-32 bg-gray-50 border border-black/10 rounded-[8px] p-4 text-sm outline-none focus:ring-2 focus:ring-black/10 transition-all resize-none text-[#1A1A1A] font-medium"
                  disabled={!!selectedTemplateName}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-600 ml-1">Attach Photo/Media (For Custom or Template Headers)</label>
              {!imageUrl ? (
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-32 border-2 border-dashed border-black/10 rounded-[12px] flex flex-col items-center justify-center gap-2 hover:border-black/20 hover:bg-gray-50/50 transition-all group cursor-pointer bg-gray-50/20"
                >
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    accept="image/*" 
                    className="hidden" 
                  />
                  {isUploading ? (
                    <Loader2 size={24} className="text-[#1A1A1A] animate-spin" />
                  ) : (
                    <>
                      <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center border border-black/5 group-hover:scale-110 transition-transform text-slate-400 group-hover:text-[#1A1A1A] shadow-sm">
                        <Upload size={20} />
                      </div>
                      <p className="text-xs text-slate-500 font-medium">Click to upload photo</p>
                    </>
                  )}
                </div>
              ) : (
                <div className="relative rounded-[12px] overflow-hidden border border-black/10 group aspect-video shadow-sm">
                  <img src={imageUrl} alt="Upload preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                    <button 
                      onClick={() => setImageUrl(null)}
                      className="p-3 bg-rose-50 text-rose-600 rounded-[8px] hover:bg-rose-100 transition-colors border border-rose-200"
                    >
                      <Trash2 size={20} />
                    </button>
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="p-3 bg-white text-[#1A1A1A] rounded-[8px] hover:bg-gray-100 transition-colors border border-black/10"
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

            <div className="bg-gray-50 rounded-[12px] p-4 border border-black/5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 ml-1">Recipients ({selectedLeads.length})</h3>
              <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                {selectedLeads.map(lead => (
                  <div key={lead.id} className="px-3 py-1.5 rounded-[8px] bg-white border border-black/10 text-[11px] font-medium flex items-center gap-2 shadow-sm text-[#1A1A1A]">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    {lead.name}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-black/10 bg-gray-50">
          <button
            onClick={handleSend}
            disabled={isSending || (!message.trim() && !selectedTemplateName)}
            className="w-full flex items-center justify-center gap-2 bg-[#1A1A1A] hover:bg-black/90 text-[#F5F1EB] font-bold py-3 rounded-[8px] transition-all shadow-sm disabled:opacity-50 disabled:grayscale cursor-pointer"
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
          <p className="text-[10px] text-center text-slate-500 mt-4 leading-relaxed font-medium">
            By sending this message, you agree to comply with WhatsApp's anti-spam policies. Message delivery may take a few moments.
          </p>
        </div>
      </div>
    </div>
  );
}
