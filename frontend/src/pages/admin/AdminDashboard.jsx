import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Users, FileText, Clock, CheckCircle, XCircle, UserCheck,
  TrendingUp, ArrowRight, Building2, Calendar
} from 'lucide-react';
import { dashboardAPI } from '../../api';
import { Link } from 'react-router-dom';
import { StatusBadge, LeaveTypeBadge } from '../../components/ui/Badge';
import { SkeletonStats, SkeletonTable } from '../../components/ui/Skeleton';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { format, parseISO } from 'date-fns';

const StatCard = ({ icon: Icon, label, value, gradient, change, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.4 }}
    className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 card-hover"
  >
    <div className="flex items-center justify-between mb-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${gradient}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
    </div>
    <p className="text-3xl font-bold text-gray-900 mb-1">{value ?? '—'}</p>
    <p className="text-sm text-gray-500">{label}</p>
  </motion.div>
);

const PIE_COLORS = ['#f59e0b', '#10b981', '#ef4444', '#6b7280'];

const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await dashboardAPI.getAdminStats();
        setData(res.data.data);
      } catch (error) {
        console.error('Admin dashboard error:', error);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <SkeletonStats />
        <div className="grid lg:grid-cols-2 gap-6">
          <SkeletonTable rows={4} />
          <SkeletonTable rows={4} />
        </div>
      </div>
    );
  }

  const { stats, monthlyStats, departmentStats, recentApplications } = data || {};

  const pieData = [
    { name: 'Pending', value: stats?.pendingCount || 0 },
    { name: 'Approved', value: stats?.approvedCount || 0 },
    { name: 'Rejected', value: stats?.rejectedCount || 0 },
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl p-6 text-white relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
      >
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full" />
        <h2 className="text-xl font-bold mb-1">Admin Dashboard</h2>
        <p className="text-white/80 text-sm mb-4">
          {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
        <div className="flex gap-3 flex-wrap">
          <Link to="/admin/pending" className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-xl text-sm font-medium transition-colors">
            <Clock className="w-4 h-4" />
            Review Pending ({stats?.pendingCount || 0})
          </Link>
          <Link to="/admin/employees" className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl text-sm font-medium transition-colors">
            <Users className="w-4 h-4" />
            Manage Employees
          </Link>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard icon={Users} label="Total Employees" value={stats?.totalEmployees} gradient="bg-gradient-to-br from-indigo-400 to-indigo-600" delay={0.1} />
        <StatCard icon={FileText} label="Total Applications" value={stats?.totalApplications} gradient="bg-gradient-to-br from-blue-400 to-blue-600" delay={0.15} />
        <StatCard icon={Clock} label="Pending" value={stats?.pendingCount} gradient="bg-gradient-to-br from-amber-400 to-orange-500" delay={0.2} />
        <StatCard icon={CheckCircle} label="Approved" value={stats?.approvedCount} gradient="bg-gradient-to-br from-green-400 to-green-600" delay={0.25} />
        <StatCard icon={XCircle} label="Rejected" value={stats?.rejectedCount} gradient="bg-gradient-to-br from-red-400 to-red-600" delay={0.3} />
        <StatCard icon={UserCheck} label="On Leave Today" value={stats?.onLeaveToday} gradient="bg-gradient-to-br from-purple-400 to-purple-600" delay={0.35} />
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Monthly Bar Chart */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6"
        >
          <h3 className="font-semibold text-gray-900 mb-4">Monthly Leave Applications ({new Date().getFullYear()})</h3>
          {monthlyStats?.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={monthlyStats} barSize={12}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }} />
                <Bar dataKey="approved" fill="#10b981" radius={[4, 4, 0, 0]} name="Approved" />
                <Bar dataKey="pending" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Pending" />
                <Bar dataKey="rejected" fill="#ef4444" radius={[4, 4, 0, 0]} name="Rejected" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-56 flex items-center justify-center text-gray-400 text-sm">
              No data available yet
            </div>
          )}
        </motion.div>

        {/* Pie Chart */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6"
        >
          <h3 className="font-semibold text-gray-900 mb-4">Application Status Distribution</h3>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value">
                  {pieData.map((entry, index) => (
                    <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-56 flex items-center justify-center text-gray-400 text-sm">
              No applications yet
            </div>
          )}
        </motion.div>
      </div>

      {/* Department Stats + Recent */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Department breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6"
        >
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-gray-400" />
            Department-wise Leave Applications
          </h3>
          {departmentStats?.length > 0 ? (
            <div className="space-y-3">
              {departmentStats.map((dept) => {
                const pct = stats?.totalApplications > 0
                  ? Math.round((dept.total_applications / stats.totalApplications) * 100)
                  : 0;
                return (
                  <div key={dept.department}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-gray-700">{dept.department}</span>
                      <span className="text-gray-500">{dept.total_applications} apps</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ delay: 0.8, duration: 0.6 }}
                        className="h-2 rounded-full bg-gradient-to-r from-indigo-400 to-purple-500"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-8">No department data available</p>
          )}
        </motion.div>

        {/* Recent Applications */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm"
        >
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">Recent Leave Requests</h3>
            <Link to="/admin/leaves" className="text-xs text-indigo-600 font-medium hover:underline flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {recentApplications?.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-sm">No recent applications</div>
            ) : (
              recentApplications?.map((app) => (
                <div key={app.id} className="flex items-center gap-3 px-6 py-3">
                  <div className="w-8 h-8 bg-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-indigo-600">
                      {app.employee_name?.charAt(0)?.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{app.employee_name}</p>
                    <p className="text-xs text-gray-400">{app.department}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <LeaveTypeBadge type={app.leave_type} />
                    <div className="mt-1">
                      <StatusBadge status={app.status} />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminDashboard;

