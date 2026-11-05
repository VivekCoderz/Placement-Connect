import React from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap } from 'lucide-react';

/** Centered card layout shared by the authentication pages. */
const AuthShell = ({ icon: Icon = GraduationCap, title, subtitle, children, footer, wide = false }) => (
  <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center px-4 py-10 sm:py-16 text-[#4B5563]">
    <Link
      to="/"
      className="mb-6 flex items-center gap-2 rounded-lg text-[#0B3D91] font-bold tracking-tight"
      aria-label="PlacementConnect home"
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0B3D91] text-white">
        <GraduationCap className="h-5 w-5" aria-hidden="true" />
      </span>
      <span>
        Placement<span className="text-[#F5A623]">Connect</span>
      </span>
    </Link>

    <main className={`pc-card w-full ${wide ? 'max-w-2xl' : 'max-w-md'} p-6 sm:p-10 space-y-6`}>
      <div className="text-center space-y-2">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#0B3D91]/10 text-[#0B3D91]">
          <Icon className="h-6 w-6" aria-hidden="true" />
        </div>
        <h1 className="text-2xl font-bold text-[#111827] tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-[#4B5563]">{subtitle}</p>}
      </div>
      {children}
    </main>

    {footer && <div className="mt-6 text-center text-sm text-[#4B5563]">{footer}</div>}
    <p className="mt-6 text-xs text-[#94A3B8]">Geeta University Training &amp; Placement Cell</p>
  </div>
);

export default AuthShell;
