'use client';

import React, { useState, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  Video,
  X,
  Phone,
  CheckCircle
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

interface FollowUpCalendarProps {
  tasks: any[];
  onSelectTask: (lead: any) => void;
  onCompleteTask: (id: string) => void;
}

export const FollowUpCalendar = ({ tasks = [], onSelectTask, onCompleteTask }: FollowUpCalendarProps) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  const daysInMonth = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const lastDate = new Date(year, month + 1, 0).getDate();

    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= lastDate; i++) days.push(new Date(year, month, i));
    return days;
  }, [currentDate]);

  const monthName = currentDate.toLocaleString('default', { month: 'long' });

  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));

  const getTasksForDay = (date: Date) => {
    return tasks.filter(t => {
      const taskDate = new Date(t.scheduledAt);
      return taskDate.getDate() === date.getDate() &&
        taskDate.getMonth() === date.getMonth() &&
        taskDate.getFullYear() === date.getFullYear();
    });
  };

  const dayTasks = selectedDay ? getTasksForDay(selectedDay) : [];
  const pendingTasks = dayTasks.filter(t => !t.completedAt);
  const completedTasks = dayTasks.filter(t => t.completedAt);

  return (
    <div className="glass rounded-3xl border border-white/10 overflow-hidden bg-white/[0.02] h-full flex flex-col relative">
      {/* Daily Agenda Modal */}
      <AnimatePresence>
        {selectedDay && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md"
            onClick={() => setSelectedDay(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-lg glass-premium border border-white/20 rounded-[32px] overflow-hidden shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
                <div>
                  <h3 className="text-xl font-bold">{selectedDay.toLocaleDateString('default', { day: 'numeric', month: 'long', weekday: 'long' })}</h3>
                  <p className="text-xs text-primary font-bold uppercase tracking-widest">{dayTasks.length} Total Tasks</p>
                </div>
                <button onClick={() => setSelectedDay(null)} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                  <X size={20} className="text-slate-400" />
                </button>
              </div>

              <div className="p-6 max-h-[60vh] overflow-y-auto custom-scrollbar space-y-6">
                {dayTasks.length === 0 ? (
                  <div className="py-12 text-center">
                    <CalendarIcon size={40} className="mx-auto text-slate-700 mb-4" />
                    <p className="text-slate-500 italic">No tasks scheduled for this day.</p>
                  </div>
                ) : (
                  <>
                    {/* Upcoming Section */}
                    {pendingTasks.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="text-[10px] font-bold text-primary uppercase tracking-widest ml-1">Upcoming Tasks</h4>
                        {pendingTasks.map(task => (
                          <div key={task.id} className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-primary/30 transition-all group">
                            <div className="flex justify-between items-start">
                              <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${task.meetingUrl ? 'bg-blue-500/20 text-blue-400 border-blue-500/20' : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/20'}`}>
                                  {task.meetingUrl ? <Video size={20} /> : <Phone size={20} />}
                                </div>
                                <div>
                                  <p className="text-[10px] font-bold uppercase text-slate-400">{new Date(task.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                  <h4 className="font-bold text-slate-100">{task.lead?.name || 'Unknown Lead'}</h4>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => onCompleteTask(task.id)}
                                  title="Mark as Done"
                                  className="p-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg transition-all border border-emerald-500/20"
                                >
                                  <CheckCircle size={16} />
                                </button>
                                <button
                                  onClick={() => onSelectTask(task.lead)}
                                  className="px-3 py-2 bg-primary/20 hover:bg-primary text-white text-[10px] font-bold rounded-lg transition-all border border-primary/20"
                                >
                                  DETAILS
                                </button>
                              </div>
                            </div>
                            {task.notes && (
                              <p className="mt-3 text-xs text-slate-400 leading-relaxed italic border-l-2 border-primary/30 pl-3">"{task.notes}"</p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Completed Section */}
                    {completedTasks.length > 0 && (
                      <div className="space-y-3 pt-2">
                        <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Completed</h4>
                        {completedTasks.map(task => (
                          <div key={task.id} className="p-3 rounded-xl bg-black/20 border border-white/5 opacity-60">
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-3">
                                <CheckCircle size={14} className="text-emerald-500" />
                                <div>
                                  <p className="text-[10px] font-bold text-slate-500 line-through">{task.lead?.name}</p>
                                  <p className="text-[9px] text-slate-600 italic">done at {new Date(task.completedAt).toLocaleTimeString()}</p>
                                </div>
                              </div>
                              {task.meetingUrl && <Video size={12} className="text-slate-600" />}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
              <div className="p-4 bg-black/20 text-center">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Click outside to return to Calendar</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="p-4 border-b border-white/5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary/20 text-primary">
            <CalendarIcon size={18} />
          </div>
          <div>
            <h2 className="text-lg font-bold leading-tight">{monthName} {currentDate.getFullYear()}</h2>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{tasks.length} Task{tasks.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={prevMonth} className="p-2 hover:bg-white/5 rounded-xl border border-white/5 transition-all text-slate-400">
            <ChevronLeft size={20} />
          </button>
          <button onClick={nextMonth} className="p-2 hover:bg-white/5 rounded-xl border border-white/5 transition-all text-slate-400">
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Grid Headers */}
      <div className="grid grid-cols-7 border-b border-white/5 bg-white/[0.01] shrink-0">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="py-3 text-center text-[10px] font-bold uppercase tracking-widest text-slate-500">
            {day}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 flex-1 overflow-y-auto custom-scrollbar">
        {daysInMonth.map((date, index) => {
          const dayTasks = date ? getTasksForDay(date) : [];
          const isToday = date && date.toDateString() === new Date().toDateString();

          return (
            <div 
              key={index} 
              onClick={() => date && setSelectedDay(date)}
              className={`min-h-[65px] p-1 border-b border-r border-white/5 transition-colors hover:bg-white/[0.03] cursor-pointer group ${!date ? 'bg-black/10' : ''}`}
            >
              {date && (
                <>
                  <div className="flex justify-between items-center mb-1 px-0.5">
                    <span className={`text-[10px] font-bold group-hover:scale-110 transition-transform ${isToday ? 'bg-primary text-white w-4 h-4 flex items-center justify-center rounded-md shadow-lg' : 'text-slate-500'}`}>
                      {date.getDate()}
                    </span>
                    {dayTasks.length > 0 && (
                      <div className={`w-1 h-1 rounded-full animate-pulse ${dayTasks.some(t => t.meetingUrl) ? 'bg-blue-500' : 'bg-emerald-500'}`} />
                    )}
                  </div>
                  <div className="space-y-1">
                    {dayTasks.slice(0, 3).map(task => (
                      <div
                        key={task.id}
                        className={`p-1 rounded-lg text-[9px] truncate border flex items-center gap-1 ${new Date(task.scheduledAt) < new Date() && !task.completedAt
                            ? 'bg-red-500/10 border-red-500/20 text-red-300'
                            : task.meetingUrl
                              ? 'bg-blue-500/10 border-blue-500/20 text-blue-400'
                              : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                          }`}
                      >
                        {task.meetingUrl ? <Video size={8} /> : <Phone size={8} />}
                        <span className="font-bold shrink-0">{new Date(task.scheduledAt).getHours() % 12 || 12}:{(new Date(task.scheduledAt).getMinutes() < 10 ? '0' : '') + (new Date(task.scheduledAt).getMinutes())}</span>
                        <span className="truncate">{task.lead?.name}</span>
                      </div>
                    ))}
                    {dayTasks.length > 3 && (
                      <p className="text-[8px] text-slate-500 font-bold text-center mt-0.5">+ {dayTasks.length - 3} more</p>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
