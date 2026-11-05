import React from 'react';
import { Check, X, ClipboardCheck, Code, Users, UserCheck, CheckCircle2, FileText } from 'lucide-react';

const Stepper = ({ currentStatus, rounds, appRounds }) => {
  const steps = [
    { label: 'Applied', key: 'Applied', desc: 'Application Received', icon: ClipboardCheck },
    { label: 'Resume Screening', key: 'ResumeScreening', desc: 'AI screening & scoring', icon: FileText },
    { label: 'Assessment', key: 'Assessment', desc: 'Online tests & coding rounds', icon: Code },
    { label: 'Interview', key: 'Interview', desc: 'Technical evaluations', icon: Users },
    { label: 'HR Round', key: 'HRRound', desc: 'HR & package review', icon: UserCheck },
    { label: 'Decision', key: 'Decision', desc: 'Final Selection Status', icon: CheckCircle2 }
  ];

  const getStepStatus = (index) => {
    // 0. Applied stage
    if (index === 0) {
      return 'Completed';
    }

    // Determine if any previous stage failed
    const checkPriorFailed = (idx) => {
      for (let prevIdx = 1; prevIdx < idx; prevIdx++) {
        if (getStepStatus(prevIdx) === 'Failed') return true;
      }
      return false;
    };

    if (checkPriorFailed(index)) {
      return 'Disabled';
    }

    // 1. Resume Screening
    if (index === 1) {
      const match = appRounds?.find(r => r.name.toLowerCase().includes("screening") || r.name.toLowerCase().includes("resume"));
      if (match) {
        if (match.result === 'Passed' || match.result === 'Selected') return 'Completed';
        if (match.result === 'Failed' || match.result === 'Rejected') return 'Failed';
        return 'Active';
      }
      
      if (currentStatus === 'Applied') {
        return 'Active';
      }
      if (currentStatus === 'Rejected') {
        const otherRoundsExist = appRounds?.some(r => r.name.toLowerCase() !== "resume screening" && r.name.toLowerCase() !== "ai screening" && r.result !== "Pending");
        if (!otherRoundsExist) return 'Failed';
        return 'Completed';
      }
      return 'Completed';
    }

    // 2. Assessment
    if (index === 2) {
      const match = appRounds?.find(r => r.name.toLowerCase().includes("assessment") || r.name.toLowerCase().includes("test") || r.name.toLowerCase().includes("aptitude"));
      if (match) {
        if (match.result === 'Passed') return 'Completed';
        if (match.result === 'Failed' || match.result === 'Rejected') return 'Failed';
        return 'Active';
      }

      if (currentStatus === 'Assessment') {
        return 'Active';
      }
      
      if (getStepStatus(1) !== 'Completed') return 'Disabled';

      if (currentStatus === 'Rejected') {
        const failedMatch = appRounds?.find(r => (r.name.toLowerCase().includes("assessment") || r.name.toLowerCase().includes("test")) && (r.result === 'Failed' || r.result === 'Rejected'));
        if (failedMatch) return 'Failed';
        const laterRoundsExist = appRounds?.some(r => (r.name.toLowerCase().includes("interview") || r.name.toLowerCase().includes("hr")) && r.result !== "Pending");
        if (laterRoundsExist) return 'Completed';
        return 'Active';
      }

      if (currentStatus === 'Under Review' || currentStatus === 'Shortlisted') {
        return 'Disabled';
      }

      return 'Completed';
    }

    // 3. Interview
    if (index === 3) {
      const match = appRounds?.find(r => r.name.toLowerCase().includes("interview") && !r.name.toLowerCase().includes("hr"));
      if (match) {
        if (match.result === 'Passed') return 'Completed';
        if (match.result === 'Failed' || match.result === 'Rejected') return 'Failed';
        return 'Active';
      }

      if (currentStatus === 'Interview') {
        return 'Active';
      }

      if (getStepStatus(2) !== 'Completed') return 'Disabled';

      if (currentStatus === 'Rejected') {
        const failedMatch = appRounds?.find(r => r.name.toLowerCase().includes("interview") && !r.name.toLowerCase().includes("hr") && (r.result === 'Failed' || r.result === 'Rejected'));
        if (failedMatch) return 'Failed';
        const laterRoundsExist = appRounds?.some(r => r.name.toLowerCase().includes("hr") && r.result !== "Pending");
        if (laterRoundsExist) return 'Completed';
        return 'Active';
      }

      if (currentStatus === 'Under Review' || currentStatus === 'Shortlisted' || currentStatus === 'Assessment') {
        return 'Disabled';
      }

      return 'Completed';
    }

    // 4. HR Round
    if (index === 4) {
      const match = appRounds?.find(r => r.name.toLowerCase().includes("hr") || r.name.toLowerCase().includes("managerial"));
      if (match) {
        if (match.result === 'Passed' || match.result === 'Selected') return 'Completed';
        if (match.result === 'Failed' || match.result === 'Rejected') return 'Failed';
        return 'Active';
      }

      if (currentStatus === 'HR Round') {
        return 'Active';
      }

      if (getStepStatus(3) !== 'Completed') return 'Disabled';

      if (currentStatus === 'Rejected') {
        const failedMatch = appRounds?.find(r => (r.name.toLowerCase().includes("hr") || r.name.toLowerCase().includes("managerial")) && (r.result === 'Failed' || r.result === 'Rejected'));
        if (failedMatch) return 'Failed';
        return 'Active';
      }

      if (currentStatus === 'Selected') {
        return 'Completed';
      }

      return 'Disabled';
    }

    // 5. Decision
    if (index === 5) {
      if (currentStatus === 'Selected') {
        return 'Completed';
      }
      if (currentStatus === 'Rejected') {
        return 'Failed';
      }
      if (getStepStatus(4) === 'Completed') {
        return 'Active';
      }
      return 'Disabled';
    }

    return 'Disabled';
  };

  const isSelected = currentStatus === 'Selected';
  const isRejected = currentStatus === 'Rejected';

  return (
    <div className="w-full py-8">
      {/* Desktop Horizontal View */}
      <div className="hidden md:flex items-center w-full">
        {steps.map((step, index) => {
          const StepIcon = step.icon;
          const stepStatus = getStepStatus(index);
          const isCompleted = stepStatus === 'Completed';
          const isActive = stepStatus === 'Active';
          const isFailed = stepStatus === 'Failed';
          const isDisabled = stepStatus === 'Disabled';

          const showLine = index < steps.length - 1;
          const lineCompleted = isCompleted;

          return (
            <React.Fragment key={step.key}>
              <div className="flex flex-col items-center flex-1 relative px-2">
                {/* Step Circle */}
                <div
                  className={`w-14 h-14 rounded-full border-2 flex items-center justify-center transition-all duration-350 z-10 ${
                    isCompleted
                      ? 'bg-[#22C55E]/10 border-[#22C55E] text-[#22C55E] shadow-[0_0_15px_-2px_rgba(34,197,94,0.2)]'
                      : isFailed
                      ? 'bg-rose-50 border-rose-500 text-rose-600 shadow-[0_0_15px_-2px_rgba(239,68,68,0.2)]'
                      : isActive
                      ? 'bg-[#22C55E]/10 border-[#22C55E] text-[#22C55E] ring-4 ring-[#22C55E]/20 shadow-[0_0_15px_1px_rgba(34,197,94,0.25)] animate-pulse'
                      : 'bg-white border-[#E5E7EB] text-[#94A3B8]'
                  }`}
                >
                  {isCompleted ? (
                    <Check className="w-6 h-6" />
                  ) : isFailed ? (
                    <X className="w-6 h-6" />
                  ) : (
                    <StepIcon className="w-6 h-6" />
                  )}
                </div>

                {/* Labels */}
                <div className="mt-4 text-center px-2">
                  <p
                    className={`text-sm font-bold transition-colors duration-300 ${
                      isActive
                        ? 'text-[#22C55E]'
                        : isCompleted
                        ? 'text-[#22C55E]'
                        : isFailed
                        ? 'text-rose-600'
                        : 'text-[#4B5563]'
                    }`}
                  >
                    {index === steps.length - 1 ? (isSelected ? 'Selected' : isRejected ? 'Rejected' : 'Decision') : step.label}
                  </p>
                  <p className="text-[10px] text-[#94A3B8] mt-1.5 leading-tight max-w-[120px] mx-auto font-medium">
                    {step.desc}
                  </p>
                </div>
              </div>

              {/* Connecting line */}
              {showLine && (
                <div className="flex-1 h-0.5 bg-[#E5E7EB] -mt-20 mx-[-15px] relative">
                  <div
                    className={`absolute top-0 left-0 h-full bg-gradient-to-r from-[#22C55E] to-[#16A34A] transition-all duration-500 ${
                      lineCompleted ? 'w-full' : 'w-0'
                    }`}
                  />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Mobile Vertical View */}
      <div className="md:hidden flex flex-col space-y-8 relative pl-6 border-l-2 border-[#E5E7EB] ml-5 py-2">
        {steps.map((step, index) => {
          const StepIcon = step.icon;
          const stepStatus = getStepStatus(index);
          const isCompleted = stepStatus === 'Completed';
          const isActive = stepStatus === 'Active';
          const isFailed = stepStatus === 'Failed';

          return (
            <div key={step.key} className="relative flex items-start gap-5">
              {/* Timeline dot */}
              <div
                className={`absolute left-[-35px] w-6 h-6 rounded-full border-2 flex items-center justify-center z-10 transition-colors ${
                  isCompleted
                    ? 'bg-[#22C55E] border-[#22C55E] text-white'
                    : isFailed
                    ? 'bg-rose-500 border-rose-500 text-white'
                    : isActive
                    ? 'bg-[#22C55E] border-[#16A34A] text-white shadow-[0_0_8px_rgba(34,197,94,0.4)]'
                    : 'bg-white border-[#E5E7EB] text-[#94A3B8]'
                }`}
              >
                {isCompleted ? (
                  <Check className="w-3.5 h-3.5" />
                ) : isFailed ? (
                  <X className="w-3.5 h-3.5" />
                ) : (
                  <div className="w-2 h-2 rounded-full bg-current" />
                )}
              </div>

              {/* Detail list item */}
              <div className="flex-1 bg-[#F8FAFC] border border-[#E5E7EB] rounded-2xl p-5 shadow-sm">
                <div className="flex items-center gap-2.5">
                  <StepIcon
                    className={`w-4.5 h-4.5 ${
                      isActive
                        ? 'text-[#22C55E]'
                        : isCompleted
                        ? 'text-[#22C55E]'
                        : isFailed
                        ? 'text-rose-600'
                        : 'text-[#94A3B8]'
                    }`}
                  />
                  <h4
                    className={`text-sm font-bold ${
                      isActive
                        ? 'text-[#22C55E]'
                        : isCompleted
                        ? 'text-[#22C55E]'
                        : isFailed
                        ? 'text-rose-600'
                        : 'text-[#4B5563]'
                    }`}
                  >
                    {index === steps.length - 1 ? (isSelected ? 'Selected' : isRejected ? 'Rejected' : 'Decision') : step.label}
                  </h4>
                </div>
                <p className="text-xs text-[#4B5563] mt-1.5 leading-relaxed">{step.desc}</p>
                
                {isActive && (
                  <span className="inline-flex items-center gap-1 mt-3 text-[10px] bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/20 px-2.5 py-0.5 rounded-full font-bold">
                    Current Stage
                  </span>
                )}
                {isCompleted && index === steps.length - 1 && (
                  <span className="inline-flex items-center gap-1 mt-3 text-[10px] bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/20 px-2.5 py-0.5 rounded-full font-bold">
                    Offer Secured 🎉
                  </span>
                )}
                {isFailed && (
                  <span className="inline-flex items-center gap-1 mt-3 text-[10px] bg-rose-50 text-rose-600 border border-rose-200 px-2.5 py-0.5 rounded-full font-bold">
                    Eliminated here
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Stepper;
