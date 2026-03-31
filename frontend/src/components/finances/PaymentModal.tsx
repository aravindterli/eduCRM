
'use client';

import React from 'react';
import { X, CreditCard, IndianRupee, Calendar, Hash, Save, Link as LinkIcon, Copy, RefreshCw } from 'lucide-react';
import { useFinanceStore } from '@/store/useFinanceStore';
import { Toast } from '../ui/Toast';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  fee: any;
}

export const PaymentModal = ({ isOpen, onClose, fee }: PaymentModalProps) => {
  const { recordPayment, generatePaymentLink, syncPaymentStatus, getExistingLink } = useFinanceStore();
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
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-md glass rounded-3xl border-white/10 shadow-2xl animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-emerald-500/5">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
               <IndianRupee size={20} />
             </div>
             <div>
               <h2 className="text-xl font-bold">Record Payment</h2>
               <p className="text-xs text-slate-500 uppercase tracking-widest mt-1">{fee.admission?.application?.lead?.name}</p>
             </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl text-slate-400 transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">Payment Amount (₹)</label>
            <div className="relative">
              <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input 
                type="number"
                required
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: parseFloat(e.target.value) }))}
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 outline-none focus:border-emerald-500/50 transition-all text-slate-200 font-semibold"
              />
            </div>
            <p className="text-[10px] text-slate-500 italic px-1">Total Fee: ₹{fee.amount} | Remaining: ₹{fee.amount - (fee.payments?.reduce((sum: number, p: any) => sum + p.amount, 0) || 0)}</p>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">Payment Method</label>
            <div className="relative">
              <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <select 
                value={formData.method}
                onChange={(e) => setFormData(prev => ({ ...prev, method: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 outline-none focus:border-emerald-500/50 transition-all text-slate-200 appearance-none cursor-pointer"
              >
                <option value="UPI" className="bg-slate-900">UPI</option>
                <option value="BANK_TRANSFER" className="bg-slate-900">Bank Transfer</option>
                <option value="CARD" className="bg-slate-900">Credit/Debit Card</option>
                <option value="CASH" className="bg-slate-900">Cash</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">Transaction ID / Reference</label>
            <div className="relative">
              <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input 
                placeholder="Ex: TXN12345678"
                value={formData.transactionId}
                onChange={(e) => setFormData(prev => ({ ...prev, transactionId: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 outline-none focus:border-emerald-500/50 transition-all text-slate-200"
              />
            </div>
          </div>

          <div className="pt-4 flex flex-col gap-3">
            <button 
              type="submit"
              disabled={loading || formData.amount <= 0}
              className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-600/50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
            >
              {loading ? 'Processing...' : 'Record Payment Manually'}
              <Save size={20} />
            </button>
            
            <div className="relative flex items-center gap-2">
              <div className="flex-grow border-t border-white/10"></div>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">OR</span>
              <div className="flex-grow border-t border-white/10"></div>
            </div>

            {!paymentLink ? (
              <button 
                type="button"
                onClick={generateLink}
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2"
              >
                <LinkIcon size={20} />
                Generate Online Payment Link
              </button>
            ) : (
              <div className="bg-slate-900 rounded-xl p-4 border border-blue-500/30">
                <p className="text-xs font-bold text-blue-400 mb-2 uppercase tracking-widest">Share this link with the student:</p>
                <div className="flex bg-black/50 rounded-lg overflow-hidden border border-white/10">
                  <input readOnly value={paymentLink} className="bg-transparent text-sm w-full p-3 outline-none text-slate-300" />
                  <button type="button" onClick={copyToClipboard} className="p-3 bg-white/5 hover:bg-white/10 transition-colors text-slate-300">
                    <Copy size={16} />
                  </button>
                </div>
                <button 
                  type="button"
                  onClick={handleSync}
                  disabled={loading}
                  className="mt-4 w-full bg-white/5 hover:bg-white/10 text-slate-300 py-3 rounded-xl transition-all flex items-center justify-center gap-2 text-xs font-bold border border-white/5"
                >
                  <RefreshCw className={loading ? 'animate-spin' : ''} size={16} />
                  Verify & Sync Payment State
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
