import {useEffect,useState} from 'react';
import {Heart, Trash2, ArrowLeft} from 'lucide-react';
import {Link} from 'react-router-dom';
import DashboardLayout from '../layouts/DashboardLayout';
import TopNav from '../components/TopNav';
import {BookCover,EmptyState,Loading} from '../components/Common';
import {api} from '../services/api';

export default function Wishlist(){
 const [items,setItems]=useState(null),[error,setError]=useState(''),[message,setMessage]=useState('');
 const load=()=>api.get('/dashboard/wishlist').then(setItems).catch(e=>setError(e.message));
 useEffect(()=>{load()},[]);
 const remove=async(id)=>{try{await api.del(`/dashboard/wishlist/${id}`);setMessage('Removed from wishlist.');load()}catch(e){setError(e.message)}};
 return <DashboardLayout><TopNav title="My Wishlist"/>
  {message&&<p className="bg-emerald-50 text-emerald-700 text-sm rounded-lg px-3 py-2 mb-4">{message}</p>}
  {error&&<p className="bg-red-50 text-red-600 text-sm rounded-lg px-3 py-2 mb-4">{error}</p>}
  {!items?<Loading/>:items.length===0?<div className="card"><EmptyState message="Your wishlist is empty. Add books you want to read later."/></div>:
  <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">{items.map(b=><div key={b.wishlist_id} className="card p-4 flex gap-3">
    <BookCover title={b.title} color={b.cover_color} image={b.cover_image}/>
    <div className="min-w-0 flex-1"><Link to={`/books/${b.book_id}`} className="font-semibold text-sm text-gray-800 hover:text-brand-600 line-clamp-2">{b.title}</Link><p className="text-xs text-gray-500 mt-1">{b.author_name}</p>
    <button onClick={()=>remove(b.wishlist_id)} className="mt-4 text-xs text-red-500 flex items-center gap-1 hover:underline"><Trash2 size={13}/> Remove</button></div>
  </div>)}</div>}
 </DashboardLayout>
}
