import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Printer, Download, FileSpreadsheet, Users, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import api, { getErrorMessage } from '../utils/api';
import AuthLoadingOverlay from '../components/AuthLoadingOverlay';

const formatDate = (value, withTime = false) =>
  value
    ? new Date(value).toLocaleString('en-IN', withTime
      ? { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' }
      : { day: 'numeric', month: 'short', year: 'numeric' })
    : '';

const cellValue = (column, value) => {
  if (column === 'appliedOn') return formatDate(value);
  if (column === 'atsScore' && value !== '') return `${value}%`;
  return value ?? '';
};

const RESULT_STYLE = {
  Selected: 'text-emerald-700 font-bold',
  Rejected: 'text-rose-600',
  Absent: 'text-slate-500',
  Waiting: 'text-amber-600',
  Pending: 'text-blue-600',
  Accepted: 'text-emerald-700 font-bold',
  Declined: 'text-slate-500',
};

/** Round-wise and final selection lists for one drive, printable and downloadable. */
const DriveReports = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [overview, setOverview] = useState(null);
  const [stage, setStage] = useState('selected');
  const [list, setList] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isListLoading, setIsListLoading] = useState(false);
  const [error, setError] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    api.get(`/api/reports/jobs/${jobId}`)
      .then((res) => setOverview(res.data))
      .catch((err) => setError(getErrorMessage(err, 'Could not load this drive')))
      .finally(() => setIsLoading(false));
  }, [jobId]);

  const loadList = useCallback(async (nextStage) => {
    setIsListLoading(true);
    setError('');
    try {
      const res = await api.get(`/api/reports/jobs/${jobId}/list`, { params: { stage: nextStage } });
      setList(res.data);
    } catch (err) {
      setList(null);
      setError(getErrorMessage(err, 'Could not load the list'));
    } finally {
      setIsListLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    loadList(stage);
  }, [stage, loadList]);

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const res = await api.get(`/api/reports/jobs/${jobId}/list`, { params: { stage, format: 'csv' }, responseType: 'blob' });
      const disposition = res.headers['content-disposition'] || '';
      const fileName = /filename="([^"]+)"/.exec(disposition)?.[1] || 'placement-list.csv';
      const url = URL.createObjectURL(res.data);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(getErrorMessage(err, 'Download failed'));
    } finally {
      setIsDownloading(false);
    }
  };

  if (isLoading) {
    return <AuthLoadingOverlay show title="Loading drive reports…" subtitle="Collecting round results." />;
  }

  if (!overview) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <div className="pc-alert-error" role="alert"><AlertCircle className="h-5 w-5" /><p>{error || 'Drive not found'}</p></div>
      </div>
    );
  }

  const { job, totals, rounds } = overview;
  const stageOptions = [
    ...rounds.map((r) => ({ value: r._id, label: `Round ${r.sequence}: ${r.name}` })),
    { value: 'selected', label: 'Final Selection List' },
    { value: 'applicants', label: 'All Applicants' },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] print:bg-white">
      <style>{`
        @media print {
          @page { size: A4 landscape; margin: 12mm; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .report-table th, .report-table td { font-size: 9pt; padding: 4px 6px; }
          .report-table tr { break-inside: avoid; }
        }
      `}</style>

      <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-8 print:max-w-none print:p-0 print:space-y-3">
        {/* Toolbar (not printed) */}
        <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
          <button type="button" onClick={() => navigate(-1)} className="pc-btn-secondary text-xs px-3 py-2">
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={handleDownload} disabled={isDownloading || !list} className="pc-btn-secondary text-xs px-3 py-2 disabled:opacity-50">
              <Download className="h-4 w-4" /> {isDownloading ? 'Preparing…' : 'Download Excel (CSV)'}
            </button>
            <button type="button" onClick={() => window.print()} disabled={!list} className="pc-btn-primary text-xs px-3 py-2 disabled:opacity-50">
              <Printer className="h-4 w-4" /> Print list
            </button>
          </div>
        </div>

        {/* Printed header */}
        <div className="pc-card p-5 sm:p-6 print:border-0 print:shadow-none print:p-0">
          <div className="hidden print:block text-center mb-2">
            <p className="text-base font-bold text-[#111827]">Geeta University – Training &amp; Placement Cell</p>
          </div>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#94A3B8]">{job.company}</p>
              <h1 className="text-xl font-bold text-[#111827]">{job.title}</h1>
              <p className="mt-1 text-xs text-[#4B5563]">
                Package {job.package} LPA · {job.numOpenings || '–'} openings · Applications closed {formatDate(job.deadline)}
              </p>
            </div>
            {list && (
              <div className="text-right">
                <p className="text-base font-bold text-[#0B3D91]">{list.title}</p>
                <p className="text-[11px] text-[#6B7280]">Generated {formatDate(list.generatedAt, true)} · {list.rows.length} student(s)</p>
              </div>
            )}
          </div>
        </div>

        {/* Summary (not printed) */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 print:hidden">
          {[
            { label: 'Applicants', value: totals.applicants, icon: Users },
            { label: 'In process', value: totals.inProcess, icon: Clock },
            { label: 'Selected', value: totals.selected, icon: CheckCircle2 },
            { label: 'Offers accepted', value: totals.offersAccepted, icon: FileSpreadsheet },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="pc-card p-4">
              <Icon className="h-4 w-4 text-[#0B3D91]" />
              <p className="mt-2 text-2xl font-bold text-[#111827]">{value}</p>
              <p className="text-[11px] font-semibold text-[#6B7280]">{label}</p>
            </div>
          ))}
        </div>

        {/* Round funnel (not printed) */}
        {rounds.length > 0 && (
          <div className="pc-card overflow-x-auto p-0 print:hidden">
            <table className="w-full text-xs">
              <thead className="bg-[#0B3D91]/5 text-left text-[10px] uppercase tracking-wider text-[#0B3D91]">
                <tr>
                  <th className="px-4 py-2.5">Round</th>
                  <th className="px-3 py-2.5">Candidates</th>
                  <th className="px-3 py-2.5">Selected</th>
                  <th className="px-3 py-2.5">Rejected</th>
                  <th className="px-3 py-2.5">Absent</th>
                  <th className="px-3 py-2.5">Pending</th>
                  <th className="px-3 py-2.5"></th>
                </tr>
              </thead>
              <tbody>
                {rounds.map((r) => (
                  <tr key={r._id} className="border-t border-[#E5E7EB]">
                    <td className="px-4 py-2.5 font-semibold text-[#111827]">
                      {r.sequence}. {r.name}
                      {r.awaitingApproval > 0 && (
                        <span className="ml-2 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                          {r.awaitingApproval} awaiting Placement Cell approval
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2.5">{r.total}</td>
                    <td className="px-3 py-2.5 font-semibold text-emerald-700">{r.selected}</td>
                    <td className="px-3 py-2.5 text-rose-600">{r.rejected}</td>
                    <td className="px-3 py-2.5">{r.absent}</td>
                    <td className="px-3 py-2.5 text-blue-600">{r.pending}</td>
                    <td className="px-3 py-2.5 text-right">
                      <button type="button" onClick={() => setStage(r._id)} className="font-bold text-[#0B3D91] hover:underline">
                        View list
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* List picker (not printed) */}
        <div className="flex flex-wrap items-center gap-3 print:hidden">
          <label htmlFor="stage" className="text-xs font-bold text-[#4B5563]">Show list:</label>
          <select id="stage" value={stage} onChange={(e) => setStage(e.target.value)} className="pc-input max-w-xs text-xs">
            {stageOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        {error && (
          <div className="pc-alert-error print:hidden" role="alert"><AlertCircle className="h-5 w-5" /><p className="text-sm">{error}</p></div>
        )}

        {/* The list */}
        <div className="pc-card overflow-x-auto p-0 print:border-0 print:shadow-none print:overflow-visible">
          {isListLoading ? (
            <div className="p-10 text-center text-xs text-[#6B7280]" role="status">Loading list…</div>
          ) : !list || list.rows.length === 0 ? (
            <div className="p-10 text-center text-sm text-[#6B7280]">No students in this list yet.</div>
          ) : (
            <table className="report-table w-full border-collapse text-xs">
              <thead>
                <tr className="bg-[#0B3D91]/5 text-left text-[10px] uppercase tracking-wider text-[#0B3D91] print:bg-gray-100">
                  <th className="border-b border-[#E5E7EB] px-3 py-2.5">S.No</th>
                  {list.columns.map((c) => (
                    <th key={c} className="border-b border-[#E5E7EB] px-3 py-2.5 whitespace-nowrap">{list.headers[c] || c}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {list.rows.map((row, i) => (
                  <tr key={`${row.rollNumber}-${i}`} className="border-b border-[#F1F5F9] print:border-gray-300">
                    <td className="px-3 py-2 text-[#6B7280]">{i + 1}</td>
                    {list.columns.map((c) => (
                      <td key={c} className={`px-3 py-2 ${c === 'name' ? 'font-semibold text-[#111827] whitespace-nowrap' : ''} ${RESULT_STYLE[row[c]] && ['result', 'response', 'status'].includes(c) ? RESULT_STYLE[row[c]] : ''}`}>
                        {cellValue(c, row[c])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Signatures (print only) */}
        <div className="hidden print:flex justify-between pt-14 text-xs text-[#111827]">
          <div className="w-56 border-t border-gray-500 pt-1 text-center">Recruiter / Company Representative</div>
          <div className="w-56 border-t border-gray-500 pt-1 text-center">Training &amp; Placement Officer</div>
        </div>
      </div>
    </div>
  );
};

export default DriveReports;
