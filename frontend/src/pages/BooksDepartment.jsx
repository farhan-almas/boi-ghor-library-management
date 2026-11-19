import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Library, Star, ArrowLeft, MapPin, Search } from 'lucide-react';
import DashboardLayout from '../layouts/DashboardLayout';
import TopNav from '../components/TopNav';
import { BookCover, Loading, EmptyState } from '../components/Common';
import { api } from '../services/api';

export default function BooksDepartment() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [departments, setDepartments] = useState([]);
  const [books, setBooks] = useState(null);
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    department: '',
    availability: '',
    sort: 'title_asc',
  });
  const [activeDept, setActiveDept] = useState(null);
  const [error, setError] = useState('');
  const isLocator = searchParams.get('mode') === 'locator';

  useEffect(() => {
    api.get('/departments').then(setDepartments).catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.search) params.set('search', filters.search);
    if (filters.department) params.set('department', filters.department);
    if (filters.availability) params.set('availability', filters.availability);
    if (filters.sort) params.set('sort', filters.sort);

    if (filters.department || filters.search) {
      api.get(`/books?${params.toString()}`).then(setBooks).catch((e) => { setError(e.message); setBooks([]); });
    } else {
      setBooks(null);
    }
  }, [filters]);

  const openDepartment = (dept) => {
    setActiveDept(dept);
    setFilters((f) => ({ ...f, department: dept.department_id }));
  };

  return (
    <DashboardLayout>
      <TopNav title={isLocator ? 'Find in Library' : 'Books Department'} />
      {error && <p className="notice-error">{error}</p>}

      <div className="card mb-6 overflow-hidden border-brand-300 bg-brand-50/70 p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-brand-700">
              <MapPin size={18} />
              <span className="text-xs font-bold uppercase tracking-[0.18em]">Find in Library</span>
            </div>
            <h2 className="page-title text-2xl font-bold text-gray-800">Find a book’s exact library location</h2>
            <p className="mt-1 max-w-2xl text-sm text-gray-600">Search by title, author, ISBN, department, or shelf code. See the exact floor, almirah, shelf, and live availability in seconds.</p>
          </div>
          <div className="w-full md:max-w-lg">
            <label className="sr-only" htmlFor="library-locator-search">Search the library catalogue</label>
            <div>
              <input
                id="library-locator-search"
                value={filters.search}
                onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
                placeholder="Search title, author, ISBN, or 3-B-15"
                className="input h-12 px-4"
              />
            </div>
          </div>
        </div>
      </div>

      {!filters.department && !filters.search ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {departments.map((d) => (
            <div key={d.department_id} className="card p-5 flex flex-col gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-100 text-brand-600 flex items-center justify-center">
                <Library size={18} />
              </div>
              <div>
                <p className="font-semibold text-gray-800">{d.department_name}</p>
                <p className="text-xs text-gray-500 mt-0.5">{d.book_count} books available</p>
              </div>
              <button onClick={() => openDepartment(d)} className="btn-secondary text-center mt-1">
                View Books
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div>
          <button
            onClick={() => { setActiveDept(null); setSearchParams({}); setFilters({ search: '', department: '', availability: '', sort: 'title_asc' }); }}
            className="flex items-center gap-1 text-sm text-brand-600 font-medium mb-4"
          >
            <ArrowLeft size={15} /> All Departments
          </button>

          {/* Filters */}
          <div className="flex flex-wrap gap-3 mb-5">
            <select
              value={filters.availability}
              onChange={(e) => setFilters((f) => ({ ...f, availability: e.target.value }))}
              className="px-3 py-2 rounded-xl border border-gray-200 text-sm"
            >
              <option value="">All availability</option>
              <option value="available">Available</option>
              <option value="unavailable">Unavailable</option>
            </select>
            <select
              value={filters.sort}
              onChange={(e) => setFilters((f) => ({ ...f, sort: e.target.value }))}
              className="px-3 py-2 rounded-xl border border-gray-200 text-sm"
            >
              <option value="title_asc">Title A–Z</option>
              <option value="title_desc">Title Z–A</option>
              <option value="rating_desc">Highest Rated</option>
              <option value="year_desc">Newest</option>
            </select>
          </div>

          {!books ? <Loading /> : books.length === 0 ? <EmptyState message="No books match your filters." /> : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {books.map((b) => (
                <Link to={`/books/${b.book_id}`} key={b.book_id} className="card p-4 flex gap-3 hover:shadow-md transition-shadow">
                  <BookCover title={b.title} color={b.cover_color} image={b.cover_image} />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm text-gray-800 truncate">{b.title}</p>
                    <p className="text-xs text-gray-500 truncate">{b.author_name}</p>
              <p className="text-[11px] text-gray-400 mt-1">{b.department_name} · {b.publication_year}</p>
              <p className="mt-2 flex items-center gap-1 text-[11px] font-semibold text-brand-700"><MapPin size={12} /> {b.location_code || 'Location pending'}</p>
                    <div className="flex items-center gap-1 mt-2">
                      <Star size={12} className="text-amber-400 fill-amber-400" />
                      <span className="text-xs text-gray-600">{b.rating}</span>
                    </div>
                    <span className={`text-[11px] font-medium ${b.available_copies > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                      {b.available_copies > 0 ? `${b.available_copies} available` : 'Unavailable'} · {b.location_code || 'Location pending'}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
}
