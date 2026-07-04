import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { 
  User, GraduationCap, Building2, ShieldCheck, Mail, Calendar, Info, 
  CheckCircle2, RefreshCw, Briefcase, FileText, Bell, Search, MapPin, 
  DollarSign, Upload, Plus, Trash2, X, Lock, Check, AlertTriangle, AlertCircle, 
  ExternalLink, ArrowRight, ArrowUpRight, Award, Compass, Key, Settings, HelpCircle,
  Download, Eye, Clock, MessageSquare, ChevronLeft, ChevronRight, BarChart2,
  Code, Star, Cpu, BookOpen, Send, CheckSquare, LogOut
} from "lucide-react";
import api from "../utils/api";
import { updateStudentDetails, logoutState } from "../store/authSlice";

export const StudentDashboard = () => {
  const dispatch = useDispatch();
  const { user, details } = useSelector((state) => state.auth);

  // Layout state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");

  // Core data states (synced from API)
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [notifications, setNotifications] = useState([]);
  
  // Loading states
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [loadingApps, setLoadingApps] = useState(false);
  const [loadingNotifs, setLoadingNotifs] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Notifications
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Filters/Searches
  const [searchQuery, setSearchQuery] = useState("");
  const [minPackage, setMinPackage] = useState(0);

  // Selected Job Details Modal
  const [selectedJob, setSelectedJob] = useState(null);

  // Profile forms
  const [phone, setPhone] = useState(details?.phone || "");
  const [skills, setSkills] = useState(details?.skills || []);
  const [newSkill, setNewSkill] = useState("");
  const [projects, setProjects] = useState(details?.projects || []);
  const [newProjTitle, setNewProjTitle] = useState("");
  const [newProjDesc, setNewProjDesc] = useState("");
  const [newProjStack, setNewProjStack] = useState("");
  const [newProjLink, setNewProjLink] = useState("");

  // Resume File
  const [resumeFile, setResumeFile] = useState(null);

  // Password edit
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // AI Assistant Chatbot state
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { sender: "ai", text: "Hello! I am your AI Career Assistant. How can I help you with your placements today?" }
  ]);
  const [chatInput, setChatInput] = useState("");

  // Mock list of skills if empty
  const defaultSkills = [
    { name: "React", level: 85 },
    { name: "Node.js", level: 80 },
    { name: "MongoDB", level: 75 },
    { name: "Express", level: 70 },
    { name: "JavaScript", level: 90 },
    { name: "C++", level: 85 },
    { name: "DSA", level: 80 },
    { name: "SQL", level: 75 },
    { name: "Git", level: 90 },
    { name: "Docker", level: 65 }
  ];

  // Fetch initial data
  const fetchJobs = async () => {
    setLoadingJobs(true);
    try {
      const res = await api.get("/jobs");
      setJobs(res.data.jobs || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingJobs(false);
    }
  };

  const fetchApplications = async () => {
    setLoadingApps(true);
    try {
      const res = await api.get("/applications/my-applications");
      setApplications(res.data.applications || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingApps(false);
    }
  };

  const fetchNotifications = async () => {
    setLoadingNotifs(true);
    try {
      const res = await api.get("/notifications");
      setNotifications(res.data.notifications || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingNotifs(false);
    }
  };

  useEffect(() => {
    fetchJobs();
    fetchApplications();
    fetchNotifications();
  }, []);

  // Logout Handler
  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (err) {
      console.warn("Logout failed on backend", err);
    } finally {
      dispatch(logoutState());
    }
  };

  // Apply to Job
  const handleApply = async (jobId) => {
    setActionLoading(true);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const res = await api.post(`/jobs/${jobId}/apply`);
      setSuccessMsg(res.data.message || "Applied successfully!");
      setSelectedJob(null);
      fetchJobs();
      fetchApplications();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Failed to apply to this drive");
    } finally {
      setActionLoading(false);
    }
  };

  // Update Profile
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const res = await api.put("/students/profile", {
        phone,
        skills,
        projects
      });
      dispatch(updateStudentDetails(res.data.student));
      setSuccessMsg("Profile details updated successfully!");
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Failed to update profile");
    } finally {
      setActionLoading(false);
    }
  };

  // Upload Resume
  const handleUploadResume = async (e) => {
    e.preventDefault();
    if (!resumeFile) {
      setErrorMsg("Please select a file to upload");
      return;
    }
    setActionLoading(true);
    setErrorMsg("");
    setSuccessMsg("");
    const formData = new FormData();
    formData.append("resume", resumeFile);

    try {
      const res = await api.put("/students/resume", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      const updatedDetails = { ...details, resumeUrl: res.data.resumeUrl };
      dispatch(updateStudentDetails(updatedDetails));
      setSuccessMsg("Resume uploaded successfully!");
      setResumeFile(null);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Failed to upload resume");
    } finally {
      setActionLoading(false);
    }
  };

  // Update Password
  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setErrorMsg("New passwords do not match");
      return;
    }
    setActionLoading(true);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      await api.put("/students/updatePassword", { oldPassword, newPassword });
      setSuccessMsg("Password updated successfully!");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Failed to update password");
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()]);
      setNewSkill("");
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    setSkills(skills.filter(s => s !== skillToRemove));
  };

  const handleAddProject = () => {
    if (!newProjTitle.trim()) {
      setErrorMsg("Project title is required");
      return;
    }
    const newProject = {
      title: newProjTitle.trim(),
      description: newProjDesc.trim(),
      techStack: newProjStack.split(",").map(t => t.trim()).filter(Boolean),
      link: newProjLink.trim()
    };
    setProjects([...projects, newProject]);
    setNewProjTitle("");
    setNewProjDesc("");
    setNewProjStack("");
    setNewProjLink("");
  };

  const handleRemoveProject = (index) => {
    setProjects(projects.filter((_, i) => i !== index));
  };

  // AI Chat send
  const handleSendChatMessage = () => {
    if (!chatInput.trim()) return;
    const userMsg = { sender: "user", text: chatInput };
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput("");

    // Simulate AI response
    setTimeout(() => {
      let reply = "I can guide you with your resume, practice questions, or mock interviews. What field are you preparing for?";
      if (chatInput.toLowerCase().includes("resume")) {
        reply = "A great resume should be 1 page, use bullet points starting with action verbs, and include your CGPA and projects. You can upload your resume in the Profile tab for analysis.";
      } else if (chatInput.toLowerCase().includes("interview")) {
        reply = "Mock interviews are a great way to prepare. Practice speaking clearly and explaining your project architectures. Would you like to practice DSA or Behavioral questions?";
      } else if (chatInput.toLowerCase().includes("placed")) {
        reply = "Congratulations to placed students! If you are seeking placements, focus on building 2 high-quality projects and solving medium-level coding problems.";
      }
      setChatMessages(prev => [...prev, { sender: "ai", text: reply }]);
    }, 1000);
  };

  // Sidebar items
  const sidebarItems = [
    { id: "dashboard", label: "Dashboard", icon: Compass },
    { id: "profile", label: "My Profile", icon: User },
    { id: "resume-builder", label: "Resume Builder", icon: FileText, disabled: true },
    { id: "resume-score", label: "Resume Score", icon: Award },
    { id: "applied-jobs", label: "Applied Jobs", icon: CheckSquare },
    { id: "saved-jobs", label: "Saved Jobs", icon: Star, disabled: true },
    { id: "recommended-jobs", label: "Recommended Jobs", icon: Briefcase },
    { id: "companies", label: "Companies", icon: Building2, disabled: true },
    { id: "placement-drive", label: "Placement Drive", icon: Calendar },
    { id: "mock-interview", label: "Mock Interview", icon: MessageSquare, disabled: true },
    { id: "aptitude", label: "Aptitude Practice", icon: BookOpen, disabled: true },
    { id: "coding", label: "Coding Practice", icon: Code },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "messages", label: "Messages", icon: Mail, disabled: true },
    { id: "settings", label: "Settings", icon: Settings, disabled: true },
    { id: "logout", label: "Logout", icon: LogOut }
  ];

  // Profile completion percent
  const getProfileCompletion = () => {
    let score = 0;
    if (details?.phone) score += 20;
    if (details?.resumeUrl) score += 30;
    if (details?.skills?.length > 0) score += 25;
    if (details?.projects?.length > 0) score += 25;
    return score;
  };

  // Helper stats
  const activeJobs = jobs.filter(j => !j.applied);
  const appliedCount = applications.length;
  const scheduledInterviews = applications.filter(app => app.status === "Shortlisted").length; // Shortlisted status acts as scheduled for interview
  const offersReceived = applications.filter(app => app.status === "Selected").length;
  const eligibleCount = jobs.length;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 font-sans flex overflow-hidden">
      
      {/* Left Sidebar */}
      <aside 
        className={`bg-white border-r border-slate-100 flex flex-col justify-between transition-all duration-300 z-30 ${
          sidebarCollapsed ? "w-16" : "w-64"
        }`}
      >
        <div className="flex-1 flex flex-col overflow-y-auto">
          {/* Logo Section */}
          <div className="h-16 border-b border-slate-50 flex items-center justify-between px-4">
            {!sidebarCollapsed && (
              <span className="text-sm font-extrabold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent uppercase">
                PlacementConnect
              </span>
            )}
            {sidebarCollapsed && (
              <span className="text-sm font-extrabold text-blue-600 mx-auto">PC</span>
            )}
            <button 
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-1 hover:bg-slate-50 rounded text-slate-400 hover:text-slate-600 cursor-pointer hidden md:block"
            >
              {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-0.5">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              const isTabActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    if (item.id === "logout") {
                      handleLogout();
                    } else if (!item.disabled) {
                      setActiveTab(item.id);
                    }
                  }}
                  disabled={item.disabled}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all border ${
                    item.disabled 
                      ? "opacity-40 cursor-not-allowed text-slate-400 border-transparent"
                      : isTabActive
                      ? "bg-blue-50/50 text-blue-600 border-blue-100/50 shadow-sm shadow-blue-50/10 font-bold"
                      : "text-slate-500 hover:text-slate-800 hover:bg-slate-50 border-transparent"
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isTabActive ? "text-blue-600" : "text-slate-400"}`} />
                  {!sidebarCollapsed && <span>{item.label}</span>}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-50 flex items-center justify-between">
          {!sidebarCollapsed && (
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600 text-xs uppercase">
                {user?.name?.charAt(0)}
              </div>
              <div className="truncate max-w-[120px]">
                <p className="text-xs font-bold text-slate-800 truncate">{user?.name}</p>
                <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
              </div>
            </div>
          )}
          <button 
            onClick={handleLogout}
            className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg cursor-pointer transition-colors"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Main Content Pane */}
      <div className="flex-1 flex flex-col overflow-y-auto relative">
        
        {/* Top Navbar */}
        <header className="h-16 bg-white/80 backdrop-blur-md sticky top-0 z-20 border-b border-slate-100 flex items-center justify-between px-6 md:px-8">
          {/* Search bar */}
          <div className="relative w-64 md:w-80">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search drives, practice, templates... (⌘K)"
              className="w-full bg-slate-50 border border-slate-100 text-slate-700 rounded-lg pl-9 pr-4 py-1.5 text-xs focus:outline-none focus:border-blue-500 focus:bg-white transition-all placeholder:text-slate-400"
            />
          </div>

          {/* Student Profile Info */}
          <div className="flex items-center space-x-4 md:space-x-6">
            <button 
              onClick={() => setActiveTab("notifications")}
              className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-slate-600 relative cursor-pointer"
            >
              <Bell className="w-4 h-4" />
              {notifications.filter(n => !n.read).length > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-blue-500" />
              )}
            </button>

            <div className="flex items-center space-x-3 border-l border-slate-100 pl-4.5">
              <div className="text-right hidden md:block">
                <p className="text-xs font-bold text-slate-800">{user?.name}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">{details?.branch} · Sem 8</p>
              </div>
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 p-0.5 shadow-sm shadow-blue-500/10">
                <div className="w-full h-full rounded-full bg-white flex items-center justify-center font-bold text-blue-600 text-sm uppercase">
                  {user?.name?.charAt(0)}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Central Dashboard Wrapper */}
        <main className="flex-1 p-6 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
          
          {/* Messages banners */}
          {errorMsg && (
            <div className="flex items-start space-x-3 bg-rose-50 border border-rose-100 text-rose-800 text-xs p-4 rounded-xl relative shadow-sm animate-shake">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-bold">Error</p>
                <p className="text-rose-600/80 mt-0.5">{errorMsg}</p>
              </div>
              <button onClick={clearMessages} className="text-rose-400 hover:text-rose-600 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {successMsg && (
            <div className="flex items-start space-x-3 bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs p-4 rounded-xl relative shadow-sm animate-fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-bold">Success</p>
                <p className="text-emerald-600/80 mt-0.5">{successMsg}</p>
              </div>
              <button onClick={clearMessages} className="text-emerald-450 hover:text-emerald-650 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* ---------------- ACTIVE TAB: DASHBOARD ---------------- */}
          {activeTab === "dashboard" && (
            <div className="space-y-6">
              
              {/* Hero welcome Banner */}
              <div className="bg-white border border-slate-100 p-6 md:p-8 rounded-2xl shadow-sm shadow-slate-100 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="space-y-2 text-center md:text-left">
                  <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">
                    Welcome back, {user?.name?.split(" ")[0]} 👋
                  </h1>
                  <p className="text-slate-400 text-xs max-w-md leading-relaxed">
                    Check your recommended jobs, upcoming mock interviews, and drive checklists to optimize your selection odds.
                  </p>
                  
                  {/* Skill/Completion stats widgets */}
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 pt-3 text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                    <span className="flex items-center space-x-1.5 px-3 py-1 bg-slate-50 border border-slate-100 rounded-full text-slate-600">
                      <GraduationCap className="w-3.5 h-3.5 text-blue-500" />
                      <span>CGPA: {details?.cgpa || "N/A"} / 10.0</span>
                    </span>
                    <span className="flex items-center space-x-1.5 px-3 py-1 bg-slate-50 border border-slate-100 rounded-full text-slate-600">
                      <Cpu className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Skills tags: {skills.length}</span>
                    </span>
                    <span className="flex items-center space-x-1.5 px-3 py-1 bg-slate-50 border border-slate-100 rounded-full text-slate-600">
                      <Award className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Profile: {getProfileCompletion()}% Strength</span>
                    </span>
                  </div>
                </div>

                <div className="w-full md:w-72 space-y-3.5 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6">
                  <div>
                    <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">
                      <span>Placement Progress</span>
                      <span className="text-blue-600">{details?.isPlaced ? "Placed 100%" : "Underway"}</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-50">
                      <div className={`h-full rounded-full transition-all ${details?.isPlaced ? "bg-emerald-500 w-full" : "bg-blue-600 w-2/5"}`} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">
                      <span>Resume Completion</span>
                      <span className="text-indigo-600">{details?.resumeUrl ? "100%" : "0%"}</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-50">
                      <div className={`h-full rounded-full transition-all bg-indigo-500 ${details?.resumeUrl ? "w-full" : "w-0"}`} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Statistics Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* 1. Jobs Applied */}
                <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm shadow-slate-100 flex items-center justify-between hover:-translate-y-0.5 transition-all duration-300 group">
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold block">Jobs Applied</span>
                    <span className="text-2xl font-extrabold text-slate-800 block leading-none">{appliedCount}</span>
                    <span className="text-[10px] text-emerald-600 font-bold mt-1.5 block">Active Applications</span>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-105 transition-all">
                    <FileText className="w-6 h-6" />
                  </div>
                </div>

                {/* 2. Interviews Scheduled */}
                <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm shadow-slate-100 flex items-center justify-between hover:-translate-y-0.5 transition-all duration-300 group">
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold block">Interviews</span>
                    <span className="text-2xl font-extrabold text-slate-800 block leading-none">{scheduledInterviews}</span>
                    <span className="text-[10px] text-indigo-500 font-bold mt-1.5 block">Shortlisted Stage</span>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-105 transition-all">
                    <Calendar className="w-6 h-6" />
                  </div>
                </div>

                {/* 3. Offers Received */}
                <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm shadow-slate-100 flex items-center justify-between hover:-translate-y-0.5 transition-all duration-300 group">
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold block">Offers Received</span>
                    <span className="text-2xl font-extrabold text-slate-800 block leading-none">{offersReceived}</span>
                    <span className="text-[10px] text-emerald-600 font-bold mt-1.5 block">{details?.isPlaced ? "Placed" : "Pending Selection"}</span>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-all">
                    <Award className="w-6 h-6" />
                  </div>
                </div>

                {/* 4. Companies Eligible */}
                <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm shadow-slate-100 flex items-center justify-between hover:-translate-y-0.5 transition-all duration-300 group">
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold block">Eligible Drives</span>
                    <span className="text-2xl font-extrabold text-slate-800 block leading-none">{eligibleCount}</span>
                    <span className="text-[10px] text-slate-400 mt-1.5 block">Total Drives listed</span>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-slate-50 text-slate-650 flex items-center justify-center group-hover:scale-105 transition-all">
                    <Building2 className="w-6 h-6" />
                  </div>
                </div>
              </div>

              {/* Main dashboard widgets grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Left Panel: Recommended jobs & Analytics */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Job Recommendations Teaser */}
                  <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm shadow-slate-100 space-y-4">
                    <div className="flex justify-between items-center border-b border-slate-50 pb-3">
                      <h3 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
                        <Briefcase className="w-4.5 h-4.5 text-blue-500" />
                        <span>Recommended Placements</span>
                      </h3>
                      <button 
                        onClick={() => setActiveTab("recommended-jobs")}
                        className="text-[10px] font-bold text-blue-600 hover:text-blue-500 flex items-center space-x-1 cursor-pointer"
                      >
                        <span>View All</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {activeJobs.length === 0 ? (
                      <div className="text-center py-8 text-slate-400 text-xs">
                        No new recommended drives.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {activeJobs.slice(0, 3).map(job => (
                          <div 
                            key={job._id}
                            className="p-4 bg-slate-50/50 border border-slate-100 hover:border-slate-200 rounded-xl transition-all flex items-center justify-between gap-4 group"
                          >
                            <div className="flex items-center space-x-3.5 min-w-0">
                              <div className="w-10 h-10 rounded-lg bg-white border border-slate-100 flex items-center justify-center font-bold text-blue-600 shadow-sm shrink-0">
                                {job.companyInfo?.name?.charAt(0)}
                              </div>
                              <div className="min-w-0">
                                <h4 className="text-xs font-bold text-slate-800 truncate">{job.title}</h4>
                                <p className="text-[10px] text-slate-450 mt-0.5 truncate">{job.companyInfo?.name} · {job.location || "On-Site"}</p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-3 shrink-0">
                              <span className="text-[10px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200/50">
                                {job.package} LPA
                              </span>
                              <button
                                onClick={() => setSelectedJob(job)}
                                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-[10px] font-semibold cursor-pointer shadow-sm shadow-blue-600/5"
                              >
                                View
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Placement Analytics SVG chart */}
                  <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm shadow-slate-100 space-y-4">
                    <h3 className="text-sm font-bold text-slate-800 flex items-center space-x-2 border-b border-slate-50 pb-3">
                      <BarChart2 className="w-4.5 h-4.5 text-blue-500" />
                      <span>Applications Overview</span>
                    </h3>

                    {/* Styled Mock SVG Graph */}
                    <div className="pt-2">
                      <div className="h-44 flex items-end justify-between px-6 pt-2 pb-6 border-b border-slate-100 relative">
                        {/* Custom visual lines */}
                        <div className="absolute left-0 right-0 top-1/4 border-t border-slate-50 text-[9px] text-slate-350 pr-2 select-none">3 Drives</div>
                        <div className="absolute left-0 right-0 top-2/4 border-t border-slate-50 text-[9px] text-slate-350 pr-2 select-none">2 Drives</div>
                        <div className="absolute left-0 right-0 top-3/4 border-t border-slate-50 text-[9px] text-slate-350 pr-2 select-none">1 Drive</div>

                        {/* Bar charts */}
                        <div className="flex flex-col items-center space-y-2 z-10">
                          <div className="w-9 bg-slate-100 rounded-t h-12 hover:bg-blue-600 transition-colors" title="1 application" />
                          <span className="text-[9px] font-bold text-slate-400">Jan</span>
                        </div>
                        <div className="flex flex-col items-center space-y-2 z-10">
                          <div className="w-9 bg-slate-100 rounded-t h-20 hover:bg-blue-600 transition-colors" title="2 applications" />
                          <span className="text-[9px] font-bold text-slate-400">Feb</span>
                        </div>
                        <div className="flex flex-col items-center space-y-2 z-10">
                          <div className="w-9 bg-blue-500 rounded-t h-32 hover:bg-blue-650 transition-colors" title="3 applications" />
                          <span className="text-[9px] font-bold text-slate-400">Mar</span>
                        </div>
                        <div className="flex flex-col items-center space-y-2 z-10">
                          <div className="w-9 bg-slate-100 rounded-t h-12 hover:bg-blue-600 transition-colors" title="1 application" />
                          <span className="text-[9px] font-bold text-slate-400">Apr</span>
                        </div>
                        <div className="flex flex-col items-center space-y-2 z-10">
                          <div className="w-9 bg-slate-100 rounded-t h-20 hover:bg-blue-600 transition-colors" title="2 applications" />
                          <span className="text-[9px] font-bold text-slate-400">May</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center text-[10px] text-slate-400 pt-2 font-bold px-2">
                        <span>Monthly Submission Volume</span>
                        <span className="text-blue-600 flex items-center space-x-1">
                          <span>Interview Success: <strong>66%</strong></span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Panel: Resume Widget & Coding progress */}
                <div className="lg:col-span-1 space-y-6">
                  {/* Resume score card */}
                  <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm shadow-slate-100 flex flex-col items-center text-center space-y-4">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest self-start">Resume Score</h3>
                    
                    {/* Circular Score tracker */}
                    <div className="relative w-28 h-28 flex items-center justify-center">
                      <svg className="w-full h-full transform -rotate-95">
                        <circle cx="56" cy="56" r="48" fill="transparent" stroke="#F1F5F9" strokeWidth="8" />
                        <circle cx="56" cy="56" r="48" fill="transparent" stroke="#3B82F6" strokeWidth="8" strokeDasharray="301.6" strokeDashoffset="45" strokeLinecap="round" />
                      </svg>
                      <div className="absolute text-center">
                        <span className="text-2xl font-black text-slate-800">85</span>
                        <span className="text-slate-450 text-[10px] block font-bold">/ 100</span>
                      </div>
                    </div>

                    <div className="w-full space-y-2 pt-2 border-t border-slate-50">
                      <p className="text-[10px] text-slate-500 leading-normal">Your resume matches 85% of job requirements in IT/CSE.</p>
                      <button 
                        onClick={() => setActiveTab("resume-score")}
                        className="w-full py-2 bg-slate-50 hover:bg-slate-100 border border-slate-100 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer transition-all"
                      >
                        Analyze Resume Score
                      </button>
                    </div>
                  </div>

                  {/* Coding stats widget */}
                  <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm shadow-slate-100 space-y-4">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Coding Progress</h3>
                    
                    <div className="flex items-baseline space-x-1.5 pb-2 border-b border-slate-50">
                      <span className="text-2xl font-black text-slate-800">320</span>
                      <span className="text-xs text-slate-400 font-bold">Solved</span>
                    </div>

                    <div className="space-y-3 pt-1">
                      {/* Easy */}
                      <div>
                        <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase mb-1">
                          <span>Easy</span>
                          <span className="text-emerald-500">180 / 200</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-50">
                          <div className="h-full bg-emerald-500 w-[90%] rounded-full" />
                        </div>
                      </div>

                      {/* Medium */}
                      <div>
                        <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase mb-1">
                          <span>Medium</span>
                          <span className="text-indigo-500">110 / 150</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-50">
                          <div className="h-full bg-indigo-500 w-[73%] rounded-full" />
                        </div>
                      </div>

                      {/* Hard */}
                      <div>
                        <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase mb-1">
                          <span>Hard</span>
                          <span className="text-rose-500">30 / 50</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-50">
                          <div className="h-full bg-rose-500 w-[60%] rounded-full" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              {/* Placement Drive timeline teaser */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Drive Timeline */}
                <div className="md:col-span-2 bg-white border border-slate-100 p-6 rounded-2xl shadow-sm shadow-slate-100 space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-50 pb-3">
                    <h3 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
                      <Calendar className="w-4.5 h-4.5 text-blue-500" />
                      <span>Upcoming Drives Timeline</span>
                    </h3>
                    <button 
                      onClick={() => setActiveTab("placement-drive")}
                      className="text-[10px] font-bold text-blue-600 hover:text-blue-500 cursor-pointer"
                    >
                      View All Schedule
                    </button>
                  </div>

                  <div className="space-y-4 relative pl-4 border-l border-slate-100 py-1">
                    <div className="relative">
                      <span className="absolute -left-6 top-1.5 w-3.5 h-3.5 rounded-full border-2 border-white bg-blue-500 shadow-md" />
                      <div className="bg-slate-50/50 p-3.5 rounded-xl border border-slate-100 space-y-1">
                        <div className="flex justify-between items-start">
                          <h4 className="text-xs font-bold text-slate-800">TCS NQT Pre-Talks</h4>
                          <span className="text-[9px] font-bold text-slate-500">Tomorrow</span>
                        </div>
                        <p className="text-[10px] text-slate-400">10:00 AM · Online Auditorium · Required: CSE, IT</p>
                      </div>
                    </div>
                    <div className="relative">
                      <span className="absolute -left-6 top-1.5 w-3.5 h-3.5 rounded-full border-2 border-white bg-slate-300 shadow-sm" />
                      <div className="bg-slate-50/50 p-3.5 rounded-xl border border-slate-100 space-y-1">
                        <div className="flex justify-between items-start">
                          <h4 className="text-xs font-bold text-slate-800">Wipro Technical Interview</h4>
                          <span className="text-[9px] font-bold text-slate-500">July 8, 2026</span>
                        </div>
                        <p className="text-[10px] text-slate-400">11:30 AM · Tech Block Hall B · Eligible candidates only</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick actions Panel */}
                <div className="md:col-span-1 bg-white border border-slate-100 p-6 rounded-2xl shadow-sm shadow-slate-100 space-y-4">
                  <h3 className="text-sm font-bold text-slate-800 flex items-center space-x-2 border-b border-slate-50 pb-3">
                    <Compass className="w-4.5 h-4.5 text-blue-500" />
                    <span>Quick Access</span>
                  </h3>
                  
                  <div className="flex flex-col space-y-2.5">
                    <button 
                      onClick={() => setActiveTab("recommended-jobs")}
                      className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-blue-50/20 text-slate-700 hover:text-blue-600 rounded-xl border border-slate-100 hover:border-blue-100 transition-all text-xs font-bold cursor-pointer"
                    >
                      <span>Apply for Jobs</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={() => setActiveTab("profile")}
                      className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-blue-50/20 text-slate-700 hover:text-blue-600 rounded-xl border border-slate-100 hover:border-blue-100 transition-all text-xs font-bold cursor-pointer"
                    >
                      <span>Upload Resume PDF</span>
                      <Upload className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={() => setActiveTab("coding")}
                      className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-blue-50/20 text-slate-700 hover:text-blue-600 rounded-xl border border-slate-100 hover:border-blue-100 transition-all text-xs font-bold cursor-pointer"
                    >
                      <span>Coding Practice</span>
                      <Code className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* ---------------- ACTIVE TAB: RECOMMENDED JOBS (JOB BOARD) ---------------- */}
          {activeTab === "recommended-jobs" && (
            <div className="space-y-6">
              {/* Filters Panel */}
              <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm shadow-slate-100 space-y-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-800">Job Recommendations</h2>
                  <p className="text-xs text-slate-400 mt-1">Drives currently matching your profile CGPA and academic year eligibility.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-450">
                      <Search className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Filter company or role..."
                      className="w-full bg-slate-50 border border-slate-100 text-slate-700 rounded-lg pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] text-slate-400 font-bold uppercase shrink-0">Package Min:</span>
                    <select
                      value={minPackage}
                      onChange={(e) => setMinPackage(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-100 text-slate-700 rounded-lg px-3 py-2 text-xs focus:outline-none cursor-pointer"
                    >
                      <option value="0">All Ranges</option>
                      <option value="6">6.0+ LPA</option>
                      <option value="9">9.0+ LPA</option>
                      <option value="12">12.0+ LPA</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Jobs Cards Deck */}
              {loadingJobs ? (
                <div className="flex justify-center py-20">
                  <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
                </div>
              ) : jobs.filter(j => Number(j.package) >= minPackage && (j.title.toLowerCase().includes(searchQuery.toLowerCase()) || j.companyInfo?.name?.toLowerCase().includes(searchQuery.toLowerCase()))).length === 0 ? (
                <div className="bg-white border border-slate-100 p-16 rounded-2xl text-center space-y-4">
                  <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto" />
                  <h3 className="text-sm font-bold text-slate-800">No eligible drives match filters</h3>
                  <p className="text-xs text-slate-400">Try clearing search values or broadening package ranges.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {jobs.filter(j => Number(j.package) >= minPackage && (j.title.toLowerCase().includes(searchQuery.toLowerCase()) || j.companyInfo?.name?.toLowerCase().includes(searchQuery.toLowerCase()))).map(job => (
                    <div 
                      key={job._id}
                      className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm shadow-slate-100 hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between space-y-4 group relative"
                    >
                      {job.applied && (
                        <span className="absolute top-3 right-3 bg-emerald-50 text-emerald-600 border border-emerald-100 text-[9px] font-bold px-2 py-0.5 rounded-md">
                          Applied
                        </span>
                      )}

                      <div className="space-y-3.5">
                        <div className="flex items-start space-x-3">
                          <div className="w-11 h-11 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm shrink-0">
                            {job.companyInfo?.name?.charAt(0)}
                          </div>
                          <div>
                            <h3 className="text-xs font-bold text-slate-800 leading-tight group-hover:text-blue-600 transition-colors">{job.title}</h3>
                            <span className="text-[10px] text-slate-400 block mt-0.5 font-semibold">{job.companyInfo?.name}</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 bg-slate-50/50 p-3.5 rounded-xl border border-slate-100 text-xs">
                          <div className="flex items-center space-x-1.5">
                            <DollarSign className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                            <span>Package: <strong>{job.package} LPA</strong></span>
                          </div>
                          <div className="flex items-center space-x-1.5">
                            <MapPin className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                            <span className="truncate">Loc: {job.location || "On-Site"}</span>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-1 text-[9px] text-slate-500">
                          <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200/50">CGPA: {job.eligibility?.cgpa}</span>
                          <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200/50 truncate max-w-[150px]">
                            {job.eligibility?.branches?.join(", ") || "All Branches"}
                          </span>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-50 flex items-center justify-between text-[10px] text-slate-400">
                        <span className="text-red-500 font-bold flex items-center space-x-1">
                          <Calendar className="w-3 h-3" />
                          <span>Close: {new Date(job.deadline).toLocaleDateString()}</span>
                        </span>
                        <button
                          onClick={() => setSelectedJob(job)}
                          className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-[10px] font-semibold cursor-pointer shadow-sm shadow-blue-600/5"
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ---------------- ACTIVE TAB: APPLIED JOBS ---------------- */}
          {activeTab === "applied-jobs" && (
            <div className="space-y-6">
              <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm shadow-slate-100">
                <h2 className="text-lg font-bold text-slate-800">Your Applied Pipeline</h2>
                <p className="text-xs text-slate-400 mt-1">Review selection progress and dates for your applied drives.</p>
              </div>

              {loadingApps ? (
                <div className="flex justify-center py-20">
                  <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
                </div>
              ) : applications.length === 0 ? (
                <div className="bg-white border border-slate-100 p-16 rounded-2xl text-center space-y-4">
                  <FileText className="w-12 h-12 text-slate-400 mx-auto" />
                  <h3 className="text-sm font-bold text-slate-800">No active applications found</h3>
                  <p className="text-xs text-slate-400">Apply to recommendations to initiate interview pipelines.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {applications.map(app => (
                    <div 
                      key={app._id}
                      className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm shadow-slate-100 space-y-5 hover:shadow-md transition-all relative overflow-hidden"
                    >
                      <span className={`absolute left-0 top-0 w-1.5 h-full ${
                        app.status === "Selected" ? "bg-emerald-500" : app.status === "Rejected" ? "bg-rose-500" : "bg-blue-500"
                      }`} />

                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-50 pb-3 gap-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">
                            {app.jobId?.companyId?.name?.charAt(0)}
                          </div>
                          <div>
                            <h3 className="text-xs font-bold text-slate-800">{app.jobId?.title}</h3>
                            <p className="text-[10px] text-slate-450 mt-0.5">{app.jobId?.companyId?.name}</p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3">
                          <span className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider border ${
                            app.status === "Selected" 
                              ? "bg-emerald-55 border-emerald-100 text-emerald-600"
                              : app.status === "Rejected"
                              ? "bg-rose-55 border-rose-105 text-rose-600"
                              : "bg-blue-55 border-blue-105 text-blue-600"
                          }`}>
                            {app.status}
                          </span>
                          {app.offerLetterUrl && (
                            <a 
                              href={app.offerLetterUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-semibold cursor-pointer shadow-sm"
                            >
                              Download Letter
                            </a>
                          )}
                        </div>
                      </div>

                      {/* Stepper Pipeline */}
                      <div className="space-y-4">
                        <span className="text-[10px] font-bold text-slate-450 uppercase tracking-widest block">Process Timeline</span>
                        
                        <div className="relative py-4 flex items-center justify-between">
                          <div className="absolute left-0 right-0 h-0.5 bg-slate-100 z-0"></div>
                          
                          {/* Node Applied */}
                          <div className="relative z-10 flex flex-col items-center">
                            <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center shadow">
                              <Check className="w-4 h-4" />
                            </div>
                            <span className="text-[9px] font-bold text-slate-800 mt-2">Applied</span>
                          </div>

                          {/* Node Shortlisted */}
                          <div className="relative z-10 flex flex-col items-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center border transition-all ${
                              app.status === "Shortlisted" || app.status === "Selected"
                                ? "bg-indigo-600 border-indigo-600 text-white shadow"
                                : "bg-white border-slate-200 text-slate-400"
                            }`}>
                              <ShieldCheck className="w-4 h-4" />
                            </div>
                            <span className="text-[9px] font-bold text-slate-500 mt-2">Shortlist</span>
                          </div>

                          {/* Node Offer */}
                          <div className="relative z-10 flex flex-col items-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center border transition-all ${
                              app.status === "Selected"
                                ? "bg-emerald-500 border-emerald-500 text-white shadow"
                                : app.status === "Rejected"
                                ? "bg-rose-500 border-rose-500 text-white shadow"
                                : "bg-white border-slate-200 text-slate-400"
                            }`}>
                              {app.status === "Rejected" ? <X className="w-4 h-4" /> : <Award className="w-4 h-4" />}
                            </div>
                            <span className="text-[9px] font-bold text-slate-500 mt-2">
                              {app.status === "Selected" ? "Selected" : app.status === "Rejected" ? "Rejected" : "Offer"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ---------------- ACTIVE TAB: PLACEMENT DRIVE (SCHEDULE) ---------------- */}
          {activeTab === "placement-drive" && (
            <div className="space-y-6">
              <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm shadow-slate-100">
                <h2 className="text-lg font-bold text-slate-800">Placement Drive Calendar</h2>
                <p className="text-xs text-slate-400 mt-1">Calendar events, audits, and deadlines for registered cohorts.</p>
              </div>

              {/* Timeline schedule */}
              <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm shadow-slate-100 space-y-6">
                <div className="relative pl-6 border-l-2 border-blue-100 space-y-6">
                  {/* Event 1 */}
                  <div className="relative">
                    <span className="absolute -left-9.5 top-1.5 w-5 h-5 rounded-full border-4 border-white bg-blue-500 shadow-sm" />
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">Tomorrow, 10:00 AM</span>
                      <h3 className="text-xs font-bold text-slate-800 mt-1">TCS NQT Pre-Placement Talk</h3>
                      <p className="text-xs text-slate-400">Introduction to company culture, eligibility questions, and testing schedules. Required attendance for Sem 8 CSE/IT cohorts.</p>
                    </div>
                  </div>

                  {/* Event 2 */}
                  <div className="relative">
                    <span className="absolute -left-9.5 top-1.5 w-5 h-5 rounded-full border-4 border-white bg-slate-350 shadow-sm" />
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">July 8, 2026</span>
                      <h3 className="text-xs font-bold text-slate-800 mt-1">Wipro Technical Interview Audits</h3>
                      <p className="text-xs text-slate-400">Offline panel interviews on Tech Block B. Shortlisted candidates must present physical CV copies.</p>
                    </div>
                  </div>

                  {/* Event 3 */}
                  <div className="relative">
                    <span className="absolute -left-9.5 top-1.5 w-5 h-5 rounded-full border-4 border-white bg-slate-350 shadow-sm" />
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">July 15, 2026</span>
                      <h3 className="text-xs font-bold text-slate-800 mt-1">Accenture GD Round scheduling</h3>
                      <p className="text-xs text-slate-400">Group discussions on online team links. Invites will be sent to registered emails.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ---------------- ACTIVE TAB: CODING PRACTICE ---------------- */}
          {activeTab === "coding" && (
            <div className="space-y-6">
              <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm shadow-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-800">Coding Practice Arena</h2>
                  <p className="text-xs text-slate-400 mt-1">Hone your DSA, algorithmic, and database query capabilities.</p>
                </div>
                <div className="flex space-x-2 shrink-0">
                  <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200/50">
                    DSA Level: Intermediate
                  </span>
                </div>
              </div>

              {/* Problems board teaser */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Solved listing */}
                <div className="md:col-span-2 bg-white border border-slate-100 p-6 rounded-2xl shadow-sm shadow-slate-100 space-y-4">
                  <h3 className="text-sm font-bold text-slate-800 flex items-center space-x-2 border-b border-slate-50 pb-3">
                    <Code className="w-4.5 h-4.5 text-blue-500" />
                    <span>Recommended DSA Questions</span>
                  </h3>

                  <div className="space-y-3">
                    <div className="p-4 bg-slate-50/50 border border-slate-100 hover:border-slate-250 rounded-xl transition-all flex items-center justify-between text-xs">
                      <div className="space-y-1">
                        <h4 className="font-bold text-slate-850">1. Two Sum Problem</h4>
                        <span className="text-[9px] text-slate-400 font-semibold">Arrays & Hashing · Easy</span>
                      </div>
                      <span className="text-emerald-500 font-bold">Solved</span>
                    </div>
                    
                    <div className="p-4 bg-slate-50/50 border border-slate-100 hover:border-slate-250 rounded-xl transition-all flex items-center justify-between text-xs">
                      <div className="space-y-1">
                        <h4 className="font-bold text-slate-850">2. Longest Substring Without Repeating Characters</h4>
                        <span className="text-[9px] text-slate-400 font-semibold">Sliding Window · Medium</span>
                      </div>
                      <button className="px-3.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-[10px] font-semibold cursor-pointer">
                        Solve
                      </button>
                    </div>

                    <div className="p-4 bg-slate-50/50 border border-slate-100 hover:border-slate-250 rounded-xl transition-all flex items-center justify-between text-xs">
                      <div className="space-y-1">
                        <h4 className="font-bold text-slate-850">3. Merge k Sorted Lists</h4>
                        <span className="text-[9px] text-slate-400 font-semibold">Heaps / Priority Queues · Hard</span>
                      </div>
                      <button className="px-3.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-[10px] font-semibold cursor-pointer">
                        Solve
                      </button>
                    </div>
                  </div>
                </div>

                {/* Substats */}
                <div className="md:col-span-1 bg-white border border-slate-100 p-6 rounded-2xl shadow-sm shadow-slate-100 space-y-4">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Target Cohorts</h3>
                  <div className="space-y-2 text-xs text-slate-450 leading-relaxed">
                    <p>Standard recruiting algorithms test arrays, strings, binary trees, dynamic programming, and SQL queries.</p>
                    <p>Aim for at least <strong>150 medium problems</strong> solved before starting drives to match cutoff scores.</p>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* ---------------- ACTIVE TAB: RESUME SCORE (ANALYZE) ---------------- */}
          {activeTab === "resume-score" && (
            <div className="space-y-6">
              <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm shadow-slate-100">
                <h2 className="text-lg font-bold text-slate-800">AI Resume Optimizer</h2>
                <p className="text-xs text-slate-400 mt-1">Audit your resume matching algorithms to match standard ATS (Applicant Tracking Systems).</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Scoring audit */}
                <div className="md:col-span-2 bg-white border border-slate-100 p-6 rounded-2xl shadow-sm shadow-slate-100 space-y-4">
                  <h3 className="text-sm font-bold text-slate-800 flex items-center space-x-2 border-b border-slate-50 pb-3">
                    <Info className="w-4.5 h-4.5 text-blue-500" />
                    <span>Improvement Checklist suggestions</span>
                  </h3>

                  <ul className="space-y-3 text-xs leading-normal">
                    <li className="flex items-start space-x-2.5 text-slate-600">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>Contact Info & CGPA details correctly formatted (ATS-compliant headers)</span>
                    </li>
                    <li className="flex items-start space-x-2.5 text-slate-650">
                      <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                      <span>Project descriptions lack action verbs. Use verbs like: "Architected", "Engineered", "Optimized".</span>
                    </li>
                    <li className="flex items-start space-x-2.5 text-slate-650">
                      <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                      <span>Skill keywords (e.g. Docker, Git) are in projects section but missing in tag fields.</span>
                    </li>
                  </ul>
                </div>

                {/* Resume upload action */}
                <div className="md:col-span-1 bg-white border border-slate-100 p-6 rounded-2xl shadow-sm shadow-slate-100 space-y-4 text-center">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest text-left">Resume document</h3>
                  <div className="w-20 h-20 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto shadow-inner">
                    <FileText className="w-10 h-10" />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-slate-800 block">ATS Score: 85%</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">High potential score</span>
                  </div>
                  <button
                    onClick={() => setActiveTab("profile")}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer transition-colors"
                  >
                    Upload New Version
                  </button>
                </div>

              </div>
            </div>
          )}

          {/* ---------------- ACTIVE TAB: NOTIFICATIONS ---------------- */}
          {activeTab === "notifications" && (
            <div className="space-y-6">
              <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm shadow-slate-100 flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-bold text-slate-800">Alert Center Notifications</h2>
                  <p className="text-xs text-slate-400 mt-1">List of scheduling dates, offers, and system announcements.</p>
                </div>
                {notifications.filter(n => !n.read).length > 0 && (
                  <button 
                    onClick={handleMarkAllRead}
                    className="px-3.5 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-100 text-slate-700 rounded-lg text-[10px] font-bold cursor-pointer transition-colors"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              {loadingNotifs ? (
                <div className="flex justify-center py-20">
                  <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
                </div>
              ) : notifications.length === 0 ? (
                <div className="bg-white border border-slate-100 p-16 rounded-2xl text-center space-y-4">
                  <Bell className="w-12 h-12 text-slate-400 mx-auto" />
                  <h3 className="text-sm font-bold text-slate-800">Clean Inbox</h3>
                  <p className="text-xs text-slate-400">All alerts have been read.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {notifications.map((notif) => (
                    <div 
                      key={notif._id}
                      className={`bg-white border p-5 rounded-2xl shadow-sm flex items-start space-x-4 ${
                        notif.read ? "border-slate-100" : "border-blue-100 bg-blue-50/10 shadow-blue-50/5"
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${notif.read ? "bg-slate-350" : "bg-blue-500"}`} />
                      <div className="flex-1 space-y-1">
                        <p className="text-xs text-slate-700 font-medium leading-relaxed">{notif.message}</p>
                        <span className="text-[9px] text-slate-450 block font-bold">
                          {new Date(notif.createdAt).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ---------------- ACTIVE TAB: PROFILE & PORTFOLIO ---------------- */}
          {activeTab === "profile" && (
            <div className="space-y-6 animate-fade-in">
              
              {/* Profile sub-tabs */}
              <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm shadow-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-800">Portfolio & Profile Editor</h2>
                  <p className="text-xs text-slate-400 mt-1">Review credentials, skills, and portfolio projects.</p>
                </div>
                
                <div className="bg-slate-100 p-1 rounded-xl border border-slate-200 flex space-x-1 shrink-0">
                  <button
                    onClick={() => setProfileSubTab("basic")}
                    className={`px-3 py-1.5 text-[10px] font-bold rounded-lg transition-colors cursor-pointer ${
                      profileSubTab === "basic" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    General Details
                  </button>
                  <button
                    onClick={() => setProfileSubTab("projects")}
                    className={`px-3 py-1.5 text-[10px] font-bold rounded-lg transition-colors cursor-pointer ${
                      profileSubTab === "projects" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    Projects & Resume
                  </button>
                  <button
                    onClick={() => setProfileSubTab("security")}
                    className={`px-3 py-1.5 text-[10px] font-bold rounded-lg transition-colors cursor-pointer ${
                      profileSubTab === "security" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    Security
                  </button>
                </div>
              </div>

              {/* Sub-tab basic details */}
              {profileSubTab === "basic" && (
                <form onSubmit={handleUpdateProfile} className="bg-white border border-slate-100 p-8 rounded-2xl shadow-sm shadow-slate-100 space-y-6">
                  <h3 className="text-sm font-bold text-slate-800 flex items-center space-x-2 border-b border-slate-50 pb-4">
                    <User className="w-4 h-4 text-blue-500" />
                    <span>Personal Information</span>
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {/* Readonly parameters */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center space-x-1">
                        <span>Full Name</span>
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={user?.name || ""}
                          className="w-full bg-slate-50 border border-slate-100 text-slate-500 rounded-lg pl-3 pr-8 py-2.5 text-xs focus:outline-none cursor-not-allowed"
                          disabled
                        />
                        <Lock className="absolute right-3 top-3 w-3.5 h-3.5 text-slate-400" />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center space-x-1">
                        <span>Email Address</span>
                      </label>
                      <div className="relative">
                        <input
                          type="email"
                          value={user?.email || ""}
                          className="w-full bg-slate-50 border border-slate-100 text-slate-500 rounded-lg pl-3 pr-8 py-2.5 text-xs focus:outline-none cursor-not-allowed"
                          disabled
                        />
                        <Lock className="absolute right-3 top-3 w-3.5 h-3.5 text-slate-400" />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center space-x-1">
                        <span>Academic CGPA</span>
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={details?.cgpa || ""}
                          className="w-full bg-slate-50 border border-slate-100 text-slate-500 rounded-lg pl-3 pr-8 py-2.5 text-xs focus:outline-none cursor-not-allowed"
                          disabled
                        />
                        <Lock className="absolute right-3 top-3 w-3.5 h-3.5 text-slate-400" />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center space-x-1">
                        <span>Roll Number</span>
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={details?.rollNumber || ""}
                          className="w-full bg-slate-50 border border-slate-100 text-slate-500 rounded-lg pl-3 pr-8 py-2.5 text-xs focus:outline-none cursor-not-allowed"
                          disabled
                        />
                        <Lock className="absolute right-3 top-3 w-3.5 h-3.5 text-slate-400" />
                      </div>
                    </div>

                    {/* Editable Parameter */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Phone Number</label>
                      <input
                        type="text"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+91 XXXXX XXXXX"
                        className="w-full bg-white border border-slate-200 text-slate-800 rounded-lg px-3 py-2.5 text-xs focus:outline-none focus:border-blue-500 transition-colors"
                        disabled={actionLoading}
                      />
                    </div>
                  </div>

                  {/* Skills tagging block */}
                  <div className="space-y-3.5 pt-6 border-t border-slate-50">
                    <label className="text-[10px] font-bold text-slate-600 uppercase tracking-widest block">Skills Tag Portfolio</label>
                    
                    <div className="flex space-x-3">
                      <input
                        type="text"
                        value={newSkill}
                        onChange={(e) => setNewSkill(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddSkill())}
                        placeholder="Add technology tags (e.g. React, Node.js)"
                        className="flex-1 bg-white border border-slate-200 text-slate-800 rounded-lg px-3 py-2.5 text-xs focus:outline-none focus:border-blue-500 transition-colors"
                        disabled={actionLoading}
                      />
                      <button
                        type="button"
                        onClick={handleAddSkill}
                        className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
                        disabled={actionLoading}
                      >
                        Add
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-2">
                      {skills.map((skill) => (
                        <span 
                          key={skill}
                          className="flex items-center space-x-1.5 px-3 py-1 bg-blue-50 border border-blue-100 text-blue-600 rounded-full text-xs font-bold"
                        >
                          <span>{skill}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveSkill(skill)}
                            className="text-blue-550 hover:text-blue-700 transition-colors cursor-pointer"
                            disabled={actionLoading}
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </span>
                      ))}
                      {skills.length === 0 && (
                        <span className="text-slate-400 text-xs italic">No profile tags listed.</span>
                      )}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-50 flex justify-end">
                    <button
                      type="submit"
                      className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-xs transition-colors shadow-sm shadow-blue-600/5 cursor-pointer disabled:opacity-50"
                      disabled={actionLoading}
                    >
                      {actionLoading ? "Saving..." : "Save details"}
                    </button>
                  </div>
                </form>
              )}

              {/* Projects & resume portfolio */}
              {profileSubTab === "projects" && (
                <div className="space-y-6">
                  {/* Uploader resume */}
                  <form onSubmit={handleUploadResume} className="bg-white border border-slate-100 p-8 rounded-2xl shadow-sm shadow-slate-100 space-y-6">
                    <h3 className="text-sm font-bold text-slate-800 flex items-center space-x-2 border-b border-slate-50 pb-4">
                      <FileText className="w-4 h-4 text-blue-500" />
                      <span>Academic Resume PDF</span>
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                      <div className="space-y-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-bold">Active Resume Document</span>
                        {details?.resumeUrl ? (
                          <a 
                            href={details.resumeUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center space-x-2 px-5 py-3.5 bg-blue-50 border border-blue-100 text-blue-600 rounded-xl text-xs font-bold hover:bg-blue-100/50 transition-all cursor-pointer"
                          >
                            <FileText className="w-4 h-4" />
                            <span>View Resume PDF</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        ) : (
                          <div className="flex items-center space-x-2 text-xs text-amber-500 bg-amber-50 p-3 rounded-lg border border-amber-100">
                            <AlertTriangle className="w-4.5 h-4.5 shrink-0" />
                            <span>No PDF resume uploaded yet.</span>
                          </div>
                        )}
                      </div>

                      <div className="space-y-3">
                        <label className="text-[10px] font-bold text-slate-650 uppercase tracking-widest block">Upload New Resume (PDF only)</label>
                        
                        <div className="border border-dashed border-slate-200 p-4.5 rounded-xl flex items-center justify-between gap-4 bg-slate-50/50 hover:border-blue-500/30 transition-all">
                          <input
                            type="file"
                            accept="application/pdf"
                            onChange={(e) => setResumeFile(e.target.files[0])}
                            className="text-slate-600 text-xs file:mr-4 file:py-1.5 file:px-3.5 file:rounded-lg file:border-0 file:text-[10px] file:font-bold file:bg-white file:border file:border-slate-200 file:text-slate-700 file:cursor-pointer hover:file:bg-slate-50"
                            disabled={actionLoading}
                          />
                          <button
                            type="submit"
                            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold cursor-pointer disabled:opacity-50 shrink-0"
                            disabled={actionLoading || !resumeFile}
                          >
                            {actionLoading ? "Uploading..." : "Upload File"}
                          </button>
                        </div>
                      </div>
                    </div>
                  </form>

                  {/* Portfolio Projects */}
                  <div className="bg-white border border-slate-100 p-8 rounded-2xl shadow-sm shadow-slate-100 space-y-6">
                    <h3 className="text-sm font-bold text-slate-800 flex items-center space-x-2 border-b border-slate-50 pb-4">
                      <Award className="w-4 h-4 text-blue-500" />
                      <span>Projects Showcase</span>
                    </h3>

                    <div className="space-y-4">
                      {projects.map((proj, idx) => (
                        <div 
                          key={idx}
                          className="bg-slate-50/50 p-5 rounded-xl border border-slate-100 flex justify-between items-start gap-4"
                        >
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <h4 className="text-xs font-bold text-slate-800">{proj.title}</h4>
                              {proj.link && (
                                <a href={proj.link} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-slate-600 cursor-pointer">
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 leading-normal max-w-xl">{proj.description}</p>
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              {proj.techStack?.map(tech => (
                                <span key={tech} className="px-2.5 py-0.5 bg-white border border-slate-200/50 text-slate-600 rounded text-[9px] font-bold">{tech}</span>
                              ))}
                            </div>
                          </div>

                          <button
                            onClick={() => handleRemoveProject(idx)}
                            className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-550 rounded-lg hover:text-rose-700 transition-colors cursor-pointer"
                            disabled={actionLoading}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}

                      {projects.length === 0 && (
                        <div className="text-center py-8 text-slate-400 text-xs italic bg-slate-50/50 border border-slate-100 border-dashed rounded-xl">
                          No projects listed in portfolio. Add one below.
                        </div>
                      )}
                    </div>

                    {/* Add New project Form */}
                    <div className="bg-slate-50/30 p-6 rounded-xl border border-slate-100 space-y-4">
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-widest border-b border-slate-50 pb-2">Add New Portfolio Project</h4>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Project Title</label>
                          <input
                            type="text"
                            value={newProjTitle}
                            onChange={(e) => setNewProjTitle(e.target.value)}
                            placeholder="e.g. Placement Portal"
                            className="w-full bg-white border border-slate-200 text-slate-800 rounded-lg px-3.5 py-2.5 text-xs focus:outline-none focus:border-blue-500"
                            disabled={actionLoading}
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Live Link / Repo URL</label>
                          <input
                            type="text"
                            value={newProjLink}
                            onChange={(e) => setNewProjLink(e.target.value)}
                            placeholder="e.g. https://github.com/..."
                            className="w-full bg-white border border-slate-200 text-slate-800 rounded-lg px-3.5 py-2.5 text-xs focus:outline-none focus:border-blue-500"
                            disabled={actionLoading}
                          />
                        </div>

                        <div className="sm:col-span-2 space-y-1">
                          <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Tech Stack Tags (Comma Separated)</label>
                          <input
                            type="text"
                            value={newProjStack}
                            onChange={(e) => setNewProjStack(e.target.value)}
                            placeholder="e.g. React, Node.js, MongoDB"
                            className="w-full bg-white border border-slate-200 text-slate-800 rounded-lg px-3.5 py-2.5 text-xs focus:outline-none focus:border-blue-500"
                            disabled={actionLoading}
                          />
                        </div>

                        <div className="sm:col-span-2 space-y-1">
                          <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Project Description</label>
                          <textarea
                            rows="3"
                            value={newProjDesc}
                            onChange={(e) => setNewProjDesc(e.target.value)}
                            placeholder="Briefly describe the features and your contributions..."
                            className="w-full bg-white border border-slate-200 text-slate-800 rounded-lg px-3.5 py-2.5 text-xs focus:outline-none focus:border-blue-500 resize-none"
                            disabled={actionLoading}
                          />
                        </div>
                      </div>

                      <div className="flex justify-end pt-1">
                        <button
                          type="button"
                          onClick={handleAddProject}
                          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold cursor-pointer transition-colors"
                          disabled={actionLoading}
                        >
                          Push Project
                        </button>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-50 flex justify-end">
                      <button
                        onClick={handleUpdateProfile}
                        className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-xs transition-colors shadow-sm shadow-blue-600/5 cursor-pointer disabled:opacity-50"
                        disabled={actionLoading}
                      >
                        {actionLoading ? "Saving portfolio..." : "Save Portfolio Changes"}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Profile Security tab */}
              {profileSubTab === "security" && (
                <form onSubmit={handleUpdatePassword} className="bg-white border border-slate-100 p-8 rounded-2xl shadow-sm shadow-slate-100 space-y-6">
                  <h3 className="text-sm font-bold text-slate-800 flex items-center space-x-2 border-b border-slate-50 pb-4">
                    <Key className="w-4 h-4 text-blue-500" />
                    <span>Update Account Password</span>
                  </h3>

                  <div className="space-y-4 max-w-md">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Old Password</label>
                      <input
                        type="password"
                        value={oldPassword}
                        onChange={(e) => setOldPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-white border border-slate-200 text-slate-800 rounded-lg px-3 py-2.5 text-xs focus:outline-none focus:border-blue-500 transition-colors"
                        disabled={actionLoading}
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">New Password</label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Min 6 characters"
                        className="w-full bg-white border border-slate-200 text-slate-800 rounded-lg px-3 py-2.5 text-xs focus:outline-none focus:border-blue-500 transition-colors"
                        disabled={actionLoading}
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Confirm New Password</label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm new password"
                        className="w-full bg-white border border-slate-200 text-slate-800 rounded-lg px-3 py-2.5 text-xs focus:outline-none focus:border-blue-500 transition-colors"
                        disabled={actionLoading}
                        required
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-50 flex justify-end">
                    <button
                      type="submit"
                      className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-xs transition-colors shadow-sm shadow-blue-600/5 cursor-pointer disabled:opacity-50"
                      disabled={actionLoading}
                    >
                      {actionLoading ? "Updating..." : "Update Password"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </main>

        {/* Footer */}
        <footer className="mt-auto border-t border-slate-100 bg-white py-6 px-8 text-center text-xs text-slate-405 flex flex-col sm:flex-row justify-between items-center gap-4 relative z-10">
          <span>PlacementConnect © 2026</span>
          <div className="flex space-x-4">
            <a href="#" className="hover:text-slate-700">Privacy Policy</a>
            <a href="#" className="hover:text-slate-700">Terms</a>
            <a href="#" className="hover:text-slate-700">Support</a>
            <a href="#" className="hover:text-slate-700">Contact</a>
          </div>
        </footer>

        {/* Floating AI Career Assistant */}
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
          {chatOpen && (
            <div className="bg-white border border-slate-100 shadow-2xl rounded-2xl w-80 md:w-96 h-96 flex flex-col justify-between mb-3 overflow-hidden border border-slate-100/80 animate-fade-in">
              {/* Chat Header */}
              <div className="bg-blue-600 px-4 py-3 flex items-center justify-between text-white shadow-md">
                <div className="flex items-center space-x-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-bold tracking-wide">AI Career Assistant</span>
                </div>
                <button 
                  onClick={() => setChatOpen(false)}
                  className="p-1 hover:bg-blue-700 rounded cursor-pointer"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3 pr-1 scrollbar-thin bg-slate-50/50">
                {chatMessages.map((msg, idx) => (
                  <div 
                    key={idx}
                    className={`p-3 rounded-xl text-xs leading-relaxed max-w-[80%] ${
                      msg.sender === "ai" 
                        ? "bg-white text-slate-700 border border-slate-100/50 shadow-sm self-start mr-auto" 
                        : "bg-blue-600 text-white shadow-sm ml-auto self-end"
                    }`}
                  >
                    {msg.text}
                  </div>
                ))}
              </div>

              {/* Chat Input */}
              <div className="p-3 border-t border-slate-100 flex items-center space-x-2 bg-white">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendChatMessage()}
                  placeholder="Ask for resume feedback, DSA practice..."
                  className="flex-1 bg-slate-50 border border-slate-100 text-slate-700 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-blue-500"
                />
                <button 
                  onClick={handleSendChatMessage}
                  className="p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg cursor-pointer shadow"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Assistant Toggle Button */}
          <button
            onClick={() => setChatOpen(!chatOpen)}
            className="w-12 h-12 bg-blue-600 hover:bg-blue-500 text-white rounded-full flex items-center justify-center shadow-lg shadow-blue-600/25 hover:shadow-xl hover:shadow-blue-600/35 active:scale-95 transition-all cursor-pointer border border-blue-500/10"
            title="Career AI assistant"
          >
            <MessageSquare className="w-5 h-5 text-white" />
          </button>
        </div>

      </div>

      {/* JOBS DETAILS MODAL DRAWER */}
      {selectedJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white border border-slate-150 w-full max-w-2xl rounded-2xl shadow-2xl relative max-h-[90vh] overflow-y-auto pr-1 flex flex-col">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur z-10">
              <div className="flex items-center space-x-3.5">
                <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm">
                  {selectedJob.companyInfo?.name?.charAt(0)}
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-800 tracking-tight">{selectedJob.title}</h3>
                  <p className="text-xs text-slate-400 mt-1 font-semibold">{selectedJob.companyInfo?.name}</p>
                </div>
              </div>

              <button 
                onClick={() => setSelectedJob(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 flex-1">
              {/* Specs tags */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-slate-50/50 p-3.5 rounded-xl border border-slate-100">
                  <span className="text-[9px] text-slate-400 uppercase tracking-widest block font-bold">Salary Package</span>
                  <span className="text-sm font-extrabold text-blue-600 block mt-1.5">{selectedJob.package} LPA</span>
                </div>
                <div className="bg-slate-50/50 p-3.5 rounded-xl border border-slate-100">
                  <span className="text-[9px] text-slate-400 uppercase tracking-widest block font-bold">Job Location</span>
                  <span className="text-xs font-extrabold text-slate-800 block mt-1.5 truncate">{selectedJob.location || "On-Site"}</span>
                </div>
                <div className="bg-slate-50/50 p-3.5 rounded-xl border border-slate-100">
                  <span className="text-[9px] text-slate-400 uppercase tracking-widest block font-bold">Cutoff CGPA</span>
                  <span className="text-xs font-extrabold text-slate-800 block mt-1.5">{selectedJob.eligibility?.cgpa} / 10.0</span>
                </div>
                <div className="bg-slate-50/50 p-3.5 rounded-xl border border-slate-100">
                  <span className="text-[9px] text-slate-400 uppercase tracking-widest block font-bold">Applications Close</span>
                  <span className="text-xs font-bold text-red-500 block mt-1.5">{new Date(selectedJob.deadline).toLocaleDateString()}</span>
                </div>
              </div>

              {/* JD description */}
              <div className="space-y-2">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Job Role & Responsibilities</h4>
                <div className="text-slate-600 text-xs leading-relaxed bg-slate-50/30 p-4.5 rounded-xl border border-slate-100 whitespace-pre-line max-h-56 overflow-y-auto pr-1">
                  {selectedJob.description}
                </div>
              </div>

              {/* Eligibility Check list */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Your Eligibility Analysis</h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* CGPA check */}
                  <div className={`p-4 rounded-xl border flex items-center justify-between text-xs ${
                    details?.cgpa >= selectedJob.eligibility?.cgpa 
                      ? "bg-emerald-50/5 border-emerald-100 text-emerald-700"
                      : "bg-rose-50/5 border-rose-100 text-rose-700"
                  }`}>
                    <div className="space-y-0.5">
                      <span className="text-slate-450 block text-[9px] uppercase font-bold">CGPA Cutoff</span>
                      <span>Cutoff: {selectedJob.eligibility?.cgpa} · Yours: {details?.cgpa}</span>
                    </div>
                    {details?.cgpa >= selectedJob.eligibility?.cgpa ? (
                      <Check className="w-5 h-5 text-emerald-500 shrink-0" />
                    ) : (
                      <X className="w-5 h-5 text-rose-500 shrink-0" />
                    )}
                  </div>

                  {/* Branch check */}
                  <div className={`p-4 rounded-xl border flex items-center justify-between text-xs ${
                    selectedJob.eligibility?.branches?.length === 0 || selectedJob.eligibility?.branches?.includes(details?.branch)
                      ? "bg-emerald-50/5 border-emerald-100 text-emerald-700"
                      : "bg-rose-50/5 border-rose-100 text-rose-700"
                  }`}>
                    <div className="space-y-0.5">
                      <span className="text-slate-450 block text-[9px] uppercase font-bold">Branch Allowed</span>
                      <span className="truncate max-w-[170px] block">{selectedJob.eligibility?.branches?.join(", ") || "All Branches"}</span>
                    </div>
                    {selectedJob.eligibility?.branches?.length === 0 || selectedJob.eligibility?.branches?.includes(details?.branch) ? (
                      <Check className="w-5 h-5 text-emerald-500 shrink-0" />
                    ) : (
                      <X className="w-5 h-5 text-rose-500 shrink-0" />
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-slate-100 bg-slate-50/90 flex items-center justify-between sticky bottom-0 z-10">
              <span className="text-[10px] text-slate-450 italic">Confirm profile details are accurate before applying.</span>

              <div className="flex space-x-3">
                <button
                  onClick={() => setSelectedJob(null)}
                  className="px-4.5 py-2.5 border border-slate-200 hover:border-slate-300 text-slate-600 rounded-lg text-xs font-bold cursor-pointer transition-colors bg-white"
                >
                  Cancel
                </button>
                
                {selectedJob.applied ? (
                  <button
                    className="px-5 py-2.5 bg-emerald-55 border border-emerald-100 text-emerald-600 rounded-lg text-xs font-bold cursor-not-allowed flex items-center space-x-1.5"
                    disabled
                  >
                    <Check className="w-4 h-4" />
                    <span>Applied</span>
                  </button>
                ) : (
                  <button
                    onClick={() => handleApply(selectedJob._id)}
                    disabled={actionLoading}
                    className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-lg text-xs font-bold cursor-pointer shadow-md shadow-blue-650/10 flex items-center space-x-1.5 disabled:opacity-50"
                  >
                    {actionLoading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Applying...</span>
                      </>
                    ) : (
                      <span>Apply Now</span>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
