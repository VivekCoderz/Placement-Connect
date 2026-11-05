import React from 'react';

/** Skeleton shown while a lazily loaded page chunk is downloading. */
const PageLoader = ({ label = 'Loading page…' }) => (
  <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6" role="status" aria-live="polite">
    <span className="sr-only">{label}</span>
    <div className="flex items-center gap-4">
      <div className="pc-skeleton h-12 w-12 rounded-xl" />
      <div className="flex-1 space-y-2">
        <div className="pc-skeleton h-4 w-1/3" />
        <div className="pc-skeleton h-3 w-1/2" />
      </div>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="pc-card p-5 space-y-3">
          <div className="pc-skeleton h-3 w-1/2" />
          <div className="pc-skeleton h-6 w-2/3" />
        </div>
      ))}
    </div>
    <div className="pc-card p-5 space-y-3">
      {[0, 1, 2, 3, 4].map((i) => (
        <div key={i} className="pc-skeleton h-4 w-full" />
      ))}
    </div>
  </div>
);

export default PageLoader;
