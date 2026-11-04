import React from 'react';

const statusConfig = {
  pending: { label: 'Pending', className: 'bg-amber-100 text-amber-700 border border-amber-200' },
  approved: { label: 'Approved', className: 'bg-green-100 text-green-700 border border-green-200' },
  rejected: { label: 'Rejected', className: 'bg-red-100 text-red-700 border border-red-200' },
  cancelled: { label: 'Cancelled', className: 'bg-gray-100 text-gray-600 border border-gray-200' },
};

const leaveTypeConfig = {
  casual: { label: 'Casual', className: 'bg-blue-100 text-blue-700 border border-blue-200' },
  sick: { label: 'Sick', className: 'bg-purple-100 text-purple-700 border border-purple-200' },
  earned: { label: 'Earned', className: 'bg-teal-100 text-teal-700 border border-teal-200' },
  unpaid: { label: 'Unpaid', className: 'bg-orange-100 text-orange-700 border border-orange-200' },
};

export const StatusBadge = ({ status }) => {
  const config = statusConfig[status] || { label: status, className: 'bg-gray-100 text-gray-600' };
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  );
};

export const LeaveTypeBadge = ({ type }) => {
  const config = leaveTypeConfig[type] || { label: type, className: 'bg-gray-100 text-gray-600' };
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  );
};

export const Badge = ({ children, variant = 'default', className = '' }) => {
  const variants = {
    default: 'bg-gray-100 text-gray-700',
    primary: 'bg-indigo-100 text-indigo-700',
    success: 'bg-green-100 text-green-700',
    danger: 'bg-red-100 text-red-700',
    warning: 'bg-amber-100 text-amber-700',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
};

