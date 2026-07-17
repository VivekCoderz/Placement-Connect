import React from 'react';
import { Check, X, ClipboardCheck, Code, Users, UserCheck, CheckCircle2 } from 'lucide-react';

const Stepper = ({ currentStatus, rounds, appRounds }) => {
  let steps = [
    { label: 'Applied', key: 'Applied', desc: 'Application Received', icon: ClipboardCheck },
    { label: 'Aptitude', key: 'Aptitude', desc: 'Aptitude & Technical MCQ', icon: Code },
    { label: 'GD Round', key: 'GD', desc: 'Group Discussion', icon: Users },
    { label: 'HR Round', key: 'HR', desc: 'Personal & HR Assessment', icon: UserCheck },
    { label: 'Decision', key: 'Decision', desc: 'Final Selection Status', icon: CheckCircle2 }
  ];

  let currentIndex = 0;

  if (rounds && Array.isArray(rounds) && rounds.length > 0) {
    steps = [
      { label: 'Applied', key: 'Applied', desc: 'Application Received', icon: ClipboardCheck },
      ...rounds.map((r, idx) => {
        let icon = Code;
        const nameLower = r.name.toLowerCase();
        if (nameLower.includes('gd') || nameLower.includes('group') || nameLower.includes('discussion')) {
          icon = Users;
        } else if (nameLower.includes('hr') || nameLower.includes('personal') || nameLower.includes('interview')) {
          icon = UserCheck;
        }
        return {
          label: r.name,
          key: `round-${idx}`,
          desc: r.description || `Round ${idx + 1} Evaluation`,
          icon
        };
      }),
      { label: 'Decision', key: 'Decision', desc: 'Final Selection Status', icon: CheckCircle2 }
    ];

    if (currentStatus === 'Applied') {
      currentIndex = 0;
    } else if (currentStatus === 'Selected' || currentStatus === 'Rejected') {
      currentIndex = steps.length - 1;
    } else if (currentStatus === 'Shortlisted') {
      currentIndex = 1; // Default to first round
      if (appRounds && Array.isArray(appRounds) && appRounds.length > 0) {
        const latestRound = appRounds[appRounds.length - 1];
        if (latestRound && latestRound.name) {
          const matchIdx = rounds.findIndex(r => r.name.toLowerCase() === latestRound.name.toLowerCase());
          if (matchIdx > -1) {
            currentIndex = matchIdx + 1;
          }
        }
      }
    }
  } else {
    const statusIndices = {
      'Applied': 0,
      'Aptitude': 1,
      'GD': 2,
      'HR': 3,
      'Selected': 4,
      'Rejected': 4
    };
    currentIndex = statusIndices[currentStatus] ?? 0;
  }

  const isRejected = currentStatus === 'Rejected';
  const isSelected = currentStatus === 'Selected';

  return (
    <div className="w-full py-8"> {/* Increased padding for spacing */}
      {/* Desktop Horizontal View */}
      <div className="hidden md:flex items-center w-full">
        {steps.map((step, index) => {
          const StepIcon = step.icon;
          
          let isCompleted = index < currentIndex || (index === steps.length - 1 && isSelected);
          let isActive = index === currentIndex && !isCompleted;
          let isFailed = index === steps.length - 1 && isRejected;

          const showLine = index < steps.length - 1;
          const lineCompleted = index < currentIndex;

          return (
            <React.Fragment key={step.key}>
              <div className="flex flex-col items-center flex-1 relative px-2">
                {/* Step Circle */}
                <div
                  className={`w-14 h-14 rounded-full border-2 flex items-center justify-center transition-all duration-300 z-10 ${
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

                {/* Labels - increased top margin and spacing */}
                <div className="mt-4 text-center px-2">
                  <p
                    className={`text-sm font-bold transition-colors duration-300 ${
                      isActive
                        ? 'text-[#22C55E]'
                        : isCompleted
                        ? 'text-[#22C55E]'
                        : isFailed
                        ? 'text-rose-650'
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
          let isCompleted = index < currentIndex || (index === steps.length - 1 && isSelected);
          let isActive = index === currentIndex && !isCompleted;
          let isFailed = index === steps.length - 1 && isRejected;

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

              {/* Detail list item - increased padding for cards */}
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
                    Rejected
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
