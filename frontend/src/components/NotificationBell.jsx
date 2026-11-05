import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Bell, Check, Info, Briefcase, Calendar } from 'lucide-react';
import { useSelector } from 'react-redux';
import api from '../utils/api';
import { playNotificationChime, playClickSound } from '../utils/audio';

const NotificationBell = () => {
  const user = useSelector((state) => state.auth.user);
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const fetchNotifications = useCallback(async (isInitial = false) => {
    if (user) {
      try {
        const response = await api.get('/api/notifications');
        const data = response.data;
        const mapped = (data.notifications || []).map(n => ({
          ...n,
          id: n._id
        }));
        
        setNotifications(prev => {
          if (!isInitial && mapped.length > prev.length) {
            const hasNewUnread = mapped.some(
              n => !n.read && !prev.some(existing => existing.id === n.id)
            );
            if (hasNewUnread) {
              playNotificationChime();
            }
          }
          return mapped;
        });
      } catch (err) {
        console.error("Failed to fetch notifications:", err);
      }
    }
  }, [user]);

  useEffect(() => {
    fetchNotifications(true);

    const interval = setInterval(() => fetchNotifications(false), 5000);

    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      clearInterval(interval);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [fetchNotifications]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkAllRead = async (e) => {
    e.stopPropagation();
    playClickSound();
    try {
      await api.put('/api/notifications/read-all');
      fetchNotifications(true);
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkOneRead = async (e, id) => {
    e.stopPropagation();
    e.preventDefault();
    playClickSound();
    try {
      await api.put(`/api/notifications/${id}/read`);
      fetchNotifications(true);
    } catch (err) {
      console.error(err);
    }
  };

  const getNotifIcon = (type) => {
    switch (type) {
      case 'success':
      case 'application_status':
        return <Check className="w-4 h-4 text-[#22C55E]" />;
      case 'job':
      case 'job_post':
        return <Briefcase className="w-4 h-4 text-[#22C55E]" />;
      case 'calendar':
      case 'status':
      case 'schedule_propose':
      case 'announcement':
        return <Calendar className="w-4 h-4 text-[#0B3D91]" />;
      default:
        return <Info className="w-4 h-4 text-[#0B3D91]" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => { playClickSound(); setIsOpen(!isOpen); }}
        className="relative p-2.5 text-[#E9D5FF] hover:text-white rounded-full hover:bg-[#1E4FA8]/30 transition-all duration-200 focus:outline-none"
        aria-label="View notifications"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#22C55E] text-[10px] font-bold text-white ring-2 ring-[#6D5BD0] animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 bg-white border border-[#E5E7EB] rounded-2xl shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-3 duration-200">
          <div className="flex items-center justify-between p-4.5 border-b border-[#E5E7EB]">
            <h3 className="font-bold text-[#111827] text-sm">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs text-[#0B3D91] hover:text-[#1E4FA8] font-semibold transition-colors"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-72 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-10 text-center text-[#94A3B8] text-xs">
                No notifications yet
              </div>
            ) : (
              notifications.slice(0, 4).map((notif) => (
                <div
                  key={notif.id}
                  className={`p-4.5 border-b border-[#E5E7EB] flex gap-3.5 hover:bg-[#F8FAFC] transition-colors ${
                    !notif.read ? 'bg-[#0B3D91]/5' : ''
                  }`}
                >
                  <div className="mt-0.5 flex-shrink-0">
                    <div className="p-2 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB]">
                      {getNotifIcon(notif.type)}
                    </div>
                  </div>
                  <div className="flex-grow min-w-0 space-y-1">
                    <p className={`text-xs text-[#4B5563] leading-relaxed ${!notif.read ? 'font-semibold text-[#111827]' : ''}`}>
                      {notif.message}
                    </p>
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-[10px] text-[#94A3B8] font-semibold">
                        {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {!notif.read && (
                        <button
                          onClick={(e) => handleMarkOneRead(e, notif.id)}
                          className="text-[10px] text-[#0B3D91] hover:text-[#1E4FA8] font-bold"
                        >
                          Mark read
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <Link
            to="/notifications"
            onClick={() => setIsOpen(false)}
            className="block text-center py-4 text-xs font-bold text-[#94A3B8] hover:text-[#0B3D91] bg-[#F8FAFC] hover:bg-[#E5E7EB]/50 border-t border-[#E5E7EB] transition-colors"
          >
            See all notifications
          </Link>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
