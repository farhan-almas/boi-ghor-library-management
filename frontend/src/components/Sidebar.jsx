import { NavLink } from 'react-router-dom';
import {
  LayoutGrid, Library, Compass, BookMarked, BarChart3,
  Receipt, Bell, Settings, LogOut, BookOpen, ChevronLeft, Heart, ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';

const links = [
  { to: '/', label: 'My Library', icon: LayoutGrid, end: true },
  { to: '/books', label: 'Books Department', icon: Library },
  { to: '/books?mode=locator', label: 'Find in Library', icon: BookOpen },
  { to: '/explore', label: 'Explore', icon: Compass },
  { to: '/issued', label: 'Issued Books', icon: BookMarked },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/billing', label: 'Billing', icon: Receipt },
  { to: '/wishlist', label: 'Wishlist', icon: Heart },
  { to: '/notices', label: 'Notices', icon: Bell },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`hidden md:flex flex-col justify-between bg-white border-r border-slate-200 h-screen sticky top-0 transition-all ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      <div>
        <div className="flex items-center justify-between px-5 py-6">
          <div className="flex items-center gap-2">
            <img
              src="/boi-ghor-logo.png"
              alt="BOI GHOR"
              className="w-9 h-9 rounded-xl object-cover shadow-sm ring-1 ring-slate-200"
            />
            {!collapsed && (
              <span className="page-title font-bold text-slate-900 tracking-tight text-sm leading-tight">
                BOI<br />GHOR
              </span>
            )}
          </div>
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="text-gray-400 hover:text-gray-600"
          >
            <ChevronLeft size={16} className={collapsed ? 'rotate-180' : ''} />
          </button>
        </div>

        <nav className="px-3 mt-2 space-y-1">
          {links.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-brand-700 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-brand-50 hover:text-brand-800'
                }`
              }
            >
              <Icon size={18} />
              {!collapsed && <span>{label}</span>}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="px-3 pb-6">
        {user?.role === 'admin' && <NavLink to="/admin" className={({isActive})=>`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium mb-2 ${isActive?'bg-gray-800 text-white':'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}><ShieldCheck size={18}/>{!collapsed&&<span>Admin Panel</span>}</NavLink>}
        <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-brand-50 mb-2">
          <div className="w-9 h-9 rounded-full bg-brand-700 text-white flex items-center justify-center text-sm font-semibold">
            {user?.name?.[0]?.toUpperCase() || 'U'}
          </div>
          {!collapsed && (
            <div className="truncate">
              <p className="text-sm font-semibold text-gray-800 truncate">{user?.name}</p>
              <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
            </div>
          )}
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 w-full"
        >
          <LogOut size={18} />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}
