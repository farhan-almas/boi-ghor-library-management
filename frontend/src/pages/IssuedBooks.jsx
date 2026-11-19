import { useEffect, useState } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import TopNav from '../components/TopNav';
import { StatCard, StatusBadge, Loading, EmptyState } from '../components/Common';
import { BookMarked, Clock, AlertTriangle, Wallet, Star } from 'lucide-react';
import { api } from '../services/api';

const statusLabel = { active: 'Active', overdue: 'Overdue', returned: 'Returned' };

export default function IssuedBooks() {
  const [issues, setIssues] = useState(null);
  const [error, setError] = useState('');
  const [ratingIssueId, setRatingIssueId] = useState(null);
  const [ratingValues, setRatingValues] = useState({});
  const [ratingReviews, setRatingReviews] = useState({});

  const load = () => api.get('/issues').then(setIssues).catch((e) => setError(e.message));
  useEffect(() => { load(); }, []);

  const handleReturn = async (id) => {
    try {
      await api.put(`/issues/${id}/return`);
      setRatingIssueId(id);
      load();
    } catch (e) {
      setError(e.message);
    }
  };

  const submitRating = async (issueId) => {
    try {
      await api.post(`/issues/${issueId}/rating`, { rating: ratingValues[issueId], review: ratingReviews[issueId] || '' });
      setRatingIssueId(null);
      load();
    } catch (e) { setError(e.message); }
  };

  if (!issues) return <DashboardLayout><TopNav title="Issued Books" /><Loading /></DashboardLayout>;

  const active = issues.filter((i) => i.status !== 'returned');
  const dueSoon = active.filter((i) => i.remaining_days >= 0 && i.remaining_days <= 3).length;
  const overdue = active.filter((i) => i.status === 'overdue').length;
  const totalFine = issues.reduce((sum, i) => sum + parseFloat(i.fine_amount || 0), 0);

  return (
    <DashboardLayout>
      <TopNav title="Issued Books" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={BookMarked} label="Total Issued" value={active.length} color="brand" />
        <StatCard icon={Clock} label="Due Soon" value={dueSoon} color="amber" />
        <StatCard icon={AlertTriangle} label="Overdue" value={overdue} color="red" />
        <StatCard icon={Wallet} label="Total Fine" value={`৳${totalFine.toFixed(2)}`} color="red" />
      </div>

      {error && <p className="bg-red-50 text-red-600 text-sm rounded-lg px-3 py-2 mb-4">{error}</p>}

      <div className="card overflow-x-auto">
        {issues.length === 0 ? (
          <EmptyState message="You haven't issued any books yet." />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-400 border-b border-gray-100">
                <th className="p-4 font-medium">Book</th>
                <th className="p-4 font-medium">Issue Date</th>
                <th className="p-4 font-medium">Due Date</th>
                <th className="p-4 font-medium">Remaining Days</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium">Fine</th>
                <th className="p-4 font-medium">Action / Rating</th>
              </tr>
            </thead>
            <tbody>
              {issues.map((i) => (
                <tr key={i.issue_id} className="border-b border-gray-50 last:border-0">
                  <td className="p-4">
                    <p className="font-medium text-gray-800">{i.title}</p>
                    <p className="text-xs text-gray-400">{i.author_name}</p>
                  </td>
                  <td className="p-4 text-gray-600">{new Date(i.issue_date).toLocaleDateString()}</td>
                  <td className="p-4 text-gray-600">{new Date(i.due_date).toLocaleDateString()}</td>
                  <td className="p-4 text-gray-600">{i.status === 'returned' ? '—' : i.remaining_days}</td>
                  <td className="p-4"><StatusBadge status={statusLabel[i.status]} /></td>
                  <td className="p-4 text-gray-600">৳{parseFloat(i.fine_amount).toFixed(2)}</td>
                  <td className="p-4">
                    {i.status !== 'returned' ? (
                      <button onClick={() => handleReturn(i.issue_id)} className="btn-secondary text-xs">
                        Return Book
                      </button>
                    ) : i.user_rating ? (
                      <span className="text-xs font-medium text-amber-700">Rated {i.user_rating}/5</span>
                    ) : (
                      <div className="min-w-[190px]">
                        <p className="mb-1 text-xs text-gray-500">Returned {new Date(i.return_date).toLocaleDateString()} · Rate this book</p>
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((value) => <button key={value} type="button" aria-label={`Rate ${value} stars`} onClick={() => setRatingValues((current) => ({ ...current, [i.issue_id]: value }))} className="p-0.5"><Star size={16} className={value <= (ratingValues[i.issue_id] || 0) ? 'fill-amber-400 text-amber-400' : 'text-gray-300'} /></button>)}
                          <button type="button" disabled={!ratingValues[i.issue_id]} onClick={() => submitRating(i.issue_id)} className="ml-2 text-xs font-semibold text-brand-700 disabled:text-gray-300">Save</button>
                        </div>
                        {ratingIssueId === i.issue_id && <input value={ratingReviews[i.issue_id] || ''} onChange={(e) => setRatingReviews((current) => ({ ...current, [i.issue_id]: e.target.value }))} placeholder="Optional note" className="input mt-2 py-1.5 text-xs" />}
                        {ratingIssueId !== i.issue_id && <button type="button" onClick={() => setRatingIssueId(i.issue_id)} className="mt-1 text-[11px] text-gray-400">Add a note</button>}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </DashboardLayout>
  );
}
