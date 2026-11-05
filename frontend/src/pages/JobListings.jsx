import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Calendar, Award, DollarSign, ArrowUpRight } from 'lucide-react';
import { useSelector } from 'react-redux';
import api, { getErrorMessage } from '../utils/api';

const JobListings = () => {
  const user = useSelector((state) => state.auth.user);
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [salaryFilter, setSalaryFilter] = useState('all'); // all | high (>= 20 LPA) | mid (5-20 LPA) | entry (< 5 LPA)
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setLoadError('');
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
            eligibleYears: job.eligibility?.years || [3, 4]
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
        setLoadError(getErrorMessage(err, 'Could not load placement drives.'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user, reloadKey]);

  const isBranchMatch = (studentBranch, eligibleBranches) => {
    if (!eligibleBranches || eligibleBranches.length === 0) return true;
    if (!studentBranch) return true;
    const sBranch = studentBranch.trim().toUpperCase();
    const cseKeywords = ['CSE', 'CS', 'COMPUTER SCIENCE', 'COMPUTER SCIENCE & ENGINEERING', 'COMPUTER ENGINEERING'];
    const itKeywords = ['IT', 'INFORMATION TECHNOLOGY'];
    const eceKeywords = ['ECE', 'ELECTRONICS', 'ELECTRONICS & COMMUNICATION', 'ELECTRONICS AND COMMUNICATION'];
    const eeeKeywords = ['EEE', 'ELECTRICAL', 'ELECTRICAL & ELECTRONICS', 'ELECTRICAL AND ELECTRONICS'];
    const mechKeywords = ['MECH', 'MECHANICAL', 'MECHANICAL ENGINEERING'];
    const civilKeywords = ['CIVIL', 'CIVIL ENGINEERING'];

    const getGroup = (b) => {
      const ub = b.trim().toUpperCase();
      if (cseKeywords.some(k => ub === k || ub.includes(k))) return 'CSE';
      if (itKeywords.some(k => ub === k || ub.includes(k))) return 'IT';
      if (eceKeywords.some(k => ub === k || ub.includes(k))) return 'ECE';
      if (eeeKeywords.some(k => ub === k || ub.includes(k))) return 'EEE';
      if (mechKeywords.some(k => ub === k || ub.includes(k))) return 'MECH';
      if (civilKeywords.some(k => ub === k || ub.includes(k))) return 'CIVIL';
      return ub;
    };

    const studentGroup = getGroup(sBranch);
    return eligibleBranches.some(eb => {
      const ebUpper = eb.trim().toUpperCase();
      if (ebUpper === 'ALL' || ebUpper === 'ANY' || ebUpper === 'OPEN TO ALL') return true;
      if (ebUpper === sBranch) return true;
      return getGroup(ebUpper) === studentGroup;
    });
  };

  const isYearMatch = (studentYear, eligibleYears) => {
    if (!eligibleYears || eligibleYears.length === 0) return true;
    if (!studentYear) return true;
    const sYear = parseInt(studentYear);
    return eligibleYears.some(ey => {
      const num = parseInt(ey);
      if (num === sYear) return true;
      if (sYear === 4 && (num === 2026 || num === 2027)) return true;
      if (sYear === 3 && (num === 2027 || num === 2028)) return true;
      if (sYear === 2 && (num === 2028 || num === 2029)) return true;
      if (sYear === 1 && (num === 2029 || num === 2030)) return true;
      return false;
    });
  };

  const checkEligibility = (job) => {
    if (!user) return { eligible: false, reason: 'Not logged in' };
    
    const userCgpa = user.cgpa !== undefined && user.cgpa !== null ? parseFloat(user.cgpa) : 10;
    const minCgpa = job.eligibility?.minCgpa !== undefined ? parseFloat(job.eligibility.minCgpa) : 0;
    const cgpaEligible = isNaN(userCgpa) || userCgpa >= minCgpa;
    const branchEligible = isBranchMatch(user.branch, job.eligibility?.eligibleBranches);
    const yearEligible = isYearMatch(user.year, job.eligibility?.eligibleYears);

    if (!cgpaEligible || !branchEligible || !yearEligible) {
      return { eligible: false };
    }

    return { eligible: true };
  };

  const filteredJobs = jobs.filter(job => {
    const { eligible } = checkEligibility(job);
    if (!eligible) return false;

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
    <div className="space-y-8 animate-in fade-in duration-300 text-[#4B5563]">
      {/* Welcome Banner */}
      <div className="bg-white border border-[#E5E7EB] p-5 sm:p-8 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-sm">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-[#111827] tracking-tight">
            Available Placement Drives
          </h1>
          <p className="text-xs text-[#4B5563] font-medium mt-1.5 leading-relaxed">
            Hi <span className="text-[#22C55E] bg-[#22C55E]/10 border border-[#22C55E]/20 px-2 py-0.5 rounded font-bold">{user?.name || 'Student'}</span>! Showing active jobs for branch (<strong className="text-[#111827]">{user?.branch || 'All Branches'}</strong>) and CGPA (<strong className="text-[#111827]">{user?.cgpa || 'N/A'}</strong>).
          </p>
        </div>
        <div className="flex items-center gap-2 bg-[#22C55E]/10 px-4 py-2 rounded-xl border border-[#22C55E]/20 text-xs text-[#22C55E] font-semibold shadow-sm">
          <span className="h-2 w-2 rounded-full bg-[#22C55E] animate-pulse" />
          <span>Matching Active Drives</span>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
        {/* Search */}
        <div className="md:col-span-2 relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#94A3B8]">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder="Search role, company or keywords..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-11 pr-4 py-2.5 bg-white border border-[#E5E7EB] focus:bg-[#F8FAFC] rounded-xl text-[#111827] placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-[#0B3D91]/10 focus:border-[#0B3D91] transition-all text-xs font-semibold"
          />
        </div>

        {/* Salary filter */}
        <div className="relative">
          <select
            value={salaryFilter}
            onChange={(e) => setSalaryFilter(e.target.value)}
            className="block w-full px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-xl text-[#4B5563] focus:outline-none focus:ring-4 focus:ring-[#0B3D91]/10 focus:border-[#0B3D91] transition-all text-xs font-semibold"
          >
            <option value="all" className="bg-white text-[#4B5563]">All CTC Packages</option>
            <option value="high" className="bg-white text-[#4B5563]">Super Dream (20+ LPA)</option>
            <option value="mid" className="bg-white text-[#4B5563]">Dream Jobs (5 - 20 LPA)</option>
            <option value="entry" className="bg-white text-[#4B5563]">Regular (Below 5 LPA)</option>
          </select>
        </div>
      </div>

      {/* Grid of Job Cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6" role="status" aria-label="Loading drives">
          {[0, 1, 2].map((i) => (
            <div key={i} className="pc-card p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="pc-skeleton h-10 w-10 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <div className="pc-skeleton h-3 w-1/3" />
                  <div className="pc-skeleton h-4 w-2/3" />
                </div>
              </div>
              <div className="pc-skeleton h-3 w-full" />
              <div className="pc-skeleton h-3 w-5/6" />
              <div className="pc-skeleton h-9 w-full rounded-xl" />
            </div>
          ))}
        </div>
      ) : loadError ? (
        <div className="pc-alert-error" role="alert">
          <span className="font-bold" aria-hidden="true">!</span>
          <div className="flex-1">
            <p>{loadError}</p>
            <button type="button" onClick={() => setReloadKey((k) => k + 1)} className="mt-2 text-xs font-bold underline">
              Try again
            </button>
          </div>
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="pc-empty">
          <p className="text-[#111827] text-sm font-semibold">
            {jobs.length === 0 ? 'No placement drives are open right now.' : 'No drives match your search or filters.'}
          </p>
          <p className="text-xs">
            {jobs.length === 0 ? 'New drives appear here as soon as the Placement Cell publishes them.' : 'Try a different keyword or package range.'}
          </p>
          {(salaryFilter !== 'all' || searchTerm) && (
            <button
              type="button"
              onClick={() => { setSalaryFilter('all'); setSearchTerm(''); }}
              className="pc-btn-secondary mt-2 text-xs"
            >
              Reset filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredJobs.map((job) => {
            const { eligible, reason } = checkEligibility(job);
            const appliedStatus = getApplicationStatus(job.id);
            const urgentDeadline = isDeadlineClose(job.deadline);

            return (
              <div 
                key={job.id} 
                className={`rounded-xl flex flex-col justify-between overflow-hidden shadow-sm border relative transition-all duration-300 ${
                  eligible 
                    ? 'bg-white border-[#E5E7EB] hover:border-[#22C55E]/40 hover:shadow-xl' 
                    : 'bg-[#F8FAFC]/70 border-[#E5E7EB] opacity-70'
                }`}
              >
                {/* Header info - increased padding to p-5 sm:p-8 */}
                <div className="p-6 md:p-8 space-y-5">
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex items-center gap-3.5">
                      <div className="h-10 w-10 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB] flex items-center justify-center font-bold text-[#0B3D91] text-xs flex-shrink-0 shadow-sm">
                        {job.companyName.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="text-[10px] text-[#94A3B8] font-bold uppercase tracking-wider">{job.companyName}</h4>
                        <h3 className="text-sm font-bold text-[#111827] group-hover:text-[#22C55E] truncate max-w-[150px] mt-0.5">
                          {job.title}
                        </h3>
                      </div>
                    </div>

                    {/* Status Badge */}
                    {appliedStatus ? (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/20">
                        {appliedStatus}
                      </span>
                    ) : !eligible ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold bg-[#F8FAFC] text-[#94A3B8] border border-[#E5E7EB]">
                        Ineligible
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/20">
                        Active
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-[#4B5563] leading-relaxed line-clamp-2 font-medium">
                    {job.description}
                  </p>

                  {/* Highlights Grid */}
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[#E5E7EB]">
                    <div className="flex items-center gap-2 text-xs text-[#4B5563]">
                      <DollarSign className="w-4 h-4 text-[#22C55E] flex-shrink-0" />
                      <div>
                        <p className="text-[9px] text-[#94A3B8] font-bold uppercase leading-none">Package</p>
                        <p className="font-bold text-[#111827] mt-1">{job.package} LPA</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-[#4B5563]">
                      <Award className="w-4 h-4 text-[#22C55E] flex-shrink-0" />
                      <div>
                        <p className="text-[9px] text-[#94A3B8] font-bold uppercase leading-none">Min CGPA</p>
                        <p className="font-bold text-[#111827] mt-1">{job.eligibility.minCgpa} CGPA</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Action Area */}
                <div className="px-6 md:px-8 py-4 bg-[#F8FAFC] border-t border-[#E5E7EB] flex items-center justify-between gap-3 mt-auto">
                  <span className={`text-[10px] flex items-center gap-1.5 font-semibold ${
                    urgentDeadline ? 'text-rose-600 animate-pulse' : 'text-[#94A3B8]'
                  }`}>
                    <Calendar className="w-4 h-4" />
                    Deadline: {formatDate(job.deadline)}
                  </span>
                  
                  {eligible ? (
                    <Link
                      to={`/job/${job.id}`}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-[#22C55E] hover:text-[#16A34A] transition-colors"
                    >
                      View Details
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </Link>
                  ) : (
                    <span 
                      className="text-[10px] text-rose-600 max-w-[150px] truncate leading-tight font-bold"
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
