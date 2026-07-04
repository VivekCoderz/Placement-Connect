import React from "react";
import { LogOut, User, GraduationCap, Building2, ShieldCheck, Mail, Calendar, Info, CheckCircle2, RefreshCw } from "lucide-react";
import { useSelector, useDispatch } from "react-redux";
import { logoutState } from "../store/authSlice";
import api from "../utils/api";
import StudentDashboard from "../components/StudentDashboard";
import RecruiterDashboard from "../components/RecruiterDashboard";
import PlacementCellDashboard from "../components/PlacementCellDashboard";
import AdminDashboard from "../components/AdminDashboard";

export const Dashboard = () => {
  const dispatch = useDispatch();
  const { user, details } = useSelector((state) => state.auth);

  if (user?.role === "student") {
    return <StudentDashboard />;
  }
  if (user?.role === "recruiter") {
    return <RecruiterDashboard />;
  }
  if (user?.role === "placementCell") {
    return <PlacementCellDashboard />;
  }
  if (user?.role === "admin") {
    return <AdminDashboard />;
  }

  const handleLogout = async () => {
    try {
      // Clear cookie session on backend
      await api.post("/auth/logout");
    } catch (err) {
      console.warn("Logout request failed on backend", err);
    } finally {
      // Clear Redux state
      dispatch(logoutState());
    }
  };

  // Determine greeting based on current local time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case "student":
        return (
          <span className="flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Student</span>
          </span>
        );
      case "recruiter":
        return (
          <span className="flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Building2 className="w-3.5 h-3.5" />
            <span>Recruiter</span>
          </span>
        );
      case "placementCell":
        return (
          <span className="flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Placement Cell Staff</span>
          </span>
        );
      case "admin":
        return (
          <span className="flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Administrator</span>
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0d1a] relative overflow-hidden font-sans pb-12">
      {/* Background glowing orbs */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600 rounded-full mix-blend-screen filter blur-[128px] opacity-25"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-600 rounded-full mix-blend-screen filter blur-[128px] opacity-20"></div>

      {/* Navigation Header */}
      <nav className="glass-panel sticky top-0 z-50 border-b border-white/5 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-extrabold text-lg shadow-md shadow-indigo-500/20">
            G
          </div>
          <div>
            <span className="font-extrabold text-base bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent tracking-tight block leading-none">
              PlacementConnect
            </span>
            <span className="text-[9px] text-indigo-400 tracking-wider font-semibold uppercase">
              Geeta University
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="hidden sm:flex flex-col text-right">
            <span className="text-sm font-semibold text-white">{user?.name}</span>
            <span className="text-[10px] text-slate-400">{user?.email}</span>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center space-x-1.5 px-4 py-2 bg-white/5 hover:bg-red-500/10 hover:text-red-200 text-slate-300 rounded-lg text-xs font-semibold border border-white/5 hover:border-red-500/20 transition-all duration-300 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>
        </div>
      </nav>

      {/* Main Dashboard Dashboard Content */}
      <main className="max-w-5xl mx-auto px-6 mt-10 relative z-10">
        {user?.role === "student" ? (
          <StudentDashboard />
        ) : (
          <div className="space-y-8 animate-fade-in">
            {/* Welcome Section */}
            <div className="glass-panel p-8 rounded-2xl border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                  {getGreeting()}, {user?.name}!
                </h1>
                <p className="text-slate-400 text-sm mt-1">
                  Welcome to your workspace dashboard. Here is a summary of your profile details.
                </p>
              </div>
              <div>{getRoleBadge(user?.role)}</div>
            </div>

            {/* Profile Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Main User Card (Left/Mid) */}
              <div className="md:col-span-2 glass-panel p-8 rounded-2xl border border-white/10 space-y-6">
                <h2 className="text-lg font-bold text-white flex items-center space-x-2 border-b border-white/5 pb-4">
                  <User className="w-5 h-5 text-indigo-400" />
                  <span>Academic & Profile Information</span>
                </h2>

                {/* If Recruiter details are present */}
                {user?.role === "recruiter" && details && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
                    <div className="space-y-1">
                      <span className="text-slate-400 text-xs uppercase font-semibold">Company Name</span>
                      <p className="text-white font-medium bg-white/5 px-3 py-2 rounded-lg border border-white/5">
                        {details.name}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-slate-400 text-xs uppercase font-semibold">Industry Vertical</span>
                      <p className="text-white font-medium bg-white/5 px-3 py-2 rounded-lg border border-white/5">
                        {details.industry || "Not Specified"}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-slate-400 text-xs uppercase font-semibold">Recruiter Email</span>
                      <p className="text-white font-medium bg-white/5 px-3 py-2 rounded-lg border border-white/5">
                        {details.recruiterEmail}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-slate-400 text-xs uppercase font-semibold">Verification Approval</span>
                      <p className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold px-3 py-2 rounded-lg">
                        Approved & Active
                      </p>
                    </div>
                  </div>
                )}

                {/* Admin or Staff who don't have separate profile collections yet */}
                {(user?.role === "placementCell" || user?.role === "admin") && (
                  <div className="space-y-6 text-sm">
                    <div className="flex items-center space-x-3 bg-indigo-500/5 border border-indigo-500/10 p-4 rounded-xl">
                      <Info className="w-5 h-5 text-indigo-400 shrink-0" />
                      <p className="text-xs text-indigo-200 leading-relaxed">
                        Staff and Administrators enjoy platform-wide access controls. You can review companies, audit drives, and upload result sheets once the backend administrative features are integrated.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-1">
                        <span className="text-slate-400 text-xs uppercase font-semibold">Admin Name</span>
                        <p className="text-white font-medium bg-white/5 px-3 py-2 rounded-lg border border-white/5">
                          {user?.name}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-slate-400 text-xs uppercase font-semibold">Contact Email</span>
                        <p className="text-white font-medium bg-white/5 px-3 py-2 rounded-lg border border-white/5">
                          {user?.email}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Center Checklist (Right) */}
              <div className="glass-panel p-8 rounded-2xl border border-white/10 space-y-6 flex flex-col justify-between">
                <div className="space-y-6">
                  <h2 className="text-lg font-bold text-white flex items-center space-x-2 border-b border-white/5 pb-4">
                    <CheckCircle2 className="w-5 h-5 text-purple-400" />
                    <span>Next Milestones</span>
                  </h2>

                  <ul className="space-y-4">
                    {user?.role === "recruiter" && (
                      <>
                        <li className="flex items-start space-x-2.5 text-xs text-slate-300">
                          <span className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-1.5 shrink-0" />
                          <span>Post fresh placement jobs & JD profiles</span>
                        </li>
                        <li className="flex items-start space-x-2.5 text-xs text-slate-300">
                          <span className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-1.5 shrink-0" />
                          <span>Audit applicants and upload shortlists</span>
                        </li>
                        <li className="flex items-start space-x-2.5 text-xs text-slate-300">
                          <span className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-1.5 shrink-0" />
                          <span>Mark final round selection results</span>
                        </li>
                      </>
                    )}
                    {(user?.role === "placementCell" || user?.role === "admin") && (
                      <>
                        <li className="flex items-start space-x-2.5 text-xs text-slate-300">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                          <span>Approve registering company accounts</span>
                        </li>
                        <li className="flex items-start space-x-2.5 text-xs text-slate-300">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                          <span>Inspect overall placement drives statistics</span>
                        </li>
                        <li className="flex items-start space-x-2.5 text-xs text-slate-300">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                          <span>Send stage updates to students</span>
                        </li>
                      </>
                    )}
                  </ul>
                </div>

                <div className="pt-6 border-t border-white/5 flex items-center justify-between text-xs text-slate-500">
                  <span className="flex items-center space-x-1">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>support@geeta.edu.in</span>
                  </span>
                </div>
              </div>

            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
