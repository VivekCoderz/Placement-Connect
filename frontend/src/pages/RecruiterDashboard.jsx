import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  Building2, Briefcase, Users, Calendar, DollarSign, Award, Plus, Check, Eye, FileText, ArrowRight, Clock, MapPin, 
  Globe, Phone, User, AlertCircle, RefreshCw, CheckCircle2, XCircle, ChevronRight, Download
} from 'lucide-react';
import { setUser } from '../redux/authSlice';
import api from '../utils/api';

const RecruiterDashboard = () => {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  
  const [activeTab, setActiveTab] = useState('openings'); // openings | post
  const [drives, setDrives] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [applicants, setApplicants] = useState([]);
  const [isLoadingJobs, setIsLoadingJobs] = useState(false);
  const [isLoadingApplicants, setIsLoadingApplicants] = useState(false);
  const [submittingJob, setSubmittingJob] = useState(false);
  const [actionSuccess, setActionSuccess] = useState('');
  
  // Job Post Form State
  const [jobForm, setJobForm] = useState({
    title: '',
    description: '',
    package: '',
    minCgpa: '6.0',
    deadline: '',
    branches: {
      CSE: true,
      ECE: true,
      EEE: false,
      IT: true,
      MECH: false,
      CIVIL: false
    },
    years: {
      '3': false,
      '4': true
    }
  });

  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // Fetch drives posted by recruiter
  const fetchMyDrives = async () => {
    setIsLoadingJobs(true);
    try {
      const response = await api.get('/api/auth/me');
      const data = response.data;
      if (response.status === 200) {
        const combinedUser = {
          ...data.data.user,
          ...data.data.details,
          id: data.data.user._id || data.data.user.id
        };
        dispatch(setUser(combinedUser));
        setDrives(data.data.details?.jobPostings || []);
      }
    } catch (err) {
      console.error('Failed to load job postings:', err);
    } finally {
      setIsLoadingJobs(false);
    }
  };

  useEffect(() => {
    fetchMyDrives();
  }, []);

  const handleFetchApplicants = async (job) => {
    setSelectedJob(job);
    setIsLoadingApplicants(true);
    setApplicants([]);
    try {
      const response = await api.get(`/api/company/applications/${job._id}`);
      setApplicants(response.data.applications || []);
    } catch (err) {
      console.error('Failed to load applicants:', err);
    } finally {
      setIsLoadingApplicants(false);
    }
  };

  const handleUpdateStatus = async (appId, status) => {
    setActionSuccess('');
    try {
      const response = await api.put(`/api/applications/${appId}/status`, { status });
      if (response.status === 200) {
        setActionSuccess(`Application status successfully updated to ${status}!`);
        if (selectedJob) {
          handleFetchApplicants(selectedJob);
        }
        setTimeout(() => setActionSuccess(''), 4000);
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Status update failed');
    }
  };

  const handleCheckboxChange = (category, field) => {
    setJobForm(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: !prev[category][field]
      }
    }));
  };

  const handlePostJob = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    const { title, description, package: pkg, minCgpa, deadline, branches, years } = jobForm;
    if (!title || !description || !pkg || !deadline) {
      setFormError('Please fill in all fields');
      return;
    }

    const eligibleBranches = Object.keys(branches).filter(k => branches[k]);
    const eligibleYears = Object.keys(years).filter(k => years[k]).map(Number);

    if (eligibleBranches.length === 0) {
      setFormError('Please select at least one eligible branch');
      return;
    }
    if (eligibleYears.length === 0) {
      setFormError('Please select at least one eligible batch year');
      return;
    }

    setSubmittingJob(true);
    try {
      const payload = {
        title,
        description,
        package: parseFloat(pkg),
        eligibility: {
          cgpa: parseFloat(minCgpa),
          branches: eligibleBranches,
          years: eligibleYears
        },
        deadline: deadline
      };

      const response = await api.post('/api/company/jobs', payload);
      if (response.status === 201) {
        setFormSuccess('Placement drive job posted and notifications pushed to eligible students successfully!');
        setJobForm({
          title: '',
          description: '',
          package: '',
          minCgpa: '6.0',
          deadline: '',
          branches: { CSE: true, ECE: true, EEE: false, IT: true, MECH: false, CIVIL: false },
          years: { '3': false, '4': true }
        });
        fetchMyDrives();
        setTimeout(() => {
          setFormSuccess('');
          setActiveTab('openings');
        }, 3000);
      }
    } catch (err) {
      setFormError(err.response?.data?.message || err.message || 'Failed to post drive');
    } finally {
      setSubmittingJob(false);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 font-sans px-4 sm:px-6 py-6">
      
      {/* Recruiter Welcome Header - High Fidelity Emerald Dashboard Card */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 text-white rounded-[2rem] p-8 md:p-10 border border-slate-800 shadow-2xl flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[150px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-teal-500/10 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="relative z-10 space-y-5 flex-1">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 ring-1 ring-white/20">
              <Building2 className="w-8 h-8 text-slate-950" />
            </div>
            <div>
              <span className="text-[10px] font-black text-emerald-450 uppercase tracking-widest bg-emerald-950/60 border border-emerald-800/40 px-3 py-1 rounded-full">Recruiter Portal</span>
              <h1 className="text-3xl font-black tracking-tight text-white mt-2">{user?.name || 'Recruiter'}</h1>
              <p className="text-slate-450 font-bold text-sm mt-1">{user?.recruiterEmail || 'Corporate Account'}</p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3 pt-2 text-slate-300 text-xs font-bold border-t border-slate-800/60 w-full">
            {user?.industry && (
              <span className="flex items-center gap-2 bg-slate-950/30 px-3 py-1.5 rounded-xl border border-slate-800/30">
                <Briefcase className="w-4 h-4 text-emerald-400" /> {user.industry}
              </span>
            )}
            {user?.website && (
              <a href={user.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-slate-950/30 px-3 py-1.5 rounded-xl border border-slate-800/30 hover:text-emerald-400 hover:border-emerald-500/30 transition-all">
                <Globe className="w-4 h-4 text-emerald-400" /> Company Website
              </a>
            )}
            {user?.hrContactPhone && (
              <span className="flex items-center gap-2 bg-slate-950/30 px-3 py-1.5 rounded-xl border border-slate-800/30">
                <Phone className="w-4 h-4 text-emerald-400" /> {user.hrContactPhone}
              </span>
            )}
          </div>
        </div>

        {/* Stats card */}
        <div className="relative z-10 flex items-center gap-5 bg-slate-950/50 backdrop-blur-xl p-6 px-8 rounded-2xl border border-slate-800/80 shadow-2xl self-stretch lg:self-auto min-w-[200px] justify-center text-center">
          <div>
            <p className="text-[10px] font-black text-slate-450 uppercase tracking-widest">Active Openings</p>
            <p className="text-5xl font-black bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent mt-2 tracking-tight">{drives.length}</p>
          </div>
        </div>
      </div>

      {/* Main Tabs - Glassmorphic design (Emerald aligned) */}
      <div className="flex bg-slate-100/80 backdrop-blur-md p-1.5 rounded-2xl border border-slate-200/60 max-w-sm">
        <button
          onClick={() => { setActiveTab('openings'); setSelectedJob(null); }}
          className={`flex-1 flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 ${
            activeTab === 'openings'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/10'
              : 'text-slate-550 hover:text-slate-900'
          }`}
        >
          <Briefcase className="w-4 h-4" />
          Job Drives
        </button>
        <button
          onClick={() => { setActiveTab('post'); setSelectedJob(null); }}
          className={`flex-1 flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 ${
            activeTab === 'post'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/10'
              : 'text-slate-550 hover:text-slate-900'
          }`}
        >
          <Plus className="w-4 h-4" />
          Post Drive
        </button>
      </div>

      {/* Tabs Content */}
      {activeTab === 'openings' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Drives List Panel */}
          <div className="lg:col-span-1 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black text-slate-800 tracking-tight">Your Placement Drives</h2>
              <button 
                onClick={fetchMyDrives} 
                className="p-2 hover:bg-slate-100 rounded-xl text-slate-550 transition-colors border border-slate-200/40 shadow-sm"
                title="Refresh Openings"
              >
                <RefreshCw className={`w-4 h-4 ${isLoadingJobs ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {isLoadingJobs && drives.length === 0 ? (
              <div className="flex justify-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-slate-900"></div>
              </div>
            ) : drives.length === 0 ? (
              <div className="bg-white border border-slate-200 p-10 text-center rounded-[2rem] shadow-sm">
                <div className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-4 border border-slate-200/50">
                  <Briefcase className="w-6 h-6 text-slate-450" />
                </div>
                <p className="text-sm font-bold text-slate-500">No job openings posted yet.</p>
                <button 
                  onClick={() => setActiveTab('post')} 
                  className="text-xs font-black text-emerald-600 hover:text-emerald-500 mt-3 inline-flex items-center gap-1 group"
                >
                  Post your first drive <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {drives.map((job) => {
                  const isSelected = selectedJob?._id === job._id;
                  const deadlineDate = new Date(job.deadline);
                  const isExpired = deadlineDate < new Date();
                  
                  return (
                    <div
                      key={job._id}
                      onClick={() => handleFetchApplicants(job)}
                      className={`p-6 rounded-[1.8rem] border transition-all duration-300 cursor-pointer ${
                        isSelected 
                          ? 'bg-emerald-650 border-emerald-700 text-white shadow-xl shadow-emerald-600/10' 
                          : 'bg-white border-slate-200 hover:border-slate-350 shadow-sm'
                      }`}
                    >
                      <div className="space-y-3.5">
                        <div className="flex justify-between items-start gap-2">
                          <h3 className="font-extrabold text-sm tracking-tight leading-snug">{job.title}</h3>
                          <span className={`text-[9px] px-2.5 py-1 rounded-full font-black uppercase tracking-wider ${
                            isExpired 
                              ? (isSelected ? 'bg-emerald-800 text-rose-300' : 'bg-rose-500/10 text-rose-600') 
                              : (isSelected ? 'bg-emerald-800 text-teal-300' : 'bg-emerald-500/10 text-emerald-600')
                          }`}>
                            {isExpired ? 'Expired' : 'Active'}
                          </span>
                        </div>
                        
                        <div className={`flex items-center gap-4 text-[11px] font-bold ${
                          isSelected ? 'text-emerald-100' : 'text-slate-500'
                        }`}>
                          <span className="flex items-center gap-1.5"><DollarSign className="w-4 h-4" /> {job.package} LPA</span>
                          <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> {deadlineDate.toLocaleDateString()}</span>
                        </div>

                        <div className={`flex justify-between items-center pt-3 border-t mt-3 text-[10px] font-black uppercase tracking-wider ${
                          isSelected ? 'border-emerald-600 text-emerald-250' : 'border-slate-100 text-slate-400'
                        }`}>
                          <span>Min CGPA: {job.eligibility?.cgpa}</span>
                          <span className={`${isSelected ? 'text-white' : 'text-emerald-600'} flex items-center gap-1 group`}>
                            Applicants <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Applicants Management Panel */}
          <div className="lg:col-span-2 space-y-6">
            {selectedJob ? (
              <div className="bg-white rounded-[2rem] border border-slate-200 p-6 md:p-8 space-y-8 shadow-sm">
                {/* Header */}
                <div className="border-b border-slate-200/80 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Candidate Evaluation</span>
                    <h2 className="text-xl font-black text-slate-850 tracking-tight mt-1">{selectedJob.title}</h2>
                    <p className="text-xs text-slate-450 font-semibold mt-1">Review student profile cards, credentials, portfolios and download resume.</p>
                  </div>
                </div>

                {actionSuccess && (
                  <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 p-4 rounded-xl flex items-center gap-3 animate-slide-up">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                    <p className="text-xs font-extrabold leading-normal">{actionSuccess}</p>
                  </div>
                )}

                {/* Applicants Grid */}
                {isLoadingApplicants ? (
                  <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-slate-900"></div>
                  </div>
                ) : applicants.length === 0 ? (
                  <div className="text-center py-16">
                    <Users className="w-12 h-12 text-slate-350 mx-auto mb-3" />
                    <p className="text-sm font-bold text-slate-500">No students have applied to this drive yet.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {applicants.map((app) => {
                      const student = app.studentId || {};
                      
                      return (
                        <div key={app._id} className="p-6 rounded-[1.8rem] border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-slate-300 hover:shadow-lg hover:shadow-slate-100/50 transition-all duration-300 space-y-5">
                          {/* Student Info */}
                          <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                            <div className="space-y-1">
                              <h4 className="font-black text-slate-800 text-base">{student.name}</h4>
                              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-500 font-bold">
                                <span className="bg-slate-200/55 px-2 py-0.5 rounded-md">Roll: {student.rollNumber}</span>
                                <span>Branch: {student.branch}</span>
                                <span>Year: {student.year}</span>
                                <span className="bg-emerald-50/50 border border-emerald-200/55 text-emerald-700 px-2 py-0.5 rounded font-black">CGPA: {student.cgpa}</span>
                              </div>
                            </div>

                            {/* Status tag with pulse indicator */}
                            <div className="self-end sm:self-start flex items-center gap-2">
                              <span className={`text-[10px] px-3 py-1.5 rounded-full font-black uppercase tracking-wider shadow-sm flex items-center gap-1.5 ${
                                app.status === 'Selected' ? 'bg-emerald-100 border border-emerald-250 text-emerald-800' :
                                app.status === 'Rejected' ? 'bg-rose-100 border border-rose-250 text-rose-800' :
                                app.status === 'Shortlisted' ? 'bg-indigo-100 border border-indigo-250 text-indigo-800' :
                                'bg-slate-100 border border-slate-250 text-slate-700'
                              }`}>
                                <span className={`h-1.5 w-1.5 rounded-full ${
                                  app.status === 'Selected' ? 'bg-emerald-500 animate-pulse' :
                                  app.status === 'Rejected' ? 'bg-rose-500' :
                                  app.status === 'Shortlisted' ? 'bg-indigo-500 animate-pulse' :
                                  'bg-slate-400'
                                }`} />
                                {app.status}
                              </span>
                            </div>
                          </div>

                          {/* Student Skills tags */}
                          {student.skills && student.skills.length > 0 && (
                            <div className="space-y-1.5 pt-2.5 border-t border-slate-200/60">
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Key Skills</p>
                              <div className="flex flex-wrap gap-1.5 pt-1">
                                {student.skills.map((s, idx) => (
                                  <span key={idx} className="bg-white border border-slate-200/80 text-slate-655 text-[10px] px-2.5 py-1 rounded-lg font-bold">
                                    {s}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Actions / Resume link */}
                          <div className="flex flex-wrap items-center justify-between gap-4 pt-3.5 border-t border-slate-200/60">
                            {student.resumeUrl ? (
                              <a 
                                href={student.resumeUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 hover:text-emerald-500 hover:underline"
                              >
                                <Download className="w-4 h-4 text-emerald-555" /> Download Candidate Resume
                              </a>
                            ) : (
                              <span className="text-xs text-slate-400 font-semibold italic flex items-center gap-1.5">
                                <FileText className="w-4 h-4" /> No Resume Uploaded
                              </span>
                            )}

                            {/* Status controls */}
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleUpdateStatus(app._id, 'Shortlisted')}
                                className="px-3.5 py-2 text-xs font-black bg-indigo-50 border border-indigo-200/65 text-indigo-700 hover:bg-indigo-100 hover:border-indigo-300 rounded-xl transition-all duration-200 active:scale-95 shadow-sm"
                              >
                                Shortlist
                              </button>
                              <button
                                onClick={() => handleUpdateStatus(app._id, 'Selected')}
                                className="px-3.5 py-2 text-xs font-black bg-emerald-550 border border-emerald-600 text-white hover:bg-emerald-600 rounded-xl transition-all duration-200 active:scale-95 shadow-sm"
                              >
                                Select
                              </button>
                              <button
                                onClick={() => handleUpdateStatus(app._id, 'Rejected')}
                                className="px-3.5 py-2 text-xs font-black bg-rose-50 border border-rose-200/65 text-rose-700 hover:bg-rose-100 hover:border-rose-300 rounded-xl transition-all duration-200 active:scale-95 shadow-sm"
                              >
                                Reject
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-slate-50 border border-dashed border-slate-250 rounded-[2rem] p-16 text-center shadow-inner">
                <div className="h-14 w-14 rounded-2xl bg-white flex items-center justify-center mx-auto mb-4 border border-slate-200 shadow-sm">
                  <Briefcase className="w-7 h-7 text-slate-400" />
                </div>
                <h3 className="font-black text-slate-700 text-lg tracking-tight">Candidate Management Console</h3>
                <p className="text-sm text-slate-500 mt-2 max-w-sm mx-auto leading-relaxed">Click on one of your placement drives listed on the left panel to fetch applied candidates, view profile credentials, and shortlist/select applicants.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'post' && (
        <div className="bg-white rounded-[2rem] border border-slate-200 p-8 max-w-3xl mx-auto space-y-8 shadow-sm">
          <div className="border-b border-slate-200 pb-5">
            <h2 className="text-xl font-black text-slate-850 tracking-tight">Post New Placement Drive</h2>
            <p className="text-xs text-slate-500 font-semibold mt-1">Specify eligibility benchmarks, compensation packages, and submission timelines.</p>
          </div>

          {formError && (
            <div className="bg-rose-50 border border-rose-100 text-rose-655 p-4 rounded-2xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-500 mt-0.5 flex-shrink-0" />
              <p className="text-xs font-bold leading-normal">{formError}</p>
            </div>
          )}

          {formSuccess && (
            <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 p-4 rounded-2xl flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
              <p className="text-xs font-extrabold leading-normal">{formSuccess}</p>
            </div>
          )}

          <form className="space-y-6 text-slate-800" onSubmit={handlePostJob}>
            {/* Job Title */}
            <div className="space-y-2">
              <label className="text-xs font-extrabold text-slate-655 uppercase tracking-wider">Job Profile/Title *</label>
              <input
                type="text"
                required
                value={jobForm.title}
                onChange={(e) => setJobForm(prev => ({ ...prev, title: e.target.value }))}
                className="block w-full py-3.5 px-4 bg-slate-50/50 border border-slate-200 rounded-xl text-sm placeholder-slate-450 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-semibold text-slate-850"
                placeholder="e.g. Software Development Engineer (SDE-1)"
              />
            </div>

            {/* Job Description */}
            <div className="space-y-2">
              <label className="text-xs font-extrabold text-slate-655 uppercase tracking-wider">Job Description *</label>
              <textarea
                required
                rows="5"
                value={jobForm.description}
                onChange={(e) => setJobForm(prev => ({ ...prev, description: e.target.value }))}
                className="block w-full py-3.5 px-4 bg-slate-50/50 border border-slate-200 rounded-xl text-sm placeholder-slate-450 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-semibold text-slate-850"
                placeholder="Provide detailed description of roles, responsibilities, job location, and benefits."
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {/* Compensation Package */}
              <div className="space-y-2">
                <label className="text-xs font-extrabold text-slate-655 uppercase tracking-wider">CTC Package (LPA) *</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 font-bold text-xs">
                    LPA
                  </div>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={jobForm.package}
                    onChange={(e) => setJobForm(prev => ({ ...prev, package: e.target.value }))}
                    className="pl-12 block w-full py-3.5 px-4 bg-slate-50/50 border border-slate-200 rounded-xl text-sm placeholder-slate-450 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-semibold text-slate-850"
                    placeholder="e.g. 12"
                  />
                </div>
              </div>

              {/* Minimum CGPA */}
              <div className="space-y-2">
                <label className="text-xs font-extrabold text-slate-655 uppercase tracking-wider">Minimum CGPA benchmark *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="10"
                  required
                  value={jobForm.minCgpa}
                  onChange={(e) => setJobForm(prev => ({ ...prev, minCgpa: e.target.value }))}
                  className="block w-full py-3.5 px-4 bg-slate-50/50 border border-slate-200 rounded-xl text-sm placeholder-slate-450 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-semibold text-slate-850"
                  placeholder="e.g. 6.5"
                />
              </div>

              {/* Deadline Date */}
              <div className="space-y-2">
                <label className="text-xs font-extrabold text-slate-655 uppercase tracking-wider">Application Deadline *</label>
                <input
                  type="date"
                  required
                  value={jobForm.deadline}
                  onChange={(e) => setJobForm(prev => ({ ...prev, deadline: e.target.value }))}
                  className="block w-full py-3.5 px-4 bg-slate-50/50 border border-slate-200 rounded-xl text-sm placeholder-slate-450 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-semibold text-slate-850"
                />
              </div>
            </div>

            {/* Checklists for eligibility */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-2">
              {/* Branches Checklist */}
              <div className="space-y-3">
                <label className="text-xs font-extrabold text-slate-655 uppercase tracking-wider">Eligible Branches *</label>
                <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4.5 rounded-2xl border border-slate-200/60">
                  {Object.keys(jobForm.branches).map((branch) => (
                    <label key={branch} className="flex items-center space-x-2.5 text-xs font-bold text-slate-750 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={jobForm.branches[branch]}
                        onChange={() => handleCheckboxChange('branches', branch)}
                        className="rounded text-emerald-600 focus:ring-emerald-500/20 w-4.5 h-4.5 border-slate-350"
                      />
                      <span>{branch}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Passing Batches (Years) Checklist */}
              <div className="space-y-3">
                <label className="text-xs font-extrabold text-slate-655 uppercase tracking-wider">Eligible Batch Years *</label>
                <div className="grid grid-cols-1 gap-3 bg-slate-50 p-4.5 rounded-2xl border border-slate-200/60">
                  <label className="flex items-center space-x-2.5 text-xs font-bold text-slate-750 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={jobForm.years['3']}
                      onChange={() => handleCheckboxChange('years', '3')}
                      className="rounded text-emerald-600 focus:ring-emerald-500/20 w-4.5 h-4.5 border-slate-350"
                    />
                    <span>3rd Year Students (Summer Internship)</span>
                  </label>
                  <label className="flex items-center space-x-2.5 text-xs font-bold text-slate-750 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={jobForm.years['4']}
                      onChange={() => handleCheckboxChange('years', '4')}
                      className="rounded text-emerald-600 focus:ring-emerald-500/20 w-4.5 h-4.5 border-slate-350"
                    />
                    <span>4th Year Students (Full-Time Drives)</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200/60">
              <button
                type="submit"
                disabled={submittingJob}
                className="group relative w-full flex justify-center py-4 px-4 border border-transparent text-sm font-extrabold rounded-xl text-white bg-emerald-650 hover:bg-emerald-600 focus:outline-none focus:ring-4 focus:ring-emerald-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-md shadow-emerald-600/10 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]"
              >
                {submittingJob ? (
                  <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  'Publish Placement Drive'
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default RecruiterDashboard;
