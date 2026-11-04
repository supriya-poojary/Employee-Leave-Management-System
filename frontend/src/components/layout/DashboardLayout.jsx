import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Sidebar from './Sidebar';
import Header from './Header';

const pageTitles = {
  '/employee': { title: 'Dashboard', subtitle: 'Welcome back! Here\'s your leave overview.' },
  '/employee/apply': { title: 'Apply for Leave', subtitle: 'Submit a new leave application' },
  '/employee/history': { title: 'Leave History', subtitle: 'View all your leave applications' },
  '/employee/balance': { title: 'Leave Balance', subtitle: 'Track your leave balances' },
  '/employee/profile': { title: 'My Profile', subtitle: 'View and update your profile' },
  '/admin': { title: 'Admin Dashboard', subtitle: 'Company leave management overview' },
  '/admin/pending': { title: 'Pending Requests', subtitle: 'Review and act on pending leave requests' },
  '/admin/leaves': { title: 'All Leave Requests', subtitle: 'Complete leave application history' },
  '/admin/employees': { title: 'Employee Management', subtitle: 'Manage company employees' },
  '/admin/analytics': { title: 'Analytics', subtitle: 'Leave trends and department insights' },
};

const DashboardLayout = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const pageInfo = pageTitles[location.pathname] || { title: 'Leave Management', subtitle: '' };

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar
        isCollapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((v) => !v)}
        isMobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
      />

      <motion.div
        animate={{ marginLeft: sidebarCollapsed ? 72 : 240 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="hidden lg:block"
        style={{ marginLeft: 240 }}
      >
        <Header
          onMobileMenuOpen={() => setMobileMenuOpen(true)}
          title={pageInfo.title}
          subtitle={pageInfo.subtitle}
        />
        <main className="p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </motion.div>

      {/* Mobile layout */}
      <div className="lg:hidden">
        <Header
          onMobileMenuOpen={() => setMobileMenuOpen(true)}
          title={pageInfo.title}
          subtitle={pageInfo.subtitle}
        />
        <main className="p-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;

