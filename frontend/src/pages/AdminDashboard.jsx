import { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import TopNav from '../components/TopNav';
import { Loading, EmptyState, BookCover, StatusBadge } from '../components/Common';
import { Library, Users, BookMarked, AlertTriangle, Wallet, Plus, Edit, Archive, MapPin, Eye, UserRound } from 'lucide-react';
import { api } from '../services/api';

const blank = { title: '', isbn: '', author_id: '', department_id: '', publisher: '', publication_year: '', description: '', total_copies: 1, available_copies: 1, rating: 4, cover_color: '#6366f1', cover_image: '', location_code: '' };
const issueStatus = { active: 'Active', overdue: 'Overdue', returned: 'Returned' };
const formatDate = (value) => value ? new Date(value).toLocaleDateString() : '—';

function IssueMiniTable({ issues, empty = 'No issue records for this selection.' }) {
  if (!issues.length) return <p className="px-3 py-4 text-xs text-gray-500">{empty}</p>;
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table className="w-full min-w-[680px] text-xs">
        <thead className="bg-slate-50 text-left text-gray-500"><tr><th className="p-3">Book</th><th className="p-3">Borrower</th><th className="p-3">Issued</th><th className="p-3">Return by</th><th className="p-3">Returned</th><th className="p-3">Status</th></tr></thead>
        <tbody>{issues.map((issue) => <tr key={issue.issue_id} className="border-t border-slate-100"><td className="p-3 font-medium text-gray-800">{issue.title}</td><td className="p-3">{issue.user_name}</td><td className="p-3">{formatDate(issue.issue_date)}</td><td className="p-3 font-medium text-brand-700">{formatDate(issue.due_date)}</td><td className="p-3">{formatDate(issue.return_date)}</td><td className="p-3"><StatusBadge status={issueStatus[issue.status] || issue.status} /></td></tr>)}</tbody>
      </table>
    </div>
  );
}

function BookIssueDetails({ issues }) {
  if (!issues.length) return <p className="px-3 py-4 text-xs text-gray-500">No one has issued this book yet.</p>;
  return <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white"><table className="w-full min-w-[650px] text-xs"><thead className="bg-slate-50 text-left text-gray-500"><tr><th className="p-3">Borrower</th><th className="p-3">Issued on</th><th className="p-3">Return by</th><th className="p-3">Returned on</th><th className="p-3">Status</th></tr></thead><tbody>{issues.map((issue) => <tr key={issue.issue_id} className="border-t border-slate-100"><td className="p-3"><p className="font-medium text-gray-800">{issue.user_name}</p><p className="text-gray-400">{issue.user_email}</p></td><td className="p-3">{formatDate(issue.issue_date)}</td><td className="p-3 font-medium text-brand-700">{formatDate(issue.due_date)}</td><td className="p-3">{formatDate(issue.return_date)}</td><td className="p-3"><StatusBadge status={issueStatus[issue.status] || issue.status} /></td></tr>)}</tbody></table></div>;
}

export default function AdminDashboard() {
  const [tab, setTab] = useState('books');
  const [data, setData] = useState(null);
  const [books, setBooks] = useState([]);
  const [deps, setDeps] = useState([]);
  const [authors, setAuthors] = useState([]);
  const [users, setUsers] = useState([]);
  const [notices, setNotices] = useState([]);
  const [issues, setIssues] = useState([]);
  const [reservationQueues, setReservationQueues] = useState([]);
  const [form, setForm] = useState(blank);
  const [editing, setEditing] = useState(null);
  const [deptForm, setDeptForm] = useState({ department_name: '', description: '' });
  const [noticeForm, setNoticeForm] = useState({ title: '', description: '', category: 'general' });
  const [issueQuery, setIssueQuery] = useState('');
  const [expandedBook, setExpandedBook] = useState(null);
  const [expandedIssueBook, setExpandedIssueBook] = useState(null);
  const [expandedUser, setExpandedUser] = useState(null);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  const load = async () => {
    try {
      const [a, b, d, au, u, n, i, q] = await Promise.all([
        api.get('/analytics/admin'), api.get('/books'), api.get('/departments'), api.get('/admin/authors'),
        api.get('/admin/users'), api.get('/notices'), api.get('/issues?all=true'), api.get('/reservations/admin/queues'),
      ]);
      setData(a); setBooks(b); setDeps(d); setAuthors(au); setUsers(u); setNotices(n); setIssues(i); setReservationQueues(q);
    } catch (e) { setErr(e.message); }
  };
  useEffect(() => { load(); }, []);

  const issuesByBook = useMemo(() => issues.reduce((acc, issue) => { (acc[issue.book_id] ||= []).push(issue); return acc; }, {}), [issues]);
  const issuesByUser = useMemo(() => issues.reduce((acc, issue) => { (acc[issue.user_id] ||= []).push(issue); return acc; }, {}), [issues]);
  const filteredIssues = useMemo(() => {
    const query = issueQuery.trim().toLowerCase();
    if (!query) return issues;
    return issues.filter((i) => [i.title, i.user_name, i.author_name, i.status].some((v) => String(v || '').toLowerCase().includes(query)));
  }, [issues, issueQuery]);

  const handleCoverFile = (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    if (!file.type.startsWith('image/')) { setErr('Please choose an image file.'); return; }
    if (file.size > 2 * 1024 * 1024) { setErr('Cover image must be 2MB or smaller.'); return; }
    const reader = new FileReader(); reader.onload = () => setForm((f) => ({ ...f, cover_image: reader.result })); reader.readAsDataURL(file);
  };
  const saveBook = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...form, author_id: Number(form.author_id), department_id: Number(form.department_id), total_copies: Number(form.total_copies), available_copies: Number(form.available_copies), publication_year: form.publication_year ? Number(form.publication_year) : null };
      if (editing) await api.put(`/books/${editing}`, payload); else await api.post('/books', payload);
      setMsg(editing ? 'Book updated' : 'Book added'); setForm(blank); setEditing(null); load();
    } catch (e) { setErr(e.message); }
  };
  const editBook = (book) => { setEditing(book.book_id); setForm({ ...book }); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const archive = async (id) => {
    if (!confirm('Archive this book? It will no longer appear to students.')) return;
    try { await api.del(`/books/${id}`); setMsg('Book archived'); load(); } catch (e) { setErr(e.message); }
  };
  const saveDept = async (e) => { e.preventDefault(); try { if (deptForm.department_id) await api.put(`/departments/${deptForm.department_id}`, deptForm); else await api.post('/departments', deptForm); setDeptForm({ department_name: '', description: '' }); load(); } catch (e) { setErr(e.message); } };
  const saveNotice = async (e) => { e.preventDefault(); try { await api.post('/notices', noticeForm); setNoticeForm({ title: '', description: '', category: 'general' }); load(); } catch (e) { setErr(e.message); } };
  const changeRole = async (user) => { try { await api.put(`/admin/users/${user.user_id}/role`, { role: user.role === 'admin' ? 'student' : 'admin' }); load(); } catch (e) { setErr(e.message); } };

  if (!data) return <DashboardLayout><TopNav title="Admin Dashboard" /><Loading /></DashboardLayout>;
  const tabs = [['books', 'Books'], ['issues', 'Issue Tracking'], ['queues', 'Waiting Lines'], ['departments', 'Departments'], ['users', 'Users'], ['notices', 'Notices']];

  return <DashboardLayout>
    <TopNav title="Admin Dashboard" />
    {(msg || err) && <div className={`mb-4 rounded-lg p-3 text-sm ${err ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-700'}`}>{err || msg}<button className="float-right" onClick={() => { setErr(''); setMsg(''); }}>×</button></div>}
    <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-5">{[['Total Books', data.totals.total_books, Library], ['Users', data.totals.total_users, Users], ['Issued', data.totals.currently_issued, BookMarked], ['Overdue', data.totals.overdue_books, AlertTriangle], ['Fines', `৳${data.totals.total_fines}`, Wallet]].map(([label, value, Icon]) => <div className="card p-4" key={label}><Icon size={18} className="mb-2 text-brand-600" /><b className="text-xl">{value}</b><p className="text-xs text-gray-500">{label}</p></div>)}</div>
    <div className="mb-5 flex gap-1 overflow-x-auto border-b border-gray-200">{tabs.map(([key, label]) => <button key={key} onClick={() => setTab(key)} className={`whitespace-nowrap px-4 py-2 text-sm font-medium ${tab === key ? 'border-b-2 border-brand-600 text-brand-600' : 'text-gray-500'}`}>{label}{key === 'issues' && <span className="ml-2 rounded-full bg-brand-50 px-2 py-0.5 text-xs text-brand-700">{issues.filter((i) => i.status !== 'returned').length}</span>}</button>)}</div>

    {tab === 'books' && <>
      <form onSubmit={saveBook} className="card mb-6 p-5"><div className="flex justify-between"><h2 className="font-semibold">{editing ? 'Edit Book' : 'Add Book'}</h2>{editing && <button type="button" onClick={() => { setEditing(null); setForm(blank); }} className="text-xs text-gray-500">Cancel</button>}</div><div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">{[['title', 'Title'], ['isbn', 'ISBN'], ['publisher', 'Publisher'], ['publication_year', 'Publication Year'], ['total_copies', 'Total Copies'], ['available_copies', 'Available Copies'], ['location_code', 'Shelf Location (e.g. 3-B-15)']].map(([key, label]) => <input key={key} value={form[key] ?? ''} onChange={(e) => setForm({ ...form, [key]: e.target.value })} placeholder={label} className="input" />)}
        <input className="input" type="url" value={typeof form.cover_image === 'string' && form.cover_image.startsWith('data:') ? '' : (form.cover_image || '')} onChange={(e) => setForm({ ...form, cover_image: e.target.value })} placeholder="Cover image URL (optional)" />
        <label className="cursor-pointer rounded-xl border border-dashed border-brand-300 bg-brand-50 px-3 py-2 text-sm font-medium text-brand-700 hover:bg-brand-100">Upload book cover<input className="hidden" type="file" accept="image/*" onChange={handleCoverFile} /></label>
        <select className="input" value={form.author_id} onChange={(e) => setForm({ ...form, author_id: e.target.value })}><option value="">Author</option>{authors.map((a) => <option value={a.author_id} key={a.author_id}>{a.author_name}</option>)}</select>
        <select className="input" value={form.department_id} onChange={(e) => setForm({ ...form, department_id: e.target.value })}><option value="">Department</option>{deps.map((d) => <option value={d.department_id} key={d.department_id}>{d.department_name}</option>)}</select>
        <textarea className="input md:col-span-2 lg:col-span-3" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description" />
      </div><button className="btn-primary mt-4 flex items-center gap-2"><Plus size={15} />{editing ? 'Save Changes' : 'Add Book'}</button></form>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{books.map((book) => { const bookIssues = issuesByBook[book.book_id] || []; return <div className="card p-4" key={book.book_id}><div className="flex gap-3"><BookCover title={book.title} color={book.cover_color} image={book.cover_image} /><div className="min-w-0 flex-1"><b className="text-sm">{book.title}</b><p className="text-xs text-gray-500">{book.author_name}</p><p className="mt-1 flex items-center gap-1 text-xs font-semibold text-brand-700"><MapPin size={12} />{book.location_code || 'Location pending'}</p><p className="mt-1 text-xs">{book.available_copies}/{book.total_copies} available</p><p className="mt-1 text-xs text-slate-500">{bookIssues.filter((i) => i.status !== 'returned').length} currently issued</p><div className="mt-3 flex flex-wrap gap-2"><button onClick={() => editBook(book)} className="btn-secondary flex items-center gap-1 text-xs"><Edit size={12} />Edit</button><button onClick={() => setExpandedBook(expandedBook === book.book_id ? null : book.book_id)} className="btn-secondary flex items-center gap-1 text-xs"><Eye size={12} />{expandedBook === book.book_id ? 'Hide' : 'Issue details'}</button><button onClick={() => archive(book.book_id)} className="flex items-center gap-1 text-xs text-red-500"><Archive size={12} />Archive</button></div></div></div>{expandedBook === book.book_id && <div className="mt-4 border-t border-slate-100 pt-3"><p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Borrow history</p><IssueMiniTable issues={bookIssues} empty="No one has issued this book yet." /></div>}</div>; })}</div>
    </>}

    {tab === 'issues' && <div className="space-y-5"><div className="card p-5"><div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between"><div><h2 className="font-semibold text-gray-800">All issue records</h2><p className="mt-1 text-xs text-gray-500">See who has each book, issue dates, return-by dates, returned dates, and status.</p></div><input className="input md:max-w-sm" value={issueQuery} onChange={(e) => setIssueQuery(e.target.value)} placeholder="Filter by book, borrower, or status" /></div><div className="mt-4"><IssueMiniTable issues={filteredIssues} empty="No issue records match your filter." /></div></div><div className="grid gap-5 lg:grid-cols-2"><div className="card p-5"><h3 className="mb-3 flex items-center gap-2 font-semibold"><BookMarked size={17} className="text-brand-600" />Issues by book</h3><p className="mb-3 text-xs text-gray-500">Select a book to see exactly who issued it and its issue and return dates.</p><div className="space-y-2">{books.map((book) => { const bookIssues = issuesByBook[book.book_id] || []; const isExpanded = expandedIssueBook === book.book_id; return <div key={book.book_id} className="rounded-xl border border-slate-100"><button onClick={() => setExpandedIssueBook(isExpanded ? null : book.book_id)} className="flex w-full items-center justify-between p-3 text-left hover:border-brand-200 hover:bg-brand-50"><span className="truncate text-sm font-medium">{book.title}</span><span className="text-xs text-gray-500">{bookIssues.filter((i) => i.status !== 'returned').length} active {isExpanded ? '· Hide details' : '· View details'}</span></button>{isExpanded && <div className="border-t border-slate-100 p-3"><BookIssueDetails issues={bookIssues} /></div>}</div>; })}</div></div><div className="card p-5"><h3 className="mb-3 flex items-center gap-2 font-semibold"><UserRound size={17} className="text-brand-600" />Issues by user</h3><div className="space-y-2">{users.map((user) => <button key={user.user_id} onClick={() => { setExpandedUser(user.user_id); setTab('users'); }} className="flex w-full items-center justify-between rounded-xl border border-slate-100 p-3 text-left hover:border-brand-200 hover:bg-brand-50"><span className="truncate text-sm font-medium">{user.name}<span className="ml-2 text-xs text-gray-400">{user.email}</span></span><span className="text-xs text-gray-500">{(issuesByUser[user.user_id] || []).filter((i) => i.status !== 'returned').length} active</span></button>)}</div></div></div></div>}

    {tab === 'queues' && <div className="card overflow-x-auto p-5"><div className="mb-4"><h2 className="font-semibold text-gray-800">Reservation waiting lines</h2><p className="mt-1 text-xs text-gray-500">See who is waiting for each unavailable book. Returning a book automatically marks the first queued borrower as ready.</p></div>{reservationQueues.length === 0 ? <EmptyState message="No active reservation queues." /> : <table className="w-full min-w-[760px] text-sm"><thead><tr className="border-b text-left text-xs text-gray-400"><th className="p-3">Book</th><th className="p-3">Position</th><th className="p-3">Borrower</th><th className="p-3">Email</th><th className="p-3">Status</th><th className="p-3">Reserved</th></tr></thead><tbody>{reservationQueues.map((queue) => <tr key={queue.reservation_id} className="border-b border-slate-100"><td className="p-3 font-medium text-gray-800">{queue.title}<span className="ml-2 text-xs text-gray-400">{queue.available_copies} available</span></td><td className="p-3 font-semibold text-brand-700">#{queue.status === 'ready' ? 'Ready' : queue.queue_position}</td><td className="p-3">{queue.user_name}</td><td className="p-3 text-gray-500">{queue.email}</td><td className="p-3"><StatusBadge status={queue.status === 'ready' ? 'Ready' : 'Queued'} /></td><td className="p-3 text-gray-500">{formatDate(queue.created_at)}</td></tr>)}</tbody></table>}</div>}

    {tab === 'departments' && <div className="grid gap-5 lg:grid-cols-2"><form onSubmit={saveDept} className="card space-y-3 p-5"><h2 className="font-semibold">Manage Department</h2><input className="input" placeholder="Department name" value={deptForm.department_name} onChange={(e) => setDeptForm({ ...deptForm, department_name: e.target.value })} /><textarea className="input" placeholder="Description" value={deptForm.description} onChange={(e) => setDeptForm({ ...deptForm, description: e.target.value })} /><button className="btn-primary">Save Department</button></form><div className="card divide-y">{deps.map((d) => <div className="flex justify-between p-4" key={d.department_id}><div><b className="text-sm">{d.department_name}</b><p className="text-xs text-gray-500">{d.book_count} books</p></div><button onClick={() => setDeptForm(d)} className="text-xs text-brand-600">Edit</button></div>)}</div></div>}

    {tab === 'users' && <div className="card overflow-x-auto"><div className="border-b border-slate-100 p-5"><h2 className="font-semibold">Users and their issued books</h2><p className="mt-1 text-xs text-gray-500">Open a user to see every book they have issued, including the return-by date and current status.</p></div><table className="w-full min-w-[850px] text-sm"><thead><tr className="border-b text-left text-gray-400"><th className="p-4">Name</th><th className="p-4">Email</th><th className="p-4">Role</th><th className="p-4">Active books</th><th className="p-4">All records</th><th className="p-4">Action</th></tr></thead><tbody>{users.map((user) => { const userIssues = issuesByUser[user.user_id] || []; return <tr className="border-b align-top" key={user.user_id}><td className="p-4 font-medium">{user.name}</td><td className="p-4">{user.email}</td><td className="p-4"><StatusBadge status={user.role} /></td><td className="p-4 font-semibold text-brand-700">{userIssues.filter((i) => i.status !== 'returned').length}</td><td className="p-4">{userIssues.length}</td><td className="p-4"><div className="flex gap-2"><button onClick={() => setExpandedUser(expandedUser === user.user_id ? null : user.user_id)} className="btn-secondary flex items-center gap-1 text-xs"><Eye size={12} />{expandedUser === user.user_id ? 'Hide books' : 'View books'}</button><button onClick={() => changeRole(user)} className="text-xs text-brand-600">{user.role === 'admin' ? 'Make Student' : 'Make Admin'}</button></div>{expandedUser === user.user_id && <div className="mt-3 min-w-[650px]"><IssueMiniTable issues={userIssues} empty="This user has not issued any books." /></div>}</td></tr>; })}</tbody></table></div>}

    {tab === 'notices' && <div className="grid gap-5 lg:grid-cols-2"><form onSubmit={saveNotice} className="card space-y-3 p-5"><h2 className="font-semibold">Publish Notice</h2><input className="input" placeholder="Title" value={noticeForm.title} onChange={(e) => setNoticeForm({ ...noticeForm, title: e.target.value })} /><textarea className="input" placeholder="Description" value={noticeForm.description} onChange={(e) => setNoticeForm({ ...noticeForm, description: e.target.value })} /><select className="input" value={noticeForm.category} onChange={(e) => setNoticeForm({ ...noticeForm, category: e.target.value })}><option>general</option><option>important</option><option>events</option></select><button className="btn-primary">Publish</button></form><div className="card divide-y">{notices.map((notice) => <div className="p-4" key={notice.notice_id}><b className="text-sm">{notice.title}</b><p className="mt-1 text-xs text-gray-500">{notice.description}</p></div>)}</div></div>}
  </DashboardLayout>;
}
