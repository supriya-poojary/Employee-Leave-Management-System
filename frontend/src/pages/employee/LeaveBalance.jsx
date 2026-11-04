import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Info } from 'lucide-react';
import { leaveAPI } from '../../api';
import { RadialBarChart, RadialBar, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const leaveConfig = {
  casual: { color: '#3b82f6', label: 'Casual Leave', desc: 'For personal matters and short breaks' },
  sick: { color: '#8b5cf6', label: 'Sick Leave', desc: 'For medical illness or injury' },
  earned: { color: '#14b8a6', label: 'Earned Leave', desc: 'Annual planned vacation leave' },
  unpaid: { color: '#f97316', label: 'Unpaid Leave', desc: 'Leave without pay deduction' },
};

const BalanceRow = ({ balance, index }) => {
  const config = leaveConfig[balance.leave_type] || {};
  const pct = balance.allocated > 0
    ? Math.min(100, Math.round(((balance.allocated - balance.available) / balance.allocated) * 100))
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6"
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-semibold text-gray-900">{config.label}</h3>
          <p className="text-xs text-gray-500 mt-0.5">{config.desc}</p>
        </div>
        <span
          className="text-2xl font-bold"
          style={{ color: config.color }}
        >
          {balance.available}
          <span className="text-sm font-normal text-gray-500 ml-1">days left</span>
        </span>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-4">
        {[
          { label: 'Allocated', value: balance.allocated },
          { label: 'Used', value: balance.used },
          { label: 'Pending', value: balance.pending },
        ].map(({ label, value }) => (
          <div key={label} className="text-center">
            <p className="text-xl font-bold text-gray-800">{value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {balance.allocated > 0 ? (
        <>
          <div className="flex justify-between text-xs text-gray-400 mb-1.5">
            <span>Used: {balance.used + balance.pending} of {balance.allocated}</span>
            <span>{pct}%</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2.5">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ delay: 0.5 + index * 0.1, duration: 0.8 }}
              className="h-2.5 rounded-full"
              style={{ backgroundColor: config.color }}
            />
          </div>
        </>
      ) : (
        <div className="flex items-center gap-2 text-xs text-gray-400 mt-2">
          <Info className="w-3.5 h-3.5" />
          No fixed allocation — apply as needed
        </div>
      )}
    </motion.div>
  );
};

const LeaveBalance = () => {
  const [balances, setBalances] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await leaveAPI.getBalance();
        setBalances(res.data.data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="h-5 bg-gray-200 rounded w-1/3 mb-4" />
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4" />
            <div className="grid grid-cols-3 gap-4 mb-4">
              {[1, 2, 3].map(j => <div key={j} className="h-10 bg-gray-200 rounded" />)}
            </div>
            <div className="h-2.5 bg-gray-200 rounded" />
          </div>
        ))}
      </div>
    );
  }

  const totalAllocated = balances.filter(b => b.leave_type !== 'unpaid').reduce((s, b) => s + b.allocated, 0);
  const totalUsed = balances.filter(b => b.leave_type !== 'unpaid').reduce((s, b) => s + b.used, 0);
  const totalAvailable = balances.filter(b => b.leave_type !== 'unpaid').reduce((s, b) => s + b.available, 0);

  return (
    <div className="space-y-6">
      {/* Summary card */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl p-6 text-white relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
      >
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full" />
        <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Leave Balance Summary ({new Date().getFullYear()})
        </h2>
        <div className="grid grid-cols-3 gap-6">
          {[
            { label: 'Total Allocated', value: totalAllocated },
            { label: 'Total Used', value: totalUsed },
            { label: 'Available', value: totalAvailable },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-3xl font-bold text-white">{value}</p>
              <p className="text-white/70 text-sm">{label}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Balance cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {balances.map((b, i) => <BalanceRow key={b.id} balance={b} index={i} />)}
      </div>

      {/* Policy note */}
      <div className="bg-blue-50 rounded-2xl border border-blue-100 p-4 flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-blue-800 mb-1">Leave Policy</p>
          <ul className="text-xs text-blue-700 space-y-1 list-disc list-inside">
            <li>Casual Leave: 12 days/year – for personal reasons</li>
            <li>Sick Leave: 12 days/year – requires medical certificate for 3+ consecutive days</li>
            <li>Earned Leave: 15 days/year – can be carried forward (contact HR)</li>
            <li>Unpaid Leave: Available on request – no paid deduction limit</li>
            <li>Weekends are not counted in leave duration</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default LeaveBalance;

