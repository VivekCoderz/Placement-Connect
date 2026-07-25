import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Sparkles, CheckCircle2, XCircle, ListChecks, Calendar, FileText } from 'lucide-react';
import { useSelector } from 'react-redux';
import Stepper from '../components/Stepper';
import api from '../utils/api';

const Applications = () => {
  const user = useSelector((state) => state.auth.user);
  const [applications, setApplications] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [showSimulator, setShowSimulator] = useState({});
  const [selectedOfferContent, setSelectedOfferContent] = useState('');
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);

  const handlePrintOffer = (content) => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Offer Letter</title>
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #2D3748; padding: 40px; }
            .letter-content { line-height: 1.6; font-size: 14px; }
            @media print {
              body { padding: 0; }
            }
          </style>
        </head>
        <body>
          <div class="letter-content">
            \${content}
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

                    {app.offerLetterStatus === 'Approved' && (
                      <button
                        onClick={() => {
                          if (app.offerLetterUrl) {
                            window.open(app.offerLetterUrl, '_blank');
                          } else {
                            setSelectedOfferContent(app.offerLetterContent);
                            setIsOfferModalOpen(true);
                          }
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 hover:border-emerald-300 text-[10px] text-emerald-700 font-bold transition-all shadow-sm rounded-lg cursor-pointer active:scale-95"
                      >
                        <FileText className="w-3.5 h-3.5 text-emerald-600" />
                        {app.offerLetterUrl ? 'Download PDF' : 'View Offer'}
                      </button>
                    )}

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
                  <Stepper currentStatus={app.status} rounds={job.rounds} appRounds={app.rounds} />
                </div>

                {/* Round-by-Round Evaluation Journey History */}
                {app.rounds && app.rounds.length > 0 && (
                  <div className="px-6 pb-6 bg-white border-t border-[#F1F5F9]">
                    <h4 className="text-xs font-bold text-[#111827] mb-3 uppercase tracking-wider flex items-center gap-1.5 pt-4">
                      <ListChecks className="w-4 h-4 text-[#22C55E]" /> Round-by-Round Evaluation Status
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {app.rounds.map((round, rIdx) => {
                        const isPassed = round.result === 'Passed';
                        const isFailed = round.result === 'Failed';
                        return (
                          <div 
                            key={rIdx} 
                            className={`p-4 rounded-xl border transition-all duration-200 hover:shadow-sm ${
                              isPassed ? 'bg-emerald-50/40 border-emerald-200' :
                              isFailed ? 'bg-rose-50/40 border-rose-200' :
                              'bg-slate-50/40 border-slate-200'
                            }`}
                          >
                            <div className="flex justify-between items-start gap-2">
                              <h5 className="text-xs font-bold text-[#111827] truncate">{round.name}</h5>
                              <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                                isPassed ? 'bg-emerald-100 text-emerald-700' :
                                isFailed ? 'bg-rose-100 text-rose-750' :
                                'bg-blue-100 text-blue-700 animate-pulse'
                              }`}>
                                {round.result || 'Pending'}
                              </span>
                            </div>
                            
                            <div className="mt-1.5 flex flex-wrap gap-1 items-center">
                              <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider ${
                                round.roundType === 'Physical' 
                                  ? 'bg-purple-50 border-purple-200 text-purple-600' 
                                  : 'bg-indigo-50 border-indigo-200 text-indigo-600'
                              }`}>
                                {round.roundType || 'Online'} Round
                              </span>
                            </div>
                            
                            {round.scheduledAt && (
                              <p className="text-[10px] text-[#4B5563] font-medium mt-2 flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5 text-[#94A3B8]" />
                                <span>Scheduled: {new Date(round.scheduledAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                              </p>
                            )}

                            {round.roundType === 'Physical' && round.venue && (
                              <p className="text-[10px] text-[#4B5563] font-bold mt-1.5 bg-[#FAF5FF] border border-[#F3E8FF] p-1.5 rounded flex items-center gap-1">
                                <span className="text-purple-600">📍 Venue:</span>
                                <span className="text-[#111827]">{round.venue}</span>
                              </p>
                            )}
                            {round.roundType !== 'Physical' && round.testLink && (
                              <div className="mt-2 bg-[#EEF2FF] border border-[#E0E7FF] p-1.5 rounded flex flex-col gap-1.5">
                                <p className="text-[9px] text-[#4B5563] font-semibold">🔗 Online Evaluation Link:</p>
                                <a 
                                  href={round.testLink.startsWith('http') ? round.testLink : `https://${round.testLink}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex justify-center items-center gap-1 px-2 py-1 text-[9px] font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded text-center transition-colors select-none shadow-sm cursor-pointer"
                                >
                                  Start Test / Join Round
                                </a>
                              </div>
                            )}

                            {round.notes && (
                              <div className="mt-2 text-[10px] text-[#4B5563] bg-white border border-[#E5E7EB] rounded p-2 italic leading-relaxed">
                                <strong>Feedback/Instructions:</strong> {round.notes}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

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

      {/* STUDENT VIEW OFFER LETTER MODAL */}
      {isOfferModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/55 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative bg-white rounded-2xl w-full max-w-3xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200 text-[#4B5563]">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-[#111827] tracking-tight">Your Official Offer Letter</h3>
                <p className="text-[11px] text-[#4B5563] font-medium mt-0.5">Congratulating you on your official selection!</p>
              </div>
              <button
                onClick={() => setIsOfferModalOpen(false)}
                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
              >
                <XCircle className="w-5 h-5 text-rose-500" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-8 bg-slate-50 overflow-y-auto max-h-[60vh] flex justify-center">
              <div 
                className="prose prose-sm max-w-none text-slate-700 font-sans text-xs bg-white p-10 rounded-lg border border-slate-100 shadow-md w-full"
                dangerouslySetInnerHTML={{ __html: selectedOfferContent }} 
              />
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3 font-semibold">
              <button
                onClick={() => setIsOfferModalOpen(false)}
                className="px-4 py-2 border border-slate-200 hover:bg-white text-xs text-slate-700 rounded-xl transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => handlePrintOffer(selectedOfferContent)}
                className="px-4 py-2 bg-[#22C55E] hover:bg-[#16A34A] text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <FileText className="w-3.5 h-3.5" />
                Print / Save PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Applications;
