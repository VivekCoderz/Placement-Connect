import React, { useState } from 'react';
import { 
  User, Mail, Plus, Trash2, ExternalLink, Upload, Eye, FileText, 
  Briefcase, GraduationCap, Award, PlusCircle, Check, ArrowRight, Lock
} from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { setUser } from '../redux/authSlice';
import api, { getErrorMessage } from '../utils/api';
import { normalizeCerts, toCertPayload, safeUrl, certKey } from '../utils/certifications';

const Profile = () => {
  const user = useSelector((state) => state.auth.user);
  const dispatch = useDispatch();
  const [activeTab, setActiveTab] = useState('edit'); // edit | preview
  const [successMsg, setSuccessMsg] = useState('');

  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    rollNumber: user?.rollNumber || '',
    branch: user?.branch || 'CSE',
    year: user?.year || 4,
    cgpa: user?.cgpa || '',
  });

  const [skills, setSkills] = useState(user?.skills || []);
  const [certifications, setCertifications] = useState(() => normalizeCerts(user?.certifications));
  const [projects, setProjects] = useState(user?.projects || []);

  const [skillInput, setSkillInput] = useState('');
  const [certInput, setCertInput] = useState({ name: '', issuer: '', date: '', url: '' });
  const [certError, setCertError] = useState('');
  
  const [newProject, setNewProject] = useState({
    title: '',
    description: '',
    techStack: '',
    link: ''
  });
  const [showProjectForm, setShowProjectForm] = useState(false);

  const [resumeName, setResumeName] = useState(user?.resumeName || '');
  const [resumeUrl, setResumeUrl] = useState(user?.resumeUrl || '');
  const [isUploading, setIsUploading] = useState(false);


  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAddSkill = (e) => {
    e.preventDefault();
    if (skillInput.trim() && !skills.includes(skillInput.trim())) {
      const updated = [...skills, skillInput.trim()];
      setSkills(updated);
      setSkillInput('');
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    setSkills(skills.filter(s => s !== skillToRemove));
  };

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

  const handleRemoveCert = (index) => {
    setCertifications(certifications.filter((_, i) => i !== index));
  };

  const handleAddProject = (e) => {
    e.preventDefault();
    const { title, description, techStack, link } = newProject;
    if (!title || !description) return;

    const formattedTech = techStack
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0);

    const projectObj = {
      id: `proj-${Date.now()}`,
      title,
      description,
      techStack: formattedTech,
      link
    };

    const updated = [...projects, projectObj];
    setProjects(updated);
    setNewProject({ title: '', description: '', techStack: '', link: '' });
    setShowProjectForm(false);
  };

  const handleRemoveProject = (projId) => {
    setProjects(projects.filter(p => p.id !== projId));
  };

  const handleResumeUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      alert('Please upload a PDF file only.');
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('resume', file);
      
      const response = await api.put('/api/students/resume', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const data = response.data;

      setResumeName(file.name);
      setResumeUrl(data.resumeUrl);

      // Play upload success sound
      const { playSuccessFanfare } = await import('../utils/audio');
      playSuccessFanfare();

      // fetch fresh combined me data
      const meResponse = await api.get('/api/auth/me');
      const meRes = meResponse.data;
      const combinedUser = {
        ...meRes.data.user,
        ...meRes.data.details,
        id: meRes.data.user._id || meRes.data.user.id,
      };
      localStorage.setItem('user', JSON.stringify(combinedUser));
      dispatch(setUser(combinedUser));
    } catch (err) {
      // Play failure buzz sound
      try {
        const { playFailureBuzz } = await import('../utils/audio');
        playFailureBuzz();
      } catch {}
      alert(err.response?.data?.message || err.message || 'Resume upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveProfile = async (e) => {
    if (e) e.preventDefault();
    setSuccessMsg('');

    try {
      // 1. Update Name/Email
      await api.put('/api/students/updateEmailName', { name: formData.name, email: formData.email });

      // Academic fields (CGPA, branch, year, roll number) are verified by the
      // Placement Cell and can only be changed by TPO/admin, so they are not sent.

      // 2. Update Profile Details (skills, projects, certifications)
      await api.put('/api/students/profile', {
        skills,
        projects,
        certifications: certifications.map(toCertPayload).filter(Boolean),
      });

      // 3. Fetch me again to get fresh unified profile
      const meResponse = await api.get('/api/auth/me');
      const meRes = meResponse.data;

      const combinedUser = {
        ...meRes.data.user,
        ...meRes.data.details,
        id: meRes.data.user._id || meRes.data.user.id,
      };

      localStorage.setItem('user', JSON.stringify(combinedUser));
      dispatch(setUser(combinedUser));
      setCertifications(normalizeCerts(combinedUser.certifications));
      setSuccessMsg('Profile updated successfully! All eligible placement jobs synchronized.');
    } catch (err) {
      alert(getErrorMessage(err, 'Profile update failed'));
    }
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8 animate-in fade-in duration-300 text-[#4B5563]">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-[#E5E7EB] pb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-[#111827] tracking-tight">Student Portfolio</h1>
          <p className="text-xs text-[#4B5563] mt-1">Configure your professional details, credentials, and resume.</p>
        </div>

        {/* Tab Buttons */}
        <div className="flex bg-white p-1 rounded-xl border border-[#E5E7EB] self-start shadow-sm">
          <button
            onClick={() => setActiveTab('edit')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'edit'
                ? 'bg-[#22C55E] text-white shadow-sm font-bold'
                : 'text-[#94A3B8] hover:text-[#4B5563]'
            }`}
            type="button"
          >
            <User className="w-3.5 h-3.5" />
            Edit Details
          </button>
          <button
            onClick={() => {
              handleSaveProfile();
              setActiveTab('preview');
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'preview'
                ? 'bg-[#22C55E] text-white shadow-sm font-bold'
                : 'text-[#94A3B8] hover:text-[#4B5563]'
            }`}
            type="button"
          >
            <Eye className="w-3.5 h-3.5" />
            Profile Preview
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="bg-[#22C55E]/10 border border-[#22C55E]/20 text-[#22C55E] p-5 rounded-xl flex items-center gap-3 text-xs animate-in fade-in duration-300">
          <Check className="w-4 h-4 flex-shrink-0 text-[#22C55E]" />
          <p className="font-semibold">{successMsg}</p>
        </div>
      )}

      {activeTab === 'edit' ? (
        <form onSubmit={handleSaveProfile} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Personal info form */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white border border-[#E5E7EB] p-8 rounded-2xl space-y-6 shadow-sm">
              <h2 className="text-base font-bold text-[#111827] flex items-center gap-2.5 pb-4 border-b border-[#E5E7EB]">
                <GraduationCap className="w-4.5 h-4.5 text-[#22C55E]" />
                Academic & Personal Information
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="profile-name" className="block text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider mb-2">Full Name</label>
                  <input
                    id="profile-name"
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="block w-full px-4 py-2.5 bg-[#F8FAFC] border border-[#E5E7EB] focus:bg-white rounded-xl text-[#111827] placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-[#7C3AED]/10 focus:border-[#7C3AED] transition-all text-xs font-semibold"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="profile-email" className="block text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider mb-2">Email Address</label>
                  <input
                    id="profile-email"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="block w-full px-4 py-2.5 bg-[#F8FAFC] border border-[#E5E7EB] focus:bg-white rounded-xl text-[#111827] placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-[#7C3AED]/10 focus:border-[#7C3AED] transition-all text-xs font-semibold"
                    required
                  />
                </div>

              </div>

              <div className="space-y-3">
                <dl className="grid grid-cols-2 md:grid-cols-4 gap-3" aria-label="Academic details">
                  {[
                    { label: 'Roll Number', value: formData.rollNumber },
                    { label: 'Branch', value: formData.branch },
                    { label: 'Current Year', value: formData.year ? `Year ${formData.year}` : '' },
                    { label: 'CGPA', value: formData.cgpa !== '' && formData.cgpa != null ? `${formData.cgpa} / 10` : '' },
                  ].map((field) => (
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

            {/* Projects Management */}
            <div className="bg-white border border-[#E5E7EB] p-8 rounded-2xl space-y-6 shadow-sm">
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

              {/* Add Project Form Drawer */}
              {showProjectForm && (
                <div className="bg-[#F8FAFC] p-6 border border-[#E5E7EB] rounded-xl space-y-5 animate-in slide-in-from-top-2 duration-200 font-semibold text-[#4B5563]">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-[10px] font-bold text-[#94A3B8] uppercase mb-2">Project Title</label>
                      <input
                        type="text"
                        placeholder="PlacementConnect"
                        value={newProject.title}
                        onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
                        className="block w-full px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-xl text-[#111827] placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-[#7C3AED]/10 focus:border-[#7C3AED] text-xs font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-[#94A3B8] uppercase mb-2">Repository/Deployment Link</label>
                      <input
                        type="url"
                        placeholder="https://github.com/..."
                        value={newProject.link}
                        onChange={(e) => setNewProject({ ...newProject, link: e.target.value })}
                        className="block w-full px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-xl text-[#111827] placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-[#7C3AED]/10 focus:border-[#7C3AED] text-xs font-semibold"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-bold text-[#94A3B8] uppercase mb-2">Tech Stack (Comma-separated)</label>
                      <input
                        type="text"
                        placeholder="React.js, Node.js, Express, MongoDB"
                        value={newProject.techStack}
                        onChange={(e) => setNewProject({ ...newProject, techStack: e.target.value })}
                        className="block w-full px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-xl text-[#111827] placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-[#7C3AED]/10 focus:border-[#7C3AED] text-xs font-semibold"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-bold text-[#94A3B8] uppercase mb-2">Brief Description</label>
                      <textarea
                        rows="4"
                        placeholder="Describe the application features, challenges solved, and components built..."
                        value={newProject.description}
                        onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                        className="block w-full px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-xl text-[#111827] placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-[#7C3AED]/10 focus:border-[#7C3AED] text-xs font-semibold resize-none"
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddProject}
                    disabled={!newProject.title || !newProject.description}
                    className="px-4 py-2 bg-[#22C55E] hover:bg-[#16A34A] text-white font-bold rounded-xl text-xs disabled:opacity-50 transition-all shadow-sm"
                  >
                    Save Project
                  </button>
                </div>
              )}

              {/* Projects List Grid */}
              <div className="space-y-5">
                {projects.length === 0 ? (
                  <p className="text-[#4B5563] text-xs py-1 italic font-medium">No projects listed. Add one to strengthen your CV.</p>
                ) : (
                  projects.map((proj) => (
                    <div key={proj.id} className="p-6 bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl relative group">
                      <button
                        type="button"
                        onClick={() => handleRemoveProject(proj.id)}
                        className="absolute top-5 right-5 text-[#94A3B8] hover:text-rose-600 p-1.5 rounded-lg border border-[#E5E7EB] bg-white hover:bg-rose-50 transition-all duration-200 shadow-sm"
                        title="Remove Project"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <h4 className="text-sm font-bold text-[#111827] flex items-center gap-2">
                        {proj.title}
                        {proj.link && (
                          <a href={proj.link} target="_blank" rel="noopener noreferrer" className="text-[#94A3B8] hover:text-[#4B5563]">
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </h4>
                      <p className="text-xs text-[#4B5563] mt-2 leading-relaxed max-w-[90%] font-medium">{proj.description}</p>
                      
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
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Skills, certifications, resume */}
          <div className="space-y-8">
            {/* Resume Upload Box */}
            <div className="bg-white border border-[#E5E7EB] p-8 rounded-2xl space-y-5 shadow-sm">
              <h2 className="text-base font-bold text-[#111827] flex items-center gap-2.5 pb-4 border-b border-[#E5E7EB]">
                <FileText className="w-4.5 h-4.5 text-[#22C55E]" />
                Resume Document
              </h2>

              <div className="border-2 border-dashed border-[#E5E7EB] rounded-xl p-6 text-center bg-[#F8FAFC] hover:bg-[#F1F5F9] hover:border-[#22C55E]/40 transition-all relative cursor-pointer">
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={handleResumeUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  disabled={isUploading}
                />
                
                {isUploading ? (
                  <div className="py-6 space-y-3">
                    <div className="h-6 w-6 border-2 border-[#22C55E] border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-[10px] text-[#4B5563] font-semibold">Uploading to Cloudinary...</p>
                  </div>
                ) : resumeName ? (
                  <div className="space-y-3">
                    <Check className="w-8 h-8 text-[#22C55E] mx-auto" />
                    <p className="text-xs font-bold text-[#111827] truncate px-2">{resumeName}</p>
                    <p className="text-[10px] text-[#94A3B8] font-semibold">PDF Document Uploaded</p>
                    
                    <div className="flex justify-center gap-2 pt-3 font-semibold">
                      <a
                        href={resumeUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-[10px] font-bold text-[#22C55E] bg-white px-3 py-1.5 rounded-lg border border-[#E5E7EB] hover:text-[#16A34A] hover:border-[#22C55E]/20 transition-all shadow-sm"
                      >
                        <Eye className="w-3.5 h-3.5" /> View Resume
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 py-6">
                    <Upload className="w-8 h-8 text-[#94A3B8] mx-auto" />
                    <p className="text-xs font-bold text-[#4B5563]">Choose PDF Resume</p>
                    <p className="text-[10px] text-[#94A3B8] font-semibold">Max size 5MB (PDF only)</p>
                  </div>
                )}
              </div>
            </div>

            {/* Skills tags list */}
            <div className="bg-white border border-[#E5E7EB] p-8 rounded-2xl space-y-5 shadow-sm">
              <h2 className="text-base font-bold text-[#111827] flex items-center gap-2.5 pb-4 border-b border-[#E5E7EB]">
                <Award className="w-4.5 h-4.5 text-[#22C55E]" />
                Technical Skills
              </h2>

              <form onSubmit={handleAddSkill} className="flex gap-2.5">
                <input
                  type="text"
                  placeholder="React, Java, Python..."
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  className="flex-grow px-3 py-2 bg-[#F8FAFC] border border-[#E5E7EB] focus:bg-white rounded-xl text-[#111827] placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-[#7C3AED]/10 focus:border-[#7C3AED] text-xs font-semibold"
                />
                <button
                  type="submit"
                  className="p-2.5 bg-[#22C55E] hover:bg-[#16A34A] text-white rounded-xl transition-all shadow-sm"
                >
                  <Plus className="w-4 h-4 text-white" />
                </button>
              </form>

              <div className="flex flex-wrap gap-2 pt-2">
                {skills.length === 0 ? (
                  <span className="text-xs text-[#94A3B8] italic font-medium">No skills added yet.</span>
                ) : (
                  skills.map((skill) => (
                    <span 
                      key={skill} 
                      className="inline-flex items-center gap-1.5 bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/20 px-3 py-1.5 rounded-full text-xs font-bold"
                    >
                      {skill}
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(skill)}
                        className="text-[#22C55E] hover:text-rose-600 focus:outline-none text-[10px] font-extrabold"
                      >
                        ×
                      </button>
                    </span>
                  ))
                )}
              </div>
            </div>

            {/* Certifications list */}
            <div className="bg-white border border-[#E5E7EB] p-8 rounded-2xl space-y-5 shadow-sm">
              <h2 className="text-base font-bold text-[#111827] flex items-center gap-2.5 pb-4 border-b border-[#E5E7EB]">
                <Award className="w-4.5 h-4.5 text-[#22C55E]" />
                Certifications
              </h2>

              <form onSubmit={handleAddCert} className="space-y-3" noValidate>
                <div>
                  <label htmlFor="cert-name" className="pc-label">Certification name</label>
                  <input
                    id="cert-name"
                    type="text"
                    placeholder="e.g. AWS Cloud Practitioner"
                    value={certInput.name}
                    onChange={(e) => setCertInput({ ...certInput, name: e.target.value })}
                    className="pc-input text-xs"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="cert-issuer" className="pc-label">Issuer <span className="font-normal text-[#94A3B8]">(optional)</span></label>
                    <input
                      id="cert-issuer"
                      type="text"
                      placeholder="e.g. Amazon Web Services"
                      value={certInput.issuer}
                      onChange={(e) => setCertInput({ ...certInput, issuer: e.target.value })}
                      className="pc-input text-xs"
                    />
                  </div>
                  <div>
                    <label htmlFor="cert-date" className="pc-label">Date <span className="font-normal text-[#94A3B8]">(optional)</span></label>
                    <input
                      id="cert-date"
                      type="date"
                      value={certInput.date}
                      onChange={(e) => setCertInput({ ...certInput, date: e.target.value })}
                      className="pc-input text-xs"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="cert-url" className="pc-label">Certificate link <span className="font-normal text-[#94A3B8]">(optional)</span></label>
                  <input
                    id="cert-url"
                    type="url"
                    placeholder="https://"
                    value={certInput.url}
                    onChange={(e) => setCertInput({ ...certInput, url: e.target.value })}
                    className="pc-input text-xs"
                  />
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
                      <li
                        key={certKey(cert, index)}
                        className="flex items-start justify-between gap-3 bg-[#F8FAFC] border border-[#E5E7EB] px-4 py-3 rounded-xl text-xs text-[#4B5563]"
                      >
                        <div className="min-w-0">
                          <p className="font-semibold text-[#111827] break-words">{cert.name}</p>
                          {(cert.issuer || cert.date) && (
                            <p className="mt-0.5 text-[11px] text-[#6B7280]">
                              {[cert.issuer, cert.date].filter(Boolean).join(' · ')}
                            </p>
                          )}
                          {href && (
                            <a href={href} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-[#0B3D91] hover:underline">
                              View certificate <ExternalLink className="w-3 h-3" aria-hidden="true" />
                            </a>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveCert(index)}
                          className="text-[#94A3B8] hover:text-rose-600 transition-colors p-1 rounded-lg"
                          aria-label={`Remove ${cert.name}`}
                        >
                          <Trash2 className="w-4 h-4" aria-hidden="true" />
                        </button>
                      </li>
                    );
                  })
                )}
              </ul>
            </div>

            {/* Save Buttons */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => handleSaveProfile()}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-[#22C55E] hover:bg-[#16A34A] text-white font-bold rounded-xl text-xs transition-all shadow-md active:scale-[0.98]"
              >
                Save All Profile Data
                <ArrowRight className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
        </form>
      ) : (
        /* Professional CV Preview Mode - Light theme redesign */
        <div className="bg-white border border-[#E5E7EB] rounded-2xl overflow-hidden shadow-sm animate-in fade-in duration-300">
          {/* Header Banner */}
          <div className="bg-[#F8FAFC] p-10 border-b border-[#E5E7EB] relative">
            <div className="absolute top-8 right-8 flex gap-2">
              {resumeUrl && (
                <a
                  href={resumeUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-[#E5E7EB] hover:border-[#22C55E]/20 text-[#4B5563] hover:text-[#22C55E] rounded-lg text-xs font-bold transition-all shadow-sm"
                >
                  <FileText className="w-3.5 h-3.5 text-[#22C55E]" />
                  View PDF Resume
                </a>
              )}
            </div>
            
            <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
              <div className="h-16 w-16 rounded-xl bg-white border border-[#E5E7EB] flex items-center justify-center text-2xl font-bold text-[#7C3AED] shadow-sm">
                {formData.name.split(' ').map(n => n[0]).join('').toUpperCase()}
              </div>

              <div className="space-y-1">
                <h2 className="text-xl md:text-2xl font-bold text-[#111827]">{formData.name}</h2>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#4B5563] font-semibold">
                  <span className="flex items-center gap-1.5 text-[#4B5563]">
                    <Mail className="w-3.5 h-3.5 text-[#22C55E]" /> {formData.email}
                  </span>
                  <span className="text-[#94A3B8]">•</span>
                  <span className="font-mono text-[#4B5563]">ID: {formData.rollNumber}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-10 grid grid-cols-1 md:grid-cols-3 gap-10">
            {/* Left preview sidebar */}
            <div className="space-y-8 border-b md:border-b-0 md:border-r border-[#E5E7EB] pb-8 md:pb-0 md:pr-8">
              {/* Academics card */}
              <div className="space-y-4">
                <h3 className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest flex items-center gap-1.5">
                  <GraduationCap className="w-4 h-4 text-[#22C55E]" /> Academics
                </h3>
                <div className="bg-[#F8FAFC] p-5 border border-[#E5E7EB] rounded-xl space-y-3.5 font-semibold text-[#4B5563]">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[#94A3B8]">Degree</span>
                    <span className="text-[#4B5563]">B.Tech Engineering</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[#94A3B8]">Branch</span>
                    <span className="text-[#111827] font-bold">{formData.branch}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[#94A3B8]">Year / Semester</span>
                    <span className="text-[#4B5563]">Year {formData.year} (Sem {formData.year * 2})</span>
                  </div>
                  <div className="h-px bg-[#E5E7EB] my-1" />
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[#94A3B8]">Aggregate CGPA</span>
                    <span className="text-[#22C55E] font-bold bg-[#22C55E]/10 border border-[#22C55E]/20 px-3 py-0.5 rounded-full text-xs">
                      {formData.cgpa} / 10.00
                    </span>
                  </div>
                </div>
              </div>

              {/* Skills preview */}
              <div className="space-y-4">
                <h3 className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-[#22C55E]" /> Core Skills
                </h3>
                <div className="flex flex-wrap gap-2">
                  {skills.length === 0 ? (
                    <span className="text-xs text-[#94A3B8] italic font-medium">No skills added</span>
                  ) : (
                    skills.map((skill) => (
                      <span 
                        key={skill} 
                        className="bg-white text-[#4B5563] border border-[#E5E7EB] px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm"
                      >
                        {skill}
                      </span>
                    ))
                  )}
                </div>
              </div>

              {/* Certifications preview */}
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
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Right main timeline (Projects) */}
            <div className="md:col-span-2 space-y-8">
              <h3 className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest flex items-center gap-2 pb-3 border-b border-[#E5E7EB]">
                <Briefcase className="w-4 h-4 text-[#22C55E]" /> Portfolio Projects
              </h3>
              
              <div className="space-y-8">
                {projects.length === 0 ? (
                  <p className="text-[#94A3B8] text-xs italic font-medium">No projects listed</p>
                ) : (
                  projects.map((proj) => (
                    <div key={proj.id} className="space-y-3 relative pl-6 border-l border-[#E5E7EB]">
                      <div className="absolute left-[-4.5px] top-1.5 w-2 h-2 rounded-full bg-[#22C55E]" />
                      
                      <div className="flex items-center gap-2.5">
                        <h4 className="text-base font-bold text-[#111827] leading-tight">{proj.title}</h4>
                        {proj.link && (
                          <a
                            href={proj.link}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center text-[10px] text-[#22C55E] hover:text-[#16A34A] font-bold"
                          >
                            Code/Link <ExternalLink className="w-3 h-3 ml-0.5" />
                          </a>
                        )}
                      </div>
                      
                      <p className="text-xs text-[#4B5563] leading-relaxed font-medium">{proj.description}</p>
                      
                      {proj.techStack && proj.techStack.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-2">
                          {proj.techStack.map((tech, i) => (
                            <span key={i} className="text-[10px] bg-[#F8FAFC] text-[#4B5563] px-2.5 py-1 rounded border border-[#E5E7EB] font-semibold">
                              {tech}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
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
