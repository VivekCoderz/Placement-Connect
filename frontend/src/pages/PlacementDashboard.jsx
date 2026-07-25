import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { 
  Building2, Briefcase, Users, Calendar, DollarSign, Award, Plus, Check, Eye, FileText, ArrowRight, Clock, MapPin, 
  Globe, Phone, User, AlertCircle, RefreshCw, CheckCircle2, XCircle, ChevronRight, Download, Send, Search, BarChart3,
  Upload, Filter, TrendingUp, GraduationCap, BellRing
} from 'lucide-react';
import api from '../utils/api';

const PlacementDashboard = () => {
  const user = useSelector((state) => state.auth.user);

  const [activeTab, setActiveTab] = useState('overview'); // overview | monitor | analyser | notify | csv | recruiterShortlists
  const [drives, setDrives] = useState([]);
  const [applications, setApplications] = useState([]);
  const [students, setStudents] = useState([]);
  const [proposals, setProposals] = useState([]);
  const [shortlists, setShortlists] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Filter states
  const [monitorSearch, setMonitorSearch] = useState('');
  const [analyserBranch, setAnalyserBranch] = useState('All');
  const [analyserCgpa, setAnalyserCgpa] = useState('0');
  const [analyserSearch, setAnalyserSearch] = useState('');

  // Notification form state
  const [notifForm, setNotifForm] = useState({
    jobId: '',
    roundName: '',
    roundDate: '',
    message: ''
  });
  const [isSendingNotif, setIsSendingNotif] = useState(false);
  const [notifSuccess, setNotifSuccess] = useState('');
  const [notifError, setNotifError] = useState('');

  // CSV Shortlist state
  const [csvForm, setCsvForm] = useState({
    jobId: '',
    roundName: ''
  });
  const [csvFile, setCsvFile] = useState(null);
  const [isUploadingCsv, setIsUploadingCsv] = useState(false);
  const [csvSuccess, setCsvSuccess] = useState('');
  const [csvError, setCsvError] = useState('');

  // Offer Letter Review state
  const [selectedAppForReview, setSelectedAppForReview] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  // Reports state
  const [reportFilterStatus, setReportFilterStatus] = useState('Selected'); // Selected | Rejected | All
  const [reportFilterBranch, setReportFilterBranch] = useState('All');
  const [reportFilterCompany, setReportFilterCompany] = useState('All');
  const [reportSearchQuery, setReportSearchQuery] = useState('');

  const handleApproveOffer = async (appId) => {
    setSubmittingReview(true);
    try {
      const response = await api.put(`/api/applications/${appId}/approve-offer`);
      if (response.status === 200) {
        alert("Offer letter approved and sent to student!");
        // Update applications list
        setApplications(prev => prev.map(a => a._id === appId ? { ...a, offerLetterStatus: 'Approved', status: 'Selected' } : a));
        setSelectedAppForReview(null);
      }
    } catch (err) {
      console.error("Failed to approve offer letter:", err);
      alert(err.response?.data?.message || "Failed to approve offer letter.");
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleRejectOffer = async (appId) => {
    if (!rejectReason.trim()) {
      alert("Please provide a reason for rejection.");
      return;
    }
    setSubmittingReview(true);
    try {
      const response = await api.put(`/api/applications/${appId}/reject-offer`, { reason: rejectReason });
      if (response.status === 200) {
        alert("Offer letter rejected.");
        // Update applications list
        setApplications(prev => prev.map(a => a._id === appId ? { ...a, offerLetterStatus: 'Rejected' } : a));
        setSelectedAppForReview(null);
        setRejectReason('');
      }
    } catch (err) {
      console.error("Failed to reject offer letter:", err);
      alert(err.response?.data?.message || "Failed to reject offer letter.");
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleExportCSV = (data, status) => {
    const headers = ["Student Name", "Roll Number", "Email", "Branch", "Year", "CGPA", "Company", "Job Title", "CTC (LPA)", "Application Status", "Offer Letter Status"];
    const rows = data.map(item => [
      item.studentId?.name || '',
      item.studentId?.rollNumber || '',
      item.studentId?.email || '',
      item.studentId?.branch || '',
      item.studentId?.year || '',
      item.studentId?.cgpa || '',
      item.jobId?.companyId?.name || '',
      item.jobId?.title || '',
      item.jobId?.package || '',
      item.status || '',
      item.offerLetterStatus || 'None'
    ]);
    
    const csvContent = [headers, ...rows].map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${status}_Students_Report_${new Date().toLocaleDateString().replace(/\//g, '-')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = (data, status) => {
    const printWindow = window.open('', '_blank');
    const dateStr = new Date().toLocaleDateString();
    
    let tableRowsHtml = data.map((item, idx) => `
      <tr style="border-bottom: 1px solid #E2E8F0;">
        <td style="padding: 10px; text-align: left;">${idx + 1}</td>
        <td style="padding: 10px; text-align: left;"><strong>${item.studentId?.name || 'N/A'}</strong></td>
        <td style="padding: 10px; text-align: left;">${item.studentId?.rollNumber || 'N/A'}</td>
        <td style="padding: 10px; text-align: left;">${item.studentId?.branch || 'N/A'}</td>
        <td style="padding: 10px; text-align: left;">${item.studentId?.cgpa || 'N/A'}</td>
        <td style="padding: 10px; text-align: left;">${item.jobId?.companyId?.name || 'N/A'}</td>
        <td style="padding: 10px; text-align: left;">${item.jobId?.title || 'N/A'}</td>
        <td style="padding: 10px; text-align: left;">${item.jobId?.package || 'N/A'} LPA</td>
        <td style="padding: 10px; text-align: left;"><span style="background: ${item.status === 'Selected' ? '#DEF7EC' : item.status === 'Rejected' ? '#FDE8E8' : '#EBF5FF'}; color: ${item.status === 'Selected' ? '#03543F' : item.status === 'Rejected' ? '#9B1C1C' : '#1E429F'}; padding: 4px 8px; border-radius: 4px; font-weight: bold; font-size: 10px;">${item.status}</span></td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>${status} Students Report</title>
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #2D3748; margin: 40px; }
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #6D5EF7; padding-bottom: 20px; margin-bottom: 30px; }
            .logo-section h1 { margin: 0; font-size: 24px; color: #1A202C; }
            .logo-section p { margin: 5px 0 0 0; font-size: 12px; color: #718096; font-weight: bold; }
            .report-info { text-align: right; font-size: 12px; color: #718096; }
            .report-title { text-align: center; margin-bottom: 30px; }
            .report-title h2 { margin: 0; font-size: 20px; color: #2D3748; text-transform: uppercase; letter-spacing: 1px; }
            .report-title p { margin: 5px 0 0 0; font-size: 12px; color: #718096; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 30px; font-size: 11px; }
            th { background-color: #F7FAFC; color: #4A5568; font-weight: bold; padding: 12px 10px; border-bottom: 2px solid #E2E8F0; text-align: left; text-transform: uppercase; }
            td { padding: 12px 10px; border-bottom: 1px solid #E2E8F0; color: #4A5568; }
            .footer { margin-top: 50px; display: flex; justify-content: space-between; font-size: 11px; color: #A0AEC0; border-top: 1px solid #E2E8F0; padding-top: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo-section">
              <h1>GEETA UNIVERSITY</h1>
              <p>Training & Placement Cell</p>
            </div>
            <div class="report-info">
              <p>Date Generated: ${dateStr}</p>
              <p>Generated By: Placement Officer</p>
            </div>
          </div>
          
          <div class="report-title">
            <h2>Placement Campaign Report — ${status} Candidates</h2>
            <p>Summarized list of students processed under campus placement drives</p>
          </div>
          
          <table>
            <thead>
              <tr>
                <th style="width: 5%">S.No</th>
                <th style="width: 20%">Student Name</th>
                <th style="width: 15%">Roll Number</th>
                <th style="width: 10%">Branch</th>
                <th style="width: 8%">CGPA</th>
                <th style="width: 15%">Company</th>
                <th style="width: 15%">Job Title</th>
                <th style="width: 8%">CTC</th>
                <th style="width: 10%">Status</th>
              </tr>
            </thead>
            <tbody>
              ${tableRowsHtml || '<tr><td colspan="9" style="text-align:center;">No students matching criteria</td></tr>'}
            </tbody>
          </table>
          
          <div class="footer">
            <p>© ${new Date().getFullYear()} Geeta University PlacementConnect. Confidential Report.</p>
            <p>Authorized Signature: _______________________</p>
          </div>
          
          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() {
                window.close();
              };
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch drives
      const drivesRes = await api.get('/api/placement/drives');
      setDrives(drivesRes.data.drives || []);

      // 2. Fetch applications
      const appsRes = await api.get('/api/placement/applications');
      setApplications(appsRes.data.applications || []);

      // 3. Fetch proposals (notifications of type 'schedule_propose')
      try {
        const notifsRes = await api.get('/api/notifications');
        const list = (notifsRes.data.notifications || []).filter(n => n.type === 'schedule_propose');
        setProposals(list);
      } catch (err) {
        console.error('Failed to load proposals:', err);
      }

      // Fetch recruiter shortlists
      try {
        const shortlistsRes = await api.get('/api/placement/shortlists');
        setShortlists(shortlistsRes.data.shortlists || []);
      } catch (err) {
        console.error('Failed to load shortlists:', err);
      }

      // 4. Extract students list from applications or make distinct list
      const extractedStudents = [];
      const studentIdsSeen = new Set();
      (appsRes.data.applications || []).forEach(app => {
        if (app.studentId && !studentIdsSeen.has(app.studentId._id)) {
          studentIdsSeen.add(app.studentId._id);
          extractedStudents.push({
            ...app.studentId,
            appliedJobsCount: 1,
            applicationStatus: app.status
          });
        } else if (app.studentId) {
          const existing = extractedStudents.find(s => s._id === app.studentId._id);
          if (existing) {
            existing.appliedJobsCount++;
            if (app.status === 'Selected') existing.applicationStatus = 'Selected';
          }
        }
      });
      setStudents(extractedStudents);
    } catch (err) {
      console.error('Failed to load placement cell data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleSendNotification = async (e) => {
    e.preventDefault();
    setNotifSuccess('');
    setNotifError('');

    if (!notifForm.message) {
      setNotifError('Please type a notification message');
      return;
    }

    setIsSendingNotif(true);
    try {
      const response = await api.post('/api/placement/notify', {
        jobId: notifForm.jobId || undefined,
        roundName: notifForm.roundName || undefined,
        roundDate: notifForm.roundDate || undefined,
        message: notifForm.message
      });

      if (response.status === 200) {
        setNotifSuccess(response.data.message || 'Notification sent successfully to students!');
        setNotifForm({ jobId: '', roundName: '', roundDate: '', message: '' });
      }
    } catch (err) {
      setNotifError(err.response?.data?.message || err.message || 'Failed to dispatch notification');
    } finally {
      setIsSendingNotif(false);
    }
  };

  const handleUploadCsv = async (e) => {
    e.preventDefault();
    setCsvSuccess('');
    setCsvError('');

    if (!csvForm.jobId || !csvForm.roundName) {
      setCsvError('Please select a Job Drive and specify the Round Name');
      return;
    }

    if (!csvFile) {
      setCsvError('Please select a CSV file containing student emails or roll numbers');
      return;
    }

    const formData = new FormData();
    formData.append('jobId', csvForm.jobId);
    formData.append('roundName', csvForm.roundName);
    formData.append('file', csvFile);

    setIsUploadingCsv(true);
    try {
      const response = await api.post('/api/placement/shortlist/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.status === 200) {
        setCsvSuccess(response.data.message || 'CSV shortlist processed successfully!');
        setCsvFile(null);
        setCsvForm({ jobId: '', roundName: '' });
        fetchDashboardData(); // Refresh stats and lists
      }
    } catch (err) {
      setCsvError(err.response?.data?.message || err.message || 'Failed to process CSV file');
    } finally {
      setIsUploadingCsv(false);
    }
  };

  // Helper Stats calculations
  const totalDrivesCount = drives.length;
  const totalApplicationsCount = applications.length;
  const selectedCount = applications.filter(a => a.status === 'Selected').length;
  const shortlistedCount = applications.filter(a => a.status === 'Shortlisted').length;
  const placementRate = totalApplicationsCount > 0 ? ((selectedCount / totalApplicationsCount) * 100).toFixed(1) : 0;

  // Branch analytics
  const branchesList = ['CSE', 'ECE', 'EEE', 'IT', 'MECH', 'CIVIL'];
  const branchStats = branchesList.map(branch => {
    const branchApps = applications.filter(a => a.studentId?.branch?.toUpperCase() === branch);
    const branchSelected = branchApps.filter(a => a.status === 'Selected').length;
    return {
      branch,
      applied: branchApps.length,
      selected: branchSelected,
      rate: branchApps.length > 0 ? ((branchSelected / branchApps.length) * 100).toFixed(0) : 0
    };
  });

  // Action helper when approving recruiter proposed schedule
  const handleApproveProposal = (proposal) => {
    // Parse proposal.message lines
    const lines = proposal.message.split('\n');
    let roundName = 'Evaluation Round';
    let roundDate = '';
    
    // Attempt basic extraction
    lines.forEach(l => {
      if (l.includes('- Rounds:')) roundName = `Round ${l.split(':')[1]?.trim() || ''}`;
      if (l.includes('- Date/Time:')) {
        const dateStr = l.substring(l.indexOf(':') + 1).trim();
        try {
          const parsed = new Date(dateStr);
          if (!isNaN(parsed.getTime())) {
            // format for datetime-local: yyyy-MM-ddThh:mm
            const pad = (n) => n.toString().padStart(2, '0');
            roundDate = `${parsed.getFullYear()}-${pad(parsed.getMonth()+1)}-${pad(parsed.getDate())}T${pad(parsed.getHours())}:${pad(parsed.getMinutes())}`;
          }
        } catch (e) {}
      }
    });

    setNotifForm({
      jobId: '', // Coordinator can select the matching drive manually
      roundName: roundName,
      roundDate: roundDate,
      message: proposal.message
    });
    setActiveTab('notify');
  };

  const formatDateTimeLocal = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    const pad = (n) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 font-sans px-4 sm:px-6 py-6 text-[#4B5563]">
      
      {/* Welcome Header */}
      <div className="bg-[#5B4FCF] text-white rounded-2xl p-8 border border-[#7C6AE6] shadow-xl flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#22C55E]/10 rounded-full blur-[150px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-white/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative z-10 space-y-4 flex-1">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-[#7C6AE6] border border-white/10 flex items-center justify-center shadow-md">
              <GraduationCap className="w-6 h-6 text-[#22C55E]" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-white bg-[#7C6AE6] border border-white/20 px-3 py-1 rounded-full">T&P Officer Console</span>
              <h1 className="text-2xl font-bold tracking-tight text-white mt-2">{user?.name || 'T&P Officer'}</h1>
              <p className="text-purple-100 font-medium text-xs mt-1">{user?.email || 'placementcell@university.edu'}</p>
            </div>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-4 w-full lg:w-auto">
          <div className="bg-[#7C6AE6]/60 p-4 px-5 rounded-xl border border-white/20 text-center">
            <p className="text-[10px] font-bold text-purple-100 uppercase tracking-widest">Active Drives</p>
            <p className="text-xl font-bold text-white mt-1">{totalDrivesCount}</p>
          </div>
          <div className="bg-[#7C6AE6]/60 p-4 px-5 rounded-xl border border-white/20 text-center">
            <p className="text-[10px] font-bold text-purple-100 uppercase tracking-widest">Applications</p>
            <p className="text-xl font-bold text-white mt-1">{totalApplicationsCount}</p>
          </div>
          <div className="bg-[#7C6AE6]/60 p-4 px-5 rounded-xl border border-white/20 text-center">
            <p className="text-[10px] font-bold text-purple-100 uppercase tracking-widest">Shortlisted</p>
            <p className="text-xl font-bold text-purple-50 mt-1">{shortlistedCount}</p>
          </div>
          <div className="bg-[#7C6AE6]/60 p-4 px-5 rounded-xl border border-white/20 text-center">
            <p className="text-[10px] font-bold text-purple-100 uppercase tracking-widest">Placed</p>
            <p className="text-xl font-bold text-[#22C55E] mt-1">{selectedCount}</p>
          </div>
        </div>
      </div>

      {/* Main Tabs */}
      <div className="flex flex-wrap bg-white border border-[#E5E7EB] p-1 rounded-xl max-w-5xl gap-1 shadow-sm">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex-1 min-w-[120px] flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
            activeTab === 'overview' ? 'bg-[#22C55E] text-white shadow-sm' : 'text-[#94A3B8] hover:text-[#4B5563] hover:bg-[#F8FAFC]'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" /> Overview
        </button>
        <button
          onClick={() => setActiveTab('monitor')}
          className={`flex-1 min-w-[120px] flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
            activeTab === 'monitor' ? 'bg-[#22C55E] text-white shadow-sm' : 'text-[#94A3B8] hover:text-[#4B5563] hover:bg-[#F8FAFC]'
          }`}
        >
          <Briefcase className="w-3.5 h-3.5" /> Monitor Drives
        </button>
        <button
          onClick={() => setActiveTab('analyser')}
          className={`flex-1 min-w-[120px] flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
            activeTab === 'analyser' ? 'bg-[#22C55E] text-white shadow-sm' : 'text-[#94A3B8] hover:text-[#4B5563] hover:bg-[#F8FAFC]'
          }`}
        >
          <Search className="w-3.5 h-3.5" /> Analyser
        </button>
        <button
          onClick={() => setActiveTab('notify')}
          className={`flex-1 min-w-[120px] flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
            activeTab === 'notify' ? 'bg-[#22C55E] text-white shadow-sm' : 'text-[#94A3B8] hover:text-[#4B5563] hover:bg-[#F8FAFC]'
          }`}
        >
          <Send className="w-3.5 h-3.5" /> Send Update
        </button>
        <button
          onClick={() => setActiveTab('csv')}
          className={`flex-1 min-w-[120px] flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
            activeTab === 'csv' ? 'bg-[#22C55E] text-white shadow-sm' : 'text-[#94A3B8] hover:text-[#4B5563] hover:bg-[#F8FAFC]'
          }`}
        >
          <Upload className="w-3.5 h-3.5" /> Shortlist CSV
        </button>
        <button
          onClick={() => setActiveTab('recruiterShortlists')}
          className={`flex-1 min-w-[120px] flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
            activeTab === 'recruiterShortlists' ? 'bg-[#22C55E] text-white shadow-sm' : 'text-[#94A3B8] hover:text-[#4B5563] hover:bg-[#F8FAFC]'
          }`}
        >
          <Users className="w-3.5 h-3.5" /> Recruiter Shortlists
        </button>
        <button
          onClick={() => setActiveTab('offerLetters')}
          className={`flex-1 min-w-[120px] flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
            activeTab === 'offerLetters' ? 'bg-[#22C55E] text-white shadow-sm' : 'text-[#94A3B8] hover:text-[#4B5563] hover:bg-[#F8FAFC]'
          }`}
        >
          <FileText className="w-3.5 h-3.5" /> Offer Letters
        </button>
        <button
          onClick={() => setActiveTab('reports')}
          className={`flex-1 min-w-[120px] flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
            activeTab === 'reports' ? 'bg-[#22C55E] text-white shadow-sm' : 'text-[#94A3B8] hover:text-[#4B5563] hover:bg-[#F8FAFC]'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" /> Reports
        </button>
      </div>

      {/* Tabs Content */}

      {/* 1. OVERVIEW & ANALYTICS */}
      {activeTab === 'overview' && (
        <div className="space-y-8 animate-in fade-in duration-300">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Main Stats Graph representation */}
            <div className="md:col-span-2 bg-white rounded-2xl border border-[#E5E7EB] p-6 md:p-8 space-y-6 shadow-sm">
              <h3 className="text-base font-bold text-[#111827] tracking-tight flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#22C55E]" /> Branch-wise Placement Analytics
              </h3>

              <div className="space-y-5">
                {branchStats.map(stat => (
                  <div key={stat.branch} className="space-y-2">
                    <div className="flex justify-between items-center text-xs font-bold">
                      <span className="text-[#111827] font-bold">{stat.branch} branch</span>
                      <span className="text-[#4B5563]">{stat.selected} Placed / {stat.applied} Applied ({stat.rate}%)</span>
                    </div>
                    <div className="w-full bg-[#F8FAFC] h-2.5 rounded-full overflow-hidden border border-[#E5E7EB]/50">
                      <div 
                        className="bg-[#22C55E] h-full rounded-full transition-all duration-500" 
                        style={{ width: `${Math.min(stat.rate, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Placement Summary */}
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 md:p-8 space-y-6 shadow-sm">
              <h3 className="text-base font-bold text-[#111827] tracking-tight">Placement Summary</h3>
              
              <div className="space-y-4 text-xs font-semibold">
                <div className="flex justify-between py-2 border-b border-[#E5E7EB]">
                  <span className="text-[#94A3B8]">Overall Placement Rate</span>
                  <span className="text-[#22C55E] font-bold">{placementRate}%</span>
                </div>
                <div className="flex justify-between py-2 border-b border-[#E5E7EB]">
                  <span className="text-[#94A3B8]">Selected Candidates</span>
                  <span className="text-[#111827] font-bold">{selectedCount}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-[#E5E7EB]">
                  <span className="text-[#94A3B8]">Evaluation Shortlists</span>
                  <span className="text-[#111827] font-bold">{shortlistedCount}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-[#E5E7EB]">
                  <span className="text-[#94A3B8]">Direct Applications</span>
                  <span className="text-[#111827] font-bold">{totalApplicationsCount - shortlistedCount}</span>
                </div>
              </div>

              <div className="bg-[#22C55E]/10 border border-[#22C55E]/20 p-5 rounded-xl text-center space-y-1.5">
                <CheckCircle2 className="w-6 h-6 text-[#22C55E] mx-auto" />
                <p className="text-xs font-bold text-[#22C55E] uppercase tracking-widest">Portal Active</p>
                <p className="text-[10px] text-[#4B5563] font-medium leading-relaxed">Notifications and shortlists are automatically synced with student dashboards and recruiter portals.</p>
              </div>
            </div>
          </div>

          {/* Recruiter proposed schedule list - matches the exact requested flow */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 md:p-8 space-y-6 shadow-sm">
            <h3 className="text-base font-bold text-[#111827] tracking-tight flex items-center gap-2">
              <BellRing className="w-4 h-4 text-[#7C3AED]" /> Recruiter Round Schedule Proposals
            </h3>
            <p className="text-xs text-[#4B5563] font-medium">Incoming proposals from company recruiters specifying round counts, target intake, and timings. Review and notify students.</p>

            {proposals.length === 0 ? (
              <div className="text-center py-10 bg-[#F8FAFC] rounded-xl border border-dashed border-[#E5E7EB]">
                <Clock className="w-8 h-8 text-[#94A3B8] mx-auto mb-2" />
                <p className="text-xs font-medium text-[#94A3B8]">No round schedule proposals received from recruiters yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {proposals.map((proposal) => (
                  <div key={proposal._id} className="p-5 bg-[#F8FAFC] rounded-xl border border-[#E5E7EB] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-all hover:bg-[#F1F5F9]">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                        <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider bg-amber-50 px-2.5 py-0.5 rounded border border-amber-250">Pending Evaluation Setup</span>
                      </div>
                      <p className="text-xs font-semibold text-[#4B5563] whitespace-pre-wrap leading-relaxed">{proposal.message}</p>
                      <p className="text-[9px] text-[#94A3B8] font-bold">Received: {new Date(proposal.createdAt).toLocaleString()}</p>
                    </div>

                    <button
                      onClick={() => handleApproveProposal(proposal)}
                      className="px-4 py-2 bg-[#22C55E] hover:bg-[#16A34A] text-white text-xs font-bold rounded-xl shadow-sm transition-all whitespace-nowrap self-end sm:self-center active:scale-[0.98]"
                    >
                      Approve & Dispatch Update
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. DRIVES MONITOR */}
      {activeTab === 'monitor' && (
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 md:p-8 space-y-6 shadow-sm animate-in fade-in duration-300">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-[#E5E7EB]">
            <div>
              <h3 className="text-base font-bold text-[#111827] tracking-tight">Monitor Campus Placement Drives</h3>
              <p className="text-xs text-[#4B5563] font-medium mt-1">Real-time drive status, eligibility statistics, and applications received.</p>
            </div>
            
            <div className="relative w-full sm:w-64">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#94A3B8]">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={monitorSearch}
                onChange={(e) => setMonitorSearch(e.target.value)}
                className="pl-9 block w-full py-2 px-3 bg-white border border-[#E5E7EB] rounded-xl text-xs placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-[#7C3AED]/10 focus:border-[#7C3AED] font-medium text-[#111827]"
                placeholder="Search drive or company..."
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {drives
              .filter(drive => 
                drive.title.toLowerCase().includes(monitorSearch.toLowerCase()) || 
                (drive.companyId?.name || '').toLowerCase().includes(monitorSearch.toLowerCase())
              )
              .map(drive => {
                const driveApps = applications.filter(a => a.jobId?._id === drive._id);
                const driveSelected = driveApps.filter(a => a.status === 'Selected').length;
                const driveShortlisted = driveApps.filter(a => a.status === 'Shortlisted').length;
                
                return (
                  <div key={drive._id} className="p-6 rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] hover:bg-[#F1F5F9] transition-all duration-300 space-y-4">
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-white border border-[#E5E7EB] flex items-center justify-center font-bold text-[#7C3AED] text-xs shadow-sm">
                          {drive.companyId?.name ? drive.companyId.name.substring(0,2).toUpperCase() : 'CO'}
                        </div>
                        <div>
                          <h4 className="font-bold text-[#111827] text-sm tracking-tight">{drive.title}</h4>
                          <p className="text-[10px] text-[#94A3B8] font-semibold mt-0.5">{drive.companyId?.name || 'Company Profile'}</p>
                        </div>
                      </div>
                      <span className="text-[10px] bg-[#22C55E]/10 border border-[#22C55E]/20 text-[#22C55E] font-bold px-2.5 py-1 rounded-full uppercase">
                        {drive.package} LPA
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-3 bg-white p-3 rounded-xl border border-[#E5E7EB] text-center font-semibold shadow-sm">
                      <div>
                        <p className="text-[9px] font-bold text-[#94A3B8] uppercase tracking-widest">Applicants</p>
                        <p className="text-sm font-bold text-[#111827] mt-1">{driveApps.length}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-bold text-[#94A3B8] uppercase tracking-widest">Shortlisted</p>
                        <p className="text-sm font-bold text-[#7C3AED] mt-1">{driveShortlisted}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-bold text-[#94A3B8] uppercase tracking-widest">Selected</p>
                        <p className="text-sm font-bold text-[#22C55E] mt-1">{driveSelected}</p>
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-[10px] text-[#94A3B8] font-semibold pt-2.5 border-t border-[#E5E7EB]">
                      <span>Cut-off: &gt;={drive.eligibility?.cgpa} CGPA</span>
                      <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Deadline: {new Date(drive.deadline).toLocaleDateString()}</span>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* 3. STUDENT ANALYSER */}
      {activeTab === 'analyser' && (
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 md:p-8 space-y-6 shadow-sm animate-in fade-in duration-300">
          <div className="border-b border-[#E5E7EB] pb-5 space-y-4">
            <div>
              <h3 className="text-base font-bold text-[#111827] tracking-tight">Student Talent Analyser</h3>
              <p className="text-xs text-[#4B5563] font-medium mt-1">Filter, examine, and track selection metrics for campus registered students.</p>
            </div>

            {/* Filters Bar */}
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-[#94A3B8] tracking-wider">Branch:</span>
                <select
                  value={analyserBranch}
                  onChange={(e) => setAnalyserBranch(e.target.value)}
                  className="py-1.5 px-3 bg-white border border-[#E5E7EB] rounded-xl text-xs font-semibold text-[#4B5563] focus:outline-none"
                >
                  <option value="All" className="bg-white text-[#4B5563]">All Branches</option>
                  {branchesList.map(b => <option key={b} value={b} className="bg-white text-[#4B5563]">{b}</option>)}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-[#94A3B8] tracking-wider">Min CGPA:</span>
                <select
                  value={analyserCgpa}
                  onChange={(e) => setAnalyserCgpa(e.target.value)}
                  className="py-1.5 px-3 bg-white border border-[#E5E7EB] rounded-xl text-xs font-semibold text-[#4B5563] focus:outline-none"
                >
                  <option value="0" className="bg-white text-[#4B5563]">All CGPA</option>
                  <option value="6.0" className="bg-white text-[#4B5563]">&gt;= 6.0 CGPA</option>
                  <option value="7.0" className="bg-white text-[#4B5563]">&gt;= 7.0 CGPA</option>
                  <option value="8.0" className="bg-white text-[#4B5563]">&gt;= 8.0 CGPA</option>
                  <option value="9.0" className="bg-white text-[#4B5563]">&gt;= 9.0 CGPA</option>
                </select>
              </div>

              <div className="relative flex-grow sm:flex-grow-0 sm:w-64 ml-auto">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#94A3B8]">
                  <Search className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={analyserSearch}
                  onChange={(e) => setAnalyserSearch(e.target.value)}
                  className="pl-9 block w-full py-1.5 px-3 bg-white border border-[#E5E7EB] rounded-xl text-xs placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-[#7C3AED]/10 focus:border-[#7C3AED] font-medium text-[#111827]"
                  placeholder="Search student name..."
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {students
              .filter(s => analyserBranch === 'All' || s.branch?.toUpperCase() === analyserBranch.toUpperCase())
              .filter(s => parseFloat(s.cgpa) >= parseFloat(analyserCgpa))
              .filter(s => s.name?.toLowerCase().includes(analyserSearch.toLowerCase()))
              .map(student => (
                <div key={student._id} className="p-5 bg-[#F8FAFC] rounded-xl border border-[#E5E7EB] space-y-4 hover:bg-[#F1F5F9] transition-all duration-300">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <h4 className="font-bold text-[#111827] text-sm leading-tight">{student.name}</h4>
                      <p className="text-[10px] text-[#94A3B8] font-mono mt-0.5">{student.rollNumber}</p>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-[#22C55E]/10 border border-[#22C55E]/20 text-[#22C55E] rounded-md">
                      CGPA: {student.cgpa}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-[11px] font-semibold text-[#4B5563] border-t border-[#E5E7EB] pt-3">
                    <p>Branch: <strong className="text-[#111827]">{student.branch}</strong></p>
                    <p>Study Year: <strong className="text-[#111827]">{student.year} Year</strong></p>
                    <p>Email: <strong className="text-[#111827] font-mono">{student.email}</strong></p>
                    <p>Applied Drives: <strong className="text-[#111827]">{student.appliedJobsCount} drives</strong></p>
                  </div>

                  {student.skills && student.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1.5">
                      {student.skills.slice(0,3).map((s, idx) => (
                        <span key={idx} className="bg-white border border-[#E5E7EB] text-[#4B5563] text-[9px] px-2 py-0.5 rounded font-semibold">
                          {s}
                        </span>
                      ))}
                      {student.skills.length > 3 && (
                        <span className="text-[9px] text-[#94A3B8] font-semibold self-center ml-1">+{student.skills.length - 3} more</span>
                      )}
                    </div>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}

      {/* 4. SEND UPDATE / BROADCAST NOTIFICATION */}
      {activeTab === 'notify' && (
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-8 max-w-2xl mx-auto space-y-6 shadow-sm animate-in fade-in duration-300">
          <div className="border-b border-[#E5E7EB] pb-5">
            <h2 className="text-lg font-bold text-[#111827] tracking-tight">Broadcast Placement Cell Updates</h2>
            <p className="text-xs text-[#4B5563] font-medium mt-1">Send round schedules, guidelines, or announcements directly to student profiles and emails.</p>
          </div>

          {notifSuccess && (
            <div className="bg-[#22C55E]/10 border border-[#22C55E]/20 text-[#22C55E] p-4 rounded-xl flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-[#22C55E] flex-shrink-0" />
              <p className="text-xs font-semibold leading-normal">{notifSuccess}</p>
            </div>
          )}

          {notifError && (
            <div className="bg-rose-50 border border-rose-200 text-rose-600 p-4 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-500 mt-0.5 flex-shrink-0" />
              <p className="text-xs font-semibold leading-normal">{notifError}</p>
            </div>
          )}

          <form className="space-y-6 text-[#4B5563] font-semibold" onSubmit={handleSendNotification}>
            {/* Target Job Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider">Target Placement Drive (Optional)</label>
              <select
                value={notifForm.jobId}
                onChange={(e) => setNotifForm(prev => ({ ...prev, jobId: e.target.value }))}
                className="block w-full py-3 px-4 bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl text-sm font-medium text-[#111827] focus:outline-none"
              >
                <option value="" className="bg-white text-[#4B5563]">-- General Campus Broadcast (Send to All Students) --</option>
                {drives.map(drive => (
                  <option key={drive._id} value={drive._id} className="bg-white text-[#4B5563]">
                    {drive.companyId?.name || 'Company'} - {drive.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Drive specific round scheduler */}
            {notifForm.jobId && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 p-5 bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl">
                {/* Round Name */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#4B5563] uppercase tracking-wider">Round Name *</label>
                  <input
                    type="text"
                    required={!!notifForm.jobId}
                    value={notifForm.roundName}
                    onChange={(e) => setNotifForm(prev => ({ ...prev, roundName: e.target.value }))}
                    className="block w-full py-2.5 px-4 bg-white border border-[#E5E7EB] focus:bg-[#F8FAFC] rounded-xl text-sm font-medium text-[#111827] focus:outline-none"
                    placeholder="e.g. Aptitude Round, Technical Interview"
                  />
                </div>

                {/* Round Date */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#4B5563] uppercase tracking-wider">Scheduled Date/Time *</label>
                  <input
                    type="datetime-local"
                    required={!!notifForm.jobId}
                    value={notifForm.roundDate}
                    onChange={(e) => setNotifForm(prev => ({ ...prev, roundDate: e.target.value }))}
                    className="block w-full py-2.5 px-4 bg-white border border-[#E5E7EB] focus:bg-[#F8FAFC] rounded-xl text-sm font-medium text-[#111827] focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* Message */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider">Announcement / Instructions *</label>
              <textarea
                required
                rows="4"
                value={notifForm.message}
                onChange={(e) => setNotifForm(prev => ({ ...prev, message: e.target.value }))}
                className="block w-full py-3.5 px-4 bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl text-sm font-medium text-[#111827] focus:outline-none"
                placeholder="Type update guidelines, test links, venue or dates..."
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSendingNotif}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-[#22C55E] hover:bg-[#16A34A] focus:outline-none focus:ring-4 focus:ring-[#22C55E]/20 disabled:opacity-50 transition-all duration-200 shadow-md active:scale-[0.98]"
              >
                {isSendingNotif ? (
                  <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span className="flex items-center gap-2">
                    <Send className="w-4 h-4 text-white" /> Send Update
                  </span>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 5. UPLOAD SHORTLIST CSV */}
      {activeTab === 'csv' && (
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-8 max-w-2xl mx-auto space-y-6 shadow-sm animate-in fade-in duration-300">
          <div className="border-b border-[#E5E7EB] pb-5">
            <h2 className="text-lg font-bold text-[#111827] tracking-tight">Upload Round-wise Shortlist CSV</h2>
            <p className="text-xs text-[#4B5563] font-medium mt-1">Upload student roll numbers or emails. System matches student records, updates round results, and emails notifications automatically.</p>
          </div>

          {csvSuccess && (
            <div className="bg-[#22C55E]/10 border border-[#22C55E]/20 text-[#22C55E] p-4 rounded-xl flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-[#22C55E] flex-shrink-0" />
              <p className="text-xs font-semibold leading-normal">{csvSuccess}</p>
            </div>
          )}

          {csvError && (
            <div className="bg-rose-50 border border-rose-200 text-rose-600 p-4 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-500 mt-0.5 flex-shrink-0" />
              <p className="text-xs font-semibold leading-normal">{csvError}</p>
            </div>
          )}

          <form className="space-y-6 text-[#4B5563] font-semibold" onSubmit={handleUploadCsv}>
            {/* Target Job Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider">Placement Drive *</label>
              <select
                required
                value={csvForm.jobId}
                onChange={(e) => setCsvForm(prev => ({ ...prev, jobId: e.target.value }))}
                className="block w-full py-3 px-4 bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl text-sm font-medium text-[#111827] focus:outline-none"
              >
                <option value="" className="bg-white text-[#4B5563]">-- Select Drive --</option>
                {drives.map(drive => (
                  <option key={drive._id} value={drive._id} className="bg-white text-[#4B5563]">
                    {drive.companyId?.name || 'Company'} - {drive.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Round Name */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider">Round Name *</label>
              <input
                type="text"
                required
                value={csvForm.roundName}
                onChange={(e) => setCsvForm(prev => ({ ...prev, roundName: e.target.value }))}
                className="block w-full py-2.5 px-4 bg-white border border-[#E5E7EB] rounded-xl text-sm font-medium text-[#111827] focus:outline-none"
                placeholder="e.g. Aptitude Test, GD Round, Interview Round"
              />
            </div>

            {/* File Upload Area */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider">Upload Shortlist CSV *</label>
              
              <div className="border-2 border-dashed border-[#E5E7EB] hover:border-[#22C55E]/40 rounded-xl p-6 text-center cursor-pointer bg-[#F8FAFC] hover:bg-[#F1F5F9] transition-all relative">
                <input
                  type="file"
                  required
                  accept=".csv"
                  onChange={(e) => setCsvFile(e.target.files[0])}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                
                <div className="space-y-2.5">
                  <div className="h-10 w-10 rounded-xl bg-white border border-[#E5E7EB] flex items-center justify-center mx-auto text-[#22C55E] shadow-sm">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#4B5563]">
                      {csvFile ? csvFile.name : 'Click to upload or drag & drop CSV'}
                    </p>
                    <p className="text-[10px] text-[#94A3B8] font-semibold mt-1">
                      File must contain roll numbers or emails (one per line)
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isUploadingCsv}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-[#22C55E] hover:bg-[#16A34A] focus:outline-none focus:ring-4 focus:ring-[#22C55E]/20 disabled:opacity-50 transition-all duration-200 shadow-md active:scale-[0.98]"
              >
                {isUploadingCsv ? (
                  <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span className="flex items-center gap-2">
                    <Upload className="w-4 h-4 text-white" /> Process & Shortlist Students
                  </span>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Recruiter Shortlists Scheduling View */}
      {activeTab === 'recruiterShortlists' && (
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 md:p-8 space-y-6 shadow-sm animate-in fade-in duration-300">
          <div className="border-b border-[#E5E7EB] pb-5 pb-5">
            <h2 className="text-lg font-bold text-[#111827] tracking-tight">Recruiter Shortlist Handover & Scheduling</h2>
            <p className="text-xs text-[#4B5563] font-medium mt-1">Review shortlists submitted by recruiters. Assign a date & time to schedule the next recruitment round and notify the selected students.</p>
          </div>

          {shortlists.length === 0 ? (
            <div className="text-center py-16 bg-[#F8FAFC] rounded-2xl border border-dashed border-[#E5E7EB]">
              <Users className="w-10 h-10 text-[#94A3B8] mx-auto mb-3" />
              <p className="text-xs font-semibold text-[#4B5563]">No recruiter shortlists have been submitted yet.</p>
            </div>
          ) : (
            <div className="space-y-6 text-[#4B5563]">
              {shortlists.map((sh) => {
                const job = sh.jobId || {};
                const companyName = job.companyId?.name || "Company";
                const isScheduled = sh.status === 'Scheduled';

                return (
                  <div key={sh._id} className="p-6 rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] space-y-5">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`h-2.5 w-2.5 rounded-full ${isScheduled ? 'bg-[#22C55E]' : 'bg-amber-400 animate-pulse'}`} />
                          <h4 className="font-bold text-[#111827] text-sm">{companyName} - {job.title}</h4>
                        </div>
                        <p className="text-xs text-[#4B5563] font-semibold mt-1">
                          Target Round: <strong className="text-[#7C3AED] font-bold">{sh.roundName}</strong> | Candidates: <strong className="text-[#111827] font-bold">{sh.studentIds?.length || 0}</strong>
                        </p>
                        {sh.roundDetails && (
                          <p className="text-[11px] text-[#4B5563] bg-white p-2.5 border border-[#E5E7EB] rounded-lg mt-2 italic font-semibold">
                            Recruiter Notes: "{sh.roundDetails}"
                          </p>
                        )}
                      </div>

                      <div>
                        <span className={`text-[10px] px-3 py-1 rounded-full font-bold uppercase tracking-wider ${
                          isScheduled 
                            ? 'bg-[#22C55E]/10 border border-[#22C55E]/20 text-[#22C55E]' 
                            : 'bg-amber-50 border border-amber-200 text-amber-600'
                        }`}>
                          {sh.status}
                        </span>
                      </div>
                    </div>

                    {/* Shortlisted Candidates list */}
                    <div className="space-y-2">
                      <p className="text-[9px] font-bold text-[#94A3B8] uppercase tracking-widest">Shortlisted Candidates</p>
                      <div className="flex flex-wrap gap-2">
                        {sh.studentIds?.map(student => (
                          <div key={student._id} className="bg-white border border-[#E5E7EB] px-3 py-1 rounded-lg text-xs flex flex-col font-semibold">
                            <span className="text-[#111827]">{student.name}</span>
                            <span className="text-[9px] text-[#94A3B8] font-mono">{student.rollNumber} ({student.branch})</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Schedule Form */}
                    {!isScheduled ? (
                      <div className="pt-4 border-t border-[#E5E7EB] font-semibold">
                        <form onSubmit={async (e) => {
                          e.preventDefault();
                          const dateVal = e.target.scheduledAt.value;
                          const detailsVal = e.target.roundDetails.value;
                          if (!dateVal) return alert("Please specify the scheduled date and time.");

                          try {
                            const res = await api.post(`/api/placement/shortlist/${sh._id}/schedule`, {
                              scheduledAt: dateVal,
                              message: detailsVal
                            });
                            if (res.status === 200) {
                              try {
                                const { playSuccessFanfare } = await import('../utils/audio');
                                playSuccessFanfare();
                              } catch (audioErr) {}
                              alert("Evaluation round successfully scheduled and student notifications dispatched!");
                              fetchDashboardData(); // Refresh list
                            }
                          } catch (err) {
                            try {
                              const { playFailureBuzz } = await import('../utils/audio');
                              playFailureBuzz();
                            } catch (audioErr) {}
                            alert(err.response?.data?.message || err.message || "Failed to schedule shortlist round");
                          }
                        }} className="space-y-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-[#4B5563] uppercase tracking-wider">Schedule Date & Time *</label>
                              <input
                                type="datetime-local"
                                name="scheduledAt"
                                defaultValue={sh.scheduledAt ? formatDateTimeLocal(sh.scheduledAt) : ""}
                                required
                                className="block w-full py-2 px-3 bg-white border border-[#E5E7EB] rounded-xl text-xs font-semibold text-[#111827] focus:outline-none"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-[#4B5563] uppercase tracking-wider">Update Instructions/Venue details</label>
                              <input
                                type="text"
                                name="roundDetails"
                                defaultValue={sh.roundDetails || ""}
                                placeholder="e.g. Online at 10 AM, HackerRank link"
                                className="block w-full py-2 px-3 bg-white border border-[#E5E7EB] rounded-xl text-xs font-semibold text-[#111827] focus:outline-none"
                              />
                            </div>
                          </div>
                          <button
                            type="submit"
                            className="px-4 py-2.5 bg-[#22C55E] hover:bg-[#16A34A] text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-1 active:scale-[0.98]"
                          >
                            <Calendar className="w-3.5 h-3.5" /> Schedule & Broadcast to Students
                          </button>
                        </form>
                      </div>
                    ) : (
                      <div className="pt-3 border-t border-[#E5E7EB] text-xs font-bold text-[#22C55E] flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-[#22C55E]" />
                        Scheduled for: {new Date(sh.scheduledAt).toLocaleString()}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* OFFER LETTERS APPROVAL TAB */}
      {activeTab === 'offerLetters' && (() => {
        const pendingOffers = applications.filter(a => a.offerLetterStatus === 'Pending Approval');
        return (
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 md:p-8 space-y-6 shadow-sm animate-in fade-in duration-300">
            <div className="border-b border-[#E5E7EB] pb-4">
              <h2 className="text-base font-bold text-[#111827] tracking-tight">Review & Approve Offer Letters</h2>
              <p className="text-xs text-[#4B5563] font-medium mt-1">Process pending offer letters submitted by company recruiters. Approved offers are immediately issued to student dashboards.</p>
            </div>

            {pendingOffers.length === 0 ? (
              <div className="py-16 text-center text-[#4B5563] text-sm font-semibold">
                🎉 All offer letters processed! No pending reviews at this time.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-xs text-left text-slate-500">
                  <thead className="text-[10px] text-slate-700 uppercase bg-[#F8FAFC] border-b border-[#E5E7EB]">
                    <tr>
                      <th className="px-6 py-3.5 font-bold">Student Details</th>
                      <th className="px-6 py-3.5 font-bold">Drive Info</th>
                      <th className="px-6 py-3.5 font-bold">Package</th>
                      <th className="px-6 py-3.5 font-bold">Submitted Date</th>
                      <th className="px-6 py-3.5 font-bold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingOffers.map((app) => (
                      <tr key={app._id} className="bg-white border-b border-[#F1F5F9] hover:bg-slate-50/50">
                        <td className="px-6 py-4">
                          <div className="font-bold text-[#111827]">{app.studentId?.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">{app.studentId?.rollNumber} · {app.studentId?.branch}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-700">{app.jobId?.title}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">{app.jobId?.companyId?.name}</div>
                        </td>
                        <td className="px-6 py-4 font-semibold text-[#111827]">{app.jobId?.package} LPA</td>
                        <td className="px-6 py-4 text-slate-400 font-medium">{new Date(app.updatedAt).toLocaleDateString()}</td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => {
                              setSelectedAppForReview(app);
                              setRejectReason('');
                            }}
                            className="px-3.5 py-1.5 bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-bold rounded-lg transition-all shadow-sm cursor-pointer active:scale-95"
                          >
                            Review Offer
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })()}

      {/* REPORTS GENERATOR TAB */}
      {activeTab === 'reports' && (() => {
        // Collect branches & companies for filters
        const branchesList = ['All', ...new Set(applications.map(a => a.studentId?.branch).filter(Boolean))];
        const companiesList = drives.map(d => d.companyId).filter((v, i, a) => v && a.findIndex(t => t._id === v._id) === i);
        
        const filteredReportApps = applications.filter(app => {
          const matchesStatus = reportFilterStatus === 'All' || app.status === reportFilterStatus;
          const matchesBranch = reportFilterBranch === 'All' || (app.studentId?.branch?.toLowerCase() === reportFilterBranch.toLowerCase());
          
          let compId = app.jobId?.companyId?._id || app.jobId?.companyId;
          const matchesCompany = reportFilterCompany === 'All' || (compId === reportFilterCompany);
          
          const searchLower = reportSearchQuery.toLowerCase();
          const matchesSearch = !reportSearchQuery || 
            app.studentId?.name?.toLowerCase().includes(searchLower) || 
            app.studentId?.rollNumber?.toLowerCase().includes(searchLower) ||
            app.jobId?.title?.toLowerCase().includes(searchLower);
            
          return matchesStatus && matchesBranch && matchesCompany && matchesSearch;
        });

        return (
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 md:p-8 space-y-6 shadow-sm animate-in fade-in duration-300">
            <div className="border-b border-[#E5E7EB] pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-[#111827] tracking-tight">Placement Campaign Report Compiler</h2>
                <p className="text-xs text-[#4B5563] font-medium mt-1">Filter, search, and export lists of selected, rejected, or shortlisted students to PDF documents and Excel-friendly sheets.</p>
              </div>
              
              {/* Exporters */}
              <div className="flex gap-2 font-semibold">
                <button
                  onClick={() => handleExportCSV(filteredReportApps, reportFilterStatus)}
                  className="px-4 py-2 border border-slate-200 hover:border-slate-300 text-xs text-slate-700 bg-white rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <Download className="w-4 h-4 text-emerald-600" /> Export Excel (CSV)
                </button>
                <button
                  onClick={() => handleExportPDF(filteredReportApps, reportFilterStatus)}
                  className="px-4 py-2 bg-[#6D5EF7] hover:bg-[#5B4EE0] text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <FileText className="w-4 h-4 text-white" /> Compile PDF Report
                </button>
              </div>
            </div>

            {/* Filters panel */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-50 border border-[#E5E7EB] rounded-2xl">
              <div className="space-y-1 text-[#4B5563] font-semibold">
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Placement Status</label>
                <select
                  value={reportFilterStatus}
                  onChange={(e) => setReportFilterStatus(e.target.value)}
                  className="block w-full py-2 px-3 bg-white border border-[#E5E7EB] rounded-xl text-xs font-semibold text-[#111827] focus:outline-none"
                >
                  <option value="All">All Applications</option>
                  <option value="Selected">Selected</option>
                  <option value="Rejected">Rejected</option>
                  <option value="Shortlisted">Shortlisted</option>
                  <option value="Applied">Applied</option>
                </select>
              </div>

              <div className="space-y-1 text-[#4B5563] font-semibold">
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Academic Branch</label>
                <select
                  value={reportFilterBranch}
                  onChange={(e) => setReportFilterBranch(e.target.value)}
                  className="block w-full py-2 px-3 bg-white border border-[#E5E7EB] rounded-xl text-xs font-semibold text-[#111827] focus:outline-none"
                >
                  {branchesList.map(branch => (
                    <option key={branch} value={branch}>{branch === 'All' ? 'All Branches' : branch}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1 text-[#4B5563] font-semibold">
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Recruiting Company</label>
                <select
                  value={reportFilterCompany}
                  onChange={(e) => setReportFilterCompany(e.target.value)}
                  className="block w-full py-2 px-3 bg-white border border-[#E5E7EB] rounded-xl text-xs font-semibold text-[#111827] focus:outline-none"
                >
                  <option value="All">All Companies</option>
                  {companiesList.map(comp => (
                    <option key={comp._id} value={comp._id}>{comp.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1 text-[#4B5563] font-semibold">
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Search Candidate/Job</label>
                <div className="relative">
                  <input
                    type="text"
                    value={reportSearchQuery}
                    onChange={(e) => setReportSearchQuery(e.target.value)}
                    placeholder="Search by name, roll..."
                    className="block w-full py-2 pl-8 pr-3 bg-white border border-[#E5E7EB] rounded-xl text-xs font-semibold text-[#111827] focus:outline-none"
                  />
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                </div>
              </div>
            </div>

            {/* Results Table */}
            <div className="space-y-3">
              <div className="text-xs font-bold text-slate-500 flex justify-between">
                <span>Filter matches: {filteredReportApps.length} students</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-xs text-left text-slate-500">
                  <thead className="text-[10px] text-slate-700 uppercase bg-[#F8FAFC] border-b border-[#E5E7EB]">
                    <tr>
                      <th className="px-6 py-3.5 font-bold">Student Name</th>
                      <th className="px-6 py-3.5 font-bold">Roll Number</th>
                      <th className="px-6 py-3.5 font-bold">Branch</th>
                      <th className="px-6 py-3.5 font-bold">CGPA</th>
                      <th className="px-6 py-3.5 font-bold">Company</th>
                      <th className="px-6 py-3.5 font-bold">CTC Package</th>
                      <th className="px-6 py-3.5 font-bold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredReportApps.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="px-6 py-8 text-center text-slate-400 font-semibold">No student records matches the selected criteria.</td>
                      </tr>
                    ) : (
                      filteredReportApps.map((app) => (
                        <tr key={app._id} className="bg-white border-b border-[#F1F5F9] hover:bg-slate-50/50">
                          <td className="px-6 py-4 font-bold text-[#111827]">{app.studentId?.name}</td>
                          <td className="px-6 py-4 font-mono font-semibold">{app.studentId?.rollNumber}</td>
                          <td className="px-6 py-4 font-semibold">{app.studentId?.branch}</td>
                          <td className="px-6 py-4 font-mono font-semibold">{app.studentId?.cgpa}</td>
                          <td className="px-6 py-4">{app.jobId?.companyId?.name}</td>
                          <td className="px-6 py-4 font-bold text-[#111827]">{app.jobId?.package} LPA</td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-0.5 rounded-full font-bold text-[9px] uppercase tracking-wider ${
                              app.status === 'Selected' ? 'bg-emerald-100 text-emerald-700' :
                              app.status === 'Rejected' ? 'bg-rose-100 text-rose-700' :
                              app.status === 'Shortlisted' ? 'bg-blue-100 text-blue-700' :
                              'bg-slate-100 text-slate-600'
                            }`}>
                              {app.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      })()}

      {/* PLACEMENT REVIEW OFFER LETTER MODAL */}
      {selectedAppForReview && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/55 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative bg-white rounded-2xl w-full max-w-4xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200 text-[#4B5563]">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-[#111827] tracking-tight">Review & Approve Offer Letter</h3>
                <p className="text-[11px] text-[#4B5563] font-medium mt-0.5">
                  Inspect the offer letter generated for <strong>{selectedAppForReview.studentId?.name}</strong> by <strong>{selectedAppForReview.jobId?.companyId?.name}</strong>.
                </p>
              </div>
              <button
                onClick={() => setSelectedAppForReview(null)}
                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
              >
                <XCircle className="w-5 h-5 text-rose-500" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6 max-h-[60vh] overflow-y-auto">
              {/* Left 2 Columns: Rendered preview */}
              <div className="lg:col-span-2 space-y-3">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Offer Document Preview</label>
                <div className="p-8 bg-slate-50 border border-slate-200 rounded-xl overflow-y-auto min-h-[350px]">
                  {selectedAppForReview.offerLetterUrl ? (
                    <div className="bg-white p-8 rounded-lg border border-slate-100 shadow-sm text-center space-y-4">
                      <FileText className="w-16 h-16 text-[#7C3AED] mx-auto" />
                      <h4 className="text-sm font-bold text-slate-800">A custom PDF offer letter has been uploaded.</h4>
                      <p className="text-xs text-slate-500">You can view or download this PDF file directly using the link below.</p>
                      <a
                        href={selectedAppForReview.offerLetterUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer active:scale-95"
                      >
                        <Eye className="w-4 h-4" /> Open Uploaded PDF Offer Letter
                      </a>
                    </div>
                  ) : (
                    <div 
                      className="prose prose-sm max-w-none text-slate-700 font-sans text-xs bg-white p-8 rounded-lg border border-slate-100 shadow-sm"
                      dangerouslySetInnerHTML={{ __html: selectedAppForReview.offerLetterContent }} 
                    />
                  )}
                </div>
              </div>

              {/* Right Column: Rejection reasoning and review logs */}
              <div className="space-y-4 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="p-4 bg-purple-50 rounded-xl border border-purple-100 space-y-1.5">
                    <h4 className="text-xs font-bold text-[#7C3AED] uppercase tracking-wider">Recruiter Details</h4>
                    <p className="text-[10px] font-medium">Drive: <strong>{selectedAppForReview.jobId?.title}</strong></p>
                    <p className="text-[10px] font-medium">CTC Offer: <strong>{selectedAppForReview.jobId?.package} LPA</strong></p>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Rejection Reason</label>
                    <textarea
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder="Specify the issues (e.g. wrong CTC, invalid format) if you choose to reject..."
                      rows="5"
                      className="w-full p-3 bg-[#F8FAFC] border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#7C3AED]/10 focus:border-[#7C3AED]"
                    />
                  </div>
                </div>

                <div className="space-y-2.5 font-semibold">
                  <button
                    onClick={() => handleRejectOffer(selectedAppForReview._id)}
                    disabled={submittingReview}
                    className="w-full py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-xs rounded-xl flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-[0.98] disabled:opacity-50"
                  >
                    <XCircle className="w-4 h-4" /> Reject & Return to Recruiter
                  </button>
                  <button
                    onClick={() => handleApproveOffer(selectedAppForReview._id)}
                    disabled={submittingReview}
                    className="w-full py-2.5 bg-[#22C55E] hover:bg-[#16A34A] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1 cursor-pointer transition-all shadow-md active:scale-[0.98] disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4 text-white" /> Approve & Issue Offer
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end font-semibold">
              <button
                onClick={() => setSelectedAppForReview(null)}
                className="px-4 py-2 border border-slate-200 hover:bg-white text-xs text-slate-700 rounded-xl transition-colors"
              >
                Close Reviewer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlacementDashboard;
