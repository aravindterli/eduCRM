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
    <div className="bg-white border border-black/10 rounded-[16px] overflow-hidden shadow-sm h-full flex flex-col relative text-[#1A1A1A]">
      {/* Daily Agenda Modal */}
      <AnimatePresence>
        {selectedDay && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
            onClick={() => setSelectedDay(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-lg bg-white border border-black/10 rounded-[16px] overflow-hidden shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-6 border-b border-black/10 flex justify-between items-center bg-gray-50">
                <div>
                  <h3 className="text-xl font-bold text-[#1A1A1A]">{selectedDay.toLocaleDateString('default', { day: 'numeric', month: 'long', weekday: 'long' })}</h3>
                  <p className="text-xs text-blue-600 font-bold uppercase tracking-widest">{dayTasks.length} Total Tasks</p>
                </div>
                <button onClick={() => setSelectedDay(null)} className="p-2 hover:bg-gray-100 rounded-[8px] transition-colors text-slate-400 hover:text-slate-700">
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 max-h-[60vh] overflow-y-auto custom-scrollbar space-y-6 bg-white">
                {dayTasks.length === 0 ? (
                  <div className="py-12 text-center bg-white">
                    <CalendarIcon size={40} className="mx-auto text-slate-300 mb-4" />
                    <p className="text-slate-500 italic">No tasks scheduled for this day.</p>
                  </div>
                ) : (
                  <>
                    {/* Upcoming Section */}
                    {pendingTasks.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="text-[10px] font-bold text-blue-600 uppercase tracking-widest ml-1">Upcoming Tasks</h4>
                        {pendingTasks.map(task => (
                          <div key={task.id} className="p-4 rounded-[12px] bg-white border border-black/10 hover:border-black/20 transition-all group shadow-sm">
                            <div className="flex justify-between items-start">
                              <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-[8px] flex items-center justify-center border ${task.meetingUrl ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                                  {task.meetingUrl ? <Video size={20} /> : <Phone size={20} />}
                                </div>
                                <div>
                                  <p className="text-[10px] font-bold uppercase text-slate-400">{new Date(task.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                  <h4 className="font-bold text-[#1A1A1A]">{task.lead?.name || 'Unknown Lead'}</h4>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => onCompleteTask(task.id)}
                                  title="Mark as Done"
                                  className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-[8px] transition-all border border-emerald-200"
                                >
                                  <CheckCircle size={16} />
                                </button>
                                <button
                                  onClick={() => onSelectTask(task.lead)}
                                  className="px-3 py-2 bg-[#1A1A1A] hover:bg-black/90 text-[#F5F1EB] text-[10px] font-bold rounded-[8px] transition-all border border-transparent shadow-sm"
                                >
                                  DETAILS
                                </button>
                              </div>
                            </div>
                            {task.notes && (
                              <p className="mt-3 text-xs text-slate-600 leading-relaxed italic border-l-2 border-black/30 pl-3 bg-gray-50/50 p-2 rounded-r-[8px]">"{task.notes}"</p>
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
                          <div key={task.id} className="p-3 rounded-[12px] bg-gray-50 border border-black/5 opacity-60">
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-3">
                                <CheckCircle size={14} className="text-emerald-600" />
                                <div>
                                  <p className="text-[10px] font-bold text-slate-500 line-through">{task.lead?.name}</p>
                                  <p className="text-[9px] text-slate-600 italic">done at {new Date(task.completedAt).toLocaleTimeString()}</p>
                                </div>
                              </div>
                              {task.meetingUrl && <Video size={12} className="text-slate-400" />}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
              <div className="p-4 bg-gray-50 border-t border-black/5 text-center">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Click outside to return to Calendar</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="p-4 border-b border-black/10 bg-gray-50/30 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-[8px] bg-white border border-black/10 text-[#1A1A1A] shadow-sm">
            <CalendarIcon size={18} />
          </div>
          <div>
            <h2 className="text-lg font-bold leading-tight text-[#1A1A1A]">{monthName} {currentDate.getFullYear()}</h2>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{tasks.length} Task{tasks.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-[8px] border border-black/10 bg-white transition-all text-slate-600 shadow-sm">
            <ChevronLeft size={20} />
          </button>
          <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-[8px] border border-black/10 bg-white transition-all text-slate-600 shadow-sm">
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Grid Headers */}
      <div className="grid grid-cols-7 border-b border-black/10 bg-gray-50/50 shrink-0">
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
              className={`min-h-[65px] p-1 border-b border-r border-black/5 transition-colors hover:bg-[#F5F1EB]/30 cursor-pointer group ${!date ? 'bg-gray-50/40' : 'bg-white'}`}
            >
              {date && (
                <>
                  <div className="flex justify-between items-center mb-1 px-0.5">
                    <span className={`text-[10px] font-bold group-hover:scale-110 transition-transform ${isToday ? 'bg-[#1A1A1A] text-[#F5F1EB] w-5 h-5 flex items-center justify-center rounded-[6px] shadow-sm font-bold' : 'text-slate-500'}`}>
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
                        className={`p-1 rounded-[6px] text-[9px] truncate border flex items-center gap-1 ${new Date(task.scheduledAt) < new Date() && !task.completedAt
                            ? 'bg-rose-50 border-rose-100 text-rose-700'
                            : task.meetingUrl
                              ? 'bg-blue-50 border-blue-100 text-blue-700'
                              : 'bg-emerald-50 border-emerald-100 text-emerald-700'
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
