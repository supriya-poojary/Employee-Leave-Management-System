import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Calendar, FileText, Users, Settings, LogOut,
  ChevronLeft, ChevronRight, Building2, Bell, User, Clock,
  TrendingUp, Menu, X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const employeeNavItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/employee' },
  { icon: Calendar, label: 'Apply Leave', path: '/employee/apply' },
  { icon: FileText, label: 'Leave History', path: '/employee/history' },
  { icon: TrendingUp, label: 'Leave Balance', path: '/employee/balance' },
  { icon: User, label: 'My Profile', path: '/employee/profile' },
];

const adminNavItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/admin' },
  { icon: Clock, label: 'Pending Requests', path: '/admin/pending' },
  { icon: FileText, label: 'All Requests', path: '/admin/leaves' },
  { icon: Users, label: 'Employees', path: '/admin/employees' },
  { icon: TrendingUp, label: 'Analytics', path: '/admin/analytics' },
];

const Sidebar = ({ isCollapsed, onToggle, isMobileOpen, onMobileClose }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'admin';
  const navItems = isAdmin ? adminNavItems : employeeNavItems;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={`flex items-center gap-3 p-6 border-b border-white/10 ${isCollapsed ? 'justify-center' : ''}`}>
        <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
          <Building2 className="w-5 h-5 text-white" />
        </div>
        <AnimatePresence>
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              className="overflow-hidden"
            >
              <p className="text-white font-bold text-sm leading-tight">LeaveMS</p>
              <p className="text-white/60 text-xs">Management System</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Nav items */}
      <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/admin' || item.path === '/employee'}
            onClick={onMobileClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group
              ${isActive
                ? 'bg-white/20 text-white shadow-sm'
                : 'text-white/70 hover:bg-white/10 hover:text-white'
              }
              ${isCollapsed ? 'justify-center' : ''}`
            }
          >
            {({ isActive }) => (
              <>
                <item.icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-white' : 'text-white/70 group-hover:text-white'}`} />
                <AnimatePresence>
                  {!isCollapsed && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      className="text-sm font-medium overflow-hidden whitespace-nowrap"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User info and logout */}
      <div className="p-3 border-t border-white/10">
        <div className={`flex items-center gap-3 px-3 py-2 mb-2 ${isCollapsed ? 'justify-center' : ''}`}>
          <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-bold">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </span>
          </div>
          <AnimatePresence>
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="overflow-hidden flex-1 min-w-0"
              >
                <p className="text-white text-xs font-medium truncate">{user?.name}</p>
                <p className="text-white/60 text-xs truncate capitalize">{user?.role}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <button
          onClick={handleLogout}
          className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-white/70 hover:bg-red-500/20 hover:text-red-300 transition-all duration-200 ${isCollapsed ? 'justify-center' : ''}`}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          <AnimatePresence>
            {!isCollapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="text-sm font-medium overflow-hidden whitespace-nowrap"
              >
                Logout
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <motion.aside
        animate={{ width: isCollapsed ? 72 : 240 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="hidden lg:flex flex-col fixed top-0 left-0 h-screen z-30 overflow-hidden"
        style={{ background: 'linear-gradient(180deg, #4f46e5 0%, #7c3aed 100%)' }}
      >
        <SidebarContent />
        {/* Toggle button */}
        <button
          onClick={onToggle}
          className="absolute -right-3 top-20 bg-white rounded-full p-1 shadow-lg border border-gray-200 z-10"
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4 text-indigo-600" />
          ) : (
            <ChevronLeft className="w-4 h-4 text-indigo-600" />
          )}
        </button>
      </motion.aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isMobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              onClick={onMobileClose}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 30 }}
              className="fixed top-0 left-0 h-screen w-64 z-50 lg:hidden overflow-hidden"
              style={{ background: 'linear-gradient(180deg, #4f46e5 0%, #7c3aed 100%)' }}
            >
              <SidebarContent />
              <button
                onClick={onMobileClose}
                className="absolute top-4 right-4 p-2 rounded-xl bg-white/10 text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Sidebar;

