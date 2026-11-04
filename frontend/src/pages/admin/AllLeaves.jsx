import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, ChevronLeft, ChevronRight, FileText, X, CheckCircle, XCircle } from 'lucide-react';
import { leaveAPI } from '../../api';
import { employeeAPI } from '../../api';
import { StatusBadge, LeaveTypeBadge } from '../../components/ui/Badge';
import { SkeletonTable } from '../../components/ui/Skeleton';
import { format, parseISO } from 'date-fns';
import toast from 'react-hot-toast';

const AllLeaves = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, total: 0, pages: 1 });
  const [filters, setFilters] = useState({ status: '', leave_type: '', department: '' });
  const [departments, setDepartments] = useState([]);
  const [actionModal, setActionModal] = useState({ open: false, id: null, action: null, app: null });
  const [remarks, setRemarks] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    employeeAPI.getDepartments().then(r => setDepartments(r.data.data));
  }, []);

  const fetchApplications = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit: 10, ...filters };
      Object.keys(params).forEach(k => !params[k] && delete params[k]);
      const res = await leaveAPI.getAll(params);
      setApplications(res.data.data);
      setPagination({ page, ...res.data.pagination });
    } catch {
      toast.error('Failed to load applications');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchApplications(1); }, [filters]);

  const handleAction = async () => {
    setActionLoading(true);
    try {
      await leaveAPI.updateStatus(actionModal.id, { status: actionModal.action, remarks });
      toast.success(`Leave ${actionModal.action} successfully`);
      setActionModal({ open: false });
      setRemarks('');
      fetchApplications(pagination.page);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Action failed');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <div className="flex flex-wrap gap-3">
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
          <select
            value={filters.department}
            onChange={(e) => setFilters(f => ({ ...f, department: e.target.value }))}
            className="px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:border-indigo-400 bg-gray-50 text-gray-700"
          >
            <option value="">All Departments</option>
            {departments.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          {Object.values(filters).some(Boolean) && (
            <button
              onClick={() => setFilters({ status: '', leave_type: '', department: '' })}
              className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 flex items-center gap-1"
            >
              <X className="w-4 h-4" /> Clear
            </button>
          )}
          <span className="ml-auto text-sm text-gray-400 self-center">{pagination.total} applications</span>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <SkeletonTable rows={6} />
      ) : applications.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
          <FileText className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-400">No applications found</p>
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
                  {['App ID', 'Employee', 'Department', 'Leave Type', 'Dates', 'Days', 'Status', 'Applied', 'Remarks', 'Action'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {applications.map((app) => (
                  <tr key={app.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-indigo-600 whitespace-nowrap">{app.application_id}</td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-gray-800 whitespace-nowrap">{app.employee_name}</p>
                        <p className="text-xs text-gray-400">{app.employee_code}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{app.department}</td>
                    <td className="px-4 py-3"><LeaveTypeBadge type={app.leave_type} /></td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap text-xs">
                      {format(parseISO(app.start_date), 'dd MMM')} – {format(parseISO(app.end_date), 'dd MMM yy')}
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-center">{app.duration}</td>
                    <td className="px-4 py-3"><StatusBadge status={app.status} /></td>
                    <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">{format(parseISO(app.created_at), 'dd MMM yy')}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs max-w-28 truncate">{app.remarks || '—'}</td>
                    <td className="px-4 py-3">
                      {app.status === 'pending' && (
                        <div className="flex gap-1">
                          <button
                            onClick={() => { setActionModal({ open: true, id: app.id, action: 'approved', app }); setRemarks(''); }}
                            className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Approve"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => { setActionModal({ open: true, id: app.id, action: 'rejected', app }); setRemarks(''); }}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Reject"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pagination.pages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
              <p className="text-xs text-gray-500">
                {((pagination.page - 1) * 10) + 1}–{Math.min(pagination.page * 10, pagination.total)} of {pagination.total}
              </p>
              <div className="flex gap-1">
                <button onClick={() => fetchApplications(pagination.page - 1)} disabled={pagination.page === 1}
                  className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button onClick={() => fetchApplications(pagination.page + 1)} disabled={pagination.page === pagination.pages}
                  className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Action Modal */}
      {actionModal.open && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setActionModal({ open: false })} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                {actionModal.action === 'approved'
                  ? <CheckCircle className="w-6 h-6 text-green-500" />
                  : <XCircle className="w-6 h-6 text-red-500" />
                }
                <h3 className="text-lg font-semibold text-gray-900">
                  {actionModal.action === 'approved' ? 'Approve' : 'Reject'} Request
                </h3>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                For <strong>{actionModal.app?.employee_name}</strong> — {actionModal.app?.duration} day(s) of {actionModal.app?.leave_type} leave.
              </p>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Remarks {actionModal.action === 'rejected' && <span className="text-red-400 text-xs">(required for rejection)</span>}
                </label>
                <textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  rows={3}
                  placeholder="Add remarks for the employee..."
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-indigo-400 resize-none"
                />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setActionModal({ open: false })} className="flex-1 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200">
                  Cancel
                </button>
                <button
                  onClick={handleAction}
                  disabled={actionLoading || (actionModal.action === 'rejected' && !remarks.trim())}
                  className={`flex-1 py-2.5 text-sm font-medium text-white rounded-xl transition-colors disabled:opacity-50
                    ${actionModal.action === 'approved' ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'}`}
                >
                  {actionLoading ? 'Processing...' : 'Confirm'}
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllLeaves;

