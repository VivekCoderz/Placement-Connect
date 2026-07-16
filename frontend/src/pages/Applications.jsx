import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Sparkles, CheckCircle2, XCircle } from 'lucide-react';
import { useSelector } from 'react-redux';
import Stepper from '../components/Stepper';
import api from '../utils/api';

const Applications = () => {
  const user = useSelector((state) => state.auth.user);
  const [applications, setApplications] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [showSimulator, setShowSimulator] = useState({});

  const fetchApplicationsData = async () => {
    try {
      const response = await api.get('/api/applications/my-applications');
      const data = response.data;
      const mappedApps = (data.applications || []).map(app => ({
        ...app,
        id: app._id,
        jobId: app.jobId?._id || app.jobId
      }));
      setApplications(mappedApps);
      
      const populatedJobs = (data.applications || []).map(app => {
        if (app.jobId && typeof app.jobId === 'object') {
          return {
            ...app.jobId,
            id: app.jobId._id,
            companyName: app.jobId.companyId?.name || "Company"
          };
        }
        return null;
      }).filter(Boolean);
      setJobs(populatedJobs);
    } catch (err) {
      console.error("Failed to fetch applications:", err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchApplicationsData();
    }
  }, [user]);

  const getJobDetails = (jobId) => {
    return jobs.find(j => j.id === jobId) || {};
  };

  const handleSimulateStatus = (appId, nextStatus) => {
    setApplications(prev => prev.map(a => a.id === appId ? { ...a, status: nextStatus } : a));
  };

  const toggleSimulatorDrawer = (appId) => {
    setShowSimulator(prev => ({
      ...prev,
      [appId]: !prev[appId]
    }));
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300 text-[#4B5563]">
      {/* Banner */}
      <div className="bg-white border border-[#E5E7EB] p-8 rounded-2xl shadow-sm">
        <h1 className="text-xl md:text-2xl font-bold text-[#111827] tracking-tight">
          My Applications
        </h1>
        <p className="text-xs text-[#4B5563] font-medium mt-1.5 leading-relaxed">
          Track the evaluation progress of your active placement and internship drives.
        </p>
      </div>

      {applications.length === 0 ? (
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-20 text-center space-y-5 shadow-sm animate-slide-up">
          <p className="text-[#4B5563] text-sm font-semibold">
            You haven't applied to any job drives yet.
          </p>
          <Link
            to="/jobs"
            className="inline-flex items-center gap-1 bg-[#22C55E] hover:bg-[#16A34A] text-white font-bold px-5 py-2.5 rounded-xl text-xs transition-all shadow-sm active:scale-[0.98]"
          >
            Explore Active Drives <ChevronRight className="w-4 h-4 text-white" />
          </Link>
        </div>
      ) : (
        <div className="space-y-6 animate-slide-up">
          {applications.map((app) => {
            const job = getJobDetails(app.jobId);
            const isDrawerOpen = !!showSimulator[app.id];

            return (
              <div
                key={app.id}
                className="bg-white border border-[#E5E7EB] rounded-2xl shadow-sm overflow-hidden"
              >
                {/* Top Section */}
                <div className="p-6 bg-[#F8FAFC] border-b border-[#E5E7EB] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-xl bg-white border border-[#E5E7EB] flex items-center justify-center font-bold text-[#7C3AED] text-xs flex-shrink-0 shadow-sm">
                      {job.companyName ? job.companyName.substring(0, 2).toUpperCase() : 'PC'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2.5">
                        <h4 className="text-[10px] text-[#94A3B8] font-bold uppercase tracking-wider">{job.companyName}</h4>
                        <span className="text-[10px] text-[#94A3B8] font-mono font-semibold">Applied: {new Date(app.appliedAt).toLocaleDateString()}</span>
                      </div>
                      <h3 className="text-sm font-bold text-[#111827] mt-1">{job.title}</h3>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                    <span className="text-xs font-semibold text-[#4B5563]">
                      Package: <span className="text-[#111827] font-bold">{job.package} LPA</span>
                    </span>

                    {/* Simulator Trigger button */}
                    <button
                      onClick={() => toggleSimulatorDrawer(app.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#E5E7EB] hover:border-[#22C55E]/20 rounded-lg text-[10px] text-[#4B5563] hover:text-[#22C55E] font-bold transition-all shadow-sm"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-[#22C55E]" />
                      Simulate Stage
                    </button>
                  </div>
                </div>

                {/* Stepper block */}
                <div className="p-6 md:p-8 bg-white">
                  <Stepper currentStatus={app.status} />
                </div>

                {/* Simulator Drawer Panel */}
                {isDrawerOpen && (
                  <div className="p-5 bg-[#F8FAFC] border-t border-[#E5E7EB] animate-in slide-in-from-bottom-2 duration-200">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
                      <div className="space-y-0.5">
                        <h4 className="text-[10px] font-bold text-[#7C3AED] bg-[#7C3AED]/10 border border-[#7C3AED]/20 px-2.5 py-0.5 rounded inline-flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-[#7C3AED]" /> Stage Evaluation Simulator
                        </h4>
                        <p className="text-[10px] text-[#4B5563] font-medium">
                          Advance stages or trigger selection/rejection outcomes to inspect the tracker UI and notifications.
                        </p>
                      </div>

                      {/* Simulator buttons */}
                      <div className="flex flex-wrap gap-2 font-semibold">
                        <button
                          onClick={() => handleSimulateStatus(app.id, 'Applied')}
                          disabled={app.status === 'Applied'}
                          className="px-3 py-1.5 bg-white border border-[#E5E7EB] hover:bg-[#F8FAFC] disabled:opacity-30 text-[10px] text-[#4B5563] rounded-lg transition-colors shadow-sm"
                        >
                          Applied
                        </button>
                        <button
                          onClick={() => handleSimulateStatus(app.id, 'Aptitude')}
                          disabled={app.status === 'Aptitude'}
                          className="px-3 py-1.5 bg-white border border-[#E5E7EB] hover:bg-[#F8FAFC] disabled:opacity-30 text-[10px] text-[#4B5563] rounded-lg transition-colors shadow-sm"
                        >
                          Aptitude
                        </button>
                        <button
                          onClick={() => handleSimulateStatus(app.id, 'GD')}
                          disabled={app.status === 'GD'}
                          className="px-3 py-1.5 bg-white border border-[#E5E7EB] hover:bg-[#F8FAFC] disabled:opacity-30 text-[10px] text-[#4B5563] rounded-lg transition-colors shadow-sm"
                        >
                          GD Round
                        </button>
                        <button
                          onClick={() => handleSimulateStatus(app.id, 'HR')}
                          disabled={app.status === 'HR'}
                          className="px-3 py-1.5 bg-white border border-[#E5E7EB] hover:bg-[#F8FAFC] disabled:opacity-30 text-[10px] text-[#4B5563] rounded-lg transition-colors shadow-sm"
                        >
                          HR Round
                        </button>
                        <button
                          onClick={() => handleSimulateStatus(app.id, 'Selected')}
                          disabled={app.status === 'Selected'}
                          className="px-3 py-1.5 bg-[#22C55E]/10 border border-[#22C55E]/25 hover:bg-[#22C55E]/20 disabled:opacity-30 text-[10px] text-[#22C55E] rounded-lg flex items-center gap-1 transition-all shadow-sm"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#22C55E]" /> Select
                        </button>
                        <button
                          onClick={() => handleSimulateStatus(app.id, 'Rejected')}
                          disabled={app.status === 'Rejected'}
                          className="px-3 py-1.5 bg-rose-50 border border-rose-200 hover:bg-rose-100 disabled:opacity-30 text-[10px] text-rose-600 rounded-lg flex items-center gap-1 transition-all shadow-sm"
                        >
                          <XCircle className="w-3.5 h-3.5 text-rose-600" /> Reject
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Applications;
