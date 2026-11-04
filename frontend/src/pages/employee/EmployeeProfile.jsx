import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Briefcase, Building2, Phone, MapPin, Calendar, Shield, Key } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../api';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { format, parseISO } from 'date-fns';

const EmployeeProfile = () => {
  const { user, updateUser } = useAuth();
  const [changingPassword, setChangingPassword] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const onChangePassword = async (data) => {
    if (data.newPassword !== data.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setPwLoading(true);
    try {
      await authAPI.changePassword({ currentPassword: data.currentPassword, newPassword: data.newPassword });
      toast.success('Password changed successfully');
      setChangingPassword(false);
      reset();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to change password');
    } finally {
      setPwLoading(false);
    }
  };

  const profileFields = [
    { icon: User, label: 'Full Name', value: user?.name },
    { icon: Mail, label: 'Email Address', value: user?.email },
    { icon: Shield, label: 'Employee ID', value: user?.employee_id || 'N/A' },
    { icon: Building2, label: 'Department', value: user?.department || 'N/A' },
    { icon: Briefcase, label: 'Designation', value: user?.designation || 'N/A' },
    { icon: Calendar, label: 'Joining Date', value: user?.joining_date ? format(parseISO(user.joining_date), 'dd MMMM yyyy') : 'N/A' },
    { icon: Phone, label: 'Phone', value: user?.phone || 'Not provided' },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Profile Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
      >
        <div className="h-28 relative" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
          <div className="absolute -bottom-10 left-6">
            <div className="w-20 h-20 rounded-2xl bg-white shadow-lg flex items-center justify-center border-4 border-white">
              <span className="text-3xl font-bold text-indigo-600">
                {user?.name?.charAt(0)?.toUpperCase()}
              </span>
            </div>
          </div>
        </div>
        <div className="pt-14 pb-6 px-6">
          <h2 className="text-xl font-bold text-gray-900">{user?.name}</h2>
          <p className="text-gray-500 text-sm">{user?.designation} · {user?.department}</p>
          <span className="mt-2 inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">
            {user?.role === 'admin' ? '🛡️ Administrator' : '👤 Employee'}
          </span>
        </div>
      </motion.div>

      {/* Profile Details */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6"
      >
        <h3 className="text-base font-semibold text-gray-900 mb-5">Personal Information</h3>
        <div className="space-y-4">
          {profileFields.map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-center gap-4">
              <div className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Icon className="w-4 h-4 text-gray-500" />
              </div>
              <div>
                <p className="text-xs text-gray-400 font-medium">{label}</p>
                <p className="text-sm text-gray-800 font-medium">{value}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Change Password */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6"
      >
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Key className="w-4 h-4 text-gray-500" />
            <h3 className="text-base font-semibold text-gray-900">Change Password</h3>
          </div>
          <button
            onClick={() => setChangingPassword((v) => !v)}
            className="text-sm text-indigo-600 font-medium hover:text-indigo-700"
          >
            {changingPassword ? 'Cancel' : 'Change'}
          </button>
        </div>

        {changingPassword && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            onSubmit={handleSubmit(onChangePassword)}
            className="space-y-4"
          >
            {[
              { name: 'currentPassword', label: 'Current Password' },
              { name: 'newPassword', label: 'New Password' },
              { name: 'confirmPassword', label: 'Confirm New Password' },
            ].map(({ name, label }) => (
              <div key={name}>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
                <input
                  {...register(name, { required: `${label} is required`, minLength: name !== 'currentPassword' ? { value: 8, message: 'Min 8 characters' } : undefined })}
                  type="password"
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-indigo-400 bg-gray-50 focus:bg-white transition-colors"
                />
                {errors[name] && <p className="mt-1 text-xs text-red-500">{errors[name].message}</p>}
              </div>
            ))}
            <button
              type="submit"
              disabled={pwLoading}
              className="w-full py-2.5 px-4 text-sm font-semibold text-white rounded-xl disabled:opacity-60 transition-all"
              style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
            >
              {pwLoading ? 'Updating...' : 'Update Password'}
            </button>
          </motion.form>
        )}

        {!changingPassword && (
          <p className="text-sm text-gray-400">
            Use a strong password with at least 8 characters, including uppercase, lowercase, and numbers.
          </p>
        )}
      </motion.div>
    </div>
  );
};

export default EmployeeProfile;

