import { TrendingUp, TrendingDown, BookOpen } from 'lucide-react';

export function StatCard({ icon: Icon, label, value, trend, color = 'brand' }) {
  const bg = {brand:'bg-brand-100 text-brand-600',emerald:'bg-emerald-100 text-emerald-600',amber:'bg-amber-100 text-amber-600',red:'bg-red-100 text-red-600'}[color] || 'bg-brand-100 text-brand-600';
  return <div className="card p-5"><div className="flex items-center justify-between mb-4"><div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center`}><Icon size={18}/></div>{trend!==undefined&&<span className={`text-xs font-semibold flex items-center gap-1 ${trend>=0?'text-emerald-600':'text-red-500'}`}>{trend>=0?<TrendingUp size={12}/>:<TrendingDown size={12}/>} {Math.abs(trend)}%</span>}</div><p className="text-2xl font-bold text-gray-800">{value}</p><p className="text-sm text-gray-500 mt-1">{label}</p></div>;
}
const statusStyles={'Due Soon':'bg-amber-100 text-amber-700','On Time':'bg-emerald-100 text-emerald-700',Overdue:'bg-red-100 text-red-700',Active:'bg-blue-100 text-blue-700',Returned:'bg-gray-100 text-gray-600',Paid:'bg-emerald-100 text-emerald-700',Unpaid:'bg-red-100 text-red-700',Pending:'bg-amber-100 text-amber-700'};
export function StatusBadge({status}){const label=status?.charAt(0).toUpperCase()+status?.slice(1);return <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusStyles[label]||'bg-gray-100 text-gray-600'}`}>{label}</span>}
export function BookCover({title,color='#6366f1',image,size='md'}){
 const sizes={sm:'w-12 h-16 text-[9px]',md:'w-16 h-24 text-xs',lg:'w-28 h-40 text-sm'};
 return <div className={`${sizes[size]} rounded-lg overflow-hidden flex items-end p-2 text-white font-semibold shadow-sm shrink-0 relative`} style={image?{backgroundImage:`url("${image}")`,backgroundSize:'cover',backgroundPosition:'center'}:{background:`linear-gradient(160deg, ${color}, ${color}cc)`}}>
   {image&&<div className="absolute inset-0 bg-black/20"/>}<span className="line-clamp-3 leading-tight relative z-10 drop-shadow">{title}</span>
 </div>;
}
export function EmptyState({message}){return <div className="py-12 text-center text-sm text-slate-500"><BookOpen className="mx-auto mb-3 text-brand-300" size={28}/><p>{message}</p></div>}
export function Loading(){return <div className="flex items-center justify-center gap-3 py-12 text-sm text-slate-500"><span className="h-5 w-5 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600"/>Loading...</div>}
