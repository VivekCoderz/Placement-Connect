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
import { writePrintDocument } from '../utils/sanitize';
import { clearUser } from '../redux/authSlice';

// Helper component for Company analytics row expansion
const CompanyTableRow = ({ co }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  return (
    <React.Fragment>
      <tr className="border-b border-slate-50 hover:bg-slate-50/50">
        <td className="py-3 pl-2 font-bold text-slate-800">{co.companyName}</td>
        <td className="py-3 text-slate-500">{co.industry}</td>
        <td className="py-3 text-center font-bold text-slate-700">{co.totalDrives}</td>
        <td className="py-3 text-center font-bold text-slate-700">{co.uniqueAppliedStudents}</td>
        <td className="py-3 text-center font-bold text-[#6D5EF7]">{co.uniquePlacedStudents}</td>
        <td className="py-3 text-right font-black text-emerald-600">
          {co.uniquePlacedStudents > 0 ? `${co.lowestPackage} - ${co.highestPackage}` : 'N/A'}
        </td>
        <td className="py-3 pr-2 text-right">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-[10px] font-bold px-2 py-1 rounded bg-[#6D5EF7]/10 text-[#6D5EF7] hover:bg-[#6D5EF7]/20 transition-all cursor-pointer"
          >
            {isExpanded ? 'Hide Placements' : 'View Placements'}
          </button>
        </td>
      </tr>
      {isExpanded && (
        <tr>
          <td colSpan="7" className="bg-slate-50/60 p-4 border-b border-slate-100 rounded-lg">
            <div className="space-y-3">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Placed Students list:</span>
                <span className="text-[10px] bg-emerald-50 border border-emerald-250 text-emerald-600 px-2 py-0.5 rounded font-black">{co.placedStudentsList.length} placed</span>
              </div>
              {co.placedStudentsList.length === 0 ? (
                <p className="text-[11px] text-slate-400 font-medium">No students placed yet under this recruiter.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {co.placedStudentsList.map((stud, sIdx) => (
                    <div key={sIdx} className="bg-white border border-slate-200/60 p-3 rounded-xl flex justify-between items-center shadow-sm">
                      <div>
                        <h6 className="font-bold text-slate-800 text-xs">{stud.studentName}</h6>
                        <p className="text-[10px] text-slate-405 font-mono mt-0.5">{stud.rollNumber} · {stud.branch}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-[9px] bg-emerald-50 border border-emerald-200 text-emerald-600 px-2 py-0.5 rounded font-black">{stud.package} LPA</span>
                        <p className="text-[9px] text-slate-500 font-semibold mt-0.5">{stud.jobTitle}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </React.Fragment>
  );
};

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
  const [detailedStats, setDetailedStats] = useState(null);
  const [analyticsSubTab, setAnalyticsSubTab] = useState('overview'); // overview | companyStats | skills
  const [analyticsSearchQuery, setAnalyticsSearchQuery] = useState('');
  const [selectedSkillGapDept, setSelectedSkillGapDept] = useState('CSE');
  const [companySearch, setCompanySearch] = useState('');
  const [riskSearch, setRiskSearch] = useState('');

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

      // 8. Fetch Detailed Analytics Stats
      try {
        const detailedStatsRes = await api.get('/api/analytics/detailed-stats');
        if (detailedStatsRes.data) {
          setDetailedStats(detailedStatsRes.data);
        }
      } catch (analyticsErr) {
        console.error('Failed to load detailed analytics stats:', analyticsErr);
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

  const exportIntelligenceCSV = () => {
    if (!detailedStats) return;
    
    // 1. Overview
    let csv = "--- PLACEMENT INTELLIGENCE SUMMARY ---\n";
    csv += `Total Students Eligible,${detailedStats.overview.totalStudents}\n`;
    csv += `Total Students Placed,${detailedStats.overview.placedStudents}\n`;
    csv += `Placement Percentage,${detailedStats.overview.placementRate}%\n`;
    csv += `Total Offers Released,${detailedStats.overview.totalOffers}\n`;
    csv += `Active Drives,${detailedStats.overview.activeDrives}\n`;
    csv += `Average Package,${detailedStats.overview.averagePackage} LPA\n`;
    csv += `Median Package,${detailedStats.overview.medianPackage} LPA\n`;
    csv += `Highest Package,${detailedStats.overview.highestPackage} LPA\n`;
    csv += `Lowest Package,${detailedStats.overview.lowestPackage} LPA\n\n`;

    // 2. Departments
    csv += "--- DEPARTMENT PERFORMANCE ---\n";
    csv += "Department,Total Students,Eligible Students,Placed Students,Unplaced Students,Placement %,Avg Package,Highest Package,Lowest Package,Companies Visited\n";
    detailedStats.departmentStats.forEach(d => {
      csv += `"${d.department}",${d.totalStudents},${d.eligibleStudents},${d.placedStudents},${d.unplacedStudents},${d.placementPercentage}%,${d.averagePackage},${d.highestPackage},${d.lowestPackage},${d.companiesVisited}\n`;
    });
    csv += "\n";

    // 3. Companies
    csv += "--- COMPANY PERFORMANCE ---\n";
    csv += "Company Name,Hires,Avg Package Offered,Highest Package Offered,Selection Ratio,Interview Difficulty,Total Applicants,Total Selected\n";
    detailedStats.companyAnalytics.forEach(c => {
      csv += `"${c.companyName}",${c.hires},${c.averagePackageOffered},${c.highestPackageOffered},${c.selectionRatio}%,${c.interviewDifficultyRating}/5,${c.totalApplicants},${c.totalSelected}\n`;
    });
    csv += "\n";

    // 4. Risks
    csv += "--- AT-RISK STUDENTS ---\n";
    csv += "Student Name,Roll Number,Department,CGPA,ATS Score,Risk Score,Priority,Risk Reasons\n";
    detailedStats.studentRiskAnalysis.forEach(r => {
      csv += `"${r.studentName}","${r.rollNumber}","${r.branch}",${r.cgpa},${r.atsScore},${r.riskScore},"${r.priority}","${r.reasons.join('; ')}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Placement_Intelligence_Report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('success', 'Placement Intelligence CSV report exported.');
  };

  const exportIntelligencePDF = () => {
    if (!detailedStats) return;
    const printWindow = window.open('', '_blank');
    const dateStr = new Date().toLocaleDateString();
    
    let deptRows = detailedStats.departmentStats.map(d => `
      <tr>
        <td><strong>${d.department}</strong></td>
        <td style="text-align: center;">${d.totalStudents}</td>
        <td style="text-align: center;">${d.placedStudents}</td>
        <td style="text-align: center; font-weight: bold; color: #6D5EF7;">${d.placementPercentage}%</td>
        <td style="text-align: center;">${d.averagePackage} LPA</td>
        <td style="text-align: center;">${d.highestPackage} LPA</td>
        <td style="text-align: center;">${d.companiesVisited}</td>
      </tr>
    `).join('');

    let topPlacementsRows = detailedStats.highestPackages.slice(0, 5).map((p, idx) => `
      <tr>
        <td>${idx + 1}</td>
        <td><strong>${p.studentName}</strong></td>
        <td>${p.department}</td>
        <td>${p.company}</td>
        <td>${p.jobRole}</td>
        <td style="color: #10B981; font-weight: bold;">${p.package} LPA</td>
      </tr>
    `).join('');

    let riskRows = detailedStats.studentRiskAnalysis.slice(0, 5).map(r => `
      <tr>
        <td><strong>${r.studentName}</strong></td>
        <td>${r.rollNumber}</td>
        <td>${r.branch}</td>
        <td style="text-align: center;">${r.cgpa}</td>
        <td style="text-align: center;">${r.atsScore}</td>
        <td style="text-align: center; color: ${r.priority === 'High' ? '#EF4444' : '#F59E0B'}; font-weight: bold;">${r.priority}</td>
      </tr>
    `).join('');

    let recsHtml = detailedStats.adminRecommendations.map(r => `
      <div style="margin-bottom: 12px; padding: 10px; border-left: 4px solid #6D5EF7; background: #F8FAFC;">
        <h5 style="margin: 0; font-size: 13px; font-weight: bold; color: #1E293B;">${r.title} <span style="font-size: 9px; background: #EF4444; color: white; padding: 1px 4px; border-radius: 4px;">${r.priority}</span></h5>
        <p style="margin: 4px 0 0 0; font-size: 11px; color: #64748B;">${r.description}</p>
      </div>
    `).join('');

    writePrintDocument(printWindow, {
      title: `Placement Intelligence Hub Report`,
      styles: `
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #1E293B; margin: 40px; }
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #6D5EF7; padding-bottom: 20px; margin-bottom: 25px; }
            .logo-section h1 { margin: 0; font-size: 22px; color: #0F172A; }
            .logo-section p { margin: 4px 0 0 0; font-size: 11px; color: #64748B; font-weight: bold; text-transform: uppercase; }
            .report-info { text-align: right; font-size: 11px; color: #64748B; }
            .report-title { text-align: center; margin-bottom: 25px; }
            .report-title h2 { margin: 0; font-size: 18px; color: #1E293B; text-transform: uppercase; letter-spacing: 1px; }
            
            .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 25px; }
            .kpi-card { border: 1px solid #E2E8F0; padding: 12px; border-radius: 8px; text-align: center; background: #FAFAFA; }
            .kpi-card span { font-size: 9px; color: #64748B; text-transform: uppercase; font-weight: bold; }
            .kpi-card h3 { margin: 5px 0 0 0; font-size: 18px; color: #0F172A; }
            
            h3.section-title { font-size: 14px; text-transform: uppercase; border-bottom: 1px solid #CBD5E1; padding-bottom: 6px; color: #0F172A; margin-top: 25px; margin-bottom: 12px; }
            
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 11px; }
            th { background-color: #F8FAFC; color: #475569; font-weight: bold; padding: 8px 10px; border-bottom: 2px solid #E2E8F0; text-align: left; text-transform: uppercase; }
            td { padding: 8px 10px; border-bottom: 1px solid #E2E8F0; color: #334155; }
            
            .footer { margin-top: 40px; display: flex; justify-content: space-between; font-size: 10px; color: #94A3B8; border-top: 1px solid #E2E8F0; padding-top: 15px; }
          `,
      body: `
          <div class="header">
            <div class="logo-section">
              <h1>PLACEMENT CONNECT</h1>
              <p>GEETA UNIVERSITY · PLACEMENT INTELLIGENCE HUB</p>
            </div>
            <div class="report-info">
              <p>Date Generated: \${dateStr}</p>
              <p>Role: System Administrator</p>
            </div>
          </div>
          
          <div class="report-title">
            <h2>Executive Intelligence & Diagnostics Report</h2>
          </div>
          
          <div class="kpi-grid">
            <div class="kpi-card">
              <span>Placement Rate</span>
              <h3>\${detailedStats.overview.placementRate}%</h3>
            </div>
            <div class="kpi-card">
              <span>Placed / Eligible</span>
              <h3>\${detailedStats.overview.placedStudents} / \${detailedStats.overview.totalStudents}</h3>
            </div>
            <div class="kpi-card">
              <span>Avg Package</span>
              <h3>\${detailedStats.overview.averagePackage} LPA</h3>
            </div>
            <div class="kpi-card">
              <span>Highest Package</span>
              <h3>\${detailedStats.overview.highestPackage} LPA</h3>
            </div>
          </div>
          
          <h3 class="section-title">Department Wise Analysis</h3>
          <table>
            <thead>
              <tr>
                <th>Department</th>
                <th style="text-align: center;">Total Students</th>
                <th style="text-align: center;">Placed Students</th>
                <th style="text-align: center;">Placement Rate</th>
                <th style="text-align: center;">Avg Package</th>
                <th style="text-align: center;">Highest Package</th>
                <th style="text-align: center;">Companies Visited</th>
              </tr>
            </thead>
            <tbody>
              \${deptRows}
            </tbody>
          </table>
          
          <h3 class="section-title">Dream Placement Leaderboard (Top 5)</h3>
          <table>
            <thead>
              <tr>
                <th>Rank</th>
                <th>Student Name</th>
                <th>Branch</th>
                <th>Company</th>
                <th>Job Role</th>
                <th>CTC Package</th>
              </tr>
            </thead>
            <tbody>
              \${topPlacementsRows}
            </tbody>
          </table>
          
          <h3 class="section-title">Student Placements Risk (Top 5 High Priority)</h3>
          <table>
            <thead>
              <tr>
                <th>Student Name</th>
                <th>Roll Number</th>
                <th>Department</th>
                <th style="text-align: center;">CGPA</th>
                <th style="text-align: center;">ATS Score</th>
                <th style="text-align: center;">Risk Priority</th>
              </tr>
            </thead>
            <tbody>
              \${riskRows}
            </tbody>
          </table>
          
          <h3 class="section-title">AI Actionable Recommendations</h3>
          <div>
            \${recsHtml}
          </div>
          
          <div class="footer">
            <p>© \${new Date().getFullYear()} Geeta University Training & Placement Cell. Confidential Document.</p>
            <p>Authorized Signature: _______________________</p>
          </div>`,
    });
    addToast('success', 'Placement Intelligence PDF report exported.');
  };

  const handleReportSubmit = (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    setTimeout(() => {
      setIsLoading(false);
      setActiveModal(null);
      
      let dataToExport = [...applications];
      let title = reportForm.type;
      
      if (reportForm.format === 'Excel') {
        const headers = ["Student Name", "Company", "Job Title", "Date Applied", "Stage", "Status"];
        const rows = dataToExport.map(item => [
          item.student,
          item.company,
          item.role,
          item.appliedDate,
          item.stage,
          item.status
        ]);
        const csvContent = [headers, ...rows].map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `${title.replace(/\s+/g, '_')}_Report.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        addToast('success', `Excel report generated successfully.`);
      } else {
        // PDF compilation
        const printWindow = window.open('', '_blank');
        const dateStr = new Date().toLocaleDateString();
        let tableRowsHtml = dataToExport.map((item, idx) => `
          <tr style="border-bottom: 1px solid #E2E8F0;">
            <td style="padding: 10px;">${idx + 1}</td>
            <td style="padding: 10px;"><strong>${item.student}</strong></td>
            <td style="padding: 10px;">${item.company}</td>
            <td style="padding: 10px;">${item.role}</td>
            <td style="padding: 10px;">${item.appliedDate}</td>
            <td style="padding: 10px;">${item.stage}</td>
            <td style="padding: 10px;"><span style="background: ${item.status === 'Selected' ? '#DEF7EC' : item.status === 'Rejected' ? '#FDE8E8' : '#EBF5FF'}; color: ${item.status === 'Selected' ? '#03543F' : item.status === 'Rejected' ? '#9B1C1C' : '#1E429F'}; padding: 4px 8px; border-radius: 4px; font-weight: bold; font-size: 10px;">${item.status}</span></td>
          </tr>
        `).join('');

        writePrintDocument(printWindow, {
      title: `${title}`,
      styles: `
                body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #2D3748; margin: 40px; }
                .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #6D5EF7; padding-bottom: 20px; margin-bottom: 30px; }
                .logo-section h1 { margin: 0; font-size: 24px; color: #1A202C; }
                .logo-section p { margin: 5px 0 0 0; font-size: 12px; color: #718096; font-weight: bold; }
                .report-info { text-align: right; font-size: 12px; color: #718096; }
                .report-title { text-align: center; margin-bottom: 30px; }
                .report-title h2 { margin: 0; font-size: 20px; color: #2D3748; text-transform: uppercase; letter-spacing: 1px; }
                table { width: 100%; border-collapse: collapse; margin-bottom: 30px; font-size: 11px; }
                th { background-color: #F7FAFC; color: #4A5568; font-weight: bold; padding: 12px 10px; border-bottom: 2px solid #E2E8F0; text-align: left; text-transform: uppercase; }
                td { padding: 12px 10px; border-bottom: 1px solid #E2E8F0; color: #4A5568; }
                .footer { margin-top: 50px; display: flex; justify-content: space-between; font-size: 11px; color: #A0AEC0; border-top: 1px solid #E2E8F0; padding-top: 20px; }
              `,
      body: `
              <div class="header">
                <div class="logo-section">
                  <h1>GEETA UNIVERSITY</h1>
                  <p>Training & Placement Cell — Admin Panel</p>
                </div>
                <div class="report-info">
                  <p>Date: ${dateStr}</p>
                </div>
              </div>
              <div class="report-title">
                <h2>${title}</h2>
              </div>
              <table>
                <thead>
                  <tr>
                    <th>S.No</th>
                    <th>Student Name</th>
                    <th>Company</th>
                    <th>Job Title</th>
                    <th>Date Applied</th>
                    <th>Stage</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  ${tableRowsHtml || '<tr><td colspan="7" style="text-align:center;">No records available</td></tr>'}
                </tbody>
              </table>
              <div class="footer">
                <p>© ${new Date().getFullYear()} Geeta University. Confidential.</p>
                <p>Authorized Signature: _______________________</p>
              </div>`,
    });
        addToast('success', `PDF report generated successfully.`);
      }
    }, 1000);
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
            <div className="space-y-6 animate-in fade-in duration-300 text-slate-800 dark:text-slate-100">
              
              {/* Analytics Hub Header */}
              <div className="pb-4 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <span className="text-[10px] bg-[#6D5EF7]/10 text-[#6D5EF7] border border-[#6D5EF7]/20 px-2 py-0.5 rounded font-black tracking-wider uppercase">Institutional BI Suite</span>
                  <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mt-1 font-sans">Placement Intelligence Dashboard</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Real-time statistics, predictive forecasting, risk analysis, and automated insights</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => {
                      loadBackendData();
                      addToast('info', 'Syncing data with database...');
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-xs font-bold text-slate-700 dark:text-slate-200 transition-all cursor-pointer shadow-sm"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                    Sync Data
                  </button>
                  <button
                    onClick={exportIntelligenceCSV}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-xs font-bold text-slate-700 dark:text-slate-200 transition-all cursor-pointer shadow-sm"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
                    Export CSV
                  </button>
                  <button
                    onClick={exportIntelligencePDF}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#6D5EF7] hover:bg-[#5B4EE0] text-xs font-bold text-white transition-all cursor-pointer shadow-sm shadow-[#6D5EF7]/20"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Export PDF Report
                  </button>
                </div>
              </div>

              {/* Sub-Navigation Toggles */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 bg-slate-105 dark:bg-slate-900 p-1.5 rounded-2xl">
                <button
                  onClick={() => setAnalyticsSubTab('overview')}
                  className={`px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-center flex items-center justify-center gap-2 cursor-pointer ${
                    analyticsSubTab === 'overview'
                      ? 'bg-white dark:bg-slate-800 text-[#6D5EF7] dark:text-[#8175F9] shadow-md shadow-slate-200/50 dark:shadow-none'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 hover:bg-white/40 dark:hover:bg-slate-850/40'
                  }`}
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  <span>Executive Overview</span>
                </button>
                <button
                  onClick={() => setAnalyticsSubTab('departments')}
                  className={`px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-center flex items-center justify-center gap-2 cursor-pointer ${
                    analyticsSubTab === 'departments'
                      ? 'bg-white dark:bg-slate-800 text-[#6D5EF7] dark:text-[#8175F9] shadow-md shadow-slate-200/50 dark:shadow-none'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 hover:bg-white/40 dark:hover:bg-slate-850/40'
                  }`}
                >
                  <GraduationCap className="w-3.5 h-3.5" />
                  <span>Department Deep-Dive</span>
                </button>
                <button
                  onClick={() => setAnalyticsSubTab('companies')}
                  className={`px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-center flex items-center justify-center gap-2 cursor-pointer ${
                    analyticsSubTab === 'companies'
                      ? 'bg-white dark:bg-slate-800 text-[#6D5EF7] dark:text-[#8175F9] shadow-md shadow-slate-200/50 dark:shadow-none'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 hover:bg-white/40 dark:hover:bg-slate-850/40'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Company & Recruiters</span>
                </button>
                <button
                  onClick={() => setAnalyticsSubTab('riskATS')}
                  className={`px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-center flex items-center justify-center gap-2 cursor-pointer ${
                    analyticsSubTab === 'riskATS'
                      ? 'bg-white dark:bg-slate-800 text-[#6D5EF7] dark:text-[#8175F9] shadow-md shadow-slate-200/50 dark:shadow-none'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 hover:bg-white/40 dark:hover:bg-slate-850/40'
                  }`}
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Risk & ATS Audit</span>
                </button>
                <button
                  onClick={() => setAnalyticsSubTab('trendsPrediction')}
                  className={`px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-center flex items-center justify-center gap-2 cursor-pointer ${
                    analyticsSubTab === 'trendsPrediction'
                      ? 'bg-white dark:bg-slate-800 text-[#6D5EF7] dark:text-[#8175F9] shadow-md shadow-slate-200/50 dark:shadow-none'
                      : 'text-slate-550 dark:text-slate-400 hover:text-slate-800 hover:bg-white/40 dark:hover:bg-slate-850/40'
                  }`}
                >
                  <BarChart3 className="w-3.5 h-3.5" />
                  <span>Funnel & Predictions</span>
                </button>
              </div>

              {!detailedStats ? (
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[20px] p-12 text-center flex flex-col items-center justify-center space-y-4">
                  <RefreshCw className="w-8 h-8 text-[#6D5EF7] animate-spin" />
                  <p className="text-slate-550 dark:text-slate-450 text-xs font-bold uppercase tracking-wider">Compiling institutional data intelligence...</p>
                </div>
              ) : (
                <div className="space-y-6">
                  
                  {/* ==================== SUBTAB: EXECUTIVE OVERVIEW ==================== */}
                  {analyticsSubTab === 'overview' && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                      
                      {/* Overview Cards Grid */}
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl p-4 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
                          <span className="text-[10px] text-slate-450 dark:text-slate-400 font-bold uppercase">Placement Success Rate</span>
                          <div className="mt-2 flex items-baseline gap-2">
                            <span className="text-2xl font-extrabold text-[#6D5EF7] dark:text-[#8175F9]">{detailedStats.overview.placementRate}%</span>
                            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-500">({detailedStats.overview.placedStudents}/{detailedStats.overview.totalStudents})</span>
                          </div>
                          <div className="w-full bg-slate-105 dark:bg-slate-700 h-1.5 rounded-full mt-3 overflow-hidden">
                            <div className="bg-gradient-to-r from-[#6D5EF7] to-indigo-400 h-full rounded-full" style={{ width: `${detailedStats.overview.placementRate}%` }} />
                          </div>
                        </div>

                        <div className="bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl p-4 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
                          <span className="text-[10px] text-slate-450 dark:text-slate-400 font-bold uppercase">Total Offers Released</span>
                          <div className="mt-2 flex items-baseline gap-2">
                            <span className="text-2xl font-extrabold text-slate-800 dark:text-slate-100">{detailedStats.overview.totalOffers} Selections</span>
                            <span className="text-[10px] font-bold text-slate-400">Campaign Total</span>
                          </div>
                          <div className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase mt-3">Across {detailedStats.overview.totalCompanies} recruiters</div>
                        </div>

                        <div className="bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl p-4 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
                          <span className="text-[10px] text-slate-455 dark:text-slate-400 font-bold uppercase">Average & Median Salary</span>
                          <div className="mt-2 flex flex-col">
                            <div className="flex items-baseline gap-2">
                              <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-500">{detailedStats.overview.averagePackage} LPA</span>
                              <span className="text-[10px] text-slate-400 font-bold uppercase">AVG</span>
                            </div>
                            <div className="text-[10px] font-bold text-slate-500 dark:text-slate-450 mt-1">
                              Median Package: <span className="text-emerald-600 dark:text-emerald-500 font-extrabold">{detailedStats.overview.medianPackage} LPA</span>
                            </div>
                          </div>
                        </div>

                        <div className="bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl p-4 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
                          <span className="text-[10px] text-slate-455 dark:text-slate-400 font-bold uppercase">Salary Package Range</span>
                          <div className="mt-2 flex flex-col">
                            <div className="flex items-baseline gap-2">
                              <span className="text-2xl font-extrabold text-indigo-650 dark:text-indigo-400">{detailedStats.overview.highestPackage} LPA</span>
                              <span className="text-[10px] text-slate-400 font-bold uppercase">MAX</span>
                            </div>
                            <div className="text-[10px] font-bold text-slate-500 dark:text-slate-450 mt-1">
                              Lowest Package: <span className="text-rose-500 font-extrabold">{detailedStats.overview.lowestPackage} LPA</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Executive Summary & AI Recommendations */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        
                        {/* Executive Summary */}
                        <div className="bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl p-5 shadow-sm space-y-4">
                          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-700">
                            <Award className="w-5 h-5 text-indigo-500" />
                            <h4 className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider">Executive Insight Summary</h4>
                          </div>
                          <div className="space-y-3 pt-1">
                            {detailedStats.executiveSummary.map((item, idx) => (
                              <div key={idx} className="flex items-start gap-3">
                                <span className="w-5 h-5 rounded-full bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-450 shrink-0 font-extrabold text-xs">✓</span>
                                <p className="text-xs text-slate-650 dark:text-slate-300 font-semibold leading-relaxed mt-0.5">{item}</p>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* AI Recommendations */}
                        <div className="bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl p-5 shadow-sm space-y-4">
                          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-700">
                            <Sparkles className="w-5 h-5 text-[#6D5EF7]" />
                            <h4 className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider">AI Diagnostic Recommendations</h4>
                          </div>
                          <div className="space-y-3.5 pt-1">
                            {detailedStats.adminRecommendations.map((rec, idx) => (
                              <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 rounded-xl relative overflow-hidden group">
                                <div className="flex justify-between items-center mb-1">
                                  <h6 className="font-extrabold text-slate-800 dark:text-slate-250 text-xs">{rec.title}</h6>
                                  <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase ${
                                    rec.priority === 'High' ? 'bg-rose-50 text-rose-500 border border-rose-100 dark:bg-rose-950/20 dark:text-rose-400' : 'bg-amber-50 text-amber-500 border border-amber-100 dark:bg-amber-950/20'
                                  }`}>
                                    {rec.priority} Priority
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">{rec.description}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Top 10 Highest Packages */}
                      <div className="bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl shadow-sm overflow-hidden p-5">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700 mb-4">
                          <div className="flex items-center gap-2">
                            <Award className="w-5 h-5 text-amber-500" />
                            <h4 className="text-xs font-black uppercase text-slate-750 dark:text-slate-200 tracking-wider">Dream Offers Leaderboard (Top 10 Highest Packages)</h4>
                          </div>
                          <span className="text-[9px] bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-350 px-2 py-0.5 rounded font-bold uppercase">CTC Performance Desk</span>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse text-xs">
                            <thead>
                              <tr className="border-b border-slate-100 dark:border-slate-700 text-slate-450 dark:text-slate-400 font-bold uppercase text-[9px] tracking-wider">
                                <th className="pb-3 pl-2">Rank</th>
                                <th className="pb-3">Student Name</th>
                                <th className="pb-3">Department</th>
                                <th className="pb-3">Recruiter Company</th>
                                <th className="pb-3">Job Role</th>
                                <th className="pb-3 text-right">Package Offered</th>
                                <th className="pb-3 pr-2 text-right">Placement Date</th>
                              </tr>
                            </thead>
                            <tbody>
                              {detailedStats.highestPackages.map((p, idx) => (
                                <tr key={idx} className="border-b border-slate-50 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-700/30">
                                  <td className="py-3 pl-2 font-bold text-slate-450">#{idx + 1}</td>
                                  <td className="py-3 font-bold text-slate-850 dark:text-slate-200">{p.studentName}</td>
                                  <td className="py-3 font-medium text-slate-550 dark:text-slate-400">
                                    <span className="px-2 py-0.5 bg-indigo-50/60 dark:bg-indigo-950/20 text-[#6D5EF7] dark:text-[#8175F9] border border-indigo-100/40 rounded text-[10px] font-bold">
                                      {p.department}
                                    </span>
                                  </td>
                                  <td className="py-3 font-bold text-slate-700 dark:text-slate-300">{p.company}</td>
                                  <td className="py-3 text-slate-550 dark:text-slate-400 font-semibold">{p.jobRole}</td>
                                  <td className="py-3 text-right font-black text-emerald-600 dark:text-emerald-500 text-sm">{p.package} LPA</td>
                                  <td className="py-3 pr-2 text-right text-slate-400 font-mono text-[10px]">{p.placementDate}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                    </div>
                  )}

                  {/* ==================== SUBTAB: DEPARTMENTS ==================== */}
                  {analyticsSubTab === 'departments' && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                      
                      {/* Department Comparison Table */}
                      <div className="bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl shadow-sm overflow-hidden p-5">
                        <div className="pb-3 border-b border-slate-100 dark:border-slate-700 mb-4">
                          <h4 className="text-xs font-black uppercase text-slate-750 dark:text-slate-200 tracking-wider">Department Wise Placement Performance Matrix</h4>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse text-xs">
                            <thead>
                              <tr className="border-b border-slate-100 dark:border-slate-700 text-slate-450 dark:text-slate-400 font-bold uppercase text-[9px] tracking-wider">
                                <th className="pb-3 pl-2">Department / Branch</th>
                                <th className="pb-3 text-center">Total Students</th>
                                <th className="pb-3 text-center">Eligible Students</th>
                                <th className="pb-3 text-center">Placed Students</th>
                                <th className="pb-3 text-center">Unplaced Students</th>
                                <th className="pb-3 text-center">Placement Success</th>
                                <th className="pb-3 text-center">Avg Package</th>
                                <th className="pb-3 text-center">Package Range (Lowest - Highest)</th>
                                <th className="pb-3 pr-2 text-right">Drives Visited</th>
                              </tr>
                            </thead>
                            <tbody>
                              {detailedStats.departmentStats.map((d, idx) => (
                                <tr key={idx} className="border-b border-slate-50 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-700/30">
                                  <td className="py-3.5 pl-2 font-extrabold text-slate-800 dark:text-slate-200">{d.department}</td>
                                  <td className="py-3.5 text-center font-bold text-slate-600 dark:text-slate-400">{d.totalStudents}</td>
                                  <td className="py-3.5 text-center font-bold text-slate-600 dark:text-slate-400">{d.eligibleStudents}</td>
                                  <td className="py-3.5 text-center font-bold text-emerald-600 dark:text-emerald-500">{d.placedStudents}</td>
                                  <td className="py-3.5 text-center font-bold text-rose-500">{d.unplacedStudents}</td>
                                  <td className="py-3.5 text-center font-black text-[#6D5EF7] dark:text-[#8175F9]">{d.placementPercentage}%</td>
                                  <td className="py-3.5 text-center font-bold text-slate-700 dark:text-slate-350">{d.averagePackage} LPA</td>
                                  <td className="py-3.5 text-center font-semibold text-emerald-600 dark:text-emerald-450">{d.lowestPackage} - {d.highestPackage} LPA</td>
                                  <td className="py-3.5 pr-2 text-right font-bold text-slate-600 dark:text-slate-400">{d.companiesVisited} Drives</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Department average and Skills gap */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        
                        {/* Average Package by Department custom visualization */}
                        <div className="bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl p-5 shadow-sm space-y-4">
                          <h4 className="text-xs font-black uppercase text-slate-750 dark:text-slate-200 tracking-wider">Salary Package index by Department (Average LPA)</h4>
                          <div className="space-y-4 pt-2">
                            {detailedStats.departmentStats.map((d, idx) => {
                              const maxAvg = Math.max(...detailedStats.departmentStats.map(dep => dep.averagePackage), 1);
                              const pctWidth = Math.round((d.averagePackage / maxAvg) * 100);
                              return (
                                <div key={idx} className="space-y-1">
                                  <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                                    <span>{d.department}</span>
                                    <span className="text-emerald-600 dark:text-emerald-500 font-extrabold">{d.averagePackage} LPA avg</span>
                                  </div>
                                  <div className="w-full bg-slate-105 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
                                    <div className="bg-[#6D5EF7] h-full rounded-full transition-all duration-500" style={{ width: `${pctWidth}%` }} />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* AI Skill Gap Panel */}
                        <div className="bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl p-5 shadow-sm space-y-4">
                          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-700">
                            <h4 className="text-xs font-black uppercase text-slate-750 dark:text-slate-200 tracking-wider">AI Skill Gap Analysis & Training Deck</h4>
                            <select
                              value={selectedSkillGapDept}
                              onChange={(e) => setSelectedSkillGapDept(e.target.value)}
                              className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-[10px] font-extrabold py-1 px-2 focus:outline-none focus:ring-2 focus:ring-[#6D5EF7]/10"
                            >
                              {departments.map(d => (
                                <option key={d} value={d}>{d}</option>
                              ))}
                            </select>
                          </div>
                          
                          {(() => {
                            const gap = detailedStats.skillGapAnalysis.find(g => g.branch === selectedSkillGapDept) || { demandedSkills: [], recommendedTraining: [] };
                            return (
                              <div className="space-y-4 pt-1">
                                <div>
                                  <h6 className="text-[10px] font-black text-slate-405 uppercase tracking-wider mb-2.5">Demanded Skills Deficit (Students Missing Skill %)</h6>
                                  <div className="space-y-3">
                                    {gap.demandedSkills.map((ds, sIdx) => (
                                      <div key={sIdx} className="space-y-1">
                                        <div className="flex justify-between text-xs font-bold">
                                          <span className="text-slate-700 dark:text-slate-350">{ds.skill}</span>
                                          <span className={`font-black ${ds.missingPercent > 50 ? 'text-rose-500' : 'text-amber-500'}`}>{ds.missingPercent}% missing</span>
                                        </div>
                                        <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                                          <div className={`h-full rounded-full transition-all duration-500 ${ds.missingPercent > 50 ? 'bg-rose-500' : 'bg-amber-500'}`} style={{ width: `${ds.missingPercent}%` }} />
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                <div className="pt-2 border-t border-slate-100 dark:border-slate-700">
                                  <h6 className="text-[10px] font-black text-slate-405 uppercase tracking-wider mb-2">Recommended Training Interventions</h6>
                                  <div className="flex flex-wrap gap-1.5">
                                    {gap.recommendedTraining.map((rt, rIdx) => (
                                      <span key={rIdx} className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-450 border border-emerald-100 dark:border-emerald-900/30 text-[10px] font-extrabold">
                                        💡 {rt}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      </div>

                    </div>
                  )}

                  {/* ==================== SUBTAB: COMPANIES ==================== */}
                  {analyticsSubTab === 'companies' && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                      
                      {/* Search company input */}
                      <div className="flex gap-4 items-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4 rounded-2xl shadow-sm">
                        <div className="relative flex-1">
                          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                          <input
                            type="text"
                            placeholder="Filter by Recruiter Company name..."
                            value={companySearch}
                            onChange={(e) => setCompanySearch(e.target.value)}
                            className="w-full pl-9 block py-1.5 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-250 dark:border-slate-700 rounded-xl text-xs placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-[#6D5EF7]/10 focus:border-[#6D5EF7] font-medium text-[#111827] dark:text-slate-100"
                          />
                        </div>
                        {companySearch && (
                          <button
                            onClick={() => setCompanySearch('')}
                            className="text-xs text-slate-450 hover:text-slate-650 font-bold"
                          >
                            Clear
                          </button>
                        )}
                      </div>

                      {/* Company Table */}
                      <div className="bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl shadow-sm overflow-hidden p-5">
                        <div className="pb-3 border-b border-slate-100 dark:border-slate-700 mb-4">
                          <h4 className="text-xs font-black uppercase text-slate-750 dark:text-slate-200 tracking-wider">Recruiter Selections & Difficulty matrix</h4>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse text-xs">
                            <thead>
                              <tr className="border-b border-slate-100 dark:border-slate-700 text-slate-450 dark:text-slate-400 font-bold uppercase text-[9px] tracking-wider">
                                <th className="pb-3 pl-2">Company Name</th>
                                <th className="pb-3 text-center">Placed Student Hires</th>
                                <th className="pb-3 text-center">Avg Package Offered</th>
                                <th className="pb-3 text-center">Highest Offer Package</th>
                                <th className="pb-3 text-center">Applicants Selection %</th>
                                <th className="pb-3 text-center">Interview Difficulty Rating</th>
                                <th className="pb-3 pr-2 text-right">Job Funnel (Selected / Total Applicants)</th>
                              </tr>
                            </thead>
                            <tbody>
                              {detailedStats.companyAnalytics
                                .filter(c => c.companyName.toLowerCase().includes(companySearch.toLowerCase()))
                                .map((co, idx) => (
                                  <tr key={idx} className="border-b border-slate-50 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-700/30">
                                    <td className="py-3 pl-2 font-extrabold text-slate-850 dark:text-slate-250">{co.companyName}</td>
                                    <td className="py-3 text-center font-extrabold text-slate-800 dark:text-slate-200">{co.hires} Hires</td>
                                    <td className="py-3 text-center font-bold text-emerald-600 dark:text-emerald-450">{co.averagePackageOffered} LPA</td>
                                    <td className="py-3 text-center font-extrabold text-emerald-600 dark:text-emerald-450">{co.highestPackageOffered} LPA</td>
                                    <td className="py-3 text-center font-bold text-[#6D5EF7] dark:text-[#8175F9]">{co.selectionRatio}%</td>
                                    <td className="py-3 text-center">
                                      <span className="font-extrabold text-amber-500">{co.interviewDifficultyRating}</span>
                                      <span className="text-[10px] text-slate-400"> / 5.0</span>
                                    </td>
                                    <td className="py-3 pr-2 text-right font-extrabold text-slate-650 dark:text-slate-455">{co.totalSelected} / {co.totalApplicants}</td>
                                  </tr>
                                ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Recruiter Activity & response times */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        
                        {/* Recruiter Insights */}
                        <div className="bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl p-5 shadow-sm space-y-4">
                          <h4 className="text-xs font-black uppercase text-slate-750 dark:text-slate-200 tracking-wider">Active Recruiter Accounts Status</h4>
                          <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs border-collapse">
                              <thead>
                                <tr className="border-b border-slate-100 dark:border-slate-700 text-slate-400 uppercase text-[9px] font-bold tracking-wider">
                                  <th className="pb-2.5">Recruiter Company</th>
                                  <th className="pb-2.5">Account Handler</th>
                                  <th className="pb-2.5 text-center">Active Jobs</th>
                                  <th className="pb-2.5 text-center">Hiring Count</th>
                                  <th className="pb-2.5 text-center">Pending Reviews</th>
                                  <th className="pb-2.5 pr-1 text-right">Response Time</th>
                                </tr>
                              </thead>
                              <tbody>
                                {detailedStats.recruiterInsights.map((ri, idx) => (
                                  <tr key={idx} className="border-b border-slate-50 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-700/30">
                                    <td className="py-3 font-bold text-slate-800 dark:text-slate-200">{ri.companyName}</td>
                                    <td className="py-3 font-semibold text-slate-500 dark:text-slate-400">{ri.recruiterName}</td>
                                    <td className="py-3 text-center font-bold text-slate-700 dark:text-slate-350">{ri.activeDrives}</td>
                                    <td className="py-3 text-center font-bold text-emerald-600">{ri.hiringCount}</td>
                                    <td className="py-3 text-center font-bold text-amber-500">{ri.pendingActions}</td>
                                    <td className="py-3 pr-1 text-right text-slate-500 dark:text-slate-400 font-mono text-[10px]">{ri.responseTime}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {/* Drive Performance Registered Appeared Selected */}
                        <div className="bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl p-5 shadow-sm space-y-4">
                          <h4 className="text-xs font-black uppercase text-slate-750 dark:text-slate-200 tracking-wider">Active Drive Funnel Conversion Rates</h4>
                          <div className="space-y-3 max-h-[300px] overflow-y-auto scrollbar-thin">
                            {detailedStats.drivePerformance.map((drive, idx) => (
                              <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl">
                                <div className="flex justify-between items-center mb-1">
                                  <h6 className="font-extrabold text-slate-800 dark:text-slate-250 text-xs truncate max-w-[70%]">{drive.driveName}</h6>
                                  <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-450">{drive.conversionRate}% Selection</span>
                                </div>
                                <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 font-medium pt-1">
                                  <span>Applied: {drive.registered}</span>
                                  <span>Appeared: {drive.appeared}</span>
                                  <span>Qualified: {drive.qualified}</span>
                                  <span className="font-bold text-slate-750 dark:text-slate-200">Selected: {drive.selected}</span>
                                </div>
                                <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 mt-2.5 rounded-full overflow-hidden flex">
                                  <div className="bg-[#6D5EF7]/40 h-full" style={{ width: `${(drive.appeared/drive.registered)*100}%` }} title="Appeared" />
                                  <div className="bg-amber-400 h-full" style={{ width: `${(drive.qualified/drive.registered)*100}%` }} title="Qualified" />
                                  <div className="bg-emerald-500 h-full" style={{ width: `${(drive.selected/drive.registered)*100}%` }} title="Selected" />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                    </div>
                  )}

                  {/* ==================== SUBTAB: RISK & ATS AUDIT ==================== */}
                  {analyticsSubTab === 'riskATS' && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                      
                      {/* Risk filter input */}
                      <div className="flex gap-4 items-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4 rounded-2xl shadow-sm">
                        <div className="relative flex-1">
                          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                          <input
                            type="text"
                            placeholder="Search students in risk desk by name or roll number..."
                            value={riskSearch}
                            onChange={(e) => setRiskSearch(e.target.value)}
                            className="w-full pl-9 block py-1.5 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-250 dark:border-slate-700 rounded-xl text-xs placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-[#6D5EF7]/10 focus:border-[#6D5EF7] font-medium text-[#111827] dark:text-slate-100"
                          />
                        </div>
                        {riskSearch && (
                          <button
                            onClick={() => setRiskSearch('')}
                            className="text-xs text-slate-450 hover:text-slate-650 font-bold"
                          >
                            Clear
                          </button>
                        )}
                      </div>

                      {/* Student Risk List */}
                      <div className="bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl shadow-sm overflow-hidden p-5">
                        <div className="pb-3 border-b border-slate-100 dark:border-slate-700 mb-4 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <ShieldAlert className="w-5 h-5 text-rose-500" />
                            <h4 className="text-xs font-black uppercase text-slate-750 dark:text-slate-200 tracking-wider">Institutional Student Placement Risk Register</h4>
                          </div>
                          <span className="text-[9px] bg-rose-50 border border-rose-200 text-rose-500 font-extrabold px-2 py-0.5 rounded uppercase">Critical Action Desk</span>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse text-xs">
                            <thead>
                              <tr className="border-b border-slate-100 dark:border-slate-700 text-slate-450 dark:text-slate-400 font-bold uppercase text-[9px] tracking-wider">
                                <th className="pb-3 pl-2">Student Name</th>
                                <th className="pb-3">Roll Number</th>
                                <th className="pb-3">Department</th>
                                <th className="pb-3 text-center">CGPA</th>
                                <th className="pb-3 text-center">ATS Score</th>
                                <th className="pb-3">Risk Factor Breakdown</th>
                                <th className="pb-3 text-center">Risk Score Index</th>
                                <th className="pb-3 pr-2 text-right">Action Priority</th>
                              </tr>
                            </thead>
                            <tbody>
                              {detailedStats.studentRiskAnalysis
                                .filter(s => s.studentName.toLowerCase().includes(riskSearch.toLowerCase()) || s.rollNumber.toLowerCase().includes(riskSearch.toLowerCase()))
                                .map((r, idx) => (
                                  <tr key={idx} className="border-b border-slate-50 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-700/30">
                                    <td className="py-3 pl-2 font-bold text-slate-800 dark:text-slate-100">{r.studentName}</td>
                                    <td className="py-3 font-mono text-slate-500 dark:text-slate-400 text-[10px]">{r.rollNumber}</td>
                                    <td className="py-3 font-semibold text-slate-650 dark:text-slate-400">{r.branch}</td>
                                    <td className="py-3 text-center font-bold text-slate-700 dark:text-slate-300">{r.cgpa}</td>
                                    <td className="py-3 text-center font-bold font-mono text-indigo-500">{r.atsScore}</td>
                                    <td className="py-3">
                                      <div className="flex flex-wrap gap-1">
                                        {r.reasons.map((re, reIdx) => (
                                          <span key={reIdx} className="px-1.5 py-0.5 rounded text-[8px] bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 font-bold">
                                            {re}
                                          </span>
                                        ))}
                                      </div>
                                    </td>
                                    <td className="py-3 text-center">
                                      <div className="w-16 bg-slate-105 dark:bg-slate-700 h-2 rounded-full overflow-hidden inline-block align-middle mr-1.5">
                                        <div className={`h-full rounded-full ${r.riskScore > 70 ? 'bg-rose-500' : 'bg-amber-400'}`} style={{ width: `${r.riskScore}%` }} />
                                      </div>
                                      <span className="font-extrabold text-[10px]">{r.riskScore}%</span>
                                    </td>
                                    <td className="py-3 pr-2 text-right">
                                      <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase ${
                                        r.priority === 'High' ? 'bg-rose-50 text-rose-600 border border-rose-250 dark:bg-rose-950/20 dark:text-rose-455' : 'bg-amber-50 text-amber-600 border border-amber-250 dark:bg-amber-950/20'
                                      }`}>
                                        {r.priority}
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* ATS diagnostics and Skills indexing */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        
                        {/* ATS Distribution ranges */}
                        <div className="bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl p-5 shadow-sm space-y-4">
                          <h4 className="text-xs font-black uppercase text-slate-750 dark:text-slate-200 tracking-wider">Candidate ATS Scores distribution metrics</h4>
                          <div className="space-y-3.5 pt-2">
                            {[
                              { label: "Elite Candidate (85 - 100 ATS)", count: 8, pct: 25, color: "bg-emerald-500" },
                              { label: "Highly Qualified (70 - 85 ATS)", count: 18, pct: 45, color: "bg-teal-500" },
                              { label: "Borderline Profile (60 - 70 ATS)", count: 12, pct: 20, color: "bg-amber-400" },
                              { label: "Deficient ATS Score (Below 60 ATS)", count: 4, pct: 10, color: "bg-rose-500" }
                            ].map((bin, bIdx) => (
                              <div key={bIdx} className="space-y-1">
                                <div className="flex justify-between text-xs font-bold text-slate-750 dark:text-slate-350">
                                  <span>{bin.label}</span>
                                  <span>{bin.count} students ({bin.pct}%)</span>
                                </div>
                                <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                                  <div className={`h-full rounded-full ${bin.color}`} style={{ width: `${bin.pct}%` }} />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Top ATS Leaders student listings */}
                        <div className="bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl p-5 shadow-sm space-y-4">
                          <h4 className="text-xs font-black uppercase text-[#6D5EF7] tracking-wider">Sleek Profile ATS Leaderboard</h4>
                          <div className="space-y-2.5 pt-1">
                            {detailedStats.leaderboards.students.bestATSScore.map((st, idx) => (
                              <div key={idx} className="flex justify-between items-center p-2.5 bg-slate-50 dark:bg-slate-905 border border-slate-100 dark:border-slate-800 rounded-xl hover:shadow-sm transition-all">
                                <div className="flex items-center gap-2.5">
                                  <span className="w-5 h-5 rounded bg-indigo-50 dark:bg-indigo-950/20 text-[#6D5EF7] flex items-center justify-center font-bold text-xs">#{idx+1}</span>
                                  <div>
                                    <h6 className="font-extrabold text-slate-850 dark:text-slate-200 text-xs">{st.name}</h6>
                                    <p className="text-[9px] text-slate-450 uppercase mt-0.5">{st.detail}</p>
                                  </div>
                                </div>
                                <span className="font-black text-indigo-600 dark:text-indigo-400 text-xs bg-indigo-50 dark:bg-indigo-950/30 px-2.5 py-1 rounded-lg border border-indigo-100/45">{st.score}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                    </div>
                  )}

                  {/* ==================== SUBTAB: FUNNEL & PREDICTIONS ==================== */}
                  {analyticsSubTab === 'trendsPrediction' && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                      
                      {/* AI predictions panel expected stats */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="p-5 bg-gradient-to-br from-indigo-50/50 to-indigo-100/20 dark:from-indigo-950/20 dark:to-indigo-900/10 border border-indigo-150/40 rounded-2xl flex flex-col justify-between">
                          <div>
                            <span className="text-[10px] text-indigo-500 font-black uppercase tracking-wider font-mono">AI Expected Placement Rate</span>
                            <div className="text-3xl font-extrabold text-indigo-600 dark:text-indigo-400 mt-2">{detailedStats.placementPrediction.expectedPlacementPercentage}%</div>
                          </div>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-normal mt-3 font-sans">Statistical forecast calculated based on historical conversion trends and recruiter pipeline size.</p>
                        </div>

                        <div className="p-5 bg-gradient-to-br from-emerald-50/50 to-emerald-100/20 dark:from-emerald-950/20 dark:to-emerald-900/10 border border-emerald-150/40 rounded-2xl flex flex-col justify-between">
                          <div>
                            <span className="text-[10px] text-emerald-600 font-black uppercase tracking-wider font-mono">Expected Candidates Placed</span>
                            <div className="text-3xl font-extrabold text-emerald-600 mt-2">{detailedStats.placementPrediction.studentsLikelyToGetPlacedCount} Students</div>
                          </div>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-normal mt-3 font-sans">Number of eligible students predicted to secure offers before the end of the campaign.</p>
                        </div>

                        <div className="p-5 bg-gradient-to-br from-rose-50/50 to-rose-100/20 dark:from-rose-950/20 dark:to-rose-900/10 border border-rose-150/40 rounded-2xl flex flex-col justify-between">
                          <div>
                            <span className="text-[10px] text-rose-500 font-black uppercase tracking-wider font-mono">High Placement Risk Profiles</span>
                            <div className="text-3xl font-extrabold text-rose-500 mt-2">{detailedStats.placementPrediction.studentsAtRiskCount} Students</div>
                          </div>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-normal mt-3 font-sans">Students requiring direct placement cell intervention due to eligibility deficits or lack of resume profile.</p>
                        </div>
                      </div>

                      {/* SVG line chart and package distributions */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        
                        {/* Monthly placement area chart */}
                        <div className="bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl p-5 shadow-sm space-y-4">
                          <h4 className="text-xs font-black uppercase text-slate-750 dark:text-slate-200 tracking-wider">Monthly Successful Placements Trend (Cumulative Hires)</h4>
                          <div className="pt-2 relative h-48 w-full flex items-end justify-between px-2 border-b border-slate-200 dark:border-slate-700 pb-2">
                            {detailedStats.placementTrends.monthlyPlacements.map((pt, idx) => {
                              const maxHires = Math.max(...detailedStats.placementTrends.monthlyPlacements.map(t => t.placed), 1);
                              const barHeight = Math.round((pt.placed / maxHires) * 120);
                              return (
                                <div key={idx} className="flex flex-col items-center gap-2 group w-8">
                                  <div className="text-[9px] font-bold text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity mb-1">{pt.placed} placed</div>
                                  <div className="bg-[#6D5EF7]/10 dark:bg-[#6D5EF7]/20 w-5 rounded-t-sm" style={{ height: `${barHeight}px` }}>
                                    <div className="bg-[#6D5EF7] h-full w-full rounded-t-sm opacity-80 group-hover:opacity-100 transition-opacity" />
                                  </div>
                                  <span className="text-[10px] font-bold text-slate-550 dark:text-slate-400">{pt.month}</span>
                                </div>
                              );
                            })}
                          </div>
                          <span className="text-[9px] text-slate-400 block text-center uppercase tracking-wider font-semibold">Continuous hiring upward speed trajectory</span>
                        </div>

                        {/* Package distributions */}
                        <div className="bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl p-5 shadow-sm space-y-4">
                          <h4 className="text-xs font-black uppercase text-slate-750 dark:text-slate-200 tracking-wider">Salary CTC Ranges Distribution (LPA)</h4>
                          <div className="space-y-3 pt-2">
                            {detailedStats.packageAnalytics.packageDistribution.map((rg, idx) => {
                              const maxVal = Math.max(...detailedStats.packageAnalytics.packageDistribution.map(r => r.count), 1);
                              const pctWidth = Math.round((rg.count / maxVal) * 100);
                              return (
                                <div key={idx} className="space-y-1">
                                  <div className="flex justify-between text-xs font-bold text-slate-755 dark:text-slate-350">
                                    <span>{rg.range}</span>
                                    <span>{rg.count} students placed</span>
                                  </div>
                                  <div className="w-full bg-slate-105 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
                                    <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${pctWidth}%` }} />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Year-over-Year salary growth */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl p-5 shadow-sm space-y-4">
                          <h4 className="text-xs font-black uppercase text-slate-750 dark:text-slate-200 tracking-wider">Average Salary Growth (Year-over-Year)</h4>
                          <div className="pt-2 relative h-40 w-full flex items-end justify-around border-b border-slate-200 dark:border-slate-700 pb-2">
                            {detailedStats.packageAnalytics.salaryGrowthYoY.map((y, idx) => {
                              const maxSalary = Math.max(...detailedStats.packageAnalytics.salaryGrowthYoY.map(s => s.avgSalary), 1);
                              const barHeight = Math.round((y.avgSalary / maxSalary) * 100);
                              return (
                                <div key={idx} className="flex flex-col items-center gap-1.5 w-16">
                                  <span className="text-xs font-bold text-slate-700 dark:text-slate-350">{y.avgSalary} LPA</span>
                                  <div className="bg-gradient-to-t from-[#6D5EF7] to-indigo-400 w-8 rounded-t-sm" style={{ height: `${barHeight}px` }} />
                                  <span className="text-[10px] font-extrabold text-slate-500">{y.year} Batch</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Forecast predictions details list */}
                        <div className="bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl p-5 shadow-sm space-y-4">
                          <h4 className="text-xs font-black uppercase text-slate-750 dark:text-slate-200 tracking-wider">Department Placement Forecast Predictions</h4>
                          <div className="space-y-3 pt-2">
                            {detailedStats.placementPrediction.departmentPlacementForecast.map((forecast, idx) => (
                              <div key={idx} className="flex justify-between items-center text-xs font-bold">
                                <span className="text-slate-755 dark:text-slate-300">{forecast.department}</span>
                                <div className="flex items-center gap-2">
                                  <div className="w-24 bg-slate-105 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                                    <div className="bg-[#6D5EF7] h-full rounded-full" style={{ width: `${forecast.forecastRate}%` }} />
                                  </div>
                                  <span className="text-[#6D5EF7] dark:text-[#8175F9] font-extrabold">{forecast.forecastRate}% forecast</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                    </div>
                  )}

                  {/* ==================== SUBTAB: LEADERBOARDS ==================== */}
                  {analyticsSubTab === 'overview' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                      
                      {/* Top Students Leaderboard */}
                      <div className="bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl p-5 shadow-sm space-y-4">
                        <div className="pb-2 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
                          <h4 className="text-xs font-black uppercase text-slate-750 dark:text-slate-200 tracking-wider">Top Students Placement Leaderboard</h4>
                          <span className="text-[9px] bg-slate-100 dark:bg-slate-700 text-slate-500 font-extrabold px-1.5 py-0.5 rounded">Students</span>
                        </div>
                        
                        <div className="space-y-4">
                          <div>
                            <h6 className="text-[10px] font-black text-slate-405 uppercase tracking-wider mb-2">Highest Package Grabbed</h6>
                            <div className="space-y-2">
                              {detailedStats.leaderboards.students.highestPackage.map((item, idx) => (
                                <div key={idx} className="flex justify-between text-xs font-semibold">
                                  <span className="text-slate-700 dark:text-slate-350">{idx+1}. {item.name} ({item.detail})</span>
                                  <span className="text-emerald-600 dark:text-emerald-500 font-extrabold">{item.score}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="pt-3 border-t border-slate-100 dark:border-slate-700">
                            <h6 className="text-[10px] font-black text-slate-405 uppercase tracking-wider mb-2">Most Applications Submitted</h6>
                            <div className="space-y-2">
                              {detailedStats.leaderboards.students.mostApplications.map((item, idx) => (
                                <div key={idx} className="flex justify-between text-xs font-semibold">
                                  <span className="text-slate-700 dark:text-slate-350">{idx+1}. {item.name} ({item.detail})</span>
                                  <span className="text-indigo-600 dark:text-indigo-400 font-extrabold">{item.score}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="pt-3 border-t border-slate-100 dark:border-slate-700">
                            <h6 className="text-[10px] font-black text-slate-405 uppercase tracking-wider mb-2">Best Academic Record (Highest CGPA)</h6>
                            <div className="space-y-2">
                              {detailedStats.leaderboards.students.highestCGPA.map((item, idx) => (
                                <div key={idx} className="flex justify-between text-xs font-semibold">
                                  <span className="text-slate-700 dark:text-slate-350">{idx+1}. {item.name} ({item.detail})</span>
                                  <span className="text-amber-500 font-extrabold">{item.score}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Top Companies Leaderboard */}
                      <div className="bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl p-5 shadow-sm space-y-4">
                        <div className="pb-2 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
                          <h4 className="text-xs font-black uppercase text-slate-750 dark:text-slate-200 tracking-wider">Top Corporate Engagement Leaderboard</h4>
                          <span className="text-[9px] bg-slate-100 dark:bg-slate-700 text-slate-500 font-extrabold px-1.5 py-0.5 rounded">Recruiters</span>
                        </div>
                        
                        <div className="space-y-4">
                          <div>
                            <h6 className="text-[10px] font-black text-slate-405 uppercase tracking-wider mb-2">Recruiter Offering Highest Package</h6>
                            <div className="space-y-2">
                              {detailedStats.leaderboards.companies.highestPackage.map((item, idx) => (
                                <div key={idx} className="flex justify-between text-xs font-semibold">
                                  <span className="text-slate-700 dark:text-slate-350">{idx+1}. {item.name}</span>
                                  <span className="text-emerald-600 dark:text-emerald-500 font-extrabold">{item.score}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="pt-3 border-t border-slate-100 dark:border-slate-700">
                            <h6 className="text-[10px] font-black text-slate-405 uppercase tracking-wider mb-2">Recruiters with Highest Hiring Count</h6>
                            <div className="space-y-2">
                              {detailedStats.leaderboards.companies.mostHires.map((item, idx) => (
                                <div key={idx} className="flex justify-between text-xs font-semibold">
                                  <span className="text-slate-700 dark:text-slate-350">{idx+1}. {item.name}</span>
                                  <span className="text-[#6D5EF7] dark:text-[#8175F9] font-extrabold">{item.score}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="pt-3 border-t border-slate-100 dark:border-slate-700">
                            <h6 className="text-[10px] font-black text-slate-405 uppercase tracking-wider mb-2">Highest Funnel Conversion Selection Rate</h6>
                            <div className="space-y-2">
                              {detailedStats.leaderboards.companies.bestSelectionRate.map((item, idx) => (
                                <div key={idx} className="flex justify-between text-xs font-semibold">
                                  <span className="text-slate-700 dark:text-slate-350">{idx+1}. {item.name}</span>
                                  <span className="text-amber-500 font-extrabold">{item.score}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                    </div>
                  )}

                </div>
              )}

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
