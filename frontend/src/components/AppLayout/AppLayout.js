import React, { useMemo } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { ArrowLeftRight, Heart, LayoutDashboard, LogOut, PawPrint, Search, Shield, UserRound } from 'lucide-react';
import { clearAuthStorage, getStoredUser, hasRole } from '../../utils/auth';
import './AppLayout.css';

const baseNavItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/browse', label: 'Browse', icon: Search },
  { to: '/my-pets', label: 'My Pets', icon: Heart },
  { to: '/trades', label: 'Trades', icon: ArrowLeftRight },
  { to: '/profile', label: 'Profile', icon: UserRound },
];

function AppLayout({ children }) {
  const navigate = useNavigate();
  const user = getStoredUser();
  const isAdmin = hasRole('ADMIN');

  const initials = useMemo(() => {
    const fullName = user?.fullName || 'PetMarket';
    return fullName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0].toUpperCase())
      .join('');
  }, [user?.fullName]);
  const profileImageUrl = user?.profileImageUrl;

  const navItems = isAdmin
    ? [...baseNavItems, { to: '/admin', label: 'Admin', icon: Shield }]
    : baseNavItems;

  const onLogout = () => {
    clearAuthStorage();
    navigate('/login', { replace: true });
  };

  return (
    <div className="app-shell">
      <header className="app-topbar">
        <Link to="/dashboard" className="app-brand" aria-label="PetMarket home">
          <span className="app-brand-mark"><PawPrint size={16} /></span>
          <span>PetMarket</span>
        </Link>

        <nav className="app-nav" aria-label="Main navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `app-nav-item ${isActive ? 'active' : ''}`}
              >
                <Icon size={14} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="app-user">
          <div className="app-avatar">
            {profileImageUrl ? (
              <img src={profileImageUrl} alt={user?.fullName || 'Profile'} />
            ) : (
              initials || 'PM'
            )}
          </div>
          <div className="app-user-meta">
            <strong>{user?.fullName || 'User'}</strong>
            <span>{isAdmin ? 'Admin' : 'Member'}</span>
          </div>
          <button type="button" className="app-logout" onClick={onLogout}>
            <LogOut size={14} />
          </button>
        </div>
      </header>

      <main className="app-content">{children}</main>
    </div>
  );
}

export default AppLayout;
