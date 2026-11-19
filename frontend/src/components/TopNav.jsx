import { useEffect, useState } from 'react';
import { Bell, Clock3, AlertTriangle } from 'lucide-react';
import { api } from '../services/api';

export default function TopNav({ title }) {
  const [reminders, setReminders] = useState([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    api.get('/reservations/reminders').then(setReminders).catch(() => setReminders([]));
  }, []);

  return (
    <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
      <div>
        <p className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-brand-700">
          <img src="/boi-ghor-logo.png" alt="BOI GHOR" className="h-6 w-6 rounded-md object-cover shadow-sm" />
          Boi Ghor
        </p>
        <h1 className="page-title text-2xl font-bold text-slate-900 md:text-3xl">{title}</h1>
      </div>
      <div className="flex items-center gap-3">
        <div className="relative">
          <button type="button" aria-label="Notifications" onClick={() => setOpen((value) => !value)} className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:border-brand-200 hover:text-brand-700">
            <Bell size={17} />
            {reminders.length > 0 && <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">{reminders.length}</span>}
          </button>
          {open && <div className="absolute right-0 z-30 mt-2 w-80 rounded-2xl border border-slate-200 bg-white p-3 shadow-xl">
            <div className="mb-2 flex items-center justify-between"><p className="font-semibold text-gray-800">Library reminders</p><span className="text-[11px] text-gray-400">Next 3 days</span></div>
            {reminders.length === 0 ? <p className="py-4 text-center text-xs text-gray-500">You have no urgent due-date reminders.</p> : reminders.map((reminder) => <div key={`${reminder.type}-${reminder.issue_id}`} className="mb-2 flex gap-2 rounded-xl bg-brand-50 p-2.5 last:mb-0">{reminder.type === 'overdue' ? <AlertTriangle size={16} className="mt-0.5 shrink-0 text-red-600" /> : <Clock3 size={16} className="mt-0.5 shrink-0 text-amber-600" />}<div><p className="text-xs font-semibold text-gray-800">{reminder.type === 'overdue' ? 'Overdue' : reminder.type === 'reservation_ready' ? 'Reserved copy ready' : `Due in ${reminder.days_remaining} day${Number(reminder.days_remaining) === 1 ? '' : 's'}`}</p><p className="text-xs text-gray-600">{reminder.title}</p><p className="mt-0.5 text-[11px] text-gray-400">{reminder.type === 'reservation_ready' ? 'Visit the book page to issue it.' : `Return by ${new Date(reminder.due_date).toLocaleDateString()}`}</p></div></div>)}
          </div>}
        </div>
      </div>
    </div>
  );
}
