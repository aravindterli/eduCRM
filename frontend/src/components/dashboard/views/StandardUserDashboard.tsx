'use client';

import React from 'react';
import { MetricCard } from '../MetricCard';
import { DashboardFollowUps } from '../DashboardFollowUps';
import { DashboardTaskCenter } from '../DashboardTaskCenter';
import {
  Users,
  PhoneCall,
  Calendar,
  CheckCircle2,
  Activity,
  Clock,
  MessageSquare,
  TrendingUp,
  ChevronRight,
} from 'lucide-react';
import { useThemeStore } from '@/store/useThemeStore';
import Link from 'next/link';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Legend,
} from 'recharts';

interface StandardUserDashboardProps {
  metrics: any;
  leadStats: any;
  acquisitionData: any;
  funnelData: any;
}

const toPascalCase = (str: string): string => {
  const cleanStr = str.replace(/[()]/g, '');
  return cleanStr
    .toLowerCase()
    .trim()
    .split(/[\s_-]+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
};

const stageColors: Record<string, string> = {
  'NEW': '#3b82f6',
  'CONTACTED': '#6366f1',
  'RESPONDED': '#06b6d4',
  'QUALIFIED': '#14b8a6',
  'MEETING_SCHEDULED': '#f59e0b',
  'PROPOSAL_SENT': '#a855f7',
  'NEGOTIATION': '#10b981',
  'CONVERTED': '#eab308',
  'ON_HOLD': '#64748b',
  'LOST': '#ef4444',
  'RE_ENGAGEMENT': '#f97316',
};

const PIPELINE_STAGES = [
  'NEW',
  'CONTACTED',
  'RESPONDED',
  'QUALIFIED',
  'MEETING_SCHEDULED',
  'PROPOSAL_SENT',
  'NEGOTIATION',
  'CONVERTED',
  'ON_HOLD',
  'LOST',
  'RE_ENGAGEMENT'
];

export const StandardUserDashboard: React.FC<StandardUserDashboardProps> = ({
  metrics,
  leadStats,
  acquisitionData,
  funnelData,
}) => {
  const { theme } = useThemeStore();

  // build stage funnel bar data from leadsByStage
  const stageBarData = (leadStats?.leadsByStage || [])
    .filter((s: any) => s._count?.id > 0)
    .map((s: any) => ({
      stage: toPascalCase(s.stage),
      count: s._count.id,
      color: stageColors[s.stage] || '#64748b',
    }));

  // acquisition trend data (last 7 days)
  const trendData = (acquisitionData || []).slice(-7);

  const cardBg = 'bg-white rounded-[16px] border border-black/10 shadow-sm';
  const headerBg = 'bg-white border-b border-black/10';

  const textMuted = 'text-slate-500';
  const textMain = 'text-[#1A1A1A]';

  const themeStyles = {
    bg: '#ffffff',
    border: 'rgba(26, 26, 26, 0.1)',
    text: '#1A1A1A',
    cursor: 'rgba(26, 26, 26, 0.03)',
    stroke: '#1A1A1A',
    grid: 'rgba(26, 26, 26, 0.05)',
    tick: '#1A1A1A',
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">

      {/* metric cards row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          label="MyAssignedLeads"
          value={metrics.totalLeads.toString()}
          icon={Users}
          color="primary"
        />
        <MetricCard
          label="CallsToday"
          value={(leadStats?.interactionToday || 0).toString()}
          icon={PhoneCall}
          color="emerald"
          trend="active"
        />
        <MetricCard
          label="PendingFollowUps"
          value={(leadStats?.pendingFollowUps || 0).toString()}
          icon={Calendar}
          color="amber"
        />
        <MetricCard
          label="ApplicationsStarted"
          value={metrics.applications.toString()}
          icon={CheckCircle2}
          color="purple"
        />
      </div>

      {/* main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

        {/* left column — charts */}
        <div className="lg:col-span-2 space-y-8">

          {/* lead stage distribution bar chart */}
          <div className={`border overflow-hidden transition-all ${cardBg}`}>
            <div className={`p-5 border-b flex justify-between items-center ${headerBg}`}>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-[#1A1A1A]" />
                <h2 className={`text-[10px] font-black uppercase tracking-[0.2em] ${textMain}`}>
                  MyLeadStageBreakdown
                </h2>
              </div>
              <Link
                href="/leads"
                className="text-[9px] font-bold text-slate-500 hover:text-[#1A1A1A] uppercase tracking-[0.15em] flex items-center gap-1 transition-colors"
              >
                ManageLeads <ChevronRight size={10} />
              </Link>
            </div>
            <div className="p-5">
              {stageBarData.length > 0 ? (
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stageBarData} margin={{ top: 4, right: 8, left: -16, bottom: 4 }}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke={themeStyles.grid}
                        vertical={false}
                      />
                      <XAxis
                        dataKey="stage"
                        stroke={themeStyles.stroke}
                        fontSize={9}
                        tickLine={false}
                        tick={{ fill: themeStyles.tick }}
                      />
                      <YAxis
                        stroke={themeStyles.stroke}
                        fontSize={9}
                        tickLine={false}
                        allowDecimals={false}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: themeStyles.bg,
                          borderColor: themeStyles.border,
                          color: themeStyles.text,
                          fontSize: 10,
                          borderRadius: 8,
                        }}
                        cursor={{ fill: themeStyles.cursor }}
                      />
                      <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={40}>
                        {stageBarData.map((entry: any, i: number) => (
                          <Cell key={`cell-${i}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-56 flex flex-col items-center justify-center">
                  <TrendingUp size={32} className="text-slate-600 mb-3" />
                  <p className={`text-xs font-bold uppercase tracking-widest ${textMuted}`}>
                    NoStageDataYet
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* daily engagement trend */}
          <div className={`border overflow-hidden transition-all ${cardBg}`}>
            <div className={`p-5 border-b flex justify-between items-center ${headerBg}`}>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-[#1A1A1A]" />
                <h2 className={`text-[10px] font-black uppercase tracking-[0.2em] ${textMain}`}>
                  EngagementTrendLast7Days
                </h2>
              </div>
            </div>
            <div className="p-5">
              {trendData.length > 0 ? (
                <div className="h-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={trendData} margin={{ top: 4, right: 8, left: -16, bottom: 4 }}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke={themeStyles.grid}
                        vertical={false}
                      />
                      <XAxis
                        dataKey="label"
                        stroke={themeStyles.stroke}
                        fontSize={9}
                        tickLine={false}
                        tick={{ fill: themeStyles.tick }}
                      />
                      <YAxis
                        stroke={themeStyles.stroke}
                        fontSize={9}
                        tickLine={false}
                        allowDecimals={false}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: themeStyles.bg,
                          borderColor: themeStyles.border,
                          color: themeStyles.text,
                          fontSize: 10,
                          borderRadius: 8,
                        }}
                        cursor={{ fill: themeStyles.cursor }}
                      />
                      <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={32} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-44 flex flex-col items-center justify-center">
                  <MessageSquare size={28} className="text-slate-600 mb-2" />
                  <p className={`text-xs font-bold uppercase tracking-widest ${textMuted}`}>
                    NoEngagementData
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* pipeline funnel chart */}
          <div className={`border overflow-hidden transition-all ${cardBg}`}>
            <div className={`p-5 border-b ${headerBg}`}>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-[#1A1A1A]" />
                <h2 className={`text-[10px] font-black uppercase tracking-[0.2em] ${textMain}`}>
                  SalesPipeline
                </h2>
              </div>
            </div>
            <div className="p-5">
              {(() => {
                const pieData = PIPELINE_STAGES.map(stage => {
                  const stat = (leadStats?.leadsByStage || []).find((s: any) => s.stage === stage);
                  return {
                    stage: stage,
                    count: stat ? stat._count.id : 0
                  };
                });

                const hasData = pieData.some(d => d.count > 0);

                return hasData ? (
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData.filter(d => d.count > 0)}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={2}
                          dataKey="count"
                          nameKey="stage"
                          stroke={themeStyles.bg}
                          strokeWidth={2}
                        >
                          {pieData.filter(d => d.count > 0).map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={stageColors[entry.stage] || '#3b82f6'} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: themeStyles.bg,
                            borderColor: themeStyles.border,
                            color: themeStyles.text,
                            fontSize: 10,
                            borderRadius: 8,
                          }}
                        />
                        <Legend
                          layout="vertical"
                          verticalAlign="middle"
                          align="right"
                          iconType="square"
                          wrapperStyle={{ fontSize: '10px', color: themeStyles.text }}
                          formatter={(value, entry: any) => {
                            const total = pieData.reduce((sum: number, d: any) => sum + d.count, 0);
                            const percent = total > 0 ? Math.round((entry.payload.count / total) * 100) : 0;
                            return <span className="text-slate-400">{toPascalCase(value)} <span className="ml-2 font-bold text-slate-100">{percent}% ({entry.payload.count})</span></span>;
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-56 flex flex-col items-center justify-center">
                    <p className={`text-xs font-bold uppercase tracking-widest ${textMuted}`}>
                      NoPipelineData
                    </p>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>

        {/* right column — tasks + follow-ups */}
        <div className="space-y-8">
          <DashboardTaskCenter />
          <DashboardFollowUps />
        </div>
      </div>
    </div>
  );
};
