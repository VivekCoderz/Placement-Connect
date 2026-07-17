import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  Building2, Briefcase, Users, Calendar, DollarSign, Award, Plus, Check, Eye, FileText, ArrowRight, Clock, MapPin, 
  Globe, Phone, User, AlertCircle, RefreshCw, CheckCircle2, XCircle, ChevronRight, Download, Send
} from 'lucide-react';
import { setUser } from '../redux/authSlice';
import api from '../utils/api';

const RecruiterDashboard = () => {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  
  const [activeTab, setActiveTab] = useState('openings'); // openings | post | propose
  const [drives, setDrives] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [applicants, setApplicants] = useState([]);
  const [selectedApplicants, setSelectedApplicants] = useState([]);
  const [isLoadingJobs, setIsLoadingJobs] = useState(false);
  const [isLoadingApplicants, setIsLoadingApplicants] = useState(false);
  const [submittingJob, setSubmittingJob] = useState(false);
  const [actionSuccess, setActionSuccess] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState(null);
  
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

  const [postRounds, setPostRounds] = useState([
    { number: 1, name: 'Aptitude Test', description: 'Online coding and aptitude test' },
    { number: 2, name: 'Technical Interview', description: 'In-depth coding and systems discussion' },
    { number: 3, name: 'HR Round', description: 'Cultural fit and salary negotiation' }
  ]);

  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // Propose Schedule Form State
  const [proposeForm, setProposeForm] = useState({
    jobId: '',
    numRounds: '',
    scheduleDate: '',
    studentsNeeded: '',
    message: ''
  });
  const [submittingPropose, setSubmittingPropose] = useState(false);
  const [proposeSuccess, setProposeSuccess] = useState('');
  const [proposeError, setProposeError] = useState('');

  // Fetch drives posted by recruiter
  const fetchMyDrives = async () => {
    setIsLoadingJobs(true);
    setSelectedApplicants([]);
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

  const handleFetchApplicants = async (job, silent = false) => {
    setSelectedJob(job);
    setSelectedApplicants([]);
    if (!silent) {
      setIsLoadingApplicants(true);
      setApplicants([]);
    }
    try {
      const response = await api.get(`/api/company/applications/${job._id}`);
      setApplicants(response.data.applications || []);
    } catch (err) {
      console.error('Failed to load applicants:', err);
    } finally {
      if (!silent) {
        setIsLoadingApplicants(false);
      }
    }
  };

  const handleUpdateStatus = async (appId, status) => {
    setActionSuccess('');
    setActionLoadingId(`${appId}-${status}`);
    try {
      const response = await api.put(`/api/applications/${appId}/status`, { status });
      if (response.status === 200) {
        setApplicants(prev => prev.map(app => app._id === appId ? { ...app, status } : app));
        setActionSuccess(`Application status successfully updated to ${status}!`);
        if (selectedJob) {
          handleFetchApplicants(selectedJob, true);
        }
        setTimeout(() => setActionSuccess(''), 4000);
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Status update failed');
    } finally {
      setActionLoadingId(null);
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
        deadline: deadline,
        rounds: postRounds.map((r, idx) => ({ number: idx + 1, name: r.name, description: r.description }))
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
        setPostRounds([
          { number: 1, name: 'Aptitude Test', description: 'Online coding and aptitude test' },
          { number: 2, name: 'Technical Interview', description: 'In-depth coding and systems discussion' },
          { number: 3, name: 'HR Round', description: 'Cultural fit and salary negotiation' }
        ]);
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

  const handleProposeSchedule = async (e) => {
    e.preventDefault();
    setProposeError('');
    setProposeSuccess('');

    const { jobId, numRounds, scheduleDate, studentsNeeded, message } = proposeForm;
    if (!jobId || !numRounds || !scheduleDate || !studentsNeeded) {
      setProposeError('Please fill in all required fields');
      return;
    }

    setSubmittingPropose(true);
    try {
      const response = await api.post('/api/company/propose-schedule', {
        jobId,
        numRounds: parseInt(numRounds),
        scheduleDate,
        studentsNeeded: parseInt(studentsNeeded),
        message
      });
      if (response.status === 200) {
        setProposeSuccess('Schedule proposal successfully submitted to the Placement Cell!');
        setProposeForm({
          jobId: '',
          numRounds: '',
          scheduleDate: '',
          studentsNeeded: '',
          message: ''
        });
        setTimeout(() => {
          setProposeSuccess('');
          setActiveTab('openings');
        }, 3000);
      }
    } catch (err) {
      setProposeError(err.response?.data?.message || err.message || 'Failed to submit proposal');
    } finally {
      setSubmittingPropose(false);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 font-sans px-4 sm:px-6 py-6 text-[#4B5563]">
      
      {/* Recruiter Welcome Header - High Fidelity Emerald Dashboard Card */}
      <div className="bg-[#4C1D95] text-white rounded-2xl p-8 md:p-10 border border-[#5B21B6] shadow-xl flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#22C55E]/10 rounded-full blur-[150px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-[#7C3AED]/10 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="relative z-10 space-y-5 flex-1">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-[#5B21B6] border border-[#7C3AED]/15 flex items-center justify-center shadow-md">
              <Building2 className="w-6 h-6 text-[#22C55E]" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-white bg-[#5B21B6] border border-[#7C3AED]/40 px-3 py-1 rounded-full">Recruiter Portal</span>
              <h1 className="text-2xl font-bold tracking-tight text-white mt-2">{user?.name || 'Recruiter'}</h1>
              <p className="text-purple-200 font-medium text-xs mt-1">{user?.recruiterEmail || 'Corporate Account'}</p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-2 text-white text-xs font-semibold border-t border-[#7C3AED]/30 w-full">
            {user?.industry && (
              <span className="flex items-center gap-2 bg-[#5B21B6]/60 px-3 py-1.5 rounded-lg border border-[#7C3AED]/40">
                <Briefcase className="w-3.5 h-3.5 text-[#22C55E]" /> {user.industry}
              </span>
            )}
            {user?.website && (
              <a href={user.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-[#5B21B6]/60 px-3 py-1.5 rounded-lg border border-[#7C3AED]/40 hover:text-[#22C55E] hover:border-[#22C55E]/40 transition-all">
                <Globe className="w-3.5 h-3.5 text-[#22C55E]" /> Company Website
              </a>
            )}
            {user?.hrContactPhone && (
              <span className="flex items-center gap-2 bg-[#5B21B6]/60 px-3 py-1.5 rounded-lg border border-[#7C3AED]/40">
                <Phone className="w-3.5 h-3.5 text-[#22C55E]" /> {user.hrContactPhone}
              </span>
            )}
          </div>
        </div>

        {/* Stats card */}
        <div className="relative z-10 flex items-center gap-5 bg-[#5B21B6]/60 p-6 px-8 rounded-xl border border-[#7C3AED]/40 shadow-sm self-stretch lg:self-auto min-w-[200px] justify-center text-center">
          <div>
            <p className="text-[10px] font-bold text-purple-200 uppercase tracking-widest">Active Openings</p>
            <p className="text-4xl font-bold text-white mt-2 tracking-tight">{drives.length}</p>
          </div>
        </div>
      </div>

      {/* Main Tabs */}
      <div className="flex bg-white border border-[#E5E7EB] p-1 rounded-xl max-w-lg gap-1 shadow-sm">
        <button
          onClick={() => { setActiveTab('openings'); setSelectedJob(null); }}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
            activeTab === 'openings'
              ? 'bg-[#22C55E] text-white shadow-sm'
              : 'text-[#94A3B8] hover:text-[#4B5563] hover:bg-[#F8FAFC]'
          }`}
        >
          <Briefcase className="w-3.5 h-3.5" />
          Job Drives
        </button>
        <button
          onClick={() => { setActiveTab('post'); setSelectedJob(null); }}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
            activeTab === 'post'
              ? 'bg-[#22C55E] text-white shadow-sm'
              : 'text-[#94A3B8] hover:text-[#4B5563] hover:bg-[#F8FAFC]'
          }`}
        >
          <Plus className="w-3.5 h-3.5" />
          Post Drive
        </button>
        <button
          onClick={() => { setActiveTab('propose'); setSelectedJob(null); }}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
            activeTab === 'propose'
              ? 'bg-[#22C55E] text-white shadow-sm'
              : 'text-[#94A3B8] hover:text-[#4B5563] hover:bg-[#F8FAFC]'
          }`}
        >
          <Send className="w-3.5 h-3.5" />
          Propose Schedule
        </button>
      </div>

      {/* Tabs Content */}
      {activeTab === 'openings' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start animate-in fade-in duration-300">
          {/* Drives List Panel */}
          <div className="lg:col-span-1 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-[#111827] tracking-tight">Your Placement Drives</h2>
              <button 
                onClick={fetchMyDrives} 
                className="p-2 hover:bg-[#F8FAFC] rounded-lg text-[#4B5563] transition-colors border border-[#E5E7EB] bg-white shadow-sm"
                title="Refresh Openings"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingJobs ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {isLoadingJobs && drives.length === 0 ? (
              <div className="flex justify-center py-20">
                <div className="animate-spin rounded-full h-7 w-7 border-t-2 border-b-2 border-[#22C55E]"></div>
              </div>
            ) : drives.length === 0 ? (
              <div className="bg-white border border-[#E5E7EB] p-10 text-center rounded-2xl shadow-sm">
                <div className="h-10 w-10 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB] flex items-center justify-center mx-auto mb-4 text-[#94A3B8]">
                  <Briefcase className="w-5 h-5" />
                </div>
                <p className="text-xs font-semibold text-[#4B5563]">No job openings posted yet.</p>
                <button 
                  onClick={() => setActiveTab('post')} 
                  className="text-xs font-bold text-[#22C55E] hover:text-[#16A34A] mt-3 inline-flex items-center gap-1 group"
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
                      className={`p-6 rounded-xl border transition-all duration-300 cursor-pointer ${
                        isSelected 
                          ? 'bg-white border-[#22C55E] text-[#111827] shadow-xl ring-2 ring-[#22C55E]/10' 
                          : 'bg-white border border-[#E5E7EB] hover:border-[#22C55E]/40 shadow-sm'
                      }`}
                    >
                      <div className="space-y-3.5">
                        <div className="flex justify-between items-start gap-2">
                          <h3 className="font-bold text-[#111827] text-sm tracking-tight leading-snug">{job.title}</h3>
                          <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                            isExpired 
                              ? 'bg-rose-50 border border-rose-250 text-rose-600' 
                              : 'bg-[#22C55E]/10 border border-[#22C55E]/20 text-[#22C55E]'
                          }`}>
                            {isExpired ? 'Expired' : 'Active'}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-4 text-[11px] font-semibold text-[#4B5563]">
                          <span className="flex items-center gap-1"><DollarSign className="w-3.5 h-3.5 text-[#94A3B8]" /> {job.package} LPA</span>
                          <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-[#94A3B8]" /> {deadlineDate.toLocaleDateString()}</span>
                        </div>

                        <div className="flex justify-between items-center pt-3 border-t border-[#E5E7EB] mt-3 text-[10px] font-semibold uppercase tracking-wider text-[#94A3B8]">
                          <span>Min CGPA: {job.eligibility?.cgpa}</span>
                          <span className="text-[#22C55E] flex items-center gap-1.5 font-bold">
                            {job.applicantCount || 0} Applicants <ChevronRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
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
              <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 md:p-8 space-y-8 shadow-sm">
                {/* Header */}
                <div className="border-b border-[#E5E7EB] pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <span className="text-[10px] font-bold text-[#7C3AED] uppercase tracking-widest">Candidate Evaluation</span>
                    <h2 className="text-lg font-bold text-[#111827] tracking-tight mt-1">{selectedJob.title}</h2>
                    <p className="text-xs text-[#4B5563] font-semibold mt-1">Review student profile cards, credentials, portfolios and download resume.</p>
                  </div>
                </div>

                {actionSuccess && (
                  <div className="bg-[#22C55E]/10 border border-[#22C55E]/20 text-[#22C55E] p-4 rounded-xl flex items-center gap-3 animate-slide-up">
                    <CheckCircle2 className="w-5 h-5 text-[#22C55E] flex-shrink-0" />
                    <p className="text-xs font-bold leading-normal">{actionSuccess}</p>
                  </div>
                )}

                {/* Applicants Grid */}
                {isLoadingApplicants ? (
                  <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-7 w-7 border-t-2 border-b-2 border-[#22C55E]"></div>
                  </div>
                ) : applicants.length === 0 ? (
                  <div className="text-center py-16">
                    <Users className="w-10 h-10 text-[#94A3B8] mx-auto mb-3" />
                    <p className="text-xs font-semibold text-[#4B5563]">No students have applied to this drive yet.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Select All Checkbox */}
                    <div className="flex items-center justify-between bg-[#F8FAFC] p-4 rounded-xl border border-[#E5E7EB] shadow-sm select-none animate-in fade-in duration-200">
                      <label className="flex items-center gap-2.5 text-xs font-bold text-[#4B5563] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={applicants.length > 0 && selectedApplicants.length === applicants.length}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedApplicants(applicants.map(a => a._id));
                            } else {
                              setSelectedApplicants([]);
                            }
                          }}
                          className="rounded text-[#22C55E] focus:ring-[#22C55E]/10 w-4 h-4 border-[#E5E7EB] bg-white cursor-pointer"
                        />
                        <span>Select All Candidates ({applicants.length})</span>
                      </label>
                      {selectedApplicants.length > 0 && (
                        <span className="text-xs font-bold text-[#7C3AED]">
                          {selectedApplicants.length} selected
                        </span>
                      )}
                    </div>

                    <div className="space-y-6">
                      {applicants.map((app) => {
                        const student = app.studentId || {};
                        
                        return (
                          <div key={app._id} className="p-6 rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] hover:bg-[#F1F5F9] transition-all duration-300 flex items-start gap-4">
                            <input
                              type="checkbox"
                              checked={selectedApplicants.includes(app._id)}
                              onChange={(e) => {
                                const isChecked = e.target.checked;
                                if (isChecked) {
                                  setSelectedApplicants(prev => [...prev, app._id]);
                                } else {
                                  setSelectedApplicants(prev => prev.filter(id => id !== app._id));
                                }
                              }}
                              className="rounded text-[#22C55E] focus:ring-[#22C55E]/10 w-4 h-4 border-[#E5E7EB] bg-white cursor-pointer mt-1"
                            />
                            <div className="flex-1 space-y-5">
                              {/* Student Info */}
                          <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                            <div className="space-y-1">
                              <h4 className="font-bold text-[#111827] text-sm">{student.name}</h4>
                              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#4B5563] font-semibold">
                                <span className="bg-white px-2 py-0.5 rounded-md text-[#4B5563] border border-[#E5E7EB]">Roll: {student.rollNumber}</span>
                                <span>Branch: {student.branch}</span>
                                <span>Year: {student.year}</span>
                                <span className="bg-[#22C55E]/10 border border-[#22C55E]/20 text-[#22C55E] px-2 py-0.5 rounded font-bold">CGPA: {student.cgpa}</span>
                              </div>
                            </div>

                            {/* Status tag with pulse indicator */}
                            <div className="self-end sm:self-start flex items-center gap-2">
                              <span className={`text-[10px] px-3 py-1 rounded-full font-bold uppercase tracking-wider shadow-sm flex items-center gap-1.5 ${
                                app.status === 'Selected' ? 'bg-[#22C55E]/10 border border-[#22C55E]/20 text-[#22C55E]' :
                                app.status === 'Rejected' ? 'bg-rose-50 border border-rose-200 text-rose-600' :
                                app.status === 'Shortlisted' ? 'bg-blue-50 border border-blue-200 text-blue-600' :
                                'bg-white border border-[#E5E7EB] text-[#4B5563]'
                              }`}>
                                <span className={`h-1.5 w-1.5 rounded-full ${
                                  app.status === 'Selected' ? 'bg-[#22C55E] animate-pulse' :
                                  app.status === 'Rejected' ? 'bg-rose-500' :
                                  app.status === 'Shortlisted' ? 'bg-blue-550 animate-pulse' :
                                  'bg-slate-400'
                                }`} />
                                {app.status}
                              </span>
                            </div>
                          </div>

                          {/* Student Skills tags */}
                          {student.skills && student.skills.length > 0 && (
                            <div className="space-y-1.5 pt-2.5 border-t border-[#E5E7EB]">
                              <p className="text-[9px] font-bold text-[#94A3B8] uppercase tracking-widest">Key Skills</p>
                              <div className="flex flex-wrap gap-1 pt-1">
                                {student.skills.map((s, idx) => (
                                  <span key={idx} className="bg-white border border-[#E5E7EB] text-[#4B5563] text-[10px] px-2.5 py-0.5 rounded font-semibold">
                                    {s}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Actions / Resume link */}
                          <div className="flex flex-wrap items-center justify-between gap-4 pt-3.5 border-t border-[#E5E7EB]">
                            {student.resumeUrl ? (
                              <a 
                                href={student.resumeUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-xs font-semibold text-[#22C55E] hover:text-[#16A34A] hover:underline"
                              >
                                <Download className="w-3.5 h-3.5" /> Download Candidate Resume
                              </a>
                            ) : (
                              <span className="text-xs text-[#4B5563] font-medium italic flex items-center gap-1">
                                <FileText className="w-3.5 h-3.5 text-[#94A3B8]" /> No Resume Uploaded
                              </span>
                            )}

                            {/* Status controls */}
                            <div className="flex items-center gap-2 font-semibold">
                              <button
                                onClick={() => handleUpdateStatus(app._id, 'Shortlisted')}
                                disabled={actionLoadingId !== null}
                                className="px-3 py-1.5 text-xs bg-blue-50 border border-blue-200 text-blue-600 hover:bg-blue-100 rounded-lg transition-all duration-200 active:scale-95 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                              >
                                {actionLoadingId === `${app._id}-Shortlisted` ? (
                                  <>
                                    <span className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                                    Saving...
                                  </>
                                ) : (
                                  'Shortlist'
                                )}
                              </button>
                              <button
                                onClick={() => handleUpdateStatus(app._id, 'Selected')}
                                disabled={actionLoadingId !== null}
                                className="px-3 py-1.5 text-xs bg-[#22C55E] hover:bg-[#16A34A] text-white font-bold rounded-lg transition-all duration-200 active:scale-95 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                              >
                                {actionLoadingId === `${app._id}-Selected` ? (
                                  <>
                                    <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Saving...
                                  </>
                                ) : (
                                  'Select'
                                )}
                              </button>
                              <button
                                onClick={() => handleUpdateStatus(app._id, 'Rejected')}
                                disabled={actionLoadingId !== null}
                                className="px-3 py-1.5 text-xs bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-100 rounded-lg transition-all duration-200 active:scale-95 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                              >
                                {actionLoadingId === `${app._id}-Rejected` ? (
                                  <>
                                    <span className="w-3 h-3 border-2 border-rose-600 border-t-transparent rounded-full animate-spin" />
                                    Saving...
                                  </>
                                ) : (
                                  'Reject'
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                {/* Handover shortlists section */}
                {selectedApplicants.length > 0 && (
                  <div className="bg-[#4C1D95]/5 border border-[#4C1D95]/10 p-6 rounded-xl space-y-4 shadow-sm mt-6 animate-in fade-in duration-200">
                    <div className="flex items-center gap-2">
                      <Send className="w-4 h-4 text-[#7C3AED]" />
                      <h4 className="font-bold text-[#111827] text-sm">Send Shortlist & Schedule to Placement Cell</h4>
                    </div>
                    <p className="text-xs text-[#4B5563] font-semibold">
                      You have selected <strong className="text-[#7C3AED] font-bold">{selectedApplicants.length} candidate(s)</strong>. Submit this batch shortlist to the Training & Placement Cell with your proposed round schedule.
                    </p>
                    
                    <form onSubmit={async (e) => {
                      e.preventDefault();
                      const targetRound = e.target.roundName.value;
                      const roundDetails = e.target.roundDetails.value;
                      const scheduledAt = e.target.scheduledAt.value;
                      
                      if (!targetRound) return alert("Please select the evaluation round name.");
                      if (!scheduledAt) return alert("Please specify the scheduled date & time.");

                      const ids = selectedApplicants
                        .map(appId => applicants.find(a => a._id === appId)?.studentId?._id)
                        .filter(Boolean);

                      try {
                        const res = await api.post('/api/company/submit-shortlist', {
                          jobId: selectedJob._id,
                          roundName: targetRound,
                          roundDetails,
                          scheduledAt,
                          studentIds: ids
                        });
                        if (res.status === 201) {
                          alert(`Shortlist and schedule successfully submitted for ${ids.length} student(s)!`);
                          setSelectedApplicants([]);
                          e.target.reset();
                          handleFetchApplicants(selectedJob, true); // Refresh silently
                        }
                      } catch (err) {
                        alert(err.response?.data?.message || err.message || "Failed to submit shortlist");
                      }
                    }} className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Evaluation Round *</label>
                          <select
                            name="roundName"
                            required
                            className="block w-full py-2 px-3 bg-white border border-[#E5E7EB] rounded-xl text-xs font-semibold text-[#111827] focus:outline-none"
                          >
                            <option value="">-- Select Round --</option>
                            {(selectedJob.rounds && selectedJob.rounds.length > 0 ? selectedJob.rounds.map(r => r.name) : [
                              'Aptitude Test', 'Group Discussion (GD)', 'Technical Interview', 'HR Round'
                            ]).map((rName, idx) => (
                              <option key={idx} value={rName}>{rName}</option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Proposed Date & Time *</label>
                          <input
                            type="datetime-local"
                            name="scheduledAt"
                            required
                            className="block w-full py-2 px-3 bg-white border border-[#E5E7EB] rounded-xl text-xs font-semibold text-[#111827] focus:outline-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Venue/Details (Optional)</label>
                          <input
                            type="text"
                            name="roundDetails"
                            placeholder="e.g. Room 302, Block A or HackerRank link"
                            className="block w-full py-2 px-3 bg-white border border-[#E5E7EB] rounded-xl text-xs font-semibold text-[#111827] placeholder-slate-400 focus:outline-none"
                          />
                        </div>
                      </div>
                      <button
                        type="submit"
                        className="px-4 py-2.5 bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-1.5 active:scale-[0.98]"
                      >
                        <Send className="w-3.5 h-3.5" /> Submit Batch Shortlist & Proposed Schedule
                      </button>
                    </form>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
              <div className="bg-[#F8FAFC] border border-dashed border-[#E5E7EB] rounded-2xl p-16 text-center">
                <div className="h-12 w-12 rounded-xl bg-white border border-[#E5E7EB] flex items-center justify-center mx-auto mb-4 text-[#94A3B8] shadow-sm">
                  <Briefcase className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-[#111827] text-base tracking-tight">Candidate Management Console</h3>
                <p className="text-xs text-[#4B5563] mt-2 max-w-sm mx-auto leading-relaxed">Click on one of your placement drives listed on the left panel to fetch applied candidates, view profile credentials, and shortlist/select applicants.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'post' && (
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-8 max-w-3xl mx-auto space-y-8 shadow-sm animate-in fade-in duration-300">
          <div className="border-b border-[#E5E7EB] pb-5">
            <h2 className="text-lg font-bold text-[#111827] tracking-tight">Post New Placement Drive</h2>
            <p className="text-xs text-[#4B5563] font-medium mt-1">Specify eligibility benchmarks, compensation packages, and submission timelines.</p>
          </div>

          {formError && (
            <div className="bg-rose-50 border border-rose-200 text-rose-600 p-4 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-500 mt-0.5 flex-shrink-0" />
              <p className="text-xs font-bold leading-normal">{formError}</p>
            </div>
          )}

          {formSuccess && (
            <div className="bg-[#22C55E]/10 border border-[#22C55E]/20 text-[#22C55E] p-4 rounded-xl flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-[#22C55E] flex-shrink-0" />
              <p className="text-xs font-bold leading-normal">{formSuccess}</p>
            </div>
          )}

          <form className="space-y-6 text-[#4B5563] font-semibold" onSubmit={handlePostJob}>
            {/* Job Title */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider">Job Profile/Title *</label>
              <input
                type="text"
                required
                value={jobForm.title}
                onChange={(e) => setJobForm(prev => ({ ...prev, title: e.target.value }))}
                className="block w-full py-2.5 px-4 bg-[#F8FAFC] border border-[#E5E7EB] focus:bg-white rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-[#7C3AED]/10 focus:border-[#7C3AED] transition-all font-medium text-[#111827]"
                placeholder="e.g. Software Development Engineer (SDE-1)"
              />
            </div>

            {/* Job Description */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider">Job Description *</label>
              <textarea
                required
                rows="4"
                value={jobForm.description}
                onChange={(e) => setJobForm(prev => ({ ...prev, description: e.target.value }))}
                className="block w-full py-2.5 px-4 bg-[#F8FAFC] border border-[#E5E7EB] focus:bg-white rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-[#7C3AED]/10 focus:border-[#7C3AED] transition-all font-medium text-[#111827]"
                placeholder="Provide detailed description of roles, responsibilities, job location, and benefits."
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {/* Compensation Package */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider">CTC Package (LPA) *</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#94A3B8] font-bold text-xs">
                    LPA
                  </div>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={jobForm.package}
                    onChange={(e) => setJobForm(prev => ({ ...prev, package: e.target.value }))}
                    className="pl-12 block w-full py-2.5 px-4 bg-[#F8FAFC] border border-[#E5E7EB] focus:bg-white rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-[#7C3AED]/10 focus:border-[#7C3AED] transition-all font-medium text-[#111827]"
                    placeholder="e.g. 12"
                  />
                </div>
              </div>

              {/* Minimum CGPA */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider">Minimum CGPA benchmark *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="10"
                  required
                  value={jobForm.minCgpa}
                  onChange={(e) => setJobForm(prev => ({ ...prev, minCgpa: e.target.value }))}
                  className="block w-full py-2.5 px-4 bg-[#F8FAFC] border border-[#E5E7EB] focus:bg-white rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-[#7C3AED]/10 focus:border-[#7C3AED] transition-all font-medium text-[#111827]"
                  placeholder="e.g. 6.5"
                />
              </div>

              {/* Deadline Date */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider">Application Deadline *</label>
                <input
                  type="date"
                  required
                  value={jobForm.deadline}
                  onChange={(e) => setJobForm(prev => ({ ...prev, deadline: e.target.value }))}
                  className="block w-full py-2.5 px-4 bg-white border border-[#E5E7EB] rounded-xl text-sm font-medium text-[#111827] focus:outline-none"
                />
              </div>
            </div>

            {/* Checklists for eligibility */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-2">
              {/* Branches Checklist */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider">Eligible Branches *</label>
                <div className="grid grid-cols-2 gap-3 bg-[#F8FAFC] p-4 rounded-xl border border-[#E5E7EB]">
                  {Object.keys(jobForm.branches).map((branch) => (
                    <label key={branch} className="flex items-center space-x-2 text-xs text-[#4B5563] cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={jobForm.branches[branch]}
                        onChange={() => handleCheckboxChange('branches', branch)}
                        className="rounded text-[#22C55E] focus:ring-[#22C55E]/10 w-4 h-4 border-[#E5E7EB] bg-white"
                      />
                      <span>{branch}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Passing Batches (Years) Checklist */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider">Eligible Batch Years *</label>
                <div className="grid grid-cols-1 gap-3 bg-[#F8FAFC] p-4 rounded-xl border border-[#E5E7EB]">
                  <label className="flex items-center space-x-2 text-xs text-[#4B5563] cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={jobForm.years['3']}
                      onChange={() => handleCheckboxChange('years', '3')}
                      className="rounded text-[#22C55E] focus:ring-[#22C55E]/10 w-4 h-4 border-[#E5E7EB] bg-white"
                    />
                    <span>3rd Year Students (Summer Internship)</span>
                  </label>
                  <label className="flex items-center space-x-2 text-xs text-[#4B5563] cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={jobForm.years['4']}
                      onChange={() => handleCheckboxChange('years', '4')}
                      className="rounded text-[#22C55E] focus:ring-[#22C55E]/10 w-4 h-4 border-[#E5E7EB] bg-white"
                    />
                    <span>4th Year Students (Full-Time Drives)</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Custom Recruitment Rounds Section */}
            <div className="space-y-4 pt-4 border-t border-[#E5E7EB]">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider">Recruitment Rounds / Stages *</label>
                <button
                  type="button"
                  onClick={() => setPostRounds(prev => [...prev, { number: prev.length + 1, name: '', description: '' }])}
                  className="px-3 py-1 bg-[#22C55E]/10 border border-[#22C55E]/20 text-[#22C55E] hover:bg-[#22C55E]/20 rounded-lg text-xs font-bold transition-all flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Stage
                </button>
              </div>

              <div className="space-y-3.5 bg-[#F8FAFC] p-5 rounded-xl border border-[#E5E7EB]">
                {postRounds.map((round, idx) => (
                  <div key={idx} className="flex gap-4 items-start bg-white p-4 rounded-xl border border-[#E5E7EB] relative shadow-sm">
                    <span className="h-6 w-6 rounded-lg bg-[#22C55E]/10 border border-[#22C55E]/20 text-[#22C55E] flex items-center justify-center font-mono text-xs font-bold mt-2">
                      {idx + 1}
                    </span>
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <input
                          type="text"
                          required
                          value={round.name}
                          onChange={(e) => {
                            const val = e.target.value;
                            setPostRounds(prev => prev.map((r, i) => i === idx ? { ...r, name: val } : r));
                          }}
                          className="block w-full py-1.5 px-3 bg-[#F8FAFC] border border-[#E5E7EB] focus:bg-white rounded-lg text-xs font-semibold text-[#111827] focus:outline-none"
                          placeholder="Round Name (e.g. Technical Interview)"
                        />
                      </div>
                      <div className="space-y-1">
                        <input
                          type="text"
                          value={round.description}
                          onChange={(e) => {
                            const val = e.target.value;
                            setPostRounds(prev => prev.map((r, i) => i === idx ? { ...r, description: val } : r));
                          }}
                          className="block w-full py-1.5 px-3 bg-[#F8FAFC] border border-[#E5E7EB] focus:bg-white rounded-lg text-xs font-semibold text-[#111827] focus:outline-none"
                          placeholder="Short description (e.g. System Design, DSA)"
                        />
                      </div>
                    </div>
                    {postRounds.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setPostRounds(prev => prev.filter((_, i) => i !== idx))}
                        className="p-1.5 bg-rose-50 text-rose-500 hover:bg-rose-100 hover:text-rose-600 border border-rose-200 rounded-lg text-xs mt-1 transition-colors"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-[#E5E7EB]">
              <button
                type="submit"
                disabled={submittingJob}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-[#22C55E] hover:bg-[#16A34A] focus:outline-none focus:ring-4 focus:ring-[#22C55E]/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md active:scale-[0.98]"
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

      {/* PROPOSE SCHEDULE FORM TAB */}
      {activeTab === 'propose' && (
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-8 max-w-3xl mx-auto space-y-8 shadow-sm animate-in fade-in duration-300">
          <div className="border-b border-[#E5E7EB] pb-5">
            <h2 className="text-lg font-bold text-[#111827] tracking-tight">Propose Round Schedule to Placement Cell</h2>
            <p className="text-xs text-[#4B5563] font-medium mt-1">Submit proposed dates, round count, and target selection intake directly to the T&P Cell coordinators.</p>
          </div>

          {proposeSuccess && (
            <div className="bg-[#22C55E]/10 border border-[#22C55E]/20 text-[#22C55E] p-4 rounded-xl flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-[#22C55E] flex-shrink-0" />
              <p className="text-xs font-bold leading-normal">{proposeSuccess}</p>
            </div>
          )}

          {proposeError && (
            <div className="bg-rose-50 border border-rose-200 text-rose-600 p-4 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-500 mt-0.5 flex-shrink-0" />
              <p className="text-xs font-bold leading-normal">{proposeError}</p>
            </div>
          )}

          <form className="space-y-6 text-[#4B5563] font-semibold" onSubmit={handleProposeSchedule}>
            {/* Target Job Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider">Select Active Job Drive *</label>
              <select
                required
                value={proposeForm.jobId}
                onChange={(e) => setProposeForm(prev => ({ ...prev, jobId: e.target.value }))}
                className="block w-full py-3 px-4 bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl text-sm font-medium text-[#111827] focus:outline-none"
              >
                <option value="" className="bg-white text-[#4B5563]">-- Choose Drive --</option>
                {drives.map(drive => (
                  <option key={drive._id} value={drive._id} className="bg-white text-[#4B5563]">
                    {drive.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {/* Number of Rounds */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider">Total Rounds count *</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={proposeForm.numRounds}
                  onChange={(e) => setProposeForm(prev => ({ ...prev, numRounds: e.target.value }))}
                  className="block w-full py-2.5 px-4 bg-[#F8FAFC] border border-[#E5E7EB] focus:bg-white rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-[#7C3AED]/10 focus:border-[#7C3AED] font-medium text-[#111827]"
                  placeholder="e.g. 3 rounds"
                />
              </div>

              {/* Target Students needed */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider">Students Needed *</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={proposeForm.studentsNeeded}
                  onChange={(e) => setProposeForm(prev => ({ ...prev, studentsNeeded: e.target.value }))}
                  className="block w-full py-2.5 px-4 bg-[#F8FAFC] border border-[#E5E7EB] focus:bg-white rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-[#7C3AED]/10 focus:border-[#7C3AED] font-medium text-[#111827]"
                  placeholder="e.g. 15 students"
                />
              </div>

              {/* Proposed Date & Time */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider">Proposed Date & Time *</label>
                <input
                  type="datetime-local"
                  required
                  value={proposeForm.scheduleDate}
                  onChange={(e) => setProposeForm(prev => ({ ...prev, scheduleDate: e.target.value }))}
                  className="block w-full py-2.5 px-4 bg-white border border-[#E5E7EB] rounded-xl text-sm font-medium text-[#111827] focus:outline-none"
                />
              </div>
            </div>

            {/* Message/Proposal Details */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider">Schedule Proposal details / message *</label>
              <textarea
                required
                rows="4"
                value={proposeForm.message}
                onChange={(e) => setProposeForm(prev => ({ ...prev, message: e.target.value }))}
                className="block w-full py-2.5 px-4 bg-[#F8FAFC] border border-[#E5E7EB] focus:bg-white rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-[#7C3AED]/10 focus:border-[#7C3AED] font-medium text-[#111827]"
                placeholder="Details of test venue, platform links, round criteria or batch timings..."
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={submittingPropose}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-[#22C55E] hover:bg-[#16A34A] focus:outline-none focus:ring-4 focus:ring-[#22C55E]/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md active:scale-[0.98]"
              >
                {submittingPropose ? (
                  <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  'Submit Proposal to T&P Cell'
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
