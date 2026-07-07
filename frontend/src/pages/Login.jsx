import React, { useState } from "react";
import {
  GraduationCap,
  Mail,
  Lock,
  ArrowRight,
  UserRound,
  Building2,
  ShieldCheck,
  BriefcaseBusiness,
} from "lucide-react";
import { motion } from "framer-motion";

const roles = [
  { id: "student", label: "Student", icon: UserRound },
  { id: "recruiter", label: "Recruiter", icon: Building2 },
  { id: "placement", label: "Placement Cell", icon: BriefcaseBusiness },
  { id: "admin", label: "Admin", icon: ShieldCheck },
];

const Login = () => {
  const [role, setRole] = useState("student");

  return (
    <div className="min-h-screen bg-[#F8FAFC] relative overflow-hidden flex items-center justify-center px-4 py-10">
      <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-indigo-200/40 blur-3xl" />
      <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-violet-200/40 blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="relative w-full max-w-[460px]"
      >
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 h-14 w-14 rounded-2xl bg-gradient-to-br from-[#4F46E5] to-[#7C3AED] flex items-center justify-center shadow-lg shadow-indigo-200">
            <GraduationCap className="text-white" size={30} />
          </div>

          <h1 className="text-3xl font-bold text-[#0F172A]">
            PlacementConnect
          </h1>
          <p className="mt-2 text-[#64748B]">
            Sign in to manage your placement journey
          </p>
        </div>

        <div className="bg-white rounded-[28px] border border-[#E2E8F0] shadow-[0_24px_80px_rgba(15,23,42,0.08)] p-6 sm:p-8">
          <div className="mb-6">
            <p className="text-sm font-semibold text-[#334155] mb-3">
              Continue as
            </p>

            <div className="grid grid-cols-2 gap-3">
              {roles.map((item) => {
                const Icon = item.icon;
                const active = role === item.id;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setRole(item.id)}
                    className={`flex items-center gap-2 rounded-[16px] border px-3 py-3 text-sm font-semibold transition-all ${
                      active
                        ? "border-[#4F46E5] bg-indigo-50 text-[#4F46E5] shadow-sm"
                        : "border-[#E2E8F0] text-[#64748B] hover:border-[#4F46E5] hover:bg-[#F8FAFC]"
                    }`}
                  >
                    <Icon size={18} />
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>

          <form className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-[#334155] mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail
                  size={20}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8]"
                />
                <input
                  type="email"
                  placeholder="name@geetauniversity.edu.in"
                  className="w-full rounded-[16px] border border-[#E2E8F0] bg-[#F8FAFC] py-3.5 pl-12 pr-4 text-[#0F172A] outline-none transition focus:border-[#4F46E5] focus:bg-white focus:ring-4 focus:ring-indigo-100"
                />
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="block text-sm font-semibold text-[#334155]">
                  Password
                </label>
                <button
                  type="button"
                  className="text-sm font-semibold text-[#4F46E5] hover:text-[#4338CA]"
                >
                  Forgot?
                </button>
              </div>

              <div className="relative">
                <Lock
                  size={20}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8]"
                />
                <input
                  type="password"
                  placeholder="Enter your password"
                  className="w-full rounded-[16px] border border-[#E2E8F0] bg-[#F8FAFC] py-3.5 pl-12 pr-4 text-[#0F172A] outline-none transition focus:border-[#4F46E5] focus:bg-white focus:ring-4 focus:ring-indigo-100"
                />
              </div>
            </div>

            <button
              type="submit"
              className="group flex w-full items-center justify-center gap-2 rounded-[16px] bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] py-3.5 font-semibold text-white shadow-lg shadow-indigo-200 transition-all hover:-translate-y-0.5 hover:shadow-xl"
            >
              Sign In
              <ArrowRight
                size={18}
                className="transition group-hover:translate-x-1"
              />
            </button>
          </form>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-[#E2E8F0]" />
            <span className="text-xs font-medium text-[#94A3B8]">
              NEW TO PLACEMENTCONNECT?
            </span>
            <div className="h-px flex-1 bg-[#E2E8F0]" />
          </div>

          <button className="w-full rounded-[16px] border border-[#E2E8F0] bg-white py-3.5 font-semibold text-[#334155] transition hover:border-[#4F46E5] hover:text-[#4F46E5]">
            Create Student / Recruiter Account
          </button>
        </div>

        <p className="mt-6 text-center text-sm text-[#94A3B8]">
          © 2026 Geeta University Training & Placement Cell
        </p>
      </motion.div>
    </div>
  );
};

export default Login;