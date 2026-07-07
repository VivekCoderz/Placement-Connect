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
        <Link to="/" className="inline-flex items-center text-xs font-bold text-emerald-600 hover:underline">
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
    <div className="w-full max-w-4xl mx-auto space-y-8"> {/* Expanded spacing */}
      {/* Back Button */}
      <div>
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Listings
        </Link>
      </div>

      {applySuccess && (
        <div className="bg-emerald-50 border border-emerald-255 text-emerald-700 p-5 rounded-2xl flex items-center gap-3.5 text-sm animate-in fade-in duration-300">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <p className="font-semibold">Application Submitted Successfully! Recruiter notification triggered. You can track this in 'My Applications'.</p>
        </div>
      )}

      {/* Main Drive Info Panel - light theme updates */}
      <div className="bg-white border border-slate-205 rounded-3xl overflow-hidden shadow-sm">
        {/* Banner area */}
        <div className="bg-gradient-to-r from-emerald-50 via-slate-50 to-white p-8 md:p-10 border-b border-slate-200">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex items-center gap-4.5">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-555 flex items-center justify-center font-extrabold text-white text-xl shadow-xl shadow-emerald-500/10 border border-emerald-400/20 flex-shrink-0">
                {job.companyName.substring(0, 2).toUpperCase()}
              </div>
              <div className="space-y-1.5">
                <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-full font-bold">
                  {job.companyName} Drive 2026
                </span>
                <h1 className="text-xl md:text-2xl font-extrabold text-slate-800 tracking-tight mt-1">{job.title}</h1>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="flex gap-4">
              <div className="bg-white p-4 rounded-xl border border-slate-200 text-center min-w-[100px] shadow-sm">
                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Package</p>
                <p className="text-sm font-extrabold text-slate-800 mt-1">{job.package} LPA</p>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200 text-center min-w-[100px] shadow-sm">
                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Cut-off</p>
                <p className="text-sm font-extrabold text-emerald-600 mt-1">{job.eligibility.minCgpa} CGPA</p>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Layout - Expanded padding to p-10 and gap to gap-10 */}
        <div className="p-8 md:p-10 grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Left / Center content */}
          <div className="lg:col-span-2 space-y-8">
            <div className="space-y-3.5">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">About the Role</h3>
              <p className="text-xs text-slate-550 leading-relaxed font-semibold">{job.details || job.description || 'No additional details provided.'}</p>
            </div>

            <div className="space-y-3.5">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Job Description Overview</h3>
              <p className="text-xs text-slate-550 leading-relaxed font-semibold">{job.description}</p>
            </div>

            {/* Selection Rounds */}
            <div className="space-y-5">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Interview & Evaluation Stages</h3>
              <div className="space-y-3">
                {(job.rounds || ['Aptitude & Coding Test', 'Group Discussion (GD)', 'Technical Interview', 'HR Evaluation']).map((round, index) => (
                  <div key={index} className="flex items-center gap-4 bg-slate-50 border border-slate-200/60 p-4 rounded-2xl">
                    <span className="h-7 w-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center font-mono text-xs font-bold text-emerald-600">
                      {index + 1}
                    </span>
                    <span className="text-xs font-bold text-slate-700">{round}</span>
                    <ChevronRight className="w-4 h-4 text-slate-400 ml-auto" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right sidebar: Eligibility check, Apply action */}
          <div className="space-y-8 border-t lg:border-t-0 lg:border-l border-slate-200 pt-8 lg:pt-0 lg:pl-10">
            {/* Eligibility widget */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Eligibility Check</h3>
              
              <div className={`p-5 rounded-2xl border space-y-4 bg-white shadow-sm ${
                eligible ? 'border-emerald-200 bg-emerald-50/10' : 'border-rose-100 bg-rose-50/10'
              }`}>
                {eligible ? (
                  <div className="flex items-center gap-2 text-emerald-600 text-xs font-extrabold">
                    <ShieldCheck className="w-4.5 h-4.5" /> Eligible to Apply
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-rose-500 text-xs font-extrabold">
                    <ShieldAlert className="w-4.5 h-4.5" /> Not Eligible
                  </div>
                )}

                <div className="space-y-3 text-xs font-semibold">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-450">CGPA Requirement</span>
                    <span className={`font-bold ${cgpaEligible ? 'text-emerald-600' : 'text-rose-500'}`}>
                      {job.eligibility.minCgpa} (You: {user.cgpa})
                    </span>
                  </div>
                  <div className="flex justify-between items-start">
                    <span className="text-slate-450">Eligible Branches</span>
                    <span className={`font-bold text-right max-w-[140px] truncate ${branchEligible ? 'text-emerald-650' : 'text-rose-500'}`} title={job.eligibility.eligibleBranches.join(', ')}>
                      {job.eligibility.eligibleBranches.join(', ')} (You: {user.branch})
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Deadline box */}
            <div className="bg-slate-50 p-5 border border-slate-200 rounded-2xl space-y-2 flex items-center gap-3">
              <Calendar className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <div>
                <p className="text-[10px] text-slate-450 uppercase font-bold tracking-wider leading-none">Apply Before</p>
                <p className="text-xs font-bold text-slate-700 mt-1.5">
                  {new Date(job.deadline).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
            </div>

            {/* Action Button */}
            <div className="pt-2">
              {application ? (
                <div className="space-y-4">
                  <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-2xl text-center">
                    <CheckCircle2 className="w-7 h-7 text-emerald-600 mx-auto animate-bounce" />
                    <p className="text-xs font-bold text-slate-800 mt-2">You Have Applied</p>
                    <p className="text-[10px] text-slate-500 mt-1 font-semibold">Status: <span className="text-emerald-600 font-extrabold">{application.status}</span></p>
                  </div>
                  <button
                    onClick={() => navigate('/applications')}
                    className="w-full py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold border border-slate-200 transition-colors shadow-sm"
                  >
                    Track Progress
                  </button>
                </div>
              ) : eligible ? (
                <button
                  onClick={handleApply}
                  disabled={isApplying}
                  className="w-full flex items-center justify-center gap-2 py-4 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-emerald-600/10 disabled:opacity-55 disabled:cursor-not-allowed hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]"
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
                  className="w-full py-4 px-4 bg-slate-100 border border-slate-200 text-slate-400 font-bold rounded-xl text-xs cursor-not-allowed"
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
