import React from 'react';
import { motion } from 'framer-motion';

const SkeletonCard = ({ lines = 3, height = 'h-4' }) => (
  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 animate-pulse">
    <div className="h-5 bg-gray-200 rounded w-1/3 mb-4" />
    {Array.from({ length: lines }).map((_, i) => (
      <div key={i} className={`${height} bg-gray-200 rounded mb-2 ${i === lines - 1 ? 'w-2/3' : 'w-full'}`} />
    ))}
  </div>
);

export const SkeletonTable = ({ rows = 5 }) => (
  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-pulse">
    <div className="p-6 border-b border-gray-100">
      <div className="h-5 bg-gray-200 rounded w-1/4" />
    </div>
    <div className="divide-y divide-gray-100">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="p-4 flex gap-4">
          <div className="w-10 h-10 bg-gray-200 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-1/4" />
            <div className="h-3 bg-gray-200 rounded w-1/3" />
          </div>
          <div className="w-20 h-6 bg-gray-200 rounded-full" />
        </div>
      ))}
    </div>
  </div>
);

export const SkeletonStats = () => (
  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
    {Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 animate-pulse">
        <div className="w-12 h-12 bg-gray-200 rounded-xl mb-4" />
        <div className="h-7 bg-gray-200 rounded w-1/2 mb-2" />
        <div className="h-4 bg-gray-200 rounded w-3/4" />
      </div>
    ))}
  </div>
);

export default SkeletonCard;

