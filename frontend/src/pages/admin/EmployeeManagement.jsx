import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Plus, Edit2, Trash2, User, ChevronLeft, ChevronRight,
  X, Building2, Briefcase, Mail, Phone, Calendar
} from 'lucide-react';
import { employeeAPI } from '../../api';
import { SkeletonTable } from '../../components/ui/Skeleton';
import { format, parseISO } from 'date-fns';
import toast from 'react-hot-toast';
import Modal from '../../components/ui/Modal';
import { useForm } from 'react-hook-form';

const EmployeeForm = ({ employee, onSubmit, loading }) => {
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: employee || {}
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name *</label>
          <input
            {...register('name', { required: 'Name is required' })}
            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-indigo-400 bg-gray-50 focus:bg-white"
            placeholder="John Doe"
          />
          {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Employee ID *</label>
          <input
            {...register('employee_id', { required: 'Employee ID is required' })}
            disabled={!!employee}
            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-indigo-400 bg-gray-50 focus:bg-white disabled:opacity-60"
            placeholder="EMP-009"
          />
          {errors.employee_id && <p className="mt-1 text-xs text-red-500">{errors.employee_id.message}</p>}
        </div>
      </div>

      {!employee && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Email *</label>
          <input
            {...register('email', { required: 'Email is required', pattern: { value: /^[^@]+@[^@]+\.[^@]+$/, message: 'Invalid email' } })}
            type="email"
            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-indigo-400 bg-gray-50 focus:bg-white"
            placeholder="employee@company.com"
          />
          {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
        </div>
      )}

      {!employee && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Initial Password *</label>
          <input
            {...register('password', { required: 'Password is required', minLength: { value: 8, message: 'Min 8 characters' } })}
            type="password"
            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-indigo-400 bg-gray-50 focus:bg-white"
            placeholder="At least 8 characters"
          />
          {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Department *</label>
          <input
            {...register('department', { required: 'Department is required' })}
            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-indigo-400 bg-gray-50 focus:bg-white"
            placeholder="Engineering"
          />
          {errors.department && <p className="mt-1 text-xs text-red-500">{errors.department.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Designation *</label>
          <input
            {...register('designation', { required: 'Designation is required' })}
            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-indigo-400 bg-gray-50 focus:bg-white"
            placeholder="Software Engineer"
          />
          {errors.designation && <p className="mt-1 text-xs text-red-500">{errors.designation.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone</label>
          <input
            {...register('phone')}
            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-indigo-400 bg-gray-50 focus:bg-white"
            placeholder="+91 98765 43210"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Joining Date</label>
          <input
            {...register('joining_date')}
            type="date"
            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-indigo-400 bg-gray-50 focus:bg-white"
          />
        </div>
      </div>

      <div className="pt-2 flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 text-sm font-semibold text-white rounded-xl disabled:opacity-60 transition-all shadow-lg shadow-indigo-100"
          style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
        >
          {loading ? 'Saving...' : employee ? 'Update Employee' : 'Create Employee'}
        </button>
      </div>
    </form>
  );
};

const EmployeeManagement = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, total: 0, pages: 1 });
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [departments, setDepartments] = useState([]);
  const [modal, setModal] = useState({ open: false, employee: null });
  const [formLoading, setFormLoading] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ open: false, id: null, name: '' });
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    employeeAPI.getDepartments().then(r => setDepartments(r.data.data));
  }, []);

  const fetchEmployees = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit: 10 };
      if (search) params.search = search;
      if (deptFilter) params.department = deptFilter;
      const res = await employeeAPI.getAll(params);
      setEmployees(res.data.data);
      setPagination({ page, ...res.data.pagination });
    } catch {
      toast.error('Failed to load employees');
    } finally {
      setLoading(false);
    }
  }, [search, deptFilter]);

  useEffect(() => {
    const timer = setTimeout(() => fetchEmployees(1), 300);
    return () => clearTimeout(timer);
  }, [search, deptFilter]);

  const handleSubmit = async (data) => {
    setFormLoading(true);
    try {
      if (modal.employee) {
        await employeeAPI.update(modal.employee.id, data);
        toast.success('Employee updated successfully');
      } else {
        await employeeAPI.create(data);
        toast.success('Employee created successfully');
      }
      setModal({ open: false, employee: null });
      fetchEmployees(pagination.page);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await employeeAPI.delete(deleteModal.id);
      toast.success('Employee deactivated successfully');
      setDeleteModal({ open: false, id: null, name: '' });
      fetchEmployees(pagination.page);
    } catch {
      toast.error('Failed to deactivate employee');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search employees by name, email, or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:border-indigo-400 bg-white"
          />
        </div>
        <select
          value={deptFilter}
          onChange={(e) => setDeptFilter(e.target.value)}
          className="px-3 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:border-indigo-400 bg-white text-gray-700"
        >
          <option value="">All Departments</option>
          {departments.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <button
          onClick={() => setModal({ open: true, employee: null })}
          className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white rounded-xl whitespace-nowrap"
          style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
        >
          <Plus className="w-4 h-4" />
          Add Employee
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <SkeletonTable rows={6} />
      ) : employees.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
          <User className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-400">No employees found</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Employee', 'Department', 'Designation', 'Joined', 'Status', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {employees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-bold text-indigo-600">{emp.name?.charAt(0)?.toUpperCase()}</span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">{emp.name}</p>
                          <p className="text-xs text-gray-400">{emp.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{emp.department}</td>
                    <td className="px-4 py-3 text-gray-600">{emp.designation}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                      {emp.joining_date ? format(parseISO(emp.joining_date), 'dd MMM yyyy') : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium
                        ${emp.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {emp.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => setModal({ open: true, employee: emp })}
                          className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        {emp.is_active && (
                          <button
                            onClick={() => setDeleteModal({ open: true, id: emp.id, name: emp.name })}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Deactivate"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pagination.pages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
              <p className="text-xs text-gray-500">{pagination.total} employees</p>
              <div className="flex gap-1">
                <button onClick={() => fetchEmployees(pagination.page - 1)} disabled={pagination.page === 1}
                  className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button onClick={() => fetchEmployees(pagination.page + 1)} disabled={pagination.page === pagination.pages}
                  className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={modal.open}
        onClose={() => setModal({ open: false, employee: null })}
        title={modal.employee ? 'Edit Employee' : 'Add New Employee'}
        size="lg"
      >
        <EmployeeForm employee={modal.employee} onSubmit={handleSubmit} loading={formLoading} />
      </Modal>

      {/* Delete Confirmation */}
      {deleteModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setDeleteModal({ open: false })} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Deactivate Employee</h3>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to deactivate <strong>{deleteModal.name}</strong>?
              They will no longer be able to log in.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteModal({ open: false })} className="flex-1 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200">
                Cancel
              </button>
              <button onClick={handleDelete} disabled={deleteLoading} className="flex-1 py-2.5 text-sm font-medium text-white bg-red-500 rounded-xl hover:bg-red-600 disabled:opacity-50">
                {deleteLoading ? 'Processing...' : 'Deactivate'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default EmployeeManagement;

