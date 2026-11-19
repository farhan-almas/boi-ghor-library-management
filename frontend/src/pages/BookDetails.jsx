import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Star, Heart, ArrowLeft, CheckCircle2, MapPin } from 'lucide-react';
import DashboardLayout from '../layouts/DashboardLayout';
import { BookCover, Loading } from '../components/Common';
import { api } from '../services/api';

export default function BookDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [book, setBook] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [reservation, setReservation] = useState(null);

  const load = () => api.get(`/books/${id}`).then(setBook).catch((e) => setError(e.message));

  useEffect(() => {
    load();
    api.get(`/reservations/book/${id}`).then(setReservation).catch(() => setReservation(null));
  }, [id]);

  const handleIssue = async () => {
    setMessage(''); setError('');
    try {
      const res = await api.post('/issues', { book_id: book.book_id });
      setMessage(`Issued! Due back on ${new Date(res.due_date).toLocaleDateString()}.`);
      load();
    } catch (e) {
      setError(e.message);
    }
  };

  const handleWishlist = async () => {
    try {
      await api.post('/dashboard/wishlist', { book_id: book.book_id });
      setMessage('Added to wishlist.');
    } catch (e) {
      setError(e.message);
    }
  };

  const handleReserve = async () => {
    setMessage(''); setError('');
    try {
      await api.post('/reservations', { book_id: book.book_id });
      setReservation(await api.get(`/reservations/book/${book.book_id}`));
      setMessage('You are now in the reservation queue. We will notify you when a copy is ready.');
    } catch (e) { setError(e.message); }
  };

  const handleCancelReservation = async () => {
    try {
      await api.del(`/reservations/${reservation.reservation_id}`);
      setReservation(null);
      setMessage('Reservation cancelled.');
    } catch (e) { setError(e.message); }
  };

  if (error && !book) return <DashboardLayout><p className="text-red-500">{error}</p></DashboardLayout>;
  if (!book) return <DashboardLayout><Loading /></DashboardLayout>;

  return (
    <DashboardLayout>
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-brand-600 font-medium mb-4">
        <ArrowLeft size={15} /> Back
      </button>

      {message && <p className="bg-emerald-50 text-emerald-700 text-sm rounded-lg px-3 py-2 mb-4">{message}</p>}
      {error && <p className="bg-red-50 text-red-600 text-sm rounded-lg px-3 py-2 mb-4">{error}</p>}

      <div className="card p-6 flex flex-col md:flex-row gap-6">
        <BookCover title={book.title} color={book.cover_color} image={book.cover_image} size="lg" />
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-800">{book.title}</h1>
          <p className="text-sm text-gray-500 mt-1">{book.author_name} · {book.department_name}</p>
          <div className="flex items-center gap-1 mt-2">
            <Star size={14} className="text-amber-400 fill-amber-400" />
            <span className="text-sm text-gray-600">{book.rating}</span>
          </div>
          <p className="text-sm text-gray-600 mt-4 leading-relaxed">{book.description}</p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-5 text-sm">
            <div><p className="text-gray-400 text-xs">ISBN</p><p className="font-medium text-gray-700">{book.isbn}</p></div>
            <div><p className="text-gray-400 text-xs">Publisher</p><p className="font-medium text-gray-700">{book.publisher}</p></div>
            <div><p className="text-gray-400 text-xs">Year</p><p className="font-medium text-gray-700">{book.publication_year}</p></div>
            <div><p className="text-gray-400 text-xs">Total Copies</p><p className="font-medium text-gray-700">{book.total_copies}</p></div>
            <div><p className="text-gray-400 text-xs">Available</p><p className="font-medium text-gray-700">{book.available_copies}</p></div>
            <div className="rounded-xl bg-brand-50 p-2"><p className="flex items-center gap-1 text-gray-400 text-xs"><MapPin size={12} /> Library location</p><p className="font-semibold text-brand-700">{book.location_code || 'Location pending'}</p><p className="text-[11px] text-gray-500">Floor · section · shelf</p></div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={handleIssue}
              disabled={book.available_copies < 1 || book.is_issued}
              className={`btn-primary disabled:cursor-not-allowed ${book.is_issued ? 'bg-emerald-600 text-white shadow-[0_0_20px_rgba(16,185,129,0.55)] hover:bg-emerald-600' : ''}`}
            >
              {book.is_issued ? <><CheckCircle2 size={17} className="mr-2 text-emerald-200" /> ISSUED</> : book.available_copies < 1 ? 'No Copies Available' : 'Issue Book'}
            </button>
            {book.available_copies < 1 && (reservation ? (
              <button onClick={handleCancelReservation} className="btn-secondary">Cancel reservation · #{reservation.queue_position}</button>
            ) : (
              <button onClick={handleReserve} className="btn-primary">Reserve a copy</button>
            ))}
            <button onClick={handleWishlist} className="btn-secondary flex items-center gap-2">
              <Heart size={15} /> Add to Wishlist
            </button>
          </div>
          {reservation && <p className="mt-3 text-xs font-medium text-brand-700">{reservation.status === 'ready' ? 'A copy is ready for you.' : `Reservation queue position: ${reservation.queue_position}`}</p>}
        </div>
      </div>

      {book.similar_books?.length > 0 && (
        <div className="mt-6">
          <h2 className="font-semibold text-gray-800 mb-3">Similar Books</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {book.similar_books.map((sb) => (
              <Link to={`/books/${sb.book_id}`} key={sb.book_id} className="card p-4 flex gap-3 hover:shadow-md">
                <BookCover title={sb.title} color={sb.cover_color} image={sb.cover_image} size="sm" />
                <div className="min-w-0">
                  <p className="font-semibold text-sm text-gray-800 truncate">{sb.title}</p>
                  <p className="text-xs text-gray-500 truncate">{sb.author_name}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
