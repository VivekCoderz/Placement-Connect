import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Calendar, Award, DollarSign, ArrowUpRight, ShieldCheck, ShieldAlert } from 'lucide-react';
import { useSelector } from 'react-redux';
import api from '../utils/api';

const JobListings = () => {
  const user = useSelector((state) => state.auth.user);
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [salaryFilter, setSalaryFilter] = useState('all'); // all | high (>= 20 LPA) | mid (5-20 LPA) | entry (< 5 LPA)
  const [showIneligible, setShowIneligible] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const jobsResponse = await api.get('/api/jobs');
        const jobsData = jobsResponse.data;
        const mapped = (jobsData.jobs || []).map(job => ({
          ...job,
          id: job._id,
          companyName: job.companyId?.name || job.companyInfo?.name || "Company",
          eligibility: {
            minCgpa: job.eligibility?.cgpa !== undefined ? job.eligibility.cgpa : 6.0,
            eligibleBranches: job.eligibility?.branches || ['CSE', 'IT', 'ECE'],
            eligibleYears: job.eligibility?.years || [4]
          }
        }));
        setJobs(mapped);

        const appsResponse = await api.get('/api/applications/my-applications');
        const appsData = appsResponse.data;
        const mappedApps = (appsData.applications || []).map(app => ({
          ...app,
          id: app._id,
          jobId: app.jobId?._id || app.jobId
        }));
        setApplications(mappedApps);
      } catch (err) {
        console.error("Failed to fetch data:", err);
      }
    };

    if (user) {
      fetchData();
    }
  }, [user]);

  const checkEligibility = (job) => {
    if (!user) return { eligible: false, reason: 'Not logged in' };
    
    const cgpaEligible = user.cgpa >= job.eligibility.minCgpa;
    const branchEligible = job.eligibility.eligibleBranches.some(
      b => b.toUpperCase() === user.branch.toUpperCase()
    );

    if (!cgpaEligible && !branchEligible) {
      return { eligible: false, reason: `Requires ${job.eligibility.minCgpa} CGPA & ${job.eligibility.eligibleBranches.join('/')} branch` };
    }
    if (!cgpaEligible) {
      return { eligible: false, reason: `Requires minimum ${job.eligibility.minCgpa} CGPA (You have ${user.cgpa})` };
    }
    if (!branchEligible) {
      return { eligible: false, reason: `Requires branch: ${job.eligibility.eligibleBranches.join(', ')}` };
    }

    return { eligible: true };
  };

  const filteredJobs = jobs.filter(job => {
    const { eligible } = checkEligibility(job);
    if (!showIneligible && !eligible) return false;

    const matchesSearch = 
      job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.description.toLowerCase().includes(searchTerm.toLowerCase());

    let matchesSalary = true;
    if (salaryFilter === 'high') matchesSalary = job.package >= 20;
    else if (salaryFilter === 'mid') matchesSalary = job.package >= 5 && job.package < 20;
    else if (salaryFilter === 'entry') matchesSalary = job.package < 5;

    return matchesSearch && matchesSalary;
  });

  const getApplicationStatus = (jobId) => {
    const app = applications.find(a => a.jobId === jobId);
    return app ? app.status : null;
  };

  const formatDate = (dateStr) => {
    const options = { month: 'short', day: 'numeric', year: 'numeric' };
    return new Date(dateStr).toLocaleDateString('en-US', options);
  };

  const isDeadlineClose = (deadlineStr) => {
    const diffTime = new Date(deadlineStr) - new Date();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 3;
  };

  return (
    <div className="space-y-8"> {/* Increased top margin for breathing room */}
      {/* Welcome Banner */}
      <div className="bg-white border border-slate-200/80 p-8 rounded-3xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-sm">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight">
            Available Placement Drives
          </h1>
          <p className="text-sm text-slate-500 font-semibold mt-1.5">
            Hi <span className="text-emerald-600 font-bold">{user.name}</span>! Showing jobs matching your branch ({user.branch}) and CGPA ({user.cgpa}).
          </p>
        </div>
        <div className="flex items-center gap-2 bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-150 text-xs text-emerald-700 font-bold shadow-sm">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>Matching Active Drives</span>
        </div>
      </div>

      {/* Search and Filters Bar - Spacious layout */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
        {/* Search */}
        <div className="md:col-span-2 relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder="Search role, company or keywords..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-450 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all text-xs font-semibold"
          />
        </div>

        {/* Salary filter */}
        <div className="relative">
          <select
            value={salaryFilter}
            onChange={(e) => setSalaryFilter(e.target.value)}
            className="block w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all text-xs font-semibold appearance-none"
          >
            <option value="all">All CTC Packages</option>
            <option value="high">Super Dream (20+ LPA)</option>
            <option value="mid">Dream Jobs (5 - 20 LPA)</option>
            <option value="entry">Regular (Below 5 LPA)</option>
          </select>
        </div>

        {/* Show Ineligible Toggle */}
        <div className="flex items-center justify-start md:justify-end gap-3 px-1">
          <label className="text-xs text-slate-500 cursor-pointer font-bold select-none" htmlFor="ineligible-toggle">
            Show ineligible drives
          </label>
          <input
            type="checkbox"
            id="ineligible-toggle"
            checked={showIneligible}
            onChange={(e) => setShowIneligible(e.target.checked)}
            className="h-4.5 w-4.5 rounded border-slate-300 text-emerald-600 bg-white focus:ring-emerald-500/20 cursor-pointer"
          />
        </div>
      </div>

      {/* Grid of Job Cards - Increased gaps to gap-8 for spaciousness */}
      {filteredJobs.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-20 text-center space-y-4 shadow-sm">
          <p className="text-slate-450 text-sm font-semibold">
            No active placement drives found matching your filter criteria.
          </p>
          {salaryFilter !== 'all' && (
            <button
              onClick={() => { setSalaryFilter('all'); setSearchTerm(''); }}
              className="text-xs font-bold text-emerald-600 hover:text-emerald-500 transition-colors"
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-in fade-in duration-300">
          {filteredJobs.map((job) => {
            const { eligible, reason } = checkEligibility(job);
            const appliedStatus = getApplicationStatus(job.id);
            const urgentDeadline = isDeadlineClose(job.deadline);

            return (
              <div 
                key={job.id} 
                className={`bg-white rounded-2xl flex flex-col justify-between overflow-hidden shadow-sm border relative ${
                  eligible 
                    ? 'border-slate-200 glass-card-hover' 
                    : 'border-slate-100 opacity-60 bg-slate-50/50'
                }`}
              >
                {/* Header info - increased padding to p-8 */}
                <div className="p-8 space-y-5">
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex items-center gap-3.5">
                      <div className="h-11 w-11 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center font-bold text-emerald-700 text-sm flex-shrink-0">
                        {job.companyName.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">{job.companyName}</h4>
                        <h3 className="text-sm font-extrabold text-slate-800 group-hover:text-emerald-600 truncate max-w-[150px] mt-0.5">
                          {job.title}
                        </h3>
                      </div>
                    </div>

                    {/* Status Badge */}
                    {appliedStatus ? (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200">
                        {appliedStatus}
                      </span>
                    ) : !eligible ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200">
                        Ineligible
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-650 border border-emerald-100">
                        Active
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-500 leading-relaxed line-clamp-2 font-medium">
                    {job.description}
                  </p>

                  {/* Highlights Grid */}
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <DollarSign className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase leading-none">Package</p>
                        <p className="font-extrabold text-slate-800 mt-1">{job.package} LPA</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Award className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase leading-none">Min CGPA</p>
                        <p className="font-extrabold text-slate-800 mt-1">{job.eligibility.minCgpa} CGPA</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Action Area */}
                <div className="px-8 py-5 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3 mt-auto">
                  <span className={`text-[10px] flex items-center gap-1.5 font-bold ${
                    urgentDeadline ? 'text-amber-600 animate-pulse' : 'text-slate-450'
                  }`}>
                    <Calendar className="w-4 h-4" />
                    Deadline: {formatDate(job.deadline)}
                  </span>
                  
                  {eligible ? (
                    <Link
                      to={`/job/${job.id}`}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 hover:text-emerald-700 transition-colors"
                    >
                      View Details
                      <ArrowUpRight className="w-4 h-4" />
                    </Link>
                  ) : (
                    <span 
                      className="text-[10px] text-rose-500 max-w-[150px] truncate leading-tight font-bold"
                      title={reason}
                    >
                      {reason}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default JobListings;
