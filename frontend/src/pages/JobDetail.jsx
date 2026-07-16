import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, DollarSign, Award, Calendar, ChevronRight, CheckCircle2, AlertTriangle, ShieldCheck, ShieldAlert } from 'lucide-react';
import { useSelector } from 'react-redux';
import api from '../utils/api';

const JobDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);
  
  const [job, setJob] = useState(null);
  const [application, setApplication] = useState(null);
  const [error, setError] = useState('');
  const [isApplying, setIsApplying] = useState(false);
  const [applySuccess, setApplySuccess] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const jobResponse = await api.get(`/api/jobs/${id}`);
        const jobData = jobResponse.data;
        if (jobData.job) {
          const mappedJob = {
            ...jobData.job,
            id: jobData.job._id,
            companyName: jobData.job.companyId?.name || "Company",
            eligibility: {
              minCgpa: jobData.job.eligibility?.cgpa !== undefined ? jobData.job.eligibility.cgpa : 6.0,
              eligibleBranches: jobData.job.eligibility?.branches || ['CSE', 'IT', 'ECE'],
              eligibleYears: jobData.job.eligibility?.years || [4]
            }
          };
          setJob(mappedJob);
        } else {
          setError('Placement drive not found');
        }

        const appsResponse = await api.get('/api/applications/my-applications');
        const appsData = appsResponse.data;
        const existingApp = (appsData.applications || []).find(
          a => (a.jobId?._id || a.jobId) === id
        );
        if (existingApp) {
          setApplication(existingApp);
        }
      } catch (err) {
        console.error("Error fetching job details:", err);
        setError('Failed to fetch details from server');
      }
    };

    if (id && user) {
      fetchData();
    }
  }, [id, user]);

  const checkEligibility = () => {
    if (!job || !user) return { eligible: false };
    const cgpaEligible = user.cgpa >= job.eligibility.minCgpa;
    const branchEligible = job.eligibility.eligibleBranches.some(
      b => b.toUpperCase() === user.branch.toUpperCase()
    );
    return {
      eligible: cgpaEligible && branchEligible,
      cgpaEligible,
      branchEligible
    };
  };

  const handleApply = async () => {
    if (!job) return;
    setError('');
    setIsApplying(true);

    try {
      const response = await api.post(`/api/jobs/${job.id}/apply`);
      const data = response.data;

      setApplication(data.application || { status: 'Applied' });
      setApplySuccess(true);
      setTimeout(() => setApplySuccess(false), 4000);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to submit application');
    } finally {
      setIsApplying(false);
    }
  };

  if (error && !job) {
    return (
      <div className="space-y-6 py-16 max-w-md mx-auto text-center">
        <div className="bg-rose-50 border border-rose-100 text-rose-600 p-5 rounded-2xl flex items-center gap-3 justify-center">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <p className="font-semibold">{error}</p>
        </div>
        <Link to="/jobs" className="inline-flex items-center text-xs font-bold text-emerald-600 hover:underline">
          <ArrowLeft className="w-4 h-4 mr-1.5" /> Return to Listings
        </Link>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="flex-grow flex items-center justify-center py-24">
        <div className="animate-spin rounded-full h-11 w-11 border-t-2 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  const { eligible, cgpaEligible, branchEligible } = checkEligibility();

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300 text-[#4B5563]">
      {/* Back Button */}
      <div>
        <Link 
          to="/jobs" 
          className="inline-flex items-center gap-2 text-xs font-semibold text-[#94A3B8] hover:text-[#4B5563] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Listings
        </Link>
      </div>

      {applySuccess && (
        <div className="bg-[#22C55E]/10 border border-[#22C55E]/20 text-[#22C55E] p-5 rounded-xl flex items-center gap-3 text-xs animate-in fade-in duration-300">
          <CheckCircle2 className="w-5 h-5 text-[#22C55E] flex-shrink-0" />
          <p className="font-semibold">Application Submitted Successfully! Recruiter notification triggered. You can track this in 'My Applications'.</p>
        </div>
      )}

      {/* Main Drive Info Panel */}
      <div className="bg-white border border-[#E5E7EB] rounded-2xl overflow-hidden shadow-sm">
        {/* Banner area */}
        <div className="bg-[#F8FAFC] p-8 md:p-10 border-b border-[#E5E7EB]">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-white border border-[#E5E7EB] flex items-center justify-center font-bold text-[#7C3AED] text-sm flex-shrink-0 shadow-sm">
                {job.companyName.substring(0, 2).toUpperCase()}
              </div>
              <div className="space-y-1">
                <span className="text-[10px] bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/20 px-3 py-1 rounded-full font-bold">
                  {job.companyName} Drive 2026
                </span>
                <h1 className="text-xl font-bold text-[#111827] tracking-tight mt-1">{job.title}</h1>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="flex gap-4 font-semibold">
              <div className="bg-white p-4 rounded-xl border border-[#E5E7EB] text-center min-w-[100px] shadow-sm">
                <p className="text-[10px] text-[#94A3B8] uppercase font-bold tracking-wider">Package</p>
                <p className="text-sm font-bold text-[#111827] mt-1">{job.package} LPA</p>
              </div>
              <div className="bg-white p-4 rounded-xl border border-[#E5E7EB] text-center min-w-[100px] shadow-sm">
                <p className="text-[10px] text-[#94A3B8] uppercase font-bold tracking-wider">Cut-off</p>
                <p className="text-sm font-bold text-[#22C55E] mt-1">{job.eligibility.minCgpa} CGPA</p>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Layout */}
        <div className="p-8 md:p-10 grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Left / Center content */}
          <div className="lg:col-span-2 space-y-8">
            <div className="space-y-3.5">
              <h3 className="text-xs font-bold text-[#111827] uppercase tracking-wider">About the Role</h3>
              <p className="text-xs text-[#4B5563] leading-relaxed font-semibold">{job.details || job.description || 'No additional details provided.'}</p>
            </div>

            <div className="space-y-3.5">
              <h3 className="text-xs font-bold text-[#111827] uppercase tracking-wider">Job Description Overview</h3>
              <p className="text-xs text-[#4B5563] leading-relaxed font-semibold">{job.description}</p>
            </div>

            {/* Selection Stages */}
            <div className="space-y-5">
              <h3 className="text-xs font-bold text-[#111827] uppercase tracking-wider">Interview & Evaluation Stages</h3>
              <div className="space-y-3">
                {(job.rounds || ['Aptitude & Coding Test', 'Group Discussion (GD)', 'Technical Interview', 'HR Evaluation']).map((round, index) => (
                  <div key={index} className="flex items-center gap-4 bg-[#F8FAFC] border border-[#E5E7EB] p-4 rounded-xl">
                    <span className="h-6 w-6 rounded-lg bg-white border border-[#E5E7EB] flex items-center justify-center font-mono text-xs font-bold text-[#22C55E] shadow-sm">
                      {index + 1}
                    </span>
                    <span className="text-xs font-bold text-[#4B5563]">{round}</span>
                    <ChevronRight className="w-4 h-4 text-[#94A3B8] ml-auto" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right sidebar: Eligibility check, Apply action */}
          <div className="space-y-8 border-t lg:border-t-0 lg:border-l border-[#E5E7EB] pt-8 lg:pt-0 lg:pl-10">
            {/* Eligibility widget */}
            <div className="space-y-4">
              <h3 className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest">Eligibility Check</h3>
              
              <div className={`p-5 rounded-xl border space-y-4 shadow-sm ${
                eligible ? 'border-[#22C55E]/20 bg-[#22C55E]/5' : 'border-rose-200 bg-rose-50'
              }`}>
                {eligible ? (
                  <div className="flex items-center gap-2 text-[#22C55E] text-xs font-bold">
                    <ShieldCheck className="w-4 h-4" /> Eligible to Apply
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-rose-600 text-xs font-bold">
                    <ShieldAlert className="w-4 h-4" /> Not Eligible
                  </div>
                )}

                <div className="space-y-3 text-xs font-semibold">
                  <div className="flex justify-between items-center">
                    <span className="text-[#94A3B8]">CGPA Requirement</span>
                    <span className={`font-bold ${cgpaEligible ? 'text-[#22C55E]' : 'text-rose-600'}`}>
                      {job.eligibility.minCgpa} (You: {user.cgpa})
                    </span>
                  </div>
                  <div className="flex justify-between items-start">
                    <span className="text-[#94A3B8] font-semibold">Eligible Branches</span>
                    <span className={`font-bold text-right max-w-[140px] truncate ${branchEligible ? 'text-[#22C55E]' : 'text-rose-600'}`} title={job.eligibility.eligibleBranches.join(', ')}>
                      {job.eligibility.eligibleBranches.join(', ')} (You: {user.branch})
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Deadline box */}
            <div className="bg-[#F8FAFC] border border-[#E5E7EB] p-5 rounded-xl space-y-2 flex items-center gap-3">
              <Calendar className="w-5 h-5 text-[#22C55E] flex-shrink-0" />
              <div>
                <p className="text-[9px] text-[#94A3B8] uppercase font-bold tracking-wider leading-none">Apply Before</p>
                <p className="text-xs font-bold text-[#111827] mt-1.5">
                  {new Date(job.deadline).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
            </div>

            {/* Action Button */}
            <div className="pt-2 font-semibold">
              {application ? (
                <div className="space-y-4">
                  <div className="p-5 bg-[#22C55E]/10 border border-[#22C55E]/20 rounded-xl text-center">
                    <CheckCircle2 className="w-6 h-6 text-[#22C55E] mx-auto" />
                    <p className="text-xs font-bold text-[#111827] mt-2">You Have Applied</p>
                    <p className="text-[10px] text-[#4B5563] mt-1">Status: <span className="text-[#22C55E] font-bold">{application.status}</span></p>
                  </div>
                  <button
                    onClick={() => navigate('/applications')}
                    className="w-full py-2.5 bg-white hover:bg-[#F8FAFC] text-[#4B5563] rounded-xl text-xs font-bold border border-[#E5E7EB] transition-all shadow-sm active:scale-[0.98]"
                  >
                    Track Progress
                  </button>
                </div>
              ) : eligible ? (
                <button
                  onClick={handleApply}
                  disabled={isApplying}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-[#22C55E] hover:bg-[#16A34A] text-white font-bold rounded-xl text-xs transition-all shadow-md disabled:opacity-55 disabled:cursor-not-allowed active:scale-[0.98]"
                >
                  {isApplying ? (
                    <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    'Submit Application'
                  )}
                </button>
              ) : (
                <button
                  disabled
                  className="w-full py-3 px-4 bg-[#F8FAFC] border border-[#E5E7EB] text-[#94A3B8] font-bold rounded-xl text-xs cursor-not-allowed"
                >
                  Ineligible for this Drive
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobDetail;
