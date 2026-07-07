import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  User,
  Mail,
  Lock,
  FileSpreadsheet,
  Percent,
  Clipboard,
  AlertCircle,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { setUser } from "../redux/authSlice";
import api from "../utils/api";

const Signup = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);
  
  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    rollNumber: "",
    branch: "CSE",
    year: "4",
    cgpa: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const branches = [
    { code: "CSE", name: "Computer Science" },
    { code: "ECE", name: "Electronics & Communication" },
    { code: "EEE", name: "Electrical & Electronics" },
    { code: "IT", name: "Information Technology" },
    { code: "MECH", name: "Mechanical Engineering" },
    { code: "CIVIL", name: "Civil Engineering" },
  ];

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const { name, email, password, rollNumber, branch, year, cgpa } = formData;
    if (!name || !email || !password || !rollNumber || !cgpa) {
      setError("Please fill in all fields");
      return;
    }

    const parsedCgpa = parseFloat(cgpa);
    if (isNaN(parsedCgpa) || parsedCgpa < 0 || parsedCgpa > 10) {
      setError("CGPA must be a number between 0.0 and 10.0");
      return;
    }

    setIsLoading(true);
    try {
      await api.post("/api/auth/register", {
        name,
        email,
        password,
        rollNumber,
        branch,
        year: parseInt(year),
        cgpa: parsedCgpa,
        role: "student",
      });

      // Log in automatically
      const loginResponse = await api.post("/api/auth/login", { email, password });
      const loginRes = loginResponse.data;

      const { token } = loginRes.data;
      localStorage.setItem("token", token);

      const meResponse = await api.get("/api/auth/me");
      const meRes = meResponse.data;

      const combinedUser = {
        ...meRes.data.user,
        ...meRes.data.details,
        id: meRes.data.user._id || meRes.data.user.id,
      };

      localStorage.setItem("user", JSON.stringify(combinedUser));
      dispatch(setUser(combinedUser));
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Registration failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center py-16 px-6 sm:px-8 relative overflow-hidden">
      {/* Floating ambient shapes */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-emerald-400/5 blur-[100px] pointer-events-none animate-float-slow" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 rounded-full bg-teal-400/5 blur-[100px] pointer-events-none animate-float-medium" />

      <div className="max-w-2xl w-full space-y-8 bg-white border border-slate-200/80 p-10 sm:p-12 rounded-3xl shadow-xl shadow-slate-200/50 relative z-10 animate-slide-up">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">
            Create Student Account
          </h2>
          <p className="text-sm text-slate-500 font-semibold">
            Sign up to get matched with eligible drives on{" "}
            <span className="text-emerald-600 font-bold">PlacementConnect</span>
          </p>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 flex gap-3 text-rose-600 text-sm items-start">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <p className="font-semibold">{error}</p>
          </div>
        )}

        <form className="space-y-6" onSubmit={handleSubmit}>
          {/* Grid Layout - Expanded Gaps */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Full Name */}
            <div>
              <label
                htmlFor="name"
                className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2"
              >
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <User className="h-5 w-5" />
                </div>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="block w-full pl-11 pr-4 py-3 bg-slate-50/50 border border-slate-200 focus:bg-white rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all text-sm font-semibold"
                  placeholder="Rahul Sharma"
                />
              </div>
            </div>

            {/* Email Address */}
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2"
              >
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <Mail className="h-5 w-5" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="block w-full pl-11 pr-4 py-3 bg-slate-50/50 border border-slate-200 focus:bg-white rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all text-sm font-semibold"
                  placeholder="rahul@university.edu"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2"
              >
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="block w-full pl-11 pr-4 py-3 bg-slate-50/50 border border-slate-200 focus:bg-white rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all text-sm font-semibold"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {/* Roll Number */}
            <div>
              <label
                htmlFor="rollNumber"
                className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2"
              >
                Roll Number / ID
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <Clipboard className="h-5 w-5" />
                </div>
                <input
                  id="rollNumber"
                  name="rollNumber"
                  type="text"
                  required
                  value={formData.rollNumber}
                  onChange={handleChange}
                  className="block w-full pl-11 pr-4 py-3 bg-slate-50/50 border border-slate-200 focus:bg-white rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all text-sm font-semibold"
                  placeholder="2022CSE1042"
                />
              </div>
            </div>

            {/* Branch */}
            <div>
              <label
                htmlFor="branch"
                className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2"
              >
                Academic Branch
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <FileSpreadsheet className="h-5 w-5" />
                </div>
                <select
                  id="branch"
                  name="branch"
                  value={formData.branch}
                  onChange={handleChange}
                  className="block w-full pl-11 pr-4 py-3 bg-slate-50/50 border border-slate-200 focus:bg-white rounded-xl text-slate-850 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all text-sm font-semibold appearance-none"
                >
                  {branches.map((b) => (
                    <option
                      key={b.code}
                      value={b.code}
                      className="text-slate-800"
                    >
                      {b.code} - {b.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Year of Study */}
            <div>
              <label
                htmlFor="year"
                className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2"
              >
                Current Year
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <User className="h-5 w-5" />
                </div>
                <select
                  id="year"
                  name="year"
                  value={formData.year}
                  onChange={handleChange}
                  className="block w-full pl-11 pr-4 py-3 bg-slate-50/50 border border-slate-200 focus:bg-white rounded-xl text-slate-850 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all text-sm font-semibold appearance-none"
                >
                  <option value="1">1st Year</option>
                  <option value="2">2nd Year</option>
                  <option value="3">3rd Year</option>
                  <option value="4">4th Year (Final)</option>
                </select>
              </div>
            </div>

            {/* CGPA */}
            <div className="md:col-span-2">
              <label
                htmlFor="cgpa"
                className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2"
              >
                Current CGPA (Out of 10.0)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <Percent className="h-5 w-5" />
                </div>
                <input
                  id="cgpa"
                  name="cgpa"
                  type="number"
                  step="0.01"
                  min="0"
                  max="10"
                  required
                  value={formData.cgpa}
                  onChange={handleChange}
                  className="block w-full pl-11 pr-4 py-3 bg-slate-50/50 border border-slate-200 focus:bg-white rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all text-sm font-semibold"
                  placeholder="8.50"
                />
              </div>
            </div>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-3.5 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-emerald-600 hover:bg-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-md shadow-emerald-650/15 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]"
            >
              {isLoading ? (
                <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                "Create Account"
              )}
            </button>
          </div>
        </form>

        <div className="text-center">
          <p className="text-sm text-slate-500 font-semibold">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-emerald-600 hover:text-emerald-500 font-bold transition-colors"
            >
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
