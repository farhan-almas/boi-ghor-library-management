import { useEffect, useState } from 'react';
import { Megaphone } from 'lucide-react';
import DashboardLayout from '../layouts/DashboardLayout';
import TopNav from '../components/TopNav';
import { Loading, EmptyState } from '../components/Common';
import { api } from '../services/api';

const categoryStyle = {
  important: 'bg-red-100 text-red-700',
  general: 'bg-brand-100 text-brand-700',
  events: 'bg-amber-100 text-amber-700',
};

const tabs = [
  { key: 'all', label: 'All' },
  { key: 'important', label: 'Important' },
  { key: 'general', label: 'General' },
  { key: 'events', label: 'Events' },
];

export default function Notices() {
  const [notices, setNotices] = useState(null);
  const [filter, setFilter] = useState('all');
  const [error, setError] = useState('');

  useEffect(() => {
    setNotices(null);
    api.get(`/notices?category=${filter}`).then(setNotices).catch((e) => { setError(e.message); setNotices([]); });
  }, [filter]);

  return (
    <DashboardLayout>
      <TopNav title="Notices" />
      {error && <p className="notice-error">{error}</p>}

      <div className="flex gap-2 mb-5">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setFilter(t.key)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              filter === t.key ? 'bg-brand-600 text-white' : 'bg-white text-gray-500 border border-gray-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {!notices ? <Loading /> : notices.length === 0 ? <EmptyState message="No notices in this category." /> : (
        <div className="grid md:grid-cols-2 gap-4">
          {notices.map((n) => (
            <div key={n.notice_id} className="card p-5">
              <div className="flex items-start justify-between mb-2">
                <div className="w-9 h-9 rounded-xl bg-brand-100 text-brand-600 flex items-center justify-center">
                  <Megaphone size={16} />
                </div>
                <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full capitalize ${categoryStyle[n.category]}`}>
                  {n.category}
                </span>
              </div>
              <h3 className="font-semibold text-gray-800">{n.title}</h3>
              <p className="text-sm text-gray-500 mt-1">{n.description}</p>
              <p className="text-xs text-gray-400 mt-3">{new Date(n.created_at).toLocaleDateString()}</p>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
