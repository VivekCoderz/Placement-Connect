import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { 
  GraduationCap, 
  Briefcase, 
  Building2, 
  ShieldCheck, 
  TrendingUp, 
  FileText, 
  Calendar, 
  Clock, 
  ArrowRight, 
  CheckCircle2, 
  BarChart3, 
  FileSpreadsheet, 
  Users, 
  Zap, 
  Sparkles, 
  ChevronRight,
  Menu,
  X
} from 'lucide-react';

const LandingPage = () => {
  const user = useSelector((state) => state.auth.user);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('student');
  const [timelineStep, setTimelineStep] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Auto-redirect if user is already logged in
  useEffect(() => {
    if (user) {
      if (user.role === 'company') navigate('/recruiter/dashboard');
      else if (user.role === 'placementCell') navigate('/placement/dashboard');
      else if (user.role === 'admin') navigate('/admin/dashboard');
      else if (user.role === 'student') navigate('/jobs');
    }
  }, [user, navigate]);

  // Timeline simulation steps
  const simulatedSteps = [
    { label: 'Applied', desc: 'Applied to Google SDE drive. CGPA eligibility checked.' },
    { label: 'Aptitude Test', desc: 'Recruiter uploaded Aptitude shortlist. Notification sent!' },
    { label: 'Group Discussion', desc: 'Round cleared. Interview scheduled on calendar.' },
    { label: 'HR Interview', desc: 'Final conversation with HR. Document check.' },
    { label: 'Selected 🎉', desc: 'Selected! Offer letter uploaded, Package: 18 LPA.' }
  ];

  // Simulated placement stats for different branches
  const simulatedStats = [
    { branch: 'CSE', percentage: 94, package: '12.4 LPA', hires: 148 },
    { branch: 'ECE', percentage: 88, package: '8.2 LPA', hires: 92 },
    { branch: 'ME', percentage: 76, package: '6.0 LPA', hires: 54 },
    { branch: 'CE', percentage: 72, package: '5.8 LPA', hires: 42 }
  ];

  return (
    <div className="min-h-screen bg-[#1E293B] text-[#F8FAFC] font-sans selection:bg-[#FF9933] selection:text-white relative overflow-hidden">
      
      {/* Decorative Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[#FF9933]/12 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-[#138808]/10 blur-[150px] pointer-events-none"></div>
      <div className="absolute top-[40%] left-[50%] transform -translate-x-1/2 w-[800px] h-[300px] rounded-full bg-[#138808]/8 blur-[120px] pointer-events-none"></div>

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-25 pointer-events-none"></div>

      {/* Header/Navbar */}
      <nav className="relative z-50 border-b border-[#334155]/60 bg-[#1E293B]/85 backdrop-blur-md sticky top-0">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-10">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <div className="flex items-center">
              <Link to="/" className="flex items-center space-x-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-[#FF9933] to-[#E67E22] flex items-center justify-center shadow-lg">
                  <GraduationCap className="w-5 h-5 text-white" />
                </div>
                <span className="font-extrabold text-xl tracking-tight text-white">
                  Placement<span className="text-[#FF9933]">Connect</span>
                </span>
              </Link>
            </div>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-sm text-[#94A3B8] hover:text-[#FF9933] transition-colors font-semibold">Why Us?</a>
              <a href="#roles" className="text-sm text-slate-355 hover:text-[#FF9933] transition-colors font-semibold">User Modules</a>
              <a href="#simulator" className="text-sm text-[#94A3B8] hover:text-[#FF9933] transition-colors font-semibold">Simulators</a>
              <a href="#faq" className="text-sm text-[#94A3B8] hover:text-[#FF9933] transition-colors font-semibold">FAQ</a>
            </div>

            {/* CTAs */}
            <div className="hidden md:flex items-center space-x-4">
              <Link
                to="/login"
                className="text-sm font-semibold text-[#CBD5E1] hover:text-white px-4 py-2.5 transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/signup"
                className="text-sm font-semibold bg-gradient-to-r from-[#FF9933] to-[#E67E22] hover:from-[#E67E22] hover:to-[#C67E14] text-white px-6 py-2.5 rounded-xl transition-all duration-200 shadow-md shadow-amber-500/10 hover:shadow-amber-500/20 active:scale-[0.98]"
              >
                Get Started
              </Link>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-xl text-[#CBD5E1] hover:text-white hover:bg-[#1E293B] transition-colors"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#1E293B] border-b border-[#334155] px-6 py-6 space-y-4 animate-in slide-in-from-top-4 duration-200">
            <a 
              href="#features" 
              onClick={() => setMobileMenuOpen(false)}
              className="block text-base text-[#CBD5E1] hover:text-[#FF9933]"
            >
              Why Us?
            </a>
            <a 
              href="#roles" 
              onClick={() => setMobileMenuOpen(false)}
              className="block text-base text-[#CBD5E1] hover:text-[#FF9933]"
            >
              User Modules
            </a>
            <a 
              href="#simulator" 
              onClick={() => setMobileMenuOpen(false)}
              className="block text-base text-[#CBD5E1] hover:text-[#FF9933]"
            >
              Simulators
            </a>
            <a 
              href="#faq" 
              onClick={() => setMobileMenuOpen(false)}
              className="block text-base text-[#CBD5E1] hover:text-[#FF9933]"
            >
              FAQ
            </a>
            <div className="border-t border-[#334155] pt-4 flex flex-col gap-3">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="text-center py-2.5 text-sm font-semibold text-[#CBD5E1] hover:text-white border border-[#334155] rounded-xl"
              >
                Sign In
              </Link>
              <Link
                to="/signup"
                onClick={() => setMobileMenuOpen(false)}
                className="text-center py-2.5 text-sm font-semibold bg-[#FF9933] text-white rounded-xl"
              >
                Get Started
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative pt-12 pb-20 sm:pb-28 lg:pb-32 px-6 sm:px-8 lg:px-10 max-w-7xl mx-auto z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Text Column */}
          <div className="lg:col-span-7 space-y-8 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 bg-[#FF9933]/10 border border-[#FF9933]/25 px-4 py-1.5 rounded-full text-xs font-semibold text-[#FF9933]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Smart Placement Ecosystem</span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
              Bridge the Gap Between <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-blue-400 via-[#FF9933] to-[#E67E22] bg-clip-text text-transparent">
                Talent and Opportunity
              </span>
            </h1>
            
            <p className="text-slate-305 text-base sm:text-lg max-w-2xl mx-auto lg:mx-0 leading-relaxed">
              PlacementConnect is the official campus hiring portal of <strong>Geeta University</strong>. 
              We replace outdated Excel tracking systems and fragmented emails with a unified, 
              real-time portal where students, recruiters, and placement officers interact seamlessly.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
              <Link
                to="/signup"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-gradient-to-r from-[#FF9933] to-[#E67E22] hover:from-[#E67E22] hover:to-[#C67E14] text-white font-bold px-8 py-4 rounded-xl shadow-lg shadow-amber-500/15 hover:shadow-amber-500/25 transition-all text-sm active:scale-[0.98]"
              >
                Register as Student <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/recruiter/signup"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#1E293B] hover:bg-[#1E293B] text-[#CBD5E1] hover:text-white border border-[#334155] hover:border-[#334155] font-bold px-8 py-4 rounded-xl transition-all text-sm active:scale-[0.98]"
              >
                <Building2 className="w-4 h-4" /> Recruiter Sign Up
              </Link>
            </div>

            {/* Micro Stats */}
            <div className="grid grid-cols-3 gap-6 pt-6 max-w-md mx-auto lg:mx-0 border-t border-[#334155]/80">
              <div>
                <p className="text-2xl sm:text-3xl font-extrabold text-white">95%</p>
                <p className="text-xs text-slate-450 mt-1">Placement Rate</p>
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-extrabold text-white">18 LPA</p>
                <p className="text-xs text-slate-455 mt-1">Max package</p>
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-extrabold text-white">150+</p>
                <p className="text-xs text-slate-450 mt-1">Recruiter Partners</p>
              </div>
            </div>
          </div>

          {/* Right Showcase Column (Floating Dashboard Cards Visual mockup) */}
          <div className="lg:col-span-5 relative w-full flex justify-center">
            <div className="relative w-full max-w-[450px] aspect-[9/10] bg-[#1E293B]/70 rounded-3xl border border-[#334155]/85 p-6 shadow-2xl backdrop-blur-sm overflow-hidden flex flex-col justify-between">
              
              {/* Card Header */}
              <div className="flex items-center justify-between border-b border-[#334155]/80 pb-4">
                <div className="flex items-center gap-3">
                  <div className="h-2.5 w-2.5 rounded-full bg-red-500"></div>
                  <div className="h-2.5 w-2.5 rounded-full bg-yellow-500"></div>
                  <div className="h-2.5 w-2.5 rounded-full bg-green-500"></div>
                </div>
                <div className="h-5 w-40 bg-[#1E293B] rounded-full animate-pulse"></div>
              </div>

              {/* Mock Student Card */}
              <div className="my-auto space-y-4 relative z-10">
                <div className="bg-[#1E293B]/80 border border-[#334155] p-4 rounded-2xl flex items-center justify-between shadow-md">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-amber-500/20 text-[#FF9933] flex items-center justify-center font-bold text-sm">
                      JD
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">Google SDE - 2026</h4>
                      <p className="text-[10px] text-emerald-400 font-mono mt-0.5">Eligibility: CGPA &ge; 8.0</p>
                    </div>
                  </div>
                  <span className="text-[10px] bg-[#1E293B] px-2 py-1 rounded-md text-[#CBD5E1] font-bold">18.5 LPA</span>
                </div>

                {/* Mock Application Timeline visual */}
                <div className="bg-[#1E293B]/80 border border-[#334155] p-4 rounded-2xl space-y-3 shadow-md">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="font-bold text-[#CBD5E1]">My Application Tracker</span>
                    <span className="text-[#FF9933] font-bold">In-Progress</span>
                  </div>
                  <div className="flex items-center justify-between gap-1">
                    <div className="h-1 flex-grow bg-emerald-500 rounded-full"></div>
                    <div className="h-1 flex-grow bg-emerald-500 rounded-full"></div>
                    <div className="h-1 flex-grow bg-emerald-500 rounded-full"></div>
                    <div className="h-1 flex-grow bg-amber-500 rounded-full"></div>
                    <div className="h-1 flex-grow bg-[#1E293B] rounded-full"></div>
                  </div>
                  <p className="text-[9px] text-slate-400 text-center">Current Round: Technical Interview Scheduled</p>
                </div>

                {/* Mock Placement cell Analytics SVG */}
                <div className="bg-[#1E293B]/80 border border-[#FF9933]/25 p-4 rounded-2xl space-y-2 shadow-md">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="font-bold text-[#FF9933] flex items-center gap-1">
                      <BarChart3 className="w-3.5 h-3.5" /> Branch Hires 2026
                    </span>
                    <span className="text-slate-400">Real-time stats</span>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[9px] text-slate-400 font-mono">
                      <span>CSE</span>
                      <span>94% Placed</span>
                    </div>
                    <div className="h-2 w-full bg-[#1E293B] rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full" style={{ width: '94%' }}></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating badges */}
              <div className="absolute top-10 right-4 bg-[#1E293B]/95 border border-[#334155] px-3.5 py-2 rounded-xl flex items-center gap-2 shadow-lg animate-float-slow">
                <div className="h-6 w-6 rounded-full bg-emerald-500/25 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <p className="text-[9px] text-slate-400">Offer Released</p>
                  <p className="text-[10px] font-bold text-white">Student Shortlisted</p>
                </div>
              </div>

              <div className="absolute bottom-12 left-4 bg-[#1E293B]/95 border border-[#334155] px-3.5 py-2 rounded-xl flex items-center gap-2 shadow-lg animate-float-medium">
                <div className="h-6 w-6 rounded-full bg-blue-500/25 flex items-center justify-center">
                  <FileText className="w-4 h-4 text-blue-400" />
                </div>
                <div>
                  <p className="text-[9px] text-slate-400">CV Verified</p>
                  <p className="text-[10px] font-bold text-white">University Format PDF</p>
                </div>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* Section 1: The Problem vs Solution (Kyu aur Kaise Useful Hai?) */}
      <section id="features" className="py-20 border-t border-[#334155] bg-[#1E293B]/30 relative">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-10">
          
          <div className="text-center space-y-4 max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-bold tracking-widest text-[#FF9933] uppercase">Why PlacementConnect?</h2>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-white">
              Why university campuses need a dedicated placement system
            </h3>
            <p className="text-slate-400 text-sm">
              Campus placement operations are traditionally complex. Managing them through manual lists and social channels leads to major inefficiencies.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
            
            {/* The Manual Pain Points Card */}
            <div className="bg-[#1E293B]/50 border border-red-500/10 rounded-3xl p-8 space-y-6 flex flex-col justify-between hover:border-red-500/20 transition-all duration-300">
              <div>
                <div className="inline-flex items-center gap-2 bg-red-500/10 text-red-400 px-3 py-1 rounded-full text-xs font-semibold mb-6">
                  ✕ Outdated Manual System
                </div>
                <h4 className="text-xl font-bold text-white mb-4">The Messy Excel & Email Era</h4>
                <ul className="space-y-4 text-sm text-slate-400">
                  <li className="flex items-start gap-2.5">
                    <span className="text-red-500 font-bold mt-0.5">•</span>
                    <span><strong>Manual Eligibility Checks:</strong> Placement coordinators manually filter students by CGPA on Excel sheets, risking human error and delay.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-red-500 font-bold mt-0.5">•</span>
                    <span><strong>Information Loss:</strong> Crucial drive updates and shortlist files get buried under hundreds of emails and WhatsApp notifications.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-red-500 font-bold mt-0.5">•</span>
                    <span><strong>Blindspots for Students:</strong> Students submit applications with no feedback, not knowing which round (GD, Aptitude, HR) they are in.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-red-500 font-bold mt-0.5">•</span>
                    <span><strong>Formatting Chaos:</strong> Diverse and poorly formatted student resumes complicate the recruiter review process.</span>
                  </li>
                </ul>
              </div>
              <div className="border-t border-[#334155] pt-6 text-xs text-red-500/60 font-semibold italic">
                Resulting in missed opportunities and delayed operations.
              </div>
            </div>

            {/* The Smart Solution Card */}
            <div className="bg-[#1E293B]/50 border border-emerald-500/20 rounded-3xl p-8 space-y-6 flex flex-col justify-between hover:border-emerald-500/40 transition-all duration-300 shadow-xl shadow-emerald-500/5">
              <div>
                <div className="inline-flex items-center gap-2 bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full text-xs font-semibold mb-6">
                  ✓ The PlacementConnect System
                </div>
                <h4 className="text-xl font-bold text-white mb-4">Centralized, Automatic & Transparent</h4>
                <ul className="space-y-4 text-sm text-[#CBD5E1]">
                  <li className="flex items-start gap-2.5">
                    <span className="text-emerald-400 font-bold mt-0.5">✔</span>
                    <span><strong>Instant Eligibility Enforcement:</strong> MongoDB aggregation queries verify student CGPA and branch in real time to show only eligible drives.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-emerald-400 font-bold mt-0.5">✔</span>
                    <span><strong>Live Notification Dispatcher:</strong> Socket.io and Nodemailer trigger emails and in-app alerts as soon as a company posts updates.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-emerald-400 font-bold mt-0.5">✔</span>
                    <span><strong>Dynamic Application Timeline:</strong> Students view a visual stepper layout illustrating round-by-round progress (GD, Aptitude, HR).</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-emerald-400 font-bold mt-0.5">✔</span>
                    <span><strong>University PDF Resume Builder:</strong> Automatically compiles student academic scores and skills into a standard university-approved PDF format.</span>
                  </li>
                </ul>
              </div>
              <div className="border-t border-[#334155] pt-6 text-xs text-emerald-400/80 font-semibold italic">
                Ensures 100% transparency and speeds up campus recruitment cycle by 3x.
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Section 2: Who is it for? Interactive Roles & Benefits */}
      <section id="roles" className="py-20 max-w-7xl mx-auto px-6 sm:px-8 lg:px-10 relative">
        <div className="text-center space-y-4 max-w-3xl mx-auto mb-12">
          <h2 className="text-xs font-bold tracking-widest text-[#FF9933] uppercase">Target Users</h2>
          <h3 className="text-3xl sm:text-4xl font-extrabold text-white">
            Designed for the entire university ecosystem
          </h3>
          <p className="text-slate-400 text-sm">
            One platform connecting students, companies, and the placement office. Click a tab to see features customized for each user.
          </p>
        </div>

        {/* Role Tabs */}
        <div className="flex justify-center mb-10">
          <div className="inline-flex bg-[#1E293B] p-1.5 rounded-2xl border border-[#334155]">
            <button
              onClick={() => setActiveTab('student')}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                activeTab === 'student'
                  ? 'bg-gradient-to-r from-[#FF9933] to-[#E67E22] text-white shadow-md'
                  : 'text-slate-400 hover:text-[#CBD5E1]'
              }`}
            >
              <Users className="w-4 h-4" /> For Students
            </button>
            <button
              onClick={() => setActiveTab('recruiter')}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                activeTab === 'recruiter'
                  ? 'bg-gradient-to-r from-[#FF9933] to-[#E67E22] text-white shadow-md'
                  : 'text-slate-400 hover:text-[#CBD5E1]'
              }`}
            >
              <Building2 className="w-4 h-4" /> For Recruiters
            </button>
            <button
              onClick={() => setActiveTab('officer')}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                activeTab === 'officer'
                  ? 'bg-gradient-to-r from-[#FF9933] to-[#E67E22] text-white shadow-md'
                  : 'text-slate-400 hover:text-[#CBD5E1]'
              }`}
            >
              <GraduationCap className="w-4 h-4" /> For T&P Cell
            </button>
          </div>
        </div>

        {/* Tab Content Display */}
        <div className="bg-[#1E293B]/40 border border-[#334155] rounded-3xl p-8 sm:p-10 shadow-xl backdrop-blur-sm animate-in fade-in duration-300">
          {activeTab === 'student' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
              <div className="space-y-6">
                <div className="h-12 w-12 rounded-xl bg-amber-500/10 text-[#FF9933] flex items-center justify-center font-bold">
                  <Users className="w-6 h-6" />
                </div>
                <h4 className="text-2xl font-bold text-white">Empower students to showcase their absolute best</h4>
                <p className="text-[#94A3B8] leading-relaxed text-sm">
                  PlacementConnect gives students a secure profile workspace where they enter their CGPA, upload skills, outline projects, and host certification details.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex gap-2.5">
                    <CheckCircle2 className="w-4.5 h-4.5 text-[#FF9933] flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-white">Resume Generator</p>
                      <p className="text-[11px] text-slate-400">Generate university formatted print-ready PDF resume instantly.</p>
                    </div>
                  </div>
                  <div className="flex gap-2.5">
                    <CheckCircle2 className="w-4.5 h-4.5 text-[#FF9933] flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-white">Eligibility Guard</p>
                      <p className="text-[11px] text-slate-400">Never get rejected post-apply. Only apply to eligible drives matching CGPA.</p>
                    </div>
                  </div>
                  <div className="flex gap-2.5">
                    <CheckCircle2 className="w-4.5 h-4.5 text-[#FF9933] flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-white">Stage Simulators</p>
                      <p className="text-[11px] text-slate-400">Watch your application state progress as recruiters complete hiring rounds.</p>
                    </div>
                  </div>
                  <div className="flex gap-2.5">
                    <CheckCircle2 className="w-4.5 h-4.5 text-[#FF9933] flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-white">Real-Time Alerts</p>
                      <p className="text-[11px] text-slate-400">Receive calendar invitations and stage status changes on Socket and email.</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-[#1E293B]/80 border border-[#334155] rounded-2xl p-6 space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-[#334155]">
                  <span className="text-xs font-bold text-white">My Academic Profile Card</span>
                  <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded font-bold">Verified</span>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">CGPA Score</span>
                    <span className="text-white font-mono font-bold">8.76 / 10</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Branch</span>
                    <span className="text-white font-bold">CSE</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Skills</span>
                    <span className="text-[#FF9933] font-bold">React, Node.js, MongoDB, Git</span>
                  </div>
                </div>
                <div className="bg-[#0B3D91]/15 border border-[#0B3D91]/30 p-3.5 rounded-xl text-center space-y-2">
                  <p className="text-[10px] text-[#CBD5E1]">Profile data compiles automatically to generate print resume PDF</p>
                  <button className="text-[10px] bg-[#0B3D91] hover:bg-[#082F70] text-white font-bold px-3.5 py-1.5 rounded-lg transition-colors inline-flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5" /> Export PDF Resume
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'recruiter' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
              <div className="space-y-6">
                <div className="h-12 w-12 rounded-xl bg-amber-500/10 text-[#FF9933] flex items-center justify-center font-bold">
                  <Building2 className="w-6 h-6" />
                </div>
                <h4 className="text-2xl font-bold text-white">Fast-track recruitment and shortlist management</h4>
                <p className="text-[#94A3B8] leading-relaxed text-sm">
                  Register, get verified by administration, and post job description files and eligibility parameters. Manage student profiles in one comprehensive portal.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex gap-2.5">
                    <CheckCircle2 className="w-4.5 h-4.5 text-[#FF9933] flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-white">CSV Shortlist Upload</p>
                      <p className="text-[11px] text-slate-400">Upload round-wise qualified candidates easily using standard spreadsheet files.</p>
                    </div>
                  </div>
                  <div className="flex gap-2.5">
                    <CheckCircle2 className="w-4.5 h-4.5 text-[#FF9933] flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-white">Custom Criteria Filter</p>
                      <p className="text-[11px] text-slate-400">Specify exactly which CGPA, branch, or batch year are eligible to apply.</p>
                    </div>
                  </div>
                  <div className="flex gap-2.5">
                    <CheckCircle2 className="w-4.5 h-4.5 text-[#FF9933] flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-white">Direct PDF Downloads</p>
                      <p className="text-[11px] text-slate-400">Bulk review standardized student portfolios and download resumes in one click.</p>
                    </div>
                  </div>
                  <div className="flex gap-2.5">
                    <CheckCircle2 className="w-4.5 h-4.5 text-[#FF9933] flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-white">Instant Selection Declares</p>
                      <p className="text-[11px] text-slate-400">Publish selection details and upload offer letters directly for verified applicants.</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-[#1E293B]/80 border border-[#334155] rounded-2xl p-6 space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-[#334155]">
                  <span className="text-xs font-bold text-white">Recruiter Control Dashboard</span>
                  <span className="text-xs text-slate-400 font-mono">Google LLC</span>
                </div>
                <div className="space-y-3">
                  <div className="bg-[#1E293B] p-3.5 rounded-xl border border-[#334155]">
                    <p className="text-[10px] text-[#FF9933] font-bold uppercase tracking-wider">CSV shortlisting</p>
                    <p className="text-xs text-white font-semibold mt-1">Upload Round 1 (Aptitude) Shortlist</p>
                    <div className="mt-2.5 border border-dashed border-[#334155] hover:border-[#FF9933]/40 rounded-lg p-3 text-center cursor-pointer transition-colors bg-[#1E293B]">
                      <FileSpreadsheet className="w-5 h-5 text-slate-400 mx-auto mb-1" />
                      <p className="text-[9px] text-slate-400">Drag & drop shortlists.csv or click to upload</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs bg-[#1E293B] px-3 py-2 rounded-lg border border-[#334155]">
                    <span className="text-slate-400">Applicants Recieved</span>
                    <span className="text-[#FF9933] font-bold font-mono">142 Students</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'officer' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
              <div className="space-y-6">
                <div className="h-12 w-12 rounded-xl bg-amber-500/10 text-[#FF9933] flex items-center justify-center font-bold">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <h4 className="text-2xl font-bold text-white">Full administrative control & placement analytics</h4>
                <p className="text-[#94A3B8] leading-relaxed text-sm">
                  Placement Cell Officers manage all users, vet corporate registrations, coordinate interview schedules, and analyze real-time placement success statistics.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex gap-2.5">
                    <CheckCircle2 className="w-4.5 h-4.5 text-[#FF9933] flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-white">Company Verification</p>
                      <p className="text-[11px] text-slate-400">Approve or reject registering recruiters securely to prevent spam drives.</p>
                    </div>
                  </div>
                  <div className="flex gap-2.5">
                    <CheckCircle2 className="w-4.5 h-4.5 text-[#FF9933] flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-white">Analytics Hub</p>
                      <p className="text-[11px] text-slate-400">Track branch-wise, package-wise, and company-wise performance in detail.</p>
                    </div>
                  </div>
                  <div className="flex gap-2.5">
                    <CheckCircle2 className="w-4.5 h-4.5 text-[#FF9933] flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-white">Interview Scheduler</p>
                      <p className="text-[11px] text-slate-400">Instantly generate standard ICS calendar invites and mail details to students.</p>
                    </div>
                  </div>
                  <div className="flex gap-2.5">
                    <CheckCircle2 className="w-4.5 h-4.5 text-[#FF9933] flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-white">Drive Moderation</p>
                      <p className="text-[11px] text-slate-400">Add, edit, or extend registration deadlines for active campus drives.</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-[#1E293B]/80 border border-[#334155] rounded-2xl p-6 space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-[#334155]">
                  <span className="text-xs font-bold text-white">Placement Admin Console</span>
                  <span className="text-xs text-[#FF9933] font-bold">Live Control</span>
                </div>
                <div className="space-y-2 text-xs">
                  <p className="text-[10px] text-slate-400 font-semibold mb-1">Pending Approvals</p>
                  <div className="bg-[#1E293B] border border-[#334155] p-3 rounded-xl flex items-center justify-between">
                    <div>
                      <p className="font-bold text-white">Infosys Tech</p>
                      <p className="text-[10px] text-slate-400">infosys.com/careers</p>
                    </div>
                    <div className="flex gap-1.5">
                      <button className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-[9px] px-2.5 py-1.5 rounded transition-colors">Approve</button>
                      <button className="bg-[#1E293B] hover:bg-slate-700 text-[#94A3B8] font-bold text-[9px] px-2.5 py-1.5 rounded transition-colors">Reject</button>
                    </div>
                  </div>
                  <div className="bg-[#1E293B] border border-[#334155] p-3 rounded-xl flex items-center justify-between">
                    <div>
                      <p className="font-bold text-white">Wipro Ltd</p>
                      <p className="text-[10px] text-slate-400">wipro.com/recruit</p>
                    </div>
                    <div className="flex gap-1.5">
                      <button className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-[9px] px-2.5 py-1.5 rounded transition-colors">Approve</button>
                      <button className="bg-[#1E293B] hover:bg-slate-700 text-[#94A3B8] font-bold text-[9px] px-2.5 py-1.5 rounded transition-colors">Reject</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Section 3: Live interactive simulators (Interactive Pipeline) */}
      <section id="simulator" className="py-20 border-t border-[#334155] bg-[#1E293B]/30 relative">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-10">
          
          <div className="text-center space-y-4 max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-bold tracking-widest text-[#FF9933] uppercase">Interactive Demos</h2>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-white">
              Try the platform simulation features
            </h3>
            <p className="text-slate-400 text-sm">
              Experience the core mechanics of PlacementConnect right now. See how applications progress and how stats aggregate.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            
            {/* Simulation 1: Application pipeline stepper */}
            <div className="lg:col-span-7 bg-[#1E293B]/70 border border-[#334155] rounded-3xl p-8 flex flex-col justify-between shadow-lg">
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-[#334155] pb-4">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-emerald-400" /> Student Application Stepper
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">Simulated Flow</span>
                </div>
                <p className="text-sm text-[#CBD5E1] font-normal">
                  Select a step in the hiring pipeline to see how the status changes and how email/notification alerts trigger for the student.
                </p>

                {/* The Stepper Buttons */}
                <div className="flex flex-wrap items-center gap-2 pt-2">
                  {simulatedSteps.map((step, idx) => (
                    <button
                      key={idx}
                      onClick={() => setTimelineStep(idx)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        timelineStep === idx
                          ? 'bg-[#0B3D91] text-[#FF9933] border border-[#FF9933]/30 shadow'
                          : 'bg-[#1E293B] hover:bg-slate-850 text-slate-400 border border-transparent'
                      }`}
                    >
                      Step {idx + 1}: {step.label.split(' ')[0]}
                    </button>
                  ))}
                </div>

                {/* Stage Detail display box */}
                <div className="bg-[#1E293B] border border-[#334155] p-5 rounded-2xl space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-white uppercase tracking-wider">Status Details</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono ${
                      timelineStep === 4 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                    }`}>
                      {simulatedSteps[timelineStep].label}
                    </span>
                  </div>
                  <p className="text-xs text-[#CBD5E1] font-semibold">
                    {simulatedSteps[timelineStep].desc}
                  </p>
                  
                  {/* Notification toast mimic */}
                  <div className="border-t border-[#334155] pt-3.5 flex items-start gap-2.5 text-[10px] text-slate-400">
                    <Zap className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                    <div className="w-full overflow-hidden">
                      <p className="font-bold text-[#CBD5E1]">Socket.io Dispatcher Message:</p>
                      <p className="font-mono mt-0.5 bg-[#1E293B] p-2 rounded border border-[#334155] text-amber-400 overflow-x-auto text-[9px] whitespace-pre sm:whitespace-normal">
                        {`{ type: "STATUS_UPDATE", text: "Your Google SDE application is marked as: `}
                        <span className="font-bold text-[#FF9933]">{simulatedSteps[timelineStep].label}</span>
                        {`" }`}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="border-t border-[#334155] pt-6 text-[10px] text-slate-400 font-semibold">
                In-app notification database updates automatically on status change.
              </div>
            </div>

            {/* Simulation 2: Real-time aggregated stats bar graphs */}
            <div className="lg:col-span-5 bg-[#1E293B]/70 border border-[#334155] rounded-3xl p-8 flex flex-col justify-between shadow-lg">
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-[#334155] pb-4">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <BarChart3 className="w-4 h-4 text-[#FF9933]" /> Placement Aggregation
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">Academic Year 2026</span>
                </div>
                <p className="text-sm text-[#94A3B8]">
                  Real-time branch statistics. Higher packages show the average annual salary from recruiters.
                </p>

                {/* Graph bars representation */}
                <div className="space-y-4 pt-2">
                  {simulatedStats.map((stat, idx) => (
                    <div key={idx} className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-white">{stat.branch} Department</span>
                        <div className="flex items-center gap-2 font-mono text-[11px]">
                          <span className="text-[#FF9933] font-bold">{stat.package} Avg</span>
                          <span className="text-slate-400">|</span>
                          <span className="text-emerald-400 font-bold">{stat.percentage}% placed</span>
                        </div>
                      </div>
                      <div className="h-2.5 w-full bg-[#1E293B] border border-[#334155] rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-blue-600 via-[#FF9933] to-[#E67E22] rounded-full transition-all duration-1000"
                          style={{ width: `${stat.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="border-t border-[#334155] pt-6 text-[10px] text-slate-400 font-semibold">
                Aggregated in MongoDB using aggregate frameworks on final job selections.
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 max-w-5xl mx-auto px-6 sm:px-8 lg:px-10 relative">
        <div className="text-center space-y-4 max-w-3xl mx-auto mb-16">
          <h2 className="text-xs font-bold tracking-widest text-[#FF9933] uppercase">Frequently Asked Questions</h2>
          <h3 className="text-3xl sm:text-4xl font-extrabold text-white">
            Answers to common questions
          </h3>
          <p className="text-slate-400 text-sm">
            Learn more about the platform's security, accessibility, and functional rules.
          </p>
        </div>

        <div className="space-y-6">
          <div className="bg-[#1E293B]/50 border border-[#334155]/80 rounded-2xl p-6">
            <h4 className="text-base font-bold text-white mb-2">How is eligibility filtered?</h4>
            <p className="text-sm text-slate-400 leading-relaxed font-normal">
              When a recruiter posts a drive, they define minimum CGPA, eligible branches, and graduating batch. When students load their Job Drives page, the database matches their profile statistics against active parameters. If a student falls below requirements, the "Apply" button is disabled and replaced by eligibility logs.
            </p>
          </div>
          
          <div className="bg-[#1E293B]/50 border border-[#334155]/80 rounded-2xl p-6">
            <h4 className="text-base font-bold text-white mb-2">How does the Resume Builder work?</h4>
            <p className="text-sm text-slate-400 leading-relaxed font-normal">
              Students do not need to upload external Word documents. The app fetches their verified profile fields (Academics, Experience, Projects, Skills) and compiles them into a standard, university-approved format. This can be viewed, customized, and exported as a print-ready PDF instantly.
            </p>
          </div>

          <div className="bg-[#1E293B]/50 border border-[#334155]/80 rounded-2xl p-6">
            <h4 className="text-base font-bold text-white mb-2">How is security handled for recruiters?</h4>
            <p className="text-sm text-slate-400 leading-relaxed font-normal">
              To prevent external spam, corporate accounts register and enter recruitment officer details. When registered, they remain locked in a pending verification state. Placement Cell Administrators review credentials and approve them manually. Post-approval, companies gain access to post drives and view student profiles.
            </p>
          </div>

          <div className="bg-[#1E293B]/50 border border-[#334155]/80 rounded-2xl p-6">
            <h4 className="text-base font-bold text-white mb-2">Are notifications immediate?</h4>
            <p className="text-sm text-slate-400 leading-relaxed font-normal">
              Yes. The platform is equipped with Socket.io on the client and server. Status updates, new drive postings, and interview schedules trigger instant in-app bells. In addition, automated emails via Nodemailer ensure you get notified even when offline.
            </p>
          </div>
        </div>
      </section>

      {/* Call to Action Footer Panel */}
      <section className="py-16 sm:py-20 border-t border-[#334155] bg-[#1E293B] relative overflow-hidden">
        <div className="max-w-4xl mx-auto text-center px-6 space-y-8 relative z-10">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
            Ready to streamline campus recruitments?
          </h2>
          <p className="text-[#CBD5E1] text-sm sm:text-base max-w-xl mx-auto font-normal">
            Log in to access your customized portal. Students, Recruiters, and Administrators are welcome.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/login"
              className="bg-gradient-to-r from-[#FF9933] to-[#E67E22] hover:from-[#E67E22] hover:to-[#C67E14] text-white font-bold px-8 py-3.5 rounded-xl transition-all shadow-md text-sm active:scale-[0.98]"
            >
              Access Dashboard
            </Link>
            <Link
              to="/signup"
              className="bg-[#1E293B] hover:bg-[#1E293B] text-[#CBD5E1] hover:text-white border border-[#334155] hover:border-[#334155] font-bold px-8 py-3.5 rounded-xl transition-all text-sm active:scale-[0.98]"
            >
              Student Registration
            </Link>
          </div>
        </div>
      </section>

      {/* Footer Details */}
      <footer className="bg-[#1E293B] border-t border-[#334155] py-10 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-slate-400 font-semibold">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-[#FF9933]" />
            <span>&copy; {new Date().getFullYear()} Geeta University. Department of Computer Science & Engineering.</span>
          </div>
          <div>
            <span>MERN Stack Internship Project &bull; Group 3</span>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default LandingPage;
