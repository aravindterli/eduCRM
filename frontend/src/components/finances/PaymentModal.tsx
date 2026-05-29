'use client';

import React from 'react';
import { X, CreditCard, IndianRupee, Calendar, Hash, Save, Link as LinkIcon, Copy, RefreshCw } from 'lucide-react';
import { useFinanceStore } from '@/store/useFinanceStore';
import { useAuthStore } from '@/store/auth.store';
import { Toast } from '../ui/Toast';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  fee: any;
}

export const PaymentModal = ({ isOpen, onClose, fee }: PaymentModalProps) => {
  const { recordPayment, generatePaymentLink, syncPaymentStatus, getExistingLink } = useFinanceStore();
  const { user } = useAuthStore();
  const sector = user?.sector || 'GENERIC';
  const shareLabel = sector === 'REAL_ESTATE' ? 'ShareLinkWithClient' : sector === 'HEALTHCARE' ? 'ShareLinkWithPatient' : 'ShareLinkWithStudent';

  const [loading, setLoading] = React.useState(false);
  const [paymentLink, setPaymentLink] = React.useState('');
  const [formData, setFormData] = React.useState({
    amount: 0,
    method: 'UPI',
    transactionId: ''
  });
  const [toast, setToast] = React.useState({ isVisible: false, message: '', type: 'success' as 'success' | 'error' });

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ isVisible: true, message, type });
  };

  React.useEffect(() => {
    if (fee) {
      const remaining = fee.amount - (fee.payments?.reduce((sum: number, p: any) => sum + p.amount, 0) || 0);
      setFormData(prev => ({ ...prev, amount: remaining }));
      
      // Auto-check for existing link
      const checkExisting = async () => {
        const link = await getExistingLink(fee.id);
        if (link) {
          setPaymentLink(link);
          showToast('Found an active payment link for this student.', 'success');
        }
      };
      checkExisting();
    }
  }, [fee, getExistingLink]);

  if (!isOpen || !fee) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const success = await recordPayment({
      feeId: fee.id,
      ...formData
    });
    setLoading(false);
    if (success) onClose();
  };

  const generateLink = async () => {
    setLoading(true);
    const { link, error, isNew } = await generatePaymentLink(fee.id);
    if (link) {
      setPaymentLink(link);
      if (isNew === false) {
        showToast('Using existing active link for this student.', 'success');
      } else {
        showToast('Payment link generated successfully!', 'success');
      }
    } else if (error) {
      showToast(error, 'error');
    }
    setLoading(false);
  };

  const handleSync = async () => {
    setLoading(true);
    const result = await syncPaymentStatus(fee.id);
    if (result.updated) {
      showToast('Payment verified! Status updated to COMPLETED.', 'success');
      onClose();
    } else {
      showToast(result.message || 'No payment detected yet.', 'error');
    }
    setLoading(false);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(paymentLink);
    showToast('Link copied to clipboard!', 'success');
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-md bg-white border border-black/10 shadow-2xl animate-in fade-in zoom-in-95 duration-200 overflow-hidden flex flex-col rounded-[16px] text-[#1A1A1A]">
        <div className="p-6 border-b border-black/10 flex justify-between items-center bg-gray-50">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-[8px] bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center">
               <IndianRupee size={20} />
             </div>
             <div>
               <h2 className="text-xl font-bold text-[#1A1A1A]">RecordPayment</h2>
               <p className="text-xs text-slate-400 font-black tracking-wider leading-none mt-1">{fee.admission?.application?.lead?.name}</p>
             </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-[8px] text-slate-400 hover:text-[#1A1A1A] transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">PaymentAmount</label>
            <div className="relative">
              <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="number"
                required
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: parseFloat(e.target.value) }))}
                className="w-full bg-gray-50 border border-black/10 rounded-[8px] pl-12 pr-4 py-3 outline-none focus:border-black/20 text-[#1A1A1A] font-semibold"
              />
            </div>
            <p className="text-[10px] text-slate-400 italic px-1">TotalFee: ₹{fee.amount} | Remaining: ₹{fee.amount - (fee.payments?.reduce((sum: number, p: any) => sum + p.amount, 0) || 0)}</p>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">PaymentMethod</label>
            <div className="relative">
              <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <select 
                value={formData.method}
                onChange={(e) => setFormData(prev => ({ ...prev, method: e.target.value }))}
                className="w-full bg-gray-50 border border-black/10 rounded-[8px] pl-12 pr-4 py-3 outline-none focus:border-black/20 text-[#1A1A1A] appearance-none cursor-pointer"
              >
                <option value="UPI" className="text-[#1A1A1A] bg-white">UPI</option>
                <option value="BANK_TRANSFER" className="text-[#1A1A1A] bg-white">BankTransfer</option>
                <option value="CARD" className="text-[#1A1A1A] bg-white">CreditDebitCard</option>
                <option value="CASH" className="text-[#1A1A1A] bg-white">Cash</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">TransactionIdReference</label>
            <div className="relative">
              <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                placeholder="Ex: TXN12345678"
                value={formData.transactionId}
                onChange={(e) => setFormData(prev => ({ ...prev, transactionId: e.target.value }))}
                className="w-full bg-gray-50 border border-black/10 rounded-[8px] pl-12 pr-4 py-3 outline-none focus:border-black/20 text-[#1A1A1A]"
              />
            </div>
          </div>

          <div className="pt-4 flex flex-col gap-3">
            <button 
              type="submit"
              disabled={loading || formData.amount <= 0}
              className="w-full bg-[#1A1A1A] hover:bg-[#1A1A1A]/90 disabled:bg-[#1A1A1A]/50 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-[8px] transition-all shadow-sm flex items-center justify-center gap-2"
            >
              {loading ? 'Processing...' : 'RecordPaymentManually'}
              <Save size={18} />
            </button>
            
            <div className="relative flex items-center gap-2">
              <div className="flex-grow border-t border-black/10"></div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Or</span>
              <div className="flex-grow border-t border-black/10"></div>
            </div>

            {!paymentLink ? (
              <button 
                type="button"
                onClick={generateLink}
                disabled={loading}
                className="w-full bg-blue-50 border border-blue-100 text-blue-600 hover:bg-blue-100/50 text-blue font-bold py-3.5 rounded-[8px] transition-all flex items-center justify-center gap-2"
              >
                <LinkIcon size={18} />
                GenerateOnlinePaymentLink
              </button>
            ) : (
              <div className="bg-[#F5F1EB]/40 border border-black/10 rounded-[12px] p-4 text-[#1A1A1A]">
                <p className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-widest">{shareLabel}:</p>
                <div className="flex bg-white rounded-[8px] overflow-hidden border border-black/10">
                  <input readOnly value={paymentLink} className="bg-transparent text-sm w-full p-3 outline-none text-[#1A1A1A]" />
                  <button type="button" onClick={copyToClipboard} className="p-3 bg-gray-50 hover:bg-gray-100 transition-colors text-slate-500 border-l border-black/10 flex items-center justify-center">
                    <Copy size={16} />
                  </button>
                </div>
                <button 
                  type="button"
                  onClick={handleSync}
                  disabled={loading}
                  className="mt-4 w-full bg-white hover:bg-gray-50 text-slate-700 py-3 rounded-[8px] border border-black/10 transition-all flex items-center justify-center gap-2 text-xs font-bold"
                >
                  <RefreshCw className={loading ? 'animate-spin' : ''} size={16} />
                  VerifySyncPaymentState
                </button>
              </div>
            )}
          </div>
        </form>
      </div>

      <Toast 
        isVisible={toast.isVisible} 
        message={toast.message} 
        type={toast.type} 
        onClose={() => setToast(prev => ({ ...prev, isVisible: false }))} 
      />
    </div>
  );
};
