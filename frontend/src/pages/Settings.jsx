import DashboardLayout from '../layouts/DashboardLayout';
import TopNav from '../components/TopNav';
import { useAuth } from '../context/AuthContext';

export default function Settings() {
  const { user } = useAuth();

  return (
    <DashboardLayout>
      <TopNav title="Settings" />
      <div className="card p-6 max-w-lg">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-2xl bg-brand-600 text-white flex items-center justify-center text-xl font-semibold">
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-gray-800">{user?.name}</p>
            <p className="text-sm text-gray-500 capitalize">{user?.role}</p>
          </div>
        </div>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between border-b border-gray-100 pb-2">
            <span className="text-gray-400">Email</span>
            <span className="text-gray-700 font-medium">{user?.email}</span>
          </div>
          <div className="flex justify-between border-b border-gray-100 pb-2">
            <span className="text-gray-400">Role</span>
            <span className="text-gray-700 font-medium capitalize">{user?.role}</span>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
