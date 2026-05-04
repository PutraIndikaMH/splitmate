import React, { useContext, useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import api from '../../services/api';

const TopAppBar = ({ searchPlaceholder = "Search...", onMenuClick }) => {
  const { user } = useContext(AuthContext);
  const location = useLocation();
  const [notifications, setNotifications] = useState([]);

  const avatarLetter = user?.name ? user.name.charAt(0).toUpperCase() : '?';
  const isOnActivity = location.pathname === '/activity';

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await api.get('/users/me/notifications');
        setNotifications(res.data || []);
      } catch (e) {
        if (import.meta.env.DEV) console.error(e);
      }
    };
    fetchNotifications();
    // Refresh every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const urgentNotifications = notifications.filter(n => 
    ['group_invite', 'settlement_pending', 'buzzed_reminder'].includes(n.type)
  );

  return (
    <header className="fixed top-0 w-full z-40 glass-nav md:w-[calc(100%-16rem)] md:left-64">
      <div className="flex justify-between items-center px-6 h-16 w-full ml-auto md:ml-0">

        {/* Left Side: Mobile Menu & Search Bar */}
        <div className="flex items-center flex-1 gap-4">
          <button
            className="md:hidden text-primary flex items-center justify-center"
            onClick={onMenuClick}
            aria-label="Open menu"
          >
            <span className="material-symbols-outlined text-2xl">menu</span>
          </button>

          <div className="hidden sm:flex items-center bg-surface-container/60 px-4 py-2 rounded-2xl w-full max-w-md border border-transparent focus-within:border-primary/30 focus-within:bg-surface-container-lowest transition-all duration-300">
            <span className="material-symbols-outlined text-on-surface-variant/50 text-lg mr-2">search</span>
            <input
              className="bg-transparent border-none focus:ring-0 text-sm w-full font-headline font-medium placeholder-on-surface-variant/40 outline-none text-on-surface"
              placeholder={searchPlaceholder}
              type="text"
            />
          </div>
        </div>

        {/* Right Side: Icons & Avatar */}
        <div className="flex items-center gap-1 sm:gap-2 ml-4">
          <Link to="/activity" className="relative w-9 h-9 flex items-center justify-center text-on-surface-variant/60 hover:text-primary hover:bg-primary/5 rounded-xl transition-all active:scale-95 duration-200">
            <span className="material-symbols-outlined text-[22px]">notifications</span>
            {!isOnActivity && urgentNotifications.length > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-error rounded-full badge-pulse"></span>
            )}
          </Link>

          <Link to="/settings" className="w-9 h-9 flex items-center justify-center text-on-surface-variant/60 hover:text-primary hover:bg-primary/5 rounded-xl transition-all active:scale-95 duration-200 hidden sm:flex">
            <span className="material-symbols-outlined text-[22px]">help</span>
          </Link>

          <div className="h-7 w-px bg-outline-variant/20 mx-1 hidden sm:block"></div>

          <Link to="/profile" className="flex items-center gap-2.5 active:scale-95 duration-200 group outline-none">
            {user?.avatar_url ? (
              <img
                alt="User profile"
                className="w-9 h-9 rounded-full object-cover border-2 border-white shadow-sm ring-2 ring-primary/10 group-hover:ring-primary/30 transition-all"
                src={user.avatar_url}
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-primary-container text-white flex items-center justify-center text-sm font-bold border-2 border-white shadow-sm ring-2 ring-primary/10 group-hover:ring-primary/30 transition-all">
                {avatarLetter}
              </div>
            )}
            <span className="hidden md:block font-headline text-sm font-bold text-on-surface group-hover:text-primary transition-colors">
              {user?.name || '—'}
            </span>
          </Link>
        </div>

      </div>
    </header>
  );
};

export default TopAppBar;
