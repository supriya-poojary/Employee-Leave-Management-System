import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Mail, Lock, User, Building2, Briefcase, Phone, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid corporate email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['employee', 'admin']),
  employee_id: z.string().optional(),
  department: z.string().min(2, 'Department is required'),
  designation: z.string().min(2, 'Designation is required'),
  phone: z.string().optional(),
});

const FloatingShape = ({ className, style }) => (
  <motion.div
    animate={{ y: [-20, 20, -20], rotate: [0, 5, -5, 0] }}
    transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
    className={`absolute rounded-full opacity-10 ${className}`}
    style={style}
  />
);

const RegisterPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState('employee');
  const { registerUser } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: 'employee',
      department: 'Engineering',
      designation: 'Software Engineer',
    },
  });

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    setValue('role', role);
    if (role === 'admin') {
      setValue('department', 'Administration');
      setValue('designation', 'HR Manager / Administrator');
    } else {
      setValue('department', 'Engineering');
      setValue('designation', 'Software Engineer');
    }
  };

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      const user = await registerUser(data);
      toast.success(`Account created successfully! Welcome, ${user.name}`);
      navigate(user.role === 'admin' ? '/admin' : '/employee');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed. Please check your details.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen relative overflow-hidden flex items-center justify-center p-4 py-12"
      style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)' }}
    >
      <FloatingShape className="w-80 h-80 bg-white -top-10 -left-20" />
      <FloatingShape className="w-64 h-64 bg-yellow-300 bottom-5 -right-10" style={{ animationDelay: '2s' }} />

      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)',
          backgroundSize: '30px 30px',
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl p-6 sm:p-10 z-10"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 leading-tight">Create an Account</h2>
              <p className="text-xs text-gray-500">Corporate Employee Leave Management Portal</p>
            </div>
          </div>
          <Link
            to="/login"
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
          >
            Already registered? Sign in
          </Link>
        </div>

        {/* Role Toggle */}
        <div className="mb-6">
          <label className="block text-xs font-semibold text-gray-600 mb-2">I am registering as:</label>
          <div className="grid grid-cols-2 gap-3 p-1.5 bg-gray-100 rounded-2xl">
            <button
              type="button"
              onClick={() => handleRoleSelect('employee')}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-sm font-semibold transition-all ${
                selectedRole === 'employee'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <User className="w-4 h-4" />
              Employee
            </button>
            <button
              type="button"
              onClick={() => handleRoleSelect('admin')}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-sm font-semibold transition-all ${
                selectedRole === 'admin'
                  ? 'bg-white text-purple-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              Company Admin / HR
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <input type="hidden" {...register('role')} value={selectedRole} />

          <div className="grid sm:grid-cols-2 gap-4">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Full Name *</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  {...register('name')}
                  type="text"
                  placeholder="e.g. John Doe"
                  className={`w-full pl-10 pr-3 py-2.5 rounded-xl border text-sm outline-none transition-colors ${
                    errors.name ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50 focus:bg-white focus:border-indigo-400'
                  }`}
                />
              </div>
              {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Work Email *</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  {...register('email')}
                  type="email"
                  placeholder="john.doe@company.com"
                  className={`w-full pl-10 pr-3 py-2.5 rounded-xl border text-sm outline-none transition-colors ${
                    errors.email ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50 focus:bg-white focus:border-indigo-400'
                  }`}
                />
              </div>
              {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Password * (Min 8 characters)</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="At least 8 characters"
                  className={`w-full pl-10 pr-10 py-2.5 rounded-xl border text-sm outline-none transition-colors ${
                    errors.password ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50 focus:bg-white focus:border-indigo-400'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
            </div>

            {/* Employee ID */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Employee / Admin ID <span className="text-gray-400 font-normal">(Optional)</span>
              </label>
              <div className="relative">
                <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  {...register('employee_id')}
                  type="text"
                  placeholder={selectedRole === 'admin' ? 'ADM-101 (or auto-generated)' : 'EMP-1001 (or auto-generated)'}
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-indigo-400 text-sm outline-none"
                />
              </div>
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            {/* Department */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Department *</label>
              <input
                {...register('department')}
                type="text"
                placeholder="e.g. Engineering"
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-indigo-400 text-sm outline-none"
              />
              {errors.department && <p className="mt-1 text-xs text-red-500">{errors.department.message}</p>}
            </div>

            {/* Designation */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Designation *</label>
              <input
                {...register('designation')}
                type="text"
                placeholder="e.g. Frontend Dev"
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-indigo-400 text-sm outline-none"
              />
              {errors.designation && <p className="mt-1 text-xs text-red-500">{errors.designation.message}</p>}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Phone</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <input
                  {...register('phone')}
                  type="text"
                  placeholder="+91 98765 43210"
                  className="w-full pl-8 pr-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-indigo-400 text-sm outline-none"
                />
              </div>
            </div>
          </div>

          <motion.button
            type="submit"
            disabled={isLoading}
            whileTap={{ scale: 0.98 }}
            className="w-full mt-4 py-3 px-6 rounded-xl font-semibold text-white text-sm flex items-center justify-center gap-2 disabled:opacity-60 transition-all shadow-lg shadow-indigo-100"
            style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Creating your account...
              </>
            ) : (
              <>
                Complete Registration
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </motion.button>
        </form>

        <p className="mt-6 text-center text-xs text-gray-400">
          Already have an account?{' '}
          <Link to="/login" className="text-indigo-600 font-semibold hover:underline">
            Sign In here
          </Link>
        </p>
      </motion.div>
    </div>
  );
};

export default RegisterPage;

