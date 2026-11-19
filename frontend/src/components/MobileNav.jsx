import { NavLink } from 'react-router-dom';
import { LayoutGrid, Library, Compass, BookMarked, Menu } from 'lucide-react';

const links = [
  { to: '/', label: 'Home', icon: LayoutGrid, end: true },
  { to: '/books', label: 'Books', icon: Library },
  { to: '/explore', label: 'Explore', icon: Compass },
  { to: '/issued', label: 'Loans', icon: BookMarked },
  { to: '/settings', label: 'More', icon: Menu },
];

export default function MobileNav() {
  return <nav aria-label="Mobile navigation" className="fixed inset-x-0 bottom-0 z-40 flex border-t border-[#b8b1a5] bg-[#f7f4ed]/95 px-1 pb-[max(0.35rem,env(safe-area-inset-bottom))] pt-1 backdrop-blur md:hidden">
    {links.map(({ to, label, icon: Icon, end }) => <NavLink key={to} to={to} end={end} className={({ isActive }) => `flex min-w-0 flex-1 flex-col items-center gap-1 rounded-lg py-1.5 text-[10px] font-semibold transition ${isActive ? 'text-brand-700' : 'text-slate-500'}`}>
      <Icon size={18} />
      <span>{label}</span>
    </NavLink>)}
  </nav>;
}
