import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  User, Mail, Plus, Trash2, ExternalLink, Upload, Eye, FileText,
  Briefcase, GraduationCap, Award, PlusCircle, Check, ArrowRight, Lock,
  Camera, Phone, Globe, Link2, Code2, KeyRound, RefreshCw, AlertCircle, CheckCircle2, Calendar,
} from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { setUser } from '../redux/authSlice';
import { playSuccessFanfare, playFailureBuzz } from '../utils/audio';
import api, { getErrorMessage } from '../utils/api';
import { normalizeCerts, toCertPayload, safeUrl, certKey } from '../utils/certifications';
import { passwordProblem, PASSWORD_HINT } from '../utils/password';
import AuthLoadingOverlay from '../components/AuthLoadingOverlay';

const MB = 1024 * 1024;
const RESUME_MAX_BYTES = 5 * MB;
const PHOTO_MAX_BYTES = 2 * MB;
const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const PHONE_PATTERN = /^\+?[0-9\s-]{7,20}$/;

const inputClass =
  'block w-full px-4 py-2.5 bg-[#F8FAFC] border border-[#E5E7EB] focus:bg-white rounded-xl text-[#111827] placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-[#0B3D91]/10 focus:border-[#0B3D91] transition-all text-xs font-semibold';
const labelClass = 'block text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider mb-2';
const cardClass = 'bg-white border border-[#E5E7EB] p-5 sm:p-8 rounded-2xl space-y-6 shadow-sm';
const cardTitleClass = 'text-base font-bold text-[#111827] flex items-center gap-2.5 pb-4 border-b border-[#E5E7EB]';

const combineMe = (me) => ({ ...me.user, ...me.details, id: me.user._id || me.user.id });

const initialsOf = (name) =>
  (name || '?')
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '';

// Projects from the database carry `_id`; ones added in this session carry `id`.
const projectKey = (project, index) => project._id || project.id || `${project.title}-${index}`;

const LINK_FIELDS = [
  { key: 'linkedinUrl', label: 'LinkedIn', icon: Link2, placeholder: 'https://linkedin.com/in/your-name' },
  { key: 'githubUrl', label: 'GitHub', icon: Code2, placeholder: 'https://github.com/your-username' },
  { key: 'portfolioUrl', label: 'Portfolio / Website', icon: Globe, placeholder: 'https://your-site.dev' },
];

const Profile = () => {
  const cachedUser = useSelector((state) => state.auth.user);
  const dispatch = useDispatch();

  const [activeTab, setActiveTab] = useState('edit'); // edit | preview
  const [profile, setProfile] = useState(cachedUser);
  const [isLoadingProfile, setIsLoadingProfile] = useState(!cachedUser);
  const [flash, setFlash] = useState(null); // { type: 'success' | 'error', text }

  const [details, setDetails] = useState({
    name: '', phone: '', headline: '', about: '', linkedinUrl: '', githubUrl: '', portfolioUrl: '',
  });
  const [skills, setSkills] = useState([]);
  const [certifications, setCertifications] = useState([]);
  const [projects, setProjects] = useState([]);

  const [skillInput, setSkillInput] = useState('');
  const [certInput, setCertInput] = useState({ name: '', issuer: '', date: '', url: '' });
  const [certError, setCertError] = useState('');
  const [newProject, setNewProject] = useState({ title: '', description: '', techStack: '', link: '' });
  const [showProjectForm, setShowProjectForm] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingResume, setIsUploadingResume] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  const [passwordForm, setPasswordForm] = useState({ current: '', next: '', confirm: '' });
  const [passwordMsg, setPasswordMsg] = useState(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const resumeInputRef = useRef(null);
  const photoInputRef = useRef(null);
  const flashTimer = useRef(null);

  const showFlash = useCallback((type, text) => {
    setFlash({ type, text });
    clearTimeout(flashTimer.current);
    flashTimer.current = setTimeout(() => setFlash(null), 5000);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  useEffect(() => () => clearTimeout(flashTimer.current), []);

  // Copy a server profile into the editable form state.
  const hydrate = useCallback((u) => {
    if (!u) return;
    setProfile(u);
    setDetails({
      name: u.name || '',
      phone: u.phone || '',
      headline: u.headline || '',
      about: u.about || '',
      linkedinUrl: u.linkedinUrl || '',
      githubUrl: u.githubUrl || '',
      portfolioUrl: u.portfolioUrl || '',
    });
    setSkills(Array.isArray(u.skills) ? u.skills : []);
    setCertifications(normalizeCerts(u.certifications));
    setProjects(Array.isArray(u.projects) ? u.projects : []);
  }, []);

  // Always load the latest profile from the server (the cached copy can be stale,
  // e.g. right after a refresh), and keep Redux/localStorage in sync.
  const refreshProfile = useCallback(async ({ resetForm = true } = {}) => {
    const response = await api.get('/api/auth/me');
    const fresh = combineMe(response.data.data);
    localStorage.setItem('user', JSON.stringify(fresh));
    dispatch(setUser(fresh));
    if (resetForm) hydrate(fresh);
    else setProfile(fresh);
    return fresh;
  }, [dispatch, hydrate]);

  useEffect(() => {
    hydrate(cachedUser);
    refreshProfile()
      .catch((err) => showFlash('error', getErrorMessage(err, 'Could not load your profile')))
      .finally(() => setIsLoadingProfile(false));
    // Load once on open; later updates come from the handlers below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDetailChange = (e) => setDetails({ ...details, [e.target.name]: e.target.value });

  // ---------- Skills ----------
  const handleAddSkill = (e) => {
    e.preventDefault();
    const skill = skillInput.trim();
    if (skill && !skills.some((s) => s.toLowerCase() === skill.toLowerCase())) {
      setSkills([...skills, skill]);
    }
    setSkillInput('');
  };

  const handleRemoveSkill = (skillToRemove) => setSkills(skills.filter((s) => s !== skillToRemove));

  // ---------- Certifications ----------
  const handleAddCert = (e) => {
    e.preventDefault();
    setCertError('');
    const name = certInput.name.trim();
    const issuer = certInput.issuer.trim();
    const url = certInput.url.trim();
    if (!name) {
      setCertError('Enter the certification name.');
      return;
    }
    if (url && !safeUrl(url)) {
      setCertError('Certificate link must start with http:// or https://');
      return;
    }
    const isDuplicate = certifications.some(
      (c) => c.name.toLowerCase() === name.toLowerCase() && c.issuer.toLowerCase() === issuer.toLowerCase()
    );
    if (isDuplicate) {
      setCertError('This certification is already listed.');
      return;
    }
    setCertifications([...certifications, { name, issuer, date: certInput.date, url }]);
    setCertInput({ name: '', issuer: '', date: '', url: '' });
  };

  const handleRemoveCert = (index) => setCertifications(certifications.filter((_, i) => i !== index));

  // ---------- Projects ----------
  const handleAddProject = (e) => {
    e.preventDefault();
    const { title, description, techStack, link } = newProject;
    if (!title.trim() || !description.trim()) return;
    if (link.trim() && !safeUrl(link.trim())) {
      showFlash('error', 'Project link must start with http:// or https://');
      return;
    }
    const projectObj = {
      id: `proj-${Date.now()}`,
      title: title.trim(),
      description: description.trim(),
      techStack: techStack.split(',').map((t) => t.trim()).filter(Boolean),
      link: link.trim(),
    };
    setProjects([...projects, projectObj]);
    setNewProject({ title: '', description: '', techStack: '', link: '' });
    setShowProjectForm(false);
  };

  const handleRemoveProject = (key) => setProjects(projects.filter((p, i) => projectKey(p, i) !== key));

  // ---------- Save ----------
  const validateDetails = () => {
    if (details.name.trim().length < 3) return 'Name must be at least 3 characters.';
    if (details.phone.trim() && !PHONE_PATTERN.test(details.phone.trim())) return 'Enter a valid phone number.';
    for (const { key, label } of LINK_FIELDS) {
      const value = details[key].trim();
      if (value && !safeUrl(value)) return `${label} link must start with http:// or https://`;
    }
    return '';
  };

  const handleSaveProfile = async () => {
    const problem = validateDetails();
    if (problem) {
      showFlash('error', problem);
      return;
    }

    setIsSaving(true);
    try {
      if (details.name.trim() !== (profile?.name || '')) {
        await api.put('/api/students/updateEmailName', { name: details.name.trim() });
      }

      // Academic fields (CGPA, branch, year, roll number) are verified by the
      // Placement Cell and can only be changed by TPO/admin, so they are not sent.
      await api.put('/api/students/profile', {
        phone: details.phone.trim(),
        headline: details.headline.trim(),
        about: details.about.trim(),
        linkedinUrl: details.linkedinUrl.trim(),
        githubUrl: details.githubUrl.trim(),
        portfolioUrl: details.portfolioUrl.trim(),
        skills,
        projects: projects.map(({ title, description, techStack, link }) => ({
          title,
          description,
          techStack: Array.isArray(techStack) ? techStack : [],
          link: link || '',
        })),
        certifications: certifications.map(toCertPayload).filter(Boolean),
      });

      await refreshProfile();
      showFlash('success', 'Profile saved. Your eligible placement drives are up to date.');
    } catch (err) {
      showFlash('error', getErrorMessage(err, 'Profile update failed'));
    } finally {
      setIsSaving(false);
    }
  };

  // ---------- Resume ----------
  const handleResumeFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow choosing the same file again
    if (!file) return;

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      showFlash('error', 'Please upload your resume as a PDF file.');
      return;
    }
    if (file.size > RESUME_MAX_BYTES) {
      showFlash('error', 'Resume must be 5 MB or smaller.');
      return;
    }

    setIsUploadingResume(true);
    try {
      const formData = new FormData();
      formData.append('resume', file);
      await api.put('/api/students/resume', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      await refreshProfile({ resetForm: false });
      try { playSuccessFanfare(); } catch { /* sound is optional */ }
      showFlash('success', 'Resume uploaded.');
    } catch (err) {
      try { playFailureBuzz(); } catch { /* sound is optional */ }
      showFlash('error', getErrorMessage(err, 'Resume upload failed'));
    } finally {
      setIsUploadingResume(false);
    }
  };

  const handleRemoveResume = async () => {
    if (!window.confirm('Remove your resume? Recruiters will no longer be able to see it.')) return;
    setIsUploadingResume(true);
    try {
      await api.delete('/api/students/resume');
      await refreshProfile({ resetForm: false });
      showFlash('success', 'Resume removed.');
    } catch (err) {
      showFlash('error', getErrorMessage(err, 'Could not remove resume'));
    } finally {
      setIsUploadingResume(false);
    }
  };

  // ---------- Profile photo ----------
  const handlePhotoFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (!PHOTO_TYPES.includes(file.type)) {
      showFlash('error', 'Profile photo must be a JPG, PNG or WEBP image.');
      return;
    }
    if (file.size > PHOTO_MAX_BYTES) {
      showFlash('error', 'Profile photo must be 2 MB or smaller.');
      return;
    }

    setIsUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      await api.post('/api/students/uploadProfilePicture', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      await refreshProfile({ resetForm: false });
      showFlash('success', 'Profile photo updated.');
    } catch (err) {
      showFlash('error', getErrorMessage(err, 'Photo upload failed'));
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleRemovePhoto = async () => {
    if (!window.confirm('Remove your profile photo?')) return;
    setIsUploadingPhoto(true);
    try {
      await api.delete('/api/students/profilePicture');
      await refreshProfile({ resetForm: false });
      showFlash('success', 'Profile photo removed.');
    } catch (err) {
      showFlash('error', getErrorMessage(err, 'Could not remove photo'));
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  // ---------- Password ----------
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordMsg(null);
    const problem = passwordProblem(passwordForm.next);
    if (problem) {
      setPasswordMsg({ type: 'error', text: problem });
      return;
    }
    if (passwordForm.next !== passwordForm.confirm) {
      setPasswordMsg({ type: 'error', text: 'New passwords do not match.' });
      return;
    }

    setIsChangingPassword(true);
    try {
      const response = await api.put('/api/auth/change-password', {
        ...(passwordForm.current ? { oldPassword: passwordForm.current } : {}),
        newPassword: passwordForm.next,
      });
      // Other devices are signed out; keep this one signed in with the new token.
      const token = response.data?.data?.token;
      if (token) localStorage.setItem('token', token);
      setPasswordForm({ current: '', next: '', confirm: '' });
      setPasswordMsg({ type: 'success', text: 'Password changed. You have been signed out on other devices.' });
    } catch (err) {
      setPasswordMsg({ type: 'error', text: getErrorMessage(err, 'Could not change password') });
    } finally {
      setIsChangingPassword(false);
    }
  };

  // ---------- Derived ----------
  const resumeUrl = safeUrl(profile?.resumeUrl || '');
  const photoUrl = safeUrl(profile?.profilePictureUrl || '');
  const resumeName = profile?.resumeFileName || (resumeUrl ? 'Resume.pdf' : '');

  const completeness = useMemo(() => {
    const checks = [
      { label: 'Profile photo', done: Boolean(photoUrl) },
      { label: 'Headline', done: Boolean(details.headline.trim()) },
      { label: 'About you', done: Boolean(details.about.trim()) },
      { label: 'Phone number', done: Boolean(details.phone.trim()) },
      { label: 'Resume', done: Boolean(resumeUrl) },
      { label: 'At least 3 skills', done: skills.length >= 3 },
      { label: 'A project', done: projects.length > 0 },
      { label: 'A certification', done: certifications.length > 0 },
      { label: 'LinkedIn or GitHub', done: Boolean(details.linkedinUrl.trim() || details.githubUrl.trim()) },
    ];
    const done = checks.filter((c) => c.done).length;
    return { percent: Math.round((done / checks.length) * 100), missing: checks.filter((c) => !c.done) };
  }, [photoUrl, resumeUrl, details, skills, projects, certifications]);

  const academic = [
    { label: 'Roll Number', value: profile?.rollNumber },
    { label: 'Branch', value: profile?.branch },
    { label: 'Current Year', value: profile?.year ? `Year ${profile.year}` : '' },
    { label: 'CGPA', value: profile?.cgpa !== undefined && profile?.cgpa !== null ? `${profile.cgpa} / 10` : '' },
  ];

  if (isLoadingProfile) {
    return <AuthLoadingOverlay show title="Loading your profile…" subtitle="Fetching your latest details." />;
  }

  const avatar = (size = 'h-20 w-20', text = 'text-2xl') =>
    photoUrl ? (
      <img src={photoUrl} alt={`${details.name || 'Student'} profile photo`} className={`${size} rounded-2xl object-cover border border-[#E5E7EB] shadow-sm bg-white`} />
    ) : (
      <div className={`${size} ${text} rounded-2xl bg-white border border-[#E5E7EB] flex items-center justify-center font-bold text-[#0B3D91] shadow-sm`}>
        {initialsOf(details.name)}
      </div>
    );

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8 animate-in fade-in duration-300 text-[#4B5563]">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-[#E5E7EB] pb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-[#111827] tracking-tight">Student Portfolio</h1>
          <p className="text-xs text-[#4B5563] mt-1">Configure your professional details, credentials, and resume.</p>
        </div>

        <div className="flex bg-white p-1 rounded-xl border border-[#E5E7EB] self-start shadow-sm" role="tablist">
          {[
            { id: 'edit', label: 'Edit Details', icon: User },
            { id: 'preview', label: 'Profile Preview', icon: Eye },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              role="tab"
              aria-selected={activeTab === id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === id ? 'bg-[#22C55E] text-white shadow-sm' : 'text-[#94A3B8] hover:text-[#4B5563]'
              }`}
              type="button"
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {flash && (
        <div className={flash.type === 'success' ? 'pc-alert-success' : 'pc-alert-error'} role={flash.type === 'success' ? 'status' : 'alert'}>
          {flash.type === 'success' ? <CheckCircle2 className="h-5 w-5 flex-shrink-0" /> : <AlertCircle className="h-5 w-5 flex-shrink-0" />}
          <p className="font-semibold text-sm">{flash.text}</p>
        </div>
      )}

      {/* Hidden file pickers, opened by the buttons below */}
      <input ref={resumeInputRef} type="file" accept="application/pdf,.pdf" className="hidden" onChange={handleResumeFile} />
      <input ref={photoInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handlePhotoFile} />

      {activeTab === 'edit' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Personal info */}
            <div className={cardClass}>
              <h2 className={cardTitleClass}>
                <GraduationCap className="w-4.5 h-4.5 text-[#22C55E]" />
                Academic & Personal Information
              </h2>

              {/* Photo */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-5">
                <div className="relative">
                  {avatar()}
                  {isUploadingPhoto && (
                    <div className="absolute inset-0 rounded-2xl bg-white/70 flex items-center justify-center">
                      <span className="h-6 w-6 rounded-full border-2 border-[#22C55E] border-t-transparent animate-spin" aria-label="Uploading photo" />
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-bold text-[#111827]">Profile photo</p>
                  <p className="text-[11px] text-[#94A3B8]">JPG, PNG or WEBP, up to 2 MB. Recruiters see this on your application.</p>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => photoInputRef.current?.click()} disabled={isUploadingPhoto} className="pc-btn-secondary text-xs px-3 py-1.5">
                      <Camera className="w-3.5 h-3.5" /> {photoUrl ? 'Change photo' : 'Upload photo'}
                    </button>
                    {photoUrl && (
                      <button type="button" onClick={handleRemovePhoto} disabled={isUploadingPhoto} className="pc-btn-secondary text-xs px-3 py-1.5 text-rose-600">
                        <Trash2 className="w-3.5 h-3.5" /> Remove
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="profile-name" className={labelClass}>Full Name</label>
                  <input id="profile-name" type="text" name="name" value={details.name} onChange={handleDetailChange} className={inputClass} maxLength={50} required />
                </div>

                <div>
                  <label htmlFor="profile-email" className={labelClass}>Email Address</label>
                  <div className="relative">
                    <input id="profile-email" type="email" value={profile?.email || ''} readOnly className={`${inputClass} pr-9 cursor-not-allowed text-[#6B7280]`} aria-describedby="profile-email-hint" />
                    <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#94A3B8]" aria-hidden="true" />
                  </div>
                  <p id="profile-email-hint" className="mt-1 text-[10px] text-[#94A3B8]">Your sign-in email. Contact the Placement Cell to change it.</p>
                </div>

                <div>
                  <label htmlFor="profile-phone" className={labelClass}>Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#94A3B8]" aria-hidden="true" />
                    <input id="profile-phone" type="tel" name="phone" value={details.phone} onChange={handleDetailChange} className={`${inputClass} pl-9`} placeholder="+91 98765 43210" maxLength={20} autoComplete="tel" />
                  </div>
                </div>

                <div>
                  <label htmlFor="profile-headline" className={labelClass}>Headline</label>
                  <input id="profile-headline" type="text" name="headline" value={details.headline} onChange={handleDetailChange} className={inputClass} placeholder="Full-stack developer | MERN | DSA" maxLength={120} />
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="profile-about" className={labelClass}>About You</label>
                  <textarea id="profile-about" name="about" rows={4} value={details.about} onChange={handleDetailChange} className={`${inputClass} resize-none`} placeholder="A short summary of your interests, strengths and what roles you are looking for." maxLength={1000} />
                  <p className="mt-1 text-right text-[10px] text-[#94A3B8]">{details.about.length}/1000</p>
                </div>
              </div>

              <div className="space-y-3">
                <dl className="grid grid-cols-2 md:grid-cols-4 gap-3" aria-label="Academic details">
                  {academic.map((field) => (
                    <div key={field.label} className="rounded-xl border border-[#E5E7EB] bg-slate-50 px-4 py-3">
                      <dt className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">{field.label}</dt>
                      <dd className="mt-1 text-sm font-semibold text-[#111827] break-words">{field.value || 'Not set'}</dd>
                    </div>
                  ))}
                </dl>
                <p className="flex items-start gap-2 text-xs text-[#6B7280]">
                  <Lock className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-[#0B3D91]" aria-hidden="true" />
                  Verified by the Placement Cell. Contact the TPO to correct this.
                </p>
              </div>
            </div>

            {/* Online profiles */}
            <div className={cardClass}>
              <h2 className={cardTitleClass}>
                <Globe className="w-4.5 h-4.5 text-[#22C55E]" />
                Online Profiles
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {LINK_FIELDS.map(({ key, label, icon: Icon, placeholder }) => (
                  <div key={key} className={key === 'portfolioUrl' ? 'md:col-span-2' : ''}>
                    <label htmlFor={`profile-${key}`} className={labelClass}>{label}</label>
                    <div className="relative">
                      <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#94A3B8]" aria-hidden="true" />
                      <input id={`profile-${key}`} type="url" name={key} value={details[key]} onChange={handleDetailChange} className={`${inputClass} pl-9`} placeholder={placeholder} maxLength={300} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Projects */}
            <div className={cardClass}>
              <div className="flex items-center justify-between pb-4 border-b border-[#E5E7EB]">
                <h2 className="text-base font-bold text-[#111827] flex items-center gap-2.5">
                  <Briefcase className="w-4.5 h-4.5 text-[#22C55E]" />
                  Key Projects ({projects.length})
                </h2>
                <button
                  type="button"
                  onClick={() => setShowProjectForm(!showProjectForm)}
                  className="flex items-center gap-1.5 text-xs font-bold text-[#22C55E] hover:text-[#16A34A] transition-colors"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  {showProjectForm ? 'Cancel' : 'Add Project'}
                </button>
              </div>

              {showProjectForm && (
                <form onSubmit={handleAddProject} className="bg-[#F8FAFC] p-6 border border-[#E5E7EB] rounded-xl space-y-5 font-semibold text-[#4B5563]">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label htmlFor="project-title" className={labelClass}>Project Title</label>
                      <input id="project-title" type="text" placeholder="PlacementConnect" value={newProject.title} onChange={(e) => setNewProject({ ...newProject, title: e.target.value })} className={inputClass} maxLength={200} />
                    </div>
                    <div>
                      <label htmlFor="project-link" className={labelClass}>Repository/Deployment Link</label>
                      <input id="project-link" type="url" placeholder="https://github.com/..." value={newProject.link} onChange={(e) => setNewProject({ ...newProject, link: e.target.value })} className={inputClass} maxLength={500} />
                    </div>
                    <div className="md:col-span-2">
                      <label htmlFor="project-tech" className={labelClass}>Tech Stack (Comma-separated)</label>
                      <input id="project-tech" type="text" placeholder="React.js, Node.js, Express, MongoDB" value={newProject.techStack} onChange={(e) => setNewProject({ ...newProject, techStack: e.target.value })} className={inputClass} />
                    </div>
                    <div className="md:col-span-2">
                      <label htmlFor="project-description" className={labelClass}>Brief Description</label>
                      <textarea id="project-description" rows="4" placeholder="Describe the application features, challenges solved, and components built..." value={newProject.description} onChange={(e) => setNewProject({ ...newProject, description: e.target.value })} className={`${inputClass} resize-none`} maxLength={5000} />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={!newProject.title.trim() || !newProject.description.trim()}
                    className="px-4 py-2 bg-[#22C55E] hover:bg-[#16A34A] text-white font-bold rounded-xl text-xs disabled:opacity-50 transition-all shadow-sm"
                  >
                    Add Project
                  </button>
                  <p className="text-[10px] text-[#94A3B8]">Remember to click "Save All Profile Data" to keep your changes.</p>
                </form>
              )}

              <div className="space-y-5">
                {projects.length === 0 ? (
                  <p className="text-[#4B5563] text-xs py-1 italic font-medium">No projects listed. Add one to strengthen your CV.</p>
                ) : (
                  projects.map((proj, index) => {
                    const key = projectKey(proj, index);
                    const href = safeUrl(proj.link || '');
                    return (
                      <div key={key} className="p-6 bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl relative group">
                        <button
                          type="button"
                          onClick={() => handleRemoveProject(key)}
                          className="absolute top-5 right-5 text-[#94A3B8] hover:text-rose-600 p-1.5 rounded-lg border border-[#E5E7EB] bg-white hover:bg-rose-50 transition-all duration-200 shadow-sm"
                          aria-label={`Remove project ${proj.title}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <h4 className="text-sm font-bold text-[#111827] flex items-center gap-2 pr-10">
                          {proj.title}
                          {href && (
                            <a href={href} target="_blank" rel="noopener noreferrer" className="text-[#94A3B8] hover:text-[#4B5563]" aria-label={`Open ${proj.title}`}>
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </h4>
                        <p className="text-xs text-[#4B5563] mt-2 leading-relaxed max-w-[90%] font-medium whitespace-pre-line">{proj.description}</p>
                        {proj.techStack && proj.techStack.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-4">
                            {proj.techStack.map((tech, i) => (
                              <span key={i} className="text-[10px] bg-white text-[#4B5563] px-3 py-1 rounded-full border border-[#E5E7EB] font-semibold shadow-sm">
                                {tech}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-8">
            {/* Profile strength */}
            <div className={cardClass}>
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-[#111827]">Profile Strength</h2>
                <span className={`text-sm font-bold ${completeness.percent >= 80 ? 'text-[#22C55E]' : completeness.percent >= 50 ? 'text-amber-600' : 'text-rose-600'}`}>
                  {completeness.percent}%
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden" role="progressbar" aria-valuenow={completeness.percent} aria-valuemin={0} aria-valuemax={100} aria-label="Profile completeness">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${completeness.percent >= 80 ? 'bg-[#22C55E]' : completeness.percent >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`}
                  style={{ width: `${completeness.percent}%` }}
                />
              </div>
              {completeness.missing.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-[11px] font-semibold text-[#6B7280]">Add these to stand out to recruiters:</p>
                  <ul className="space-y-1.5">
                    {completeness.missing.map((item) => (
                      <li key={item.label} className="flex items-center gap-2 text-xs text-[#4B5563]">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" aria-hidden="true" />
                        {item.label}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="text-xs font-semibold text-[#22C55E]">Your profile is complete. Great work!</p>
              )}
            </div>

            {/* Resume */}
            <div className={`${cardClass} !space-y-5`}>
              <h2 className={cardTitleClass}>
                <FileText className="w-4.5 h-4.5 text-[#22C55E]" />
                Resume Document
              </h2>

              {isUploadingResume ? (
                <div className="border-2 border-dashed border-[#E5E7EB] rounded-xl py-10 text-center bg-[#F8FAFC] space-y-3" role="status">
                  <div className="h-6 w-6 border-2 border-[#22C55E] border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-[11px] text-[#4B5563] font-semibold">Uploading your resume…</p>
                </div>
              ) : resumeUrl ? (
                <div className="rounded-xl border border-[#22C55E]/30 bg-[#22C55E]/5 p-5 space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 flex-shrink-0 rounded-lg bg-white border border-[#E5E7EB] flex items-center justify-center">
                      <FileText className="h-5 w-5 text-rose-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[#111827] truncate" title={resumeName}>{resumeName}</p>
                      <p className="mt-0.5 flex items-center gap-1 text-[10px] text-[#6B7280] font-semibold">
                        <Check className="w-3 h-3 text-[#22C55E]" />
                        Uploaded{profile?.resumeUploadedAt ? ` on ${formatDate(profile.resumeUploadedAt)}` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <a href={resumeUrl} target="_blank" rel="noopener noreferrer" className="pc-btn-secondary text-[11px] px-2 py-1.5">
                      <Eye className="w-3.5 h-3.5" /> View
                    </a>
                    <button type="button" onClick={() => resumeInputRef.current?.click()} className="pc-btn-secondary text-[11px] px-2 py-1.5">
                      <RefreshCw className="w-3.5 h-3.5" /> Replace
                    </button>
                    <button type="button" onClick={handleRemoveResume} className="pc-btn-secondary text-[11px] px-2 py-1.5 text-rose-600">
                      <Trash2 className="w-3.5 h-3.5" /> Remove
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => resumeInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-[#E5E7EB] rounded-xl p-6 text-center bg-[#F8FAFC] hover:bg-[#F1F5F9] hover:border-[#22C55E]/40 transition-all space-y-3 py-8"
                >
                  <Upload className="w-8 h-8 text-[#94A3B8] mx-auto" />
                  <p className="text-xs font-bold text-[#4B5563]">Choose PDF Resume</p>
                  <p className="text-[10px] text-[#94A3B8] font-semibold">Max size 5 MB (PDF only)</p>
                </button>
              )}
            </div>

            {/* Skills */}
            <div className={`${cardClass} !space-y-5`}>
              <h2 className={cardTitleClass}>
                <Award className="w-4.5 h-4.5 text-[#22C55E]" />
                Technical Skills
              </h2>

              <form onSubmit={handleAddSkill} className="flex gap-2.5">
                <label htmlFor="skill-input" className="sr-only">Add a skill</label>
                <input
                  id="skill-input"
                  type="text"
                  placeholder="React, Java, Python..."
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  maxLength={100}
                  className="flex-grow px-3 py-2 bg-[#F8FAFC] border border-[#E5E7EB] focus:bg-white rounded-xl text-[#111827] placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-[#0B3D91]/10 focus:border-[#0B3D91] text-xs font-semibold"
                />
                <button type="submit" className="p-2.5 bg-[#22C55E] hover:bg-[#16A34A] text-white rounded-xl transition-all shadow-sm" aria-label="Add skill">
                  <Plus className="w-4 h-4 text-white" />
                </button>
              </form>

              <div className="flex flex-wrap gap-2 pt-2">
                {skills.length === 0 ? (
                  <span className="text-xs text-[#94A3B8] italic font-medium">No skills added yet.</span>
                ) : (
                  skills.map((skill) => (
                    <span key={skill} className="inline-flex items-center gap-1.5 bg-[#22C55E]/10 text-[#16A34A] border border-[#22C55E]/20 px-3 py-1.5 rounded-full text-xs font-bold">
                      {skill}
                      <button type="button" onClick={() => handleRemoveSkill(skill)} className="hover:text-rose-600 focus:outline-none text-[11px] font-extrabold" aria-label={`Remove ${skill}`}>
                        ×
                      </button>
                    </span>
                  ))
                )}
              </div>
            </div>

            {/* Certifications */}
            <div className={`${cardClass} !space-y-5`}>
              <h2 className={cardTitleClass}>
                <Award className="w-4.5 h-4.5 text-[#22C55E]" />
                Certifications
              </h2>

              <form onSubmit={handleAddCert} className="space-y-3" noValidate>
                <div>
                  <label htmlFor="cert-name" className="pc-label">Certification name</label>
                  <input id="cert-name" type="text" placeholder="e.g. AWS Cloud Practitioner" value={certInput.name} onChange={(e) => setCertInput({ ...certInput, name: e.target.value })} className="pc-input text-xs" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="cert-issuer" className="pc-label">Issuer <span className="font-normal text-[#94A3B8]">(optional)</span></label>
                    <input id="cert-issuer" type="text" placeholder="e.g. Amazon Web Services" value={certInput.issuer} onChange={(e) => setCertInput({ ...certInput, issuer: e.target.value })} className="pc-input text-xs" />
                  </div>
                  <div>
                    <label htmlFor="cert-date" className="pc-label">Date <span className="font-normal text-[#94A3B8]">(optional)</span></label>
                    <input id="cert-date" type="date" value={certInput.date} onChange={(e) => setCertInput({ ...certInput, date: e.target.value })} className="pc-input text-xs" />
                  </div>
                </div>
                <div>
                  <label htmlFor="cert-url" className="pc-label">Certificate link <span className="font-normal text-[#94A3B8]">(optional)</span></label>
                  <input id="cert-url" type="url" placeholder="https://" value={certInput.url} onChange={(e) => setCertInput({ ...certInput, url: e.target.value })} className="pc-input text-xs" />
                </div>
                {certError && <p className="text-xs font-semibold text-rose-600" role="alert">{certError}</p>}
                <button type="submit" className="pc-btn-secondary w-full text-xs">
                  <Plus className="w-4 h-4" aria-hidden="true" /> Add certification
                </button>
              </form>

              <ul className="space-y-3 pt-2">
                {certifications.length === 0 ? (
                  <li className="text-xs text-[#94A3B8] italic font-medium">No certifications listed.</li>
                ) : (
                  certifications.map((cert, index) => {
                    const href = safeUrl(cert.url);
                    return (
                      <li key={certKey(cert, index)} className="flex items-start justify-between gap-3 bg-[#F8FAFC] border border-[#E5E7EB] px-4 py-3 rounded-xl text-xs text-[#4B5563]">
                        <div className="min-w-0">
                          <p className="font-semibold text-[#111827] break-words">{cert.name}</p>
                          {(cert.issuer || cert.date) && (
                            <p className="mt-0.5 text-[11px] text-[#6B7280]">{[cert.issuer, cert.date].filter(Boolean).join(' · ')}</p>
                          )}
                          {href && (
                            <a href={href} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-[#0B3D91] hover:underline">
                              View certificate <ExternalLink className="w-3 h-3" aria-hidden="true" />
                            </a>
                          )}
                        </div>
                        <button type="button" onClick={() => handleRemoveCert(index)} className="text-[#94A3B8] hover:text-rose-600 transition-colors p-1 rounded-lg" aria-label={`Remove ${cert.name}`}>
                          <Trash2 className="w-4 h-4" aria-hidden="true" />
                        </button>
                      </li>
                    );
                  })
                )}
              </ul>
            </div>

            {/* Save */}
            <button
              type="button"
              onClick={handleSaveProfile}
              disabled={isSaving}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-[#22C55E] hover:bg-[#16A34A] disabled:opacity-60 text-white font-bold rounded-xl text-xs transition-all shadow-md active:scale-[0.98]"
            >
              {isSaving ? (
                <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" aria-label="Saving" />
              ) : (
                <>
                  Save All Profile Data
                  <ArrowRight className="w-4 h-4 text-white" />
                </>
              )}
            </button>

            {/* Change password */}
            <form onSubmit={handleChangePassword} className={`${cardClass} !space-y-4`}>
              <h2 className={cardTitleClass}>
                <KeyRound className="w-4.5 h-4.5 text-[#22C55E]" />
                Change Password
              </h2>
              {passwordMsg && (
                <p className={`text-xs font-semibold ${passwordMsg.type === 'success' ? 'text-[#16A34A]' : 'text-rose-600'}`} role={passwordMsg.type === 'success' ? 'status' : 'alert'}>
                  {passwordMsg.text}
                </p>
              )}
              <div>
                <label htmlFor="pw-current" className="pc-label">Current password</label>
                <input id="pw-current" type="password" autoComplete="current-password" value={passwordForm.current} onChange={(e) => setPasswordForm({ ...passwordForm, current: e.target.value })} className="pc-input text-xs" />
                {profile?.authProvider === 'google' && (
                  <p className="mt-1 text-[10px] text-[#94A3B8]">Signed up with Google? Leave this blank to set a password for the first time.</p>
                )}
              </div>
              <div>
                <label htmlFor="pw-new" className="pc-label">New password</label>
                <input id="pw-new" type="password" autoComplete="new-password" value={passwordForm.next} onChange={(e) => setPasswordForm({ ...passwordForm, next: e.target.value })} className="pc-input text-xs" minLength={8} required />
                <p className="mt-1 text-[10px] text-[#94A3B8]">{PASSWORD_HINT}</p>
              </div>
              <div>
                <label htmlFor="pw-confirm" className="pc-label">Confirm new password</label>
                <input id="pw-confirm" type="password" autoComplete="new-password" value={passwordForm.confirm} onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })} className="pc-input text-xs" required />
              </div>
              <button type="submit" disabled={isChangingPassword} className="pc-btn-primary w-full text-xs py-2.5">
                {isChangingPassword ? <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" aria-label="Updating password" /> : 'Update password'}
              </button>
            </form>
          </div>
        </div>
      ) : (
        /* Professional CV Preview */
        <div className="bg-white border border-[#E5E7EB] rounded-2xl overflow-hidden shadow-sm animate-in fade-in duration-300">
          <div className="bg-[#F8FAFC] p-5 sm:p-10 border-b border-[#E5E7EB] space-y-5">
            <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-5 items-start sm:items-center">
                {avatar('h-20 w-20', 'text-2xl')}
                <div className="space-y-1.5 min-w-0">
                  <h2 className="text-xl md:text-2xl font-bold text-[#111827]">{details.name}</h2>
                  {details.headline && <p className="text-sm font-semibold text-[#0B3D91]">{details.headline}</p>}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#4B5563] font-semibold">
                    <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-[#22C55E]" /> {profile?.email}</span>
                    {details.phone && <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-[#22C55E]" /> {details.phone}</span>}
                    <span className="font-mono">ID: {profile?.rollNumber}</span>
                  </div>
                </div>
              </div>
              {resumeUrl && (
                <a href={resumeUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 bg-white border border-[#E5E7EB] hover:border-[#22C55E]/20 text-[#4B5563] hover:text-[#22C55E] rounded-lg text-xs font-bold transition-all shadow-sm">
                  <FileText className="w-3.5 h-3.5 text-[#22C55E]" />
                  View PDF Resume
                </a>
              )}
            </div>
            {LINK_FIELDS.some(({ key }) => safeUrl(details[key])) && (
              <div className="flex flex-wrap gap-2">
                {LINK_FIELDS.map(({ key, label, icon: Icon }) => {
                  const href = safeUrl(details[key]);
                  return href ? (
                    <a key={key} href={href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-lg border border-[#E5E7EB] bg-white px-3 py-1.5 text-[11px] font-bold text-[#4B5563] hover:text-[#0B3D91]">
                      <Icon className="w-3.5 h-3.5" /> {label}
                    </a>
                  ) : null;
                })}
              </div>
            )}
          </div>

          <div className="p-5 sm:p-10 grid grid-cols-1 md:grid-cols-3 gap-10">
            <div className="space-y-8 border-b md:border-b-0 md:border-r border-[#E5E7EB] pb-8 md:pb-0 md:pr-8">
              <div className="space-y-4">
                <h3 className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest flex items-center gap-1.5">
                  <GraduationCap className="w-4 h-4 text-[#22C55E]" /> Academics
                </h3>
                <div className="bg-[#F8FAFC] p-5 border border-[#E5E7EB] rounded-xl space-y-3.5 font-semibold text-[#4B5563]">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[#94A3B8]">Degree</span>
                    <span>B.Tech Engineering</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[#94A3B8]">Branch</span>
                    <span className="text-[#111827] font-bold">{profile?.branch}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[#94A3B8]">Year / Semester</span>
                    <span>Year {profile?.year} (Sem {(profile?.year || 0) * 2})</span>
                  </div>
                  <div className="h-px bg-[#E5E7EB] my-1" />
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[#94A3B8]">Aggregate CGPA</span>
                    <span className="text-[#16A34A] font-bold bg-[#22C55E]/10 border border-[#22C55E]/20 px-3 py-0.5 rounded-full text-xs">
                      {profile?.cgpa} / 10.00
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-[#22C55E]" /> Core Skills
                </h3>
                <div className="flex flex-wrap gap-2">
                  {skills.length === 0 ? (
                    <span className="text-xs text-[#94A3B8] italic font-medium">No skills added</span>
                  ) : (
                    skills.map((skill) => (
                      <span key={skill} className="bg-white text-[#4B5563] border border-[#E5E7EB] px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm">{skill}</span>
                    ))
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-[#22C55E]" /> Certifications
                </h3>
                <div className="space-y-3">
                  {certifications.length === 0 ? (
                    <span className="text-xs text-[#94A3B8] italic font-medium">No certifications listed</span>
                  ) : (
                    certifications.map((cert, index) => (
                      <div key={certKey(cert, index)} className="flex gap-2.5 items-start text-xs text-[#4B5563] bg-[#F8FAFC] p-3.5 rounded-xl border border-[#E5E7EB] font-semibold">
                        <Check className="w-3.5 h-3.5 text-[#22C55E] flex-shrink-0 mt-0.5" aria-hidden="true" />
                        <span className="min-w-0 break-words">
                          {cert.name}
                          {cert.issuer && <span className="block text-[11px] font-medium text-[#6B7280]">{cert.issuer}</span>}
                          {cert.date && (
                            <span className="mt-0.5 flex items-center gap-1 text-[10px] font-medium text-[#94A3B8]">
                              <Calendar className="w-3 h-3" /> {formatDate(cert.date)}
                            </span>
                          )}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="md:col-span-2 space-y-8">
              {details.about && (
                <div className="space-y-3">
                  <h3 className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest flex items-center gap-2 pb-3 border-b border-[#E5E7EB]">
                    <User className="w-4 h-4 text-[#22C55E]" /> About
                  </h3>
                  <p className="text-xs text-[#4B5563] leading-relaxed font-medium whitespace-pre-line">{details.about}</p>
                </div>
              )}

              <h3 className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest flex items-center gap-2 pb-3 border-b border-[#E5E7EB]">
                <Briefcase className="w-4 h-4 text-[#22C55E]" /> Portfolio Projects
              </h3>

              <div className="space-y-8">
                {projects.length === 0 ? (
                  <p className="text-[#94A3B8] text-xs italic font-medium">No projects listed</p>
                ) : (
                  projects.map((proj, index) => {
                    const href = safeUrl(proj.link || '');
                    return (
                      <div key={projectKey(proj, index)} className="space-y-3 relative pl-6 border-l border-[#E5E7EB]">
                        <div className="absolute left-[-4.5px] top-1.5 w-2 h-2 rounded-full bg-[#22C55E]" />
                        <div className="flex items-center gap-2.5">
                          <h4 className="text-base font-bold text-[#111827] leading-tight">{proj.title}</h4>
                          {href && (
                            <a href={href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-[10px] text-[#22C55E] hover:text-[#16A34A] font-bold">
                              Code/Link <ExternalLink className="w-3 h-3 ml-0.5" />
                            </a>
                          )}
                        </div>
                        <p className="text-xs text-[#4B5563] leading-relaxed font-medium whitespace-pre-line">{proj.description}</p>
                        {proj.techStack && proj.techStack.length > 0 && (
                          <div className="flex flex-wrap gap-2 pt-2">
                            {proj.techStack.map((tech, i) => (
                              <span key={i} className="text-[10px] bg-[#F8FAFC] text-[#4B5563] px-2.5 py-1 rounded border border-[#E5E7EB] font-semibold">{tech}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
