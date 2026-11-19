import Sidebar from '../components/Sidebar';
import MobileNav from '../components/MobileNav';

export default function DashboardLayout({ children, title }) {
  return (
    <div className="flex min-h-screen bg-[#d9d5cc]">
      <Sidebar />
      <main className="min-w-0 flex-1 pb-20 md:pb-0">
        <div className="page-shell">
        {children}
        </div>
      </main>
      <MobileNav />
    </div>
  );
}
