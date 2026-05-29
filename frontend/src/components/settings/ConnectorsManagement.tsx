'use client';

import React from 'react';
import { Plug, Save, Check, AlertTriangle, Shield, Globe, MessageSquare, Phone, X, Settings, Mail, CreditCard, Copy, Plus, HelpCircle } from 'lucide-react';

export function ConnectorsManagement() {
  const [config, setConfig] = React.useState<any>({
    twilio: { accountSid: '', authToken: '', phoneNumber: '', twimlAppSid: '' },
    meta: { whatsappToken: '', phoneNumberId: '', wabaId: '' },
    smtp: { host: '', port: '', user: '', pass: '', from: '', secure: false },
    razorpay: { keyId: '', keySecret: '' },
    msg91: { authKey: '', senderId: '' },
    metaLeads: { verifyToken: '', accessToken: '', pageId: '', appSecret: '' },
    googleAds: { webhookKey: '' }
  });
  const [tenantId, setTenantId] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [message, setMessage] = React.useState({ type: '', text: '' });
  const [selectedConnector, setSelectedConnector] = React.useState<string | null>(null);
  const [showAddModal, setShowAddModal] = React.useState(false);
  const [showHelpModal, setShowHelpModal] = React.useState(false);
  const [connectorDefinitions, setConnectorDefinitions] = React.useState<any[]>([]);
  const [testing, setTesting] = React.useState(false);

  const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

  React.useEffect(() => {
    fetchConfig();
    fetchDefinitions();
  }, []);

  const handleTestConnection = async () => {
    if (!selectedConnector) return;
    
    setTesting(true);
    try {
      const token = localStorage.getItem('centracrm_token');
      const res = await fetch(`${backendUrl}/tenant/connectors/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          type: selectedConnector,
          config: config[selectedConnector.toLowerCase()]
        })
      });
      
      const data = await res.json();
      alert(data.message);
    } catch (error: any) {
      console.error('Failed to test connection:', error);
      alert('Failed to test connection. See console for details.');
    } finally {
      setTesting(false);
    }
  };

  const fetchDefinitions = async () => {
    try {
      const token = localStorage.getItem('centracrm_token');
      const res = await fetch(`${backendUrl}/tenant/connector-definitions`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (!Array.isArray(data)) {
        throw new Error('Data is not an array');
      }
      setConnectorDefinitions(data);
    } catch (error) {
      console.error('Failed to fetch connector definitions:', error);
    }
  };

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('centracrm_token');
      const res = await fetch(`${backendUrl}/tenant/config`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setConfig({
          twilio: { ...config.twilio, ...data.config.twilio },
          meta: { ...config.meta, ...data.config.meta },
          smtp: { ...config.smtp, ...data.config.smtp },
          razorpay: { ...config.razorpay, ...data.config.razorpay },
          msg91: { ...config.msg91, ...data.config.msg91 },
          metaLeads: { ...config.metaLeads, ...data.config.metaLeads },
          googleAds: { ...config.googleAds, ...data.config.googleAds }
        });
        setTenantId(data.tenantId);
      }
    } catch (error) {
      console.error('Failed to fetch config:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage({ type: '', text: '' });
    try {
      const token = localStorage.getItem('centracrm_token');
      const res = await fetch(`${backendUrl}/tenant/config`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ config })
      });
      if (res.ok) {
        setMessage({ type: 'success', text: `${selectedConnector} configuration saved successfully!` });
        setSelectedConnector(null); // Close modal
        fetchConfig(); // Refresh to get masked values
      } else {
        const data = await res.json();
        setMessage({ type: 'error', text: data.message || 'Failed to save configuration' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error occurred' });
    } finally {
      setSaving(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const isConfigured = (id: string) => {
    switch (id) {
      case 'Twilio': return !!config.twilio?.accountSid;
      case 'Meta': return !!config.meta?.whatsappToken;
      case 'SMTP': return !!config.smtp?.host;
      case 'Razorpay': return !!config.razorpay?.keyId;
      case 'MSG91': return !!config.msg91?.authKey;
      case 'MetaLeads': return !!config.metaLeads?.accessToken;
      case 'GoogleAds': return !!config.googleAds?.webhookKey;
      default: return false;
    }
  };

  const parseMarkdownLinks = (text: string) => {
    return text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, "<a href='$2' target='_blank' rel='noopener noreferrer' class='text-[#1A1A1A] hover:underline font-bold'>$1</a>");
  };

  const getConnectorLogo = (id: string) => {
    switch (id) {
      case 'Twilio':
        return (
          <div className="w-10 h-10 bg-[#F22F46] rounded-[8px] flex items-center justify-center flex-shrink-0 shadow-sm">
            <div className="grid grid-cols-2 gap-0.5">
              <div className="w-1.5 h-1.5 bg-white rounded-[2px]"></div>
              <div className="w-1.5 h-1.5 bg-white rounded-[2px]"></div>
              <div className="w-1.5 h-1.5 bg-white rounded-[2px]"></div>
              <div className="w-1.5 h-1.5 bg-white rounded-[2px]"></div>
            </div>
          </div>
        );
      case 'Meta':
        return (
          <div className="w-10 h-10 bg-[#25D366] rounded-[8px] flex items-center justify-center text-white flex-shrink-0 shadow-sm">
            <MessageSquare size={20} fill="white" />
          </div>
        );
      case 'SMTP':
        return (
          <div className="w-10 h-10 bg-slate-600 rounded-[8px] flex items-center justify-center text-white flex-shrink-0 shadow-sm">
            <Mail size={20} fill="white" />
          </div>
        );
      case 'MSG91':
        return (
          <div className="w-10 h-10 bg-[#E02020] rounded-[8px] flex items-center justify-center text-white flex-shrink-0 shadow-sm">
            <MessageSquare size={20} />
          </div>
        );
      case 'MetaLeads':
        return (
          <div className="w-10 h-10 bg-[#1877F4] rounded-[8px] flex items-center justify-center text-white flex-shrink-0 font-bold text-lg shadow-sm">
            f
          </div>
        );
      case 'GoogleAds':
        return (
          <div className="w-10 h-10 bg-[#4285F4] rounded-[8px] flex items-center justify-center text-white flex-shrink-0 font-bold text-lg shadow-sm">
            G
          </div>
        );
      default:
        return (
          <div className="w-10 h-10 bg-slate-400 rounded-[8px] flex items-center justify-center text-white flex-shrink-0 shadow-sm">
            <Plug size={20} />
          </div>
        );
    }
  };

  const getConnectorDescription = (id: string) => {
    switch (id) {
      case 'Twilio': return 'Voice calls and SMS services.';
      case 'Meta': return 'WhatsApp Business API.';
      case 'SMTP': return 'Custom SMTP for official emails.';
      case 'MSG91': return 'Indian SMS gateway.';
      case 'MetaLeads': return 'Capture leads from Facebook/Instagram.';
      case 'GoogleAds': return 'Capture leads from Google Ads.';
      default: return 'Configure this connector.';
    }
  };

  const categories = Array.from(new Set(connectorDefinitions.map((c: any) => c.category).filter(Boolean)));
  const configuredConnectors = connectorDefinitions.filter((c: any) => isConfigured(c.id));

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[300px]">
        <div className="text-slate-500 animate-pulse font-bold text-xs uppercase tracking-widest">Loading Configurations...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-[#1A1A1A] relative min-h-[400px]">
      {selectedConnector ? (
        <div className="space-y-6 bg-white border border-black/6 rounded-[16px] p-6 shadow-sm">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                {getConnectorLogo(selectedConnector)}
              </div>
              <div>
                <h3 className="font-bold text-base text-[#1A1A1A]">{selectedConnector} Configuration</h3>
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="text-xs text-[#999]">Enter your credentials below</p>
                  <span className="text-[#DDD]">|</span>
                  <button
                    onClick={() => setShowHelpModal(true)}
                    className="text-xs font-bold text-[#1A1A1A] hover:underline flex items-center gap-1"
                  >
                    How to get keys?
                  </button>
                </div>
              </div>
            </div>
            <button
              onClick={() => setSelectedConnector(null)}
              className="bg-[#F9F7F4] border border-black/8 hover:bg-black/5 px-4 py-2 rounded-[8px] text-xs font-bold transition-all text-[#1A1A1A] flex items-center gap-2 self-start sm:self-auto shadow-sm"
            >
              <X size={14} /> Back
            </button>
          </div>

          {/* Form Content */}
          <div className="space-y-5 pt-2 border-t border-black/5">
            {/* Security Note */}
            <div className="p-3 rounded-[8px] bg-amber-50 border border-amber-100 text-amber-800 flex items-start gap-2.5 text-xs">
              <Shield size={15} className="mt-0.5 flex-shrink-0 text-amber-700" />
              <span>Sensitive fields will be masked with asterisks after saving.</span>
            </div>

            {/* Webhook URLs (Read Only) */}
            {selectedConnector === 'Twilio' && (
              <div className="space-y-3.5 p-4 bg-[#F9F7F4] rounded-[12px] border border-black/6">
                <h4 className="text-[10px] font-bold text-[#888] uppercase tracking-wider">Your Webhook URLs</h4>
                <div className="space-y-2">
                  <div>
                    <label className="text-[11px] font-bold text-[#777]">Voice Webhook</label>
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        type="text"
                        readOnly
                        value={`${backendUrl}/leads/twilio/voice?tenantId=${tenantId}`}
                        className="w-full bg-white border border-black/8 rounded-[8px] px-3 py-2 text-xs outline-none text-[#555] font-mono"
                      />
                      <button type="button" onClick={() => copyToClipboard(`${backendUrl}/leads/twilio/voice?tenantId=${tenantId}`)} className="p-2 hover:bg-black/5 rounded-[8px] text-[#1A1A1A]">
                        <Copy size={15} />
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-[#777]">Status Callback</label>
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        type="text"
                        readOnly
                        value={`${backendUrl}/leads/twilio/status?tenantId=${tenantId}`}
                        className="w-full bg-white border border-black/8 rounded-[8px] px-3 py-2 text-xs outline-none text-[#555] font-mono"
                      />
                      <button type="button" onClick={() => copyToClipboard(`${backendUrl}/leads/twilio/status?tenantId=${tenantId}`)} className="p-2 hover:bg-black/5 rounded-[8px] text-[#1A1A1A]">
                        <Copy size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Meta Webhook */}
            {selectedConnector === 'Meta' && (
              <div className="space-y-3.5 p-4 bg-[#F9F7F4] rounded-[12px] border border-black/6">
                <h4 className="text-[10px] font-bold text-[#888] uppercase tracking-wider">Your Webhook URL</h4>
                <div>
                  <label className="text-[11px] font-bold text-[#777]">WhatsApp Webhook</label>
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="text"
                      readOnly
                      value={`${backendUrl}/whatsapp/webhook?tenantId=${tenantId}`}
                      className="w-full bg-white border border-black/8 rounded-[8px] px-3 py-2 text-xs outline-none text-[#555] font-mono"
                    />
                    <button type="button" onClick={() => copyToClipboard(`${backendUrl}/whatsapp/webhook?tenantId=${tenantId}`)} className="p-2 hover:bg-black/5 rounded-[8px] text-[#1A1A1A]">
                      <Copy size={15} />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {selectedConnector && (
              connectorDefinitions.find(d => d.id === selectedConnector) ? (
                <div className="space-y-4">
                  {connectorDefinitions.find(d => d.id === selectedConnector)?.fields.map((field: any) => (
                    <div key={field.name} className="space-y-1">
                      <label className="text-[10px] font-bold text-[#888] uppercase tracking-wider">{field.label}</label>
                      <input
                        type={field.isSensitive ? 'password' : 'text'}
                        value={config[selectedConnector.toLowerCase()]?.[field.name] || ''}
                        onChange={(e) => setConfig({
                          ...config,
                          [selectedConnector.toLowerCase()]: {
                            ...config[selectedConnector.toLowerCase()],
                            [field.name]: e.target.value
                          }
                        })}
                        className="w-full bg-[#F9F7F4] border border-black/8 rounded-[8px] px-4 py-2.5 text-[13px] text-[#1A1A1A] outline-none focus:border-black/20 focus:ring-2 focus:ring-black/5 transition-all text-[#1A1A1A] placeholder:text-[#BBB]"
                        placeholder={field.placeholder}
                      />
                    </div>
                  ))}
                  <div className="flex justify-between items-center mt-4 pt-4 border-t border-black/5">
                    <button
                      type="button"
                      onClick={handleTestConnection}
                      disabled={testing}
                      className="text-xs text-[#1A1A1A] hover:underline font-bold disabled:opacity-50"
                    >
                      {testing ? 'Testing...' : 'Test Connection'}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Twilio Fields */}
                  {selectedConnector === 'Twilio' && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-[#888] uppercase tracking-wider">Account SID</label>
                          <input
                            type="text"
                            value={config.twilio.accountSid}
                            onChange={(e) => setConfig({ ...config, twilio: { ...config.twilio, accountSid: e.target.value } })}
                            className="w-full bg-[#F9F7F4] border border-black/8 rounded-[8px] px-4 py-2.5 text-[13px] text-[#1A1A1A] outline-none focus:border-black/20 focus:ring-2 focus:ring-black/5 transition-all placeholder:text-[#BBB]"
                            placeholder="ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-[#888] uppercase tracking-wider">Auth Token</label>
                          <input
                            type="text"
                            value={config.twilio.authToken}
                            onChange={(e) => setConfig({ ...config, twilio: { ...config.twilio, authToken: e.target.value } })}
                            className="w-full bg-[#F9F7F4] border border-black/8 rounded-[8px] px-4 py-2.5 text-[13px] text-[#1A1A1A] outline-none focus:border-black/20 focus:ring-2 focus:ring-black/5 transition-all placeholder:text-[#BBB]"
                            placeholder={config.twilio.authToken === '********' ? '********' : 'Auth Token'}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-[#888] uppercase tracking-wider">Phone Number</label>
                          <input
                            type="text"
                            value={config.twilio.phoneNumber}
                            onChange={(e) => setConfig({ ...config, twilio: { ...config.twilio, phoneNumber: e.target.value } })}
                            className="w-full bg-[#F9F7F4] border border-black/8 rounded-[8px] px-4 py-2.5 text-[13px] text-[#1A1A1A] outline-none focus:border-black/20 focus:ring-2 focus:ring-black/5 transition-all placeholder:text-[#BBB]"
                            placeholder="+1234567890"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-[#888] uppercase tracking-wider">TwiML App SID (Optional)</label>
                          <input
                            type="text"
                            value={config.twilio.twimlAppSid}
                            onChange={(e) => setConfig({ ...config, twilio: { ...config.twilio, twimlAppSid: e.target.value } })}
                            className="w-full bg-[#F9F7F4] border border-black/8 rounded-[8px] px-4 py-2.5 text-[13px] text-[#1A1A1A] outline-none focus:border-black/20 focus:ring-2 focus:ring-black/5 transition-all placeholder:text-[#BBB]"
                            placeholder="APXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Meta Fields */}
                  {selectedConnector === 'Meta' && (
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-[#888] uppercase tracking-wider">WhatsApp Access Token</label>
                        <input
                          type="text"
                          value={config.meta.whatsappToken}
                          onChange={(e) => setConfig({ ...config, meta: { ...config.meta, whatsappToken: e.target.value } })}
                          className="w-full bg-[#F9F7F4] border border-black/8 rounded-[8px] px-4 py-2.5 text-[13px] text-[#1A1A1A] outline-none focus:border-black/20 focus:ring-2 focus:ring-black/5 transition-all placeholder:text-[#BBB]"
                          placeholder={config.meta.whatsappToken === '********' ? '********' : 'EAA...'}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-[#888] uppercase tracking-wider">Phone Number ID</label>
                          <input
                            type="text"
                            value={config.meta.phoneNumberId}
                            onChange={(e) => setConfig({ ...config, meta: { ...config.meta, phoneNumberId: e.target.value } })}
                            className="w-full bg-[#F9F7F4] border border-black/8 rounded-[8px] px-4 py-2.5 text-[13px] text-[#1A1A1A] outline-none focus:border-black/20 focus:ring-2 focus:ring-black/5 transition-all placeholder:text-[#BBB]"
                            placeholder="105XXXXXXXXXXXXXXXX"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-[#888] uppercase tracking-wider">WhatsApp Business Account ID (WABA ID)</label>
                          <input
                            type="text"
                            value={config.meta.wabaId}
                            onChange={(e) => setConfig({ ...config, meta: { ...config.meta, wabaId: e.target.value } })}
                            className="w-full bg-[#F9F7F4] border border-black/8 rounded-[8px] px-4 py-2.5 text-[13px] text-[#1A1A1A] outline-none focus:border-black/20 focus:ring-2 focus:ring-black/5 transition-all placeholder:text-[#BBB]"
                            placeholder="148XXXXXXXXXXXXXXXX"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* SMTP Fields */}
                  {selectedConnector === 'SMTP' && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-[#888] uppercase tracking-wider">SMTP Host</label>
                          <input
                            type="text"
                            value={config.smtp.host}
                            onChange={(e) => setConfig({ ...config, smtp: { ...config.smtp, host: e.target.value } })}
                            className="w-full bg-[#F9F7F4] border border-black/8 rounded-[8px] px-4 py-2.5 text-[13px] text-[#1A1A1A] outline-none focus:border-black/20 focus:ring-2 focus:ring-black/5 transition-all placeholder:text-[#BBB]"
                            placeholder="smtp.example.com"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-[#888] uppercase tracking-wider">SMTP Port</label>
                          <input
                            type="text"
                            value={config.smtp.port}
                            onChange={(e) => setConfig({ ...config, smtp: { ...config.smtp, port: e.target.value } })}
                            className="w-full bg-[#F9F7F4] border border-black/8 rounded-[8px] px-4 py-2.5 text-[13px] text-[#1A1A1A] outline-none focus:border-black/20 focus:ring-2 focus:ring-black/5 transition-all placeholder:text-[#BBB]"
                            placeholder="587"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-[#888] uppercase tracking-wider">Username</label>
                          <input
                            type="text"
                            value={config.smtp.user}
                            onChange={(e) => setConfig({ ...config, smtp: { ...config.smtp, user: e.target.value } })}
                            className="w-full bg-[#F9F7F4] border border-black/8 rounded-[8px] px-4 py-2.5 text-[13px] text-[#1A1A1A] outline-none focus:border-black/20 focus:ring-2 focus:ring-black/5 transition-all placeholder:text-[#BBB]"
                            placeholder="user@example.com"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-[#888] uppercase tracking-wider">Password</label>
                          <input
                            type="text"
                            value={config.smtp.pass}
                            onChange={(e) => setConfig({ ...config, smtp: { ...config.smtp, pass: e.target.value } })}
                            className="w-full bg-[#F9F7F4] border border-black/8 rounded-[8px] px-4 py-2.5 text-[13px] text-[#1A1A1A] outline-none focus:border-black/20 focus:ring-2 focus:ring-black/5 transition-all placeholder:text-[#BBB]"
                            placeholder={config.smtp.pass === '********' ? '********' : 'Password'}
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-[#888] uppercase tracking-wider">From Email</label>
                        <input
                          type="text"
                          value={config.smtp.from}
                          onChange={(e) => setConfig({ ...config, smtp: { ...config.smtp, from: e.target.value } })}
                          className="w-full bg-[#F9F7F4] border border-black/8 rounded-[8px] px-4 py-2.5 text-[13px] text-[#1A1A1A] outline-none focus:border-black/20 focus:ring-2 focus:ring-black/5 transition-all placeholder:text-[#BBB]"
                          placeholder="noreply@example.com"
                        />
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <input
                          type="checkbox"
                          checked={config.smtp.secure}
                          onChange={(e) => setConfig({ ...config, smtp: { ...config.smtp, secure: e.target.checked } })}
                          className="rounded-[4px] border-black/20 text-[#1A1A1A] focus:ring-0 focus:ring-offset-0 cursor-pointer"
                        />
                        <label className="text-[11px] font-bold text-[#555] uppercase tracking-wider select-none cursor-pointer">Use Secure Connection (SSL/TLS)</label>
                      </div>
                    </div>
                  )}

                  {/* Razorpay Fields */}
                  {selectedConnector === 'Razorpay' && (
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-[#888] uppercase tracking-wider">Key ID</label>
                        <input
                          type="text"
                          value={config.razorpay.keyId}
                          onChange={(e) => setConfig({ ...config, razorpay: { ...config.razorpay, keyId: e.target.value } })}
                          className="w-full bg-[#F9F7F4] border border-black/8 rounded-[8px] px-4 py-2.5 text-[13px] text-[#1A1A1A] outline-none focus:border-black/20 focus:ring-2 focus:ring-black/5 transition-all placeholder:text-[#BBB]"
                          placeholder="rzp_live_..."
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-[#888] uppercase tracking-wider">Key Secret</label>
                        <input
                          type="text"
                          value={config.razorpay.keySecret}
                          onChange={(e) => setConfig({ ...config, razorpay: { ...config.razorpay, keySecret: e.target.value } })}
                          className="w-full bg-[#F9F7F4] border border-black/8 rounded-[8px] px-4 py-2.5 text-[13px] text-[#1A1A1A] outline-none focus:border-black/20 focus:ring-2 focus:ring-black/5 transition-all placeholder:text-[#BBB]"
                          placeholder={config.razorpay.keySecret === '********' ? '********' : 'Key Secret'}
                        />
                      </div>
                    </div>
                  )}

                  {/* MSG91 Fields */}
                  {selectedConnector === 'MSG91' && (
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-[#888] uppercase tracking-wider">Auth Key</label>
                        <input
                          type="text"
                          value={config.msg91.authKey}
                          onChange={(e) => setConfig({ ...config, msg91: { ...config.msg91, authKey: e.target.value } })}
                          className="w-full bg-[#F9F7F4] border border-black/8 rounded-[8px] px-4 py-2.5 text-[13px] text-[#1A1A1A] outline-none focus:border-black/20 focus:ring-2 focus:ring-black/5 transition-all placeholder:text-[#BBB]"
                          placeholder="Auth Key"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-[#888] uppercase tracking-wider">Sender ID</label>
                        <input
                          type="text"
                          value={config.msg91.senderId}
                          onChange={(e) => setConfig({ ...config, msg91: { ...config.msg91, senderId: e.target.value } })}
                          className="w-full bg-[#F9F7F4] border border-black/8 rounded-[8px] px-4 py-2.5 text-[13px] text-[#1A1A1A] outline-none focus:border-black/20 focus:ring-2 focus:ring-black/5 transition-all placeholder:text-[#BBB]"
                          placeholder="ABCDEF"
                        />
                      </div>
                    </div>
                  )}

                  {/* MetaLeads Fields */}
                  {selectedConnector === 'MetaLeads' && (
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-[#888] uppercase tracking-wider">Verify Token</label>
                        <input
                          type="text"
                          value={config.metaLeads.verifyToken}
                          onChange={(e) => setConfig({ ...config, metaLeads: { ...config.metaLeads, verifyToken: e.target.value } })}
                          className="w-full bg-[#F9F7F4] border border-black/8 rounded-[8px] px-4 py-2.5 text-[13px] text-[#1A1A1A] outline-none focus:border-black/20 focus:ring-2 focus:ring-black/5 transition-all placeholder:text-[#BBB]"
                          placeholder="Verify Token"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-[#888] uppercase tracking-wider">Access Token</label>
                        <input
                          type="text"
                          value={config.metaLeads.accessToken}
                          onChange={(e) => setConfig({ ...config, metaLeads: { ...config.metaLeads, accessToken: e.target.value } })}
                          className="w-full bg-[#F9F7F4] border border-black/8 rounded-[8px] px-4 py-2.5 text-[13px] text-[#1A1A1A] outline-none focus:border-black/20 focus:ring-2 focus:ring-black/5 transition-all placeholder:text-[#BBB]"
                          placeholder={config.metaLeads.accessToken === '********' ? '********' : 'Access Token'}
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-[#888] uppercase tracking-wider">Page ID</label>
                        <input
                          type="text"
                          value={config.metaLeads.pageId}
                          onChange={(e) => setConfig({ ...config, metaLeads: { ...config.metaLeads, pageId: e.target.value } })}
                          className="w-full bg-[#F9F7F4] border border-black/8 rounded-[8px] px-4 py-2.5 text-[13px] text-[#1A1A1A] outline-none focus:border-black/20 focus:ring-2 focus:ring-black/5 transition-all placeholder:text-[#BBB]"
                          placeholder="Page ID"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-[#888] uppercase tracking-wider">App Secret</label>
                        <input
                          type="text"
                          value={config.metaLeads.appSecret}
                          onChange={(e) => setConfig({ ...config, metaLeads: { ...config.metaLeads, appSecret: e.target.value } })}
                          className="w-full bg-[#F9F7F4] border border-black/8 rounded-[8px] px-4 py-2.5 text-[13px] text-[#1A1A1A] outline-none focus:border-black/20 focus:ring-2 focus:ring-black/5 transition-all placeholder:text-[#BBB]"
                          placeholder={config.metaLeads.appSecret === '********' ? '********' : 'App Secret'}
                        />
                      </div>
                    </div>
                  )}

                  {/* GoogleAds Fields */}
                  {selectedConnector === 'GoogleAds' && (
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-[#888] uppercase tracking-wider">Webhook Key</label>
                      <input
                        type="text"
                        value={config.googleAds.webhookKey}
                        onChange={(e) => setConfig({ ...config, googleAds: { ...config.googleAds, webhookKey: e.target.value } })}
                        className="w-full bg-[#F9F7F4] border border-black/8 rounded-[8px] px-4 py-2.5 text-[13px] text-[#1A1A1A] outline-none focus:border-black/20 focus:ring-2 focus:ring-black/5 transition-all placeholder:text-[#BBB]"
                        placeholder="Webhook Key"
                      />
                    </div>
                  )}
                </>
              )
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <button type="button" onClick={() => setSelectedConnector(null)} className="flex-1 py-2.5 text-sm font-semibold hover:bg-black/5 rounded-[8px] transition-colors text-[#777] hover:text-[#1A1A1A]">
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 bg-[#1A1A1A] hover:bg-[#333] py-2.5 rounded-[8px] text-sm font-bold shadow-sm transition-all disabled:opacity-50 text-white flex items-center justify-center gap-2"
              >
                {saving ? 'Saving...' : <><Save size={15} /> Save Config</>}
              </button>
            </div>
          </div>
        </div>
      ) : showAddModal ? (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-white border border-black/6 rounded-[16px] p-6 shadow-sm">
            <div>
              <h3 className="text-base font-bold flex items-center gap-2 text-[#1A1A1A]">
                <div className="w-1.5 h-1.5 rounded-full bg-[#1A1A1A]" />
                Add Connector
              </h3>
              <p className="text-xs text-[#999] mt-0.5">Select a service to configure</p>
            </div>
            <button
              onClick={() => setShowAddModal(false)}
              className="bg-[#F9F7F4] border border-black/8 hover:bg-black/5 px-4 py-2 rounded-[8px] text-xs font-bold transition-all text-[#1A1A1A] flex items-center gap-2 shadow-sm"
            >
              <X size={14} /> Back
            </button>
          </div>

          <div className="space-y-6 pt-2">
            {categories.map(cat => {
              const catConnectors = connectorDefinitions.filter((c: any) => c.category === cat);
              return (
                <div key={cat} className="space-y-3">
                  <h4 className="text-[10px] font-bold text-[#888] uppercase tracking-wider px-1">{cat}</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {catConnectors.map((conn: any) => {
                      const isConfig = isConfigured(conn.id);
                      return (
                        <div
                          key={conn.id}
                          onClick={() => {
                            setShowAddModal(false);
                            setSelectedConnector(conn.id);
                          }}
                          className={`p-5 border flex flex-col items-center justify-center text-center gap-3 cursor-pointer transition-all rounded-[12px] ${
                            isConfig ? 'bg-emerald-50/50 border-emerald-200 hover:border-emerald-400' : 'bg-white border-black/8 hover:border-black/20 hover:shadow-md'
                          }`}
                        >
                          {getConnectorLogo(conn.id)}
                          <div>
                            <h4 className="font-bold text-[13px] text-[#1A1A1A]">{conn.name}</h4>
                            <p className="text-[10px] text-[#777] line-clamp-2 mt-0.5 leading-normal">{getConnectorDescription(conn.id)}</p>
                          </div>
                          {isConfig && (
                            <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-[4px] mt-0.5">
                              Connected
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <>
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-white border border-black/6 rounded-[16px] p-6 shadow-sm">
            <div>
              <h3 className="text-base font-bold flex items-center gap-2 text-[#1A1A1A]">
                <div className="w-1.5 h-1.5 rounded-full bg-[#1A1A1A]" />
                Connectors
              </h3>
              <p className="text-[12px] text-[#999] mt-0.5">Manage your third-party integrations and lead sources.</p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-[#1A1A1A] hover:bg-[#333] px-5 py-2.5 rounded-[8px] text-xs font-bold transition-all shadow-sm text-white flex items-center gap-2 self-start sm:self-auto"
            >
              <Plus size={14} /> Add Connector
            </button>
          </div>

          {message.text && (
            <div className={`p-4 rounded-[8px] flex items-center gap-3 border ${
              message.type === 'success' ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' : 'bg-red-50 border border-red-200 text-red-700'
            }`}>
              {message.type === 'success' ? <Check size={16} /> : <AlertTriangle size={16} />}
              <span className="text-sm font-medium">{message.text}</span>
            </div>
          )}

          <div className="space-y-6 pt-2">
            {categories.map(cat => {
              const catConnectors = configuredConnectors.filter(c => c.category === cat);
              if (catConnectors.length === 0) return null;

              return (
                <div key={cat} className="space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-[#888] uppercase tracking-wider">{cat} Connectors</span>
                    <div className="h-px bg-black/5 flex-1" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {catConnectors.map((conn) => (
                      <div
                        key={conn.id}
                        onClick={() => setSelectedConnector(conn.id)}
                        className="bg-white border border-black/6 rounded-[12px] overflow-hidden transition-all duration-300 flex flex-col justify-between cursor-pointer hover:border-black/20 hover:scale-[1.02] hover:shadow-md"
                      >
                        <div className="p-6">
                          <div className="flex items-center justify-between mb-4">
                            {getConnectorLogo(conn.id)}
                            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-[4px] bg-emerald-50 text-emerald-700 border border-emerald-100">
                              Connected
                            </span>
                          </div>
                          <h3 className="text-[14px] font-bold text-[#1A1A1A] mb-1">{conn.name}</h3>
                          <p className="text-xs text-[#777] leading-normal">{getConnectorDescription(conn.id)}</p>
                        </div>

                        <div className="px-6 py-3.5 bg-[#F9F7F4] border-t border-black/5 flex items-center justify-between text-xs text-[#777] hover:text-[#1A1A1A] transition-colors">
                          <span className="font-bold">Click to configure</span>
                          <Settings size={13} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            {configuredConnectors.length === 0 && (
              <div className="col-span-full flex flex-col items-center justify-center p-12 bg-white border border-black/6 border-dashed rounded-[16px]">
                <Plug size={40} className="text-[#888] mb-4 opacity-40" />
                <h3 className="text-base font-bold text-[#1A1A1A] mb-1">No Active Connectors</h3>
                <p className="text-xs text-[#999] mb-6 text-center max-w-sm leading-normal">You haven't configured any integrations yet. Choose a provider below to get started.</p>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="bg-[#1A1A1A] hover:bg-[#333] px-6 py-2.5 rounded-[8px] text-xs font-bold transition-all text-white flex items-center gap-2 shadow-sm"
                >
                  <Plus size={14} /> Choose a Provider
                </button>
              </div>
            )}

            {configuredConnectors.length > 0 && (
              <div className="pt-4 flex justify-center">
                <div
                  onClick={() => setShowAddModal(true)}
                  className="bg-white border border-black/6 border-dashed rounded-[12px] flex flex-col items-center justify-center p-6 cursor-pointer hover:border-black/20 hover:bg-[#F9F7F4]/40 transition-all duration-300 w-full max-w-xs text-center"
                >
                  <div className="w-10 h-10 rounded-[8px] bg-[#F9F7F4] border border-black/6 flex items-center justify-center text-[#777] mb-3 shadow-sm">
                    <Plus size={18} />
                  </div>
                  <span className="text-xs font-bold text-[#1A1A1A]">Add Another Connector</span>
                  <span className="text-[10px] text-[#999] mt-0.5">Connect more services</span>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Help Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white border border-black/8 rounded-[16px] w-full max-w-2xl flex flex-col max-h-[90vh] shadow-2xl overflow-hidden text-[#1A1A1A] animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-6 border-b border-black/5 flex justify-between items-center bg-[#F9F7F4]">
              <div>
                <h3 className="font-bold text-base text-[#1A1A1A]">How to get {selectedConnector} keys</h3>
                <p className="text-xs text-[#999] mt-0.5">Follow these steps to find your credentials</p>
              </div>
              <button type="button" onClick={() => setShowHelpModal(false)} className="p-1 rounded-full hover:bg-black/5 text-[#888] hover:text-[#1A1A1A]">
                <X size={18} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-5 overflow-y-auto custom-scrollbar text-[#555] text-xs">
              {connectorDefinitions.find(d => d.id === selectedConnector) ? (
                <div className="space-y-4">
                  <ol className="list-decimal list-inside space-y-4 text-xs font-semibold leading-relaxed">
                    {connectorDefinitions.find(d => d.id === selectedConnector)?.instructions.map((step: string, index: number) => (
                      <li key={index} dangerouslySetInnerHTML={{ __html: parseMarkdownLinks(step) }} className="bg-[#F9F7F4] p-3 border border-black/6 rounded-[8px]" />
                    ))}
                  </ol>
                </div>
              ) : (
                <>
                  {selectedConnector === 'Twilio' && (
                    <div className="space-y-4">
                      <div className="p-3 bg-blue-50 border border-blue-100 rounded-[8px] text-xs text-blue-700 flex items-start gap-2.5">
                        <Plug size={14} className="mt-0.5 flex-shrink-0" />
                        <span>Twilio provides communication APIs for SMS and Voice.</span>
                      </div>
                      <ol className="list-decimal list-inside space-y-3 font-semibold text-xs leading-relaxed">
                        <li className="bg-[#F9F7F4] p-3 border border-black/6 rounded-[8px]">
                          Go to <a href="https://www.twilio.com/console" target="_blank" rel="noopener noreferrer" className="text-[#1A1A1A] hover:underline font-bold">Twilio Console</a> and log in or sign up.
                        </li>
                        <li className="bg-[#F9F7F4] p-3 border border-black/6 rounded-[8px]">
                          On the dashboard, find the <strong>Account Info</strong> section.
                        </li>
                        <li className="bg-[#F9F7F4] p-3 border border-black/6 rounded-[8px]">
                          Copy the <strong>Account SID</strong> and <strong>Auth Token</strong>. You may need to click "Show" to see the full Auth Token.
                        </li>
                        <li className="bg-[#F9F7F4] p-3 border border-black/6 rounded-[8px]">
                          To get a phone number, navigate to <strong>Phone Numbers</strong> &gt; Manage &gt; Active Numbers. If you don't have one, you can purchase it there.
                        </li>
                      </ol>
                    </div>
                  )}

                  {selectedConnector === 'Meta' && (
                    <div className="space-y-4">
                      <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-[8px] text-xs text-emerald-700 flex items-start gap-2.5">
                        <Plug size={14} className="mt-0.5 flex-shrink-0" />
                        <span>Meta for Developers allows you to use the WhatsApp Business API.</span>
                      </div>
                      <ol className="list-decimal list-inside space-y-3 font-semibold text-xs leading-relaxed">
                        <li className="bg-[#F9F7F4] p-3 border border-black/6 rounded-[8px]">
                          Visit <a href="https://developers.facebook.com/" target="_blank" rel="noopener noreferrer" className="text-[#1A1A1A] hover:underline font-bold">Meta for Developers</a> and log in.
                        </li>
                        <li className="bg-[#F9F7F4] p-3 border border-black/6 rounded-[8px]">
                          Click on <strong>My Apps</strong> and create a new app (select "Other" -&gt; "Business" or specific use case).
                        </li>
                        <li className="bg-[#F9F7F4] p-3 border border-black/6 rounded-[8px]">
                          In the app dashboard, find and add the <strong>WhatsApp</strong> product.
                        </li>
                        <li className="bg-[#F9F7F4] p-3 border border-black/6 rounded-[8px]">
                          Go to WhatsApp &gt; <strong>Getting Started</strong> on the left sidebar.
                        </li>
                        <li className="bg-[#F9F7F4] p-3 border border-black/6 rounded-[8px]">
                          Here you will find your <strong>Phone Number ID</strong> and <strong>WhatsApp Business Account ID</strong>.
                        </li>
                        <li className="bg-[#F9F7F4] p-3 border border-black/6 rounded-[8px]">
                          You will also see a <strong>Temporary Access Token</strong>. Note that this expires in 24 hours. For production, you should create a system user and generate a permanent token.
                        </li>
                      </ol>
                    </div>
                  )}

                  {selectedConnector === 'SMTP' && (
                    <div className="space-y-4">
                      <div className="p-3 bg-slate-50 border border-black/8 rounded-[8px] text-xs text-slate-700 flex items-start gap-2.5">
                        <Plug size={14} className="mt-0.5 flex-shrink-0" />
                        <span>SMTP is used for sending emails. Instructions depend on your email provider.</span>
                      </div>
                      <div className="space-y-3 text-xs">
                        <div className="bg-[#F9F7F4] p-3 border border-black/6 rounded-[8px]">
                          <h4 className="font-bold text-[#1A1A1A] mb-1">For Gmail:</h4>
                          <ol className="list-decimal list-inside space-y-1.5 font-semibold leading-relaxed">
                            <li>Enable 2-Step Verification in your Google Account.</li>
                            <li>Go to Security &gt; <strong>App passwords</strong>.</li>
                            <li>Generate a password for "Other (custom name)" and use that as the password here.</li>
                            <li>Host: <code>smtp.gmail.com</code>, Port: <code>587</code>, Secure: Checked.</li>
                          </ol>
                        </div>
                        <div className="bg-[#F9F7F4] p-3 border border-black/6 rounded-[8px]">
                          <h4 className="font-bold text-[#1A1A1A] mb-1">For Outlook/Office 365:</h4>
                          <ol className="list-decimal list-inside space-y-1.5 font-semibold leading-relaxed">
                            <li>Host: <code>smtp.office365.com</code>, Port: <code>587</code>.</li>
                            <li>Ensure SMTP AUTH is enabled for the mailbox in admin center.</li>
                          </ol>
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedConnector === 'Razorpay' && (
                    <div className="space-y-4">
                      <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-[8px] text-xs text-emerald-700 flex items-start gap-2.5">
                        <Plug size={14} className="mt-0.5 flex-shrink-0" />
                        <span>Razorpay is a payment gateway.</span>
                      </div>
                      <ol className="list-decimal list-inside space-y-3 font-semibold text-xs leading-relaxed">
                        <li className="bg-[#F9F7F4] p-3 border border-black/6 rounded-[8px]">
                          Log in to your <a href="https://dashboard.razorpay.com/" target="_blank" rel="noopener noreferrer" className="text-[#1A1A1A] hover:underline font-bold">Razorpay Dashboard</a>.
                        </li>
                        <li className="bg-[#F9F7F4] p-3 border border-black/6 rounded-[8px]">
                          Go to <strong>Settings</strong> on the left sidebar.
                        </li>
                        <li className="bg-[#F9F7F4] p-3 border border-black/6 rounded-[8px]">
                          Click on the <strong>API Keys</strong> tab.
                        </li>
                        <li className="bg-[#F9F7F4] p-3 border border-black/6 rounded-[8px]">
                          Click <strong>Generate Live Key</strong> (or Test Key if testing).
                        </li>
                        <li className="bg-[#F9F7F4] p-3 border border-black/6 rounded-[8px]">
                          You will get the <strong>Key ID</strong> and <strong>Key Secret</strong>. Make sure to download or copy the secret as it won't be shown again.
                        </li>
                      </ol>
                    </div>
                  )}

                  {selectedConnector === 'MSG91' && (
                    <div className="space-y-4">
                      <div className="p-3 bg-red-50 border border-red-100 rounded-[8px] text-xs text-red-700 flex items-start gap-2.5">
                        <Plug size={14} className="mt-0.5 flex-shrink-0" />
                        <span>MSG91 is an SMS gateway provider.</span>
                      </div>
                      <ol className="list-decimal list-inside space-y-3 font-semibold text-xs leading-relaxed">
                        <li className="bg-[#F9F7F4] p-3 border border-black/6 rounded-[8px]">
                          Log in to <a href="https://msg91.com/" target="_blank" rel="noopener noreferrer" className="text-[#1A1A1A] hover:underline font-bold">MSG91</a>.
                        </li>
                        <li className="bg-[#F9F7F4] p-3 border border-black/6 rounded-[8px]">
                          Go to the dashboard.
                        </li>
                        <li className="bg-[#F9F7F4] p-3 border border-black/6 rounded-[8px]">
                          Find your <strong>Auth Key</strong> in the account settings or dashboard.
                        </li>
                        <li className="bg-[#F9F7F4] p-3 border border-black/6 rounded-[8px]">
                          Create a <strong>Sender ID</strong> to send SMS.
                        </li>
                      </ol>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-black/5 bg-[#F9F7F4]/30 flex justify-end">
              <button
                type="button"
                onClick={() => setShowHelpModal(false)}
                className="bg-[#1A1A1A] hover:bg-[#333] px-6 py-2.5 rounded-[8px] text-xs font-bold shadow-sm transition-all text-white"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

