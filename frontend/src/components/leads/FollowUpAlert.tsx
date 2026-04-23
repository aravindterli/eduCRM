'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, 
  X, 
  PhoneCall, 
  MessageCircle, 
  Video, 
  Clock, 
  ArrowRight,
  ChevronRight
} from 'lucide-react';

interface FollowUpAlertProps {
  task: any;
  onClose: () => void;
  onCall: (phone: string) => void;
  onWhatsApp: (phone: string) => void;
}

export const FollowUpAlert = ({ task, onClose, onCall, onWhatsApp }: FollowUpAlertProps) => {
  if (!task) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="fixed bottom-6 right-6 z-[200] w-[380px]"
      >
        <div className="glass-premium border border-primary/30 p-1 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden">
          <div className="bg-black/40 rounded-[22px] overflow-hidden">
            {/* Header / Banner */}
            <div className="h-1.5 w-full bg-gradient-to-r from-primary via-purple-500 to-pink-500 animate-gradient" />
            
            <div className="p-5">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary border border-primary/20">
                      <Bell size={24} className="animate-bounce" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-black flex items-center justify-center">
                      <div className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-100 italic tracking-tight">Active Reminder</h3>
                    <p className="text-[10px] uppercase font-bold tracking-tighter text-primary">Scheduled for NOW</p>
                  </div>
                </div>
                <button 
                    onClick={onClose}
                    className="p-1.5 hover:bg-white/10 rounded-xl text-slate-400 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Lead Info */}
              <div className="bg-white/5 rounded-2xl p-4 border border-white/5 mb-4 group hover:border-primary/20 transition-all">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-pink-500/20 text-pink-400 flex items-center justify-center font-bold text-xs">
                    {task.lead?.name?.[0] || 'L'}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-200">{task.lead?.name}</h4>
                    <p className="text-[10px] text-slate-500 font-medium">Source: {task.lead?.leadSource}</p>
                  </div>
                </div>
                {task.notes && (
                  <p className="text-xs text-slate-400 italic bg-black/20 p-2 rounded-lg border border-white/5 line-clamp-2">
                    "{task.notes}"
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => onCall(task.lead?.phone)}
                  className="flex items-center justify-center gap-2 py-3 bg-primary hover:bg-primary/90 text-white rounded-xl text-xs font-bold transition-all shadow-[0_10px_20px_rgba(var(--primary-rgb),0.2)]"
                >
                  <PhoneCall size={14} />
                  Voice Call
                </button>
                <button 
                  onClick={() => onWhatsApp(task.lead?.phone)}
                  className="flex items-center justify-center gap-2 py-3 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl text-xs font-bold transition-all shadow-[0_10px_20px_rgba(16,185,129,0.2)]"
                >
                  <MessageCircle size={14} />
                  WhatsApp
                </button>
              </div>

              <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-500">
                  <Clock size={12} />
                  <span className="text-[10px] font-bold uppercase">{new Date(task.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                {task.meetingUrl && (
                  <a 
                    href={task.meetingUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
                  >
                    <Video size={14} />
                    Meeting Link
                    <ChevronRight size={14} />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
