import React from "react";
import { ShieldCheck, GraduationCap, Building2, UserCheck } from "lucide-react";

export const AuthLayout = ({ children, title, subtitle }) => {
  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-[#0a0d1a] px-4 py-12 sm:px-6 lg:px-8 font-sans">
      {/* Background blobs for premium glowing orb effect */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600 rounded-full mix-blend-screen filter blur-[128px] opacity-30 animate-pulse duration-[8000ms]"></div>
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-purple-600 rounded-full mix-blend-screen filter blur-[128px] opacity-30 animate-pulse duration-[8000ms] delay-2000"></div>
      
      {/* Main glassmorphic wrapper */}
      <div className="relative w-full max-w-5xl glass-panel rounded-2xl shadow-2xl flex flex-col md:flex-row overflow-hidden border border-white/10">
        
        {/* Left Side Panel - Info / Brand Showcase */}
        <div className="w-full md:w-5/12 bg-gradient-to-br from-indigo-950/80 via-slate-950/90 to-purple-950/80 p-8 md:p-12 flex flex-col justify-between border-b md:border-b-0 md:border-r border-white/5 relative">
          {/* Subtle grid pattern overlay */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]"></div>
          
          <div className="relative z-10">
            {/* GU PlacementConnect Branding */}
            <div className="flex items-center space-x-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-extrabold text-xl shadow-lg shadow-indigo-500/30">
                G
              </div>
              <div>
                <span className="font-extrabold text-lg bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent tracking-tight block leading-none">
                  PlacementConnect
                </span>
                <span className="text-[10px] text-indigo-400 tracking-wider font-semibold uppercase">
                  Geeta University
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white leading-tight">
                {title || "Empowering Careers, Connecting Futures."}
              </h2>
              <p className="text-slate-400 text-sm leading-relaxed">
                {subtitle || "A unified portal connecting Geeta University students with top tier organizations for placement and career advancement."}
              </p>
            </div>
          </div>

          {/* Quick specs / benefits of the system */}
          <div className="relative z-10 mt-12 space-y-4 hidden md:block">
            <div className="flex items-start space-x-3 bg-white/5 p-3 rounded-lg border border-white/5 hover:border-indigo-500/20 transition-all duration-300">
              <GraduationCap className="w-5 h-5 text-indigo-400 mt-0.5 shrink-0" />
              <div>
                <h4 className="text-white text-xs font-semibold">Student Portfolio Space</h4>
                <p className="text-slate-400 text-[11px]">Display CGPA, resume, projects, and academic scores.</p>
              </div>
            </div>

            <div className="flex items-start space-x-3 bg-white/5 p-3 rounded-lg border border-white/5 hover:border-indigo-500/20 transition-all duration-300">
              <Building2 className="w-5 h-5 text-purple-400 mt-0.5 shrink-0" />
              <div>
                <h4 className="text-white text-xs font-semibold">Recruiter Portals</h4>
                <p className="text-slate-400 text-[11px]">Post job profiles, shortlist applicants, and roll offers.</p>
              </div>
            </div>

            <div className="flex items-start space-x-3 bg-white/5 p-3 rounded-lg border border-white/5 hover:border-indigo-500/20 transition-all duration-300">
              <ShieldCheck className="w-5 h-5 text-emerald-400 mt-0.5 shrink-0" />
              <div>
                <h4 className="text-white text-xs font-semibold">Placement Cell Control</h4>
                <p className="text-slate-400 text-[11px]">Audit company roles, monitor stats, and coordinate rounds.</p>
              </div>
            </div>
          </div>

          {/* Footer note */}
          <div className="relative z-10 mt-8 pt-6 border-t border-white/5 hidden md:block">
            <p className="text-[10px] text-slate-500">
              © {new Date().getFullYear()} Geeta University Training & Placement Cell.
            </p>
          </div>
        </div>

        {/* Right Side Panel - Render Active Form (Children) */}
        <div className="w-full md:w-7/12 p-8 md:p-12 bg-slate-900/40 flex flex-col justify-center">
          {children}
        </div>
        
      </div>
    </div>
  );
};

export default AuthLayout;
