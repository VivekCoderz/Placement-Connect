import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Building2, Mail, Lock, User, Globe, Phone, MapPin, Briefcase, AlertCircle, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { setUser } from '../redux/authSlice';
import api from '../utils/api';

const RecruiterSignup = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const authenticatedUser = useSelector((state) => state.auth.user);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    companyName: '',
    industry: '',
    website: '',
    phone: '',
    address: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (authenticatedUser) {
      if (authenticatedUser.role === 'company') {
        navigate('/recruiter/dashboard');
      } else {
        navigate('/');
      }
    }
  }, [authenticatedUser, navigate]);

  useEffect(() => {
    if (isSuccess) {
      const timer = setTimeout(() => {
        navigate('/recruiter/dashboard');
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [isSuccess, navigate]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const { name, email, password, companyName, industry, website, phone, address } = formData;
    if (!name || !email || !password || !companyName || !phone) {
      setError('Please fill in all required fields (Name, Corporate Email, Password, Company Name, Contact Phone)');
      return;
    }

    setIsLoading(true);
    try {
      await api.post('/api/auth/register', {
        name,
        email,
        password,
        role: 'company',
        companyName,
        industry,
        website,
        hrContactName: name,
        hrContactPhone: phone,
        address
      });

      // Automatically log in since account is auto-approved by placement cell
      try {
        const loginResponse = await api.post('/api/auth/login', { email, password });
        const loginRes = loginResponse.data;
        const { token } = loginRes.data;
        localStorage.setItem('token', token);

        const meResponse = await api.get('/api/auth/me');
        const meRes = meResponse.data;

        const combinedUser = {
          ...meRes.data.user,
          ...meRes.data.details,
          id: meRes.data.user._id || meRes.data.user.id,
        };

        localStorage.setItem('user', JSON.stringify(combinedUser));
        dispatch(setUser(combinedUser));
      } catch (loginErr) {
        console.error('Auto-login error after registration:', loginErr);
      }

      setIsSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Company registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center py-20 px-4 sm:px-6 relative overflow-hidden font-sans text-[#4B5563]">
      {/* Floating ambient shapes - matches Student signup page */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-[#22C55E]/10 blur-[100px] pointer-events-none z-0 animate-float-slow" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 rounded-full bg-[#7C3AED]/8 blur-[100px] pointer-events-none z-0 animate-float-medium" />

      {/* Main Glassmorphic Panel */}
      <div className="max-w-2xl w-full space-y-8 bg-white border border-[#E5E7EB] p-8 sm:p-12 rounded-2xl shadow-xl relative z-10 animate-slide-up">
        
        {isSuccess ? (
          <div className="text-center space-y-6 py-6 font-sans">
            <div className="mx-auto h-16 w-16 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-600 shadow-sm animate-bounce">
              <CheckCircle2 className="h-9 w-9" />
            </div>
            <div className="space-y-3">
              <h2 className="text-2xl font-bold text-[#111827] tracking-tight">
                Account Approved & Verified!
              </h2>
              <p className="text-sm font-semibold text-[#4B5563] max-w-md mx-auto leading-relaxed">
                Welcome to PlacementConnect! Your recruiter profile for <strong className="text-[#111827]">{formData.companyName}</strong> has been auto-approved by the Placement Cell.
              </p>
            </div>
            <div className="bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl p-5 text-left text-xs font-semibold text-[#4B5563] space-y-2.5 max-w-md mx-auto">
              <p className="text-[#111827] font-bold uppercase tracking-wider text-[10px] mb-1">Approval Summary</p>
              <div className="flex items-center gap-2 text-emerald-700">
                <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-emerald-600" />
                <span>Placement Cell approval: <strong>Granted (Active)</strong></span>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-emerald-600" />
                <span>Job posting & candidate evaluation privileges: <strong>Unlocked</strong></span>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-emerald-600" />
                <span>Signed in as: <strong className="text-[#111827]">{formData.email}</strong></span>
              </div>
            </div>
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                to="/recruiter/dashboard"
                className="inline-flex items-center gap-2 justify-center w-full sm:w-auto px-8 py-3 border border-transparent text-sm font-bold rounded-xl text-white bg-[#22C55E] hover:bg-[#16A34A] shadow-md transition-all active:scale-[0.98]"
              >
                Go to Recruiter Dashboard <ArrowRight className="w-4 h-4 text-white" />
              </Link>
            </div>
            <p className="text-xs text-slate-400 font-medium">Redirecting to recruiter dashboard in a moment...</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="text-center space-y-2">
              <div className="mx-auto h-12 w-12 rounded-xl bg-[#22C55E] flex items-center justify-center shadow-md">
                <Building2 className="h-6 w-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-[#111827] tracking-tight mt-2">
                Register Company Recruiter
              </h2>
              <p className="text-sm text-[#4B5563] max-w-sm mx-auto">
                Set up your placement profile on{' '}
                <span className="text-[#22C55E] font-bold">PlacementConnect</span>
              </p>
            </div>

            {error && (
              <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl flex gap-3 text-rose-600 text-sm items-start">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-rose-600" />
                <p className="font-semibold text-rose-600">{error}</p>
              </div>
            )}

            <form className="space-y-6" onSubmit={handleSubmit}>
              {/* Section 1: Recruiter Profile */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-[#E5E7EB] pb-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#7C3AED]" />
                  <h3 className="text-xs font-bold text-[#7C3AED] uppercase tracking-widest">Recruiter Details</h3>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {/* Full Name */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider">Recruiter Name *</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#94A3B8]">
                        <User className="h-4.5 w-4.5" />
                      </div>
                      <input
                        name="name"
                        type="text"
                        required
                        value={formData.name}
                        onChange={handleChange}
                        className="pl-11 block w-full py-3 px-4 bg-[#F8FAFC] border border-[#E5E7EB] focus:bg-white rounded-xl text-[#111827] placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-[#7C3AED]/10 focus:border-[#7C3AED] transition-all text-sm font-medium"
                        placeholder="e.g. John Doe"
                      />
                    </div>
                  </div>

                  {/* Corporate Email */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider">Corporate Email *</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#94A3B8]">
                        <Mail className="h-4.5 w-4.5" />
                      </div>
                      <input
                        name="email"
                        type="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        className="pl-11 block w-full py-3 px-4 bg-[#F8FAFC] border border-[#E5E7EB] focus:bg-white rounded-xl text-[#111827] placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-[#7C3AED]/10 focus:border-[#7C3AED] transition-all text-sm font-medium"
                        placeholder="e.g. hr@company.com"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {/* Password */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider">Password *</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#94A3B8]">
                        <Lock className="h-4.5 w-4.5" />
                      </div>
                      <input
                        name="password"
                        type="password"
                        required
                        value={formData.password}
                        onChange={handleChange}
                        className="pl-11 block w-full py-3 px-4 bg-[#F8FAFC] border border-[#E5E7EB] focus:bg-white rounded-xl text-[#111827] placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-[#7C3AED]/10 focus:border-[#7C3AED] transition-all text-sm font-medium"
                        placeholder="Minimum 6 characters"
                      />
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider">Contact Phone *</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#94A3B8]">
                        <Phone className="h-4.5 w-4.5" />
                      </div>
                      <input
                        name="phone"
                        type="text"
                        required
                        value={formData.phone}
                        onChange={handleChange}
                        className="pl-11 block w-full py-3 px-4 bg-[#F8FAFC] border border-[#E5E7EB] focus:bg-white rounded-xl text-[#111827] placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-[#7C3AED]/10 focus:border-[#7C3AED] transition-all text-sm font-medium"
                        placeholder="HR Direct Phone"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 2: Company Details */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center gap-2 border-b border-[#E5E7EB] pb-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#7C3AED]" />
                  <h3 className="text-xs font-bold text-[#7C3AED] uppercase tracking-widest">Company Profile</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {/* Company Name */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider">Company Name *</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#94A3B8]">
                        <Building2 className="h-4.5 w-4.5" />
                      </div>
                      <input
                        name="companyName"
                        type="text"
                        required
                        value={formData.companyName}
                        onChange={handleChange}
                        className="pl-11 block w-full py-3 px-4 bg-[#F8FAFC] border border-[#E5E7EB] focus:bg-white rounded-xl text-[#111827] placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-[#7C3AED]/10 focus:border-[#7C3AED] transition-all text-sm font-medium"
                        placeholder="e.g. Microsoft India"
                      />
                    </div>
                  </div>

                  {/* Website */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider">Company Website</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#94A3B8]">
                        <Globe className="h-4.5 w-4.5" />
                      </div>
                      <input
                        name="website"
                        type="url"
                        value={formData.website}
                        onChange={handleChange}
                        className="pl-11 block w-full py-3 px-4 bg-[#F8FAFC] border border-[#E5E7EB] focus:bg-white rounded-xl text-[#111827] placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-[#7C3AED]/10 focus:border-[#7C3AED] transition-all text-sm font-medium"
                        placeholder="e.g. https://microsoft.com"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {/* Industry */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider">Industry</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#94A3B8]">
                        <Briefcase className="h-4.5 w-4.5" />
                      </div>
                      <input
                        name="industry"
                        type="text"
                        value={formData.industry}
                        onChange={handleChange}
                        className="pl-11 block w-full py-3 px-4 bg-[#F8FAFC] border border-[#E5E7EB] focus:bg-white rounded-xl text-[#111827] placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-[#7C3AED]/10 focus:border-[#7C3AED] transition-all text-sm font-medium"
                        placeholder="e.g. Tech, consulting"
                      />
                    </div>
                  </div>

                  {/* Address */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider">Company Location /HQ</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#94A3B8]">
                        <MapPin className="h-4.5 w-4.5" />
                      </div>
                      <input
                        name="address"
                        type="text"
                        value={formData.address}
                        onChange={handleChange}
                        className="pl-11 block w-full py-3 px-4 bg-[#F8FAFC] border border-[#E5E7EB] focus:bg-white rounded-xl text-[#111827] placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-[#7C3AED]/10 focus:border-[#7C3AED] transition-all text-sm font-medium"
                        placeholder="e.g. Bangalore, India"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-[#22C55E] hover:bg-[#16A34A] focus:outline-none focus:ring-4 focus:ring-[#22C55E]/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md active:scale-[0.98]"
                >
                  {isLoading ? (
                    <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span className="flex items-center gap-1.5">
                      Register Company <ArrowRight className="w-4 h-4 text-white" />
                    </span>
                  )}
                </button>
              </div>
            </form>

            <div className="text-center mt-6">
              <p className="text-sm text-[#4B5563] font-medium">
                Already registered?{' '}
                <Link to="/login" className="text-[#22C55E] hover:text-[#16A34A] font-semibold transition-colors">
                  Sign In here
                </Link>
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default RecruiterSignup;
