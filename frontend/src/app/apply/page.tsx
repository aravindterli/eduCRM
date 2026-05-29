'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  GraduationCap, 
  Laptop, 
  Send, 
  CheckCircle2, 
  ChevronLeft, 
  Sparkles, 
  Globe, 
  ShieldCheck,
  Upload,
  ArrowRight,
  FileText,
  FileCheck,
  AlertTriangle
} from 'lucide-react';

function ApplyPageContent() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [applicationId, setApplicationId] = useState('');
  const [programs, setPrograms] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    location: '',
    eduBackground: 'High School',
    interestedProgramId: '',
    leadSource: 'Website'
  });

  // Onboarding Wizard State
  const [wizardStep, setWizardStep] = useState(1); // 1: ID, 2: Transcripts, 3: Resume, 4: Finished
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, { name: string; size: string }>>({});
  const [wizardError, setWizardError] = useState('');

  // Application details fetched for secure bypass
  const [appDetails, setAppDetails] = useState<any>(null);
  const [fetchingApp, setFetchingApp] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isDirectUpload, setIsDirectUpload] = useState(false);

  // Fetch Public Programs
  useEffect(() => {
    const fetchPublicPrograms = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/programs/public`);
        if (res.ok) {
          const data = await res.json();
          setPrograms(data);
          if (data.length > 0) {
            setFormData(prev => ({ ...prev, interestedProgramId: data[0].id }));
          }
        }
      } catch (err) {
        console.error('Failed to fetch programs', err);
      }
    };
    fetchPublicPrograms();
  }, []);

  // Pre-fill from URL & Fetch Application Details if applicationId is present
  useEffect(() => {
    const email = searchParams.get('email');
    const name = searchParams.get('name');
    if (email) setFormData(prev => ({ ...prev, email }));
    if (name) setFormData(prev => ({ ...prev, name }));

    const appId = searchParams.get('applicationId');
    if (appId) {
      setApplicationId(appId);
      setIsDirectUpload(true);
      setFetchingApp(true);
      setErrorMsg('');

      const fetchDetails = async () => {
        try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/applications/public/${appId}`);
          if (res.ok) {
            const data = await res.json();
            setAppDetails(data);
            
            // Populate already uploaded files
            if (data.documents && Array.isArray(data.documents)) {
              const uploaded: Record<string, { name: string; size: string }> = {};
              data.documents.forEach((doc: any) => {
                uploaded[doc.type] = { name: doc.name || 'Uploaded File', size: 'N/A' };
              });
              setUploadedFiles(uploaded);
            }
            setSuccess(true);
          } else {
            const err = await res.json();
            setErrorMsg(err.message || 'Failed to retrieve your secure onboarding booking details.');
          }
        } catch (err) {
          console.error('[Onboarding] Error loading application', err);
          setErrorMsg('Failed to connect to the document onboarding server.');
        } finally {
          setFetchingApp(false);
        }
      };

      fetchDetails();
    }
  }, [searchParams]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leads/public`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          qualification: programs.find(p => p.id === formData.interestedProgramId)?.name || 'N/A'
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.applicationId) {
          setApplicationId(data.applicationId);
        }
        setSuccess(true);
      } else {
        const err = await res.json();
        alert(err.message || 'Submission failed. Please try again.');
      }
    } catch (err) {
      console.error('Submission error', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setWizardError('');
    }
  };

  const getStepType = () => {
    const sector = appDetails?.tenant?.sector || 'GENERIC';
    if (wizardStep === 1) {
      return { 
        key: 'PASSPORT_ID', 
        label: sector === 'REAL_ESTATE' ? 'IdentityProof' : sector === 'HEALTHCARE' ? 'PatientIdentification' : 'IdentityVerification',
        desc: sector === 'REAL_ESTATE' ? 'Please upload your Passport, National ID, or Driver License.' : sector === 'HEALTHCARE' ? 'Please upload your health card or national identity.' : 'Please upload your official Passport, State ID, or Driver License.'
      };
    }
    if (wizardStep === 2) {
      return { 
        key: 'TRANSCRIPT', 
        label: sector === 'REAL_ESTATE' ? 'BookingAgreement' : sector === 'HEALTHCARE' ? 'MedicalReferrals' : 'AcademicTranscripts',
        desc: sector === 'REAL_ESTATE' ? 'Please upload your signed Property Booking Form or Proof of Funds.' : sector === 'HEALTHCARE' ? 'Please upload your doctor referral letter or previous clinical notes.' : 'Please upload your high school or undergraduate graduation transcripts.'
      };
    }
    return { 
      key: 'RESUME', 
      label: sector === 'REAL_ESTATE' ? 'AddressVerification' : sector === 'HEALTHCARE' ? 'InsuranceDocuments' : 'PersonalResume',
      desc: sector === 'REAL_ESTATE' ? 'Please upload a recent Utility Bill or registered lease for address verification.' : sector === 'HEALTHCARE' ? 'Please upload your private healthcare insurance card or policy coverage details.' : 'Please upload your updated professional curriculum vitae (CV) or resume.'
    };
  };

  const handleUploadFile = async () => {
    if (!selectedFile || !applicationId) return;
    
    setUploading(true);
    setWizardError('');
    const stepInfo = getStepType();

    try {
      const uploadData = new FormData();
      uploadData.append('file', selectedFile);
      uploadData.append('applicationId', applicationId);
      uploadData.append('type', stepInfo.key);
      uploadData.append('name', selectedFile.name);

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/documents/public/upload`, {
        method: 'POST',
        body: uploadData
      });

      const data = await res.json();

      if (res.ok && data.success) {
        const fileSizeStr = (selectedFile.size / (1024 * 1024)).toFixed(2) + ' MB';
        setUploadedFiles(prev => ({
          ...prev,
          [stepInfo.key]: { name: selectedFile.name, size: fileSizeStr }
        }));
        setSelectedFile(null);
        // Advance Step
        setWizardStep(prev => prev + 1);
      } else {
        setWizardError(data.message || 'File size exceeds system storage limit configurations.');
      }
    } catch (error) {
      console.error('File upload failed', error);
      setWizardError('Failed to establish contact with repository uploads server.');
    } finally {
      setUploading(false);
    }
  };

  const handleSkipStep = () => {
    setSelectedFile(null);
    setWizardError('');
    setWizardStep(prev => prev + 1);
  };

  // Math helper
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = 2;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  if (fetchingApp) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center font-sans">
        <div className="text-center space-y-4">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent animate-spin mx-auto rounded-none" />
          <p className="text-xs uppercase tracking-widest text-slate-400 font-black">Loading Secure Onboarding Session...</p>
        </div>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 relative font-sans">
        <div className="w-full max-w-md bg-slate-900 border border-rose-950 p-8 rounded-none text-left space-y-6">
          <div className="w-12 h-12 bg-rose-500/10 text-rose-500 flex items-center justify-center rounded-none mx-auto">
            <AlertTriangle size={24} />
          </div>
          <div className="text-center space-y-2">
            <h2 className="text-xl font-black text-white uppercase tracking-wider">Invalid Onboarding Link</h2>
            <p className="text-xs text-rose-450 leading-relaxed font-semibold">{errorMsg}</p>
          </div>
          <button
            onClick={() => window.location.href = '/apply'}
            className="w-full bg-slate-800 hover:bg-slate-700 text-white py-3 rounded-none text-xs font-black uppercase tracking-widest transition-all"
          >
            Go to Main Application
          </button>
        </div>
      </div>
    );
  }

  // Success Wizard Rendering (Multi-step upload)
  if (success) {
    const stepInfo = getStepType();
    
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 relative font-sans">
        <div className="w-full max-w-xl bg-slate-900 border border-slate-800 p-8 rounded-none text-left space-y-6">
          
          {/* Direct Upload Bypass details card */}
          {isDirectUpload && appDetails && (
            <div className="bg-slate-950 border border-slate-800 p-4 rounded-none space-y-2.5">
              <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-wider text-slate-500 border-b border-slate-850 pb-2">
                <span>Customer Onboarding Details</span>
                <span className="text-blue-500 font-bold">Secure Link verified</span>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-xs">
                <div>
                  <p className="text-[10px] uppercase font-black text-slate-500">Customer Name</p>
                  <p className="font-bold text-white truncate mt-0.5">{appDetails.lead?.name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-black text-slate-500">
                    {appDetails.tenant?.sector === 'REAL_ESTATE' ? 'Property Booking' : appDetails.tenant?.sector === 'HEALTHCARE' ? 'Medical Case/Service' : 'Program/Course'}
                  </p>
                  <p className="font-bold text-white truncate mt-0.5">{appDetails.program?.name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-black text-slate-500">Email Address</p>
                  <p className="font-bold text-white truncate mt-0.5">{appDetails.lead?.email || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-black text-slate-500">Organization</p>
                  <p className="font-bold text-white truncate mt-0.5">{appDetails.tenant?.name || 'N/A'}</p>
                </div>
              </div>
            </div>
          )}

          {wizardStep <= 3 ? (
            <div className="space-y-6">
              {/* Wizard Heading */}
              <div>
                <div className="flex justify-between items-center text-xs font-black uppercase tracking-widest text-slate-500 mb-2">
                  <span>OnboardingWizard</span>
                  <span>Step {wizardStep} of 3</span>
                </div>
                <h2 className="text-2xl font-black text-white uppercase tracking-wider">
                  {stepInfo.label}
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  {stepInfo.desc} (Max 10MB individual file size).
                </p>
              </div>

              {/* Progress Indicator */}
              <div className="grid grid-cols-3 gap-2">
                <div className={`h-1.5 rounded-none ${wizardStep >= 1 ? 'bg-blue-600' : 'bg-slate-800'}`} />
                <div className={`h-1.5 rounded-none ${wizardStep >= 2 ? 'bg-blue-600' : 'bg-slate-800'}`} />
                <div className={`h-1.5 rounded-none ${wizardStep >= 3 ? 'bg-blue-600' : 'bg-slate-800'}`} />
              </div>

              {/* Upload Panel */}
              <div className="border border-dashed border-slate-700 bg-slate-950 p-6 text-center space-y-4 rounded-none">
                <div className="w-12 h-12 bg-blue-600/10 text-blue-500 flex items-center justify-center mx-auto rounded-none">
                  <Upload size={24} />
                </div>
                
                {selectedFile ? (
                  <div className="space-y-1">
                    <p className="text-xs text-emerald-400 font-bold uppercase tracking-wider">Selected file</p>
                    <p className="text-sm font-semibold text-white truncate max-w-sm mx-auto">{selectedFile.name}</p>
                    <p className="text-[10px] text-slate-500 uppercase font-black">{formatBytes(selectedFile.size)}</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-sm text-slate-300 font-semibold">Select document file</p>
                    <p className="text-[10px] text-slate-500 uppercase font-black">PDF, PNG, or JPG formats supported</p>
                  </div>
                )}

                <div className="pt-2">
                  <label className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-none cursor-pointer transition-all inline-block">
                    Browse Files
                    <input 
                      type="file" 
                      onChange={handleFileChange} 
                      accept=".pdf,.png,.jpg,.jpeg" 
                      className="hidden" 
                    />
                  </label>
                </div>
              </div>

              {/* Quota limit error feedback */}
              {wizardError && (
                <div className="p-4 bg-rose-600/10 border border-rose-600/20 text-rose-500 rounded-none flex items-start gap-3">
                  <AlertTriangle size={18} className="shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <p className="font-bold uppercase tracking-wider">UPLOAD ATTEMPT REJECTED</p>
                    <p className="mt-1 text-slate-400">{wizardError}</p>
                  </div>
                </div>
              )}

              {/* Actions Footer */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleSkipStep}
                  className="flex-1 py-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white text-xs font-black uppercase tracking-widest transition-all rounded-none"
                >
                  Skip Step
                </button>
                <button
                  onClick={handleUploadFile}
                  disabled={!selectedFile || uploading}
                  className="flex-grow py-3 bg-blue-600 hover:bg-blue-500 text-white text-xs font-black uppercase tracking-widest disabled:opacity-50 transition-all rounded-none flex items-center justify-center gap-2"
                >
                  {uploading ? 'Uploading...' : 'Upload & Continue'}
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6 text-center">
              <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-none flex items-center justify-center mx-auto">
                <FileCheck size={32} />
              </div>
              
              <div className="space-y-2">
                <h2 className="text-3xl font-black text-white uppercase tracking-wider">
                  UploadSuccess
                </h2>
                <p className="text-sm text-slate-400 font-medium leading-relaxed max-w-sm mx-auto">
                  {isDirectUpload 
                    ? `Your onboarding paperwork has been successfully submitted to the verification desk.`
                    : 'Your registration is complete. Student documents are successfully linked to Application ID.'
                  }
                </p>
              </div>

              {/* Overview List */}
              <div className="bg-slate-950 border border-slate-850 p-4 text-left rounded-none space-y-2.5">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-850 pb-2">Documents status overview</p>
                {Object.keys(uploadedFiles).length === 0 ? (
                  <p className="text-xs text-slate-500 italic">No onboarding documents uploaded.</p>
                ) : (
                  Object.entries(uploadedFiles).map(([key, file]) => {
                    const sector = appDetails?.tenant?.sector || 'GENERIC';
                    let label = key === 'PASSPORT_ID' ? 'Identity Verification' : key === 'TRANSCRIPT' ? 'Academic Transcripts' : 'Personal Resume';
                    if (sector === 'REAL_ESTATE') {
                      label = key === 'PASSPORT_ID' ? 'Identity Proof' : key === 'TRANSCRIPT' ? 'Booking Agreement' : 'Address Verification';
                    } else if (sector === 'HEALTHCARE') {
                      label = key === 'PASSPORT_ID' ? 'Patient Identification' : key === 'TRANSCRIPT' ? 'Medical Referrals' : 'Insurance Documents';
                    }
                    return (
                      <div key={key} className="flex justify-between items-center text-xs">
                        <span className="text-slate-400 font-semibold">{label}</span>
                        <span className="text-emerald-400 font-bold truncate max-w-[200px]" title={file.name}>{file.name}</span>
                      </div>
                    );
                  })
                )}
              </div>

              <button
                onClick={() => {
                  if (isDirectUpload) {
                    alert("Thank you! All files have been securely updated. You may now close this browser window.");
                  } else {
                    window.location.reload();
                  }
                }}
                className="w-full bg-slate-800 hover:bg-slate-700 text-white py-4 rounded-none text-xs font-black uppercase tracking-widest transition-all"
              >
                {isDirectUpload ? 'Close Session' : 'Done'}
              </button>
            </div>
          )}

        </div>
      </div>
    );
  }

  // Application/Booking Registration Form (Pre-Booking Screen)
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-500/30 selection:text-blue-200">
      
      {/* Header/Decor */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-slate-950" />
      </div>

      <main className="relative z-10 max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 p-8 lg:py-24 items-center">
        
        {/* Left Content Column */}
        <div className="space-y-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-none bg-slate-900 border border-slate-800 text-blue-500 text-xs font-black uppercase tracking-[3px]">
            <Sparkles size={14} />
            Admissions Open 2026
          </div>

          <div className="space-y-6">
            <h1 className="text-6xl lg:text-7xl font-black tracking-tighter leading-[0.9] text-white">
              Unlock Your <span className="text-blue-500">Global</span> Future.
            </h1>
            <p className="text-lg text-slate-400 max-w-md leading-relaxed font-medium">
              Join a community of 50,000+ students achieving their academic dreams across 12 countries.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 pt-8 border-t border-slate-900">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-blue-500">
                <Globe size={18} />
                <span className="text-sm font-bold uppercase tracking-wider">Top Programs</span>
              </div>
              <p className="text-slate-500 text-xs font-medium">CS, Business, and Data Science from Global Universities.</p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-emerald-500">
                <ShieldCheck size={18} />
                <span className="text-sm font-bold uppercase tracking-wider">Verified Path</span>
              </div>
              <p className="text-slate-500 text-xs font-medium">100% success rate in admission guidance.</p>
            </div>
          </div>
        </div>

        {/* Right Form Column */}
        <div className="bg-slate-900 border border-slate-800 p-1 rounded-none shadow-2xl relative">
          <div className="bg-slate-950 p-8 lg:p-12 space-y-8 rounded-none">
            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-white uppercase tracking-wide">Application Form</h3>
              <p className="text-slate-500 text-sm font-medium">Please fill in your details for a free counseling session.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Full Name</label>
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-blue-500 transition-colors" size={18} />
                    <input
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      placeholder="Ex: David Miller"
                      className="w-full bg-slate-900 border border-slate-800 rounded-none py-4 pl-12 pr-4 text-sm outline-none focus:border-slate-700 transition-all text-white placeholder:text-slate-700"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Phone</label>
                  <div className="relative group">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-blue-500 transition-colors" size={18} />
                    <input
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                      placeholder="+1 000 000 0000"
                      className="w-full bg-slate-900 border border-slate-800 rounded-none py-4 pl-12 pr-4 text-sm outline-none focus:border-slate-700 transition-all text-white placeholder:text-slate-700"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Email</label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-blue-500 transition-colors" size={18} />
                    <input
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      type="email"
                      placeholder="david@example.com"
                      className="w-full bg-slate-900 border border-slate-800 rounded-none py-4 pl-12 pr-4 text-sm outline-none focus:border-slate-700 transition-all text-white placeholder:text-slate-700"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Location</label>
                  <div className="relative group">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-blue-500 transition-colors" size={18} />
                    <input
                      name="location"
                      value={formData.location}
                      onChange={handleChange}
                      required
                      placeholder="City, Country"
                      className="w-full bg-slate-900 border border-slate-800 rounded-none py-4 pl-12 pr-4 text-sm outline-none focus:border-slate-700 transition-all text-white placeholder:text-slate-700"
                    />
                  </div>
                </div>

              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Select Program</label>
                <div className="relative group">
                  <Laptop className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-blue-500 transition-colors" size={18} />
                  <select
                    name="interestedProgramId"
                    value={formData.interestedProgramId}
                    onChange={handleChange}
                    className="appearance-none w-full bg-slate-900 border border-slate-800 rounded-none py-4 pl-12 pr-4 text-sm outline-none focus:border-slate-700 transition-all text-white cursor-pointer"
                  >
                    {programs.map(p => (
                      <option key={p.id} value={p.id} className="bg-slate-900">{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Background</label>
                <div className="relative group">
                  <GraduationCap className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-blue-500 transition-colors" size={18} />
                  <select
                    name="eduBackground"
                    value={formData.eduBackground}
                    onChange={handleChange}
                    className="appearance-none w-full bg-slate-900 border border-slate-800 rounded-none py-4 pl-12 pr-4 text-sm outline-none focus:border-slate-700 transition-all text-white cursor-pointer"
                  >
                    <option className="bg-slate-900">High School</option>
                    <option className="bg-slate-900">Undergraduate</option>
                    <option className="bg-slate-900">Postgraduate</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-500 py-5 rounded-none text-white font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {loading ? 'Processing...' : (
                  <>
                    Submit Application
                    <Send size={18} />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

      </main>

      <footer className="relative z-10 p-8 border-t border-slate-900 mt-auto bg-slate-950">
        <div className="max-w-6xl mx-auto flex flex-col md:row-auto justify-between items-center gap-4">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">© 2026 CentraCRM Global. All rights reserved.</p>
          <div className="flex gap-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">
            <a href="#" className="hover:text-blue-500 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-blue-500 transition-colors">Terms of Service</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function ApplyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center font-sans">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent animate-spin mx-auto rounded-none" />
          <p className="text-xs uppercase tracking-widest text-slate-500 font-black">Initializing Onboarding Portal...</p>
        </div>
      </div>
    }>
      <ApplyPageContent />
    </Suspense>
  );
}
