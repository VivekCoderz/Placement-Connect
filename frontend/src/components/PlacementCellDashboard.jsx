import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { 
  Building2, Briefcase, FileText, User, MessageSquare, Plus, Bell, Search, 
  Trash2, X, Lock, Check, AlertTriangle, AlertCircle, ExternalLink, ArrowRight, 
  ArrowUpRight, Award, Compass, Key, Settings, HelpCircle, Download, Eye, 
  Clock, RefreshCw, BarChart2, CheckSquare, Upload, Calendar, CheckCircle2,
  Users, TrendingUp, BarChart3, Database, LogOut
} from "lucide-react";
import api from "../utils/api";
import { logoutState } from "../store/authSlice";
import ChatPanel from "./ChatPanel";

export const PlacementCellDashboard = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  // Navigation states
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");

  // Core records lists
  const [students, setStudents] = useState([]);
  const [drives, setDrives] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loadingData, setLoadingData] = useState(false);
  
  // CSV Shortlist upload state
  const [shortlistFile, setShortlistFile] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const clearMessages = () => {
    setErrorMsg("");
    setSuccessMsg("");
  };

  const loadData = async () => {
    setLoadingData(true);
    try {
      // 1. Fetch Students
      const resStudents = await api.get("/admin/students");
      setStudents(resStudents.data.students || []);

      // 2. Fetch Drives
      const resDrives = await api.get("/placement/drives");
      setDrives(resDrives.data.drives || []);

      // 3. Fetch Applications
      const resApps = await api.get("/placement/applications");
      setApplications(resApps.data.applications || []);
    } catch (err) {
      console.error(err);
      setErrorMsg("Failed to load Placement Cell records");
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Upload Shortlist CSV handler
  const handleUploadCSV = async (e) => {
    e.preventDefault();
    if (!shortlistFile) {
      setErrorMsg("Please select a shortlist CSV file");
      return;
    }
    setActionLoading(true);
    clearMessages();

    const formData = new FormData();
    formData.append("file", shortlistFile);

    try {
      const res = await api.post("/placement/shortlist/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setSuccessMsg(res.data.message || "CSV Shortlist uploaded and students notified successfully!");
      setShortlistFile(null);
      loadData();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Failed to process shortlist CSV");
    } finally {
      setActionLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (err) {
      console.warn("Logout request failed", err);
    } finally {
      dispatch(logoutState());
    }
  };

  // Stats
  const placedCount = students.filter(s => s.isPlaced).length;
  const placementRatio = students.length > 0 ? Math.round((placedCount / students.length) * 100) : 0;
  const averagePackage = drives.length > 0 
    ? Math.round(drives.reduce((sum, d) => sum + Number(d.package), 0) / drives.length) 
    : 0;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 font-sans flex overflow-hidden">
      
      {/* Sidebar */}
      <aside className={`bg-white border-r border-slate-100 flex flex-col justify-between transition-all duration-300 z-30 ${sidebarCollapsed ? "w-16" : "w-64"}`}>
        <div className="flex-1 flex flex-col overflow-y-auto">
          {/* Sidebar Header */}
          <div className="h-16 border-b border-slate-50 flex items-center justify-between px-4 shrink-0">
            {!sidebarCollapsed && (
              <span className="text-sm font-extrabold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent uppercase">
                Placement Cell
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
              onClick={() => setActiveTab("students")}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all border ${
                activeTab === "students" ? "bg-blue-50/50 text-blue-600 border-blue-100/50 font-bold" : "text-slate-500 hover:bg-slate-50 border-transparent"
              }`}
            >
              <Users className="w-4.5 h-4.5 shrink-0 text-slate-400" />
              {!sidebarCollapsed && <span>Manage Students</span>}
            </button>

            <button
              onClick={() => setActiveTab("drives")}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all border ${
                activeTab === "drives" ? "bg-blue-50/50 text-blue-600 border-blue-100/50 font-bold" : "text-slate-500 hover:bg-slate-50 border-transparent"
              }`}
            >
              <Briefcase className="w-4.5 h-4.5 shrink-0 text-slate-400" />
              {!sidebarCollapsed && <span>Placement Drives</span>}
            </button>

            <button
              onClick={() => setActiveTab("csv-shortlist")}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all border ${
                activeTab === "csv-shortlist" ? "bg-blue-50/50 text-blue-600 border-blue-100/50 font-bold" : "text-slate-500 hover:bg-slate-50 border-transparent"
              }`}
            >
              <Upload className="w-4.5 h-4.5 shrink-0 text-slate-400" />
              {!sidebarCollapsed && <span>CSV Shortlists</span>}
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

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-50 flex items-center justify-between shrink-0">
          {!sidebarCollapsed && (
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-650 text-xs">
                U
              </div>
              <div className="truncate max-w-[120px]">
                <p className="text-xs font-bold text-slate-800 truncate">{user?.name}</p>
                <p className="text-[10px] text-slate-400 truncate">Officer</p>
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
        {/* Navbar */}
        <header className="h-16 bg-white/80 backdrop-blur-md sticky top-0 z-20 border-b border-slate-100 flex items-center justify-between px-8 shrink-0">
          <div>
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Coordinator Panel</h2>
            <h1 className="text-sm font-extrabold text-slate-800 mt-0.5">Placement Cell Workspace</h1>
          </div>

          <div className="flex items-center space-x-4">
            <div className="text-right hidden md:block">
              <p className="text-xs font-bold text-slate-800">{user?.name}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">{user?.email}</p>
            </div>
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 p-0.5 shadow-sm">
              <div className="w-full h-full rounded-full bg-white flex items-center justify-center font-extrabold text-blue-600 text-sm">
                U
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
              <button onClick={clearMessages} className="text-emerald-450 hover:text-emerald-650 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* ---------------- ACTIVE TAB: DASHBOARD OVERVIEW ---------------- */}
          {activeTab === "dashboard" && (
            <div className="space-y-6">
              
              {/* Placement ratios widget */}
              <div className="bg-white border border-slate-100 p-6 md:p-8 rounded-2xl shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full uppercase tracking-wider">Placement Audit Overview</span>
                  <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">Geeta University Placements</h2>
                  <p className="text-xs text-slate-400 max-w-md leading-relaxed">
                    Audit active drives, upload CSV shortlisted metrics, and monitor student select/reject records.
                  </p>
                </div>
                
                <div className="flex items-center space-x-4 shrink-0 bg-slate-50 border border-slate-100 p-4 rounded-xl">
                  <TrendingUp className="w-10 h-10 text-emerald-550 shrink-0" />
                  <div>
                    <span className="text-[9px] text-slate-400 block font-bold uppercase tracking-wider">Overall Placed Ratio</span>
                    <span className="text-xl font-black text-slate-800">{placementRatio}% Placed</span>
                  </div>
                </div>
              </div>

              {/* Stats cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Total Students</span>
                    <span className="text-lg font-black text-slate-800 block mt-0.5">{students.length} Registered</span>
                  </div>
                </div>

                <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <Briefcase className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Active Drives</span>
                    <span className="text-lg font-black text-slate-800 block mt-0.5">{drives.length} Postings</span>
                  </div>
                </div>

                <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Average CTC Package</span>
                    <span className="text-lg font-black text-emerald-600 block mt-0.5">{averagePackage} LPA</span>
                  </div>
                </div>
              </div>

              {/* Splitted panels: Active drives and branch statistics */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Drives snippet list */}
                <div className="lg:col-span-2 bg-white border border-slate-100 p-6 rounded-2xl shadow-sm space-y-4">
                  <h3 className="text-sm font-bold text-slate-800 border-b border-slate-50 pb-3">Active Campus Recruitment Jobs</h3>
                  <div className="space-y-3">
                    {drives.slice(0, 3).map(drive => (
                      <div key={drive._id} className="p-4 bg-slate-50/50 border border-slate-100 rounded-xl flex justify-between items-center text-xs">
                        <div className="space-y-1">
                          <h4 className="font-bold text-slate-850">{drive.title}</h4>
                          <p className="text-[10px] text-slate-400">CTC: {drive.package} LPA · Min: {drive.eligibility?.cgpa} CGPA · Deadline: {new Date(drive.deadline).toLocaleDateString()}</p>
                        </div>
                        <button
                          onClick={() => setActiveTab("drives")}
                          className="px-3.5 py-1.5 bg-white border border-slate-200 text-slate-700 font-bold rounded-lg"
                        >
                          Details
                        </button>
                      </div>
                    ))}
                    {drives.length === 0 && (
                      <p className="text-center py-6 text-slate-400 text-xs">No active placement drives found.</p>
                    )}
                  </div>
                </div>

                {/* Placement Ratio chart */}
                <div className="lg:col-span-1 bg-white border border-slate-100 p-6 rounded-2xl shadow-sm space-y-4">
                  <h3 className="text-xs font-bold text-slate-450 uppercase tracking-widest">Branch breakdown</h3>
                  
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between items-center text-[9px] font-bold text-slate-400 uppercase mb-1">
                        <span>CSE / IT</span>
                        <span className="text-blue-600">{placementRatio}% Placed</span>
                      </div>
                      <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-600 rounded-full" style={{ width: `${placementRatio}%` }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center text-[9px] font-bold text-slate-400 uppercase mb-1">
                        <span>ECE / EE</span>
                        <span className="text-indigo-500">45% Placed</span>
                      </div>
                      <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500 rounded-full w-[45%]" />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center text-[9px] font-bold text-slate-400 uppercase mb-1">
                        <span>ME / CE</span>
                        <span className="text-slate-500">30% Placed</span>
                      </div>
                      <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-slate-400 rounded-full w-[30%]" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* ---------------- ACTIVE TAB: MANAGE STUDENTS ---------------- */}
          {activeTab === "students" && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm">
                <h2 className="text-lg font-bold text-slate-800">Registered Students Directory</h2>
                <p className="text-xs text-slate-400 mt-1">Review active student database profiles, branch cohorts, and CGPA metrics.</p>
              </div>

              {loadingData ? (
                <div className="flex justify-center py-20">
                  <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
                </div>
              ) : students.length === 0 ? (
                <div className="bg-white border border-slate-100 p-16 rounded-2xl text-center">
                  <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-sm font-bold text-slate-800">No students registered yet</h3>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {students.map(student => (
                    <div 
                      key={student._id}
                      className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm flex flex-col justify-between space-y-4 hover:-translate-y-0.5 transition-all duration-300 relative overflow-hidden"
                    >
                      <span className={`absolute left-0 top-0 w-1.5 h-full ${
                        student.isPlaced ? "bg-emerald-500" : "bg-blue-500"
                      }`} />

                      <div className="space-y-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-xs font-bold text-slate-850 leading-tight">{student.name}</h3>
                            <span className="text-[10px] text-slate-400 block mt-0.5">Roll: {student.rollNumber}</span>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                            student.isPlaced ? "bg-emerald-50 text-emerald-650" : "bg-blue-50 text-blue-650"
                          }`}>
                            {student.isPlaced ? "Placed" : "Seeking"}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-3 bg-slate-50/50 p-3 rounded-xl border border-slate-100 text-[10px]">
                          <div>
                            <span className="text-slate-400 block uppercase font-bold text-[8px]">CGPA</span>
                            <span className="font-extrabold text-slate-700">{student.cgpa} / 10.0</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block uppercase font-bold text-[8px]">Branch / Year</span>
                            <span className="font-medium text-slate-700 truncate block">{student.branch} · {student.year}</span>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-1 text-[9px]">
                          {student.skills?.map(skill => (
                            <span key={skill} className="bg-slate-150 px-2 py-0.5 rounded text-slate-600 font-bold">{skill}</span>
                          ))}
                        </div>
                      </div>

                      {student.resumeUrl && (
                        <div className="pt-2 border-t border-slate-50 flex justify-end">
                          <a
                            href={student.resumeUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center space-x-1.5 text-[10px] font-bold text-blue-600 hover:underline cursor-pointer"
                          >
                            <span>Open Resume PDF</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ---------------- ACTIVE TAB: PLACEMENT DRIVES ---------------- */}
          {activeTab === "drives" && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm">
                <h2 className="text-lg font-bold text-slate-800">Job Recruitment Drives</h2>
                <p className="text-xs text-slate-400 mt-1">Review active and pending corporate recruitment registries.</p>
              </div>

              {loadingData ? (
                <div className="flex justify-center py-20">
                  <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
                </div>
              ) : drives.length === 0 ? (
                <div className="bg-white border border-slate-100 p-16 rounded-2xl text-center">
                  <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-sm font-bold text-slate-800">No job drives found</h3>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {drives.map(drive => (
                    <div 
                      key={drive._id}
                      className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm flex flex-col justify-between space-y-4 hover:shadow-md transition-shadow"
                    >
                      <div className="space-y-3.5">
                        <div className="flex items-start space-x-3.5">
                          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm shrink-0">
                            {drive.companyId?.name?.charAt(0)}
                          </div>
                          <div>
                            <h3 className="text-xs font-bold text-slate-800 leading-tight">{drive.title}</h3>
                            <span className="text-[10px] text-slate-400 block mt-0.5">{drive.companyId?.name}</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 bg-slate-50/50 p-3.5 rounded-xl border border-slate-100 text-xs">
                          <div>
                            <span className="text-[9px] text-slate-400 block font-semibold">Salary Package</span>
                            <span className="font-extrabold text-blue-600">{drive.package} LPA</span>
                          </div>
                          <div>
                            <span className="text-[9px] text-slate-400 block font-semibold">Job Location</span>
                            <span className="font-semibold text-slate-850 truncate block">{drive.location || "On-Site"}</span>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-1 text-[9px] text-slate-500">
                          <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200/50">CGPA: {drive.eligibility?.cgpa}</span>
                          <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200/50 truncate max-w-[150px]">
                            {drive.eligibility?.branches?.join(", ") || "All Branches"}
                          </span>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-50 flex justify-between items-center text-[10px]">
                        <span className="text-rose-500 font-bold flex items-center space-x-1">
                          <Calendar className="w-3 h-3" />
                          <span>Close: {new Date(drive.deadline).toLocaleDateString()}</span>
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ---------------- ACTIVE TAB: CSV SHORTLISTS ---------------- */}
          {activeTab === "csv-shortlist" && (
            <div className="bg-white border border-slate-100 p-8 rounded-2xl shadow-sm max-w-2xl mx-auto space-y-6">
              <div className="space-y-1 border-b border-slate-50 pb-4">
                <h3 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
                  <Upload className="w-5 h-5 text-blue-500" />
                  <span>Upload Shortlisted Candidate Sheet</span>
                </h3>
                <p className="text-xs text-slate-400 leading-normal">
                  Select and upload a CSV shortlist sheet. This automatically updates application timelines and notifications.
                </p>
              </div>

              <form onSubmit={handleUploadCSV} className="space-y-4">
                <div className="border-2 border-dashed border-slate-200 p-8 rounded-2xl flex flex-col items-center justify-center bg-slate-50/50 hover:border-blue-500/30 transition-all text-center">
                  <FileText className="w-12 h-12 text-slate-350 mb-3" />
                  <span className="text-xs font-bold text-slate-700 block">Select shortlist.csv file</span>
                  <span className="text-[10px] text-slate-400 mt-1 block">Expected columns: studentEmail, jobId, status</span>
                  
                  <input
                    type="file"
                    accept=".csv"
                    onChange={(e) => setShortlistFile(e.target.files[0])}
                    className="text-xs text-slate-600 mt-4 file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border file:border-slate-250 file:bg-white file:text-slate-700 file:cursor-pointer"
                    disabled={actionLoading}
                    required
                  />
                </div>

                <div className="pt-4 border-t border-slate-50 flex justify-end">
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-xs transition-colors shadow-sm cursor-pointer disabled:opacity-50"
                    disabled={actionLoading || !shortlistFile}
                  >
                    {actionLoading ? "Processing Sheet..." : "Upload & Notify Candidates"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ---------------- ACTIVE TAB: CHAT INBOX ---------------- */}
          {activeTab === "chat" && (
            <div className="space-y-4">
              <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm">
                <h2 className="text-lg font-bold text-slate-800">Coordinator Chat Channel</h2>
                <p className="text-xs text-slate-400 mt-1">Direct message channel with students, recruiters, and administrators.</p>
              </div>

              <ChatPanel />
            </div>
          )}
        </main>
      </div>

    </div>
  );
};

export default PlacementCellDashboard;
