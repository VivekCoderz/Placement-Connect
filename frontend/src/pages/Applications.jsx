import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, CheckCircle2, XCircle, ListChecks, Calendar, FileText, Clock, PartyPopper, AlertCircle, Undo2 } from 'lucide-react';
import { useSelector } from 'react-redux';
import Stepper from '../components/Stepper';
import api, { getErrorMessage } from '../utils/api';
import { createSocket } from '../utils/socket';
import { sanitizeHtml, writePrintDocument } from '../utils/sanitize';

const formatDate = (value, withTime = false) =>
  value
    ? new Date(value).toLocaleString('en-IN', withTime
      ? { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' }
      : { day: 'numeric', month: 'short', year: 'numeric' })
    : '';

// Only http(s) links are rendered as clickable.
const safeHref = (url) => {
  const value = String(url || '').trim();
  if (!value) return null;
  const withScheme = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  try {
    const parsed = new URL(withScheme);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:' ? parsed.href : null;
  } catch {
    return null;
  }
};

const hasOpenOffer = (app) => ['Pending Approval', 'Approved'].includes(app.offerLetterStatus);
const canWithdraw = (app) => !['Selected', 'Rejected', 'Withdrawn'].includes(app.status) && !hasOpenOffer(app);

const Applications = () => {
  const user = useSelector((state) => state.auth.user);
  const [applications, setApplications] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [selectedOfferContent, setSelectedOfferContent] = useState('');
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const [currentSection, setCurrentSection] = useState('active');
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [isPlaced, setIsPlaced] = useState(false);
  const [actionMsg, setActionMsg] = useState(null); // { type, text }
  const [busyAppId, setBusyAppId] = useState(null);

  const handlePrintOffer = (content) => {
    const printWindow = window.open('', '_blank');
    writePrintDocument(printWindow, {
      title: `Offer Letter`,
      styles: `
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #2D3748; padding: 40px; }
            .letter-content { line-height: 1.6; font-size: 14px; }
            @media print {
              body { padding: 0; }
            }
          `,
      body: `<div class="letter-content">${sanitizeHtml(content)}</div>`,
    });
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
      setIsPlaced(Boolean(data.isPlaced));
      setLoadError('');
    } catch (err) {
      setLoadError(getErrorMessage(err, 'Could not load your applications.'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleOfferResponse = async (app, decision) => {
    const job = getJobDetails(app.jobId);
    const question = decision === 'Accept'
      ? `Accept the offer from ${job.companyName || 'this company'}? You can accept only one offer, and you will not be able to apply to other drives after this.`
      : `Decline the offer from ${job.companyName || 'this company'}? This cannot be undone.`;
    if (!window.confirm(question)) return;

    setBusyAppId(app.id);
    setActionMsg(null);
    try {
      const response = await api.put(`/api/applications/${app.id}/offer-response`, { decision });
      setActionMsg({ type: 'success', text: response.data.message });
      await fetchApplicationsData();
    } catch (err) {
      setActionMsg({ type: 'error', text: getErrorMessage(err, 'Could not save your response.') });
    } finally {
      setBusyAppId(null);
    }
  };

  const handleWithdraw = async (app) => {
    const job = getJobDetails(app.jobId);
    if (!window.confirm(`Withdraw your application for ${job.title || 'this drive'}? You cannot re-apply to it.`)) return;
    setBusyAppId(app.id);
    setActionMsg(null);
    try {
      await api.put(`/api/applications/${app.id}/withdraw`);
      setActionMsg({ type: 'success', text: 'Application withdrawn.' });
      await fetchApplicationsData();
    } catch (err) {
      setActionMsg({ type: 'error', text: getErrorMessage(err, 'Could not withdraw the application.') });
    } finally {
      setBusyAppId(null);
    }
  };

  useEffect(() => {
    if (user) {
      fetchApplicationsData();
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;

    // Identity comes from the JWT on the server; it joins the user's own room.
    const socket = createSocket();

    socket.on('application_status_update', (data) => {
      console.log('Real-time application status update received:', data);
      fetchApplicationsData();
      if (data.message) {
        try {
          const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-120.wav');
          audio.volume = 0.4;
          audio.play().catch(() => {});
        } catch {}
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [user]);

  const getJobDetails = (jobId) => {
    return jobs.find(j => j.id === jobId) || {};
  };

  const activeApps = applications.filter(app => !['Selected', 'Rejected', 'Withdrawn'].includes(app.status));
  const selectedApps = applications.filter(app => app.status === 'Selected');
  const rejectedApps = applications.filter(app => app.status === 'Rejected');
  const completedApps = applications.filter(app => ['Selected', 'Rejected', 'Withdrawn'].includes(app.status));

  let displayedApps = [];
  if (currentSection === 'active') displayedApps = activeApps;
  else if (currentSection === 'selected') displayedApps = selectedApps;
  else if (currentSection === 'rejected') displayedApps = rejectedApps;
  else if (currentSection === 'completed') displayedApps = completedApps;

  return (
    <div className="space-y-8 animate-in fade-in duration-300 text-[#4B5563]">
      {/* Banner */}
      <div className="bg-white border border-[#E5E7EB] p-5 sm:p-8 rounded-2xl shadow-sm">
        <h1 className="text-xl md:text-2xl font-bold text-[#111827] tracking-tight">
          My Applications
        </h1>
        <p className="text-xs text-[#4B5563] font-medium mt-1.5 leading-relaxed">
          Track the evaluation progress of your active placement and internship drives.
        </p>
      </div>

      {isPlaced && (
        <div className="pc-alert-success" role="status">
          <PartyPopper className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
          <div>
            <p className="font-semibold">You are placed. Congratulations!</p>
            <p className="mt-0.5 text-xs">You have accepted an offer, so you can no longer apply to new drives.</p>
          </div>
        </div>
      )}

      {actionMsg && (
        <div className={actionMsg.type === 'success' ? 'pc-alert-success' : 'pc-alert-error'} role={actionMsg.type === 'success' ? 'status' : 'alert'}>
          {actionMsg.type === 'success' ? <CheckCircle2 className="h-5 w-5 flex-shrink-0" /> : <AlertCircle className="h-5 w-5 flex-shrink-0" />}
          <p className="text-sm font-semibold">{actionMsg.text}</p>
        </div>
      )}

      {/* Navigation Sections */}
      <div className="flex flex-wrap border-b border-[#E5E7EB] gap-2 font-bold text-xs select-none">
        <button
          onClick={() => setCurrentSection('active')}
          className={`pb-3 px-4 border-b-2 transition-all cursor-pointer ${
            currentSection === 'active'
              ? 'border-[#22C55E] text-[#22C55E]'
              : 'border-transparent text-[#94A3B8] hover:text-[#4B5563]'
          }`}
        >
          Active Applications ({activeApps.length})
        </button>
        <button
          onClick={() => setCurrentSection('selected')}
          className={`pb-3 px-4 border-b-2 transition-all cursor-pointer ${
            currentSection === 'selected'
              ? 'border-emerald-500 text-emerald-600'
              : 'border-transparent text-[#94A3B8] hover:text-[#4B5563]'
          }`}
        >
          Selected Jobs ({selectedApps.length})
        </button>
        <button
          onClick={() => setCurrentSection('rejected')}
          className={`pb-3 px-4 border-b-2 transition-all cursor-pointer ${
            currentSection === 'rejected'
              ? 'border-rose-500 text-rose-600'
              : 'border-transparent text-[#94A3B8] hover:text-[#4B5563]'
          }`}
        >
          Rejected Jobs ({rejectedApps.length})
        </button>
        <button
          onClick={() => setCurrentSection('completed')}
          className={`pb-3 px-4 border-b-2 transition-all cursor-pointer ${
            currentSection === 'completed'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-[#94A3B8] hover:text-[#4B5563]'
          }`}
        >
          Completed Applications ({completedApps.length})
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-4" role="status" aria-label="Loading applications">
          {[0, 1].map((i) => (
            <div key={i} className="pc-card p-6 space-y-3">
              <div className="pc-skeleton h-4 w-1/3" />
              <div className="pc-skeleton h-3 w-1/2" />
              <div className="pc-skeleton h-10 w-full rounded-xl" />
            </div>
          ))}
        </div>
      ) : loadError ? (
        <div className="pc-alert-error" role="alert">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-semibold text-sm">{loadError}</p>
            <button type="button" onClick={() => { setIsLoading(true); fetchApplicationsData(); }} className="mt-2 text-xs font-bold underline">
              Try again
            </button>
          </div>
        </div>
      ) : displayedApps.length === 0 ? (
        <div className="pc-empty space-y-3 animate-slide-up">
          <p className="text-[#4B5563] text-sm font-semibold">
            No applications found in this section.
          </p>
          {currentSection === 'active' && (
            <Link
              to="/jobs"
              className="inline-flex items-center gap-1 bg-[#22C55E] hover:bg-[#16A34A] text-white font-bold px-5 py-2.5 rounded-xl text-xs transition-all shadow-sm active:scale-[0.98]"
            >
              Explore Active Drives <ChevronRight className="w-4 h-4 text-white" />
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-6 animate-slide-up">
          {displayedApps.map((app) => {
            const job = getJobDetails(app.jobId);
            const isBusy = busyAppId === app.id;

            return (
              <div
                key={app.id}
                className="bg-white border border-[#E5E7EB] rounded-2xl shadow-sm overflow-hidden"
              >
                {/* Top Section */}
                <div className="p-6 bg-[#F8FAFC] border-b border-[#E5E7EB] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-xl bg-white border border-[#E5E7EB] flex items-center justify-center font-bold text-[#0B3D91] text-xs flex-shrink-0 shadow-sm">
                      {job.companyName ? job.companyName.substring(0, 2).toUpperCase() : 'PC'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2.5">
                        <h4 className="text-[10px] text-[#94A3B8] font-bold uppercase tracking-wider">{job.companyName}</h4>
                        <span className="text-[10px] text-[#94A3B8] font-mono font-semibold">Applied: {formatDate(app.createdAt)}</span>
                        {app.status === 'Withdrawn' && (
                          <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">Withdrawn</span>
                        )}
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

                    {canWithdraw(app) && (
                      <button
                        type="button"
                        onClick={() => handleWithdraw(app)}
                        disabled={isBusy}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#E5E7EB] hover:border-rose-200 rounded-lg text-[10px] text-[#4B5563] hover:text-rose-600 font-bold transition-all shadow-sm disabled:opacity-50"
                      >
                        <Undo2 className="w-3.5 h-3.5" />
                        Withdraw
                      </button>
                    )}
                  </div>
                </div>

                {/* Stepper block */}
                <div className="p-6 md:p-8 bg-white">
                  <Stepper currentStatus={app.status} rounds={job.rounds} appRounds={app.rounds} />
                </div>

                {/* Offer status */}
                {app.status === 'Selected' && app.offerLetterStatus !== 'Approved' && (
                  <div className="mx-6 md:mx-8 mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-5 flex items-start gap-3">
                    <Clock className="h-5 w-5 flex-shrink-0 text-amber-600" />
                    <div>
                      <p className="text-sm font-bold text-amber-900">You have been selected!</p>
                      <p className="mt-0.5 text-xs text-amber-800">
                        {app.offerLetterStatus === 'Pending Approval'
                          ? 'Your offer letter has been issued and is being verified by the Placement Cell. It will appear here once approved.'
                          : 'The company will issue your offer letter soon. You will be notified when it is ready.'}
                      </p>
                    </div>
                  </div>
                )}

                {app.offerLetterStatus === 'Approved' && (
                  <div className={`mx-6 md:mx-8 mb-6 rounded-2xl border p-5 space-y-3 ${
                    app.offerResponse === 'Accepted' ? 'border-emerald-200 bg-emerald-50'
                      : app.offerResponse === 'Declined' ? 'border-slate-200 bg-slate-50'
                      : 'border-[#0B3D91]/20 bg-[#0B3D91]/5'
                  }`}>
                    {app.offerResponse === 'Accepted' ? (
                      <div className="flex items-start gap-3">
                        <PartyPopper className="h-5 w-5 flex-shrink-0 text-emerald-600" />
                        <div>
                          <p className="text-sm font-bold text-emerald-900">Offer accepted</p>
                          <p className="text-xs text-emerald-800">You accepted this offer on {formatDate(app.offerRespondedAt)}. Congratulations!</p>
                        </div>
                      </div>
                    ) : app.offerResponse === 'Declined' ? (
                      <div className="flex items-start gap-3">
                        <XCircle className="h-5 w-5 flex-shrink-0 text-slate-500" />
                        <p className="text-sm font-semibold text-slate-700">You declined this offer on {formatDate(app.offerRespondedAt)}.</p>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-start gap-3">
                          <FileText className="h-5 w-5 flex-shrink-0 text-[#0B3D91]" />
                          <div>
                            <p className="text-sm font-bold text-[#111827]">Your offer letter is ready</p>
                            <p className="text-xs text-[#4B5563]">
                              Please review it and respond{app.offerDeadline ? <> by <strong>{formatDate(app.offerDeadline)}</strong></> : ''}.
                              {isPlaced && ' You have already accepted another offer, so you can only decline this one.'}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => handleOfferResponse(app, 'Accept')}
                            disabled={isBusy || isPlaced || (app.offerDeadline && new Date(app.offerDeadline) < new Date())}
                            className="pc-btn-primary text-xs px-4 py-2 disabled:opacity-50"
                          >
                            <CheckCircle2 className="h-4 w-4" /> Accept offer
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOfferResponse(app, 'Decline')}
                            disabled={isBusy || (app.offerDeadline && new Date(app.offerDeadline) < new Date())}
                            className="pc-btn-secondary text-xs px-4 py-2 text-rose-600 disabled:opacity-50"
                          >
                            <XCircle className="h-4 w-4" /> Decline
                          </button>
                        </div>
                        {app.offerDeadline && new Date(app.offerDeadline) < new Date() && (
                          <p className="text-xs font-semibold text-rose-600">The response deadline has passed. Please contact the Placement Cell.</p>
                        )}
                      </>
                    )}
                  </div>
                )}

                {app.status === 'Rejected' && (
                  <div className="mx-6 md:mx-8 mb-6 p-5 bg-rose-50/50 border border-rose-200 rounded-2xl space-y-4 animate-in fade-in duration-300">
                    <div className="flex items-center gap-2">
                      <XCircle className="w-5 h-5 text-rose-500 flex-shrink-0 animate-pulse" />
                      <div>
                        <h4 className="font-bold text-rose-800 uppercase tracking-wider text-[10px]">Evaluation Result Outcome</h4>
                        <p className="text-[11px] text-rose-600 font-semibold mt-0.5">We regret to inform you that your application was not selected to advance further.</p>
                      </div>
                    </div>

                    {app.atsScore !== undefined && (
                      <div className="bg-white border border-rose-100 p-5 rounded-2xl space-y-4 shadow-sm text-xs font-semibold text-[#4B5563]">
                        {/* ATS Score details */}
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                          <span className="text-slate-500 font-bold text-[10px] uppercase tracking-wider">Resume Match</span>
                          <span className="bg-rose-50 text-rose-600 border border-rose-100 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                            ATS Score: {app.atsScore}%
                          </span>
                        </div>

                        {/* Rejection Reasons */}
                        {app.rejectionReason && (
                          <div className="space-y-1.5">
                            <span className="text-rose-600 font-bold text-[10px] uppercase tracking-wider block">Reason:</span>
                            <ul className="list-disc pl-4 space-y-1 text-slate-500 leading-relaxed font-semibold">
                              {app.rejectionReason
                                .split(/[;\n•]+/)
                                .map(p => p.trim())
                                .filter(p => p.length > 0 && !p.toLowerCase().startsWith('reason:'))
                                .map((bp, idx) => (
                                  <li key={idx}>{bp}</li>
                                ))
                              }
                            </ul>
                          </div>
                        )}

                        {/* Suggestions / Recommended preparation */}
                        {app.recommendedLearning && app.recommendedLearning.length > 0 && (
                          <div className="pt-3 border-t border-slate-100 space-y-1.5">
                            <span className="text-indigo-600 font-bold text-[10px] uppercase tracking-wider block">Suggestions:</span>
                            <ul className="list-disc pl-4 space-y-1 text-slate-500 leading-relaxed font-semibold">
                              {app.recommendedLearning.map((topic, idx) => (
                                <li key={idx}>{topic}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Check if rejected during custom round */}
                    {app.rounds?.some(r => r.result === 'Failed' || r.result === 'Rejected') && (() => {
                      const failedRound = app.rounds.find(r => r.result === 'Failed' || r.result === 'Rejected');
                      if (failedRound && failedRound.notes) {
                        return (
                          <div className="bg-white border border-rose-100 p-4 rounded-xl space-y-1 shadow-sm text-xs font-semibold text-[#4B5563]">
                            <span className="text-rose-650 font-bold text-[10px] uppercase tracking-wider">Feedback from Recruiter ({failedRound.name}):</span>
                            <p className="text-slate-500 leading-relaxed italic mt-1">"{failedRound.notes}"</p>
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </div>
                )}

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
                                <span>Scheduled: {formatDate(round.scheduledAt, true)}</span>
                              </p>
                            )}

                            {round.roundType === 'Physical' && round.venue && (
                              <p className="text-[10px] text-[#4B5563] font-bold mt-1.5 bg-[#FAF5FF] border border-[#F3E8FF] p-1.5 rounded flex items-center gap-1">
                                <span className="text-purple-600">📍 Venue:</span>
                                <span className="text-[#111827]">{round.venue}</span>
                              </p>
                            )}
                            {round.roundType !== 'Physical' && safeHref(round.testLink) && round.result === 'Pending' && (
                              <div className="mt-2 bg-[#EEF2FF] border border-[#E0E7FF] p-1.5 rounded flex flex-col gap-1.5">
                                <p className="text-[9px] text-[#4B5563] font-semibold">🔗 Online Evaluation Link:</p>
                                <a
                                  href={safeHref(round.testLink)}
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
            <div className="p-5 sm:p-8 bg-slate-50 overflow-y-auto max-h-[60vh] flex justify-center">
              <div 
                className="prose prose-sm max-w-none text-slate-700 font-sans text-xs bg-white p-5 sm:p-10 rounded-lg border border-slate-100 shadow-md w-full"
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(selectedOfferContent) }} 
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
