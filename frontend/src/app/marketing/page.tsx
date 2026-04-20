'use client';

import { MainLayout } from '@/components/layout/MainLayout';
import { CampaignForm } from '@/components/marketing/CampaignForm';
import { WebinarModal } from '@/components/marketing/WebinarModal';
import { WebinarQRModal } from '@/components/marketing/WebinarQRModal';
import { AnalyticsChart } from '@/components/dashboard/AnalyticsChart';
import { TrendingUp, Users, Target, Rocket, Plus, ExternalLink, Megaphone, Calendar, BarChart3, Loader2, Edit2, Trash2, QrCode, Copy, Check } from 'lucide-react';
import React from 'react';
import { useMarketingStore } from '@/store/useMarketingStore';
import { useRouter } from 'next/navigation';

export default function MarketingPage() {
  const router = useRouter();
  const [isCampaignOpen, setIsCampaignOpen] = React.useState(false);
  const [isWebinarOpen, setIsWebinarOpen] = React.useState(false);
  const [isQRModalOpen, setIsQRModalOpen] = React.useState(false);
  const [selectedCampaign, setSelectedCampaign] = React.useState<any>(null);
  const [selectedWebinar, setSelectedWebinar] = React.useState<any>(null);
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  const { campaigns, webinars, fetchCampaigns, fetchWebinars, deleteCampaign, isLoading } = useMarketingStore();

  React.useEffect(() => {
    fetchCampaigns();
    fetchWebinars();
  }, []);

  const handleEdit = (campaign: any) => {
    setSelectedCampaign(campaign);
    setIsCampaignOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this campaign? All lead attribution will be lost.')) {
      await deleteCampaign(id);
    }
  };

  return (
    <MainLayout>
      <CampaignForm
        isOpen={isCampaignOpen}
        onClose={() => {
          setIsCampaignOpen(false);
          setSelectedCampaign(null);
        }}
        initialData={selectedCampaign}
      />
      <WebinarModal isOpen={isWebinarOpen} onClose={() => setIsWebinarOpen(false)} />

      {selectedWebinar && (
        <WebinarQRModal
          isOpen={isQRModalOpen}
          onClose={() => {
            setIsQRModalOpen(false);
            setSelectedWebinar(null);
          }}
          webinarId={selectedWebinar.id}
          webinarTitle={selectedWebinar.title}
        />
      )}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold">Marketing Hub</h1>
          <p className="text-slate-400 text-sm">Manage campaigns and automate lead syncing</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setIsWebinarOpen(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl transition-all shadow-lg shadow-blue-500/20"
          >
            <Calendar size={18} />
            <span>New Webinar</span>
          </button>
          <button
            onClick={() => setIsCampaignOpen(true)}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-xl transition-all shadow-lg shadow-purple-500/20"
          >
            <Plus size={18} />
            <span>New Campaign</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <div className="lg:col-span-2">
          <AnalyticsChart title="Campaign Lead Performance" height={200} />
        </div>
        <div className="bg-gradient-to-br from-indigo-600/20 to-purple-600/20 border border-white/5 rounded-3xl p-6 flex flex-col justify-center gap-4">
          <h3 className="font-bold text-slate-300">Total Campaign Leads</h3>
          <div className="text-4xl font-black text-indigo-400">
            {campaigns.reduce((acc, c) => acc + (c.totalLeads || 0), 0)}
          </div>
          <p className="text-xs text-slate-500">Aggregated across all active sources.</p>
        </div>
      </div>

      <div className="glass rounded-3xl border-white/5 overflow-hidden mb-8">
        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
          <h2 className="font-bold text-slate-200">Active Campaigns</h2>
          {isLoading && <Loader2 className="animate-spin text-slate-500" size={18} />}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.01]">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Campaign Name</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Source</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Total Leads</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">ROI / Conversions</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {campaigns.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500 italic">No active campaigns found. Start one to see data!</td>
                </tr>
              ) : campaigns.map((c) => (
                <tr key={c.id} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="px-6 py-4 font-semibold text-slate-300">{c.name}</td>
                  <td className="px-6 py-4 text-slate-400">{c.source}</td>
                  <td className="px-6 py-4 text-slate-400">{c.totalLeads}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-indigo-400 font-bold">{c.conversionRate}</span>
                      <span className="text-[10px] text-slate-500">{c.conversions} Admissions</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(c)}
                        className="p-2 text-slate-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all"
                        title="Edit Campaign"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(c.id)}
                        className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                        title="Delete Campaign"
                      >
                        <Trash2 size={16} />
                      </button>
                      <button
                        onClick={() => router.push(`/leads?campaignId=${c.id}`)}
                        className="p-2 text-slate-500 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                        title="View Leads"
                      >
                        <ExternalLink size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="glass rounded-3xl border-white/5 overflow-hidden">
          <div className="p-6 border-b border-white/5 bg-white/[0.02]">
            <h2 className="font-bold text-slate-200">Upcoming Webinars</h2>
          </div>
          <div className="p-6 space-y-4">
            {webinars.length === 0 ? (
              <p className="text-slate-500 text-sm italic">No webinars scheduled.</p>
            ) : webinars.map(w => (
              <div key={w.id} className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all group/item">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
                    <Calendar size={18} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-300">{w.title}</h4>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                      {new Date(w.date).toLocaleDateString()} @ {new Date(w.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right hidden sm:block">
                    <div className="text-sm font-bold text-blue-400">{w._count?.registrations || 0}</div>
                    <div className="text-[8px] text-slate-500 uppercase font-black">Registrations</div>
                  </div>

                  <div className="flex gap-1">
                    <button
                      onClick={() => {
                        const url = `${window.location.origin}/webinars/${w.id}/register`;
                        navigator.clipboard.writeText(url);
                        setCopiedId(w.id);
                        setTimeout(() => setCopiedId(null), 2000);
                      }}
                      className="p-2 text-slate-500 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-all"
                      title="Copy Registration Link"
                    >
                      {copiedId === w.id ? <Check size={16} /> : <Copy size={16} />}
                    </button>
                    <button
                      onClick={() => {
                        setSelectedWebinar(w);
                        setIsQRModalOpen(true);
                      }}
                      className="p-2 text-slate-500 hover:text-purple-400 hover:bg-purple-400/10 rounded-lg transition-all"
                      title="Show QR Code"
                    >
                      <QrCode size={16} />
                    </button>
                    <button
                      onClick={() => window.open(`/webinars/${w.id}/register`, '_blank')}
                      className="p-2 text-slate-500 hover:text-white hover:bg-white/10 rounded-lg transition-all opacity-0 group-hover/item:opacity-100"
                      title="View Details"
                    >
                      <ExternalLink size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-8 rounded-3xl glass border-white/5 flex flex-col items-start relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 text-indigo-500/10 group-hover:scale-125 transition-transform duration-700">
            <BarChart3 size={120} />
          </div>
          <h2 className="text-2xl font-bold mb-2">Campaign ROI</h2>
          <p className="text-slate-400 text-sm mb-6 max-w-sm">Monitor ROI across all channels including Google Ads, Meta, and Social Media campaigns.</p>
          <button
            onClick={() => setIsCampaignOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-500 px-6 py-2.5 rounded-xl font-semibold transition-all"
          >
            Create Campaign
          </button>
        </div>
      </div>

    </MainLayout>
  );
}
