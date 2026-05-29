'use client';

import React from 'react';
import { Plug, Save, Check, AlertTriangle, Shield, Globe, MessageSquare, Phone, X, Settings, ExternalLink } from 'lucide-react';

export default function ConnectorsPage() {
  const [config, setConfig] = React.useState<any>({
    twilio: { accountSid: '', authToken: '', phoneNumber: '', twimlAppSid: '' },
    meta: { whatsappToken: '', phoneNumberId: '' }
  });
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [message, setMessage] = React.useState({ type: '', text: '' });
  const [selectedConnector, setSelectedConnector] = React.useState<string | null>(null);

  React.useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('centracrm_token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1'}/tenant/config`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setConfig({
          twilio: { ...config.twilio, ...data.twilio },
          meta: { ...config.meta, ...data.meta }
        });
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
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1'}/tenant/config`, {
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

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground animate-pulse">Loading configurations...</div>
      </div>
    );
  }

  const connectors = [
    {
      id: 'Twilio',
      name: 'Twilio',
      description: 'Configure Voice calls and SMS services for your tenant.',
      icon: <Phone size={24} />,
      status: config.twilio?.accountSid ? 'Connected' : 'Not Configured'
    },
    {
      id: 'Meta',
      name: 'Meta (WhatsApp)',
      description: 'Connect WhatsApp Business API for automated messaging.',
      icon: <MessageSquare size={24} />,
      status: config.meta?.whatsappToken ? 'Connected' : 'Not Configured'
    },
    {
      id: 'Gmail',
      name: 'Gmail',
      description: 'Integrate Gmail for sending official emails and notifications.',
      icon: <Globe size={24} />,
      status: 'Coming Soon',
      disabled: true
    },
    {
      id: 'Razorpay',
      name: 'Razorpay',
      description: 'Manage online payments and fee collections.',
      icon: <Settings size={24} />,
      status: 'Coming Soon',
      disabled: true
    }
  ];

  return (
    <div className="p-8 space-y-8 bg-slate-950 min-h-screen text-white">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Plug className="text-primary" size={32} />
            Connectors
          </h1>
          <p className="text-muted-foreground mt-1">Select a source to configure its connection settings.</p>
        </div>
      </div>

      {/* Message Banner */}
      {message.text && (
        <div className={`p-4 rounded-xl flex items-center gap-3 ${message.type === 'success' ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-500' : 'bg-red-500/10 border border-red-500/20 text-red-500'}`}>
          {message.type === 'success' ? <Check size={20} /> : <AlertTriangle size={20} />}
          <span className="text-sm font-medium">{message.text}</span>
        </div>
      )}

      {/* Grid of Connectors */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {connectors.map((conn) => (
          <div
            key={conn.id}
            onClick={() => !conn.disabled && setSelectedConnector(conn.id)}
            className={`glass border border-white/5 rounded-2xl overflow-hidden transition-all duration-300 flex flex-col justify-between ${conn.disabled ? 'opacity-50 cursor-not-allowed' : `cursor-pointer hover:border-primary/30 hover:scale-[1.02] hover:shadow-xl`}`}
          >
            <div className="p-6 bg-gradient-to-br from-primary/10 to-transparent">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center text-primary shadow-lg">
                  {conn.icon}
                </div>
                <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${conn.status === 'Connected' ? 'bg-emerald-500/20 text-emerald-500' : conn.status === 'Coming Soon' ? 'bg-blue-500/20 text-blue-500' : 'bg-white/10 text-white/50'}`}>
                  {conn.status}
                </span>
              </div>
              <h3 className="text-lg font-bold text-white mb-1">{conn.name}</h3>
              <p className="text-xs text-muted-foreground line-clamp-2">{conn.description}</p>
            </div>
            
            {!conn.disabled && (
              <div className="px-6 py-4 bg-white/[0.02] border-t border-white/5 flex items-center justify-between text-xs text-muted-foreground hover:text-white transition-colors">
                <span>Click to configure</span>
                <Settings size={14} />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Configuration Modal */}
      {selectedConnector && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setSelectedConnector(null)} />
          <div className="relative w-full max-w-lg glass border border-white/10 rounded-3xl shadow-2xl animate-in zoom-in-95 overflow-hidden">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary font-bold text-lg">
                  {connectors.find(c => c.id === selectedConnector)?.icon}
                </div>
                <div>
                  <h3 className="font-bold text-lg">{selectedConnector} Configuration</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Enter your API credentials below</p>
                </div>
              </div>
              <button type="button" onClick={() => setSelectedConnector(null)} className="p-2 hover:bg-white/5 rounded-xl text-muted-foreground">
                <X size={20} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4">
              {/* Security Note */}
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-start gap-2 text-xs">
                <Shield size={16} className="mt-0.5 flex-shrink-0" />
                <span>Sensitive fields (like tokens) will be masked with asterisks after saving.</span>
              </div>

              {selectedConnector === 'Twilio' && (
                <>
                  {/* Instructions */}
                  <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/10 text-xs text-slate-300 space-y-2">
                    <p className="font-semibold text-blue-400 flex items-center gap-1">
                      <ExternalLink size={14} /> How to get Twilio keys:
                    </p>
                    <ol className="list-decimal list-inside space-y-1 ml-1">
                      <li>Log in to your <span className="text-white">Twilio Console</span>.</li>
                      <li>Find <span className="text-white">Account SID</span> and <span className="text-white">Auth Token</span> on the dashboard.</li>
                      <li>Navigate to <span className="text-white">Phone Numbers</span> &gt; Manage &gt; Active Numbers to get your phone number.</li>
                    </ol>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Account SID</label>
                    <input
                      type="text"
                      value={config.twilio.accountSid}
                      onChange={(e) => setConfig({ ...config, twilio: { ...config.twilio, accountSid: e.target.value } })}
                      className="w-full bg-white/5 border border-border rounded-xl px-4 py-3 mt-1 text-sm outline-none focus:border-primary/30 transition-all text-foreground"
                      placeholder="ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
                    />
                  </div>
                  
                  <div>
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Auth Token</label>
                    <input
                      type="text"
                      value={config.twilio.authToken}
                      onChange={(e) => setConfig({ ...config, twilio: { ...config.twilio, authToken: e.target.value } })}
                      className="w-full bg-white/5 border border-border rounded-xl px-4 py-3 mt-1 text-sm outline-none focus:border-primary/30 transition-all text-foreground"
                      placeholder={config.twilio.authToken === '********' ? '********' : 'Auth Token'}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Phone Number</label>
                    <input
                      type="text"
                      value={config.twilio.phoneNumber}
                      onChange={(e) => setConfig({ ...config, twilio: { ...config.twilio, phoneNumber: e.target.value } })}
                      className="w-full bg-white/5 border border-border rounded-xl px-4 py-3 mt-1 text-sm outline-none focus:border-primary/30 transition-all text-foreground"
                      placeholder="+1234567890"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">TwiML App SID (Optional)</label>
                    <input
                      type="text"
                      value={config.twilio.twimlAppSid}
                      onChange={(e) => setConfig({ ...config, twilio: { ...config.twilio, twimlAppSid: e.target.value } })}
                      className="w-full bg-white/5 border border-border rounded-xl px-4 py-3 mt-1 text-sm outline-none focus:border-primary/30 transition-all text-foreground"
                      placeholder="APXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
                    />
                  </div>
                </>
              )}

              {selectedConnector === 'Meta' && (
                <>
                  {/* Instructions */}
                  <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/10 text-xs text-slate-300 space-y-2">
                    <p className="font-semibold text-blue-400 flex items-center gap-1">
                      <ExternalLink size={14} /> How to get Meta keys:
                    </p>
                    <ol className="list-decimal list-inside space-y-1 ml-1">
                      <li>Log in to <span className="text-white">Meta for Developers</span> and create an app.</li>
                      <li>Add the <span className="text-white">WhatsApp</span> product to your app.</li>
                      <li>Navigate to WhatsApp &gt; <span className="text-white">Getting Started</span> to find your Phone Number ID and generate an Access Token.</li>
                    </ol>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">WhatsApp Access Token</label>
                    <input
                      type="text"
                      value={config.meta.whatsappToken}
                      onChange={(e) => setConfig({ ...config, meta: { ...config.meta, whatsappToken: e.target.value } })}
                      className="w-full bg-white/5 border border-border rounded-xl px-4 py-3 mt-1 text-sm outline-none focus:border-primary/30 transition-all text-foreground"
                      placeholder={config.meta.whatsappToken === '********' ? '********' : 'EAA...'}
                    />
                  </div>
                  
                  <div>
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Phone Number ID</label>
                    <input
                      type="text"
                      value={config.meta.phoneNumberId}
                      onChange={(e) => setConfig({ ...config, meta: { ...config.meta, phoneNumberId: e.target.value } })}
                      className="w-full bg-white/5 border border-border rounded-xl px-4 py-3 mt-1 text-sm outline-none focus:border-primary/30 transition-all text-foreground"
                      placeholder="105XXXXXXXXXXXXXXXX"
                    />
                  </div>
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-white/5 bg-white/[0.02] flex gap-3">
              <button type="button" onClick={() => setSelectedConnector(null)} className="flex-1 py-2.5 text-sm font-semibold hover:bg-white/5 rounded-xl transition-colors">
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 bg-primary hover:bg-primary/90 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-primary/20 transition-all disabled:opacity-50 text-white flex items-center justify-center gap-2"
              >
                {saving ? 'Saving...' : <><Save size={16} /> Save Config</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
