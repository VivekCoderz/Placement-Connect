import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { 
  Building2, Briefcase, FileText, User, MessageSquare, Plus, Bell, Search, 
  Trash2, X, Lock, Check, AlertTriangle, AlertCircle, ExternalLink, ArrowRight, 
  ArrowUpRight, Award, Compass, Key, Settings, HelpCircle, Download, Eye, 
  Clock, RefreshCw, BarChart2, CheckSquare, Upload, Calendar, CheckCircle2,
  LogOut
} from "lucide-react";
import api from "../utils/api";
import { logoutState } from "../store/authSlice";
import ChatPanel from "./ChatPanel";

export const RecruiterDashboard = () => {
  const dispatch = useDispatch();
  const { user, details: company } = useSelector((state) => state.auth);

  // Navigation state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");

  // Form states (Create Job)
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newPackage, setNewPackage] = useState("");
  const [newLocation, setNewLocation] = useState("On-Site");
  const [newCgpa, setNewCgpa] = useState("7.0");
  const [selectedBranches, setSelectedBranches] = useState(["Computer Science & Engineering", "Information Technology"]);
  const [newDeadline, setNewDeadline] = useState("");

  // Application Pipeline / Review Modal state
  const [recruiterJobs, setRecruiterJobs] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState("");
  const [applicants, setApplicants] = useState([]);
  const [loadingApplicants, setLoadingApplicants] = useState(false);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Status message
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Interview scheduler state
  const [schedulingAppId, setSchedulingAppId] = useState(null);
  const [roundName, setRoundName] = useState("Technical Interview");
  const [roundDate, setRoundDate] = useState("");
  const [roundNotes, setRoundNotes] = useState("");

  // Offer Letter State
  const [uploadingAppId, setUploadingAppId] = useState(null);
  const [offerLetterUrlInput, setOfferLetterUrlInput] = useState("");

  const clearMessages = () => {
    setErrorMsg("");
    setSuccessMsg("");
  };

  // Fetch recruiter's jobs list
  const fetchJobs = async () => {
    setLoadingJobs(true);
    try {
      const res = await api.get("/jobs");
      // Filter jobs where company recruiter matches current user
      const filtered = (res.data.jobs || []).filter(
        (job) => job.companyId?.recruiterId === user?._id || job.companyId?._id === company?._id
      );
      setRecruiterJobs(filtered);
      if (filtered.length > 0 && !selectedJobId) {
        setSelectedJobId(filtered[0]._id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingJobs(false);
    }
  };

  // Fetch applicants for the selected job
  const fetchApplicants = async () => {
    if (!selectedJobId) return;
    setLoadingApplicants(true);
    try {
      const res = await api.get(`/company/applications/${selectedJobId}`);
      setApplicants(res.data.applications || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingApplicants(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  useEffect(() => {
    fetchApplicants();
  }, [selectedJobId]);

  // Create Job Drive
  const handlePostJob = async (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDesc.trim() || !newPackage || !newDeadline) {
      setErrorMsg("All fields are required to register a job drive");
      return;
    }
    setActionLoading(true);
    clearMessages();

    try {
      await api.post("/company/jobs", {
        title: newTitle.trim(),
        description: newDesc.trim(),
        package: Number(newPackage),
        location: newLocation,
        eligibility: {
          cgpa: Number(newCgpa),
          branches: selectedBranches,
          years: ["2026", "2027"] // cohort targets
        },
        deadline: newDeadline
      });
      setSuccessMsg("Job drive posted successfully!");
      setNewTitle("");
      setNewDesc("");
      setNewPackage("");
      setNewDeadline("");
      fetchJobs();
      setActiveTab("dashboard");
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Failed to post job drive. Ensure company approval.");
    } finally {
      setActionLoading(false);
    }
  };

  // Action status change (Shortlist, Select, Reject)
  const handleStatusChange = async (appId, newStatus) => {
    setActionLoading(true);
    clearMessages();
    try {
      await api.put(`/applications/${appId}/status`, { status: newStatus });
      setSuccessMsg(`Candidate marked as ${newStatus}`);
      fetchApplicants();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Failed to update status");
    } finally {
      setActionLoading(false);
    }
  };

  // Schedule Interview
  const handleScheduleInterview = async (e) => {
    e.preventDefault();
    if (!roundDate) {
      setErrorMsg("Please select interview slot date & time");
      return;
    }
    setActionLoading(true);
    clearMessages();
    try {
      await api.put(`/applications/${schedulingAppId}/status`, {
        roundName,
        roundResult: "Pending",
        scheduledAt: roundDate,
        notes: roundNotes
      });
      setSuccessMsg("Interview slot scheduled, email invitation dispatched!");
      setSchedulingAppId(null);
      setRoundNotes("");
      setRoundDate("");
      fetchApplicants();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Failed to schedule interview round");
    } finally {
      setActionLoading(false);
    }
  };

  // Save/Upload Offer letter Url
  const handleUploadOfferLetter = async (e) => {
    e.preventDefault();
    if (!offerLetterUrlInput.trim()) return;
    setActionLoading(true);
    clearMessages();
    try {
      // Simulate file upload or write link directly
      await api.put(`/applications/${uploadingAppId}/status`, {
        status: "Selected",
        offerLetterUrl: offerLetterUrlInput.trim()
      });
      setSuccessMsg("Offer Letter URL registered successfully!");
      setUploadingAppId(null);
      setOfferLetterUrlInput("");
      fetchApplicants();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Failed to submit offer letter");
    } finally {
      setActionLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (err) {
      console.warn("Logout request failed on backend", err);
    } finally {
      dispatch(logoutState());
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 font-sans flex overflow-hidden">
      
      {/* Left Collapsible Sidebar */}
      <aside className={`bg-white border-r border-slate-100 flex flex-col justify-between transition-all duration-300 z-30 ${sidebarCollapsed ? "w-16" : "w-64"}`}>
        <div className="flex-1 flex flex-col overflow-y-auto">
          {/* Sidebar Header */}
          <div className="h-16 border-b border-slate-50 flex items-center justify-between px-4 shrink-0">
            {!sidebarCollapsed && (
              <span className="text-sm font-extrabold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent uppercase">
                Recruiter Portal
              </span>
            )}
            {sidebarCollapsed && (
              <span className="text-sm font-extrabold text-blue-600 mx-auto">RP</span>
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
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all border ${
                activeTab === "dashboard" ? "bg-blue-50/50 text-blue-600 border-blue-100/50 font-bold" : "text-slate-500 hover:bg-slate-50 border-transparent"
              }`}
            >
              <Compass className="w-4.5 h-4.5 shrink-0 text-slate-400" />
              {!sidebarCollapsed && <span>Dashboard Overview</span>}
            </button>
            
            <button
              onClick={() => setActiveTab("create-job")}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all border ${
                activeTab === "create-job" ? "bg-blue-50/50 text-blue-600 border-blue-100/50 font-bold" : "text-slate-500 hover:bg-slate-50 border-transparent"
              }`}
            >
              <Plus className="w-4.5 h-4.5 shrink-0 text-slate-400" />
              {!sidebarCollapsed && <span>Post Job Drive</span>}
            </button>

            <button
              onClick={() => setActiveTab("pipeline")}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all border ${
                activeTab === "pipeline" ? "bg-blue-50/50 text-blue-600 border-blue-100/50 font-bold" : "text-slate-500 hover:bg-slate-50 border-transparent"
              }`}
            >
              <CheckSquare className="w-4.5 h-4.5 shrink-0 text-slate-400" />
              {!sidebarCollapsed && <span>Applications Pipeline</span>}
            </button>

            <button
              onClick={() => setActiveTab("chat")}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all border ${
                activeTab === "chat" ? "bg-blue-50/50 text-blue-600 border-blue-100/50 font-bold" : "text-slate-500 hover:bg-slate-50 border-transparent"
              }`}
            >
              <MessageSquare className="w-4.5 h-4.5 shrink-0 text-slate-400" />
              {!sidebarCollapsed && <span>Chat Inbox</span>}
            </button>

            <button
              onClick={handleLogout}
              className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all border text-slate-500 hover:bg-rose-50 hover:text-rose-600 border-transparent"
            >
              <LogOut className="w-4.5 h-4.5 shrink-0" />
              {!sidebarCollapsed && <span>Logout</span>}
            </button>
          </nav>
        </div>

        {/* Sidebar Footer Profile */}
        <div className="p-4 border-t border-slate-50 flex items-center justify-between shrink-0">
          {!sidebarCollapsed && (
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-650 text-xs">
                {user?.name?.charAt(0)}
              </div>
              <div className="truncate max-w-[120px]">
                <p className="text-xs font-bold text-slate-800 truncate">{user?.name}</p>
                <p className="text-[10px] text-slate-400 truncate">{company?.name || "No Company"}</p>
              </div>
            </div>
          )}
          <button 
            onClick={handleLogout}
            className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg cursor-pointer transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Main Panel Content */}
      <div className="flex-1 flex flex-col overflow-y-auto">
        {/* Top Navbar */}
        <header className="h-16 bg-white/80 backdrop-blur-md sticky top-0 z-20 border-b border-slate-100 flex items-center justify-between px-8">
          <div>
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Recruiter Panel</h2>
            <h1 className="text-sm font-extrabold text-slate-800 mt-0.5">{company?.name} Workspace</h1>
          </div>

          <div className="flex items-center space-x-4">
            <div className="text-right hidden md:block">
              <p className="text-xs font-bold text-slate-800">{user?.name}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">{user?.email}</p>
            </div>
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 p-0.5 shadow-sm">
              <div className="w-full h-full rounded-full bg-white flex items-center justify-center font-extrabold text-blue-600 text-sm">
                {user?.name?.charAt(0)}
              </div>
            </div>
          </div>
        </header>

        {/* Central main content */}
        <main className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto w-full flex-1">
          {/* Status alerts */}
          {errorMsg && (
            <div className="flex items-start space-x-3 bg-rose-50 border border-rose-100 text-rose-800 text-xs p-4 rounded-xl relative shadow-sm animate-shake">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-bold">Error</p>
                <p className="text-rose-600/85 mt-0.5">{errorMsg}</p>
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
                <p className="text-emerald-605/85 mt-0.5">{successMsg}</p>
              </div>
              <button onClick={clearMessages} className="text-emerald-450 hover:text-emerald-600 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* ---------------- ACTIVE TAB: DASHBOARD OVERVIEW ---------------- */}
          {activeTab === "dashboard" && (
            <div className="space-y-6">
              
              {/* Company Info Header card */}
              <div className="bg-white border border-slate-100 p-6 md:p-8 rounded-2xl shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="space-y-2">
                  <div className="inline-flex items-center space-x-1.5 px-3 py-1 bg-blue-50 border border-blue-100 rounded-full text-blue-600 text-[10px] font-bold">
                    <Building2 className="w-3.5 h-3.5" />
                    <span>Verified Recruiter Profile</span>
                  </div>
                  <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">{company?.name}</h2>
                  <p className="text-xs text-slate-400 max-w-md leading-relaxed">
                    {company?.description || "Post software engineering drives, download student profiles, and update candidate placement results."}
                  </p>
                </div>
                <div className="flex space-x-3 shrink-0">
                  <button 
                    onClick={() => setActiveTab("create-job")}
                    className="px-5 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/10 cursor-pointer transition-colors"
                  >
                    Post Placement Drive
                  </button>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Briefcase className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Job Postings</span>
                    <span className="text-lg font-black text-slate-800 block mt-0.5">{recruiterJobs.length} Posted</span>
                  </div>
                </div>

                <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Eligible students</span>
                    <span className="text-lg font-black text-slate-800 block mt-0.5">Sem 8 Cohorts</span>
                  </div>
                </div>

                <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <Award className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Company Approval</span>
                    <span className="text-lg font-black text-emerald-600 block mt-0.5">{company?.approved ? "Approved" : "Pending"}</span>
                  </div>
                </div>
              </div>

              {/* Layout splits: Jobs and Analytics */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Active postings list */}
                <div className="lg:col-span-2 bg-white border border-slate-100 p-6 rounded-2xl shadow-sm space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-50 pb-3">
                    <h3 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
                      <Briefcase className="w-4.5 h-4.5 text-blue-500" />
                      <span>Your Posted Drives</span>
                    </h3>
                  </div>

                  {recruiterJobs.length === 0 ? (
                    <div className="text-center py-10 text-slate-400 text-xs">
                      No jobs posted yet. Use the "Post Job Drive" tab.
                    </div>
                  ) : (
                    <div className="space-y-3.5">
                      {recruiterJobs.map(job => (
                        <div 
                          key={job._id}
                          className="p-4 bg-slate-50/50 border border-slate-100 rounded-xl flex items-center justify-between text-xs hover:border-slate-200 transition-colors"
                        >
                          <div className="space-y-1">
                            <h4 className="font-bold text-slate-850">{job.title}</h4>
                            <p className="text-[10px] text-slate-450">CTC: {job.package} LPA · Loc: {job.location || "On-Site"} · Min CGPA: {job.eligibility?.cgpa}</p>
                          </div>
                          <button
                            onClick={() => { setSelectedJobId(job._id); setActiveTab("pipeline"); }}
                            className="px-4 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-lg font-bold shadow-sm cursor-pointer"
                          >
                            Pipeline
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Applications per Job Posting SVG graph mock */}
                <div className="lg:col-span-1 bg-white border border-slate-100 p-6 rounded-2xl shadow-sm space-y-4">
                  <h3 className="text-xs font-bold text-slate-450 uppercase tracking-widest">Recruiting Metrics</h3>
                  <div className="pt-2 flex flex-col justify-center items-center text-center space-y-3">
                    <div className="relative w-28 h-28 flex items-center justify-center">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle cx="56" cy="56" r="48" fill="transparent" stroke="#F1F5F9" strokeWidth="8" />
                        <circle cx="56" cy="56" r="48" fill="transparent" stroke="#3B82F6" strokeWidth="8" strokeDasharray="301.6" strokeDashoffset="75" strokeLinecap="round" />
                      </svg>
                      <div className="absolute text-center">
                        <span className="text-xl font-black text-slate-800">75%</span>
                        <span className="text-slate-400 text-[8px] block font-bold">SUCCESS</span>
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-400 leading-normal">Overall shortlisted candidate ratio relative to total drive registries.</p>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* ---------------- ACTIVE TAB: POST JOB DRIVE ---------------- */}
          {activeTab === "create-job" && (
            <form onSubmit={handlePostJob} className="bg-white border border-slate-100 p-8 rounded-2xl shadow-sm max-w-3xl mx-auto space-y-6">
              <h3 className="text-sm font-bold text-slate-805 flex items-center space-x-2 border-b border-slate-50 pb-4">
                <Plus className="w-5 h-5 text-blue-500" />
                <span>Configure New Job Recruitment Drive</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Job Role Title</label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. Associate Software Engineer"
                    className="w-full bg-white border border-slate-200 text-slate-800 rounded-lg px-3.5 py-2.5 text-xs focus:outline-none focus:border-blue-500"
                    disabled={actionLoading}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Salary CTC Package (LPA)</label>
                  <input
                    type="number"
                    value={newPackage}
                    onChange={(e) => setNewPackage(e.target.value)}
                    placeholder="e.g. 12"
                    className="w-full bg-white border border-slate-200 text-slate-800 rounded-lg px-3.5 py-2.5 text-xs focus:outline-none focus:border-blue-500"
                    disabled={actionLoading}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Job Location</label>
                  <input
                    type="text"
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    placeholder="e.g. Bangalore / Remote"
                    className="w-full bg-white border border-slate-200 text-slate-800 rounded-lg px-3.5 py-2.5 text-xs focus:outline-none focus:border-blue-500"
                    disabled={actionLoading}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Cutoff CGPA Requirement</label>
                  <input
                    type="text"
                    value={newCgpa}
                    onChange={(e) => setNewCgpa(e.target.value)}
                    placeholder="e.g. 7.5"
                    className="w-full bg-white border border-slate-200 text-slate-800 rounded-lg px-3.5 py-2.5 text-xs focus:outline-none focus:border-blue-500"
                    disabled={actionLoading}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Application Deadline</label>
                  <input
                    type="date"
                    value={newDeadline}
                    onChange={(e) => setNewDeadline(e.target.value)}
                    className="w-full bg-white border border-slate-200 text-slate-800 rounded-lg px-3.5 py-2.5 text-xs focus:outline-none focus:border-blue-500 cursor-pointer"
                    disabled={actionLoading}
                    required
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Job Description & Skills Requirements</label>
                <textarea
                  rows="5"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Elaborate key roles, tech stack requirements, and test patterns..."
                  className="w-full bg-white border border-slate-200 text-slate-800 rounded-lg px-3.5 py-2.5 text-xs focus:outline-none focus:border-blue-500 resize-none"
                  disabled={actionLoading}
                  required
                />
              </div>

              <div className="pt-4 border-t border-slate-50 flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-xs transition-colors shadow-sm cursor-pointer disabled:opacity-50"
                  disabled={actionLoading}
                >
                  {actionLoading ? "Registering Drive..." : "Post Recruitment Drive"}
                </button>
              </div>
            </form>
          )}

          {/* ---------------- ACTIVE TAB: APPLICATIONS PIPELINE ---------------- */}
          {activeTab === "pipeline" && (
            <div className="space-y-6">
              
              {/* Job Selector banner */}
              <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-800">Applications Pipeline</h2>
                  <p className="text-xs text-slate-400 mt-1">Review student profiles, download CV files, schedule interviews, and upload selections.</p>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Active Job:</span>
                  <select
                    value={selectedJobId}
                    onChange={(e) => setSelectedJobId(e.target.value)}
                    className="bg-slate-50 border border-slate-100 text-slate-700 rounded-lg px-3.5 py-2 text-xs focus:outline-none cursor-pointer"
                  >
                    {recruiterJobs.map(job => (
                      <option key={job._id} value={job._id}>{job.title}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Applicants list */}
              {loadingApplicants ? (
                <div className="flex justify-center py-20">
                  <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
                </div>
              ) : applicants.length === 0 ? (
                <div className="bg-white border border-slate-100 p-16 rounded-2xl text-center">
                  <FileText className="w-12 h-12 text-slate-350 mx-auto mb-4" />
                  <h3 className="text-sm font-bold text-slate-800">No applicants registered</h3>
                  <p className="text-xs text-slate-400 mt-1">Students will appear once they register for this drive.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {applicants.map(app => {
                    const student = app.studentId;
                    return (
                      <div 
                        key={app._id}
                        className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:shadow-md transition-shadow relative overflow-hidden"
                      >
                        <span className={`absolute left-0 top-0 w-1.5 h-full ${
                          app.status === "Selected" ? "bg-emerald-500" : app.status === "Rejected" ? "bg-rose-500" : "bg-blue-500"
                        }`} />

                        <div className="space-y-2 min-w-0">
                          <div className="flex items-center space-x-2">
                            <h4 className="text-xs font-bold text-slate-800">{student?.name}</h4>
                            <span className="text-[9px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                              {student?.branch} · Sem 8
                            </span>
                            <span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                              CGPA: {student?.cgpa}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-450 truncate">Email: {student?.email} · Phone: {student?.phone || "N/A"}</p>
                          <div className="flex flex-wrap gap-1 text-[9px] text-slate-550">
                            {student?.skills?.map(skill => (
                              <span key={skill} className="bg-slate-50 border border-slate-150 px-2 py-0.5 rounded">{skill}</span>
                            ))}
                          </div>
                        </div>

                        {/* Pipeline actions */}
                        <div className="flex flex-wrap items-center gap-2.5 shrink-0 pt-2 md:pt-0">
                          {student?.resumeUrl && (
                            <a 
                              href={student.resumeUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="p-2 hover:bg-slate-50 border border-slate-100 rounded-lg text-slate-650 hover:text-slate-800 cursor-pointer transition-colors"
                              title="Preview resume"
                            >
                              <Eye className="w-4 h-4" />
                            </a>
                          )}

                          {/* Stepper updates */}
                          {app.status === "Applied" && (
                            <button
                              onClick={() => handleStatusChange(app._id, "Shortlisted")}
                              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-550 text-white rounded-lg text-[10px] font-semibold cursor-pointer shadow-sm shadow-blue-500/5"
                            >
                              Shortlist
                            </button>
                          )}

                          {app.status === "Shortlisted" && (
                            <>
                              <button
                                onClick={() => setSchedulingAppId(app._id)}
                                className="px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-150 text-indigo-600 rounded-lg text-[10px] font-bold cursor-pointer"
                              >
                                Slot Interview
                              </button>
                              <button
                                onClick={() => setUploadingAppId(app._id)}
                                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-550 text-white rounded-lg text-[10px] font-semibold cursor-pointer shadow-sm shadow-emerald-500/5"
                              >
                                Mark Selected
                              </button>
                              <button
                                onClick={() => handleStatusChange(app._id, "Rejected")}
                                className="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-150 text-rose-600 rounded-lg text-[10px] font-bold cursor-pointer"
                              >
                                Reject
                              </button>
                            </>
                          )}

                          {app.status === "Selected" && (
                            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-lg">
                              Selected {app.offerLetterUrl && "· Offer Letter sent"}
                            </span>
                          )}

                          {app.status === "Rejected" && (
                            <span className="text-[10px] font-bold text-rose-600 bg-rose-50 border border-rose-100 px-3 py-1 rounded-lg">
                              Rejected
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ---------------- ACTIVE TAB: CHAT INBOX ---------------- */}
          {activeTab === "chat" && (
            <div className="space-y-4">
              <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm">
                <h2 className="text-lg font-bold text-slate-800">Recruiter Chat Channel</h2>
                <p className="text-xs text-slate-400 mt-1">Converse directly with students and placement coordinators.</p>
              </div>

              <ChatPanel />
            </div>
          )}
        </main>
      </div>

      {/* MODAL: INTERVIEW SCHEDULER */}
      {schedulingAppId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fade-in">
          <form 
            onSubmit={handleScheduleInterview}
            className="bg-white border border-slate-150 w-full max-w-md rounded-2xl shadow-2xl p-6 space-y-4"
          >
            <div className="flex justify-between items-center border-b border-slate-50 pb-3">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest">Schedule Interview slot</h3>
              <button 
                type="button"
                onClick={() => setSchedulingAppId(null)}
                className="p-1 hover:bg-slate-50 rounded cursor-pointer"
              >
                <X className="w-4.5 h-4.5 text-slate-405" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Round Title</label>
                <input
                  type="text"
                  value={roundName}
                  onChange={(e) => setRoundName(e.target.value)}
                  className="w-full bg-white border border-slate-200 text-slate-800 rounded-lg px-3 py-2.5"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Date & Time Slot</label>
                <input
                  type="datetime-local"
                  value={roundDate}
                  onChange={(e) => setRoundDate(e.target.value)}
                  className="w-full bg-white border border-slate-200 text-slate-850 rounded-lg px-3 py-2.5 cursor-pointer"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Meeting Notes / Invites Links</label>
                <textarea
                  rows="3"
                  value={roundNotes}
                  onChange={(e) => setRoundNotes(e.target.value)}
                  placeholder="e.g. Online via Zoom. Prepare your projects slides..."
                  className="w-full bg-white border border-slate-200 text-slate-800 rounded-lg px-3 py-2.5 resize-none"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setSchedulingAppId(null)}
                className="px-4 py-2 border border-slate-250 text-slate-600 rounded-lg font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold shadow"
              >
                Schedule & Dispatch Invite
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: OFFER LETTER UPLOADER */}
      {uploadingAppId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fade-in">
          <form 
            onSubmit={handleUploadOfferLetter}
            className="bg-white border border-slate-150 w-full max-w-md rounded-2xl shadow-2xl p-6 space-y-4"
          >
            <div className="flex justify-between items-center border-b border-slate-50 pb-3">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest">Provide Candidate Offer Letter</h3>
              <button 
                type="button"
                onClick={() => setUploadingAppId(null)}
                className="p-1 hover:bg-slate-50 rounded cursor-pointer"
              >
                <X className="w-4.5 h-4.5 text-slate-405" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-slate-500 leading-normal">Please input the offer letter details below. This will mark the candidate status as Selected.</p>
              
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Offer Letter PDF URL / Cloud Storage Link</label>
                <input
                  type="text"
                  value={offerLetterUrlInput}
                  onChange={(e) => setOfferLetterUrlInput(e.target.value)}
                  placeholder="e.g. https://storage.geeta.edu/offer-letter.pdf"
                  className="w-full bg-white border border-slate-200 text-slate-850 rounded-lg px-3 py-2.5"
                  required
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setUploadingAppId(null)}
                className="px-4 py-2 border border-slate-250 text-slate-650 rounded-lg font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-555 text-white rounded-lg font-bold shadow"
              >
                Confirm Placement Selection
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};

export default RecruiterDashboard;
