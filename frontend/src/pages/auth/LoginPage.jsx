import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Mail, Lock, Building2, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const FloatingShape = ({ className, style }) => (
  <motion.div
    animate={{ y: [-20, 20, -20], rotate: [0, 5, -5, 0] }}
    transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
    className={`absolute rounded-full opacity-10 ${className}`}
    style={style}
  />
);

const LoginPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const { register, handleSubmit, formState: { errors }, setValue } = useForm({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      const user = await login(data.email, data.password);
      toast.success(`Welcome back, ${user.name}!`);
      navigate(user.role === 'admin' ? '/admin' : '/employee');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Invalid credentials. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const fillDemo = (role) => {
    if (role === 'admin') {
      setValue('email', 'admin@company.com');
      setValue('password', 'Admin@123');
    } else {
      setValue('email', 'arjun.sharma@company.com');
      setValue('password', 'Employee@123');
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4"
      style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)' }}>
      
      {/* Animated background shapes */}
      <FloatingShape className="w-72 h-72 bg-white top-10 -left-20" />
      <FloatingShape className="w-48 h-48 bg-yellow-300 bottom-10 -right-10" style={{ animationDelay: '2s' }} />
      <FloatingShape className="w-32 h-32 bg-pink-300 top-1/2 right-20" style={{ animationDelay: '4s' }} />

      {/* Grid pattern */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)',
        backgroundSize: '30px 30px'
      }} />

      <div className="relative w-full max-w-5xl grid lg:grid-cols-2 gap-8 items-center z-10">
        {/* Left: Branding */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7 }}
          className="hidden lg:block text-white"
        >
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">LeaveMS</h1>
              <p className="text-white/70 text-sm">Leave Management System</p>
            </div>
          </div>

          <h2 className="text-4xl font-bold leading-tight mb-4">
            Streamline Your<br />
            <span className="text-yellow-300">Leave Management</span>
          </h2>
          <p className="text-white/80 text-lg leading-relaxed mb-8">
            A modern, efficient platform for managing employee leaves, 
            approvals, and workforce planning.
          </p>

          {/* Feature pills */}
          <div className="space-y-3">
            {['Real-time leave tracking', 'Automated balance calculations', 'Department-wise analytics', 'Role-based access control'].map((f, i) => (
              <motion.div
                key={f}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                className="flex items-center gap-3 text-white/90"
              >
                <div className="w-5 h-5 rounded-full bg-green-400 flex items-center justify-center flex-shrink-0">
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                {f}
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Right: Login Form */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="bg-white rounded-3xl shadow-2xl p-8"
        >
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-3 mb-6 justify-center">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">LeaveMS</span>
          </div>

          <div className="mb-6">
            <h3 className="text-2xl font-bold text-gray-900 mb-1">Welcome back!</h3>
            <p className="text-gray-500 text-sm">Sign in to your account to continue</p>
          </div>

          {/* Demo buttons */}
          <div className="flex gap-2 mb-6">
            <button
              type="button"
              onClick={() => fillDemo('admin')}
              className="flex-1 py-2 px-3 text-xs font-medium rounded-xl bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 transition-colors"
            >
              Admin
            </button>
            <button
              type="button"
              onClick={() => fillDemo('employee')}
              className="flex-1 py-2 px-3 text-xs font-medium rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 transition-colors"
            >
              Employee
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  {...register('email')}
                  type="email"
                  placeholder="you@company.com"
                  className={`w-full pl-10 pr-4 py-3 rounded-xl border text-sm transition-colors outline-none
                    ${errors.email ? 'border-red-300 bg-red-50 focus:border-red-400' : 'border-gray-200 focus:border-indigo-400 bg-gray-50 focus:bg-white'}`}
                />
              </div>
              {errors.email && <p className="mt-1.5 text-xs text-red-500">{errors.email.message}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  className={`w-full pl-10 pr-11 py-3 rounded-xl border text-sm transition-colors outline-none
                    ${errors.password ? 'border-red-300 bg-red-50 focus:border-red-400' : 'border-gray-200 focus:border-indigo-400 bg-gray-50 focus:bg-white'}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="mt-1.5 text-xs text-red-500">{errors.password.message}</p>}
            </div>

            {/* Submit */}
            <motion.button
              type="submit"
              disabled={isLoading}
              whileTap={{ scale: 0.98 }}
              className="w-full py-3 px-6 rounded-xl font-semibold text-white text-sm flex items-center justify-center gap-2 disabled:opacity-60 transition-all shadow-lg shadow-indigo-200"
              style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </motion.button>
          </form>

          {/* Registration Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              New employee or company admin?{' '}
              <Link to="/register" className="font-semibold text-indigo-600 hover:text-indigo-800 hover:underline">
                Register account
              </Link>
            </p>
          </div>

          <p className="mt-4 text-center text-xs text-gray-400">
            Secured with industry-standard encryption & JWT authentication
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default LoginPage;
