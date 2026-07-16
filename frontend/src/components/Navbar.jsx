import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, LogOut, Briefcase, FileText, User, LayoutDashboard, GraduationCap, Sun, Moon } from 'lucide-react';
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
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

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
    : user?.role === 'placementCell'
    ? [
        { name: 'Dashboard', path: '/placement/dashboard', icon: LayoutDashboard },
      ]
    : user?.role === 'admin'
    ? [
        { name: 'Admin Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
      ]
    : [
        { name: 'Job Drives', path: '/jobs', icon: Briefcase },
        { name: 'My Applications', path: '/applications', icon: FileText },
        { name: 'My Profile', path: '/profile', icon: User },
      ];

  return (
    <nav className="sticky top-0 z-40 bg-[#0B3D91] border-b border-[#082F70]/40 shadow-md">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-10">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <div className="flex items-center">
            <Link to={user?.role === 'company' ? '/recruiter/dashboard' : user?.role === 'placementCell' ? '/placement/dashboard' : user?.role === 'admin' ? '/admin/dashboard' : user?.role === 'student' ? '/jobs' : '/'} className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-[#F5A623] to-[#E0921B] flex items-center justify-center shadow-md">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <span className="font-extrabold text-xl tracking-tight text-white">
                Placement<span className="text-[#F5A623]">Connect</span>
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
                        ? 'bg-[#082F70] text-[#F5A623] border border-[#F5A623]/20 shadow-sm'
                        : 'text-slate-100 hover:text-white hover:bg-[#082F70]/50 border border-transparent'
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
                <button
                  onClick={toggleTheme}
                  className="p-2.5 text-slate-200 hover:text-[#F5A623] hover:bg-[#082F70] rounded-xl transition-all duration-200"
                  title="Toggle Theme"
                >
                  {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>
                <NotificationBell />
                <div className="h-8 w-px bg-white/10" />
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-[#F5A623] to-[#E0921B] flex items-center justify-center font-bold text-sm text-white ring-2 ring-[#F5A623]/60 shadow-md">
                    {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-white max-w-[130px] truncate leading-tight">{user.name}</span>
                    <span className="text-[10px] text-slate-300 font-mono mt-0.5">{user.role === 'company' ? 'Recruiter' : user.role === 'placementCell' ? 'T&P Cell' : user.role === 'admin' ? 'Admin' : user.rollNumber}</span>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2.5 text-slate-200 hover:text-rose-400 hover:bg-[#082F70] rounded-xl transition-all duration-250"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <button
                  onClick={toggleTheme}
                  className="p-2.5 text-slate-200 hover:text-[#F5A623] hover:bg-[#082F70] rounded-xl transition-all duration-200 mr-1"
                  title="Toggle Theme"
                >
                  {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>
                <Link
                  to="/login"
                  className="text-sm font-semibold text-slate-200 hover:text-white px-4 py-2.5 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  className="text-sm font-semibold bg-[#F5A623] hover:bg-[#E0921B] text-white px-5 py-2.5 rounded-xl transition-all duration-200 shadow-sm"
                >
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile hamburger button */}
          <div className="flex items-center space-x-3 md:hidden">
            <button
              onClick={toggleTheme}
              className="p-2.5 text-slate-100 hover:text-[#F5A623] hover:bg-[#082F70] rounded-xl transition-all duration-200"
              title="Toggle Theme"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            {user && <NotificationBell />}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2.5 rounded-xl text-slate-100 hover:text-white hover:bg-[#082F70] focus:outline-none transition-colors"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && user && (
        <div className="md:hidden bg-[#0B3D91] border-b border-[#082F70] shadow-xl animate-in slide-in-from-top-4 duration-200">
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
                      ? 'bg-[#082F70] text-[#F5A623] border border-[#F5A623]/20'
                      : 'text-slate-100 hover:text-white hover:bg-[#082F70]/40'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{link.name}</span>
                </Link>
              );
            })}
            <div className="border-t border-[#082F70] my-3 pt-3 px-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-[#F5A623] to-[#E0921B] flex items-center justify-center font-bold text-white shadow">
                  {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-white">{user.name}</span>
                  <span className="text-xs text-slate-300 font-mono">{user.role === 'admin' ? 'Admin' : user.role === 'placementCell' ? 'T&P Cell' : user.role === 'company' ? 'Recruiter' : user.rollNumber}</span>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsOpen(false);
                  handleLogout();
                }}
                className="flex items-center space-x-1.5 px-3 py-2 rounded-xl text-rose-400 hover:bg-[#082F70] transition-all font-bold text-sm"
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
