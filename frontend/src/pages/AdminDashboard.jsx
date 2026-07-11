import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { 
  Building2, Briefcase, Users, Calendar, DollarSign, Award, Check, X, AlertCircle, 
  RefreshCw, CheckCircle2, XCircle, Search, Filter, GraduationCap, ShieldAlert,
  UserCheck, UserX, ToggleLeft, ToggleRight, Power
} from 'lucide-react';
import api from '../utils/api';

const AdminDashboard = () => {
  const user = useSelector((state) => state.auth.user);

  // States
  const [activeTab, setActiveTab] = useState('overview'); // overview | companies | students | drives
  const [stats, setStats] = useState({
    totalStudents: 0,
    placedStudents: 0,
    totalCompanies: 0,
    pendingCompanies: 0,
    activeJobs: 0,
    totalOffers: 0,
    placementRate: 0
  });
  const [companies, setCompanies] = useState([]);
  const [students, setStudents] = useState([]);
  const [drives, setDrives] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(null); // id of row being processed

  // Search & Filter States
  const [companySearch, setCompanySearch] = useState('');
  const [companyFilter, setCompanyFilter] = useState('all'); // all | pending | approved
  
  const [studentSearch, setStudentSearch] = useState('');
  const [studentBranch, setStudentBranch] = useState('All');
  const [studentStatus, setStudentStatus] = useState('all'); // all | placed | unplaced | suspended

  const [driveSearch, setDriveSearch] = useState('');
  const [driveStatus, setDriveStatus] = useState('all'); // all | active | closed

  // Success / Error alerts
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch admin stats
  const fetchStats = async () => {
    try {
      const res = await api.get('/api/admin/stats');
      if (res.data && res.data.stats) {
        setStats(res.data.stats);
      }
    } catch (err) {
      console.error('Error fetching admin stats:', err);
    }
  };

  // Fetch all companies
  const fetchCompanies = async () => {
    try {
      const res = await api.get('/api/admin/companies');
      setCompanies(res.data.companies || []);
    } catch (err) {
      console.error('Error fetching companies:', err);
    }
  };

  // Fetch all students
  const fetchStudents = async () => {
    try {
      const res = await api.get('/api/admin/students');
      setStudents(res.data.students || []);
    } catch (err) {
      console.error('Error fetching students:', err);
    }
  };

  // Fetch all drives
  const fetchDrives = async () => {
    try {
      const res = await api.get('/api/placement/drives');
      setDrives(res.data.drives || []);
    } catch (err) {
      console.error('Error fetching drives:', err);
    }
  };

  const loadAllData = async () => {
    setIsLoading(true);
    setSuccessMsg('');
    setErrorMsg('');
    try {
      await Promise.all([
        fetchStats(),
        fetchCompanies(),
        fetchStudents(),
        fetchDrives()
      ]);
    } catch (err) {
      setErrorMsg('Failed to load dashboard data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Show temporary toast messages
  const triggerNotification = (success, message) => {
    if (success) {
      setSuccessMsg(message);
      setTimeout(() => setSuccessMsg(''), 4000);
    } else {
      setErrorMsg(message);
      setTimeout(() => setErrorMsg(''), 4000);
    }
  };

  // Actions
  const handleApproveCompany = async (companyId) => {
    setActionLoading(companyId);
    try {
      const res = await api.post('/api/admin/companies/approve', { companyId });
      triggerNotification(true, res.data.message || 'Company approved successfully!');
      // Refresh data
      await Promise.all([fetchCompanies(), fetchStats()]);
    } catch (err) {
      triggerNotification(false, err.response?.data?.message || 'Failed to approve company');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectCompany = async (companyId) => {
    if (!window.confirm('Are you sure you want to suspend/reject this company and its recruiter account?')) return;
    setActionLoading(companyId);
    try {
      const res = await api.post('/api/admin/companies/reject', { companyId });
      triggerNotification(true, res.data.message || 'Company suspended successfully!');
      await Promise.all([fetchCompanies(), fetchStats()]);
    } catch (err) {
      triggerNotification(false, err.response?.data?.message || 'Failed to suspend company');
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleUserStatus = async (userId) => {
    setActionLoading(userId);
    try {
      const res = await api.post(`/api/admin/users/${userId}/toggle-active`);
      triggerNotification(true, res.data.message || 'User status updated successfully!');
      await Promise.all([fetchStudents(), fetchCompanies(), fetchStats()]);
    } catch (err) {
      triggerNotification(false, err.response?.data?.message || 'Failed to update user status');
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleJobStatus = async (jobId) => {
    setActionLoading(jobId);
    try {
      const res = await api.post(`/api/admin/jobs/${jobId}/toggle-status`);
      triggerNotification(true, res.data.message || 'Job drive status updated!');
      await Promise.all([fetchDrives(), fetchStats()]);
    } catch (err) {
      triggerNotification(false, err.response?.data?.message || 'Failed to update job status');
    } finally {
      setActionLoading(null);
    }
  };

  // Filter computations
  const filteredCompanies = companies.filter(company => {
    const matchesSearch = company.name.toLowerCase().includes(companySearch.toLowerCase()) ||
      company.recruiterEmail.toLowerCase().includes(companySearch.toLowerCase());
    
    if (companyFilter === 'approved') return matchesSearch && company.approved;
    if (companyFilter === 'pending') return matchesSearch && !company.approved;
    return matchesSearch;
  });

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
      student.rollNumber.toLowerCase().includes(studentSearch.toLowerCase()) ||
      student.email.toLowerCase().includes(studentSearch.toLowerCase());

    const matchesBranch = studentBranch === 'All' || student.branch === studentBranch;

    const userIsActive = student.userId?.isActive !== false;
    let matchesStatus = true;
    if (studentStatus === 'placed') matchesStatus = student.isPlaced;
    if (studentStatus === 'unplaced') matchesStatus = !student.isPlaced;
    if (studentStatus === 'suspended') matchesStatus = !userIsActive;

    return matchesSearch && matchesBranch && matchesStatus;
  });

  const filteredDrives = drives.filter(drive => {
    const companyName = drive.companyId?.name || '';
    const matchesSearch = drive.title.toLowerCase().includes(driveSearch.toLowerCase()) ||
      companyName.toLowerCase().includes(driveSearch.toLowerCase());

    if (driveStatus === 'active') return matchesSearch && drive.status === 'active';
    if (driveStatus === 'closed') return matchesSearch && drive.status === 'closed';
    return matchesSearch;
  });

  const branchesList = ['All', ...new Set(students.map(s => s.branch))];

  return (
    <div className="space-y-10 animate-slide-up">
      {/* Alert Notices */}
      {successMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-green-500 text-white px-6 py-4 rounded-2xl shadow-xl shadow-green-500/10 flex items-center space-x-3 border border-green-400 animate-bounce-short animate-in fade-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm font-bold">{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-rose-500 text-white px-6 py-4 rounded-2xl shadow-xl shadow-rose-500/20 flex items-center space-x-3 border border-rose-450 animate-bounce-short animate-in fade-in slide-in-from-bottom-5">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm font-bold">{errorMsg}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-800 flex items-center gap-3">
            Admin <span className="bg-gradient-to-r from-teal-500 to-teal-800 bg-clip-text text-transparent">Control Panel</span>
          </h1>
          <p className="text-slate-500 mt-2 font-medium">Manage students, company approvals, job drives, and system parameters.</p>
        </div>
        <button
          onClick={loadAllData}
          disabled={isLoading}
          className="flex items-center space-x-2 bg-white hover:bg-slate-50 text-slate-700 px-5 py-3 rounded-2xl border border-slate-200 shadow-sm transition-all text-sm font-semibold active:scale-[0.98] disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Sync Data</span>
        </button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Placement Rate Card */}
        <div className="glass-card p-6 rounded-3xl relative overflow-hidden group hover:border-teal-350 hover:shadow-md transition-all duration-300">
          <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-teal-500/5 translate-x-4 -translate-y-4 group-hover:scale-125 transition-transform duration-300" />
          <div className="flex items-center justify-between">
            <div className="h-12 w-12 rounded-2xl bg-teal-50 flex items-center justify-center text-teal-600">
              <Award className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-full">Active</span>
          </div>
          <div className="mt-5">
            <p className="text-[28px] font-extrabold text-slate-800 leading-none">{stats.placementRate}%</p>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mt-2.5">Placement Rate</p>
          </div>
        </div>

        {/* Total Students Card */}
        <div className="glass-card p-6 rounded-3xl relative overflow-hidden group hover:border-teal-350 hover:shadow-md transition-all duration-300">
          <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-teal-500/5 translate-x-4 -translate-y-4 group-hover:scale-125 transition-transform duration-300" />
          <div className="flex items-center justify-between">
            <div className="h-12 w-12 rounded-2xl bg-teal-50 flex items-center justify-center text-teal-600">
              <Users className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-mono text-slate-400">Total Profiled</span>
          </div>
          <div className="mt-5">
            <p className="text-[28px] font-extrabold text-slate-800 leading-none">
              {stats.placedStudents} <span className="text-slate-400 text-sm font-semibold">/ {stats.totalStudents}</span>
            </p>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mt-2.5">Placed / Total Students</p>
          </div>
        </div>

        {/* Registered Companies */}
        <div className="glass-card p-6 rounded-3xl relative overflow-hidden group hover:border-teal-350 hover:shadow-md transition-all duration-300">
          <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-teal-500/5 translate-x-4 -translate-y-4 group-hover:scale-125 transition-transform duration-300" />
          <div className="flex items-center justify-between">
            <div className="h-12 w-12 rounded-2xl bg-teal-50 flex items-center justify-center text-teal-600">
              <Building2 className="w-6 h-6" />
            </div>
            {stats.pendingCompanies > 0 ? (
              <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full animate-pulse">
                {stats.pendingCompanies} Pending
              </span>
            ) : (
              <span className="text-xs font-bold text-slate-400 bg-slate-105 px-2.5 py-1 rounded-full">All Approved</span>
            )}
          </div>
          <div className="mt-5">
            <p className="text-[28px] font-extrabold text-slate-800 leading-none">{stats.totalCompanies}</p>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mt-2.5">Recruiters / Companies</p>
          </div>
        </div>

        {/* Active Drives */}
        <div className="glass-card p-6 rounded-3xl relative overflow-hidden group hover:border-teal-350 hover:shadow-md transition-all duration-300">
          <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-teal-500/5 translate-x-4 -translate-y-4 group-hover:scale-125 transition-transform duration-300" />
          <div className="flex items-center justify-between">
            <div className="h-12 w-12 rounded-2xl bg-teal-50 flex items-center justify-center text-teal-600">
              <Briefcase className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full">
              {stats.totalOffers} Offers
            </span>
          </div>
          <div className="mt-5">
            <p className="text-[28px] font-extrabold text-slate-800 leading-none">{stats.activeJobs}</p>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mt-2.5">Active Job Drives</p>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-4 px-6 text-sm font-bold border-b-2 transition-all ${
            activeTab === 'overview'
              ? 'border-teal-600 text-teal-600'
              : 'border-transparent text-slate-400 hover:text-slate-800'
          }`}
        >
          Summary Matrix
        </button>
        <button
          onClick={() => setActiveTab('companies')}
          className={`pb-4 px-6 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'companies'
              ? 'border-teal-600 text-teal-600'
              : 'border-transparent text-slate-400 hover:text-slate-800'
          }`}
        >
          Company Registrations
          {stats.pendingCompanies > 0 && (
            <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('students')}
          className={`pb-4 px-6 text-sm font-bold border-b-2 transition-all ${
            activeTab === 'students'
              ? 'border-teal-600 text-teal-600'
              : 'border-transparent text-slate-400 hover:text-slate-800'
          }`}
        >
          Student Database
        </button>
        <button
          onClick={() => setActiveTab('drives')}
          className={`pb-4 px-6 text-sm font-bold border-b-2 transition-all ${
            activeTab === 'drives'
              ? 'border-teal-600 text-teal-600'
              : 'border-transparent text-slate-400 hover:text-slate-800'
          }`}
        >
          Placement Drives
        </button>
      </div>

      {/* Loading Overlay */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="h-10 w-10 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-505 text-sm font-semibold">Synchronizing with system database...</p>
        </div>
      )}

      {/* Tabs Content */}
      {!isLoading && (
        <div>
          {/* TAB 1: OVERVIEW SUMMARY */}
          {activeTab === 'overview' && (
            <div className="space-y-8 animate-in fade-in duration-300">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Pending approvals summary panel */}
                <div className="glass-panel p-6 rounded-3xl space-y-6">
                  <h3 className="font-extrabold text-lg text-slate-800 flex items-center gap-2">
                    <ShieldAlert className="w-5 h-5 text-rose-500" />
                    Pending Approvals Request
                  </h3>
                  <div className="space-y-4">
                    {companies.filter(c => !c.approved).slice(0, 3).map(comp => (
                      <div key={comp._id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200/85 flex items-center justify-between gap-4">
                        <div className="min-w-0">
                          <p className="font-bold text-slate-800 truncate">{comp.name}</p>
                          <p className="text-slate-400 text-xs font-medium truncate mt-0.5">{comp.recruiterEmail}</p>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          <button
                            onClick={() => handleApproveCompany(comp._id)}
                            disabled={actionLoading === comp._id}
                            className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all"
                          >
                            Approve
                          </button>
                        </div>
                      </div>
                    ))}
                    {companies.filter(c => !c.approved).length === 0 && (
                      <div className="text-center py-8 text-slate-400 text-sm font-semibold italic">
                        No pending company registration approvals.
                      </div>
                    )}
                  </div>
                </div>

                {/* System settings parameters panel */}
                <div className="glass-panel p-6 rounded-3xl space-y-6">
                  <h3 className="font-extrabold text-lg text-slate-800 flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-teal-600" />
                    Placement Connect Overview
                  </h3>
                  <div className="space-y-4 text-sm font-semibold text-slate-600">
                    <div className="flex justify-between py-2.5 border-b border-slate-100">
                      <span>Total Students Enrolled</span>
                      <span className="text-slate-800 font-bold">{stats.totalStudents}</span>
                    </div>
                    <div className="flex justify-between py-2.5 border-b border-slate-100">
                      <span>Successful Placements</span>
                      <span className="text-slate-800 font-bold text-teal-600">{stats.placedStudents}</span>
                    </div>
                    <div className="flex justify-between py-2.5 border-b border-slate-100">
                      <span>Registered Recruiter Partners</span>
                      <span className="text-slate-800 font-bold">{stats.totalCompanies}</span>
                    </div>
                    <div className="flex justify-between py-2.5">
                      <span>Total Selections / Offers</span>
                      <span className="text-indigo-605 font-bold">{stats.totalOffers} Offers</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: COMPANIES APPROVALS */}
          {activeTab === 'companies' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              {/* Search and Filters */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="relative flex-grow max-w-md">
                  <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                    <Search className="h-5 w-5" />
                  </span>
                  <input
                    type="text"
                    placeholder="Search company or recruiter email..."
                    value={companySearch}
                    onChange={(e) => setCompanySearch(e.target.value)}
                    className="block w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 focus:bg-white rounded-2xl text-sm font-semibold text-slate-800 focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 focus:outline-none transition-all"
                  />
                </div>
                <div className="flex items-center space-x-3">
                  <Filter className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <select
                    value={companyFilter}
                    onChange={(e) => setCompanyFilter(e.target.value)}
                    className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 focus:outline-none"
                  >
                    <option value="all">All Registrations</option>
                    <option value="pending">Pending Approvals</option>
                    <option value="approved">Approved / Active</option>
                  </select>
                </div>
              </div>

              {/* Companies Table */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs font-bold uppercase tracking-wider">
                        <th className="px-6 py-4.5">Company Partner</th>
                        <th className="px-6 py-4.5">Industry Type</th>
                        <th className="px-6 py-4.5">Recruiter Details</th>
                        <th className="px-6 py-4.5">Account Status</th>
                        <th className="px-6 py-4.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm font-semibold text-slate-700">
                      {filteredCompanies.map(comp => {
                        const isUserActive = comp.recruiterId?.isActive !== false;
                        return (
                          <tr key={comp._id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-4.5">
                              <p className="text-slate-800 font-bold">{comp.name}</p>
                            </td>
                            <td className="px-6 py-4.5 text-slate-550">
                              {comp.industry || 'N/A'}
                            </td>
                            <td className="px-6 py-4.5">
                              <p className="text-slate-800">{comp.recruiterId?.name || 'Pending Profile'}</p>
                              <p className="text-slate-400 text-xs font-mono mt-0.5">{comp.recruiterEmail}</p>
                            </td>
                            <td className="px-6 py-4.5">
                              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                                comp.approved
                                  ? 'bg-emerald-55 border border-emerald-200 text-emerald-700'
                                  : 'bg-rose-50 border border-rose-100 text-rose-700'
                              }`}>
                                {comp.approved ? (
                                  <>
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    Approved
                                  </>
                                ) : (
                                  <>
                                    <XCircle className="w-3.5 h-3.5" />
                                    Pending
                                  </>
                                )}
                              </span>
                            </td>
                            <td className="px-6 py-4.5 text-right">
                              <div className="flex items-center justify-end space-x-2">
                                {!comp.approved ? (
                                  <button
                                    onClick={() => handleApproveCompany(comp._id)}
                                    disabled={actionLoading === comp._id}
                                    className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-sm active:scale-[0.98] disabled:opacity-50"
                                  >
                                    Approve
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleRejectCompany(comp._id)}
                                    disabled={actionLoading === comp._id}
                                    className="bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold px-4 py-2.5 rounded-xl transition-all active:scale-[0.98] disabled:opacity-50"
                                  >
                                    Deactivate
                                  </button>
                                )}

                                {comp.recruiterId && (
                                  <button
                                    onClick={() => handleToggleUserStatus(comp.recruiterId._id)}
                                    disabled={actionLoading === comp.recruiterId._id}
                                    title={isUserActive ? "Suspend login" : "Activate login"}
                                    className={`p-2.5 rounded-xl border transition-all ${
                                      isUserActive
                                        ? 'bg-slate-50 hover:bg-rose-50 border-slate-200 hover:border-rose-200 text-slate-500 hover:text-rose-500'
                                        : 'bg-rose-50 hover:bg-teal-50 border-rose-100 hover:border-teal-200 text-rose-500 hover:text-teal-600'
                                    }`}
                                  >
                                    <Power className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                      {filteredCompanies.length === 0 && (
                        <tr>
                          <td colSpan="5" className="text-center py-12 text-slate-400 font-semibold italic">
                            No companies found matching search criteria.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: STUDENTS DATABASE */}
          {activeTab === 'students' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              {/* Search and Filters */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative md:col-span-2">
                  <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                    <Search className="h-5 w-5" />
                  </span>
                  <input
                    type="text"
                    placeholder="Search student name, roll number, or email..."
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    className="block w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 focus:bg-white rounded-2xl text-sm font-semibold text-slate-800 focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 focus:outline-none transition-all"
                  />
                </div>
                <div className="flex items-center space-x-3">
                  <Filter className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <select
                    value={studentBranch}
                    onChange={(e) => setStudentBranch(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 focus:outline-none"
                  >
                    {branchesList.map(branch => (
                      <option key={branch} value={branch}>Branch: {branch}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center space-x-3">
                  <Filter className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <select
                    value={studentStatus}
                    onChange={(e) => setStudentStatus(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 focus:outline-none"
                  >
                    <option value="all">All Placement Status</option>
                    <option value="placed">Placed Only</option>
                    <option value="unplaced">Unplaced Only</option>
                    <option value="suspended">Suspended Accounts</option>
                  </select>
                </div>
              </div>

              {/* Students Table */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs font-bold uppercase tracking-wider">
                        <th className="px-6 py-4.5">Roll Number</th>
                        <th className="px-6 py-4.5">Student Name</th>
                        <th className="px-6 py-4.5">Academic details</th>
                        <th className="px-6 py-4.5">Placement status</th>
                        <th className="px-6 py-4.5">Account Status</th>
                        <th className="px-6 py-4.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm font-semibold text-slate-700">
                      {filteredStudents.map(student => {
                        const isUserActive = student.userId?.isActive !== false;
                        return (
                          <tr key={student._id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-4.5 text-slate-500 font-mono text-xs font-bold">
                              {student.rollNumber}
                            </td>
                            <td className="px-6 py-4.5">
                              <p className="text-slate-800 font-bold">{student.name}</p>
                              <p className="text-slate-400 text-xs font-mono mt-0.5">{student.email}</p>
                            </td>
                            <td className="px-6 py-4.5">
                              <div className="flex items-center space-x-3">
                                <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-lg text-xs font-bold">
                                  {student.branch}
                                </span>
                                <span className="text-slate-800 font-bold">
                                  CGPA: {student.cgpa}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4.5">
                              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                                student.isPlaced
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : 'bg-amber-50 text-amber-700'
                              }`}>
                                <GraduationCap className="w-3.5 h-3.5" />
                                {student.isPlaced ? 'Placed' : 'Unplaced'}
                              </span>
                            </td>
                            <td className="px-6 py-4.5">
                              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                                isUserActive
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : 'bg-rose-50 text-rose-700'
                              }`}>
                                {isUserActive ? (
                                  <>
                                    <Check className="w-3.5 h-3.5" />
                                    Active
                                  </>
                                ) : (
                                  <>
                                    <X className="w-3.5 h-3.5" />
                                    Suspended
                                  </>
                                )}
                              </span>
                            </td>
                            <td className="px-6 py-4.5 text-right">
                              <div className="flex items-center justify-end space-x-2">
                                {student.userId ? (
                                  <button
                                    onClick={() => handleToggleUserStatus(student.userId._id)}
                                    disabled={actionLoading === student.userId._id}
                                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all ${
                                      isUserActive
                                        ? 'bg-rose-50 hover:bg-rose-100 border-rose-100 hover:border-rose-200 text-rose-600'
                                        : 'bg-teal-50 hover:bg-teal-100 border-teal-100 hover:border-teal-200 text-teal-700'
                                    }`}
                                  >
                                    {isUserActive ? (
                                      <>
                                        <UserX className="w-3.5 h-3.5" />
                                        Suspend
                                      </>
                                    ) : (
                                      <>
                                        <UserCheck className="w-3.5 h-3.5" />
                                        Activate
                                      </>
                                    )}
                                  </button>
                                ) : (
                                  <span className="text-slate-400 text-xs italic font-medium">No Auth Account</span>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                      {filteredStudents.length === 0 && (
                        <tr>
                          <td colSpan="6" className="text-center py-12 text-slate-400 font-semibold italic">
                            No students found matching filters.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: PLACEMENT DRIVES */}
          {activeTab === 'drives' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              {/* Search and Filters */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="relative flex-grow max-w-md">
                  <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                    <Search className="h-5 w-5" />
                  </span>
                  <input
                    type="text"
                    placeholder="Search drive title or company name..."
                    value={driveSearch}
                    onChange={(e) => setDriveSearch(e.target.value)}
                    className="block w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 focus:bg-white rounded-2xl text-sm font-semibold text-slate-800 focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 focus:outline-none transition-all"
                  />
                </div>
                <div className="flex items-center space-x-3">
                  <Filter className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <select
                    value={driveStatus}
                    onChange={(e) => setDriveStatus(e.target.value)}
                    className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 focus:outline-none"
                  >
                    <option value="all">All Drives Status</option>
                    <option value="active">Active Drives Only</option>
                    <option value="closed">Closed Drives Only</option>
                  </select>
                </div>
              </div>

              {/* Drives Table */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs font-bold uppercase tracking-wider">
                        <th className="px-6 py-4.5">Job Title</th>
                        <th className="px-6 py-4.5">Company</th>
                        <th className="px-6 py-4.5">Package (CTC)</th>
                        <th className="px-6 py-4.5">Eligibility</th>
                        <th className="px-6 py-4.5">Deadline</th>
                        <th className="px-6 py-4.5">Drive Status</th>
                        <th className="px-6 py-4.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm font-semibold text-slate-700">
                      {filteredDrives.map(drive => (
                        <tr key={drive._id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4.5">
                            <p className="text-slate-800 font-bold">{drive.title}</p>
                          </td>
                          <td className="px-6 py-4.5 text-slate-650">
                            {drive.companyId?.name || 'Deleted Company'}
                          </td>
                          <td className="px-6 py-4.5 font-bold text-slate-850">
                            {drive.package} LPA
                          </td>
                          <td className="px-6 py-4.5">
                            <div className="flex flex-col space-y-1 text-xs">
                              <span>Min CGPA: <strong className="text-slate-800">{drive.eligibility?.cgpa}</strong></span>
                              <span>Branches: <strong className="text-slate-800">{drive.eligibility?.branches?.join(', ') || 'All'}</strong></span>
                            </div>
                          </td>
                          <td className="px-6 py-4.5 text-slate-550 text-xs">
                            {new Date(drive.deadline).toLocaleDateString(undefined, {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </td>
                          <td className="px-6 py-4.5">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                              drive.status === 'active'
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-slate-100 text-slate-600'
                            }`}>
                              {drive.status === 'active' ? 'Active' : 'Closed'}
                            </span>
                          </td>
                          <td className="px-6 py-4.5 text-right">
                            <div className="flex justify-end">
                              <button
                                onClick={() => handleToggleJobStatus(drive._id)}
                                disabled={actionLoading === drive._id}
                                className={`flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
                                  drive.status === 'active'
                                    ? 'bg-amber-50 hover:bg-amber-100 border-amber-100 text-amber-700'
                                    : 'bg-teal-50 hover:bg-teal-100 border-teal-100 text-teal-700'
                                }`}
                              >
                                {drive.status === 'active' ? (
                                  <>
                                    <XCircle className="w-3.5 h-3.5" />
                                    Close Drive
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    Reopen Drive
                                  </>
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {filteredDrives.length === 0 && (
                        <tr>
                          <td colSpan="7" className="text-center py-12 text-slate-400 font-semibold italic">
                            No placement drives found matching search criteria.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
