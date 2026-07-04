import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { 
  Building2, Briefcase, FileText, User, MessageSquare, Plus, Bell, Search, 
  Trash2, X, Lock, Check, AlertTriangle, AlertCircle, ExternalLink, ArrowRight, 
  ArrowUpRight, Award, Compass, Key, Settings, HelpCircle, Download, Eye, 
  Clock, RefreshCw, BarChart2, CheckSquare, Upload, Calendar, CheckCircle2,
  Users, Shield, Server, Activity, Database, LogOut
} from "lucide-react";
import api from "../utils/api";
import { logoutState } from "../store/authSlice";
import ChatPanel from "./ChatPanel";

export const AdminDashboard = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  // Navigation states
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");

  // Core data list
  const [companies, setCompanies] = useState([]);
  const [students, setStudents] = useState([]);
  const [loadingData, setLoadingData] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Status message
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Audit Logs simulated
  const [auditLogs, setAuditLogs] = useState([
    { event: "Recruiter Registration", detail: "Registered company 'TCS' pending approval", time: "5 mins ago", status: "Warning" },
    { event: "Database Backup", detail: "Automated daily mongodump backup completed", time: "1 hour ago", status: "Success" },
    { event: "SMTP Verification", detail: "E-mail connection checked successfully", time: "3 hours ago", status: "Success" },
    { event: "Admin Login", detail: "Session token initialized successfully", time: "6 hours ago", status: "Success" }
  ]);

  const clearMessages = () => {
    setErrorMsg("");
    setSuccessMsg("");
  };

  const loadData = async () => {
    setLoadingData(true);
    try {
      const resCompanies = await api.get("/admin/companies");
      setCompanies(resCompanies.data.companies || []);

      const resStudents = await api.get("/admin/students");
      setStudents(resStudents.data.students || []);
    } catch (err) {
      console.error(err);
      setErrorMsg("Failed to fetch admin system records");
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Approve recruiter/company
  const handleApproveCompany = async (companyId) => {
    setActionLoading(true);
    clearMessages();
    try {
      await api.post("/admin/companies/approve", { companyId });
      setSuccessMsg("Recruiter company profile approved, invitation email sent!");
      loadData();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Failed to approve company");
    } finally {
      setActionLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (err) {
      console.warn("Logout failed", err);
    } finally {
      dispatch(logoutState());
    }
  };

  // Stats calculation
  const pendingCompanies = companies.filter(c => !c.approved);
  const activeRecruiters = companies.filter(c => c.approved).length;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 font-sans flex overflow-hidden">
      
      {/* Left Sidebar */}
      <aside className={`bg-white border-r border-slate-100 flex flex-col justify-between transition-all duration-300 z-30 ${sidebarCollapsed ? "w-16" : "w-64"}`}>
        <div className="flex-1 flex flex-col overflow-y-auto">
          {/* Header */}
          <div className="h-16 border-b border-slate-50 flex items-center justify-between px-4 shrink-0">
            {!sidebarCollapsed && (
              <span className="text-sm font-extrabold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent uppercase">
                Admin Console
              </span>
            )}
            {sidebarCollapsed && (
              <span className="text-sm font-extrabold text-blue-600 mx-auto">AC</span>
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
              {!sidebarCollapsed && <span>System Overview</span>}
            </button>
            
            <button
              onClick={() => setActiveTab("approvals")}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all border ${
                activeTab === "approvals" ? "bg-blue-50/50 text-blue-600 border-blue-100/50 font-bold" : "text-slate-500 hover:bg-slate-50 border-transparent"
              }`}
            >
              <Shield className="w-4.5 h-4.5 shrink-0 text-slate-400" />
              {!sidebarCollapsed && (
                <span className="flex-1 flex items-center justify-between">
                  <span>Approve Companies</span>
                  {pendingCompanies.length > 0 && (
                    <span className="bg-blue-600 text-white text-[9px] px-2 py-0.5 rounded-full font-extrabold ml-auto">
                      {pendingCompanies.length}
                    </span>
                  )}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab("users")}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all border ${
                activeTab === "users" ? "bg-blue-50/50 text-blue-600 border-blue-100/50 font-bold" : "text-slate-500 hover:bg-slate-50 border-transparent"
              }`}
            >
              <Users className="w-4.5 h-4.5 shrink-0 text-slate-400" />
              {!sidebarCollapsed && <span>System Users</span>}
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
                A
              </div>
              <div className="truncate max-w-[120px]">
                <p className="text-xs font-bold text-slate-800 truncate">{user?.name}</p>
                <p className="text-[10px] text-slate-400 truncate">System Root</p>
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

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-y-auto animate-fade-in">
        {/* Top Navbar */}
        <header className="h-16 bg-white/80 backdrop-blur-md sticky top-0 z-20 border-b border-slate-100 flex items-center justify-between px-8 shrink-0">
          <div>
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">SysAdmin Console</h2>
            <h1 className="text-sm font-extrabold text-slate-805 mt-0.5">Root Administration Workspace</h1>
          </div>

          <div className="flex items-center space-x-4">
            <div className="text-right hidden md:block">
              <p className="text-xs font-bold text-slate-808">{user?.name}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">{user?.email}</p>
            </div>
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 p-0.5 shadow-sm">
              <div className="w-full h-full rounded-full bg-white flex items-center justify-center font-extrabold text-blue-600 text-sm">
                A
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
                <p className="text-rose-606/80 mt-0.5">{errorMsg}</p>
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
                <p className="text-emerald-606/80 mt-0.5">{successMsg}</p>
              </div>
              <button onClick={clearMessages} className="text-emerald-450 hover:text-emerald-650 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* ---------------- ACTIVE TAB: SYSTEM OVERVIEW ---------------- */}
          {activeTab === "dashboard" && (
            <div className="space-y-6">
              
              {/* Server health check banner */}
              <div className="bg-white border border-slate-100 p-6 md:p-8 rounded-2xl shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full uppercase tracking-wider">System Status Diagnostics</span>
                  <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">Root Admin Console</h2>
                  <p className="text-xs text-slate-400 max-w-md leading-relaxed">
                    Verify database connections, approve registered companies, audit user details, and monitor system diagnostics.
                  </p>
                </div>
                
                <div className="flex items-center space-x-4 shrink-0 bg-slate-50 border border-slate-100 p-4 rounded-xl">
                  <Server className="w-10 h-10 text-emerald-500 shrink-0" />
                  <div>
                    <span className="text-[9px] text-slate-400 block font-bold uppercase tracking-wider">Database Link Status</span>
                    <span className="text-sm font-bold text-emerald-600 block">Connected / Healthy</span>
                  </div>
                </div>
              </div>

              {/* Stats card */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Total Students</span>
                    <span className="text-lg font-black text-slate-850 block mt-0.5">{students.length} Profiles</span>
                  </div>
                </div>

                <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Approved Companies</span>
                    <span className="text-lg font-black text-slate-850 block mt-0.5">{activeRecruiters} Active</span>
                  </div>
                </div>

                <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Pending Approvals</span>
                    <span className="text-lg font-black text-rose-600 block mt-0.5">{pendingCompanies.length} Requests</span>
                  </div>
                </div>
              </div>

              {/* Split layout: Audit Logs and System Health */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Audit Logs list */}
                <div className="lg:col-span-2 bg-white border border-slate-100 p-6 rounded-2xl shadow-sm space-y-4">
                  <h3 className="text-sm font-bold text-slate-800 border-b border-slate-50 pb-3 flex items-center space-x-2">
                    <Activity className="w-4.5 h-4.5 text-blue-500" />
                    <span>Real-time Audit logs</span>
                  </h3>
                  
                  <div className="space-y-3.5">
                    {auditLogs.map((log, index) => (
                      <div key={index} className="p-3 bg-slate-50/50 border border-slate-100 rounded-xl flex justify-between items-center text-xs">
                        <div className="space-y-0.5">
                          <h4 className="font-bold text-slate-800">{log.event}</h4>
                          <p className="text-[10px] text-slate-450">{log.detail}</p>
                        </div>
                        <span className="text-[9px] text-slate-400 font-semibold">{log.time}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* System Diagnostics Metrics */}
                <div className="lg:col-span-1 bg-white border border-slate-100 p-6 rounded-2xl shadow-sm space-y-4">
                  <h3 className="text-xs font-bold text-slate-450 uppercase tracking-widest flex items-center space-x-1.5">
                    <Database className="w-4 h-4 text-blue-500" />
                    <span>DB Size Diagnostics</span>
                  </h3>

                  <div className="space-y-4 text-xs">
                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-[10px] font-bold text-slate-400">
                        <span>Cluster Allocation Usage</span>
                        <span>0.4 MB / 512 MB</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-600 rounded-full w-[2%]" />
                      </div>
                    </div>
                    
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-[10px] text-slate-500 leading-normal">
                      Database status checks confirm Mongo Atlas connectivity latency is 14ms. Automatic backups are enabled.
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* ---------------- ACTIVE TAB: APPROVE COMPANIES ---------------- */}
          {activeTab === "approvals" && (
            <div className="space-y-6">
              <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm">
                <h2 className="text-lg font-bold text-slate-800">Recruiter Profile Approvals</h2>
                <p className="text-xs text-slate-400 mt-1">Review recruiter credentials, business details, and verify company accounts.</p>
              </div>

              {loadingData ? (
                <div className="flex justify-center py-20">
                  <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
                </div>
              ) : pendingCompanies.length === 0 ? (
                <div className="bg-white border border-slate-100 p-16 rounded-2xl text-center">
                  <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
                  <h3 className="text-sm font-bold text-slate-800">All recruiter requests approved</h3>
                  <p className="text-xs text-slate-400 mt-1">No pending company profiles require administrator audits.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingCompanies.map(company => (
                    <div 
                      key={company._id}
                      className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:shadow-md transition-shadow relative overflow-hidden"
                    >
                      <span className="absolute left-0 top-0 w-1.5 h-full bg-amber-500" />
                      
                      <div className="space-y-1">
                        <h4 className="text-xs font-bold text-slate-850">{company.name}</h4>
                        <p className="text-[10px] text-slate-400">Recruiter: {company.recruiterId?.name} · Email: {company.recruiterId?.email}</p>
                        <p className="text-[10px] text-slate-450 italic">"{company.description || "Corporate recruiting team"}"</p>
                      </div>

                      <button
                        onClick={() => handleApproveCompany(company._id)}
                        disabled={actionLoading}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-[10px] font-bold cursor-pointer disabled:opacity-50 shadow-sm"
                      >
                        {actionLoading ? "Processing..." : "Approve Company"}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ---------------- ACTIVE TAB: SYSTEM USERS ---------------- */}
          {activeTab === "users" && (
            <div className="space-y-6">
              <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm">
                <h2 className="text-lg font-bold text-slate-800">System Users Directory</h2>
                <p className="text-xs text-slate-400 mt-1">Audit register profiles, de-activate accounts, and verify login times.</p>
              </div>

              {loadingData ? (
                <div className="flex justify-center py-20">
                  <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
                </div>
              ) : (
                <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left text-xs text-slate-600">
                      <thead className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        <tr>
                          <th className="px-6 py-4">User Name</th>
                          <th className="px-6 py-4">Role</th>
                          <th className="px-6 py-4">Account Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {students.map(s => (
                          <tr key={s._id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-4 font-bold text-slate-800">{s.name}</td>
                            <td className="px-6 py-4">Student</td>
                            <td className="px-6 py-4">
                              <span className="inline-flex items-center space-x-1 text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-bold">
                                <span>Active</span>
                              </span>
                            </td>
                          </tr>
                        ))}
                        {companies.map(c => (
                          <tr key={c._id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-4 font-bold text-slate-800">{c.recruiterId?.name || "Pending Recruiter"}</td>
                            <td className="px-6 py-4">Recruiter ({c.name})</td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center space-x-1 text-[10px] px-2 py-0.5 rounded-full font-bold ${
                                c.approved ? "text-emerald-600 bg-emerald-50" : "text-amber-600 bg-amber-50"
                              }`}>
                                <span>{c.approved ? "Active" : "Pending"}</span>
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ---------------- ACTIVE TAB: CHAT INBOX ---------------- */}
          {activeTab === "chat" && (
            <div className="space-y-4">
              <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm">
                <h2 className="text-lg font-bold text-slate-800">SysAdmin Chat Inbox</h2>
                <p className="text-xs text-slate-400 mt-1">Direct system-wide conversation logs with all users.</p>
              </div>

              <ChatPanel />
            </div>
          )}
        </main>
      </div>

    </div>
  );
};

export default AdminDashboard;
