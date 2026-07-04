import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  User,
  Mail,
  Lock,
  GraduationCap,
  Building2,
  ShieldCheck,
  Phone,
  Hash,
  Award,
  Briefcase,
  CheckCircle,
  Loader2,
  AlertCircle,
} from "lucide-react";
import api from "../utils/api";
import AuthLayout from "../components/AuthLayout";

export const Register = () => {
  const navigate = useNavigate();

  // Core Form Fields
  const [role, setRole] = useState("student");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Student Fields
  const [rollNumber, setRollNumber] = useState("");
  const [cgpa, setCgpa] = useState("");
  const [branch, setBranch] = useState("CSE");
  const [year, setYear] = useState("3");
  const [phone, setPhone] = useState("");

  // Recruiter Fields
  const [companyName, setCompanyName] = useState("");
  const [industry, setIndustry] = useState("");

  // Local API States
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [registerSuccess, setRegisterSuccess] = useState(false);
  const [registerMessage, setRegisterMessage] = useState("");

  // Reset errors when changing roles
  useEffect(() => {
    setError("");
    setRegisterSuccess(false);
  }, [role]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // General validation
    if (!name.trim() || !email.trim() || !password) {
      setError("Please fill out all basic fields");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    const payload = {
      name: name.trim(),
      email: email.trim(),
      password,
      role: role === "recruiter" ? "company" : role,
    };

    // Role-based validation
    if (role === "student") {
      if (!rollNumber.trim()) {
        setError("Roll Number is required");
        return;
      }
      if (cgpa === "" || isNaN(cgpa) || parseFloat(cgpa) < 0 || parseFloat(cgpa) > 10) {
        setError("Please enter a valid CGPA between 0 and 10");
        return;
      }
      payload.rollNumber = rollNumber.trim();
      payload.cgpa = parseFloat(cgpa);
      payload.branch = branch;
      payload.year = parseInt(year, 10);
      payload.phone = phone.trim();
    } else if (role === "recruiter") {
      if (!companyName.trim()) {
        setError("Company Name is required");
        return;
      }
      payload.companyName = companyName.trim();
      payload.industry = industry.trim();
    }

    setIsLoading(true);
    try {
      const response = await api.post("/auth/register", payload);
      setRegisterMessage(response.data.message || "Account registered successfully!");
      setRegisterSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // If successfully registered, show success screen
  if (registerSuccess) {
    return (
      <AuthLayout
        title="Registration Complete!"
        subtitle="Your account has been successfully created."
      >
        <div className="w-full max-w-md mx-auto text-center space-y-6 py-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mb-2">
            <CheckCircle className="w-10 h-10" />
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-bold text-white">Success!</h3>
            <p className="text-sm text-slate-400">
              {role === "recruiter"
                ? "Your recruiter account is pending admin approval. You will be able to log in once approved by the Placement Cell."
                : registerMessage}
            </p>
          </div>
          <button
            onClick={() => {
              setRegisterSuccess(false);
              navigate("/login");
            }}
            className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-lg text-sm hover:from-indigo-500 hover:to-purple-500 transition-all duration-200 cursor-pointer shadow-lg shadow-indigo-600/10"
          >
            Go to Login
          </button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Create Account"
      subtitle="Join Geeta University's placement community to connect, hire, or coordinate campus placements."
    >
      <div className="w-full max-w-xl mx-auto space-y-6 max-h-[85vh] overflow-y-auto pr-2">
        <div>
          <h3 className="text-2xl font-bold text-white tracking-tight">Register</h3>
          <p className="text-sm text-slate-400 mt-1">Select your account role to proceed</p>
        </div>

        {/* Role Selector Grid */}
        <div className="grid grid-cols-2 gap-4">
          {[
            { id: "student", label: "Student", icon: GraduationCap, color: "text-indigo-400 border-indigo-500/30 bg-indigo-500/5 hover:border-indigo-500/60" },
            { id: "recruiter", label: "Recruiter", icon: Building2, color: "text-purple-400 border-purple-500/30 bg-purple-500/5 hover:border-purple-500/60" },
          ].map((item) => {
            const Icon = item.icon;
            const isSelected = role === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setRole(item.id)}
                className={`flex flex-col items-center justify-center p-4 rounded-xl border text-center transition-all duration-200 cursor-pointer ${
                  isSelected
                    ? "border-indigo-500 bg-indigo-500/15 text-white ring-1 ring-indigo-500 shadow-md shadow-indigo-500/10"
                    : "border-white/10 bg-slate-950/20 text-slate-400 hover:text-slate-200"
                }`}
              >
                <Icon className={`w-5 h-5 mb-1.5 ${isSelected ? "text-indigo-400" : ""}`} />
                <span className="text-xs font-semibold">{item.label}</span>
              </button>
            );
          })}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Error Banner */}
          {(error) && (
            <div className="flex items-start space-x-3 bg-red-500/10 border border-red-500/20 text-red-200 text-sm p-4 rounded-lg animate-shake">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold">Validation Error</p>
                <p className="text-red-300/80 text-xs mt-0.5">{error}</p>
              </div>
            </div>
          )}

          {/* General Fields: Row 1 (Name & Email) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Full Name</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                  <User className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full bg-slate-950/40 border border-white/10 text-white rounded-lg pl-9 pr-4 py-2.5 text-sm placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition-all duration-300"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Email Address</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="john@geetauniversity.edu.in"
                  className="w-full bg-slate-950/40 border border-white/10 text-white rounded-lg pl-9 pr-4 py-2.5 text-sm placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition-all duration-300"
                  required
                />
              </div>
            </div>
          </div>

          {/* General Fields: Password */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Password</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                <Lock className="w-4 h-4" />
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 6 characters"
                className="w-full bg-slate-950/40 border border-white/10 text-white rounded-lg pl-9 pr-4 py-2.5 text-sm placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition-all duration-300"
                required
              />
            </div>
          </div>

          {/* Student Fields (Conditional) */}
          {role === "student" && (
            <div className="p-4 rounded-xl border border-white/5 bg-slate-950/20 space-y-4 animate-fade-in">
              <p className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                Student Academic Details
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Roll Number</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                      <Hash className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      value={rollNumber}
                      onChange={(e) => setRollNumber(e.target.value)}
                      placeholder="e.g. 210304001"
                      className="w-full bg-slate-950/40 border border-white/10 text-white rounded-lg pl-9 pr-4 py-2.5 text-sm placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition-all duration-300"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">CGPA</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                      <Award className="w-4 h-4" />
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      value={cgpa}
                      onChange={(e) => setCgpa(e.target.value)}
                      placeholder="e.g. 8.75"
                      className="w-full bg-slate-950/40 border border-white/10 text-white rounded-lg pl-9 pr-4 py-2.5 text-sm placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition-all duration-300"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Branch</label>
                  <select
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    className="w-full bg-slate-950/40 border border-white/10 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-500 transition-all duration-300"
                  >
                    <option value="CSE" className="bg-[#0B0F19]">CSE</option>
                    <option value="IT" className="bg-[#0B0F19]">IT</option>
                    <option value="ECE" className="bg-[#0B0F19]">ECE</option>
                    <option value="ME" className="bg-[#0B0F19]">ME</option>
                    <option value="CE" className="bg-[#0B0F19]">CE</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Current Year</label>
                  <select
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    className="w-full bg-slate-950/40 border border-white/10 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-500 transition-all duration-300"
                  >
                    <option value="1" className="bg-[#0B0F19]">1st Year</option>
                    <option value="2" className="bg-[#0B0F19]">2nd Year</option>
                    <option value="3" className="bg-[#0B0F19]">3rd Year</option>
                    <option value="4" className="bg-[#0B0F19]">4th Year</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Phone (Optional)</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                      <Phone className="w-4 h-4" />
                    </span>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g. 9876543210"
                      className="w-full bg-slate-950/40 border border-white/10 text-white rounded-lg pl-9 pr-4 py-2.5 text-sm placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition-all duration-300"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Recruiter Fields (Conditional) */}
          {role === "recruiter" && (
            <div className="p-4 rounded-xl border border-white/5 bg-slate-950/20 space-y-4 animate-fade-in">
              <p className="text-xs font-bold text-purple-400 uppercase tracking-wider">
                Recruiter & Company Info
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Company Name</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                      <Building2 className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="e.g. Google"
                      className="w-full bg-slate-950/40 border border-white/10 text-white rounded-lg pl-9 pr-4 py-2.5 text-sm placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition-all duration-300"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Industry Sector</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                      <Briefcase className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      value={industry}
                      onChange={(e) => setIndustry(e.target.value)}
                      placeholder="e.g. Software, Finance"
                      className="w-full bg-slate-950/40 border border-white/10 text-white rounded-lg pl-9 pr-4 py-2.5 text-sm placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition-all duration-300"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center space-x-2 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-lg text-sm hover:from-indigo-500 hover:to-purple-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 active:scale-[0.98] transition-all duration-200 cursor-pointer shadow-lg shadow-indigo-600/10 disabled:opacity-50 disabled:pointer-events-none mt-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Creating Account...</span>
              </>
            ) : (
              <span>Create Account</span>
            )}
          </button>
        </form>

        <div className="text-center pt-2">
          <p className="text-xs text-slate-500">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              Sign In here
            </Link>
          </p>
        </div>
      </div>
    </AuthLayout>
  );
};

export default Register;
