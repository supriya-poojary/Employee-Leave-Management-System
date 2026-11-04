import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Clock, CheckCircle, XCircle, User, Calendar, FileText, MessageSquare } from 'lucide-react';
import { leaveAPI } from '../../api';
import { StatusBadge, LeaveTypeBadge } from '../../components/ui/Badge';
import { SkeletonTable } from '../../components/ui/Skeleton';
import { ConfirmModal } from '../../components/ui/Modal';
import { format, parseISO } from 'date-fns';
import toast from 'react-hot-toast';

const PendingRequests = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionModal, setActionModal] = useState({ open: false, id: null, action: null, app: null });
  const [remarks, setRemarks] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [expandedId, setExpandedId] = useState(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await leaveAPI.getAll({ status: 'pending', limit: 50 });
      setApplications(res.data.data);
    } catch {
      toast.error('Failed to load pending requests');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const handleAction = async () => {
    setActionLoading(true);
    try {
      await leaveAPI.updateStatus(actionModal.id, { status: actionModal.action, remarks });
      toast.success(`Leave ${actionModal.action} successfully`);
      setActionModal({ open: false, id: null, action: null, app: null });
      setRemarks('');
      fetch();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Action failed');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <SkeletonTable rows={5} />;

  return (
    <div className="space-y-5">
      {applications.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
          <h3 className="text-base font-semibold text-gray-700 mb-1">All caught up!</h3>
          <p className="text-sm text-gray-400">No pending leave requests at the moment.</p>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
            <Clock className="w-4 h-4 flex-shrink-0" />
            <span><strong>{applications.length}</strong> leave request{applications.length !== 1 ? 's' : ''} awaiting your review</span>
          </div>

          <div className="space-y-4">
            {applications.map((app, i) => (
              <motion.div
                key={app.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
              >
                <div className="p-5">
                  <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                    {/* Employee info */}
                    <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-indigo-600">
                        {app.employee_name?.charAt(0)?.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900">{app.employee_name}</h3>
                        <span className="text-xs text-gray-400">({app.employee_code})</span>
                        <LeaveTypeBadge type={app.leave_type} />
                      </div>
                      <p className="text-xs text-gray-500 mb-2">{app.designation} · {app.department}</p>
                      <div className="flex flex-wrap gap-4 text-xs text-gray-600">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-gray-400" />
                          {format(parseISO(app.start_date), 'dd MMM')} – {format(parseISO(app.end_date), 'dd MMM yyyy')}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-gray-400" />
                          {app.duration} working day{app.duration !== 1 ? 's' : ''}
                        </span>
                        <span className="flex items-center gap-1">
                          <FileText className="w-3.5 h-3.5 text-gray-400" />
                          {app.application_id}
                        </span>
                      </div>
                    </div>
                    {/* Actions */}
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => setExpandedId(expandedId === app.id ? null : app.id)}
                        className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        {expandedId === app.id ? 'Less' : 'Details'}
                      </button>
                      <button
                        onClick={() => { setActionModal({ open: true, id: app.id, action: 'approved', app }); setRemarks(''); }}
                        className="px-3 py-1.5 text-xs font-medium text-white bg-green-500 rounded-lg hover:bg-green-600 transition-colors flex items-center gap-1"
                      >
                        <CheckCircle className="w-3 h-3" /> Approve
                      </button>
                      <button
                        onClick={() => { setActionModal({ open: true, id: app.id, action: 'rejected', app }); setRemarks(''); }}
                        className="px-3 py-1.5 text-xs font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors flex items-center gap-1"
                      >
                        <XCircle className="w-3 h-3" /> Reject
                      </button>
                    </div>
                  </div>

                  {/* Expanded */}
                  {expandedId === app.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-4 pt-4 border-t border-gray-100"
                    >
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs font-semibold text-gray-500 mb-1">Reason</p>
                          <p className="text-sm text-gray-700">{app.reason}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-gray-500 mb-1">Applied On</p>
                          <p className="text-sm text-gray-700">{format(parseISO(app.created_at), 'dd MMMM yyyy, hh:mm a')}</p>
                        </div>
                        {app.document_url && (
                          <div>
                            <p className="text-xs font-semibold text-gray-500 mb-1">Supporting Document</p>
                            <a
                              href={`${import.meta.env.VITE_API_URL?.replace('/api', '')}${app.document_url}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-indigo-600 hover:underline"
                            >
                              View Document
                            </a>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </>
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
                {actionModal.action === 'approved' ? (
                  <CheckCircle className="w-6 h-6 text-green-500" />
                ) : (
                  <XCircle className="w-6 h-6 text-red-500" />
                )}
                <h3 className="text-lg font-semibold text-gray-900">
                  {actionModal.action === 'approved' ? 'Approve' : 'Reject'} Leave Request
                </h3>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                {actionModal.action === 'approved'
                  ? `Approve ${actionModal.action === 'approved' ? actionModal.app?.duration : ''} day(s) of ${actionModal.app?.leave_type} leave for ${actionModal.app?.employee_name}?`
                  : `Reject the leave request from ${actionModal.app?.employee_name}?`
                }
              </p>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Remarks {actionModal.action === 'rejected' && <span className="text-red-500">*</span>}
                </label>
                <textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  rows={3}
                  placeholder={`Add a remark for the employee...`}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-indigo-400 resize-none"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setActionModal({ open: false })}
                  className="flex-1 py-2.5 px-4 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAction}
                  disabled={actionLoading || (actionModal.action === 'rejected' && !remarks.trim())}
                  className={`flex-1 py-2.5 px-4 text-sm font-medium text-white rounded-xl transition-colors disabled:opacity-50
                    ${actionModal.action === 'approved' ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'}`}
                >
                  {actionLoading ? 'Processing...' : `Confirm ${actionModal.action === 'approved' ? 'Approval' : 'Rejection'}`}
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PendingRequests;

