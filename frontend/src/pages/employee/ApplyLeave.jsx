import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Calendar, FileText, Clock, Upload, CheckCircle, AlertCircle } from 'lucide-react';
import { leaveAPI } from '../../api';
import toast from 'react-hot-toast';
import { differenceInBusinessDays, parseISO, isWeekend, eachDayOfInterval, format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

const schema = z.object({
  leave_type: z.enum(['casual', 'sick', 'earned', 'unpaid'], { required_error: 'Please select a leave type' }),
  start_date: z.string().min(1, 'Start date is required'),
  end_date: z.string().min(1, 'End date is required'),
  reason: z.string().min(10, 'Reason must be at least 10 characters').max(500, 'Reason too long'),
}).refine((data) => {
  if (data.start_date && data.end_date) {
    return new Date(data.start_date) <= new Date(data.end_date);
  }
  return true;
}, { message: 'End date must be after start date', path: ['end_date'] });

const leaveTypes = [
  { value: 'casual', label: 'Casual Leave', desc: 'Personal matters and short breaks', color: 'blue', maxDays: 12 },
  { value: 'sick', label: 'Sick Leave', desc: 'Medical illness or injury', color: 'purple', maxDays: 12 },
  { value: 'earned', label: 'Earned Leave', desc: 'Annual planned vacation', color: 'teal', maxDays: 15 },
  { value: 'unpaid', label: 'Unpaid Leave', desc: 'Leave without pay', color: 'orange', maxDays: null },
];

const calculateDuration = (startDate, endDate) => {
  if (!startDate || !endDate) return 0;
  try {
    const days = eachDayOfInterval({ start: parseISO(startDate), end: parseISO(endDate) });
    return days.filter(day => !isWeekend(day)).length;
  } catch {
    return 0;
  }
};

const ApplyLeave = () => {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submittedId, setSubmittedId] = useState(null);
  const [file, setFile] = useState(null);
  const navigate = useNavigate();

  const { register, handleSubmit, watch, formState: { errors }, reset } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { leave_type: '', start_date: '', end_date: '', reason: '' },
  });

  const startDate = watch('start_date');
  const endDate = watch('end_date');
  const leaveType = watch('leave_type');
  const duration = calculateDuration(startDate, endDate);

  const today = format(new Date(), 'yyyy-MM-dd');

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const payload = { ...data };
      if (file) payload.document = file;
      const res = await leaveAPI.create(payload);
      setSubmittedId(res.data.data.application_id);
      setSubmitted(true);
      toast.success('Leave application submitted successfully!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit application');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md mx-auto text-center py-12"
      >
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Application Submitted!</h2>
        <p className="text-gray-500 mb-2">Your leave application has been submitted successfully.</p>
        <p className="text-sm text-indigo-600 font-medium mb-8">Application ID: {submittedId}</p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => { setSubmitted(false); reset(); setFile(null); }}
            className="px-6 py-2.5 text-sm font-medium text-indigo-700 bg-indigo-50 rounded-xl hover:bg-indigo-100 transition-colors"
          >
            Apply Another
          </button>
          <button
            onClick={() => navigate('/employee/history')}
            className="px-6 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-colors"
          >
            View History
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
      >
        <div className="p-6 border-b border-gray-100" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            New Leave Application
          </h2>
          <p className="text-white/70 text-sm mt-1">Fill in the details below to submit your leave request</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          {/* Leave Type */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">Leave Type *</label>
            <div className="grid grid-cols-2 gap-3">
              {leaveTypes.map((type) => {
                const isSelected = leaveType === type.value;
                const colorMap = {
                  blue: 'border-blue-400 bg-blue-50',
                  purple: 'border-purple-400 bg-purple-50',
                  teal: 'border-teal-400 bg-teal-50',
                  orange: 'border-orange-400 bg-orange-50',
                };
                return (
                  <label
                    key={type.value}
                    className={`relative flex flex-col cursor-pointer rounded-xl border-2 p-3 transition-all
                      ${isSelected ? colorMap[type.color] : 'border-gray-200 hover:border-gray-300 bg-gray-50'}`}
                  >
                    <input
                      {...register('leave_type')}
                      type="radio"
                      value={type.value}
                      className="sr-only"
                    />
                    <span className={`text-sm font-semibold ${isSelected ? 'text-gray-800' : 'text-gray-700'}`}>
                      {type.label}
                    </span>
                    <span className="text-xs text-gray-500 mt-0.5">{type.desc}</span>
                    {type.maxDays && (
                      <span className="text-xs text-gray-400 mt-1">Max: {type.maxDays} days/year</span>
                    )}
                    {isSelected && (
                      <div className="absolute top-2 right-2 w-5 h-5 bg-indigo-600 rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </label>
                );
              })}
            </div>
            {errors.leave_type && <p className="mt-1.5 text-xs text-red-500">{errors.leave_type.message}</p>}
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Start Date *</label>
              <input
                {...register('start_date')}
                type="date"
                min={today}
                className={`w-full px-3 py-2.5 rounded-xl border text-sm outline-none transition-colors
                  ${errors.start_date ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50 focus:border-indigo-400 focus:bg-white'}`}
              />
              {errors.start_date && <p className="mt-1 text-xs text-red-500">{errors.start_date.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">End Date *</label>
              <input
                {...register('end_date')}
                type="date"
                min={startDate || today}
                className={`w-full px-3 py-2.5 rounded-xl border text-sm outline-none transition-colors
                  ${errors.end_date ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50 focus:border-indigo-400 focus:bg-white'}`}
              />
              {errors.end_date && <p className="mt-1 text-xs text-red-500">{errors.end_date.message}</p>}
            </div>
          </div>

          {/* Duration display */}
          {duration > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="flex items-center gap-2 px-4 py-3 bg-indigo-50 rounded-xl border border-indigo-100"
            >
              <Clock className="w-4 h-4 text-indigo-600 flex-shrink-0" />
              <p className="text-sm text-indigo-700 font-medium">
                Duration: <strong>{duration} working day{duration !== 1 ? 's' : ''}</strong>
                {duration === 0 && ' (Weekends not counted)'}
              </p>
            </motion.div>
          )}

          {/* Reason */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Reason *</label>
            <textarea
              {...register('reason')}
              rows={4}
              placeholder="Please provide a detailed reason for your leave request..."
              className={`w-full px-3 py-2.5 rounded-xl border text-sm outline-none transition-colors resize-none
                ${errors.reason ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50 focus:border-indigo-400 focus:bg-white'}`}
            />
            {errors.reason && <p className="mt-1 text-xs text-red-500">{errors.reason.message}</p>}
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Supporting Document <span className="text-gray-400 font-normal">(Optional)</span>
            </label>
            <label className="flex items-center gap-3 px-4 py-3 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-indigo-300 hover:bg-indigo-50 transition-colors">
              <Upload className="w-5 h-5 text-gray-400" />
              <div className="flex-1 min-w-0">
                {file ? (
                  <p className="text-sm text-indigo-600 font-medium truncate">{file.name}</p>
                ) : (
                  <>
                    <p className="text-sm text-gray-600">Click to upload a document</p>
                    <p className="text-xs text-gray-400">PDF, JPG, PNG up to 5MB</p>
                  </>
                )}
              </div>
              <input
                type="file"
                className="sr-only"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </label>
          </div>

          {/* Submit */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigate('/employee')}
              className="flex-1 py-3 px-4 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <motion.button
              type="submit"
              disabled={loading}
              whileTap={{ scale: 0.98 }}
              className="flex-1 py-3 px-4 rounded-xl text-sm font-semibold text-white disabled:opacity-60 shadow-lg shadow-indigo-100 transition-all flex items-center justify-center gap-2"
              style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4" />
                  Submit Application
                </>
              )}
            </motion.button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default ApplyLeave;

