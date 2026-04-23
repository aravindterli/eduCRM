'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Bell, Clock, Check, Trash2, ExternalLink, X } from 'lucide-react';
import { useNotificationStore } from '@/store/useNotificationStore';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';

export const NotificationBell = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, unreadCount, markAsRead, clearAll, removeNotification } = useNotificationStore();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = async (n: any) => {
    await markAsRead(n.id);
    // Removed automatic navigation - only marking as read now
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Icon */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all relative group"
      >
        <Bell size={20} className={`text-slate-400 group-hover:text-primary transition-colors ${unreadCount > 0 ? 'animate-bounce-short' : ''}`} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-white rounded-full text-[10px] font-bold flex items-center justify-center border-2 border-background animate-in zoom-in">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute right-0 mt-3 w-80 bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-50 overflow-hidden"
          >
            <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/5">
              <h3 className="text-sm font-bold uppercase tracking-widest text-slate-300">Notifications</h3>
              {notifications.length > 0 && (
                <button onClick={clearAll} className="text-[10px] font-bold text-slate-500 hover:text-red-400 transition-colors uppercase">
                  Clear All
                </button>
              )}
            </div>

            <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
              {notifications.length === 0 ? (
                <div className="p-10 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-3">
                    <Bell size={20} className="text-slate-600" />
                  </div>
                  <p className="text-xs text-slate-500">All caught up! No new alerts.</p>
                </div>
              ) : (
                <div className="flex flex-col">
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => handleNotificationClick(n)}
                      className={`p-4 border-b border-white/5 hover:bg-white/[0.03] transition-colors cursor-pointer relative group ${!n.isRead ? 'bg-primary/5' : ''}`}
                    >
                      {!n.isRead && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />}
                      <div className="flex gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${n.type === 'FOLLOW_UP' ? 'bg-blue-500/10 text-blue-400' : 'bg-slate-500/10 text-slate-400'}`}>
                          <Clock size={14} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-bold text-slate-200 truncate">{n.title}</h4>
                          <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">{n.message}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-[9px] font-bold text-slate-600 uppercase">
                              {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {!n.isRead && (
                              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                            )}
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeNotification(n.id);
                          }}
                          className="p-1 opacity-0 group-hover:opacity-100 hover:bg-red-500/10 hover:text-red-400 rounded-md transition-all h-fit self-center"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {notifications.length > 5 && (
              <div className="p-3 bg-white/5 text-center">
                <button className="text-[10px] font-bold text-primary uppercase tracking-widest hover:underline">
                  View Older Notifications
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
