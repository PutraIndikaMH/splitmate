import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const BottomNav = ({ onAddClick }) => {
  const location = useLocation();

  const navItems = [
    { path: '/dashboard', icon: 'dashboard', label: 'Dash' },
    { path: '/groups', icon: 'group', label: 'Groups' },
    null, // placeholder for center FAB
    { path: '/insights', icon: 'insights', label: 'Insights' },
    { path: '/profile', icon: 'person', label: 'Profile' },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 glass-nav px-4 py-2.5 flex justify-between items-center z-50" style={{ paddingBottom: 'calc(0.625rem + env(safe-area-inset-bottom))' }}>
      {navItems.map((item, index) => {
        if (!item) {
          return (
            <button
              key="fab"
              onClick={onAddClick}
              className="w-13 h-13 bg-gradient-to-br from-primary to-primary-container rounded-2xl flex items-center justify-center text-white -mt-7 shadow-lg fab-glow active:scale-90 transition-transform"
            >
              <span className="material-symbols-outlined text-2xl">add</span>
            </button>
          );
        }

        const isActive = location.pathname === item.path;
        return (
          <Link
            key={item.path}
            to={item.path}
            className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-2xl transition-all duration-200 ${
              isActive 
                ? 'text-primary' 
                : 'text-on-surface-variant/50'
            }`}
          >
            {isActive && (
              <span className="absolute -top-0 w-8 h-1 bg-primary rounded-full animate-in"></span>
            )}
            <span
              className={`material-symbols-outlined text-[22px] transition-transform ${isActive ? 'scale-110' : ''}`}
              style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
            >
              {item.icon}
            </span>
            <span className={`text-[10px] font-bold font-headline ${isActive ? 'text-primary' : ''}`}>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
};

export default BottomNav;
