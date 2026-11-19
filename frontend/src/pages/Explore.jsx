import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Shuffle } from 'lucide-react';
import DashboardLayout from '../layouts/DashboardLayout';
import TopNav from '../components/TopNav';
import { BookCover, Loading, EmptyState } from '../components/Common';
import { api } from '../services/api';

function Row({ title, books, keyName = 'book_id' }) {
  return (
    <div className="card p-5">
      <h2 className="font-semibold text-gray-800 mb-4">{title}</h2>
      {!books || books.length === 0 ? (
        <EmptyState message="Nothing here yet." />
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-1">
          {books.map((b) => (
            <Link to={`/books/${b[keyName]}`} key={b[keyName]} className="w-32 shrink-0">
              <BookCover title={b.title} color={b.cover_color} image={b.cover_image} size="md" />
              <p className="text-xs font-medium text-gray-700 mt-2 truncate">{b.title}</p>
              <p className="text-[11px] text-gray-400 truncate">{b.author_name}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Explore() {
  const [data, setData] = useState(null);
  const [random, setRandom] = useState(null);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);

  useEffect(() => { api.get('/books/explore').then(setData).catch((e) => setError(e.message)); }, []);

  const surpriseMe = () => api.get('/books/random').then(setRandom).catch((e) => setError(e.message));
  const searchBooks = (e) => {
    e.preventDefault();
    if (!query.trim()) { setSearchResults(null); return; }
    api.get(`/books?search=${encodeURIComponent(query.trim())}`).then(setSearchResults).catch((e) => setError(e.message));
  };

  return (
    <DashboardLayout>
      <TopNav title="Explore" />

      {error && <p className="notice-error">{error}</p>}

      <div className="card mb-6 border-brand-300 bg-brand-50/70 p-5">
        <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-brand-700"><Search size={16} /> Explore the catalogue</div>
        <form onSubmit={searchBooks} className="flex flex-col gap-3 sm:flex-row">
          <div className="flex-1"><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search books, authors, ISBN, or department" className="input h-12 px-4" /></div>
          <button className="btn-primary h-12 px-6">Search</button>
        </form>
        {searchResults && <div className="mt-5"><div className="mb-3 flex items-center justify-between"><h2 className="font-semibold text-gray-800">Search results</h2><button type="button" onClick={() => { setSearchResults(null); setQuery(''); }} className="text-xs font-medium text-brand-700">Clear</button></div>{searchResults.length === 0 ? <EmptyState message="No books match your search." /> : <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{searchResults.slice(0, 8).map((book) => <Link to={`/books/${book.book_id}`} key={book.book_id} className="rounded-xl border border-slate-200 bg-white p-3 hover:border-brand-300"><div className="flex gap-3"><BookCover title={book.title} color={book.cover_color} image={book.cover_image} size="sm" /><div className="min-w-0"><p className="truncate text-sm font-semibold text-gray-800">{book.title}</p><p className="truncate text-xs text-gray-500">{book.author_name}</p><p className="mt-1 text-[11px] text-brand-700">{book.department_name} · {book.available_copies} available</p></div></div></Link>)}</div>}</div>}
      </div>

      {!data ? <Loading /> : (
        <div className="space-y-6">
          <Row title="Recommended For You" books={data.recommended} />
          <Row title="Based on Recent Reads" books={data.based_on_recent} />
          <Row title="Currently Popular" books={data.popular} />
          <Row title="New Arrivals" books={data.new_arrivals} />

          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-800">Random Pick</h2>
              <button onClick={surpriseMe} className="btn-secondary flex items-center gap-2 text-xs">
                <Shuffle size={14} /> Surprise Me
              </button>
            </div>
            {random ? (
              <Link to={`/books/${random.book_id}`} className="flex gap-4 items-center">
                <BookCover title={random.title} color={random.cover_color} image={random.cover_image} size="lg" />
                <div>
                  <p className="font-semibold text-gray-800">{random.title}</p>
                  <p className="text-sm text-gray-500">{random.author_name} · {random.department_name}</p>
                </div>
              </Link>
            ) : (
              <EmptyState message="Click 'Surprise Me' to discover a random book." />
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
