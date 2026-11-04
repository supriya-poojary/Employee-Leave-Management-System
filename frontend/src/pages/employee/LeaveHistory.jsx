import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, ChevronLeft, ChevronRight, FileText, X } from 'lucide-react';
import { leaveAPI } from '../../api';
import { StatusBadge, LeaveTypeBadge } from '../../components/ui/Badge';
import { SkeletonTable } from '../../components/ui/Skeleton';
import { ConfirmModal } from '../../components/ui/Modal';
import { format, parseISO } from 'date-fns';
import toast from 'react-hot-toast';

const LeaveHistory = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, total: 0, pages: 1 });
  const [filters, setFilters] = useState({ status: '', leave_type: '', search: '' });
  const [cancelModal, setCancelModal] = useState({ open: false, id: null });
  const [cancelLoading, setCancelLoading] = useState(false);

  const fetchApplications = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit: 10, ...filters };
      Object.keys(params).forEach(k => !params[k] && delete params[k]);
      const res = await leaveAPI.getAll(params);
      setApplications(res.data.data);
      setPagination({ page, ...res.data.pagination });
    } catch (error) {
      toast.error('Failed to load applications');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchApplications(1); }, [filters]);

  const handleCancel = async () => {
    setCancelLoading(true);
    try {
      await leaveAPI.cancel(cancelModal.id);
      toast.success('Application cancelled');
      setCancelModal({ open: false, id: null });
      fetchApplications(pagination.page);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to cancel application');
    } finally {
      setCancelLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search applications..."
              value={filters.search}
              onChange={(e) => setFilters(f => ({ ...f, search: e.target.value }))}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:border-indigo-400 bg-gray-50 focus:bg-white transition-colors"
            />
          </div>
          <select
            value={filters.status}
            onChange={(e) => setFilters(f => ({ ...f, status: e.target.value }))}
            className="px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:border-indigo-400 bg-gray-50 text-gray-700"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <select
            value={filters.leave_type}
            onChange={(e) => setFilters(f => ({ ...f, leave_type: e.target.value }))}
            className="px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:border-indigo-400 bg-gray-50 text-gray-700"
          >
            <option value="">All Types</option>
            <option value="casual">Casual</option>
            <option value="sick">Sick</option>
            <option value="earned">Earned</option>
            <option value="unpaid">Unpaid</option>
          </select>
          {(filters.status || filters.leave_type) && (
            <button
              onClick={() => setFilters({ status: '', leave_type: '', search: '' })}
              className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 flex items-center gap-1"
            >
              <X className="w-4 h-4" /> Clear
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <SkeletonTable rows={5} />
      ) : applications.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-7 h-7 text-gray-400" />
          </div>
          <h3 className="text-base font-semibold text-gray-700 mb-1">No applications found</h3>
          <p className="text-sm text-gray-400">No leave applications match your current filters.</p>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['App ID', 'Leave Type', 'Start Date', 'End Date', 'Days', 'Status', 'Applied On', 'Remarks', 'Action'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {applications.map((app) => (
                  <motion.tr
                    key={app.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3 font-mono text-xs text-indigo-600">{app.application_id}</td>
                    <td className="px-4 py-3"><LeaveTypeBadge type={app.leave_type} /></td>
                    <td className="px-4 py-3 text-gray-700">{format(parseISO(app.start_date), 'dd MMM yyyy')}</td>
                    <td className="px-4 py-3 text-gray-700">{format(parseISO(app.end_date), 'dd MMM yyyy')}</td>
                    <td className="px-4 py-3 text-gray-700 text-center">{app.duration}</td>
                    <td className="px-4 py-3"><StatusBadge status={app.status} /></td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{format(parseISO(app.created_at), 'dd MMM yyyy')}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs max-w-32 truncate">{app.remarks || '—'}</td>
                    <td className="px-4 py-3">
                      {app.status === 'pending' && (
                        <button
                          onClick={() => setCancelModal({ open: true, id: app.id })}
                          className="text-xs text-red-500 hover:text-red-700 font-medium hover:underline"
                        >
                          Cancel
                        </button>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
              <p className="text-xs text-gray-500">
                Showing {((pagination.page - 1) * 10) + 1}–{Math.min(pagination.page * 10, pagination.total)} of {pagination.total}
              </p>
              <div className="flex gap-1">
                <button
                  onClick={() => fetchApplications(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => fetchApplications(pagination.page + 1)}
                  disabled={pagination.page === pagination.pages}
                  className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </motion.div>
      )}

      <ConfirmModal
        isOpen={cancelModal.open}
        onClose={() => setCancelModal({ open: false, id: null })}
        onConfirm={handleCancel}
        title="Cancel Application"
        message="Are you sure you want to cancel this leave application? This action cannot be undone."
        type="danger"
        loading={cancelLoading}
      />
    </div>
  );
};

export default LeaveHistory;

