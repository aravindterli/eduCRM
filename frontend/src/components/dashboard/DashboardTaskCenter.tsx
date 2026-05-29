'use client';

import React from 'react';
import { CheckSquare, Square, Plus, Trash2, Calendar, ClipboardList } from 'lucide-react';

interface Task {
  id: string;
  title: string;
  completed: boolean;
  priority: 'high' | 'medium' | 'low';
}

export const DashboardTaskCenter = () => {
  const [tasks, setTasks] = React.useState<Task[]>([]);
  const [input, setInput] = React.useState('');
  const [priority, setPriority] = React.useState<'high' | 'medium' | 'low'>('medium');

  // load tasks from localstorage on mount
  React.useEffect(() => {
    const saved = localStorage.getItem('centracrm_dashboard_tasks');
    if (saved) {
      try {
        setTasks(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    } else {
      // default initial tasks for counselors / admins
      const initialTasks: Task[] = [
        { id: '1', title: 'FollowUpWithHotLeadsFromWebinar', completed: false, priority: 'high' },
        { id: '2', title: 'ReviewTeamWeeklyReports', completed: false, priority: 'medium' },
        { id: '3', title: 'UpdateCounselingApplicationPipeline', completed: true, priority: 'low' },
      ];
      setTasks(initialTasks);
      localStorage.setItem('centracrm_dashboard_tasks', JSON.stringify(initialTasks));
    }
  }, []);

  // save tasks to localstorage helper
  const saveTasks = (newTasks: Task[]) => {
    setTasks(newTasks);
    localStorage.setItem('centracrm_dashboard_tasks', JSON.stringify(newTasks));
  };

  const addTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const newTask: Task = {
      id: Date.now().toString(),
      title: input.trim(),
      completed: false,
      priority,
    };

    const updated = [newTask, ...tasks];
    saveTasks(updated);
    setInput('');
  };

  const toggleTask = (id: string) => {
    const updated = tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
    saveTasks(updated);
  };

  const deleteTask = (id: string) => {
    const updated = tasks.filter(t => t.id !== id);
    saveTasks(updated);
  };

  const activeCount = tasks.filter(t => !t.completed).length;

  return (
    <div className="bg-white border border-black/10 rounded-[16px] p-6 flex flex-col h-full min-h-[480px] hover:border-black/20 shadow-sm transition-all duration-300">
      {/* header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <ClipboardList className="text-[#1A1A1A] animate-pulse" size={20} />
          <div>
            <h3 className="font-bold text-sm text-[#1A1A1A] tracking-tight">MyTaskPlanner</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">OrganiseYourWorkday</p>
          </div>
        </div>
        {activeCount > 0 ? (
          <span className="text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-[8px]">
            {activeCount} Pending
          </span>
        ) : (
          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-[8px]">
            All Clear
          </span>
        )}
      </div>

      {/* task addition form */}
      <form onSubmit={addTask} className="space-y-3 mb-6">
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Add what you need to do..."
            className="w-full bg-slate-50 border border-black/10 rounded-[8px] py-2.5 pl-4 pr-12 text-xs outline-none focus:border-black transition-all text-[#1A1A1A] font-semibold placeholder-slate-400"
          />
          <button
            type="submit"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-[6px] bg-black hover:bg-black/90 text-white flex items-center justify-center transition-all scale-90 hover:scale-95"
          >
            <Plus size={16} />
          </button>
        </div>

        {/* priority selector */}
        <div className="flex items-center gap-2 justify-end">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">priority:</span>
          {(['high', 'medium', 'low'] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPriority(p)}
              className={`text-[10px] font-bold px-2.5 py-0.5 rounded-[6px] border transition-all uppercase tracking-wider ${priority === p
                  ? p === 'high'
                    ? 'bg-rose-50 border-rose-200 text-rose-600 shadow-sm'
                    : p === 'medium'
                      ? 'bg-amber-50 border-amber-200 text-amber-600 shadow-sm'
                      : 'bg-blue-50 border-blue-200 text-blue-600 shadow-sm'
                  : 'bg-slate-50 border-slate-100 text-slate-400 hover:bg-slate-100'
                }`}
            >
              {p}
            </button>
          ))}
        </div>
      </form>

      {/* task list container */}
      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 max-h-[300px] pr-1">
        {tasks.length > 0 ? (
          tasks.map((task) => (
            <div
              key={task.id}
              className={`p-3 rounded-[8px] border transition-all duration-300 flex items-center justify-between gap-3 group/item ${task.completed
                  ? 'bg-slate-50/30 border-black/5 opacity-60'
                  : 'bg-slate-50/50 border-black/5 hover:bg-slate-50 hover:border-black/10'
                }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <button
                  onClick={() => toggleTask(task.id)}
                  className={`shrink-0 transition-transform active:scale-95 ${task.completed ? 'text-emerald-500' : 'text-slate-400 hover:text-slate-600'
                    }`}
                >
                  {task.completed ? <CheckSquare size={16} /> : <Square size={16} />}
                </button>
                <span
                  className={`text-xs font-semibold text-slate-700 truncate transition-all ${task.completed ? 'line-through text-slate-400' : ''
                    }`}
                >
                  {task.title}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {/* priority badge */}
                <span
                  className={`text-[9px] font-bold px-2 py-0.5 rounded-[6px] uppercase tracking-wider leading-none shrink-0 ${task.priority === 'high'
                      ? 'bg-rose-50 text-rose-600 border border-rose-100'
                      : task.priority === 'medium'
                        ? 'bg-amber-50 text-amber-600 border border-amber-100'
                        : 'bg-blue-50 text-blue-600 border border-blue-100'
                    }`}
                >
                  {task.priority}
                </span>

                <button
                  onClick={() => deleteTask(task.id)}
                  className="opacity-0 group-hover/item:opacity-100 text-slate-400 hover:text-rose-500 transition-all shrink-0 duration-200"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="py-12 flex flex-col items-center justify-center text-center space-y-2">
            <div className="w-10 h-10 rounded-[8px] bg-slate-50 border border-black/5 flex items-center justify-center text-slate-400">
              <Calendar size={18} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">AllTasksCaughtUp</p>
              <p className="text-[9px] text-slate-400 font-semibold mt-0.5">AddTasksToStayOrganized</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
