import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, LogOut, Briefcase, FileText, User, LayoutDashboard } from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { clearUser } from '../redux/authSlice';
import api from '../utils/api';
import NotificationBell from './NotificationBell';

const Navbar = () => {
  const user = useSelector((state) => state.auth.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await api.post('/api/auth/logout');
    } catch (err) {
      console.error("Logout failed:", err);
    }
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    dispatch(clearUser());
    navigate('/login');
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  const navLinks = user?.role === 'company'
    ? [
        { name: 'Dashboard', path: '/recruiter/dashboard', icon: LayoutDashboard },
      ]
    : [
        { name: 'Job Drives', path: '/', icon: Briefcase },
        { name: 'My Applications', path: '/applications', icon: FileText },
        { name: 'My Profile', path: '/profile', icon: User },
      ];

  return (
    <nav className="sticky top-0 z-40 bg-white/85 backdrop-blur-md border-b border-slate-200/80 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-10">
        <div className="flex items-center justify-between h-20"> {/* Increased navbar height for breathing room */}
          {/* Logo */}
          <div className="flex items-center">
            <Link to={user?.role === 'company' ? '/recruiter/dashboard' : '/'} className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-555 flex items-center justify-center shadow-md shadow-emerald-600/10">
                <LayoutDashboard className="w-5 h-5 text-white" />
              </div>
              <span className="font-extrabold text-xl tracking-tight text-slate-800">
                Placement<span className="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">Connect</span>
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          {user && (
            <div className="hidden md:flex items-center space-x-2">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const active = isActive(link.path);
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                      active
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/50 shadow-sm shadow-emerald-500/5'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60 border border-transparent'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{link.name}</span>
                  </Link>
                );
              })}
            </div>
          )}

          {/* User Profile & Actions */}
          <div className="hidden md:flex items-center space-x-5">
            {user ? (
              <div className="flex items-center space-x-4">
                <NotificationBell />
                <div className="h-8 w-px bg-slate-200" />
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 rounded-full bg-emerald-600 flex items-center justify-center font-bold text-sm text-white shadow-md ring-2 ring-slate-100">
                    {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-slate-800 max-w-[130px] truncate leading-tight">{user.name}</span>
                    <span className="text-[10px] text-slate-400 font-mono mt-0.5">{user.role === 'company' ? 'Recruiter' : user.rollNumber}</span>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2.5 text-slate-550 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all duration-250"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  to="/login"
                  className="text-sm font-semibold text-slate-600 hover:text-slate-900 px-4 py-2.5 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  className="text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-emerald-600/20"
                >
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile hamburger button */}
          <div className="flex items-center space-x-3 md:hidden">
            {user && <NotificationBell />}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2.5 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 focus:outline-none transition-colors"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && user && (
        <div className="md:hidden bg-white border-b border-slate-200 shadow-xl animate-in slide-in-from-top-4 duration-200">
          <div className="px-3 pt-3 pb-4 space-y-1.5">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const active = isActive(link.path);
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center space-x-3 px-4 py-3.5 rounded-xl text-base font-semibold transition-all ${
                    active
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{link.name}</span>
                </Link>
              );
            })}
            <div className="border-t border-slate-100 my-3 pt-3 px-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 rounded-full bg-emerald-600 flex items-center justify-center font-bold text-white shadow">
                  {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-slate-800">{user.name}</span>
                  <span className="text-xs text-slate-400 font-mono">{user.rollNumber}</span>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsOpen(false);
                  handleLogout();
                }}
                className="flex items-center space-x-1.5 px-3 py-2 rounded-xl text-rose-500 hover:bg-rose-50 transition-all font-bold text-sm"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
