import { useEffect, useState } from 'react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import DashboardLayout from '../layouts/DashboardLayout';
import TopNav from '../components/TopNav';
import { Loading, EmptyState } from '../components/Common';
import { api } from '../services/api';

const COLORS = ['#6d5ef2', '#8b7cf6', '#38bdf8', '#f59e0b', '#f472b6', '#10b981'];

export default function Analytics() {
  const [data, setData] = useState(null);

  useEffect(() => { api.get('/analytics').then(setData); }, []);

  if (!data) return <DashboardLayout><TopNav title="Analytics" /><Loading /></DashboardLayout>;

  const { reading_activity, reading_categories, monthly_reading, most_read_categories, statistics } = data;

  return (
    <DashboardLayout>
      <TopNav title="Analytics" />

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {[
          ['Total Books Read', statistics.total_books_read],
          ['Total Books Issued', statistics.total_books_issued],
          ['Favorite Category', statistics.favorite_category],
          ['Books This Month', statistics.books_this_month],
          ['Books This Year', statistics.books_this_year],
        ].map(([label, value]) => (
          <div key={label} className="card p-5">
            <p className="text-xl font-bold text-gray-800">{value}</p>
            <p className="text-sm text-gray-500 mt-1">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <div className="card p-5">
          <h2 className="font-semibold text-gray-800 mb-4">Reading Activity</h2>
          {reading_activity.length === 0 ? <EmptyState message="No reading activity recorded yet." /> : (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={reading_activity}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f0fb" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#6d5ef2" strokeWidth={2.5} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card p-5">
          <h2 className="font-semibold text-gray-800 mb-4">Reading Categories</h2>
          {reading_categories.length === 0 ? <EmptyState message="No categories yet." /> : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={reading_categories}
                  dataKey="count"
                  nameKey="department_name"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={3}
                >
                  {reading_categories.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card p-5">
          <h2 className="font-semibold text-gray-800 mb-4">Monthly Reading</h2>
          {monthly_reading.length === 0 ? <EmptyState message="No data yet." /> : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={monthly_reading}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f0fb" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#8b7cf6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card p-5">
          <h2 className="font-semibold text-gray-800 mb-4">Most Read Categories</h2>
          {most_read_categories.length === 0 ? <EmptyState message="No data yet." /> : (
            <div className="space-y-3">
              {most_read_categories.map((c, i) => (
                <div key={c.department_name} className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-gray-400 w-4">{i + 1}</span>
                  <span className="flex-1 text-sm text-gray-700">{c.department_name}</span>
                  <span className="text-xs font-semibold text-brand-600">{c.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
