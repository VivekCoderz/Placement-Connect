import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  Building2, Briefcase, Users, Calendar, DollarSign, Award, Plus, Check, Eye, FileText, ArrowRight, Clock, MapPin, 
  Globe, Phone, User, AlertCircle, RefreshCw, CheckCircle2, XCircle, ChevronRight, Download, Send, Lock, Upload, Sparkles, ListChecks
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

  const [offerTemplate, setOfferTemplate] = useState('');
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [templateSuccess, setTemplateSuccess] = useState('');
  const [templateError, setTemplateError] = useState('');

  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const [selectedAppForOffer, setSelectedAppForOffer] = useState(null);
  const [generatedOfferContent, setGeneratedOfferContent] = useState('');
  const [submittingOffer, setSubmittingOffer] = useState(false);
  const [offerType, setOfferType] = useState('template'); // 'template' | 'file'
  const [uploadedFile, setUploadedFile] = useState(null);

  // ATS and Result Upload state
  const [isAtsModalOpen, setIsAtsModalOpen] = useState(false);
  const [atsThreshold, setAtsThreshold] = useState(70);
  const [atsRoundName, setAtsRoundName] = useState('Aptitude Test');
  const [isAtsProcessing, setIsAtsProcessing] = useState(false);

  const [isCsvResultModalOpen, setIsCsvResultModalOpen] = useState(false);
  const [csvResultRound, setCsvResultRound] = useState('Aptitude Test');
  const [csvResultRoundId, setCsvResultRoundId] = useState('');
  const [csvResultFile, setCsvResultFile] = useState(null);
  const [isUploadingCsvResults, setIsUploadingCsvResults] = useState(false);
  const [csvResultsSuccess, setCsvResultsSuccess] = useState('');
  const [csvResultsError, setCsvResultsError] = useState('');

  // Recruitment workflow extensions
  const [recruitmentTab, setRecruitmentTab] = useState('pipeline'); // 'pipeline' | 'rounds'
  const [jobRounds, setJobRounds] = useState([]);
  const [isLoadingRounds, setIsLoadingRounds] = useState(false);
  const [isEditingRoundModalOpen, setIsEditingRoundModalOpen] = useState(false);
  const [editingRound, setEditingRound] = useState(null);
  const [isAddingRoundModalOpen, setIsAddingRoundModalOpen] = useState(false);

  // Override AI modal
  const [isOverrideModalOpen, setIsOverrideModalOpen] = useState(false);
  const [overrideApp, setOverrideApp] = useState(null);
  const [overrideForm, setOverrideForm] = useState({ status: 'Shortlisted', reason: '' });
  const [isSubmittingOverride, setIsSubmittingOverride] = useState(false);

  // Round results manual marking
  const [manualRoundResultsList, setManualRoundResultsList] = useState([]);
  const [selectedRoundForResults, setSelectedRoundForResults] = useState(null);
  const [isSubmittingManualResults, setIsSubmittingManualResults] = useState(false);
  const [manualResultsSuccess, setManualResultsSuccess] = useState('');
  const [manualResultsError, setManualResultsError] = useState('');

  // Expandable AI card states
  const [expandedAiCards, setExpandedAiCards] = useState({});

  const toggleExpandAiCard = (appId) => {
    setExpandedAiCards(prev => ({
      ...prev,
      [appId]: !prev[appId]
    }));
  };

  // Filter & Sorting state variables
  const [filterBranch, setFilterBranch] = useState('All');
  const [filterMinCgpa, setFilterMinCgpa] = useState('');
  const [filterSkill, setFilterSkill] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [sortOrder, setSortOrder] = useState('highest_ats');

  const getFilteredApplicants = () => {
    let list = [...applicants];

    // Branch filter
    if (filterBranch !== 'All') {
      list = list.filter(app => app.studentId?.branch?.toLowerCase() === filterBranch.toLowerCase());
    }

    // Status filter
    if (filterStatus !== 'All') {
      list = list.filter(app => app.status?.toLowerCase() === filterStatus.toLowerCase());
    }

    // CGPA filter
    if (filterMinCgpa) {
      list = list.filter(app => app.studentId?.cgpa >= parseFloat(filterMinCgpa));
    }

    // Skills filter
    if (filterSkill) {
      list = list.filter(app => 
        app.studentId?.skills?.some(s => s.toLowerCase().includes(filterSkill.toLowerCase()))
      );
    }

    // Sort order
    if (sortOrder === 'highest_ats') {
      list.sort((a, b) => (b.atsScore || 0) - (a.atsScore || 0));
    } else if (sortOrder === 'lowest_ats') {
      list.sort((a, b) => (a.atsScore || 0) - (b.atsScore || 0));
    }

    return list;
  };

  const fetchJobRounds = async (jobId) => {
    setIsLoadingRounds(true);
    try {
      const response = await api.get(`/api/company/jobs/${jobId}/rounds`);
      setJobRounds(response.data.rounds || []);
      if (response.data.rounds && response.data.rounds.length > 0) {
        setCsvResultRoundId(response.data.rounds[0]._id);
      }
    } catch (err) {
      console.error("Failed to fetch job rounds:", err);
    } finally {
      setIsLoadingRounds(false);
    }
  };

  const handleCreateRound = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const payload = {
      name: formData.get('name'),
      description: formData.get('description'),
      date: formData.get('date'),
      time: formData.get('time'),
      mode: formData.get('mode'),
      platform: formData.get('platform'),
      meetingLink: formData.get('meetingLink'),
      instructions: formData.get('instructions')
    };
    try {
      await api.post(`/api/company/jobs/${selectedJob._id}/rounds`, payload);
      setIsAddingRoundModalOpen(false);
      fetchJobRounds(selectedJob._id);
      fetchMyDrives();
    } catch (err) {
      alert(err.response?.data?.message || err.message || "Failed to create round");
    }
  };

  const handleUpdateRound = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const payload = {
      name: formData.get('name'),
      description: formData.get('description'),
      date: formData.get('date'),
      time: formData.get('time'),
      mode: formData.get('mode'),
      platform: formData.get('platform'),
      meetingLink: formData.get('meetingLink'),
      instructions: formData.get('instructions')
    };
    try {
      await api.put(`/api/company/jobs/rounds/${editingRound._id}`, payload);
      setIsEditingRoundModalOpen(false);
      setEditingRound(null);
      fetchJobRounds(selectedJob._id);
      fetchMyDrives();
    } catch (err) {
      alert(err.response?.data?.message || err.message || "Failed to update round");
    }
  };

  const handleDeleteRound = async (roundId) => {
    if (!window.confirm("Are you sure you want to delete this recruitment round?")) return;
    try {
      await api.delete(`/api/company/jobs/rounds/${roundId}`);
      fetchJobRounds(selectedJob._id);
      fetchMyDrives();
    } catch (err) {
      alert(err.response?.data?.message || err.message || "Failed to delete round");
    }
  };

  const handleOverrideDecisionSubmit = async (e) => {
    e.preventDefault();
    setIsSubmittingOverride(true);
    try {
      const response = await api.post(`/api/company/applications/${overrideApp._id}/override`, {
        status: overrideForm.status,
        reason: overrideForm.reason
      });
      if (response.status === 200) {
        setActionSuccess(`Successfully overridden candidate screening status to ${overrideForm.status}`);
        setIsOverrideModalOpen(false);
        setOverrideApp(null);
        setOverrideForm({ status: 'Shortlisted', reason: '' });
        handleFetchApplicants(selectedJob, true);
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message || "Override failed");
    } finally {
      setIsSubmittingOverride(false);
    }
  };

  const handleOpenManualResults = (round) => {
    setSelectedRoundForResults(round);
    setManualResultsSuccess('');
    setManualResultsError('');

    // Filter students whose progress status indicates they are in this round
    const candidateRoundsList = applicants.filter(app => {
      if (app.status !== 'Shortlisted' && !app.status.startsWith('Round')) return false;
      const matchRound = app.rounds?.find(r => r.name.toLowerCase() === round.name.toLowerCase());
      return matchRound && matchRound.result === 'Pending';
    });

    setManualRoundResultsList(candidateRoundsList.map(c => ({
      studentId: c.studentId?._id,
      name: c.studentId?.name,
      rollNumber: c.studentId?.rollNumber,
      result: 'Selected',
      score: '100',
      remarks: ''
    })));
  };

  const handleManualResultFieldChange = (idx, field, value) => {
    setManualRoundResultsList(prev => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  };

  const handleManualResultsSubmit = async (e) => {
    e.preventDefault();
    if (manualRoundResultsList.length === 0) return;
    setIsSubmittingManualResults(true);
    setManualResultsSuccess('');
    setManualResultsError('');
    try {
      const response = await api.post(`/api/company/jobs/${selectedJob._id}/rounds/${selectedRoundForResults._id}/manual-results`, {
        results: manualRoundResultsList.map(item => ({
          studentId: item.studentId,
          result: item.result,
          score: parseFloat(item.score) || 0,
          remarks: item.remarks
        }))
      });
      if (response.status === 200) {
        setManualResultsSuccess(response.data.message || 'Results processed successfully!');
        setManualRoundResultsList([]);
        setSelectedRoundForResults(null);
        handleFetchApplicants(selectedJob, true);
      }
    } catch (err) {
      setManualResultsError(err.response?.data?.message || err.message || "Failed to submit results");
    } finally {
      setIsSubmittingManualResults(false);
    }
  };

  const handleAtsShortlist = async () => {
    if (!selectedJob) return;
    setIsAtsProcessing(true);
    setActionSuccess('');
    try {
      const response = await api.post(`/api/company/jobs/${selectedJob._id}/ats-shortlist`, {
        threshold: Number(atsThreshold),
        roundName: atsRoundName
      });
      if (response.status === 200) {
        setActionSuccess(response.data.message || 'Candidates shortlisted successfully via ATS!');
        setIsAtsModalOpen(false);
        handleFetchApplicants(selectedJob, true);
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'ATS shortlisting failed');
    } finally {
      setIsAtsProcessing(false);
    }
  };

  const handleUploadCsvResults = async (e) => {
    e.preventDefault();
    if (!selectedJob) return;
    if (!csvResultFile) {
      setCsvResultsError('Please select a CSV file');
      return;
    }
    setCsvResultsSuccess('');
    setCsvResultsError('');
    setIsUploadingCsvResults(true);

    const formData = new FormData();
    formData.append('roundId', csvResultRoundId);
    formData.append('file', csvResultFile);

    try {
      const response = await api.post(`/api/company/jobs/${selectedJob._id}/upload-results`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (response.status === 200) {
        setCsvResultsSuccess(response.data.message || 'Results processed and candidates updated successfully!');
        setCsvResultFile(null);
        const fileInput = document.getElementById('csv-result-file-input');
        if (fileInput) fileInput.value = '';
        handleFetchApplicants(selectedJob, true);
      }
    } catch (err) {
      setCsvResultsError(err.response?.data?.message || err.message || 'Failed to upload CSV results');
    } finally {
      setIsUploadingCsvResults(false);
    }
  };

  const fetchOfferTemplate = async () => {
    try {
      const response = await api.get('/api/company/offer-template');
      if (response.status === 200) {
        setOfferTemplate(response.data.offerLetterTemplate || '');
      }
    } catch (err) {
      console.error("Failed to load offer letter template:", err);
      setTemplateError("Failed to load offer letter template. Please try again.");
    }
  };

  useEffect(() => {
    if (activeTab === 'template') {
      fetchOfferTemplate();
      setTemplateSuccess('');
      setTemplateError('');
    }
  }, [activeTab]);

  const handleUpdateTemplate = async (e) => {
    e.preventDefault();
    setSavingTemplate(true);
    setTemplateSuccess('');
    setTemplateError('');
    try {
      const response = await api.put('/api/company/offer-template', { offerLetterTemplate: offerTemplate });
      if (response.status === 200) {
        setTemplateSuccess("Offer letter template saved successfully!");
      }
    } catch (err) {
      console.error("Failed to save offer letter template:", err);
      setTemplateError(err.response?.data?.message || "Failed to save template.");
    } finally {
      setSavingTemplate(false);
    }
  };

  const handleOpenOfferModal = async (app) => {
    setSelectedAppForOffer(app);
    let currentTemplate = offerTemplate;
    if (!currentTemplate) {
      try {
        const response = await api.get('/api/company/offer-template');
        if (response.status === 200) {
          currentTemplate = response.data.offerLetterTemplate;
          setOfferTemplate(currentTemplate);
        }
      } catch (err) {
        console.error("Failed to load offer letter template:", err);
      }
    }
    
    const dateStr = new Date().toLocaleDateString();
    const studentName = app.studentId?.name || '';
    const rollNumber = app.studentId?.rollNumber || '';
    const branch = app.studentId?.branch || '';
    const cgpa = app.studentId?.cgpa || '';
    const ctc = selectedJob?.package || '';
    const jobTitle = selectedJob?.title || '';
    const companyName = user?.name || '';
    
    let compiled = currentTemplate || `<h2>OFFER LETTER</h2>
<p>Date: {{DATE}}</p>
<p>To,<br><strong>{{STUDENT_NAME}}</strong><br>Roll No: {{ROLL_NUMBER}}<br>Branch: {{BRANCH}}</p>
<p>Dear {{STUDENT_NAME}},</p>
<p>We are pleased to offer you the position of <strong>{{JOB_TITLE}}</strong> at <strong>{{COMPANY_NAME}}</strong>. Your annual compensation (CTC) will be <strong>{{CTC}} LPA</strong>.</p>
<p>Please review and confirm your acceptance of this offer letter.</p>
<p>Sincerely,<br><strong>{{COMPANY_NAME}}</strong></p>`;
    
    compiled = compiled
      .replace(/{{DATE}}/g, dateStr)
      .replace(/{{STUDENT_NAME}}/g, studentName)
      .replace(/{{ROLL_NUMBER}}/g, rollNumber)
      .replace(/{{BRANCH}}/g, branch)
      .replace(/{{CGPA}}/g, String(cgpa))
      .replace(/{{CTC}}/g, String(ctc))
      .replace(/{{JOB_TITLE}}/g, jobTitle)
      .replace(/{{COMPANY_NAME}}/g, companyName);
      
    setGeneratedOfferContent(compiled);
    setUploadedFile(null);
    setOfferType('template');
    setIsOfferModalOpen(true);
  };

  const handleSendOfferLetter = async () => {
    if (!selectedAppForOffer) return;
    setSubmittingOffer(true);
    try {
      const formData = new FormData();
      if (offerType === 'file') {
        if (!uploadedFile) {
          alert("Please select a PDF file first.");
          setSubmittingOffer(false);
          return;
        }
        formData.append('offerLetter', uploadedFile);
      } else {
        formData.append('offerLetterContent', generatedOfferContent);
      }

      const response = await api.put(`/api/applications/${selectedAppForOffer._id}/issue-offer`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      if (response.status === 200) {
        setApplicants(prev => prev.map(a => a._id === selectedAppForOffer._id ? { 
          ...a, 
          offerLetterStatus: 'Pending Approval', 
          offerLetterContent: offerType === 'template' ? generatedOfferContent : '',
          offerLetterUrl: response.data.application.offerLetterUrl || ''
        } : a));
        setIsOfferModalOpen(false);
        setUploadedFile(null);
        alert("Offer letter submitted to Placement Cell successfully!");
      }
    } catch (err) {
      console.error("Failed to issue offer letter:", err);
      alert(err.response?.data?.message || "Failed to submit offer letter.");
    } finally {
      setSubmittingOffer(false);
    }
  };

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
      setRecruitmentTab('pipeline');
    }
    try {
      const response = await api.get(`/api/company/applications/${job._id}`);
      setApplicants(response.data.applications || []);
      fetchJobRounds(job._id);
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
        
        // Play selection or rejection audio alerts
        try {
          const { playSuccessFanfare, playFailureBuzz } = await import('../utils/audio');
          if (status === 'Selected' || status === 'Shortlisted') {
            playSuccessFanfare();
          } else if (status === 'Rejected') {
            playFailureBuzz();
          }
        } catch (audioErr) {}

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

    const { 
      title, 
      description, 
      package: pkg, 
      minCgpa, 
      deadline, 
      branches, 
      years,
      requiredSkills,
      preferredSkills,
      experienceRequired,
      numOpenings,
      atsThreshold
    } = jobForm;
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
        rounds: postRounds.map((r, idx) => ({ number: idx + 1, name: r.name, description: r.description })),
        requiredSkills: requiredSkills ? requiredSkills.split(',').map(s => s.trim()).filter(Boolean) : [],
        preferredSkills: preferredSkills ? preferredSkills.split(',').map(s => s.trim()).filter(Boolean) : [],
        experienceRequired: experienceRequired || "0 years",
        numOpenings: parseInt(numOpenings) || 5,
        atsThreshold: parseFloat(atsThreshold) || 60
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
          years: { '3': false, '4': true },
          requiredSkills: '',
          preferredSkills: '',
          experienceRequired: '0 years',
          numOpenings: '5',
          atsThreshold: '60'
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
      <div className="flex bg-white border border-[#E5E7EB] p-1 rounded-xl max-w-2xl gap-1 shadow-sm">
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
        <button
          onClick={() => { setActiveTab('template'); setSelectedJob(null); }}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
            activeTab === 'template'
              ? 'bg-[#22C55E] text-white shadow-sm'
              : 'text-[#94A3B8] hover:text-[#4B5563] hover:bg-[#F8FAFC]'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          Offer Template
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
                  <div className="flex flex-wrap gap-2 md:self-end">
                    <button
                      onClick={() => setIsAtsModalOpen(true)}
                      className="px-3 py-1.5 border border-[#7C3AED] text-[#7C3AED] hover:bg-[#7C3AED]/5 text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-1 active:scale-95 cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-[#7C3AED]" /> ATS Auto-Shortlist
                    </button>
                    <button
                      onClick={() => {
                        setIsCsvResultModalOpen(true);
                        setCsvResultsSuccess('');
                        setCsvResultsError('');
                      }}
                      className="px-3 py-1.5 border border-[#22C55E] text-[#22C55E] hover:bg-[#22C55E]/5 text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-1 active:scale-95 cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5 text-[#22C55E]" /> Upload Results CSV
                    </button>
                  </div>
                </div>

                {/* Section Toggle Tabs */}
                <div className="flex border-b border-[#E5E7EB] font-bold text-xs select-none">
                  <button
                    onClick={() => setRecruitmentTab('pipeline')}
                    className={`pb-3 px-4 border-b-2 transition-all ${
                      recruitmentTab === 'pipeline'
                        ? 'border-[#22C55E] text-[#22C55E]'
                        : 'border-transparent text-[#94A3B8] hover:text-[#4B5563]'
                    }`}
                  >
                    Candidates Pipeline ({applicants.length})
                  </button>
                  <button
                    onClick={() => setRecruitmentTab('rounds')}
                    className={`pb-3 px-4 border-b-2 transition-all flex items-center gap-1.5 ${
                      recruitmentTab === 'rounds'
                        ? 'border-[#22C55E] text-[#22C55E]'
                        : 'border-transparent text-[#94A3B8] hover:text-[#4B5563]'
                    }`}
                  >
                    <ListChecks className="w-3.5 h-3.5" /> Manage Hiring Rounds ({jobRounds.length})
                  </button>
                </div>

                {/* PIPELINE VIEW */}
                {recruitmentTab === 'pipeline' && (
                  <div className="space-y-6">
                    {/* Filters & Sorting Panel */}
                    <div className="bg-[#F8FAFC] border border-[#E5E7EB] p-5 rounded-2xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 shadow-sm animate-in fade-in duration-200">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Sort by ATS Match</label>
                        <select
                          value={sortOrder}
                          onChange={(e) => setSortOrder(e.target.value)}
                          className="block w-full py-2 px-3 bg-white border border-[#E5E7EB] rounded-xl text-xs font-semibold text-[#111827] focus:outline-none"
                        >
                          <option value="highest_ats">Highest ATS Score</option>
                          <option value="lowest_ats">Lowest ATS Score</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Branch</label>
                        <select
                          value={filterBranch}
                          onChange={(e) => setFilterBranch(e.target.value)}
                          className="block w-full py-2 px-3 bg-white border border-[#E5E7EB] rounded-xl text-xs font-semibold text-[#111827] focus:outline-none"
                        >
                          <option value="All">All Branches</option>
                          <option value="CSE">CSE</option>
                          <option value="IT">IT</option>
                          <option value="ECE">ECE</option>
                          <option value="MECH">MECH</option>
                          <option value="EEE">EEE</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Status</label>
                        <select
                          value={filterStatus}
                          onChange={(e) => setFilterStatus(e.target.value)}
                          className="block w-full py-2 px-3 bg-white border border-[#E5E7EB] rounded-xl text-xs font-semibold text-[#111827] focus:outline-none"
                        >
                          <option value="All">All Statuses</option>
                          <option value="Applied">Applied</option>
                          <option value="Shortlisted">Shortlisted</option>
                          <option value="Rejected">Rejected</option>
                          <option value="Selected">Selected</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Min CGPA</label>
                        <input
                          type="number"
                          step="0.1"
                          placeholder="e.g. 8.0"
                          value={filterMinCgpa}
                          onChange={(e) => setFilterMinCgpa(e.target.value)}
                          className="block w-full py-2 px-3 bg-white border border-[#E5E7EB] rounded-xl text-xs font-semibold text-[#111827] placeholder-slate-400 focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Skill Search</label>
                        <input
                          type="text"
                          placeholder="e.g. React"
                          value={filterSkill}
                          onChange={(e) => setFilterSkill(e.target.value)}
                          className="block w-full py-2 px-3 bg-white border border-[#E5E7EB] rounded-xl text-xs font-semibold text-[#111827] placeholder-slate-400 focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Applicants Grid */}
                    {isLoadingApplicants ? (
                      <div className="flex justify-center py-20">
                        <div className="animate-spin rounded-full h-7 w-7 border-t-2 border-b-2 border-[#22C55E]"></div>
                      </div>
                    ) : getFilteredApplicants().length === 0 ? (
                      <div className="text-center py-16">
                        <Users className="w-10 h-10 text-[#94A3B8] mx-auto mb-3" />
                        <p className="text-xs font-semibold text-[#4B5563]">No students match your filter settings.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {/* Select All Checkbox */}
                        <div className="flex items-center justify-between bg-[#F8FAFC] p-4 rounded-xl border border-[#E5E7EB] shadow-sm select-none animate-in fade-in duration-200">
                          <label className="flex items-center gap-2.5 text-xs font-bold text-[#4B5563] cursor-pointer">
                            <input
                              type="checkbox"
                              checked={getFilteredApplicants().length > 0 && selectedApplicants.length === getFilteredApplicants().length}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedApplicants(getFilteredApplicants().map(a => a._id));
                                } else {
                                  setSelectedApplicants([]);
                                }
                              }}
                              className="rounded text-[#22C55E] focus:ring-[#22C55E]/10 w-4 h-4 border-[#E5E7EB] bg-white cursor-pointer"
                            />
                            <span>Select All Filtered Candidates ({getFilteredApplicants().length})</span>
                          </label>
                          {selectedApplicants.length > 0 && (
                            <span className="text-xs font-bold text-[#7C3AED]">
                              {selectedApplicants.length} selected
                            </span>
                          )}
                        </div>

                        <div className="space-y-6">
                          {getFilteredApplicants().map((app) => {
                            const student = app.studentId || {};
                            const isExpanded = !!expandedAiCards[app._id];
                            
                            return (
                              <div key={app._id} className="p-6 rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] hover:bg-[#F1F5F9] transition-all duration-300 flex items-start gap-4 flex-col sm:flex-row">
                                <div className="flex items-center gap-2">
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
                                    className="rounded text-[#22C55E] focus:ring-[#22C55E]/10 w-4 h-4 border-[#E5E7EB] bg-white cursor-pointer"
                                  />
                                </div>
                                <div className="flex-1 space-y-4 w-full">
                                  {/* Student Info */}
                                  <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                                    <div className="space-y-1">
                                      <div className="flex flex-wrap items-center gap-2">
                                        <h4 className="font-bold text-[#111827] text-sm">{student.name}</h4>
                                        {app.atsScore !== undefined && (
                                          <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold border uppercase tracking-wider ${
                                            app.atsScore >= 75 ? 'bg-emerald-50 border-emerald-250 text-emerald-700' :
                                            app.atsScore >= 60 ? 'bg-amber-50 border-amber-200 text-amber-700' :
                                            'bg-rose-50 border-rose-200 text-rose-600'
                                          }`}>
                                            ATS Score: {app.atsScore}%
                                          </span>
                                        )}
                                      </div>
                                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#4B5563] font-semibold">
                                        <span className="bg-white px-2 py-0.5 rounded-md text-[#4B5563] border border-[#E5E7EB]">Roll: {student.rollNumber}</span>
                                        <span>Branch: {student.branch}</span>
                                        <span>Year: {student.year}</span>
                                        <span className="bg-[#22C55E]/10 border border-[#22C55E]/20 text-[#22C55E] px-2 py-0.5 rounded font-bold">CGPA: {student.cgpa}</span>
                                      </div>
                                    </div>

                                    {/* Status tag */}
                                    <div className="flex items-center gap-2 self-start">
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
                                    <div className="space-y-1.5 pt-2 border-t border-[#E5E7EB]">
                                      <p className="text-[9px] font-bold text-[#94A3B8] uppercase tracking-widest">Key Skills</p>
                                      <div className="flex flex-wrap gap-1">
                                        {student.skills.map((s, idx) => (
                                          <span key={idx} className="bg-white border border-[#E5E7EB] text-[#4B5563] text-[10px] px-2.5 py-0.5 rounded font-semibold">
                                            {s}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {/* AI MATCH METRICS PREVIEW */}
                                  {app.aiAnalysis && (
                                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs space-y-2 font-semibold text-slate-700">
                                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 border-b border-slate-200/60 pb-2">
                                        <div className="flex items-center gap-1">
                                          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">ATS Score:</span>
                                          <span className="text-slate-800 font-bold">{app.aiAnalysis.atsScore}%</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Resume Match %:</span>
                                          <span className="text-slate-800 font-bold">{app.aiAnalysis.matchPercentage}%</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Skill Match %:</span>
                                          <span className="text-slate-800 font-bold">
                                            {(() => {
                                              const matched = app.aiAnalysis.skillsMatch?.length || 0;
                                              const missing = app.aiAnalysis.missingSkills?.length || 0;
                                              return (matched + missing) > 0 ? Math.round((matched / (matched + missing)) * 100) : 0;
                                            })()}%
                                          </span>
                                        </div>
                                      </div>

                                      <div className="flex flex-wrap items-start justify-between gap-2 pt-1">
                                        <div className="space-y-1 max-w-md">
                                          <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">AI Decision:</span>
                                          <span className={`inline-flex items-center gap-1 text-[11px] font-bold ${
                                            app.aiAnalysis.status === 'Shortlisted' ? 'text-emerald-700' : 'text-rose-650'
                                          }`}>
                                            {app.aiAnalysis.status === 'Shortlisted' ? '✅ Shortlisted' : '❌ Rejected'}
                                          </span>
                                          
                                          {app.aiAnalysis.status === 'Rejected' && app.aiAnalysis.missingSkills?.length > 0 && (
                                            <div className="text-[10px] text-rose-600 space-y-0.5 mt-1 font-bold">
                                              <p className="uppercase tracking-wider text-[9px] text-rose-700 font-extrabold">Missing Gaps:</p>
                                              <ul className="list-disc pl-4 font-semibold text-rose-650 space-y-0.5">
                                                {app.aiAnalysis.missingSkills.map((sk, idx) => (
                                                  <li key={idx}>Missing {sk}</li>
                                                ))}
                                                {app.aiAnalysis.atsScore < (selectedJob?.atsThreshold || 60) && (
                                                  <li>Low ATS Score (below {selectedJob?.atsThreshold || 60}%)</li>
                                                )}
                                              </ul>
                                            </div>
                                          )}
                                        </div>

                                        <div className="text-right max-w-xs space-y-1">
                                          <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">AI Summary:</span>
                                          <p className="text-[10px] text-slate-500 leading-normal font-medium italic">
                                            "{app.aiAnalysis.aiSummary || 'Profile analyzed successfully.'}"
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  )}

                                  {/* Actions & Resume link */}
                                  <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-[#E5E7EB]">
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

                                    {/* Action controls */}
                                    <div className="flex flex-wrap items-center gap-2 font-semibold">
                                      {/* Expanded AI Analysis toggle */}
                                      {app.aiAnalysis && (
                                        <button
                                          onClick={() => toggleExpandAiCard(app._id)}
                                          className="px-3 py-1.5 text-xs bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 rounded-lg transition-all"
                                        >
                                          {isExpanded ? 'Hide AI Details' : 'View AI Feedback'}
                                        </button>
                                      )}

                                      {/* Manual override button */}
                                      <button
                                        onClick={() => {
                                          setOverrideApp(app);
                                          setOverrideForm({ status: app.status === 'Rejected' ? 'Shortlisted' : 'Rejected', reason: '' });
                                          setIsOverrideModalOpen(true);
                                        }}
                                        className="px-3 py-1.5 text-xs bg-purple-50 border border-purple-200 text-purple-700 hover:bg-purple-100 rounded-lg transition-all flex items-center gap-1"
                                      >
                                        <Sparkles className="w-3 h-3 text-purple-650" /> Override AI
                                      </button>

                                      {app.offerLetterStatus && app.offerLetterStatus !== 'None' ? (
                                        <span className={`px-2.5 py-1.5 text-[10px] rounded-lg font-bold border uppercase ${
                                          app.offerLetterStatus === 'Approved' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
                                          app.offerLetterStatus === 'Rejected' ? 'bg-rose-50 border-rose-200 text-rose-600' :
                                          'bg-amber-50 border-amber-200 text-amber-700'
                                        }`}>
                                          Offer: {app.offerLetterStatus}
                                        </span>
                                      ) : (
                                        app.status !== 'Rejected' && app.status !== 'Applied' && app.status !== 'AI Screening' && (
                                          <button
                                            onClick={() => handleOpenOfferModal(app)}
                                            disabled={actionLoadingId !== null}
                                            className="px-3 py-1.5 text-xs bg-[#22C55E] hover:bg-[#16A34A] text-white font-bold rounded-lg transition-all active:scale-95 cursor-pointer"
                                          >
                                            Issue Offer
                                          </button>
                                        )
                                      )}
                                    </div>
                                  </div>

                                  {/* AI Assessment Details Card */}
                                  {isExpanded && app.aiAnalysis && (
                                    <div className="mt-4 bg-white border border-slate-200 p-5 rounded-2xl space-y-4 animate-in fade-in duration-200 text-xs shadow-inner">
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                          <p className="font-bold text-slate-700 uppercase tracking-wider text-[10px] flex items-center gap-1"><Sparkles className="w-3.5 h-3.5 text-[#22C55E]" /> AI Assessment Metrics</p>
                                          <div className="flex gap-4">
                                            <div className="p-3 bg-emerald-50/50 border border-emerald-100 rounded-xl text-center flex-1">
                                              <p className="text-[9px] text-emerald-600 font-bold uppercase">ATS Score</p>
                                              <p className="text-lg font-bold text-emerald-700 mt-1">{app.aiAnalysis.atsScore}%</p>
                                            </div>
                                            <div className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl text-center flex-1">
                                              <p className="text-[9px] text-indigo-600 font-bold uppercase">Match Rate</p>
                                              <p className="text-lg font-bold text-indigo-700 mt-1">{app.aiAnalysis.matchPercentage}%</p>
                                            </div>
                                          </div>
                                          <div className="pt-2 text-[#4B5563] leading-relaxed font-semibold space-y-1">
                                            <p><strong>Education:</strong> {app.aiAnalysis.educationMatch || 'Matched criteria'}</p>
                                            <p><strong>Projects & Exp:</strong> {app.aiAnalysis.experienceMatch || 'Matched criteria'}</p>
                                          </div>
                                        </div>
                                        <div className="space-y-2">
                                          <p className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Hiring Profile Summary</p>
                                          <p className="text-[#4B5563] leading-relaxed font-semibold italic">"{app.aiAnalysis.aiSummary}"</p>
                                          <p className="text-slate-500 leading-normal font-medium mt-2 bg-slate-50 p-2 rounded-lg border"><strong>Recruiter Note:</strong> {app.aiAnalysis.aiRecruiterSummary}</p>
                                        </div>
                                      </div>

                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-slate-100">
                                        <div className="space-y-1.5">
                                          <p className="font-bold text-[#22C55E] uppercase tracking-wider text-[10px]">Candidate Strengths</p>
                                          <ul className="list-disc pl-4 space-y-1 text-slate-650 font-semibold">
                                            {app.aiAnalysis.strengths?.map((str, sIdx) => (
                                              <li key={sIdx}>{str}</li>
                                            ))}
                                          </ul>
                                        </div>
                                        <div className="space-y-1.5">
                                          <p className="font-bold text-rose-500 uppercase tracking-wider text-[10px]">Technical Gaps / Gaps</p>
                                          <ul className="list-disc pl-4 space-y-1 text-slate-650 font-semibold">
                                            {app.aiAnalysis.missingSkills?.map((ms, mIdx) => (
                                              <li key={mIdx}>{ms}</li>
                                            ))}
                                          </ul>
                                        </div>
                                      </div>

                                      {app.aiAnalysis.recommendedLearning && app.aiAnalysis.recommendedLearning.length > 0 && (
                                        <div className="pt-3 border-t border-slate-100 space-y-1">
                                          <p className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Recommended Development Plan</p>
                                          <div className="flex flex-wrap gap-1.5 pt-1">
                                            {app.aiAnalysis.recommendedLearning.map((topic, tIdx) => (
                                              <span key={tIdx} className="bg-amber-50 text-amber-700 border border-amber-200 text-[9px] px-2.5 py-0.5 rounded-full font-semibold">
                                                {topic}
                                              </span>
                                            ))}
                                          </div>
                                        </div>
                                      )}

                                      <div className="pt-3 border-t border-slate-100">
                                        <p className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Reasoning Details</p>
                                        <p className="text-slate-600 font-semibold leading-relaxed mt-1">
                                          {app.aiAnalysis.status === 'Shortlisted' 
                                            ? (app.aiAnalysis.selectionReason || 'Selected based on threshold score matching.')
                                            : (app.aiAnalysis.rejectionReason || 'Resume matches did not meet target threshold.')
                                          }
                                        </p>
                                        {app.aiAnalysis.isOverridden && (
                                          <div className="mt-3 text-purple-700 font-bold bg-purple-50 border border-purple-200 p-3 rounded-xl flex items-start gap-2">
                                            <span className="text-xs">⚠️</span>
                                            <div>
                                              <p className="text-[10px] uppercase tracking-wider font-extrabold text-purple-800">Recruiter Manual Override Applied</p>
                                              <p className="mt-1 text-[11px] leading-relaxed font-semibold">"{app.aiAnalysis.overrideReason}"</p>
                                              <p className="text-[9px] font-semibold text-purple-500 mt-0.5">Original Decision status was: {app.aiAnalysis.originalStatus}</p>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  )}

                                  {/* Round-specific stages grid */}
                                  {(app.status === 'Shortlisted' || app.status.startsWith('Round') || app.status === 'Selected') && (() => {
                                    const jobRoundNames = jobRounds.length > 0 
                                      ? jobRounds.map(r => r.name)
                                      : ['Aptitude Test', 'Technical Interview', 'HR Round'];

                                    return (
                                      <div className="w-full mt-4 pt-4 border-t border-dashed border-[#E5E7EB] space-y-3">
                                        <div className="flex items-center justify-between">
                                          <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Hiring Pipeline Stages</h5>
                                          <span className="text-[9px] text-[#94A3B8] font-bold uppercase tracking-wider">Sequence: Left to Right</span>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                          {jobRoundNames.map((rName, idx) => {
                                            const match = app.rounds?.find(r => r.name.toLowerCase() === rName.toLowerCase());
                                            const currentResult = match ? match.result : 'Pending';

                                            let hasFailedPrior = false;
                                            let hasPendingPrior = false;
                                            for (let j = 0; j < idx; j++) {
                                              const priorMatch = app.rounds?.find(r => r.name.toLowerCase() === jobRoundNames[j].toLowerCase());
                                              const priorResult = priorMatch ? priorMatch.result : 'Pending';
                                              if (priorResult === 'Failed' || priorResult === 'Rejected') {
                                                hasFailedPrior = true;
                                              } else if (priorResult === 'Pending') {
                                                hasPendingPrior = true;
                                              }
                                            }

                                            let stageStatus = 'Pending';
                                            let statusText = 'Pending';
                                            let badgeColor = 'bg-amber-50/50 text-amber-600 border-amber-200/50';
                                            let icon = <Clock className="w-3 h-3 text-amber-500 animate-pulse" />;

                                            if (hasFailedPrior) {
                                              stageStatus = 'Rejected';
                                              statusText = 'Eliminated';
                                              badgeColor = 'bg-rose-50/30 text-rose-450 border-rose-100 opacity-60';
                                              icon = <XCircle className="w-3 h-3 text-rose-400" />;
                                            } else if (hasPendingPrior) {
                                              stageStatus = 'Locked';
                                              statusText = 'Locked';
                                              badgeColor = 'bg-slate-50 text-slate-400 border-slate-200/60';
                                              icon = <Lock className="w-3 h-3 text-slate-400" />;
                                            } else if (currentResult === 'Passed' || currentResult === 'Selected') {
                                              stageStatus = 'Passed';
                                              statusText = 'Passed';
                                              badgeColor = 'bg-emerald-50 text-emerald-600 border-emerald-250';
                                              icon = <CheckCircle2 className="w-3 h-3 text-emerald-500" />;
                                            } else if (currentResult === 'Failed' || currentResult === 'Rejected' || currentResult === 'Absent') {
                                              stageStatus = 'Failed';
                                              statusText = currentResult === 'Absent' ? 'Absent' : 'Failed';
                                              badgeColor = 'bg-rose-50 text-rose-600 border-rose-250';
                                              icon = <XCircle className="w-3 h-3 text-rose-500" />;
                                            } else if (currentResult === 'Waiting') {
                                              stageStatus = 'Waiting';
                                              statusText = 'Waitlisted';
                                              badgeColor = 'bg-blue-50 text-blue-600 border-blue-200';
                                              icon = <Clock className="w-3 h-3 text-blue-500" />;
                                            }

                                            return (
                                              <div 
                                                key={idx} 
                                                className={`flex items-center justify-between p-3 rounded-xl border transition-all duration-200 bg-white ${
                                                  stageStatus === 'Locked' ? 'border-[#F1F5F9] bg-[#F8FAFC]/50 opacity-65' : 
                                                  stageStatus === 'Rejected' ? 'border-rose-100 bg-rose-50/10' :
                                                  'border-[#E5E7EB] hover:shadow-sm'
                                                }`}
                                              >
                                                <div className="flex flex-col gap-1">
                                                  <span className="text-xs font-bold text-[#111827]">{rName}</span>
                                                  <div className="flex">
                                                    <span className={`inline-flex items-center gap-1.5 text-[9px] px-2.5 py-0.5 rounded-full border font-bold uppercase tracking-wider ${badgeColor}`}>
                                                      {icon}
                                                      {statusText}
                                                    </span>
                                                  </div>
                                                </div>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    );
                                  })()}
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
                                    {(jobRounds.length > 0 ? jobRounds.map(r => r.name) : [
                                      'Aptitude Test', 'Group Discussion (GD)', 'Technical Interview', 'HR Round'
                                    ]).map((name, idx) => (
                                      <option key={idx} value={name}>{name}</option>
                                    ))}
                                  </select>
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Scheduled Date & Time *</label>
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
                )}

                {/* MANAGE ROUNDS VIEW */}
                {recruitmentTab === 'rounds' && (
                  <div className="space-y-6 animate-in fade-in duration-300">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                      <div>
                        <h3 className="text-sm font-bold text-[#111827]">Recruitment Stages Timeline</h3>
                        <p className="text-[11px] text-[#4B5563] font-semibold mt-0.5">Customize hiring process rounds, platform links and enter round results.</p>
                      </div>
                      <button
                        onClick={() => setIsAddingRoundModalOpen(true)}
                        className="px-3 py-1.5 bg-[#22C55E] hover:bg-[#16A34A] text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-1 cursor-pointer"
                      >
                        + Add Dynamic Round
                      </button>
                    </div>

                    {isLoadingRounds ? (
                      <div className="flex justify-center py-10">
                        <div className="animate-spin rounded-full h-7 w-7 border-t-2 border-b-2 border-[#22C55E]"></div>
                      </div>
                    ) : jobRounds.length === 0 ? (
                      <div className="text-center py-12 bg-slate-50 border border-dashed rounded-xl">
                        <p className="text-xs text-slate-500 font-semibold">No custom rounds created for this job drive yet.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {jobRounds.map((round, idx) => (
                          <div key={round._id} className="p-5 bg-[#F8FAFC] border border-[#E5E7EB] rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:shadow-sm transition-all">
                            <div className="space-y-2 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="h-6 w-6 rounded-full bg-[#7C3AED]/10 text-[#7C3AED] flex items-center justify-center text-xs font-bold">{round.sequence}</span>
                                <h4 className="text-xs font-bold text-[#111827] uppercase tracking-wider">{round.name}</h4>
                                <span className={`text-[9px] px-2 py-0.5 rounded-md font-bold uppercase ${
                                  round.mode === 'Physical' ? 'bg-purple-100 text-purple-700 border border-purple-200' : 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                                }`}>
                                  {round.mode || 'Online'}
                                </span>
                              </div>
                              <p className="text-[11px] text-[#4B5563] font-semibold">{round.description || "No description provided."}</p>
                              <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[10px] text-[#4B5563] font-medium pt-1">
                                {round.platform && <span><strong>Platform:</strong> {round.platform}</span>}
                                {round.date && <span><strong>Date:</strong> {new Date(round.date).toLocaleDateString()}</span>}
                                {round.time && <span><strong>Time:</strong> {round.time}</span>}
                              </div>
                              {round.meetingLink && (
                                <p className="text-[10px] truncate max-w-md text-[#7C3AED] font-semibold bg-[#7C3AED]/5 border border-[#7C3AED]/10 px-2.5 py-1 rounded-lg">
                                  🔗 Link: <a href={round.meetingLink.startsWith('http') ? round.meetingLink : `https://${round.meetingLink}`} target="_blank" rel="noopener noreferrer" className="hover:underline">{round.meetingLink}</a>
                                </p>
                              )}
                              {round.instructions && (
                                <p className="text-[10px] italic text-[#4B5563]">
                                  <strong>Instructions:</strong> {round.instructions}
                                </p>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <button
                                onClick={() => handleOpenManualResults(round)}
                                className="px-2.5 py-1.5 bg-[#22C55E] hover:bg-[#16A34A] text-white text-[10px] font-bold rounded-lg transition-all shadow-sm active:scale-95 cursor-pointer"
                              >
                                Grade Results
                              </button>
                              <button
                                onClick={() => {
                                  setEditingRound(round);
                                  setIsEditingRoundModalOpen(true);
                                }}
                                className="px-2.5 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-[10px] font-bold rounded-lg transition-all shadow-sm active:scale-95 cursor-pointer"
                              >
                                Edit Round
                              </button>
                              <button
                                onClick={() => handleDeleteRound(round._id)}
                                className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-250 text-rose-600 text-[10px] font-bold rounded-lg transition-all shadow-sm active:scale-95 cursor-pointer"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        ))}
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Required Skills */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider">Required Skills (Comma-separated) *</label>
                <input
                  type="text"
                  required
                  value={jobForm.requiredSkills || ''}
                  onChange={(e) => setJobForm(prev => ({ ...prev, requiredSkills: e.target.value }))}
                  className="block w-full py-2.5 px-4 bg-[#F8FAFC] border border-[#E5E7EB] focus:bg-white rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-[#7C3AED]/10 focus:border-[#7C3AED] transition-all font-medium text-[#111827]"
                  placeholder="e.g. React, Node.js, Express, MongoDB"
                />
              </div>

              {/* Preferred Skills */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider">Preferred Skills (Comma-separated)</label>
                <input
                  type="text"
                  value={jobForm.preferredSkills || ''}
                  onChange={(e) => setJobForm(prev => ({ ...prev, preferredSkills: e.target.value }))}
                  className="block w-full py-2.5 px-4 bg-[#F8FAFC] border border-[#E5E7EB] focus:bg-white rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-[#7C3AED]/10 focus:border-[#7C3AED] transition-all font-medium text-[#111827]"
                  placeholder="e.g. TypeScript, Docker, AWS"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {/* Experience Required */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider">Experience Required *</label>
                <input
                  type="text"
                  required
                  value={jobForm.experienceRequired || ''}
                  onChange={(e) => setJobForm(prev => ({ ...prev, experienceRequired: e.target.value }))}
                  className="block w-full py-2.5 px-4 bg-[#F8FAFC] border border-[#E5E7EB] focus:bg-white rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-[#7C3AED]/10 focus:border-[#7C3AED] transition-all font-medium text-[#111827]"
                  placeholder="e.g. Freshers, 0-2 years"
                />
              </div>

              {/* Number of Openings */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider">Number of Openings *</label>
                <input
                  type="number"
                  required
                  value={jobForm.numOpenings || ''}
                  onChange={(e) => setJobForm(prev => ({ ...prev, numOpenings: e.target.value }))}
                  className="block w-full py-2.5 px-4 bg-[#F8FAFC] border border-[#E5E7EB] focus:bg-white rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-[#7C3AED]/10 focus:border-[#7C3AED] transition-all font-medium text-[#111827]"
                  placeholder="e.g. 5"
                />
              </div>

              {/* ATS Screening Cutoff */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider">ATS Score Threshold (0-100) *</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  required
                  value={jobForm.atsThreshold || ''}
                  onChange={(e) => setJobForm(prev => ({ ...prev, atsThreshold: e.target.value }))}
                  className="block w-full py-2.5 px-4 bg-[#F8FAFC] border border-[#E5E7EB] focus:bg-white rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-[#7C3AED]/10 focus:border-[#7C3AED] transition-all font-medium text-[#111827]"
                  placeholder="e.g. 60"
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

      {/* OFFER LETTER TEMPLATE TAB */}
      {activeTab === 'template' && (
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-8 max-w-3xl mx-auto space-y-8 shadow-sm animate-in fade-in duration-300">
          <div className="border-b border-[#E5E7EB] pb-5">
            <h2 className="text-lg font-bold text-[#111827] tracking-tight">Configure Offer Letter Template</h2>
            <p className="text-xs text-[#4B5563] font-medium mt-1">Set up a default structure for your company's offer letters. Use placeholders to dynamically inject student details when issuing.</p>
          </div>

          {templateSuccess && (
            <div className="bg-[#22C55E]/10 border border-[#22C55E]/20 text-[#22C55E] p-4 rounded-xl flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-[#22C55E] flex-shrink-0" />
              <p className="text-xs font-bold leading-normal">{templateSuccess}</p>
            </div>
          )}

          {templateError && (
            <div className="bg-rose-50 border border-rose-200 text-rose-600 p-4 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-500 mt-0.5 flex-shrink-0" />
              <p className="text-xs font-bold leading-normal">{templateError}</p>
            </div>
          )}

          <form className="space-y-6 text-[#4B5563] font-semibold" onSubmit={handleUpdateTemplate}>
            {/* Guide placeholders */}
            <div className="p-4 bg-slate-50 border border-[#E5E7EB] rounded-xl space-y-2">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Available Placeholders</h4>
              <div className="flex flex-wrap gap-2 text-[10px]">
                <span className="bg-white border border-[#E5E7EB] px-2 py-1 rounded text-slate-600 font-mono font-bold">{"{{STUDENT_NAME}}"}</span>
                <span className="bg-white border border-[#E5E7EB] px-2 py-1 rounded text-slate-600 font-mono font-bold">{"{{ROLL_NUMBER}}"}</span>
                <span className="bg-white border border-[#E5E7EB] px-2 py-1 rounded text-slate-600 font-mono font-bold">{"{{BRANCH}}"}</span>
                <span className="bg-white border border-[#E5E7EB] px-2 py-1 rounded text-slate-600 font-mono font-bold">{"{{CGPA}}"}</span>
                <span className="bg-white border border-[#E5E7EB] px-2 py-1 rounded text-slate-600 font-mono font-bold">{"{{CTC}}"}</span>
                <span className="bg-white border border-[#E5E7EB] px-2 py-1 rounded text-slate-600 font-mono font-bold">{"{{JOB_TITLE}}"}</span>
                <span className="bg-white border border-[#E5E7EB] px-2 py-1 rounded text-slate-600 font-mono font-bold">{"{{COMPANY_NAME}}"}</span>
                <span className="bg-white border border-[#E5E7EB] px-2 py-1 rounded text-slate-600 font-mono font-bold">{"{{DATE}}"}</span>
              </div>
            </div>

            {/* Template content editor */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider">Offer Letter Structure (HTML / Text) *</label>
              <textarea
                required
                rows="12"
                value={offerTemplate}
                onChange={(e) => setOfferTemplate(e.target.value)}
                className="block w-full py-2.5 px-4 bg-[#F8FAFC] border border-[#E5E7EB] focus:bg-white rounded-xl text-sm font-mono placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-[#7C3AED]/10 focus:border-[#7C3AED] text-[#111827]"
                placeholder="Enter HTML or plain text offer letter structure..."
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={savingTemplate}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-[#22C55E] hover:bg-[#16A34A] focus:outline-none focus:ring-4 focus:ring-[#22C55E]/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md active:scale-[0.98]"
              >
                {savingTemplate ? (
                  <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  'Save Offer Letter Template'
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ISSUE OFFER LETTER MODAL */}
      {isOfferModalOpen && selectedAppForOffer && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/55 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative bg-white rounded-2xl w-full max-w-4xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200 text-[#4B5563]">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-[#111827] tracking-tight">Issue Offer Letter</h3>
                <p className="text-[11px] text-[#4B5563] font-medium mt-0.5">
                  Review, customize, and issue offer letter for <strong>{selectedAppForOffer.studentId?.name}</strong> for the <strong>{selectedJob?.title}</strong> drive.
                </p>
              </div>
              <button
                onClick={() => setIsOfferModalOpen(false)}
                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
              >
                <XCircle className="w-5 h-5 text-rose-500" />
              </button>
            </div>

            {/* Toggle selection */}
            <div className="px-6 pt-4 flex gap-4">
              <label className="flex items-center gap-1.5 font-semibold text-xs text-slate-600 cursor-pointer">
                <input 
                  type="radio" 
                  checked={offerType === 'template'} 
                  onChange={() => setOfferType('template')}
                  className="accent-[#22C55E]"
                />
                <span>Generate from Template</span>
              </label>
              <label className="flex items-center gap-1.5 font-semibold text-xs text-slate-600 cursor-pointer">
                <input 
                  type="radio" 
                  checked={offerType === 'file'} 
                  onChange={() => setOfferType('file')}
                  className="accent-[#22C55E]"
                />
                <span>Upload custom PDF Offer Letter</span>
              </label>
            </div>

            {/* Modal Body */}
            <div className="p-6 max-h-[60vh] overflow-y-auto">
              {offerType === 'template' ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left Column: Edit generated offer letter */}
                  <div className="space-y-3">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Customize Offer Content</label>
                    <textarea
                      value={generatedOfferContent}
                      onChange={(e) => setGeneratedOfferContent(e.target.value)}
                      rows="14"
                      className="w-full p-4 bg-slate-50 font-mono text-xs text-[#111827] border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#7C3AED]/10 focus:border-[#7C3AED]"
                    />
                  </div>

                  {/* Right Column: Live Preview */}
                  <div className="space-y-3 flex flex-col">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Live Preview</label>
                    <div className="flex-1 p-6 bg-slate-50 border border-slate-200 rounded-xl overflow-y-auto select-none min-h-[300px]">
                      <div 
                        className="prose prose-sm max-w-none text-slate-700 font-sans text-xs bg-white p-6 rounded-lg border border-slate-100 shadow-sm"
                        dangerouslySetInnerHTML={{ __html: generatedOfferContent }} 
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 p-8 bg-slate-50 border border-dashed border-slate-300 rounded-2xl text-center">
                  <Upload className="w-12 h-12 text-slate-400 mx-auto" />
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-700">Upload candidate's custom PDF offer letter</p>
                    <p className="text-[10px] text-slate-400">PDF documents only, up to 10MB</p>
                  </div>
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={(e) => setUploadedFile(e.target.files[0])}
                    className="block mx-auto text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 cursor-pointer"
                  />
                  {uploadedFile && (
                    <p className="text-xs font-bold text-emerald-600 mt-2">Selected File: {uploadedFile.name}</p>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3 font-semibold">
              <button
                onClick={() => setIsOfferModalOpen(false)}
                className="px-4 py-2 border border-slate-200 hover:bg-white text-xs text-slate-700 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSendOfferLetter}
                disabled={submittingOffer}
                className="px-4 py-2 bg-[#22C55E] hover:bg-[#16A34A] text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
              >
                {submittingOffer ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    Submit to Placement Cell
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ATS AUTO-SHORTLIST MODAL */}
      {isAtsModalOpen && selectedJob && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/55 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden animate-in zoom-in-95 duration-200 p-6 space-y-5 text-[#4B5563]">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-5 h-5 text-[#7C3AED]" />
                <h3 className="text-base font-bold text-[#111827] tracking-tight">ATS Auto-Shortlist</h3>
              </div>
              <button
                onClick={() => setIsAtsModalOpen(false)}
                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
              >
                <XCircle className="w-5 h-5 text-rose-500" />
              </button>
            </div>

            <p className="text-xs font-semibold leading-relaxed">
              Dynamically select candidates for the next round using the ATS Resume Score matcher. Candidates who meet the score threshold will be automatically shortlisted.
            </p>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Evaluation Stage / Round Name *</label>
                <select
                  value={atsRoundName}
                  onChange={(e) => setAtsRoundName(e.target.value)}
                  className="block w-full py-2.5 px-3 bg-white border border-[#E5E7EB] rounded-xl text-xs font-semibold text-[#111827] focus:outline-none"
                >
                  {(selectedJob.rounds && selectedJob.rounds.length > 0 ? selectedJob.rounds.map(r => r.name) : [
                    'Aptitude Test', 'Group Discussion (GD)', 'Technical Interview', 'HR Round'
                  ]).map((rName, idx) => (
                    <option key={idx} value={rName}>{rName}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Minimum ATS Match Score: <span className="text-[#7C3AED] font-extrabold">{atsThreshold}%</span></label>
                </div>
                <input
                  type="range"
                  min="30"
                  max="95"
                  step="5"
                  value={atsThreshold}
                  onChange={(e) => setAtsThreshold(e.target.value)}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#7C3AED]"
                />
                <div className="flex justify-between text-[9px] font-bold text-slate-400">
                  <span>30% Match</span>
                  <span>70% (Rec.)</span>
                  <span>95% Match</span>
                </div>
              </div>

              {/* Match preview count */}
              {(() => {
                const count = applicants.filter(a => a.status === 'Applied' && a.atsScore >= atsThreshold).length;
                return (
                  <div className="p-3 bg-[#FAF5FF] border border-[#F3E8FF] rounded-xl text-center">
                    <p className="text-xs font-bold text-[#7C3AED]">
                      Found {count} eligible applicant(s) in "Applied" status matching &ge; {atsThreshold}% score.
                    </p>
                  </div>
                );
              })()}
            </div>

            <div className="flex items-center justify-end gap-2 font-semibold pt-2 border-t border-slate-100">
              <button
                onClick={() => setIsAtsModalOpen(false)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-xs rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                disabled={isAtsProcessing || applicants.filter(a => a.status === 'Applied' && a.atsScore >= atsThreshold).length === 0}
                onClick={handleAtsShortlist}
                className="px-4 py-2 bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
              >
                {isAtsProcessing ? 'Shortlisting...' : 'Shortlist Matches'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CSV RESULTS UPLOAD MODAL */}
      {isCsvResultModalOpen && selectedJob && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/55 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden animate-in zoom-in-95 duration-200 p-6 space-y-5 text-[#4B5563]">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-1.5">
                <Upload className="w-5 h-5 text-[#22C55E]" />
                <h3 className="text-base font-bold text-[#111827] tracking-tight">Upload Evaluation Results</h3>
              </div>
              <button
                onClick={() => setIsCsvResultModalOpen(false)}
                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
              >
                <XCircle className="w-5 h-5 text-rose-500" />
              </button>
            </div>

            {csvResultsSuccess ? (
              <div className="space-y-4 py-3 text-center">
                <CheckCircle2 className="w-12 h-12 text-[#22C55E] mx-auto animate-bounce" />
                <p className="text-xs font-bold text-slate-800">{csvResultsSuccess}</p>
                <button
                  onClick={() => {
                    setIsCsvResultModalOpen(false);
                    setCsvResultsSuccess('');
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-xs font-bold rounded-xl transition-colors"
                >
                  Close Window
                </button>
              </div>
            ) : (
              <form onSubmit={handleUploadCsvResults} className="space-y-4">
                <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-[10px] font-semibold leading-normal space-y-1 text-blue-700">
                  <p className="font-bold">📄 Instructions & Sample Format:</p>
                  <p>CSV file must have candidate email or roll number in the first column, result ("Passed" or "Failed") in the second, and optional notes in the third.</p>
                  <p className="font-mono mt-1 bg-white p-1 rounded border border-blue-200">
                    student@email.com, Passed, Good coding skills<br/>
                    2023CSE41, Failed, Communication gap
                  </p>
                  <p className="font-bold text-[9px] text-[#7C3AED] mt-1.5">⚠️ Note: Result updates require Placement Cell (TPO) approval before being applied.</p>
                </div>

                {csvResultsError && (
                  <div className="bg-rose-50 border border-rose-100 text-rose-650 p-2.5 rounded-xl text-[10px] font-bold">
                    ⚠️ Error: {csvResultsError}
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Evaluation Stage / Round Name *</label>
                  <select
                    value={csvResultRoundId}
                    onChange={(e) => setCsvResultRoundId(e.target.value)}
                    className="block w-full py-2.5 px-3 bg-white border border-[#E5E7EB] rounded-xl text-xs font-semibold text-[#111827] focus:outline-none"
                  >
                    {jobRounds.map((round) => (
                      <option key={round._id} value={round._id}>{round.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Choose Results CSV File *</label>
                  <input
                    type="file"
                    id="csv-result-file-input"
                    accept=".csv"
                    required
                    onChange={(e) => setCsvResultFile(e.target.files[0])}
                    className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 font-semibold pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsCsvResultModalOpen(false)}
                    className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-xs rounded-xl transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isUploadingCsvResults || !csvResultFile}
                    className="px-4 py-2 bg-[#22C55E] hover:bg-[#16A34A] text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    {isUploadingCsvResults ? 'Uploading...' : 'Submit Results Sheet'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* OVERRIDE AI DECISION MODAL */}
      {isOverrideModalOpen && overrideApp && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/55 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden animate-in zoom-in-95 duration-200 p-6 space-y-5 text-[#4B5563]">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-[#111827] tracking-tight">Override AI Decision</h3>
              <button onClick={() => setIsOverrideModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer">
                <XCircle className="w-5 h-5 text-rose-500" />
              </button>
            </div>
            <form onSubmit={handleOverrideDecisionSubmit} className="space-y-4">
              <div className="space-y-1">
                <p className="text-xs font-semibold">Candidate: <strong>{overrideApp.studentId?.name}</strong></p>
                <p className="text-[11px] text-slate-500">Current overall status: {overrideApp.status}</p>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Override Status *</label>
                <select
                  value={overrideForm.status}
                  onChange={(e) => setOverrideForm(prev => ({ ...prev, status: e.target.value }))}
                  className="block w-full py-2 px-3 bg-white border border-[#E5E7EB] rounded-xl text-xs font-semibold text-[#111827] focus:outline-none"
                >
                  <option value="Shortlisted">Shortlisted (Shortlist for round progression)</option>
                  <option value="Rejected">Rejected (Eliminate / Send Rejection Reason)</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Override Reason *</label>
                <textarea
                  required
                  rows="3"
                  value={overrideForm.reason}
                  onChange={(e) => setOverrideForm(prev => ({ ...prev, reason: e.target.value }))}
                  placeholder="Provide a detailed explanation for overriding the AI screening decision."
                  className="block w-full py-2 px-3 bg-[#F8FAFC] border border-[#E5E7EB] focus:bg-white rounded-xl text-xs font-medium text-[#111827] placeholder-slate-400 focus:outline-none"
                />
              </div>
              <div className="flex items-center justify-end gap-2 font-semibold pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setIsOverrideModalOpen(false)} className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-xs rounded-xl transition-colors cursor-pointer">
                  Cancel
                </button>
                <button type="submit" disabled={isSubmittingOverride || !overrideForm.reason} className="px-4 py-2 bg-purple-650 hover:bg-purple-750 text-white text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer">
                  {isSubmittingOverride ? 'Overriding...' : 'Apply Override'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD ROUND MODAL */}
      {isAddingRoundModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/55 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden animate-in zoom-in-95 duration-200 p-6 space-y-5 text-[#4B5563]">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-[#111827] tracking-tight">Add Hiring Round</h3>
              <button onClick={() => setIsAddingRoundModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer">
                <XCircle className="w-5 h-5 text-rose-500" />
              </button>
            </div>
            <form onSubmit={handleCreateRound} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Round Name *</label>
                  <input type="text" name="name" required placeholder="e.g. Coding Round" className="block w-full py-2 px-3 bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl text-xs font-medium text-[#111827] focus:outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Mode *</label>
                  <select name="mode" className="block w-full py-2 px-3 bg-white border border-[#E5E7EB] rounded-xl text-xs font-semibold text-[#111827] focus:outline-none">
                    <option value="Online">Online</option>
                    <option value="Physical">Physical</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Description</label>
                <input type="text" name="description" placeholder="e.g. Solve 3 algorithms problems on HackerRank" className="block w-full py-2 px-3 bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl text-xs font-medium text-[#111827] focus:outline-none" />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Date</label>
                  <input type="date" name="date" className="block w-full py-2 px-3 bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl text-xs font-medium text-[#111827] focus:outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Time</label>
                  <input type="time" name="time" className="block w-full py-2 px-3 bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl text-xs font-medium text-[#111827] focus:outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Platform</label>
                  <input type="text" name="platform" placeholder="e.g. Google Meet, Zoom" className="block w-full py-2 px-3 bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl text-xs font-medium text-[#111827] focus:outline-none" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Meeting Link</label>
                <input type="text" name="meetingLink" placeholder="e.g. meet.google.com/abc-defg-hij" className="block w-full py-2 px-3 bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl text-xs font-medium text-[#111827] focus:outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Instructions</label>
                <textarea rows="2" name="instructions" placeholder="e.g. Keep your camera on. Have photo ID proof ready." className="block w-full py-2 px-3 bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl text-xs font-medium text-[#111827] focus:outline-none" />
              </div>
              <div className="flex items-center justify-end gap-2 font-semibold pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setIsAddingRoundModalOpen(false)} className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-xs rounded-xl transition-colors cursor-pointer">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-[#22C55E] hover:bg-[#16A34A] text-white text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer">
                  Create Stage
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT ROUND MODAL */}
      {isEditingRoundModalOpen && editingRound && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/55 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden animate-in zoom-in-95 duration-200 p-6 space-y-5 text-[#4B5563]">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-[#111827] tracking-tight">Edit Hiring Stage</h3>
              <button onClick={() => { setIsEditingRoundModalOpen(false); setEditingRound(null); }} className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer">
                <XCircle className="w-5 h-5 text-rose-500" />
              </button>
            </div>
            <form onSubmit={handleUpdateRound} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Round Name *</label>
                  <input type="text" name="name" required defaultValue={editingRound.name} className="block w-full py-2 px-3 bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl text-xs font-medium text-[#111827] focus:outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Mode *</label>
                  <select name="mode" defaultValue={editingRound.mode} className="block w-full py-2 px-3 bg-white border border-[#E5E7EB] rounded-xl text-xs font-semibold text-[#111827] focus:outline-none">
                    <option value="Online">Online</option>
                    <option value="Physical">Physical</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Description</label>
                <input type="text" name="description" defaultValue={editingRound.description} className="block w-full py-2 px-3 bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl text-xs font-medium text-[#111827] focus:outline-none" />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Date</label>
                  <input type="date" name="date" defaultValue={editingRound.date ? editingRound.date.split('T')[0] : ''} className="block w-full py-2 px-3 bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl text-xs font-medium text-[#111827] focus:outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Time</label>
                  <input type="time" name="time" defaultValue={editingRound.time} className="block w-full py-2 px-3 bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl text-xs font-medium text-[#111827] focus:outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Platform</label>
                  <input type="text" name="platform" defaultValue={editingRound.platform} className="block w-full py-2 px-3 bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl text-xs font-medium text-[#111827] focus:outline-none" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Meeting Link</label>
                <input type="text" name="meetingLink" defaultValue={editingRound.meetingLink} className="block w-full py-2 px-3 bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl text-xs font-medium text-[#111827] focus:outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Instructions</label>
                <textarea rows="2" name="instructions" defaultValue={editingRound.instructions} className="block w-full py-2 px-3 bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl text-xs font-medium text-[#111827] focus:outline-none" />
              </div>
              <div className="flex items-center justify-end gap-2 font-semibold pt-3 border-t border-slate-100">
                <button type="button" onClick={() => { setIsEditingRoundModalOpen(false); setEditingRound(null); }} className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-xs rounded-xl transition-colors cursor-pointer">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-[#22C55E] hover:bg-[#16A34A] text-white text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MANUAL RESULTS GRADING MODAL */}
      {selectedRoundForResults && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/55 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative bg-white rounded-2xl w-full max-w-4xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200 p-6 space-y-5 text-[#4B5563]">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-[#111827] tracking-tight">Grade Stage Candidates</h3>
                <p className="text-[10px] font-bold text-[#7C3AED] uppercase mt-0.5">Round: {selectedRoundForResults.name}</p>
              </div>
              <button onClick={() => setSelectedRoundForResults(null)} className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer">
                <XCircle className="w-5 h-5 text-rose-500" />
              </button>
            </div>

            {manualResultsSuccess && (
              <div className="bg-[#22C55E]/10 border border-[#22C55E]/20 text-[#22C55E] p-3 rounded-xl text-xs font-bold">
                {manualResultsSuccess}
              </div>
            )}
            {manualResultsError && (
              <div className="bg-rose-50 border border-rose-100 text-rose-650 p-3 rounded-xl text-xs font-bold">
                {manualResultsError}
              </div>
            )}

            {manualRoundResultsList.length === 0 ? (
              <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed">
                <p className="text-xs font-semibold text-slate-500">No candidates are currently active/pending evaluation in this stage.</p>
              </div>
            ) : (
              <form onSubmit={handleManualResultsSubmit} className="space-y-4">
                <div className="max-h-[350px] overflow-y-auto border border-slate-150 rounded-xl shadow-inner">
                  <table className="w-full text-xs font-semibold">
                    <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 text-slate-700 font-bold">
                      <tr>
                        <th className="p-3 text-left">Roll Number</th>
                        <th className="p-3 text-left">Student Name</th>
                        <th className="p-3 text-left">Round Outcome</th>
                        <th className="p-3 text-left">Score (0-100)</th>
                        <th className="p-3 text-left">Remarks / Review Feedback</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-150 bg-white">
                      {manualRoundResultsList.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="p-3 font-mono">{item.rollNumber}</td>
                          <td className="p-3 text-[#111827]">{item.name}</td>
                          <td className="p-3">
                            <select
                              value={item.result}
                              onChange={(e) => handleManualResultFieldChange(idx, 'result', e.target.value)}
                              className="py-1 px-2.5 bg-white border border-[#E5E7EB] rounded-lg text-xs font-semibold text-[#111827] focus:outline-none cursor-pointer"
                            >
                              <option value="Selected">Selected (Passed)</option>
                              <option value="Rejected">Rejected (Eliminated)</option>
                              <option value="Absent">Absent</option>
                              <option value="Waiting">Waiting</option>
                            </select>
                          </td>
                          <td className="p-3">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={item.score}
                              onChange={(e) => handleManualResultFieldChange(idx, 'score', e.target.value)}
                              className="w-20 py-1 px-2 bg-white border border-[#E5E7EB] rounded-lg text-xs font-semibold text-[#111827] focus:outline-none"
                            />
                          </td>
                          <td className="p-3">
                            <input
                              type="text"
                              value={item.remarks}
                              placeholder="e.g. Solid coding performance, weak system design"
                              onChange={(e) => handleManualResultFieldChange(idx, 'remarks', e.target.value)}
                              className="w-full py-1 px-2 bg-[#F8FAFC] border border-[#E5E7EB] rounded-lg text-xs font-medium text-[#111827] focus:outline-none focus:bg-white"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex items-center justify-end gap-2 font-semibold pt-3 border-t border-slate-100">
                  <button type="button" onClick={() => setSelectedRoundForResults(null)} className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-xs rounded-xl transition-colors cursor-pointer">
                    Cancel
                  </button>
                  <button type="submit" disabled={isSubmittingManualResults} className="px-4 py-2 bg-[#22C55E] hover:bg-[#16A34A] text-white text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer">
                    {isSubmittingManualResults ? 'Submitting Grading...' : 'Submit Marking Sheet'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default RecruiterDashboard;
