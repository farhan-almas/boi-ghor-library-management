import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookMarked, CheckCircle2, Clock, Wallet, Search, BookOpen, Receipt } from 'lucide-react';
import DashboardLayout from '../layouts/DashboardLayout';
import TopNav from '../components/TopNav';
import { StatCard, StatusBadge, BookCover, Loading, EmptyState } from '../components/Common';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/dashboard').then(setData).catch((e) => setError(e.message));
  }, []);

  if (error) return <DashboardLayout><p className="text-red-500">{error}</p></DashboardLayout>;
  if (!data) return <DashboardLayout><Loading /></DashboardLayout>;

  const { stats, current_reading, recently_read, upcoming_due } = data;

  return (
    <DashboardLayout>
      <TopNav title={`Welcome back, ${user?.name?.split(' ')[0]}`} />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={BookMarked} label="Books Currently Issued" value={stats.books_issued} color="brand" />
        <StatCard icon={CheckCircle2} label="Books Read" value={stats.books_read} color="emerald" />
        <StatCard icon={Clock} label="Books Due Soon" value={stats.due_soon} color="amber" />
        <StatCard icon={Wallet} label="Outstanding Fine" value={`৳${stats.outstanding_fine}`} color="red" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Current Reading */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-800">Current Reading</h2>
              <Link to="/issued" className="text-xs text-brand-600 font-medium hover:underline">Show more</Link>
            </div>
            {current_reading.length === 0 ? (
              <EmptyState message="You're not currently reading anything." />
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                {current_reading.map((b) => (
                  <div key={b.history_id} className="flex gap-3 p-3 rounded-xl bg-gray-50">
                    <BookCover title={b.title} color={b.cover_color} image={b.cover_image} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-gray-800 truncate">{b.title}</p>
                      <p className="text-xs text-gray-500">{b.author_name} · {b.department_name}</p>
                      <div className="w-full h-1.5 bg-gray-200 rounded-full mt-2">
                        <div className="h-1.5 bg-brand-600 rounded-full" style={{ width: `${b.progress_percent}%` }} />
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-[11px] text-gray-400">
                          {b.due_date ? `Due ${new Date(b.due_date).toLocaleDateString()}` : ''}
                        </span>
                        <Link to={`/books/${b.book_id}`} className="text-[11px] font-semibold text-brand-600 hover:underline">
                          Continue →
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recently Read */}
          <div className="card p-5">
            <h2 className="font-semibold text-gray-800 mb-4">Recently Read</h2>
            {recently_read.length === 0 ? (
              <EmptyState message="No completed books yet." />
            ) : (
              <div className="flex gap-4 overflow-x-auto pb-1">
                {recently_read.map((b) => (
                  <div key={b.history_id} className="flex flex-col items-center w-20 shrink-0 text-center">
                    <BookCover title={b.title} color={b.cover_color} image={b.cover_image} size="sm" />
                    <p className="text-[11px] font-medium text-gray-700 mt-2 truncate w-full">{b.title}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="card p-5">
            <h2 className="font-semibold text-gray-800 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Link to="/books" className="flex flex-col items-center gap-2 p-4 rounded-xl bg-brand-50 hover:bg-brand-100 text-brand-700 text-xs font-medium">
                <BookOpen size={18} /> Browse Books
              </Link>
              <Link to="/books" className="flex flex-col items-center gap-2 p-4 rounded-xl bg-brand-50 hover:bg-brand-100 text-brand-700 text-xs font-medium">
                <Search size={18} /> Search Books
              </Link>
              <Link to="/issued" className="flex flex-col items-center gap-2 p-4 rounded-xl bg-brand-50 hover:bg-brand-100 text-brand-700 text-xs font-medium">
                <BookMarked size={18} /> Issued Books
              </Link>
              <Link to="/billing" className="flex flex-col items-center gap-2 p-4 rounded-xl bg-brand-50 hover:bg-brand-100 text-brand-700 text-xs font-medium">
                <Receipt size={18} /> Pay Fine
              </Link>
            </div>
          </div>
        </div>

        {/* Upcoming Due Dates */}
        <div className="card p-5 h-fit">
          <h2 className="font-semibold text-gray-800 mb-4">Upcoming Due Dates</h2>
          {upcoming_due.length === 0 ? (
            <EmptyState message="Nothing due right now." />
          ) : (
            <div className="space-y-3">
              {upcoming_due.map((b) => (
                <div key={b.issue_id} className="flex items-center justify-between border-b border-gray-100 pb-3 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{b.title}</p>
                    <p className="text-xs text-gray-400">{new Date(b.due_date).toLocaleDateString()}</p>
                  </div>
                  <StatusBadge status={b.display_status} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
