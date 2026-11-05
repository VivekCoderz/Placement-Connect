import React from 'react';
import Navbar from './Navbar';

const Layout = ({ children }) => {
  return (
    <div className="relative min-h-screen bg-[#F8FAFC] flex flex-col overflow-x-hidden text-[#4B5563]">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-[#0B3D91] focus:shadow">
        Skip to content
      </a>
      {/* Background Decorative Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[50%] rounded-full bg-[#0B3D91]/8 blur-[130px] pointer-events-none z-0" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[50%] rounded-full bg-[#F5A623]/8 blur-[130px] pointer-events-none z-0" />
      
      {/* Navigation */}
      <Navbar />

      {/* Main Content Area */}
      <main id="main-content" className="flex-grow flex flex-col relative z-10 w-full min-w-0 max-w-7xl mx-auto px-4 sm:px-8 lg:px-10 py-6 sm:py-12 lg:py-14 animate-in fade-in duration-300">
        {children}
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-[#E5E7EB] bg-white py-8 text-center text-xs text-[#94A3B8] shadow-sm">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-10 flex flex-col sm:flex-row items-center justify-between gap-6">
          <p>© {new Date().getFullYear()} PlacementConnect · Geeta University Training &amp; Placement Cell</p>
          <div className="flex items-center space-x-6 text-[11px] font-semibold text-[#94A3B8]">
            <a href="#" className="hover:text-[#0B3D91] transition-colors">Privacy Policy</a>
            <span className="text-[#E5E7EB] font-normal">|</span>
            <a href="#" className="hover:text-[#0B3D91] transition-colors">Terms of Service</a>
            <span className="text-[#E5E7EB] font-normal">|</span>
            <a href="#" className="hover:text-[#0B3D91] transition-colors">Support Desk</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
