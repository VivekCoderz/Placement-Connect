import React from "react";
import {
  Users,
  Building2,
  Briefcase,
  IndianRupee,
  TrendingUp,
} from "lucide-react";

const PlacementStats = () => {
  return (
    <div className="mt-8 space-y-8">

      {/* Heading */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">
            Placement Statistics
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Live placement insights of Geeta University
          </p>
        </div>

        <div className="hidden md:flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-xl">
          <TrendingUp className="w-5 h-5" />
          <span className="text-sm font-semibold">
            Placement Growth +12%
          </span>
        </div>
      </div>

      {/* Statistics Cards */}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-300 p-6">
          <div className="w-14 h-14 rounded-xl bg-blue-100 flex items-center justify-center">
            <Users className="w-7 h-7 text-blue-600" />
          </div>

          <p className="text-sm text-slate-500 mt-5">
            Placed Students
          </p>

          <h2 className="text-4xl font-bold text-slate-800 mt-2">
            120
          </h2>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-300 p-6">
          <div className="w-14 h-14 rounded-xl bg-green-100 flex items-center justify-center">
            <Building2 className="w-7 h-7 text-green-600" />
          </div>

          <p className="text-sm text-slate-500 mt-5">
            Companies Visited
          </p>

          <h2 className="text-4xl font-bold text-slate-800 mt-2">
            38
          </h2>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-300 p-6">
          <div className="w-14 h-14 rounded-xl bg-purple-100 flex items-center justify-center">
            <IndianRupee className="w-7 h-7 text-purple-600" />
          </div>

          <p className="text-sm text-slate-500 mt-5">
            Highest Package
          </p>

          <h2 className="text-4xl font-bold text-slate-800 mt-2">
            24 LPA
          </h2>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-300 p-6">
          <div className="w-14 h-14 rounded-xl bg-orange-100 flex items-center justify-center">
            <Briefcase className="w-7 h-7 text-orange-600" />
          </div>

          <p className="text-sm text-slate-500 mt-5">
            Average Package
          </p>

          <h2 className="text-4xl font-bold text-slate-800 mt-2">
            7.5 LPA
          </h2>
        </div>

      </div>

      {/* Branch Wise Placement */}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">

        <h3 className="text-xl font-bold text-slate-800 mb-6">
          Branch Wise Placements
        </h3>

        <div className="space-y-6">

          {[
            {
              branch: "Computer Science Engineering",
              percentage: "90%",
              width: "90%",
              color: "bg-blue-600",
            },
            {
              branch: "Artificial Intelligence & ML",
              percentage: "85%",
              width: "85%",
              color: "bg-green-600",
            },
            {
              branch: "Electronics & Communication",
              percentage: "70%",
              width: "70%",
              color: "bg-orange-500",
            },
            {
              branch: "Mechanical Engineering",
              percentage: "60%",
              width: "60%",
              color: "bg-red-500",
            },
          ].map((item, index) => (
            <div key={index}>

              <div className="flex justify-between mb-2 text-sm font-medium">
                <span>{item.branch}</span>
                <span>{item.percentage}</span>
              </div>

              <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">

                <div
                  className={`${item.color} h-3 rounded-full transition-all duration-700`}
                  style={{ width: item.width }}
                />

              </div>

            </div>
          ))}

        </div>

      </div>

    </div>
  );
};

export default PlacementStats;