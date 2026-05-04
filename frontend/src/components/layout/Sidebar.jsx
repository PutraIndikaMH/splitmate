import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import NewExpenseModal from '../ui/NewExpenseModal';

const Sidebar = ({ isOpen = false, onClose }) => {
  const location = useLocation();
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);

  const navItems = [
    { path: '/dashboard', icon: 'dashboard', label: 'Dashboard' },
    { path: '/groups', icon: 'group', label: 'Groups' },
    { path: '/friends', icon: 'person', label: 'Friends' },
    { path: '/activity', icon: 'notifications_active', label: 'Activity' },
    { path: '/insights', icon: 'insights', label: 'Insights' },
    { path: '/settings', icon: 'settings', label: 'Settings' },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 md:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      <aside className={`h-screen w-64 fixed z-50 left-0 top-0 glass-card-strong flex flex-col gap-2 p-4 pt-0 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } md:translate-x-0`}>
        {/* Mobile close button */}
        <div className="md:hidden flex justify-end pt-3">
          <button 
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-surface-container text-on-surface-variant transition-colors"
            aria-label="Close menu"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Brand */}
        <div className="h-16 flex items-center gap-3 px-4 mb-6 md:mt-0 -mt-2">
          <img src="/logo.png" alt="SplitMate Logo" className="w-9 h-9 object-contain" />
          <div>
            <h2 className="text-xl font-black text-primary font-headline leading-tight">SplitMate</h2>
            <p className="text-[10px] text-on-surface-variant font-semibold tracking-wide uppercase font-headline">Precision Finance</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || 
              (item.path === '/groups' && location.pathname.startsWith('/groups/'));
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={`relative flex items-center gap-3 px-4 py-3 rounded-xl font-headline text-sm font-semibold transition-all duration-200 cursor-pointer active:scale-[0.98] ${
                  isActive
                    ? 'nav-active-bar bg-primary/8 text-primary shadow-sm'
                    : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface hover:translate-x-1'
                }`}
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
                >
                  {item.icon}
                </span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* New Expense CTA */}
        <div className="mt-auto p-4">
          <button 
            onClick={() => setIsExpenseModalOpen(true)}
            className="w-full py-3.5 bg-gradient-to-r from-primary to-primary-container text-white rounded-2xl font-bold text-sm shadow-lg shadow-primary/20 active:scale-[0.97] transition-all hover:shadow-xl hover:shadow-primary/30 flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-lg">add_circle</span>
            New Expense
          </button>
        </div>
      </aside>

      {/* Modal component rendered outside the sidebar for better z-index stacking */}
      <NewExpenseModal 
        isOpen={isExpenseModalOpen} 
        onClose={() => setIsExpenseModalOpen(false)} 
      />
    </>
  );
};

export default Sidebar;
