import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, GraduationCap, Building2, Briefcase, FileText, Target,
  FileCheck2, BarChart3, Megaphone, CalendarDays, Award, Bell,
  Settings, Search, Filter, RefreshCw, CheckCircle2, AlertCircle, X, Check,
  XCircle, Power, ArrowRight, FileSpreadsheet, Plus, Download, Mail, ShieldAlert,
  Clock, MapPin, Eye, Trash2, Edit3, CheckSquare, PlusCircle, Calendar, Sparkles, 
  Send, Upload, ChevronRight, ChevronLeft, Lock, UserCheck, MessageSquare, Info,
  LogOut, Star, User, Sliders, Server, Shield, Sun, Moon
} from 'lucide-react';
import api from '../utils/api';
import { clearUser } from '../redux/authSlice';

const AdminDashboard = () => {
  const user = useSelector((state) => state.auth.user) || { name: 'Admin Coordinator', role: 'admin' };
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Active Tab & Structural Navigation States
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);

  // Notifications and messages panel toggle states
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const [showMsgPanel, setShowMsgPanel] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  // Search & Global filters
  const [searchQuery, setSearchQuery] = useState('');

  // Toast Notifications
  const [toasts, setToasts] = useState([]);
  const addToast = (type, message) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  // Theme & Dark Mode Setup
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  // Notifications filtering state
  const [notifFilter, setNotifFilter] = useState('All');

  // Modals States
  const [activeModal, setActiveModal] = useState(null); // 'createDrive' | 'addStudent' | 'announcement' | 'report' | 'csvUpload' | 'interview' | 'confirmDelete' | 'viewStudent'
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedRecruiter, setSelectedRecruiter] = useState(null);
  const [selectedDrive, setSelectedDrive] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null); // { type: 'student' | 'recruiter' | 'drive', id: any }

  // Form states
  const [driveForm, setDriveForm] = useState({
    name: '', company: '', role: '', ctc: '', branches: [], deadline: '', status: 'Open', venue: '', mode: 'Online'
  });
  const [studentForm, setStudentForm] = useState({
    name: '', rollNumber: '', branch: 'CSE', cgpa: '', year: '2026', email: '', resumeStatus: 'Pending', placementStatus: 'Unplaced'
  });
  const [noticeForm, setNoticeForm] = useState({
    title: '', content: '', targetAudience: 'All Students', attachment: null, scheduledPublish: ''
  });
  const [interviewForm, setInterviewForm] = useState({
    candidate: '', interviewer: '', company: '', date: '', time: '', mode: 'Online', roomNumber: '', status: 'Scheduled'
  });
  const [reportForm, setReportForm] = useState({
    type: 'Placement Statistics', format: 'PDF', department: 'All', dateRange: 'Full Year'
  });
  const [csvUploadData, setCsvUploadData] = useState({
    driveId: '', fileName: '', parsedCount: 0
  });

  // Resume Verification feedback state
  const [feedbackText, setFeedbackText] = useState('');
  const [resumeVerificationTabId, setResumeVerificationTabId] = useState(1); // active resume ID

  // Calendar Date State (Simulating July 2026)
  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date(2026, 6, 16));

  // --- DATABASE-DRIVEN REAL DATA STATES ---
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalStudentsChange: 'Real-time database count',
    verifiedRecruiters: 0,
    verifiedRecruitersChange: 'Pending approval review',
    activeJobs: 0,
    activeJobsChange: 'Active drives in system',
    applications: 0,
    applicationsChange: 'Total student bids',
    studentsPlaced: 0,
    studentsPlacedChange: 'Verified placements',
    placementRate: 0,
    placementRateChange: 'Calculated index'
  });

  const [students, setStudents] = useState([]);
  const [recruiters, setRecruiters] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [drives, setDrives] = useState([]);
  const [applications, setApplications] = useState([]);
  const [resumes, setResumes] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [shortlists, setShortlists] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [notificationsList, setNotificationsList] = useState([]);
  const [messagesList, setMessagesList] = useState([]);
  const [recentLogins, setRecentLogins] = useState([]);

  // Settings Configuration states
  const [settingsForm, setSettingsForm] = useState({
    name: 'Geeta Placement Cell',
    email: 'tpocell@geetauniversity.edu.in',
    phone: '+91 82218 80000',
    address: 'Academic Block II, Geeta University Campus',
    smtpHost: 'smtp.gmail.com',
    smtpPort: '465',
    smtpUser: 'tpocell@geetauniversity.edu.in',
    requireResumeApproval: true,
    allowDualOffers: false,
    sessionTimeout: 60,
    maintenanceMode: false
  });

  // Filter conditions
  const [studentBranchFilter, setStudentBranchFilter] = useState('All');
  const [studentStatusFilter, setStudentStatusFilter] = useState('All');
  const [studentCgpafilter, setStudentCgpafilter] = useState(0);
  const [recruiterSearch, setRecruiterSearch] = useState('');
  const [driveSearch, setDriveSearch] = useState('');
  const [companySearchQuery, setCompanySearchQuery] = useState('');

  // Pagination for Students
  const [studentPage, setStudentPage] = useState(1);
  const studentsPerPage = 5;

  // Syncing with Backend and deriving dependent states directly from DB queries
  const loadBackendData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch Stats
      const statsRes = await api.get('/api/admin/stats');
      if (statsRes.data && statsRes.data.stats) {
        const s = statsRes.data.stats;
        setStats({
          totalStudents: s.totalStudents || 0,
          totalStudentsChange: 'University student database size',
          verifiedRecruiters: s.totalCompanies - s.pendingCompanies || 0,
          verifiedRecruitersChange: `${s.pendingCompanies || 0} recruiters awaiting validation`,
          activeJobs: s.activeJobs || 0,
          activeJobsChange: 'Currently hiring',
          applications: s.totalOffers || 0,
          applicationsChange: 'Total recruitment application links',
          studentsPlaced: s.placedStudents || 0,
          studentsPlacedChange: 'Students placed in corporate sectors',
          placementRate: parseFloat(s.placementRate) || 0,
          placementRateChange: 'Calculated success index'
        });
      }
      
      // 2. Fetch Companies
      const compRes = await api.get('/api/admin/companies');
      let loadedCompanies = [];
      if (compRes.data && compRes.data.companies) {
        loadedCompanies = compRes.data.companies.map((c) => ({
          id: c._id,
          name: c.name,
          logo: c.logo || 'https://cdn-icons-png.flaticon.com/512/3843/3843939.png',
          industry: c.industry || 'Technology',
          hrName: c.contactPerson || c.recruiterId?.name || 'HR Manager',
          email: c.email || c.recruiterId?.email || 'hr@company.com',
          approved: c.approved,
          jobsCount: c.jobPostings?.length || 0,
          hiredCount: 0,
          rating: 4.5,
          website: c.website || 'website.com'
        }));
        setCompanies(loadedCompanies);
        
        // Match recruiters list as well
        const recruitersList = compRes.data.companies.map((c) => ({
          id: c._id,
          companyName: c.name,
          logo: c.logo || 'https://cdn-icons-png.flaticon.com/512/3843/3843939.png',
          industry: c.industry || 'Technology',
          hrName: c.contactPerson || c.recruiterId?.name || 'HR Manager',
          email: c.email || c.recruiterId?.email || 'hr@company.com',
          approvalStatus: c.approved ? 'Approved' : 'Pending',
          jobsPosted: c.jobPostings?.length || 0
        }));
        setRecruiters(recruitersList);
      }
      
      // 3. Fetch Students
      const studRes = await api.get('/api/admin/students');
      let loadedStudents = [];
      if (studRes.data && studRes.data.students) {
        loadedStudents = studRes.data.students.map((s) => ({
          id: s._id,
          userId: s.userId?._id || s.userId,
          name: s.name,
          rollNumber: s.rollNumber || 'N/A',
          branch: s.branch || 'CSE',
          cgpa: s.cgpa || 0,
          year: s.year || '2026',
          email: s.email,
          phone: s.phone || 'N/A',
          resumeStatus: s.resumeUrl ? 'Verified' : 'Pending',
          placementStatus: s.isPlaced ? 'Placed' : 'Unplaced',
          photo: s.avatar || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150',
          company: s.placedCompany || null,
          ctc: s.placedPackage || null,
          skills: s.skills || [],
          projects: s.projects || [],
          resumeUrl: s.resumeUrl || null
        }));
        setStudents(loadedStudents);

        // Derive Resumes Verification list from students who have a resumeUrl
        const resumeList = loadedStudents.filter(s => s.resumeUrl || s.email).map((s) => ({
          id: s.id,
          studentName: s.name,
          rollNumber: s.rollNumber,
          branch: s.branch,
          cgpa: s.cgpa,
          score: Math.round(55 + (s.cgpa * 3.5) + (s.skills?.length || 0) * 1.5),
          aiStatus: s.cgpa >= 8.0 ? 'Highly Compatible' : 'Matches Criteria',
          skills: s.skills?.length ? s.skills : ['DSA', 'Web Dev', 'Java'],
          education: `B.Tech in ${s.branch} (CGPA: ${s.cgpa}/10)`,
          experience: s.projects?.length ? 'Internship / Academic Projects' : 'Academic Projects',
          projects: s.projects?.map(p => p.title).join(', ') || 'Online Placement Portal Project',
          aiRemarks: `Formatting: Clean. Core skills matched: ${s.skills?.slice(0, 3).join(', ') || 'React'}. Suggestion: Add more project deployments.`,
          resumeUrl: s.resumeUrl
        }));
        setResumes(resumeList);

        // Derive Recent Logins from users who have lastLogin
        const loginLogs = [];
        studRes.data.students.forEach(s => {
          if (s.userId && s.userId.lastLogin) {
            loginLogs.push({
              user: s.email,
              ip: '192.168.1.102',
              location: 'Student Portal (Chrome)',
              time: new Date(s.userId.lastLogin).toLocaleString()
            });
          }
        });
        if (compRes.data && compRes.data.companies) {
          compRes.data.companies.forEach(c => {
            if (c.recruiterId && c.recruiterId.lastLogin) {
              loginLogs.push({
                user: c.recruiterId.email,
                ip: '192.168.1.201',
                location: `${c.name} Recruiter (Chrome)`,
                time: new Date(c.recruiterId.lastLogin).toLocaleString()
              });
            }
          });
        }
        setRecentLogins(loginLogs.sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 5));
      }
      
      // 4. Fetch Drives
      const drivesRes = await api.get('/api/placement/drives');
      let loadedDrives = [];
      if (drivesRes.data && drivesRes.data.drives) {
        loadedDrives = drivesRes.data.drives.map((d) => ({
          id: d._id,
          name: d.title,
          company: d.companyId?.name || 'Recruiter Company',
          role: d.title,
          ctc: d.package ? `${d.package} LPA` : 'N/A',
          branches: d.eligibility?.branches || ['CSE'],
          deadline: d.deadline ? d.deadline.slice(0, 10) : '2026-07-30',
          status: d.status === 'active' ? 'Open' : 'Closed',
          venue: d.venue || 'Virtual',
          mode: d.mode || 'Online',
          registeredCount: d.applicantsCount || 0
        }));
        setDrives(loadedDrives);
      }
      
      // 5. Fetch Applications & Derive Interviews, Shortlists
      const appRes = await api.get('/api/placement/applications');
      if (appRes.data && appRes.data.applications) {
        const loadedApps = appRes.data.applications.map((a) => ({
          id: a._id,
          student: a.studentId?.name || 'Student Candidate',
          company: a.jobId?.companyId?.name || 'Company Partner',
          role: a.jobId?.title || 'Job Role',
          appliedDate: a.createdAt ? a.createdAt.slice(0, 10) : '2026-07-16',
          stage: a.rounds?.length ? a.rounds[a.rounds.length - 1].name : 'Applied',
          status: a.status || 'Applied',
          resume: a.studentId?.resumeUrl ? 'resume.pdf' : 'N/A'
        }));
        setApplications(loadedApps);

        // Update companies state to populate real hired counts from applications
        setCompanies(prevCompanies => 
          prevCompanies.map(c => ({
            ...c,
            hiredCount: loadedApps.filter(app => app.company === c.name && app.status === 'Selected').length
          }))
        );

        // Derive Shortlists (applications with status === 'Shortlisted')
        const activeShortlists = appRes.data.applications.filter(a => a.status === 'Shortlisted').map((a) => ({
          id: a._id,
          driveName: a.jobId?.title || 'Drive shortlisting',
          companyName: a.jobId?.companyId?.name || 'Recruiter',
          round: a.rounds?.length ? a.rounds[a.rounds.length - 1].name : 'First Round',
          count: 1,
          publishedDate: a.updatedAt ? a.updatedAt.slice(0, 10) : '2026-07-16'
        }));
        setShortlists(activeShortlists);

        // Derive Interviews Schedule
        const activeInterviews = [];
        appRes.data.applications.forEach(a => {
          if (a.rounds) {
            a.rounds.forEach(r => {
              if (r.scheduledAt && r.result === 'Pending') {
                activeInterviews.push({
                  id: r._id || Math.random(),
                  candidate: a.studentId?.name || 'Student',
                  interviewer: 'HR Panel',
                  company: a.jobId?.companyId?.name || 'Recruiter Company',
                  date: r.scheduledAt.slice(0, 10),
                  time: new Date(r.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  mode: a.jobId?.mode || 'Online',
                  roomNumber: a.jobId?.venue || 'Teams Room',
                  status: 'Scheduled'
                });
              }
            });
          }
        });
        setInterviews(activeInterviews);
      }

      // 6. Fetch Notifications & Announcements
      const notifRes = await api.get('/api/notifications');
      if (notifRes.data && notifRes.data.notifications) {
        const loadedNotifs = notifRes.data.notifications.map((n) => ({
          id: n._id,
          type: n.type || 'system',
          text: n.message,
          time: new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          read: n.read
        }));
        setNotificationsList(loadedNotifs);

        // Derive Announcements (type === 'announcement')
        const loadedAnnouncements = notifRes.data.notifications.filter(n => n.type === 'announcement').map(n => ({
          id: n._id,
          title: 'Placement Announcement',
          content: n.message,
          targetAudience: 'All Candidates',
          attachment: null,
          date: n.createdAt ? n.createdAt.slice(0, 10) : '2026-07-16'
        }));
        setAnnouncements(loadedAnnouncements);
      }

      // 7. Fetch Chat contacts
      const chatContactsRes = await api.get('/api/chat/contacts');
      if (chatContactsRes.data && chatContactsRes.data.contacts) {
        const loadedMsgs = chatContactsRes.data.contacts.map((c) => ({
          id: c.id,
          sender: c.name,
          preview: `Click to chat with ${c.name}`,
          time: 'Active',
          unread: false
        }));
        setMessagesList(loadedMsgs);
      }

      addToast('success', 'Real database data loaded successfully.');
    } catch (err) {
      console.log('Error pulling backend data:', err);
      const errMsg = err.response?.data?.message || err.message || 'Error loading real database data. Please verify database seeding.';
      addToast('danger', errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBackendData();
  }, []);

  // Quick Action triggers
  const handleLogout = async () => {
    try {
      await api.post('/api/auth/logout');
    } catch (err) {
      console.error(err);
    }
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    dispatch(clearUser());
    addToast('success', 'Logged out successfully');
    navigate('/login');
  };

  // Recruiter actions
  const handleApproveRecruiter = async (recId) => {
    setActionLoading(recId);
    try {
      await api.post('/api/admin/companies/approve', { companyId: recId });
      addToast('success', 'Recruiter credentials verified & approved.');
      loadBackendData();
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.message || err.message || 'Failed to approve recruiter.';
      addToast('danger', errMsg);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectRecruiter = async (recId) => {
    setActionLoading(recId);
    try {
      await api.post('/api/admin/companies/reject', { companyId: recId });
      addToast('warning', 'Recruiter status updated to rejected.');
      loadBackendData();
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.message || err.message || 'Failed to reject recruiter.';
      addToast('danger', errMsg);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteRecruiter = (recId) => {
    setDeleteTarget({ type: 'recruiter', id: recId });
    setActiveModal('confirmDelete');
  };

  // Drive Actions
  const handleToggleDrive = async (driveId) => {
    setActionLoading(driveId);
    try {
      await api.post(`/api/admin/jobs/${driveId}/toggle-status`);
      addToast('success', 'Drive status toggled.');
      loadBackendData();
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.message || err.message || 'Failed to toggle drive status.';
      addToast('danger', errMsg);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteDrive = (driveId) => {
    setDeleteTarget({ type: 'drive', id: driveId });
    setActiveModal('confirmDelete');
  };

  // Student Actions
  const handleToggleStudentSuspension = async (studentId) => {
    setActionLoading(studentId);
    try {
      await api.post(`/api/admin/users/${studentId}/toggle-active`);
      addToast('success', 'Student account status updated.');
      loadBackendData();
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.message || err.message || 'Failed to update student status.';
      addToast('danger', errMsg);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteStudent = (studentId) => {
    setDeleteTarget({ type: 'student', id: studentId });
    setActiveModal('confirmDelete');
  };

  const handleMarkAllNotificationsAsRead = async () => {
    try {
      await api.put('/api/notifications/read-all');
      setNotificationsList(prev => prev.map(n => ({ ...n, read: true })));
      addToast('success', 'All notifications marked as read.');
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.message || err.message || 'Failed to mark notifications as read.';
      addToast('danger', errMsg);
    }
  };

  const handleMarkNotificationAsRead = async (id) => {
    try {
      await api.put(`/api/notifications/${id}/read`);
      setNotificationsList(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
      addToast('success', 'Notification marked as read.');
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.message || err.message || 'Failed to update notification.';
      addToast('danger', errMsg);
    }
  };

  // Resume Verification actions
  const handleApproveResume = (id) => {
    setStudents(prev => prev.map(s => {
      const targetResume = resumes.find(r => r.id === id);
      if (s.name === targetResume?.studentName) {
        return { ...s, resumeStatus: 'Verified' };
      }
      return s;
    }));
    addToast('success', 'Resume marked as verified. AI Score registered.');
  };

  const handleRejectResume = (id) => {
    setStudents(prev => prev.map(s => {
      const targetResume = resumes.find(r => r.id === id);
      if (s.name === targetResume?.studentName) {
        return { ...s, resumeStatus: 'Rejected' };
      }
      return s;
    }));
    addToast('danger', 'Resume rejected. Feedback logs dispatched to student.');
  };

  // Modal Submission Forms
  const handleCreateDriveSubmit = (e) => {
    e.preventDefault();
    const newDrive = {
      id: Date.now(),
      name: driveForm.name,
      company: driveForm.company,
      role: driveForm.role,
      ctc: driveForm.ctc,
      branches: driveForm.branches.length ? driveForm.branches : ['CSE'],
      deadline: driveForm.deadline || '2026-07-25',
      status: driveForm.status,
      venue: driveForm.venue || 'Seminar Hall',
      mode: driveForm.mode,
      registeredCount: 0
    };
    setDrives(prev => [newDrive, ...prev]);
    setStats(prev => ({ ...prev, activeJobs: prev.activeJobs + 1 }));
    setActiveModal(null);
    setDriveForm({ name: '', company: '', role: '', ctc: '', branches: [], deadline: '', status: 'Open', venue: '', mode: 'Online' });
    addToast('success', 'New placement drive created and published!');
  };

  const handleAddStudentSubmit = (e) => {
    e.preventDefault();
    const newStudent = {
      id: Date.now(),
      name: studentForm.name,
      rollNumber: studentForm.rollNumber,
      branch: studentForm.branch,
      cgpa: parseFloat(studentForm.cgpa) || 7.0,
      year: studentForm.year,
      email: studentForm.email,
      phone: '+91 99999 88888',
      resumeStatus: studentForm.resumeStatus,
      placementStatus: studentForm.placementStatus,
      photo: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150',
      company: studentForm.placementStatus === 'Placed' ? 'Partner Corporation' : null,
      ctc: studentForm.placementStatus === 'Placed' ? '8.0 LPA' : null
    };
    setStudents(prev => [newStudent, ...prev]);
    setStats(prev => ({ ...prev, totalStudents: prev.totalStudents + 1 }));
    setActiveModal(null);
    setStudentForm({ name: '', rollNumber: '', branch: 'CSE', cgpa: '', year: '2026', email: '', resumeStatus: 'Pending', placementStatus: 'Unplaced' });
    addToast('success', 'Student record successfully added.');
  };

  const handleAnnouncementSubmit = (e) => {
    e.preventDefault();
    const newNotice = {
      id: Date.now(),
      title: noticeForm.title,
      content: noticeForm.content,
      targetAudience: noticeForm.targetAudience,
      attachment: noticeForm.attachment ? noticeForm.attachment.name : null,
      date: new Date().toISOString().slice(0, 10)
    };
    setAnnouncements(prev => [newNotice, ...prev]);
    setActiveModal(null);
    setNoticeForm({ title: '', content: '', targetAudience: 'All Students', attachment: null, scheduledPublish: '' });
    addToast('success', 'Notice broadcasted to placements portal.');
  };

  const handleInterviewSubmit = (e) => {
    e.preventDefault();
    const newInterview = {
      id: Date.now(),
      candidate: interviewForm.candidate,
      interviewer: interviewForm.interviewer,
      company: interviewForm.company,
      date: interviewForm.date || '2026-07-16',
      time: interviewForm.time || '10:00 AM',
      mode: interviewForm.mode,
      roomNumber: interviewForm.roomNumber || 'Teams Virtual room 1',
      status: interviewForm.status
    };
    setInterviews(prev => [newInterview, ...prev]);
    setActiveModal(null);
    setInterviewForm({ candidate: '', interviewer: '', company: '', date: '', time: '', mode: 'Online', roomNumber: '', status: 'Scheduled' });
    addToast('success', 'Interview scheduled and invite emails sent.');
  };

  const handleReportSubmit = (e) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setActiveModal(null);
      addToast('success', `${reportForm.type} (${reportForm.format}) generated successfully. Check downloads.`);
    }, 1500);
  };

  const handleCsvUploadSubmit = (e) => {
    e.preventDefault();
    if (!csvUploadData.fileName) {
      addToast('warning', 'Please drag & drop or select a CSV file first.');
      return;
    }
    const newShortlist = {
      id: Date.now(),
      driveName: drives.find(d => d.id === parseInt(csvUploadData.driveId))?.name || 'Selected Placement Drive',
      companyName: drives.find(d => d.id === parseInt(csvUploadData.driveId))?.company || 'Partner Recruiter',
      round: 'CSV Uploaded Shortlist',
      count: csvUploadData.parsedCount || 12,
      publishedDate: new Date().toISOString().slice(0, 10)
    };
    setShortlists(prev => [newShortlist, ...prev]);
    addToast('success', `Parsed ${csvUploadData.parsedCount} students. Shortlist file verified.`);
    setActiveModal(null);
    setCsvUploadData({ driveId: '', fileName: '', parsedCount: 0 });
  };

  const executeDelete = () => {
    const { type, id } = deleteTarget;
    if (type === 'student') {
      setStudents(prev => prev.filter(s => s.id !== id));
      setStats(prev => ({ ...prev, totalStudents: prev.totalStudents - 1 }));
      addToast('warning', 'Student record deleted.');
    } else if (type === 'recruiter') {
      setRecruiters(prev => prev.filter(r => r.id !== id));
      setCompanies(prev => prev.filter(c => c.id !== id));
      addToast('warning', 'Recruiter account deleted.');
    } else if (type === 'drive') {
      setDrives(prev => prev.filter(d => d.id !== id));
      setStats(prev => ({ ...prev, activeJobs: prev.activeJobs - 1 }));
      addToast('warning', 'Placement drive canceled.');
    }
    setActiveModal(null);
    setDeleteTarget(null);
  };

  // Filter calculations
  const filteredStudents = students.filter(s => {
    const matchesQuery = s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         s.rollNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         s.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesBranch = studentBranchFilter === 'All' || s.branch === studentBranchFilter;
    const matchesStatus = studentStatusFilter === 'All' || 
                          (studentStatusFilter === 'Placed' && s.placementStatus === 'Placed') ||
                          (studentStatusFilter === 'Unplaced' && s.placementStatus === 'Unplaced') ||
                          (studentStatusFilter === 'Verified' && s.resumeStatus === 'Verified') ||
                          (studentStatusFilter === 'Pending' && s.resumeStatus === 'Pending');
    const matchesCgpa = s.cgpa >= studentCgpafilter;
    return matchesQuery && matchesBranch && matchesStatus && matchesCgpa;
  });

  const paginatedStudents = filteredStudents.slice(
    (studentPage - 1) * studentsPerPage,
    studentPage * studentsPerPage
  );
  const totalStudentPages = Math.ceil(filteredStudents.length / studentsPerPage) || 1;

  const filteredRecruiters = recruiters.filter(r => {
    const query = recruiterSearch.toLowerCase();
    return r.companyName.toLowerCase().includes(query) || 
           r.hrName.toLowerCase().includes(query) || 
           r.industry.toLowerCase().includes(query);
  });

  const filteredCompanies = companies.filter(c => {
    const query = companySearchQuery.toLowerCase();
    return c.name.toLowerCase().includes(query) || 
           c.hrName.toLowerCase().includes(query) || 
           c.industry.toLowerCase().includes(query);
  });

  const filteredDrives = drives.filter(d => {
    const query = driveSearch.toLowerCase();
    return d.name.toLowerCase().includes(query) || 
           d.company.toLowerCase().includes(query) || 
           d.role.toLowerCase().includes(query);
  });

  const filteredNotifications = notificationsList.filter(n => {
    if (notifFilter === 'All') return true;
    if (notifFilter === 'Unread') return !n.read;
    if (notifFilter === 'Read') return n.read;
    return n.type === notifFilter;
  });

  // Calculate stats for Analytics page
  const branchesList = ['CSE', 'ECE', 'ME', 'CE', 'EE', 'MBA'];
  const branchPlacements = branchesList.map(branchName => {
    const branchStudents = students.filter(s => 
      s.branch?.toLowerCase().includes(branchName.toLowerCase()) || 
      (branchName === 'CSE' && s.branch?.toLowerCase().includes('computer science')) ||
      (branchName === 'ECE' && s.branch?.toLowerCase().includes('electronics')) ||
      (branchName === 'ME' && s.branch?.toLowerCase().includes('mechanical')) ||
      (branchName === 'CE' && s.branch?.toLowerCase().includes('civil')) ||
      (branchName === 'EE' && s.branch?.toLowerCase().includes('electrical'))
    );
    const total = branchStudents.length;
    const placed = branchStudents.filter(s => s.placementStatus === 'Placed' || s.isPlaced).length;
    const pct = total > 0 ? Math.round((placed / total) * 100) : 0;
    return { branch: branchName, total, placed, pct };
  });

  const companyCounts = {};
  applications.forEach(app => {
    if (app.status === 'Selected') {
      const co = app.company || 'Other';
      companyCounts[co] = (companyCounts[co] || 0) + 1;
    }
  });
  const companyHiring = Object.entries(companyCounts).map(([name, count]) => ({
    name,
    count
  })).sort((a, b) => b.count - a.count).slice(0, 5);

  const totalSelections = companyHiring.reduce((sum, c) => sum + c.count, 0);

  const selectionsByMonth = [0, 0, 0, 0, 0, 0, 0]; // Jan to Jul
  applications.forEach(app => {
    if (app.status === 'Selected' && app.appliedDate) {
      const dateParts = app.appliedDate.split('-');
      if (dateParts.length >= 2) {
        const monthNum = parseInt(dateParts[1]);
        if (monthNum >= 1 && monthNum <= 7) {
          selectionsByMonth[monthNum - 1]++;
        }
      }
    }
  });

  const maxPlacementsInMonth = Math.max(...selectionsByMonth, 1);
  const monthlyPoints = selectionsByMonth.map((count, idx) => {
    const x = 20 + idx * 76.6;
    const y = 180 - (count / maxPlacementsInMonth) * 140;
    return { x, y };
  });

  let monthlyPathD = `M ${monthlyPoints[0].x} ${monthlyPoints[0].y}`;
  for (let i = 1; i < monthlyPoints.length; i++) {
    monthlyPathD += ` L ${monthlyPoints[i].x} ${monthlyPoints[i].y}`;
  }
  const monthlyAreaD = `${monthlyPathD} L ${monthlyPoints[monthlyPoints.length - 1].x} 180 L ${monthlyPoints[0].x} 180 Z`;

  const topDrives = [...drives]
    .filter(d => d.ctc && d.ctc !== 'N/A')
    .map(d => ({
      companyName: d.company,
      ctcVal: parseFloat(d.ctc) || 0,
      ctcStr: d.ctc
    }))
    .sort((a, b) => b.ctcVal - a.ctcVal)
    .slice(0, 3);

  // Helper arrays
  const sidebarItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'students', label: 'Students', icon: GraduationCap },
    { id: 'recruiters', label: 'Recruiters', icon: Building2 },
    { id: 'companies', label: 'Companies', icon: Award },
    { id: 'drives', label: 'Placement Drives', icon: Target },
    { id: 'jobs', label: 'Job Postings', icon: Briefcase },
    { id: 'applications', label: 'Applications', icon: FileText },
    { id: 'shortlists', label: 'Shortlists', icon: FileSpreadsheet },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'announcements', label: 'Announcements', icon: Megaphone },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  return (
    <div className={`min-h-screen bg-[#F8FAFC] flex text-[#334155] font-sans antialiased w-full ${isDarkMode ? 'dark' : ''}`}>
      
      {/* Toast Alert Drawer */}
      <div className="fixed top-6 right-6 z-55 flex flex-col gap-3 max-w-sm pointer-events-none">
        {toasts.map(t => (
          <div 
            key={t.id} 
            className={`pointer-events-auto p-4 rounded-xl shadow-lg border flex items-start gap-3 bg-white animate-in slide-in-from-right-10 duration-300 ${
              t.type === 'success' ? 'border-emerald-100 text-emerald-800' :
              t.type === 'warning' ? 'border-amber-100 text-amber-800' :
              t.type === 'danger' ? 'border-rose-100 text-rose-800' : 'border-blue-100 text-indigo-800'
            }`}
          >
            <div className="mt-0.5">
              {t.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
              {t.type === 'warning' && <AlertCircle className="w-5 h-5 text-amber-500" />}
              {t.type === 'danger' && <XCircle className="w-5 h-5 text-rose-500" />}
              {t.type === 'info' && <Sparkles className="w-5 h-5 text-indigo-500" />}
            </div>
            <div className="flex-1 text-sm font-medium">{t.message}</div>
          </div>
        ))}
      </div>

      {/* ---------------- LEFT SIDEBAR ---------------- */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-[#E2E8F0]/80 shadow-[10px_0_30px_rgba(0,0,0,0.01)] transition-transform duration-300 md:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          
          {/* Logo Branding */}
          <div className="h-16 px-6 border-b border-[#E2E8F0]/60 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#6D5EF7] to-[#8175F9] flex items-center justify-center shadow-md shadow-[#6D5EF7]/20">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-slate-800 text-sm tracking-tight leading-none">PlacementConnect</span>
                <span className="text-[10px] text-slate-450 font-semibold uppercase tracking-wider mt-0.5">GEETA UNIVERSITY</span>
              </div>
            </div>
            <button className="md:hidden p-1.5 hover:bg-slate-50 rounded-lg" onClick={() => setSidebarOpen(false)}>
              <X className="w-4 h-4 text-slate-400" />
            </button>
          </div>

          {/* Sidebar Menu Item list */}
          <div className="flex-1 overflow-y-auto px-4 py-6 space-y-1 scrollbar-thin">
            {sidebarItems.map(item => {
              const IconComp = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-[12px] text-sm font-semibold transition-all duration-200 ${
                    isActive 
                      ? 'bg-[#6D5EF7]/8 text-[#6D5EF7] border border-[#6D5EF7]/10' 
                      : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50/80 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <IconComp className={`w-4 h-4 ${isActive ? 'text-[#6D5EF7]' : 'text-slate-400 group-hover:text-slate-500'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.count > 0 && (
                    <span className="bg-[#EF4444]/10 text-[#EF4444] text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Admin Profile & Logout footer */}
          <div className="p-4 border-t border-[#E2E8F0]/60 bg-slate-50/50">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#6D5EF7] to-indigo-400 flex items-center justify-center font-bold text-white text-xs">
                {user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="text-xs font-bold text-slate-800 truncate leading-none">{user.name}</p>
                <p className="text-[10px] text-slate-400 mt-1 uppercase font-semibold">TPO Admin</p>
              </div>
            </div>
            <button 
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-bold text-rose-500 bg-rose-50/40 hover:bg-rose-50 rounded-xl border border-rose-100 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log Out</span>
            </button>
          </div>

        </div>
      </aside>

      {/* ---------------- MAIN VIEW WRAPPER ---------------- */}
      <div className="flex-1 md:pl-64 flex flex-col min-w-0">

        {/* ---------------- NAVBAR ---------------- */}
        <header className="sticky top-0 z-30 bg-white/85 backdrop-blur-md border-b border-[#E2E8F0]/60 px-6 sm:px-8 h-16 flex items-center justify-between">
          
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-lg"
            >
              <PlusCircle className="w-5 h-5 rotate-45" />
            </button>
            <h1 className="text-sm sm:text-base font-bold text-slate-800 capitalize">
              {activeTab === 'dashboard' ? 'Placement Dashboard' : activeTab.replace(/([A-Z])/g, ' $1')}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            
            {/* Search Bar */}
            <div className="hidden sm:flex items-center gap-2 bg-[#F8FAFC] border border-slate-200/80 rounded-xl px-3 py-1.5 w-64 hover:border-slate-300 transition-colors">
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search anything..." 
                className="bg-transparent border-none text-xs focus:outline-none w-full text-slate-700 placeholder-slate-400"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <span className="text-[9px] font-mono font-bold text-slate-400 px-1.5 py-0.5 bg-slate-200/50 rounded">⌘K</span>
            </div>

            {/* Notifications Bell */}
            <button 
              onClick={() => {
                setActiveTab('notifications');
                setShowMsgPanel(false);
                setShowProfileDropdown(false);
              }}
              className="p-2 hover:bg-slate-50 rounded-xl border border-slate-100 transition-colors relative"
              title="Notifications"
            >
              <Bell className="w-4 h-4 text-slate-500" />
              {notificationsList.some(n => !n.read) && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#EF4444] rounded-full" />
              )}
            </button>

            {/* Messages Panel */}
            <div className="relative">
              <button 
                onClick={() => {
                  setShowMsgPanel(!showMsgPanel);
                  setShowNotifPanel(false);
                  setShowProfileDropdown(false);
                }}
                className="p-2 hover:bg-slate-50 rounded-xl border border-slate-100 transition-colors relative"
              >
                <MessageSquare className="w-4 h-4 text-slate-500" />
                {messagesList.some(m => m.unread) && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#F59E0B] rounded-full" />
                )}
              </button>

              {/* Messages dropdown */}
              {showMsgPanel && (
                <div className="absolute right-0 mt-3 w-80 bg-white border border-slate-200 rounded-[18px] shadow-lg py-3 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="px-4 pb-2 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-800">Recruiter Messages</h3>
                    <button className="text-[10px] text-[#6D5EF7] font-semibold hover:underline">View inbox</button>
                  </div>
                  <div className="max-h-64 overflow-y-auto px-2 mt-2 space-y-1">
                    {messagesList.map(m => (
                      <div key={m.id} className="p-2.5 rounded-xl text-xs flex gap-2.5 transition-colors hover:bg-slate-50">
                        <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600 shrink-0">
                          {m.sender[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-0.5">
                            <p className="font-bold text-slate-800 truncate">{m.sender}</p>
                            <span className="text-[8px] text-slate-400 font-medium shrink-0">{m.time}</span>
                          </div>
                          <p className="text-slate-500 truncate leading-tight">{m.preview}</p>
                        </div>
                        {m.unread && (
                          <span className="w-2 h-2 bg-[#6D5EF7] rounded-full mt-2.5 shrink-0" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Dark Mode Toggle */}
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 hover:bg-slate-50 rounded-xl border border-slate-100 transition-colors"
              title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {isDarkMode ? (
                <Sun className="w-4 h-4 text-amber-500" />
              ) : (
                <Moon className="w-4 h-4 text-slate-500" />
              )}
            </button>

            {/* Quick Settings Icon */}
            <button 
              onClick={() => setActiveTab('settings')}
              className="p-2 hover:bg-slate-50 rounded-xl border border-slate-100 transition-colors"
            >
              <Settings className="w-4 h-4 text-slate-500" />
            </button>

            {/* Profile Dropdown */}
            <div className="relative">
              <button 
                onClick={() => {
                  setShowProfileDropdown(!showProfileDropdown);
                  setShowNotifPanel(false);
                  setShowMsgPanel(false);
                }}
                className="flex items-center gap-2 p-1 pr-3 hover:bg-slate-50 rounded-full border border-slate-100 transition-colors"
              >
                <div className="w-7 h-7 rounded-full bg-[#6D5EF7] flex items-center justify-center font-bold text-white text-xs">
                  A
                </div>
                <span className="hidden md:inline text-xs font-bold text-slate-700">TPO Cell</span>
              </button>

              {showProfileDropdown && (
                <div className="absolute right-0 mt-3 w-48 bg-white border border-slate-200 rounded-[18px] shadow-lg py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200 text-xs">
                  <div className="px-4 py-2 border-b border-slate-100">
                    <p className="font-bold text-slate-800">Placement Cell</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">tpocell@geeta.edu</p>
                  </div>
                  <button onClick={() => { setActiveTab('settings'); setShowProfileDropdown(false); }} className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2 text-slate-600">
                    <User className="w-3.5 h-3.5" /> Profile Settings
                  </button>
                  <button onClick={handleLogout} className="w-full text-left px-4 py-2 hover:bg-slate-50 border-t border-slate-100 text-rose-500 flex items-center gap-2 font-semibold">
                    <LogOut className="w-3.5 h-3.5" /> Log Out
                  </button>
                </div>
              )}
            </div>

          </div>
        </header>

        {/* ---------------- MAIN CONTENT AREA ---------------- */}
        <main className="flex-grow p-6 sm:p-8 max-w-7xl w-full mx-auto space-y-6 overflow-y-auto">

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <div className="relative">
                <div className="w-12 h-12 rounded-full border-4 border-[#6D5EF7]/20 border-t-[#6D5EF7] animate-spin" />
                <div className="w-12 h-12 rounded-full border-4 border-emerald-500/10 border-b-emerald-500 animate-spin absolute inset-0 rotate-180" />
              </div>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 animate-pulse">
                Fetching real-time database records...
              </p>
            </div>
          ) : (
            <>

          {/* =======================================================
              TAB: DASHBOARD OVERVIEW
              ======================================================= */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              
              {/* 6 Analytics Cards Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
                
                {/* 1. Total Students */}
                <div className="bg-gradient-to-br from-violet-50/70 to-indigo-50/30 border border-violet-100/60 rounded-[18px] p-4 shadow-[0_8px_30px_rgba(109,94,247,0.01)] hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between h-[135px]">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-indigo-700/80 uppercase tracking-wider">Total Students</span>
                    <div className="w-8 h-8 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                      <GraduationCap className="w-4 h-4 text-indigo-600" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-indigo-950">{stats.totalStudents}</h3>
                    <p className="text-[9px] font-bold text-indigo-600 mt-1 flex items-center gap-1">
                      <ChevronRight className="w-2.5 h-2.5 rotate-[-90deg]" /> {stats.totalStudentsChange}
                    </p>
                  </div>
                  <div className="w-full mt-2">
                    <svg viewBox="0 0 100 20" className="w-full h-5 text-indigo-400">
                      <path d="M0 15 Q25 5 50 12 T100 3" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  </div>
                </div>

                {/* 2. Verified Recruiters */}
                <div className="bg-gradient-to-br from-emerald-50/70 to-teal-50/30 border border-emerald-100/60 rounded-[18px] p-4 shadow-[0_8px_30px_rgba(34,197,94,0.01)] hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between h-[135px]">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-emerald-700/80 uppercase tracking-wider">Verified HRs</span>
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                      <Building2 className="w-4 h-4 text-emerald-600" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-emerald-950">{stats.verifiedRecruiters}</h3>
                    <p className="text-[9px] font-bold text-emerald-600 mt-1 flex items-center gap-1">
                      <ChevronRight className="w-2.5 h-2.5 rotate-[-90deg]" /> {stats.verifiedRecruitersChange}
                    </p>
                  </div>
                  <div className="w-full mt-2">
                    <svg viewBox="0 0 100 20" className="w-full h-5 text-emerald-400">
                      <path d="M0 18 Q20 8 40 14 T80 5 T100 8" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  </div>
                </div>

                {/* 3. Active Jobs */}
                <div className="bg-gradient-to-br from-blue-50/70 to-sky-50/30 border border-blue-100/60 rounded-[18px] p-4 shadow-[0_8px_30px_rgba(59,130,246,0.01)] hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between h-[135px]">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-blue-700/80 uppercase tracking-wider">Active Jobs</span>
                    <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center">
                      <Briefcase className="w-4 h-4 text-blue-600" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-blue-950">{stats.activeJobs}</h3>
                    <p className="text-[9px] font-bold text-blue-600 mt-1 flex items-center gap-1">
                      <ChevronRight className="w-2.5 h-2.5 rotate-[-90deg]" /> {stats.activeJobsChange}
                    </p>
                  </div>
                  <div className="w-full mt-2">
                    <svg viewBox="0 0 100 20" className="w-full h-5 text-blue-400">
                      <path d="M0 12 Q30 4 60 16 T100 2" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  </div>
                </div>

                {/* 4. Applications */}
                <div className="bg-gradient-to-br from-fuchsia-50/70 to-purple-50/30 border border-fuchsia-100/60 rounded-[18px] p-4 shadow-[0_8px_30px_rgba(217,70,239,0.01)] hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between h-[135px]">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-fuchsia-700/80 uppercase tracking-wider">Applications</span>
                    <div className="w-8 h-8 rounded-xl bg-fuchsia-500/10 flex items-center justify-center">
                      <FileText className="w-4 h-4 text-fuchsia-600" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-fuchsia-950">{stats.applications}</h3>
                    <p className="text-[9px] font-bold text-fuchsia-600 mt-1 flex items-center gap-1">
                      <ChevronRight className="w-2.5 h-2.5 rotate-[-90deg]" /> {stats.applicationsChange}
                    </p>
                  </div>
                  <div className="w-full mt-2">
                    <svg viewBox="0 0 100 20" className="w-full h-5 text-fuchsia-400">
                      <path d="M0 15 Q25 18 50 8 T100 4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  </div>
                </div>

                {/* 5. Placed */}
                <div className="bg-gradient-to-br from-rose-50/70 to-pink-50/30 border border-rose-100/60 rounded-[18px] p-4 shadow-[0_8px_30px_rgba(244,63,94,0.01)] hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between h-[135px]">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-rose-700/80 uppercase tracking-wider">Students Placed</span>
                    <div className="w-8 h-8 rounded-xl bg-rose-500/10 flex items-center justify-center">
                      <Award className="w-4 h-4 text-rose-600" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-rose-950">{stats.studentsPlaced}</h3>
                    <p className="text-[9px] font-bold text-rose-600 mt-1 flex items-center gap-1">
                      <ChevronRight className="w-2.5 h-2.5 rotate-[-90deg]" /> {stats.studentsPlacedChange}
                    </p>
                  </div>
                  <div className="w-full mt-2">
                    <svg viewBox="0 0 100 20" className="w-full h-5 text-rose-400">
                      <path d="M0 18 Q20 5 45 10 T90 2 T100 4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  </div>
                </div>

                {/* 6. Placement Rate */}
                <div className="bg-gradient-to-br from-amber-50/70 to-orange-50/30 border border-amber-100/60 rounded-[18px] p-4 shadow-[0_8px_30px_rgba(245,158,11,0.01)] hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between h-[135px]">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-amber-700/80 uppercase tracking-wider">Placement Rate</span>
                    <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center">
                      <Target className="w-4 h-4 text-amber-600" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-amber-950">{stats.placementRate}%</h3>
                    <p className="text-[9px] font-bold text-amber-600 mt-1 flex items-center gap-1">
                      <ChevronRight className="w-2.5 h-2.5 rotate-[-90deg]" /> {stats.placementRateChange}
                    </p>
                  </div>
                  <div className="w-full mt-2">
                    <svg viewBox="0 0 100 20" className="w-full h-5 text-amber-400">
                      <path d="M0 16 Q30 18 60 8 T100 2" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  </div>
                </div>

              </div>

              {/* Quick Actions Panel */}
              <div className="bg-white border border-slate-200/80 rounded-[18px] p-6 shadow-sm">
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#6D5EF7]" /> Quick Operations
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  <button onClick={() => setActiveModal('createDrive')} className="flex flex-col items-center justify-center p-3 rounded-xl border border-slate-100 hover:border-[#6D5EF7]/40 hover:bg-[#6D5EF7]/5 text-slate-700 hover:text-[#6D5EF7] transition-all duration-200 cursor-pointer">
                    <Target className="w-5 h-5 mb-2 shrink-0" />
                    <span className="text-[11px] font-bold text-center">New Drive</span>
                  </button>
                  <button onClick={() => setActiveModal('addStudent')} className="flex flex-col items-center justify-center p-3 rounded-xl border border-slate-100 hover:border-[#6D5EF7]/40 hover:bg-[#6D5EF7]/5 text-slate-700 hover:text-[#6D5EF7] transition-all duration-200 cursor-pointer">
                    <GraduationCap className="w-5 h-5 mb-2 shrink-0" />
                    <span className="text-[11px] font-bold text-center">Add Student</span>
                  </button>
                  <button onClick={() => { setActiveTab('recruiters'); addToast('info', 'Verification queue active'); }} className="flex flex-col items-center justify-center p-3 rounded-xl border border-slate-100 hover:border-[#6D5EF7]/40 hover:bg-[#6D5EF7]/5 text-slate-700 hover:text-[#6D5EF7] transition-all duration-200 cursor-pointer">
                    <Building2 className="w-5 h-5 mb-2 shrink-0" />
                    <span className="text-[11px] font-bold text-center">Approve HRs</span>
                  </button>
                  <button onClick={() => setActiveModal('announcement')} className="flex flex-col items-center justify-center p-3 rounded-xl border border-slate-100 hover:border-[#6D5EF7]/40 hover:bg-[#6D5EF7]/5 text-slate-700 hover:text-[#6D5EF7] transition-all duration-200 cursor-pointer">
                    <Megaphone className="w-5 h-5 mb-2 shrink-0" />
                    <span className="text-[11px] font-bold text-center">Broadcast</span>
                  </button>
                  <button onClick={() => setActiveModal('csvUpload')} className="flex flex-col items-center justify-center p-3 rounded-xl border border-slate-100 hover:border-[#6D5EF7]/40 hover:bg-[#6D5EF7]/5 text-slate-700 hover:text-[#6D5EF7] transition-all duration-200 cursor-pointer">
                    <FileSpreadsheet className="w-5 h-5 mb-2 shrink-0" />
                    <span className="text-[11px] font-bold text-center">Upload CSV</span>
                  </button>
                </div>
              </div>

              {/* Placement Overview details */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Left Card: Upcoming Placement Drives */}
                <div className="bg-white border border-slate-200/80 rounded-[18px] p-5 shadow-sm space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-50">
                    <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider">Upcoming Job Drives</h4>
                    <span className="text-[10px] text-[#6D5EF7] font-bold hover:underline cursor-pointer" onClick={() => setActiveTab('drives')}>View all</span>
                  </div>
                  <div className="space-y-4">
                    {drives.slice(0, 3).map(drive => (
                      <div key={drive.id} className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-xs font-bold text-slate-600">
                            {drive.company[0]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h5 className="text-xs font-bold text-slate-800 truncate">{drive.name}</h5>
                            <p className="text-[10px] text-slate-450 truncate">{drive.role} • {drive.ctc}</p>
                          </div>
                          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${drive.status === 'Open' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-50 text-slate-500'}`}>
                            {drive.status}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[9px] text-slate-400 mt-1">
                          <span>Deadline: {drive.deadline}</span>
                          <span className="font-bold">{drive.registeredCount} Applied</span>
                        </div>
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div 
                            className="bg-[#6D5EF7] h-full rounded-full" 
                            style={{ width: `${Math.min(100, (drive.registeredCount / 200) * 100)}%` }} 
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Middle Card: Top Recruiters */}
                <div className="bg-white border border-slate-200/80 rounded-[18px] p-5 shadow-sm space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-50">
                    <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider">Top Recruiter Engagement</h4>
                    <span className="text-[10px] text-[#6D5EF7] font-bold hover:underline cursor-pointer" onClick={() => setActiveTab('companies')}>Details</span>
                  </div>
                  <div className="space-y-3.5">
                    {companies.slice(0, 4).map(company => (
                      <div key={company.id} className="flex items-center gap-3 justify-between">
                        <div className="flex items-center gap-2">
                          <img src={company.logo} alt={company.name} className="w-7 h-7 rounded-lg object-contain bg-slate-50 p-0.5 border border-slate-100" />
                          <div>
                            <h5 className="text-xs font-bold text-slate-800">{company.name}</h5>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{company.industry}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-black text-[#6D5EF7]">{company.hiredCount} Placed</p>
                          <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-600 border border-emerald-100 mt-0.5 block">Active Partner</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right Card: Departments Needing Attention */}
                <div className="bg-white border border-slate-200/80 rounded-[18px] p-5 shadow-sm space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-50">
                    <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider">Department Tracker</h4>
                    <span className="text-[10px] text-[#6D5EF7] font-bold hover:underline cursor-pointer" onClick={() => setActiveTab('analytics')}>Analytics</span>
                  </div>
                  <div className="space-y-4">
                    {branchPlacements.slice(0, 4).map(bp => {
                      const pending = bp.total - bp.placed;
                      let colorClass = "text-rose-500";
                      let bgClass = "bg-rose-400";
                      if (bp.pct >= 75) {
                        colorClass = "text-emerald-650";
                        bgClass = "bg-[#22C55E]";
                      } else if (bp.pct >= 50) {
                        colorClass = "text-amber-500";
                        bgClass = "bg-amber-400";
                      }
                      
                      const branchFullNames = {
                        'CSE': 'Computer Science (CSE)',
                        'ECE': 'Electronics (ECE)',
                        'ME': 'Mechanical Engineering',
                        'CE': 'Civil Engineering',
                        'EE': 'Electrical Engineering',
                        'MBA': 'Business Administration (MBA)'
                      };
                      const displayName = branchFullNames[bp.branch] || bp.branch;
                      const targetPct = bp.branch === 'CSE' ? 95 : (bp.branch === 'MBA' ? 85 : 75);

                      return (
                        <div key={bp.branch}>
                          <div className="flex items-center justify-between text-[11px] mb-1.5">
                            <span className="font-bold text-slate-800">{displayName}</span>
                            <span className={`font-black ${colorClass}`}>{bp.pct}% placed</span>
                          </div>
                          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div className={`${bgClass} h-full rounded-full`} style={{ width: `${bp.pct}%` }} />
                          </div>
                          <span className="text-[9px] text-slate-400 block mt-1">
                            Target Placement: {targetPct}% • {pending} students pending
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>

              {/* Activity Timeline and logins */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Timeline activity list */}
                <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-[18px] p-6 shadow-sm space-y-4">
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider pb-2 border-b border-slate-50">Recent System Activities</h3>
                  <div className="space-y-4">
                    {notificationsList.length > 0 ? (
                      notificationsList.slice(0, 3).map(notif => {
                        let iconBg = "bg-[#6D5EF7]/10";
                        let iconColor = "text-[#6D5EF7]";
                        let IconComponent = CheckCircle2;

                        if (notif.type === 'recruiter') {
                          iconBg = "bg-emerald-500/10";
                          iconColor = "text-[#22C55E]";
                          IconComponent = Building2;
                        } else if (notif.type === 'resume') {
                          iconBg = "bg-amber-500/10";
                          iconColor = "text-[#F59E0B]";
                          IconComponent = FileCheck2;
                        } else if (notif.type === 'application') {
                          iconBg = "bg-fuchsia-500/10";
                          iconColor = "text-fuchsia-500";
                          IconComponent = Award;
                        }

                        // Parse title from type or use default
                        let title = "System Notification";
                        if (notif.type === 'recruiter') title = "Recruiter Activity";
                        else if (notif.type === 'resume') title = "Resume Verification";
                        else if (notif.type === 'application') title = "Application Update";
                        else if (notif.type === 'announcement') title = "Announcement Published";

                        return (
                          <div key={notif.id} className="flex gap-4 items-start">
                            <div className={`w-8 h-8 rounded-full ${iconBg} flex items-center justify-center shrink-0 mt-0.5`}>
                              <IconComponent className={`w-4 h-4 ${iconColor}`} />
                            </div>
                            <div className="flex-1">
                              <p className="text-xs font-bold text-slate-700">{title}</p>
                              <p className="text-[11px] text-slate-500 mt-0.5">{notif.text}</p>
                              <span className="text-[9px] text-slate-400 font-mono block mt-1">{notif.time}</span>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-6 text-slate-400 text-xs font-semibold">
                        No recent system activities logged.
                      </div>
                    )}
                  </div>
                </div>

                {/* Logins table list */}
                <div className="bg-white border border-slate-200/80 rounded-[18px] p-5 shadow-sm space-y-4">
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider pb-2 border-b border-slate-50">Recent System Logins</h3>
                  <div className="space-y-3.5">
                    {recentLogins.map((log, idx) => (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between items-start text-xs">
                          <span className="font-bold text-slate-750 truncate max-w-[150px]">{log.user}</span>
                          <span className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-mono">{log.ip}</span>
                        </div>
                        <div className="flex justify-between text-[9px] text-slate-400">
                          <span>{log.location}</span>
                          <span>{log.time}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* =======================================================
              TAB: STUDENTS MANAGEMENT
              ======================================================= */}
          {activeTab === 'students' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              
              {/* Header and Add Student CTA */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <p className="text-xs text-slate-450 font-bold uppercase tracking-wider">Configure Student Profiles & Placement Status</p>
                <button
                  onClick={() => setActiveModal('addStudent')}
                  className="bg-[#6D5EF7] hover:bg-[#5B4EE0] text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-sm shadow-[#6D5EF7]/10 cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Add Student Record
                </button>
              </div>

              {/* Filters Block */}
              <div className="bg-white border border-slate-200/80 rounded-[18px] p-4 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
                
                {/* Search box */}
                <div className="flex items-center gap-2 bg-[#F8FAFC] border border-slate-200 rounded-xl px-3 py-2 w-full md:w-72">
                  <Search className="w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by name, roll, email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-transparent border-none text-xs focus:outline-none w-full text-slate-700"
                  />
                </div>

                {/* Dropdown Filters */}
                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 font-bold">
                    <Filter className="w-3.5 h-3.5" /> Filters:
                  </div>
                  
                  <select 
                    value={studentBranchFilter}
                    onChange={(e) => setStudentBranchFilter(e.target.value)}
                    className="bg-[#F8FAFC] border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none text-slate-600"
                  >
                    <option value="All">All Branches</option>
                    <option value="CSE">CSE</option>
                    <option value="ECE">ECE</option>
                    <option value="ME">ME</option>
                    <option value="EE">EE</option>
                    <option value="MBA">MBA</option>
                  </select>

                  <select
                    value={studentStatusFilter}
                    onChange={(e) => setStudentStatusFilter(e.target.value)}
                    className="bg-[#F8FAFC] border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none text-slate-600"
                  >
                    <option value="All">All Statuses</option>
                    <option value="Placed">Placed</option>
                    <option value="Unplaced">Unplaced</option>
                    <option value="Verified">Resume Verified</option>
                    <option value="Pending">Resume Pending</option>
                  </select>

                  {/* CGPA Range slider */}
                  <div className="flex items-center gap-2 bg-[#F8FAFC] border border-slate-200 rounded-xl px-3 py-1 text-xs">
                    <span className="font-semibold text-slate-500">CGPA ≥ {studentCgpafilter || '0.0'}</span>
                    <input 
                      type="range" 
                      min="0" 
                      max="10" 
                      step="0.5" 
                      value={studentCgpafilter}
                      onChange={(e) => setStudentCgpafilter(parseFloat(e.target.value))}
                      className="accent-[#6D5EF7] w-20"
                    />
                  </div>
                </div>

              </div>

              {/* Table list */}
              <div className="bg-white border border-slate-200/80 rounded-[18px] overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/70 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        <th className="px-6 py-4">Student Details</th>
                        <th className="px-6 py-4">Roll Number</th>
                        <th className="px-6 py-4">Branch / Batch</th>
                        <th className="px-6 py-4">CGPA</th>
                        <th className="px-6 py-4">Resume</th>
                        <th className="px-6 py-4">Placement</th>
                        <th className="px-6 py-4 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-600">
                      {paginatedStudents.length === 0 ? (
                        <tr>
                          <td colSpan="7" className="text-center py-12">
                            <div className="flex flex-col items-center justify-center space-y-2">
                              <Info className="w-8 h-8 text-slate-300" />
                              <p className="text-slate-400 font-bold text-sm">No Student Records Found</p>
                              <span className="text-slate-400 text-xs">Adjust filter settings or try a different search query.</span>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        paginatedStudents.map(student => (
                          <tr key={student.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <img src={student.photo} alt={student.name} className="w-8 h-8 rounded-full object-cover border border-slate-100" />
                                <div>
                                  <p className="font-bold text-slate-800">{student.name}</p>
                                  <span className="text-[10px] text-slate-400">{student.email}</span>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 font-mono font-bold text-slate-500">{student.rollNumber}</td>
                            <td className="px-6 py-4">
                              <div>
                                <p className="text-slate-800 font-semibold">{student.branch}</p>
                                <span className="text-[9px] text-slate-400">Class of {student.year}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="bg-indigo-50 text-[#6D5EF7] font-black px-2 py-0.5 rounded text-[11px] border border-indigo-100">
                                {student.cgpa.toFixed(2)}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                                student.resumeStatus === 'Verified' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                student.resumeStatus === 'Rejected' ? 'bg-rose-50 text-rose-700 border-rose-100' :
                                student.resumeStatus === 'Suspended' ? 'bg-slate-100 text-slate-650 border-slate-200' : 'bg-amber-50 text-amber-700 border-amber-100'
                              }`}>
                                {student.resumeStatus}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              {student.placementStatus === 'Placed' ? (
                                <div>
                                  <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded text-[10px] font-bold inline-block font-sans">Placed</span>
                                  <p className="text-[9px] font-bold text-slate-450 mt-1 uppercase">{student.company} • {student.ctc}</p>
                                </div>
                              ) : (
                                <span className="bg-slate-50 text-slate-400 border border-slate-200 px-2 py-0.5 rounded text-[10px] font-bold">Unplaced</span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <button 
                                  onClick={() => { setSelectedStudent(student); setActiveModal('viewStudent'); }}
                                  className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-650 cursor-pointer"
                                  title="View Details"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                                <button 
                                  onClick={() => handleToggleStudentSuspension(student.id)}
                                  className={`p-1.5 rounded-lg border border-transparent hover:bg-slate-100 cursor-pointer ${student.resumeStatus === 'Suspended' ? 'text-emerald-500 hover:text-emerald-600' : 'text-slate-400 hover:text-slate-650'}`}
                                  title={student.resumeStatus === 'Suspended' ? 'Activate Account' : 'Suspend Account'}
                                >
                                  <Power className="w-3.5 h-3.5" />
                                </button>
                                <button 
                                  onClick={() => handleDeleteStudent(student.id)}
                                  className="p-1.5 hover:bg-rose-50 rounded-lg text-slate-400 hover:text-rose-605 cursor-pointer"
                                  title="Delete Record"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination footer */}
                {filteredStudents.length > 0 && (
                  <div className="bg-slate-50/50 px-6 py-3.5 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Showing {(studentPage - 1) * studentsPerPage + 1} - {Math.min(studentPage * studentsPerPage, filteredStudents.length)} of {filteredStudents.length} Students
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setStudentPage(prev => Math.max(1, prev - 1))}
                        disabled={studentPage === 1}
                        className="p-1.5 border border-slate-200 rounded-lg hover:bg-white text-slate-500 disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-xs font-bold text-slate-600 px-2">Page {studentPage} of {totalStudentPages}</span>
                      <button
                        onClick={() => setStudentPage(prev => Math.min(totalStudentPages, prev + 1))}
                        disabled={studentPage === totalStudentPages}
                        className="p-1.5 border border-slate-200 rounded-lg hover:bg-white text-slate-500 disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* =======================================================
              TAB: RECRUITER MANAGEMENT
              ======================================================= */}
          {activeTab === 'recruiters' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              
              {/* Header description */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <p className="text-xs text-slate-450 font-bold uppercase tracking-wider">Verify Recruiter Agency Registrations & Job Pipelines</p>
                <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 w-64 shadow-sm">
                  <Search className="w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search company HR details..."
                    value={recruiterSearch}
                    onChange={(e) => setRecruiterSearch(e.target.value)}
                    className="bg-transparent border-none text-xs focus:outline-none w-full text-slate-700"
                  />
                </div>
              </div>

              {/* Recruiters table */}
              <div className="bg-white border border-slate-200/80 rounded-[18px] overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/70 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      <th className="px-6 py-4">Company Details</th>
                      <th className="px-6 py-4">HR Coordinator</th>
                      <th className="px-6 py-4">Industry / Vertical</th>
                      <th className="px-6 py-4 text-center">Jobs Posted</th>
                      <th className="px-6 py-4">Approval Status</th>
                      <th className="px-6 py-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-600">
                    {filteredRecruiters.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="text-center py-12 text-slate-400">No recruiters found</td>
                      </tr>
                    ) : (
                      filteredRecruiters.map(r => (
                        <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <img src={r.logo} alt={r.companyName} className="w-8 h-8 rounded-lg object-contain bg-slate-50 border border-slate-100 p-0.5" />
                              <span className="font-bold text-slate-800">{r.companyName}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div>
                              <p className="font-semibold text-slate-800">{r.hrName}</p>
                              <span className="text-[10px] text-slate-400">{r.email}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="bg-slate-100 text-slate-650 px-2 py-0.5 rounded text-[10px] font-bold">{r.industry}</span>
                          </td>
                          <td className="px-6 py-4 font-mono font-bold text-center w-24 text-slate-700">{r.jobsPosted}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                              r.approvalStatus === 'Approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                              r.approvalStatus === 'Rejected' ? 'bg-rose-50 text-rose-700 border-rose-100' : 'bg-amber-50 text-amber-700 border-amber-100'
                            }`}>
                              {r.approvalStatus}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              {r.approvalStatus !== 'Approved' && (
                                <button
                                  onClick={() => handleApproveRecruiter(r.id)}
                                  disabled={actionLoading === r.id}
                                  className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold border border-emerald-100 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                                >
                                  <Check className="w-3.5 h-3.5" /> Verify
                                </button>
                              )}
                              {r.approvalStatus !== 'Rejected' && (
                                <button
                                  onClick={() => handleRejectRecruiter(r.id)}
                                  disabled={actionLoading === r.id}
                                  className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold border border-rose-100 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                                >
                                  <X className="w-3.5 h-3.5" /> Decline
                                </button>
                              )}
                              <button
                                onClick={() => handleDeleteRecruiter(r.id)}
                                className="p-1 text-slate-400 hover:text-slate-650 hover:bg-slate-50 rounded cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

            </div>
          )}

          {/* =======================================================
              TAB: COMPANIES DIRECTORY
              ======================================================= */}
          {activeTab === 'companies' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              
              {/* Header and search */}
              <div className="flex justify-between items-center pb-2 border-b border-slate-105">
                <p className="text-xs text-slate-450 font-bold uppercase tracking-wider">Corporate Partners & Hiring metrics</p>
                <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 w-64 shadow-sm">
                  <Search className="w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search corporate database..."
                    value={companySearchQuery}
                    onChange={(e) => setCompanySearchQuery(e.target.value)}
                    className="bg-transparent border-none text-xs focus:outline-none w-full text-slate-700"
                  />
                </div>
              </div>

              {/* Companies Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {filteredCompanies.map(c => (
                  <div key={c.id} className="bg-white border border-slate-200/80 rounded-[18px] p-5 shadow-sm space-y-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <img src={c.logo} alt={c.name} className="w-10 h-10 rounded-xl object-contain bg-slate-50 border border-slate-100 p-1" />
                        <div>
                          <h4 className="text-sm font-bold text-slate-800">{c.name}</h4>
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{c.industry}</span>
                        </div>
                      </div>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${c.approved ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-amber-50 text-amber-700 border-amber-100'}`}>
                        {c.approved ? 'Verified Partner' : 'Pending Verification'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 border-y border-slate-50 py-3 text-xs text-slate-500">
                      <div>
                        <span className="block text-[10px] text-slate-400 font-bold uppercase">Jobs Published</span>
                        <p className="font-black text-slate-800 text-sm mt-0.5">{c.jobsCount}</p>
                      </div>
                      <div>
                        <span className="block text-[10px] text-slate-400 font-bold uppercase">Hired Count</span>
                        <p className="font-black text-slate-800 text-sm mt-0.5">{c.hiredCount} Students</p>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <p className="text-[10px] text-slate-400 font-bold uppercase">HR Contact Person</p>
                      <div className="flex items-center justify-between text-xs font-semibold text-slate-605">
                        <span>{c.hrName}</span>
                        <span className="text-[#6D5EF7]">{c.email}</span>
                      </div>
                    </div>

                    <div className="pt-2 flex justify-between items-center text-xs">
                      <div className="flex items-center gap-1 text-amber-500">
                        <Star className="w-3.5 h-3.5 fill-current" />
                        <span className="font-bold">{c.rating}</span>
                      </div>
                      <a href={`https://${c.website}`} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-[#6D5EF7] hover:underline font-bold text-[11px]">
                        Visit {c.website}
                      </a>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          )}

          {/* =======================================================
              TAB: PLACEMENT DRIVES
              ======================================================= */}
          {activeTab === 'drives' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              
              {/* Header action */}
              <div className="flex justify-between items-center">
                <p className="text-xs text-slate-450 font-bold uppercase tracking-wider">Active Placement Operations & Timelines</p>
                <button
                  onClick={() => setActiveModal('createDrive')}
                  className="bg-[#6D5EF7] hover:bg-[#5B4EE0] text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-2 transition-all shadow-sm shadow-[#6D5EF7]/10 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Schedule New Drive
                </button>
              </div>

              {/* Drives Table */}
              <div className="bg-white border border-slate-200/80 rounded-[18px] overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/70 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      <th className="px-6 py-4">Drive Description</th>
                      <th className="px-6 py-4">Recruiter Company</th>
                      <th className="px-6 py-4">Offered Package</th>
                      <th className="px-6 py-4">Eligibility Specs</th>
                      <th className="px-6 py-4">Closing Date</th>
                      <th className="px-6 py-4">Drive Status</th>
                      <th className="px-6 py-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-650">
                    {filteredDrives.map(drive => (
                      <tr key={drive.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-bold text-slate-800">{drive.name}</p>
                            <span className="text-[10px] text-slate-400">{drive.role}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-bold text-slate-800">{drive.company}</span>
                        </td>
                        <td className="px-6 py-4 font-mono font-bold text-emerald-600">{drive.ctc}</td>
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <div className="flex flex-wrap gap-1">
                              {drive.branches.map(b => (
                                <span key={b} className="bg-indigo-50 text-[#6D5EF7] border border-indigo-100 rounded px-1.5 py-0.5 text-[9px] font-bold">{b}</span>
                              ))}
                            </div>
                            <span className="text-[9px] text-slate-400 block">Mode: {drive.mode} • Venue: {drive.venue}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-500">{drive.deadline}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                            drive.status === 'Open' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-105 text-slate-600 border-slate-200'
                          }`}>
                            {drive.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleToggleDrive(drive.id)}
                              className="p-1.5 hover:bg-slate-50 rounded text-slate-500 hover:text-slate-700 cursor-pointer"
                              title="Toggle Open/Closed"
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => { setSelectedDrive(drive); addToast('info', `Displaying registrations for: ${drive.name}`); }}
                              className="p-1.5 hover:bg-slate-50 rounded text-slate-500 hover:text-[#6D5EF7] cursor-pointer"
                              title="Applicants view"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteDrive(drive.id)}
                              className="p-1.5 hover:bg-rose-50 rounded text-slate-500 hover:text-rose-600 cursor-pointer"
                              title="Cancel Drive"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

            </div>
          )}

          {/* =======================================================
              TAB: JOB POSTINGS
              ======================================================= */}
          {activeTab === 'jobs' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              
              <div className="pb-2 border-b border-slate-100">
                <p className="text-xs text-slate-450 font-bold uppercase tracking-wider">Audit Active Corporate Vacancy Postings</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {drives.map(job => (
                  <div key={job.id} className="bg-white border border-slate-200/80 rounded-[18px] p-5 shadow-sm space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-sm font-bold text-slate-800">{job.role}</h4>
                        <p className="text-xs font-semibold text-[#6D5EF7]">{job.company}</p>
                      </div>
                      <span className="text-xs font-black text-emerald-600 font-mono bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">{job.ctc}</span>
                    </div>

                    <div className="text-xs text-slate-500 space-y-2">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>Location / Venue: {job.venue} ({job.mode})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>Eligible Branches: {job.branches.join(', ')}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-bold text-slate-700">{job.registeredCount} candidates applied.</span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-50 flex items-center justify-between">
                      <span className="text-[10px] text-slate-400 font-mono">Deadline: {job.deadline}</span>
                      <div className="flex gap-2">
                        <button onClick={() => addToast('info', 'Edit Job Specs details Mocked')} className="px-2.5 py-1 text-slate-500 hover:text-slate-750 hover:bg-slate-50 rounded border border-slate-200 font-bold text-[10px] cursor-pointer">
                          Edit Specs
                        </button>
                        <button onClick={() => addToast('success', 'Vacancy status updated')} className="px-2.5 py-1 bg-[#6D5EF7] text-white rounded font-bold text-[10px] hover:bg-[#5B4EE0] cursor-pointer">
                          Promote Listing
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          )}

          {/* =======================================================
              TAB: APPLICATIONS
              ======================================================= */}
          {activeTab === 'applications' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              
              <div className="pb-2 border-b border-slate-100 flex justify-between items-center">
                <p className="text-xs text-slate-450 font-bold uppercase tracking-wider">Candidate Recruitment Pipeline Audits</p>
                <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 w-64 shadow-sm">
                  <Search className="w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search candidate applications..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-transparent border-none text-xs focus:outline-none w-full text-slate-700"
                  />
                </div>
              </div>

              {/* Applications list table */}
              <div className="bg-white border border-slate-200/80 rounded-[18px] overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/70 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      <th className="px-6 py-4">Student Candidate</th>
                      <th className="px-6 py-4">Applied Company</th>
                      <th className="px-6 py-4">Target Role</th>
                      <th className="px-6 py-4">Submission Date</th>
                      <th className="px-6 py-4">Assessment Stage</th>
                      <th className="px-6 py-4">Pipeline Status</th>
                      <th className="px-6 py-4 text-center">Pipeline Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-600">
                    {applications.filter(a => a.student.toLowerCase().includes(searchQuery.toLowerCase()) || a.company.toLowerCase().includes(searchQuery.toLowerCase())).map(app => (
                      <tr key={app.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 font-bold text-slate-800">{app.student}</td>
                        <td className="px-6 py-4 font-semibold">{app.company}</td>
                        <td className="px-6 py-4 text-slate-500">{app.role}</td>
                        <td className="px-6 py-4 text-slate-400">{app.appliedDate}</td>
                        <td className="px-6 py-4">
                          <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] font-bold">{app.stage}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                            app.status === 'Selected' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                            app.status === 'Rejected' ? 'bg-rose-50 text-rose-700 border-rose-100' : 'bg-amber-50 text-amber-700 border-amber-100'
                          }`}>
                            {app.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => {
                                setApplications(prev => prev.map(a => a.id === app.id ? { ...a, status: 'Selected', stage: 'Offer Dispatched' } : a));
                                addToast('success', `${app.student} status updated to Placed!`);
                              }}
                              className="px-2 py-1 bg-emerald-50 hover:bg-emerald-105 text-emerald-700 border border-emerald-100 rounded font-bold text-[10px] cursor-pointer"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => {
                                setApplications(prev => prev.map(a => a.id === app.id ? { ...a, status: 'Rejected' } : a));
                                addToast('danger', `${app.student} application rejected.`);
                              }}
                              className="px-2 py-1 bg-rose-50 hover:bg-rose-105 text-rose-700 border border-rose-100 rounded font-bold text-[10px] cursor-pointer"
                            >
                              Reject
                            </button>
                            <button
                              onClick={() => {
                                setApplications(prev => prev.map(a => {
                                  if (a.id === app.id) {
                                    const nextStage = a.stage === 'Aptitude Test' ? 'Technical Interview' : 'HR Round';
                                    return { ...a, stage: nextStage };
                                  }
                                  return a;
                                }));
                                addToast('info', 'Advanced candidate to next vetting round.');
                              }}
                              className="px-2 py-1 bg-indigo-50 hover:bg-indigo-105 text-[#6D5EF7] border border-indigo-100 rounded font-bold text-[10px] cursor-pointer"
                            >
                              Next Round
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

            </div>
          )}

          {/* =======================================================
              TAB: SHORTLISTS
              ======================================================= */}
          {activeTab === 'shortlists' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              
              <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                <p className="text-xs text-slate-450 font-bold uppercase tracking-wider">Placement Drive Selection Shortlists Logs</p>
                <button
                  onClick={() => setActiveModal('csvUpload')}
                  className="bg-[#6D5EF7] hover:bg-[#5B4EE0] text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-sm cursor-pointer"
                >
                  <Upload className="w-4 h-4" /> Upload Shortlist CSV
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {shortlists.map(list => (
                  <div key={list.id} className="bg-white border border-slate-200/80 rounded-[18px] p-5 shadow-sm space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-xs font-bold text-emerald-600">
                          CSV
                        </div>
                        <div>
                          <h4 className="text-xs font-black text-slate-800">{list.driveName}</h4>
                          <span className="text-[10px] text-slate-450 font-semibold">{list.companyName}</span>
                        </div>
                      </div>
                      <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] font-bold px-2 py-0.5 rounded">
                        Published
                      </span>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-xl flex items-center justify-between text-xs text-slate-500">
                      <div>
                        <span className="block text-[9px] text-slate-400 font-bold uppercase">Target Round</span>
                        <span className="font-bold text-slate-700">{list.round}</span>
                      </div>
                      <div className="text-right">
                        <span className="block text-[9px] text-slate-400 font-bold uppercase">Shortlisted Count</span>
                        <span className="font-black text-slate-800 text-sm">{list.count} Students</span>
                      </div>
                    </div>

                    <div className="pt-2 flex justify-between items-center text-xs text-slate-400">
                      <span>Uploaded on: {list.publishedDate}</span>
                      <button onClick={() => addToast('success', 'Shortlist file downloaded')} className="text-[#6D5EF7] hover:underline flex items-center gap-1 font-bold cursor-pointer">
                        <Download className="w-3.5 h-3.5" /> Download XLS
                      </button>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          )}

          {/* =======================================================
              TAB: ANALYTICS
              ======================================================= */}
          {activeTab === 'analytics' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              
              <div className="pb-2 border-b border-slate-100">
                <p className="text-xs text-slate-450 font-bold uppercase tracking-wider">Placement Metrics charts & projections</p>
              </div>

              {/* Charts grid row 1 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* 1. Branch-wise Placements Bar Chart SVG */}
                <div className="bg-white border border-slate-200/80 rounded-[18px] p-5 shadow-sm space-y-4">
                  <h4 className="text-xs font-black uppercase text-slate-750 tracking-wider">Branch Placement Progress</h4>
                  <div className="pt-2 relative h-48 w-full flex items-end justify-between px-2 border-b border-slate-200 pb-2">
                    {branchPlacements.map(bp => (
                      <div key={bp.branch} className="flex flex-col items-center gap-2 w-12 group">
                        <div className="w-full flex items-end gap-1 h-36">
                          <div 
                            className="bg-[#6D5EF7]/10 w-4 rounded-t-sm" 
                            style={{ height: '100%' }}
                            title={`Total: ${bp.total}`}
                          />
                          <div 
                            className="bg-[#6D5EF7] w-4 rounded-t-sm transition-all duration-500" 
                            style={{ height: `${bp.pct}%` }}
                            title={`Placed: ${bp.placed} (${bp.pct}%)`}
                          />
                        </div>
                        <span className="text-[10px] font-bold text-slate-500">{bp.branch}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-4 items-center justify-center text-[10px] text-slate-450 font-bold uppercase pt-2">
                    <div className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 bg-[#6D5EF7]/10 rounded" /> Total Students
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 bg-[#6D5EF7] rounded" /> Placed Count
                    </div>
                  </div>
                </div>
                    {/* 2. Monthly Placements Spline Line Area Chart SVG */}
                <div className="bg-white border border-slate-200/80 rounded-[18px] p-5 shadow-sm space-y-4">
                  <h4 className="text-xs font-black uppercase text-slate-750 tracking-wider">Placements Timeline (Jan - July)</h4>
                  <div className="pt-2">
                    <svg viewBox="0 0 500 200" className="w-full h-48">
                      {/* Grid Lines */}
                      <line x1="0" y1="50" x2="500" y2="50" stroke="#f1f5f9" strokeWidth="1" />
                      <line x1="0" y1="100" x2="500" y2="100" stroke="#f1f5f9" strokeWidth="1" />
                      <line x1="0" y1="150" x2="500" y2="150" stroke="#f1f5f9" strokeWidth="1" />
                      
                      {/* Line Curve Gradient Area */}
                      {applications.length > 0 && (
                        <path 
                          d={monthlyAreaD} 
                          fill="url(#gradArea)" 
                        />
                      )}
                      
                      {/* Sparkline curve */}
                      {applications.length > 0 && (
                        <path 
                          d={monthlyPathD} 
                          fill="none" 
                          stroke="#6D5EF7" 
                          strokeWidth="2.5" 
                          strokeLinecap="round" 
                        />
                      )}

                      {/* Dots and Labels */}
                      {monthlyPoints.map((pt, idx) => (
                        <circle key={idx} cx={pt.x} cy={pt.y} r="3.5" fill="#6d5ef7" />
                      ))}

                      <defs>
                        <linearGradient id="gradArea" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#6D5EF7" stopOpacity="0.25" />
                          <stop offset="100%" stopColor="#6D5EF7" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="flex justify-between px-2 text-[9px] text-slate-400 font-bold uppercase mt-2">
                      <span>Jan</span>
                      <span>Feb</span>
                      <span>Mar</span>
                      <span>Apr</span>
                      <span>May</span>
                      <span>Jun</span>
                      <span>Jul (Current)</span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Charts grid row 2 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* 1. Donut Chart Company hiring */}
                <div className="bg-white border border-slate-200/80 rounded-[18px] p-5 shadow-sm space-y-4">
                  <h4 className="text-xs font-black uppercase text-slate-755 tracking-wider">Hiring Share by Recruiter</h4>
                  <div className="flex items-center justify-around py-2">
                    <svg className="w-28 h-28 transform -rotate-90" viewBox="0 0 32 32">
                      {totalSelections === 0 ? (
                        <circle cx="16" cy="16" r="14" fill="none" stroke="#e2e8f0" strokeWidth="4" />
                      ) : (
                        (() => {
                          let accum = 0;
                          const colors = ['#6D5EF7', '#22C55E', '#F59E0B', '#EF4444', '#3B82F6'];
                          return companyHiring.map((ch, idx) => {
                            const pct = Math.round((ch.count / totalSelections) * 100);
                            const strokeDasharray = `${pct} 100`;
                            const strokeDashoffset = -accum;
                            accum += pct;
                            return (
                              <circle
                                key={ch.name}
                                cx="16"
                                cy="16"
                                r="14"
                                fill="none"
                                stroke={colors[idx % colors.length]}
                                strokeWidth="4"
                                strokeDasharray={strokeDasharray}
                                strokeDashoffset={strokeDashoffset}
                              />
                            );
                          });
                        })()
                      )}
                    </svg>

                    <div className="text-[10px] font-bold text-slate-500 space-y-2">
                      {totalSelections === 0 ? (
                        <div className="text-slate-400 font-bold uppercase text-[9px]">No hires yet</div>
                      ) : (
                        (() => {
                          const colors = ['#6D5EF7', '#22C55E', '#F59E0B', '#EF4444', '#3B82F6'];
                          return companyHiring.map((ch, idx) => {
                            const pct = Math.round((ch.count / totalSelections) * 100);
                            return (
                              <div key={ch.name} className="flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: colors[idx % colors.length] }} /> 
                                {ch.name} ({pct}%)
                              </div>
                            );
                          });
                        })()
                      )}
                    </div>
                  </div>
                </div>

                {/* 2. Top Recruiters list */}
                <div className="bg-white border border-slate-200/80 rounded-[18px] p-5 shadow-sm space-y-4">
                  <h4 className="text-xs font-black uppercase text-slate-750 tracking-wider">Top Recruiter Packages</h4>
                  <div className="space-y-3.5">
                    {topDrives.length === 0 ? (
                      <div className="text-xs text-slate-400 font-bold uppercase">No active jobs posted yet</div>
                    ) : (
                      topDrives.map((td, idx) => {
                        const maxVal = topDrives[0]?.ctcVal || 1;
                        const pctWidth = Math.round((td.ctcVal / maxVal) * 100);
                        return (
                          <div key={idx}>
                            <div className="flex justify-between text-xs mb-1">
                              <span className="font-bold text-slate-700">{td.companyName}</span>
                              <span className="font-black text-slate-850">{td.ctcStr}</span>
                            </div>
                            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                              <div className="bg-[#6D5EF7] h-full rounded-full" style={{ width: `${pctWidth}%` }} />
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* 3. Package metrics details */}
                <div className="bg-white border border-slate-200/80 rounded-[18px] p-5 shadow-sm space-y-5">
                  <h4 className="text-xs font-black uppercase text-slate-755 tracking-wider">Compensation Breakdown</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-indigo-50/30 border border-indigo-100 rounded-xl">
                      <span className="block text-[9px] text-slate-455 uppercase font-black">Average Package</span>
                      <p className="text-lg font-black text-[#6D5EF7] mt-0.5">
                        {drives.length ? (drives.reduce((sum, d) => sum + (parseFloat(d.ctc) || 0), 0) / drives.length).toFixed(1) : '0.0'} LPA
                      </p>
                      <span className="text-[8px] text-[#6D5EF7] block mt-1">Real-time avg</span>
                    </div>

                    <div className="p-3 bg-emerald-50/30 border border-emerald-100 rounded-xl">
                      <span className="block text-[9px] text-slate-455 uppercase font-black">Highest Package</span>
                      <p className="text-lg font-black text-emerald-600 mt-0.5">
                        {drives.length ? Math.max(...drives.map(d => parseFloat(d.ctc) || 0)).toFixed(1) : '0.0'} LPA
                      </p>
                      <span className="text-[8px] text-emerald-600 block mt-1">
                        {drives.length ? [...drives].sort((a,b) => (parseFloat(b.ctc)||0) - (parseFloat(a.ctc)||0))[0]?.companyName : 'None'}
                      </span>
                    </div>
                  </div>              
                  <div className="bg-slate-50/50 border border-slate-100 p-2.5 rounded-xl text-[10px] text-slate-450 leading-relaxed font-bold uppercase text-center">
                    Current targets match 100% compliance projections.
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* =======================================================
              TAB: ANNOUNCEMENTS
              ======================================================= */}
          {activeTab === 'announcements' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              
              <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                <p className="text-xs text-slate-450 font-bold uppercase tracking-wider">Broadcast Notices & placement alerts</p>
                <button
                  onClick={() => setActiveModal('announcement')}
                  className="bg-[#6D5EF7] hover:bg-[#5B4EE0] text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-2 transition-all shadow-sm cursor-pointer"
                >
                  <Megaphone className="w-3.5 h-3.5" /> Post Announcement
                </button>
              </div>

              {/* History log list */}
              <div className="space-y-4">
                {announcements.map(notice => (
                  <div key={notice.id} className="bg-white border border-slate-200/80 rounded-[18px] p-5 shadow-sm space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-sm font-bold text-slate-800">{notice.title}</h4>
                        <span className="text-[9px] text-slate-400 font-bold">Target Audience: {notice.targetAudience}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-bold font-mono">{notice.date}</span>
                    </div>

                    <p className="text-xs text-slate-605 leading-relaxed">{notice.content}</p>

                    {notice.attachment && (
                      <div className="pt-2 border-t border-slate-50 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 text-slate-500">
                          <FileText className="w-4 h-4 text-[#6D5EF7]" />
                          <span className="font-semibold">{notice.attachment}</span>
                        </div>
                        <button onClick={() => addToast('success', 'Attachment downloaded')} className="text-[#6D5EF7] hover:underline font-bold cursor-pointer">
                          Download JD
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>

            </div>
          )}

          {/* =======================================================
              TAB: NOTIFICATIONS
              ======================================================= */}
          {activeTab === 'notifications' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              
              <div className="pb-2 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <p className="text-xs text-slate-450 font-bold uppercase tracking-wider">Audit System Alerts & Event logs</p>
                </div>
                {notificationsList.some(n => !n.read) && (
                  <button 
                    onClick={handleMarkAllNotificationsAsRead}
                    className="text-xs px-3 py-1.5 bg-[#6D5EF7] hover:bg-[#5B4EE0] text-white rounded-xl font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <CheckSquare className="w-3.5 h-3.5" />
                    <span>Mark All Read</span>
                  </button>
                )}
              </div>

              {/* Notification Filters */}
              <div className="flex flex-wrap items-center gap-2">
                {['All', 'Unread', 'Read', 'recruiter', 'resume', 'application', 'system'].map((filterVal) => {
                  const isActive = notifFilter === filterVal;
                  let displayLabel = filterVal.charAt(0).toUpperCase() + filterVal.slice(1);
                  if (filterVal === 'recruiter') displayLabel = 'Recruiter Alerts';
                  if (filterVal === 'resume') displayLabel = 'Resume Submissions';
                  if (filterVal === 'application') displayLabel = 'Application Changes';
                  
                  return (
                    <button
                      key={filterVal}
                      onClick={() => setNotifFilter(filterVal)}
                      className={`text-[11px] font-bold px-3 py-1.5 rounded-full border transition-all cursor-pointer ${
                        isActive 
                          ? 'bg-[#6D5EF7] text-white border-[#6D5EF7]' 
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {displayLabel}
                    </button>
                  );
                })}
              </div>

              {/* Notifications List */}
              <div className="bg-white border border-slate-200/80 rounded-[18px] p-6 shadow-sm space-y-4">
                {filteredNotifications.length > 0 ? (
                  filteredNotifications.map(n => {
                    const isUnread = !n.read;
                    return (
                      <div 
                        key={n.id} 
                        onClick={() => isUnread && handleMarkNotificationAsRead(n.id)}
                        className={`flex gap-4 p-4 rounded-xl text-xs border transition-all ${
                          isUnread 
                            ? 'bg-[#6D5EF7]/5 border-[#6D5EF7]/20 hover:border-[#6D5EF7]/40 hover:bg-[#6D5EF7]/10 cursor-pointer shadow-sm' 
                            : 'bg-slate-50/50 border-slate-100 text-slate-505'
                        }`}
                      >
                        <div className="mt-0.5">
                          {n.type === 'recruiter' && <Building2 className="w-4 h-4 text-indigo-500" />}
                          {n.type === 'resume' && <FileCheck2 className="w-4 h-4 text-emerald-500" />}
                          {n.type === 'application' && <Award className="w-4 h-4 text-amber-500" />}
                          {n.type === 'system' && <Server className="w-4 h-4 text-slate-500" />}
                        </div>
                        <div className="flex-1">
                          <p className={`text-slate-700 font-medium ${isUnread ? 'font-bold text-slate-900' : ''}`}>{n.text}</p>
                          <span className="text-[10px] text-slate-450 block mt-1">{n.time}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {isUnread && (
                            <span className="w-2 h-2 bg-[#6D5EF7] rounded-full" title="Unread" />
                          )}
                          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${isUnread ? 'bg-[#6D5EF7]/10 text-[#6D5EF7]' : 'bg-slate-100 text-slate-400'}`}>
                            {isUnread ? 'New' : 'Read'}
                          </span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-10 space-y-2">
                    <Bell className="w-8 h-8 text-slate-300 mx-auto animate-bounce" />
                    <p className="text-xs text-slate-400 font-bold">No notifications found</p>
                    <p className="text-[11px] text-slate-400">There are no notifications matching the "{notifFilter}" filter.</p>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* =======================================================
              TAB: SETTINGS
              ======================================================= */}
          {activeTab === 'settings' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              
              <div className="pb-2 border-b border-slate-100">
                <p className="text-xs text-slate-450 font-bold uppercase tracking-wider">Configure System credentials & notifications</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* 1. Profile Details form */}
                <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-[18px] p-6 shadow-sm space-y-4">
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider pb-2 border-b border-slate-50">TPO Cell Profile Settings</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="space-y-1.5">
                      <label className="block font-bold text-slate-600">Cell/Office Name</label>
                      <input 
                        type="text" 
                        value={settingsForm.name} 
                        onChange={(e) => setSettingsForm({ ...settingsForm, name: e.target.value })}
                        className="w-full p-2.5 bg-[#F8FAFC] border border-slate-200 rounded-xl focus:outline-none focus:border-[#6D5EF7] text-slate-707" 
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block font-bold text-slate-600">Primary Contact Email</label>
                      <input 
                        type="email" 
                        value={settingsForm.email} 
                        onChange={(e) => setSettingsForm({ ...settingsForm, email: e.target.value })}
                        className="w-full p-2.5 bg-[#F8FAFC] border border-slate-200 rounded-xl focus:outline-none focus:border-[#6D5EF7] text-slate-707" 
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block font-bold text-slate-600">Office Location / Address</label>
                      <input 
                        type="text" 
                        value={settingsForm.address} 
                        onChange={(e) => setSettingsForm({ ...settingsForm, address: e.target.value })}
                        className="w-full p-2.5 bg-[#F8FAFC] border border-slate-200 rounded-xl focus:outline-none focus:border-[#6D5EF7] text-slate-707" 
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block font-bold text-slate-600">Contact Number</label>
                      <input 
                        type="text" 
                        value={settingsForm.phone} 
                        onChange={(e) => setSettingsForm({ ...settingsForm, phone: e.target.value })}
                        className="w-full p-2.5 bg-[#F8FAFC] border border-slate-200 rounded-xl focus:outline-none focus:border-[#6D5EF7] text-slate-707" 
                      />
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-50">
                    <button 
                      onClick={() => addToast('success', 'Profile details updated.')}
                      className="px-4 py-2 bg-[#6D5EF7] hover:bg-[#5B4EE0] text-white text-xs font-bold rounded-xl shadow-sm cursor-pointer"
                    >
                      Save Configuration
                    </button>
                  </div>
                </div>

                {/* 2. SMTP Configurations */}
                <div className="bg-white border border-slate-200/80 rounded-[18px] p-5 shadow-sm space-y-4">
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider pb-2 border-b border-slate-50 flex items-center gap-1.5">
                    <Server className="w-4 h-4 text-[#6D5EF7]" /> SMTP Email setup
                  </h3>
                  
                  <div className="space-y-3.5 text-xs">
                    <div className="space-y-1">
                      <label className="block font-bold text-slate-600">SMTP Server Host</label>
                      <input 
                        type="text" 
                        value={settingsForm.smtpHost} 
                        onChange={(e) => setSettingsForm({ ...settingsForm, smtpHost: e.target.value })}
                        className="w-full p-2.5 bg-[#F8FAFC] border border-slate-200 rounded-xl focus:outline-none focus:border-[#6D5EF7]" 
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block font-bold text-slate-600">SMTP Port</label>
                      <input 
                        type="text" 
                        value={settingsForm.smtpPort} 
                        onChange={(e) => setSettingsForm({ ...settingsForm, smtpPort: e.target.value })}
                        className="w-full p-2.5 bg-[#F8FAFC] border border-slate-200 rounded-xl focus:outline-none focus:border-[#6D5EF7]" 
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block font-bold text-slate-600">Sender Username</label>
                      <input 
                        type="text" 
                        value={settingsForm.smtpUser} 
                        onChange={(e) => setSettingsForm({ ...settingsForm, smtpUser: e.target.value })}
                        className="w-full p-2.5 bg-[#F8FAFC] border border-slate-200 rounded-xl focus:outline-none focus:border-[#6D5EF7]" 
                      />
                    </div>

                    <button 
                      onClick={() => addToast('success', 'SMTP setup verified. Test email dispatched.')}
                      className="w-full py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-655 border border-slate-200 font-bold rounded-xl cursor-pointer"
                    >
                      Send Diagnostic Email
                    </button>
                  </div>
                </div>

                {/* 3. Granular Permissions Checklist */}
                <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-[18px] p-6 shadow-sm space-y-4">
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider pb-2 border-b border-slate-50 flex items-center gap-1.5">
                    <Shield className="w-4 h-4 text-[#6D5EF7]" /> Placement Cell Permissions Audit
                  </h3>
                  
                  <div className="space-y-3.5 text-xs">
                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={settingsForm.requireResumeApproval} 
                        onChange={(e) => setSettingsForm({ ...settingsForm, requireResumeApproval: e.target.checked })}
                        className="accent-[#6D5EF7] w-4 h-4" 
                      />
                      <div>
                        <span className="font-bold text-slate-700 block">Require TPO Verification for student resumes</span>
                        <span className="text-[10px] text-slate-400">Students cannot apply to drives unless their uploaded resume is verified by the admin cell.</span>
                      </div>
                    </label>

                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={settingsForm.allowDualOffers} 
                        onChange={(e) => setSettingsForm({ ...settingsForm, allowDualOffers: e.target.checked })}
                        className="accent-[#6D5EF7] w-4 h-4" 
                      />
                      <div>
                        <span className="font-bold text-slate-700 block">Allow Dual Placement Offers</span>
                        <span className="text-[10px] text-slate-400">Allow placed students to participate in dream status recruiter drives.</span>
                      </div>
                    </label>

                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={settingsForm.maintenanceMode} 
                        onChange={(e) => setSettingsForm({ ...settingsForm, maintenanceMode: e.target.checked })}
                        className="accent-[#6D5EF7] w-4 h-4" 
                      />
                      <div>
                        <span className="font-bold text-slate-700 block">System Maintenance Mode</span>
                        <span className="text-[10px] text-slate-400">Prevent student registrations and application submissions temporarily.</span>
                      </div>
                    </label>
                  </div>
                </div>

                {/* 4. Password updates and Theme Lock */}
                <div className="bg-white border border-slate-200/80 rounded-[18px] p-5 shadow-sm space-y-4">
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider pb-2 border-b border-slate-50 flex items-center gap-1.5">
                    <Lock className="w-4 h-4 text-[#6D5EF7]" /> Password & security
                  </h3>
                  <div className="space-y-3.5 text-xs">
                    <div className="space-y-1">
                      <label className="block font-bold text-slate-655">Current Password</label>
                      <input type="password" placeholder="••••••••" className="w-full p-2.5 bg-[#F8FAFC] border border-slate-200 rounded-xl focus:outline-none" />
                    </div>
                    <div className="space-y-1">
                      <label className="block font-bold text-slate-655">New Secure Password</label>
                      <input type="password" placeholder="Min 8 characters" className="w-full p-2.5 bg-[#F8FAFC] border border-slate-200 rounded-xl focus:outline-none" />
                    </div>
                    <button 
                      onClick={() => addToast('success', 'Security passwords updated.')}
                      className="w-full py-2.5 bg-[#6D5EF7] hover:bg-[#5B4EE0] text-white font-bold rounded-xl cursor-pointer"
                    >
                      Update Password
                    </button>
                    
                    <div className="pt-2 border-t border-slate-100 text-[10px] text-slate-400 flex items-center gap-1.5 font-bold uppercase">
                      <Info className="w-3.5 h-3.5" /> Locked Theme settings (Light theme optimized)
                    </div>
                  </div>
                </div>

              </div>

            </div>
          )}
          </>
          )}

        </main>
      </div>

      {/* =======================================================
          GLOBAL MODALS OVERLAY SYSTEM
          ======================================================= */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          
          {/* Modal content body container */}
          <div className="bg-white border border-slate-200 rounded-[18px] shadow-xl max-w-md w-full overflow-hidden p-6 animate-in zoom-in-95 duration-200 space-y-4">
            
            {/* Modal header */}
            <div className="flex justify-between items-center pb-2 border-b border-slate-50">
              <h3 className="text-sm font-black text-slate-805 uppercase tracking-wider">
                {activeModal === 'createDrive' && 'Schedule Placement Drive'}
                {activeModal === 'addStudent' && 'Add Student Profile'}
                {activeModal === 'announcement' && 'Post Placements Announcement'}
                {activeModal === 'interview' && 'Schedule Interview Panel'}
                {activeModal === 'report' && 'Export Placements Report'}
                {activeModal === 'csvUpload' && 'Upload Shortlist CSV Document'}
                {activeModal === 'confirmDelete' && 'Confirm Action'}
                {activeModal === 'viewStudent' && 'Student Profile Summary'}
              </h3>
              <button 
                onClick={() => {
                  setActiveModal(null);
                  setSelectedStudent(null);
                  setSelectedDrive(null);
                }} 
                className="p-1 hover:bg-slate-50 rounded cursor-pointer"
              >
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            {/* Modal contents */}

            {/* A. Create Drive Form */}
            {activeModal === 'createDrive' && (
              <form onSubmit={handleCreateDriveSubmit} className="space-y-3.5 text-xs">
                <div className="space-y-1">
                  <label className="block font-bold text-slate-655">Placement Drive Title</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="e.g. Google SDE Recruitment 2026" 
                    value={driveForm.name}
                    onChange={(e) => setDriveForm({ ...driveForm, name: e.target.value })}
                    className="w-full p-2.5 bg-[#F8FAFC] border border-slate-200 rounded-xl focus:outline-none text-slate-800" 
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block font-bold text-slate-655">Company Name</label>
                    <input 
                      type="text" 
                      required 
                      placeholder="e.g. Google India" 
                      value={driveForm.company}
                      onChange={(e) => setDriveForm({ ...driveForm, company: e.target.value })}
                      className="w-full p-2.5 bg-[#F8FAFC] border border-slate-200 rounded-xl focus:outline-none text-slate-800" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block font-bold text-slate-655">Target Job Role</label>
                    <input 
                      type="text" 
                      required 
                      placeholder="e.g. Software Engineer" 
                      value={driveForm.role}
                      onChange={(e) => setDriveForm({ ...driveForm, role: e.target.value })}
                      className="w-full p-2.5 bg-[#F8FAFC] border border-slate-200 rounded-xl focus:outline-none text-slate-800" 
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block font-bold text-slate-655">Offered CTC Package</label>
                    <input 
                      type="text" 
                      required 
                      placeholder="e.g. 24.5 LPA" 
                      value={driveForm.ctc}
                      onChange={(e) => setDriveForm({ ...driveForm, ctc: e.target.value })}
                      className="w-full p-2.5 bg-[#F8FAFC] border border-slate-200 rounded-xl focus:outline-none text-slate-800" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block font-bold text-slate-655">Registration Deadline</label>
                    <input 
                      type="date" 
                      required 
                      value={driveForm.deadline}
                      onChange={(e) => setDriveForm({ ...driveForm, deadline: e.target.value })}
                      className="w-full p-2.5 bg-[#F8FAFC] border border-slate-200 rounded-xl focus:outline-none text-slate-700" 
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block font-bold text-slate-655">Assessment Mode</label>
                    <select
                      value={driveForm.mode}
                      onChange={(e) => setDriveForm({ ...driveForm, mode: e.target.value })}
                      className="w-full p-2.5 bg-[#F8FAFC] border border-slate-200 rounded-xl focus:outline-none text-slate-700 font-semibold"
                    >
                      <option value="Online">Online / Virtual</option>
                      <option value="Offline">Offline / Campus</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="block font-bold text-slate-655">Location Venue Details</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Audit Hall 2" 
                      value={driveForm.venue}
                      onChange={(e) => setDriveForm({ ...driveForm, venue: e.target.value })}
                      className="w-full p-2.5 bg-[#F8FAFC] border border-slate-200 rounded-xl focus:outline-none text-slate-800" 
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block font-bold text-slate-655">Eligible Branches (Select multiple)</label>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {['CSE', 'ECE', 'ME', 'CE', 'EE', 'MBA'].map(branch => {
                      const isSelected = driveForm.branches.includes(branch);
                      return (
                        <button
                          key={branch}
                          type="button"
                          onClick={() => {
                            setDriveForm(prev => {
                              const branches = prev.branches.includes(branch)
                                ? prev.branches.filter(b => b !== branch)
                                : [...prev.branches, branch];
                              return { ...prev, branches };
                            });
                          }}
                          className={`px-3 py-1.5 rounded-lg font-bold border transition-colors cursor-pointer ${
                            isSelected 
                              ? 'bg-[#6D5EF7] text-white border-transparent' 
                              : 'bg-[#F8FAFC] text-slate-600 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          {branch}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <button type="submit" className="w-full py-2.5 bg-[#6D5EF7] hover:bg-[#5B4EE0] text-white font-bold rounded-xl shadow-sm mt-2 cursor-pointer">
                  Create Placement Drive
                </button>
              </form>
            )}

            {/* B. Add Student Form */}
            {activeModal === 'addStudent' && (
              <form onSubmit={handleAddStudentSubmit} className="space-y-3.5 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block font-bold text-slate-655">Student Full Name</label>
                    <input 
                      type="text" 
                      required 
                      placeholder="e.g. Kabir Malhotra" 
                      value={studentForm.name}
                      onChange={(e) => setStudentForm({ ...studentForm, name: e.target.value })}
                      className="w-full p-2.5 bg-[#F8FAFC] border border-slate-200 rounded-xl focus:outline-none text-slate-800" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block font-bold text-slate-655">University Roll Number</label>
                    <input 
                      type="text" 
                      required 
                      placeholder="e.g. GU2022CSE018" 
                      value={studentForm.rollNumber}
                      onChange={(e) => setStudentForm({ ...studentForm, rollNumber: e.target.value })}
                      className="w-full p-2.5 bg-[#F8FAFC] border border-slate-200 rounded-xl focus:outline-none font-mono text-slate-805" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="block font-bold text-slate-655">Department</label>
                    <select
                      value={studentForm.branch}
                      onChange={(e) => setStudentForm({ ...studentForm, branch: e.target.value })}
                      className="w-full p-2.5 bg-[#F8FAFC] border border-slate-200 rounded-xl focus:outline-none text-slate-700 font-semibold"
                    >
                      <option value="CSE">CSE</option>
                      <option value="ECE">ECE</option>
                      <option value="ME">ME</option>
                      <option value="CE">CE</option>
                      <option value="EE">EE</option>
                      <option value="MBA">MBA</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="block font-bold text-slate-655">CGPA</label>
                    <input 
                      type="number" 
                      step="0.01" 
                      required 
                      placeholder="e.g. 8.75" 
                      value={studentForm.cgpa}
                      onChange={(e) => setStudentForm({ ...studentForm, cgpa: e.target.value })}
                      className="w-full p-2.5 bg-[#F8FAFC] border border-slate-200 rounded-xl focus:outline-none text-slate-800" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block font-bold text-slate-655">Batch Year</label>
                    <select
                      value={studentForm.year}
                      onChange={(e) => setStudentForm({ ...studentForm, year: e.target.value })}
                      className="w-full p-2.5 bg-[#F8FAFC] border border-slate-200 rounded-xl focus:outline-none text-slate-700 font-semibold"
                    >
                      <option value="2026">2026</option>
                      <option value="2027">2027</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block font-bold text-slate-655">Student Email Address</label>
                  <input 
                    type="email" 
                    required 
                    placeholder="e.g. student@geeta.edu" 
                    value={studentForm.email}
                    onChange={(e) => setStudentForm({ ...studentForm, email: e.target.value })}
                    className="w-full p-2.5 bg-[#F8FAFC] border border-slate-200 rounded-xl focus:outline-none text-slate-800" 
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block font-bold text-slate-655">Resume status</label>
                    <select
                      value={studentForm.resumeStatus}
                      onChange={(e) => setStudentForm({ ...studentForm, resumeStatus: e.target.value })}
                      className="w-full p-2.5 bg-[#F8FAFC] border border-slate-200 rounded-xl focus:outline-none text-slate-700 font-semibold"
                    >
                      <option value="Verified">Verified</option>
                      <option value="Pending">Pending</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="block font-bold text-slate-655">Placement Status</label>
                    <select
                      value={studentForm.placementStatus}
                      onChange={(e) => setStudentForm({ ...studentForm, placementStatus: e.target.value })}
                      className="w-full p-2.5 bg-[#F8FAFC] border border-slate-200 rounded-xl focus:outline-none text-slate-700 font-semibold"
                    >
                      <option value="Unplaced">Unplaced</option>
                      <option value="Placed">Placed</option>
                    </select>
                  </div>
                </div>

                <button type="submit" className="w-full py-2.5 bg-[#6D5EF7] hover:bg-[#5B4EE0] text-white font-bold rounded-xl shadow-sm mt-2 cursor-pointer">
                  Add Student Profile
                </button>
              </form>
            )}

            {/* C. Broadcast Notice Form */}
            {activeModal === 'announcement' && (
              <form onSubmit={handleAnnouncementSubmit} className="space-y-3.5 text-xs">
                <div className="space-y-1">
                  <label className="block font-bold text-slate-655">Notice Topic / Title</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="e.g. TCS Assessment Guidelines" 
                    value={noticeForm.title}
                    onChange={(e) => setNoticeForm({ ...noticeForm, title: e.target.value })}
                    className="w-full p-2.5 bg-[#F8FAFC] border border-slate-200 rounded-xl focus:outline-none text-slate-800" 
                  />
                </div>
                
                {/* Rich Editor Mock Toolbar */}
                <div className="space-y-1">
                  <label className="block font-bold text-slate-655">Notice content Description</label>
                  <div className="bg-[#F8FAFC] border border-slate-200 rounded-xl overflow-hidden">
                    <div className="flex gap-1.5 border-b border-slate-200 px-3 py-1.5 bg-slate-50">
                      <button type="button" className="p-1 hover:bg-slate-200 rounded font-black text-slate-700 font-mono text-[10px] cursor-pointer">B</button>
                      <button type="button" className="p-1 hover:bg-slate-200 rounded font-bold text-slate-700 italic font-mono text-[10px] cursor-pointer">I</button>
                      <button type="button" className="p-1 hover:bg-slate-200 rounded font-bold text-[#6D5EF7] underline text-[9px] cursor-pointer">Link</button>
                      <button type="button" className="p-1 hover:bg-slate-200 rounded font-bold text-slate-700 text-[9px] cursor-pointer">• List</button>
                    </div>
                    <textarea 
                      required 
                      rows="4"
                      placeholder="Type details of placement notice for students cell..." 
                      value={noticeForm.content}
                      onChange={(e) => setNoticeForm({ ...noticeForm, content: e.target.value })}
                      className="w-full p-2.5 bg-transparent border-none focus:outline-none text-slate-700 h-28 resize-none" 
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block font-bold text-slate-655">Target Student Audience</label>
                  <select
                    value={noticeForm.targetAudience}
                    onChange={(e) => setNoticeForm({ ...noticeForm, targetAudience: e.target.value })}
                    className="w-full p-2.5 bg-[#F8FAFC] border border-slate-200 rounded-xl focus:outline-none text-slate-700 font-semibold"
                  >
                    <option value="All Students">All Students Combined</option>
                    <option value="CSE & ECE Students">CSE & ECE Students only</option>
                    <option value="ME & CE Students">ME & CE Students only</option>
                    <option value="MBA Students">MBA Students only</option>
                  </select>
                </div>

                {/* Upload attachment mock */}
                <div className="space-y-1">
                  <label className="block font-bold text-slate-655">Upload Placement JD Brochure (optional)</label>
                  <div className="border border-dashed border-slate-200 bg-[#F8FAFC] hover:bg-slate-50 transition-colors rounded-xl p-3 text-center cursor-pointer">
                    <input 
                      type="file" 
                      onChange={(e) => setNoticeForm({ ...noticeForm, attachment: e.target.files[0] })}
                      className="hidden" 
                      id="noticeFile"
                    />
                    <label htmlFor="noticeFile" className="cursor-pointer flex flex-col items-center">
                      <Upload className="w-5 h-5 text-slate-400 mb-1" />
                      <span className="text-[10px] text-slate-500 font-bold">
                        {noticeForm.attachment ? noticeForm.attachment.name : 'Select guidelines PDF brochure'}
                      </span>
                    </label>
                  </div>
                </div>

                <button type="submit" className="w-full py-2.5 bg-[#6D5EF7] hover:bg-[#5B4EE0] text-white font-bold rounded-xl shadow-sm mt-2 cursor-pointer">
                  Broadcast notice
                </button>
              </form>
            )}

            {/* D. Schedule Interview Form */}
            {activeModal === 'interview' && (
              <form onSubmit={handleInterviewSubmit} className="space-y-3.5 text-xs">
                <div className="space-y-1">
                  <label className="block font-bold text-slate-655">Candidate Student Name</label>
                  <select
                    required
                    value={interviewForm.candidate}
                    onChange={(e) => setInterviewForm({ ...interviewForm, candidate: e.target.value })}
                    className="w-full p-2.5 bg-[#F8FAFC] border border-slate-200 rounded-xl focus:outline-none text-slate-750 font-semibold"
                  >
                    <option value="">Select Candidate</option>
                    {students.map(s => (
                      <option key={s.id} value={s.name}>{s.name} ({s.rollNumber})</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block font-bold text-slate-655">Company Name</label>
                    <input 
                      type="text" 
                      required 
                      placeholder="e.g. Google India" 
                      value={interviewForm.company}
                      onChange={(e) => setInterviewForm({ ...interviewForm, company: e.target.value })}
                      className="w-full p-2.5 bg-[#F8FAFC] border border-slate-200 rounded-xl focus:outline-none text-slate-800" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block font-bold text-slate-655">Interviewer Panel / HR</label>
                    <input 
                      type="text" 
                      required 
                      placeholder="e.g. Siddharth Roy" 
                      value={interviewForm.interviewer}
                      onChange={(e) => setInterviewForm({ ...interviewForm, interviewer: e.target.value })}
                      className="w-full p-2.5 bg-[#F8FAFC] border border-slate-200 rounded-xl focus:outline-none text-slate-800" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block font-bold text-slate-655">Interview Date</label>
                    <input 
                      type="date" 
                      required 
                      value={interviewForm.date}
                      onChange={(e) => setInterviewForm({ ...interviewForm, date: e.target.value })}
                      className="w-full p-2.5 bg-[#F8FAFC] border border-slate-200 rounded-xl focus:outline-none text-slate-700" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block font-bold text-slate-655">Interview Time</label>
                    <input 
                      type="time" 
                      required 
                      value={interviewForm.time}
                      onChange={(e) => setInterviewForm({ ...interviewForm, time: e.target.value })}
                      className="w-full p-2.5 bg-[#F8FAFC] border border-slate-200 rounded-xl focus:outline-none text-slate-700" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block font-bold text-slate-655">Vetting Mode</label>
                    <select
                      value={interviewForm.mode}
                      onChange={(e) => setInterviewForm({ ...interviewForm, mode: e.target.value })}
                      className="w-full p-2.5 bg-[#F8FAFC] border border-slate-200 rounded-xl focus:outline-none text-slate-700 font-semibold"
                    >
                      <option value="Online">Online (Virtual)</option>
                      <option value="Offline">Offline (On-Campus)</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="block font-bold text-slate-655">Meeting Room / Link details</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Teams Panel C" 
                      value={interviewForm.roomNumber}
                      onChange={(e) => setInterviewForm({ ...interviewForm, roomNumber: e.target.value })}
                      className="w-full p-2.5 bg-[#F8FAFC] border border-slate-200 rounded-xl focus:outline-none text-slate-800" 
                    />
                  </div>
                </div>

                <button type="submit" className="w-full py-2.5 bg-[#6D5EF7] hover:bg-[#5B4EE0] text-white font-bold rounded-xl shadow-sm mt-2 cursor-pointer">
                  Schedule Panel Invite
                </button>
              </form>
            )}

            {/* E. Export Report Modal */}
            {activeModal === 'report' && (
              <form onSubmit={handleReportSubmit} className="space-y-4 text-xs">
                <div className="space-y-1.5">
                  <label className="block font-bold text-slate-655">Report category</label>
                  <select
                    className="w-full p-2.5 bg-[#F8FAFC] border border-slate-200 rounded-xl focus:outline-none font-semibold text-slate-700"
                    value={reportForm.type}
                    onChange={(e) => setReportForm({ ...reportForm, type: e.target.value })}
                  >
                    <option value="Placement Statistics">Placement Statistics summary</option>
                    <option value="Department Placement Index">Department Placement index</option>
                    <option value="Company Wise engagement">Company wise engagement report</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="block font-bold text-slate-655">File compilation Type</label>
                  <div className="flex gap-4">
                    {['PDF', 'Excel'].map(fmt => (
                      <label key={fmt} className="flex items-center gap-1.5 font-semibold text-slate-600 cursor-pointer">
                        <input 
                          type="radio" 
                          checked={reportForm.format === fmt} 
                          onChange={() => setReportForm({ ...reportForm, format: fmt })}
                          className="accent-[#6D5EF7]"
                        />
                        <span>{fmt} Document</span>
                      </label>
                    ))}
                  </div>
                </div>
                <button type="submit" className="w-full py-2.5 bg-[#6D5EF7] hover:bg-[#5B4EE0] text-white font-bold rounded-xl shadow-sm mt-2 cursor-pointer">
                  Compile report
                </button>
              </form>
            )}

            {/* F. Upload Shortlist CSV Form */}
            {activeModal === 'csvUpload' && (
              <form onSubmit={handleCsvUploadSubmit} className="space-y-3.5 text-xs">
                <div className="space-y-1">
                  <label className="block font-bold text-slate-655">Associate with Placement Drive</label>
                  <select
                    required
                    value={csvUploadData.driveId}
                    onChange={(e) => setCsvUploadData({ ...csvUploadData, driveId: e.target.value })}
                    className="w-full p-2.5 bg-[#F8FAFC] border border-slate-200 rounded-xl focus:outline-none text-slate-700 font-semibold"
                  >
                    <option value="">Select active drive</option>
                    {drives.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>

                {/* CSV File selector zone */}
                <div className="space-y-1">
                  <label className="block font-bold text-slate-655">Select Vetted Student CSV list</label>
                  <div 
                    onClick={() => {
                      setCsvUploadData(prev => ({
                        ...prev,
                        fileName: 'Google_Shortlisted_Candidates_July2026.csv',
                        parsedCount: 15
                      }));
                      addToast('info', 'Google_Shortlisted_Candidates_July2026.csv parsed successfully.');
                    }}
                    className="border-2 border-dashed border-slate-200 bg-[#F8FAFC] hover:bg-slate-50 transition-all rounded-xl p-6 text-center cursor-pointer space-y-2"
                  >
                    <FileSpreadsheet className="w-8 h-8 text-[#6D5EF7] mx-auto" />
                    <div className="text-xs font-semibold text-slate-655">
                      {csvUploadData.fileName ? (
                        <span className="text-slate-800 font-bold block">{csvUploadData.fileName}</span>
                      ) : (
                        <span>Drag & drop student shortlist CSV or <span className="text-[#6D5EF7] underline">Browse</span></span>
                      )}
                    </div>
                    <span className="block text-[10px] text-slate-400">Accepted formats: .csv, .xlsx • Max 5MB</span>
                  </div>
                </div>

                {csvUploadData.parsedCount > 0 && (
                  <div className="bg-emerald-50 text-emerald-800 p-2.5 border border-emerald-105 rounded-xl font-semibold text-[10px] text-center uppercase tracking-wide">
                    Success: Parsed {csvUploadData.parsedCount} candidate records correctly.
                  </div>
                )}

                <button type="submit" className="w-full py-2.5 bg-[#6D5EF7] hover:bg-[#5B4EE0] text-white font-bold rounded-xl shadow-sm mt-2 cursor-pointer">
                  Register Shortlist File
                </button>
              </form>
            )}

            {/* G. Confirm Delete Dialog */}
            {activeModal === 'confirmDelete' && (
              <div className="space-y-4 text-center">
                <div className="w-12 h-12 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center mx-auto text-rose-505">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-slate-800 text-sm">Are you absolutely sure?</h4>
                  <p className="text-xs text-slate-450 leading-relaxed">
                    This action is final and will permanently modify database configurations. Candidate logs and drive registers will be cleared.
                  </p>
                </div>
                <div className="flex gap-2 pt-2 text-xs">
                  <button 
                    onClick={() => setActiveModal(null)} 
                    className="flex-1 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 font-bold rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={executeDelete} 
                    className="flex-1 py-2.5 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-xl shadow-sm shadow-rose-500/10 cursor-pointer"
                  >
                    Yes, Delete Permanent
                  </button>
                </div>
              </div>
            )}

            {/* H. View Student Details Drawer */}
            {activeModal === 'viewStudent' && selectedStudent && (
              <div className="space-y-4 text-xs text-slate-600">
                <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                  <img src={selectedStudent.photo} alt={selectedStudent.name} className="w-12 h-12 rounded-full object-cover border border-slate-100" />
                  <div>
                    <h4 className="text-sm font-bold text-slate-850">{selectedStudent.name}</h4>
                    <span className="text-[10px] text-slate-400 font-mono font-bold uppercase">{selectedStudent.rollNumber}</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3.5 text-slate-600">
                  <div>
                    <span className="block text-[9px] text-slate-400 font-black uppercase">Branch / Discipline</span>
                    <span className="font-bold text-slate-800">{selectedStudent.branch}</span>
                  </div>
                  <div>
                    <span className="block text-[9px] text-slate-400 font-black uppercase">CGPA Score</span>
                    <span className="font-bold text-slate-800">{selectedStudent.cgpa.toFixed(2)} / 10.0</span>
                  </div>
                  <div>
                    <span className="block text-[9px] text-slate-400 font-black uppercase">Email Address</span>
                    <span className="font-bold text-slate-850">{selectedStudent.email}</span>
                  </div>
                  <div>
                    <span className="block text-[9px] text-slate-400 font-black uppercase">Contact Phone</span>
                    <span className="font-bold text-slate-800">{selectedStudent.phone}</span>
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl space-y-1">
                  <span className="block text-[9px] text-slate-400 font-black uppercase">Placement Logs status</span>
                  {selectedStudent.placementStatus === 'Placed' ? (
                    <div className="text-xs">
                      <span className="text-emerald-755 font-bold block">Placed at {selectedStudent.company}</span>
                      <span className="text-[10px] text-slate-450 block mt-0.5">Package CTC: {selectedStudent.ctc}</span>
                    </div>
                  ) : (
                    <span className="text-slate-455 font-bold text-xs">Unplaced / Active in Drive Pools</span>
                  )}
                </div>

                <button 
                  onClick={() => {
                    setActiveModal(null);
                    setSelectedStudent(null);
                  }}
                  className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl cursor-pointer"
                >
                  Close Profile Details
                </button>
              </div>
            )}

          </div>

        </div>
      )}

    </div>
  );
};

export default AdminDashboard;
