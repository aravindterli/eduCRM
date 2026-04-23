'use client';

import React, { useState, useMemo } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Clock, 
  User, 
  Phone,
  Video,
  CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface FollowUpCalendarProps {
  tasks: any[];
  onSelectTask: (lead: any) => void;
  onCompleteTask: (id: string) => void;
}

export const FollowUpCalendar = ({ tasks, onSelectTask, onCompleteTask }: FollowUpCalendarProps) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const daysInMonth = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const lastDate = new Date(year, month + 1, 0).getDate();
    
    const days = [];
    // padding for start of month
    for (let i = 0; i < firstDay; i++) {
        days.push(null);
    }
    // actual days
    for (let i = 1; i <= lastDate; i++) {
        days.push(new Date(year, month, i));
    }
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

  return (
    <div className="glass rounded-3xl border border-white/10 overflow-hidden bg-white/[0.02]">
      {/* Calendar Header */}
      <div className="p-6 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-primary/20 text-primary">
                <CalendarIcon size={24} />
            </div>
            <div>
                <h2 className="text-xl font-bold">{monthName} {currentDate.getFullYear()}</h2>
                <p className="text-xs text-slate-400 font-medium uppercase tracking-widest">{tasks.length} Pending Tasks</p>
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

      {/* Grid Header */}
      <div className="grid grid-cols-7 border-b border-white/5 bg-white/[0.01]">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="py-4 text-center text-[10px] font-bold uppercase tracking-widest text-slate-500">
                {day}
            </div>
        ))}
      </div>

      {/* Grid Body */}
      <div className="grid grid-cols-7">
        {daysInMonth.map((date, index) => {
            const dayTasks = date ? getTasksForDay(date) : [];
            const isToday = date && date.toDateString() === new Date().toDateString();
            
            return (
                <div 
                    key={index} 
                    className={`min-h-[140px] p-2 border-b border-r border-white/5 transition-colors hover:bg-white/[0.01] ${!date ? 'bg-black/10' : ''}`}
                >
                    {date && (
                        <>
                            <div className="flex justify-between items-center mb-2 px-1">
                                <span className={`text-xs font-bold ${isToday ? 'bg-primary text-white w-6 h-6 flex items-center justify-center rounded-lg shadow-lg shadow-primary/20' : 'text-slate-400'}`}>
                                    {date.getDate()}
                                </span>
                            </div>
                            <div className="space-y-1.5">
                                {dayTasks.map(task => (
                                    <motion.div
                                        key={task.id}
                                        initial={{ opacity: 0, y: 5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        onClick={() => onSelectTask(task.lead)}
                                        className="p-2 rounded-xl bg-primary/10 border border-primary/20 cursor-pointer group hover:bg-primary/20 transition-all"
                                    >
                                        <p className="text-[10px] font-bold text-primary truncate flex items-center gap-1.5">
                                            <Clock size={10} />
                                            {new Date(task.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                        <p className="text-[11px] font-semibold text-slate-200 mt-0.5 truncate leading-tight">
                                            {task.lead?.name}
                                        </p>
                                        {task.meetingUrl && (
                                            <div className="mt-1.5 flex items-center gap-1 text-[8px] font-bold uppercase text-emerald-400">
                                                <Video size={10} />
                                                Virtual
                                            </div>
                                        )}
                                    </motion.div>
                                ))}
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
