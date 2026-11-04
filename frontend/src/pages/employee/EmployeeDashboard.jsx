import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar, Clock, CheckCircle, XCircle, TrendingUp, 
  FileText, ArrowRight, Briefcase, AlertCircle
} from 'lucide-react';
import { dashboardAPI } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import { StatusBadge, LeaveTypeBadge } from '../../components/ui/Badge';
import { SkeletonStats, SkeletonTable } from '../../components/ui/Skeleton';
import { format, parseISO } from 'date-fns';

const StatCard = ({ icon: Icon, label, value, gradient, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.4 }}
    className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 card-hover"
  >
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${gradient}`}>
      <Icon className="w-6 h-6 text-white" />
    </div>
    <motion.p
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: delay + 0.2 }}
      className="text-3xl font-bold text-gray-900 mb-1"
    >
      {value ?? '—'}
    </motion.p>
    <p className="text-sm text-gray-500">{label}</p>
  </motion.div>
);

const BalanceCard = ({ balance }) => {
  const colors = {
    casual: 'from-blue-500 to-blue-600',
    sick: 'from-purple-500 to-purple-600',
    earned: 'from-teal-500 to-teal-600',
    unpaid: 'from-orange-500 to-orange-600',
  };

  const pct = balance.allocated > 0
    ? Math.round(((balance.allocated - balance.available) / balance.allocated) * 100)
    : 0;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-semibold text-gray-700 capitalize">{balance.leave_type} Leave</span>
        <span className={`text-xs font-medium px-2 py-1 rounded-full text-white bg-gradient-to-r ${colors[balance.leave_type]}`}>
          {balance.available} left
        </span>
      </div>
      <div className="flex justify-between text-xs text-gray-500 mb-2">
        <span>Used: {balance.used}</span>
        <span>Pending: {balance.pending}</span>
        <span>Total: {balance.allocated}</span>
      </div>
      {balance.allocated > 0 && (
        <div className="w-full bg-gray-100 rounded-full h-2">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className={`h-2 rounded-full bg-gradient-to-r ${colors[balance.leave_type]}`}
          />
        </div>
      )}
    </div>
  );
};

const EmployeeDashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await dashboardAPI.getEmployeeStats();
        setData(res.data.data);
      } catch (error) {
        console.error('Dashboard error:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <SkeletonStats />
        <div className="grid lg:grid-cols-2 gap-6">
          <SkeletonTable rows={3} />
          <SkeletonTable rows={3} />
        </div>
      </div>
    );
  }

  const stats = data?.applicationStats;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl p-6 text-white relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
      >
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full" />
        <div className="absolute -right-5 bottom-0 w-24 h-24 bg-white/10 rounded-full" />
        <h2 className="text-xl font-bold mb-1">Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 17 ? 'Afternoon' : 'Evening'}, {user?.name?.split(' ')[0]}! 👋</h2>
        <p className="text-white/80 text-sm mb-4">{user?.designation} · {user?.department}</p>
        <div className="flex gap-3">
          <Link
            to="/employee/apply"
            className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-xl text-sm font-medium transition-colors"
          >
            <Calendar className="w-4 h-4" />
            Apply Leave
          </Link>
          <Link
            to="/employee/history"
            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl text-sm font-medium transition-colors"
          >
            <FileText className="w-4 h-4" />
            View History
          </Link>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={FileText} label="Total Applications" value={stats?.total} gradient="bg-gradient-to-br from-indigo-400 to-indigo-600" delay={0.1} />
        <StatCard icon={Clock} label="Pending" value={stats?.pending} gradient="bg-gradient-to-br from-amber-400 to-orange-500" delay={0.2} />
        <StatCard icon={CheckCircle} label="Approved" value={stats?.approved} gradient="bg-gradient-to-br from-green-400 to-green-600" delay={0.3} />
        <StatCard icon={XCircle} label="Rejected" value={stats?.rejected} gradient="bg-gradient-to-br from-red-400 to-red-600" delay={0.4} />
      </div>

      {/* Leave Balances */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-gray-900">Leave Balances ({new Date().getFullYear()})</h3>
          <Link to="/employee/balance" className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center gap-1 font-medium">
            View details <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {data?.leaveBalances?.map((b) => (
            <BalanceCard key={b.leave_type} balance={b} />
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Upcoming Leaves */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm"
        >
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">Upcoming Leaves</h3>
            <Calendar className="w-4 h-4 text-gray-400" />
          </div>
          <div className="p-4">
            {data?.upcomingLeaves?.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Calendar className="w-5 h-5 text-gray-400" />
                </div>
                <p className="text-sm text-gray-500">No upcoming approved leaves</p>
              </div>
            ) : (
              <div className="space-y-3">
                {data?.upcomingLeaves?.map((leave) => (
                  <div key={leave.id} className="flex items-center gap-3 p-3 bg-green-50 rounded-xl">
                    <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 capitalize">{leave.leave_type} Leave</p>
                      <p className="text-xs text-gray-500">
                        {format(parseISO(leave.start_date), 'dd MMM')} – {format(parseISO(leave.end_date), 'dd MMM yyyy')} · {leave.duration} day(s)
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>

        {/* Recent Applications */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm"
        >
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">Recent Applications</h3>
            <Link to="/employee/history" className="text-xs text-indigo-600 font-medium hover:underline">View all</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {data?.recentApplications?.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <FileText className="w-5 h-5 text-gray-400" />
                </div>
                <p className="text-sm text-gray-500">No leave applications yet</p>
                <Link to="/employee/apply" className="mt-2 inline-block text-xs text-indigo-600 font-medium hover:underline">
                  Apply for leave →
                </Link>
              </div>
            ) : (
              data?.recentApplications?.map((app) => (
                <div key={app.id} className="flex items-center gap-3 px-6 py-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <LeaveTypeBadge type={app.leave_type} />
                      <StatusBadge status={app.status} />
                    </div>
                    <p className="text-xs text-gray-500">
                      {format(parseISO(app.start_date), 'dd MMM')} – {format(parseISO(app.end_date), 'dd MMM yyyy')}
                    </p>
                  </div>
                  <span className="text-xs text-gray-400">{app.duration}d</span>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;

