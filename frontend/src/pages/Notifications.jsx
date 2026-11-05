import React, { useState, useEffect, useCallback } from 'react';
import { 
  Check, Trash2, MailOpen, Info, Clock, BellRing, Send,
  Briefcase, Bell, BellOff, CheckCircle2
} from 'lucide-react';
import { useSelector } from 'react-redux';
import api from '../utils/api';
import { playNotificationChime as playNotificationSound, playClickSound } from '../utils/audio';

const Notifications = () => {
  const user = useSelector((state) => state.auth.user);
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState('all'); // all | unread

  const fetchNotifs = useCallback(async (isInitial = false) => {
    if (!user) return;
    try {
      const response = await api.get('/api/notifications');
      const data = response.data;
      const mapped = (data.notifications || []).map(n => ({
        ...n,
        id: n._id
      }));

      // Functional state comparison to avoid hooks stale closure issues
      setNotifications(prev => {
        if (!isInitial && mapped.length > prev.length) {
          const hasNewUnread = mapped.some(
            n => !n.read && !prev.some(existing => existing.id === n.id)
          );
          if (hasNewUnread) {
            playNotificationSound();
          }
        }
        return mapped;
      });
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    }
  }, [user]);

  useEffect(() => {
    fetchNotifs(true);
    const interval = setInterval(() => fetchNotifs(false), 5000);
    return () => clearInterval(interval);
  }, [fetchNotifs]);

  const handleMarkRead = async (id) => {
    playClickSound();
    try {
      await api.put(`/api/notifications/${id}/read`);
      fetchNotifs(true);
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    playClickSound();
    try {
      await api.put('/api/notifications/read-all');
      fetchNotifs(true);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = (id) => {
    playClickSound();
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const handleClearAll = () => {
    playClickSound();
    setNotifications([]);
  };

  const getNotifIcon = (type) => {
    switch (type) {
      case 'success':
      case 'application_status':
        return <CheckCircle2 className="w-4 h-4 text-[#22C55E]" />;
      case 'job':
      case 'job_post':
        return <Briefcase className="w-4 h-4 text-[#F59E0B]" />;
      case 'interview_scheduled':
        return <Clock className="w-4 h-4 text-[#8B5CF6]" />;
      case 'announcement':
        return <BellRing className="w-4 h-4 text-[#3B82F6]" />;
      case 'schedule_propose':
        return <Send className="w-4 h-4 text-[#EF4444]" />;
      default:
        return <Info className="w-4 h-4 text-[#6B7280]" />;
    }
  };

  const getNotifIconBg = (type) => {
    switch (type) {
      case 'success':
      case 'application_status':
        return 'bg-[#22C55E]/10 border-[#22C55E]/20';
      case 'job':
      case 'job_post':
        return 'bg-amber-50 border-amber-200';
      case 'interview_scheduled':
        return 'bg-purple-50 border-purple-200';
      case 'announcement':
        return 'bg-blue-50 border-blue-200';
      case 'schedule_propose':
        return 'bg-rose-50 border-rose-200';
      default:
        return 'bg-[#F8FAFC] border-[#E5E7EB]';
    }
  };

  const groupNotificationsByDate = (notifArray) => {
    const today = [];
    const yesterday = [];
    const earlier = [];

    const todayDate = new Date();
    const yesterdayDate = new Date();
    yesterdayDate.setDate(todayDate.getDate() - 1);

    notifArray.forEach(n => {
      const nDate = new Date(n.createdAt);
      if (nDate.toDateString() === todayDate.toDateString()) {
        today.push(n);
      } else if (nDate.toDateString() === yesterdayDate.toDateString()) {
        yesterday.push(n);
      } else {
        earlier.push(n);
      }
    });

    return { today, yesterday, earlier };
  };

  const displayedNotifications = notifications.filter(n => {
    if (filter === 'unread') return !n.read;
    return true;
  });

  const { today, yesterday, earlier } = groupNotificationsByDate(displayedNotifications);
  const unreadCount = notifications.filter(n => !n.read).length;

  const renderNotificationGroup = (groupTitle, groupItems) => {
    if (groupItems.length === 0) return null;

    return (
      <div className="space-y-4">
        <h3 className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest px-2">
          {groupTitle}
        </h3>
        
        <div className="space-y-3.5">
          {groupItems.map((n) => (
            <div
              key={n.id}
              className={`p-5 rounded-2xl border flex gap-4 items-start transition-all duration-300 relative group shadow-sm hover:shadow-md hover:-translate-y-0.5 ${
                !n.read
                  ? 'bg-white border-[#22C55E]/30 ring-2 ring-[#22C55E]/5'
                  : 'bg-[#F8FAFC]/75 border-[#E5E7EB] opacity-80 hover:opacity-100'
              }`}
            >
              {/* Unread Glow Indicator */}
              {!n.read && (
                <span className="absolute left-3 top-3 h-2 w-2 rounded-full bg-[#22C55E] ring-4 ring-[#22C55E]/20 animate-pulse" />
              )}

              {/* Type Icon */}
              <div className="flex-shrink-0 mt-0.5">
                <div className={`p-2.5 rounded-xl border ${getNotifIconBg(n.type)} shadow-sm flex items-center justify-center`}>
                  {getNotifIcon(n.type)}
                </div>
              </div>

              {/* Message details */}
              <div className="flex-grow min-w-0 pr-12">
                <p className={`text-xs leading-relaxed ${!n.read ? 'font-bold text-[#111827]' : 'font-medium text-[#4B5563]'}`}>
                  {n.message}
                </p>
                <div className="flex items-center gap-1.5 mt-2.5">
                  <Clock className="w-3 h-3 text-[#94A3B8]" />
                  <span className="text-[9px] text-[#94A3B8] font-bold font-mono">
                    {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>

              {/* Action items overlay on hover */}
              <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-all duration-300">
                {!n.read && (
                  <button
                    onClick={() => handleMarkRead(n.id)}
                    className="p-2 bg-white hover:bg-[#F8FAFC] border border-[#E5E7EB] hover:border-[#22C55E]/40 text-[#4B5563] hover:text-[#22C55E] rounded-xl transition-all shadow-sm active:scale-95"
                    title="Mark as Read"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  onClick={() => handleDelete(n.id)}
                  className="p-2 bg-white hover:bg-[#F8FAFC] border border-[#E5E7EB] hover:border-rose-500/40 text-[#4B5563] hover:text-rose-600 rounded-xl transition-all shadow-sm active:scale-95"
                  title="Delete Notification"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8 animate-in fade-in duration-300 text-[#4B5563]">
      {/* Header Info Banner */}
      <div className="bg-[#4C1D95] text-white p-5 sm:p-8 rounded-3xl border border-[#5B21B6] shadow-xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[#22C55E]/15 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="relative z-10 space-y-2">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-[#5B21B6] border border-white/10 flex items-center justify-center">
              <Bell className="w-5 h-5 text-[#22C55E]" />
            </div>
            <div>
              <span className="text-[9px] font-bold text-white bg-[#5B21B6] border border-white/15 px-2.5 py-0.5 rounded-full uppercase tracking-wider">Alert Center</span>
              <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white mt-1">Notification Center</h1>
            </div>
          </div>
          <p className="text-purple-200 font-medium text-xs max-w-md">Review announcements, evaluation updates, and scheduler triggers with dynamic sound alerts.</p>
        </div>

        {/* Global actions */}
        <div className="relative z-10 flex gap-2 font-semibold self-end md:self-center">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="flex items-center gap-1.5 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/10 text-xs font-bold text-white rounded-xl transition-all shadow-sm active:scale-95"
            >
              <MailOpen className="w-3.5 h-3.5 text-[#22C55E]" />
              Mark All Read
            </button>
          )}
          {notifications.length > 0 && (
            <button
              onClick={handleClearAll}
              className="flex items-center gap-1.5 px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-xs font-bold text-rose-300 rounded-xl transition-all shadow-sm active:scale-95"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-450" />
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Main panel container */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 items-start">
        {/* Navigation Sidebar: Filter Toggles */}
        <div className="bg-white border border-[#E5E7EB] p-3 rounded-2xl space-y-1.5 shadow-sm">
          <button
            onClick={() => { playClickSound(); setFilter('all'); }}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
              filter === 'all'
                ? 'bg-[#22C55E] text-white shadow-md shadow-[#22C55E]/10'
                : 'text-[#94A3B8] hover:text-[#4B5563] hover:bg-[#F8FAFC]'
            }`}
          >
            <div className="flex items-center gap-2">
              <Bell className="w-3.5 h-3.5" /> All Alerts
            </div>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border transition-colors ${
              filter === 'all' ? 'bg-[#22C55E]/20 text-[#22C55E] border-transparent' : 'bg-[#F8FAFC] text-[#4B5563] border-[#E5E7EB]'
            }`}>
              {notifications.length}
            </span>
          </button>

          <button
            onClick={() => { playClickSound(); setFilter('unread'); }}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
              filter === 'unread'
                ? 'bg-[#22C55E] text-white shadow-md shadow-[#22C55E]/10'
                : 'text-[#94A3B8] hover:text-[#4B5563] hover:bg-[#F8FAFC]'
            }`}
          >
            <div className="flex items-center gap-2">
              <MailOpen className="w-3.5 h-3.5" /> Unread
            </div>
            {unreadCount > 0 && (
              <span className="text-[10px] bg-rose-500 text-white px-2 py-0.5 rounded-full font-bold animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>
        </div>

        {/* Content list */}
        <div className="md:col-span-3 space-y-8">
          {displayedNotifications.length === 0 ? (
            <div className="bg-white border border-[#E5E7EB] rounded-3xl p-20 text-center space-y-4 shadow-sm">
              <div className="w-12 h-12 rounded-2xl bg-[#F8FAFC] border border-[#E5E7EB] flex items-center justify-center mx-auto text-[#94A3B8] shadow-sm">
                <BellOff className="w-5 h-5" />
              </div>
              <p className="text-[#4B5563] font-bold text-xs">
                No {filter === 'unread' ? 'unread' : ''} alerts found.
              </p>
            </div>
          ) : (
            <div className="space-y-8 animate-slide-up">
              {renderNotificationGroup('Today', today)}
              {renderNotificationGroup('Yesterday', yesterday)}
              {renderNotificationGroup('Earlier', earlier)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Notifications;
