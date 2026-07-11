import React from 'react';
import Navbar from './Navbar';

const Layout = ({ children }) => {
  return (
    <div className="relative min-h-screen bg-slate-50 flex flex-col overflow-x-hidden">
      {/* Background Decorative Glows - Soft Light Teal Accent Blurs */}
      <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[50%] rounded-full bg-teal-500/5 blur-[140px] pointer-events-none z-0" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[50%] rounded-full bg-teal-800/5 blur-[140px] pointer-events-none z-0" />
      
      {/* Navigation */}
      <Navbar />

      {/* Main Content Area - Increased padding and max width for spacious feel */}
      <main className="flex-grow flex flex-col relative z-10 w-full max-w-7xl mx-auto px-6 sm:px-8 lg:px-10 py-10 sm:py-12 lg:py-14 animate-in fade-in duration-300">
        {children}
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-200 bg-white py-8 text-center text-xs text-slate-500 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-10 flex flex-col sm:flex-row items-center justify-between gap-6">
          <p>© 2026 PlacementConnect. All rights reserved. Designed for Student Modules.</p>
          <div className="flex items-center space-x-6 text-[11px] font-semibold text-slate-400">
            <a href="#" className="hover:text-emerald-600 transition-colors">Privacy Policy</a>
            <span className="text-slate-200 font-normal">|</span>
            <a href="#" className="hover:text-emerald-600 transition-colors">Terms of Service</a>
            <span className="text-slate-200 font-normal">|</span>
            <a href="#" className="hover:text-emerald-600 transition-colors">Support Desk</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
