import React from 'react';
import { motion } from 'framer-motion';

const LoadingSpinner = ({ size = 'md', color = 'indigo' }) => {
  const sizes = { sm: 'w-5 h-5', md: 'w-8 h-8', lg: 'w-12 h-12', xl: 'w-16 h-16' };
  const colors = {
    indigo: 'border-indigo-600',
    white: 'border-white',
    purple: 'border-purple-600',
  };

  return (
    <div className="flex items-center justify-center">
      <motion.div
        className={`${sizes[size]} rounded-full border-2 border-gray-200 ${colors[color]} border-t-transparent`}
        animate={{ rotate: 360 }}
        transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
      />
    </div>
  );
};

export default LoadingSpinner;

