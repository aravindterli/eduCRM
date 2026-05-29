
'use client';

import React, { useState, useRef, useCallback } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useReportStore } from '@/store/useReportStore';
import { useAuthStore } from '@/store/auth.store';
import {
  Users, TrendingUp, Target, DollarSign, Bell, BarChart3,
  MessageSquare, Download, ArrowUpRight, ArrowDownRight,
  CheckCircle, Clock, AlertCircle, Phone, Mail, Zap, Eye,
  Star, Activity, Loader2, Building2, HeartPulse, GraduationCap,
  Megaphone, Radio, Globe, MousePointerClick,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, AreaChart, Area, LineChart, Line,
  PieChart as RechartPie, Pie, Cell, Legend,
} from 'recharts';

// ─── Tab Accent Colors (structural — never changes with sector) ───────────────
const TAB_COLORS = {
  leads:         { accent: '#6366F1', light: '#EEF2FF', chart1: '#6366F1', chart2: '#A5B4FC' },
  communication: { accent: '#0D9488', light: '#F0FDF9', chart1: '#0D9488', chart2: '#5EEAD4' },
  finance:       { accent: '#059669', light: '#ECFDF5', chart1: '#059669', chart2: '#6EE7B7' },
  notifications: { accent: '#D97706', light: '#FFFBEB', chart1: '#D97706', chart2: '#FCD34D' },
  sales:         { accent: '#7C3AED', light: '#F5F3FF', chart1: '#7C3AED', chart2: '#C4B5FD' },
  campaign:      { accent: '#DC2626', light: '#FEF2F2', chart1: '#DC2626', chart2: '#FCA5A5' },
  marketing:     { accent: '#0EA5E9', light: '#F0F9FF', chart1: '#0EA5E9', chart2: '#7DD3FC' },
};

// ─── Sector Config Types ──────────────────────────────────────────────────────
interface FunnelStage   { stage: string; count: number; }
interface MonthlyPoint  { month: string; value: number; }
interface SourcePoint   { name: string; value: number; }
interface TopSource     { source: string; count: number; pct: number; }
interface PieMixItem    { name: string; value: number; }
interface RevenuePoint  { month: string; revenue: number; collected: number; }
interface TxnItem       { person: string; ref: string; amount: string; status: string; date: string; }
interface SalesPoint    { month: string; sales: number; target: number; }
interface PipelineStage { stage: string; count: number; value: number; }
interface AgentItem     { name: string; closed: number; revenue: number; }

interface CampaignKpi { label: string; value: string; change: string; up: boolean; icon: any; }
interface CampaignRow { name: string; channel: string; status: string; sent: number; delivered: number; opened: number; converted: number; }
interface CampaignMonthlyPoint { month: string; leads: number; }
interface CampaignChannelMix { name: string; value: number; }

interface MarketingKpi { label: string; value: string; change: string; up: boolean; icon: any; }
interface MarketingChannelROI { channel: string; spend: number; leads: number; cpl: number; roi: number; }
interface MarketingMonthlySpendLeads { month: string; spend: number; leads: number; }
interface MarketingKeyword { keyword: string; clicks: number; impressions: number; ctr: number; }

interface SectorCfg {
  pageTitle: string; pageSubtitle: string; pageIcon: any;
  leadsTab: string; financeTab: string; salesTab: string;
  totalLeadsLabel: string; conversionLabel: string; newThisMonthLabel: string;
  funnelTitle: string; funnelSubtitle: string; funnelStages: FunnelStage[];
  monthlyLabel: string; monthlySubtitle: string; monthlyData: MonthlyPoint[];
  sourceTitle: string; channelRankTitle: string;
  sources: SourcePoint[]; topSources: TopSource[];
  revenueLabel: string; collectedLabel: string; pendingLabel: string; overdueLabel: string;
  revenueTrendTitle: string; revenueTrendSubtitle: string;
  paymentMixTitle: string; paymentMixSubtitle: string; paymentMix: PieMixItem[];
  revenueByMonth: RevenuePoint[];
  txnTableTitle: string; txnTableSubtitle: string; col1: string; col2: string;
  recentTxns: TxnItem[];
  salesKpi1Label: string; salesKpi2Label: string; salesKpi3Label: string; salesKpi4Label: string;
  salesKpi1: string; salesKpi2: string; salesKpi3: string; salesKpi4: string;
  salesVsTargetTitle: string; salesVsTargetSubtitle: string; salesData: SalesPoint[];
  pipelineTitle: string; pipelineStages: PipelineStage[];
  leaderboardTitle: string; leaderboardSubtitle: string; dealLabel: string; agents: AgentItem[];

  // Campaigns Tab
  campaignKpis: CampaignKpi[];
  campaignRows: CampaignRow[];
  campaignMonthlyData: CampaignMonthlyPoint[];
  campaignChannelMix: CampaignChannelMix[];
  campaignMonthlyTitle: string;

  // Marketing Tab
  marketingKpis: MarketingKpi[];
  marketingChannelROI: MarketingChannelROI[];
  marketingMonthlySpendLeads: MarketingMonthlySpendLeads[];
  marketingTopKeywords: MarketingKeyword[];
  marketingSpendVsLeadsTitle: string;
  marketingSourceMixTitle: string;
  marketingRoiTitle: string;
}

// ─── Sector Config — drives ALL labels, mock data & terminology ───────────────
const SECTOR_CONFIG = {
  GENERIC: {
    pageTitle: 'Reports & Analytics',
    pageSubtitle: 'Unified insights across your institution',
    pageIcon: GraduationCap,
    // Tab labels
    leadsTab: 'Lead Generation',
    financeTab: 'Finance',
    salesTab: 'Sales',
    // Lead Gen tab
    totalLeadsLabel: 'Total Leads',
    conversionLabel: 'Enrolment Rate',
    newThisMonthLabel: 'New This Month',
    funnelTitle: 'Enrollment Funnel',
    funnelSubtitle: 'Lead to enrolment conversion',
    funnelStages: [
      { stage: 'Enquiry', count: 1842 },
      { stage: 'Qualified', count: 1104 },
      { stage: 'Counseled', count: 612 },
      { stage: 'Applied', count: 340 },
      { stage: 'Enrolled', count: 218 },
    ],
    monthlyLabel: 'Monthly Lead Volume',
    monthlySubtitle: 'New leads generated per month',
    monthlyData: [
      { month: 'Jan', value: 142 }, { month: 'Feb', value: 178 }, { month: 'Mar', value: 165 },
      { month: 'Apr', value: 210 }, { month: 'May', value: 195 }, { month: 'Jun', value: 228 },
      { month: 'Jul', value: 214 }, { month: 'Aug', value: 241 }, { month: 'Sep', value: 269 },
    ],
    sourceTitle: 'Lead Source Distribution',
    channelRankTitle: 'Top Acquisition Channels',
    sources: [
      { name: 'Website', value: 540 }, { name: 'Referral', value: 320 },
      { name: 'Webinar', value: 280 }, { name: 'Social', value: 410 },
      { name: 'Walk-in', value: 180 }, { name: 'Email', value: 112 },
    ],
    topSources: [
      { source: 'Website Form', count: 540, pct: 29 },
      { source: 'Social Media', count: 410, pct: 22 },
      { source: 'Referral', count: 320, pct: 17 },
      { source: 'Webinar / Event', count: 280, pct: 15 },
      { source: 'Walk-in', count: 180, pct: 10 },
    ],
    // Finance tab
    revenueLabel: 'Total Revenue',
    collectedLabel: 'Collected',
    pendingLabel: 'Pending',
    overdueLabel: 'Overdue',
    revenueTrendTitle: 'Revenue vs Collected',
    revenueTrendSubtitle: 'Monthly fee collection performance',
    paymentMixTitle: 'Payment Mix',
    paymentMixSubtitle: 'How students are paying',
    paymentMix: [
      { name: 'Full Payment', value: 48 }, { name: 'Instalment', value: 34 },
      { name: 'Scholarship', value: 10 }, { name: 'Pending', value: 8 },
    ],
    revenueByMonth: [
      { month: 'Jan', revenue: 320000, collected: 280000 }, { month: 'Feb', revenue: 410000, collected: 360000 },
      { month: 'Mar', revenue: 390000, collected: 330000 }, { month: 'Apr', revenue: 520000, collected: 460000 },
      { month: 'May', revenue: 480000, collected: 400000 }, { month: 'Jun', revenue: 610000, collected: 520000 },
      { month: 'Jul', revenue: 580000, collected: 510000 }, { month: 'Aug', revenue: 640000, collected: 560000 },
      { month: 'Sep', revenue: 710000, collected: 620000 },
    ],
    txnTableTitle: 'Recent Student Transactions',
    txnTableSubtitle: 'Latest payment activity',
    col1: 'Student', col2: 'Program',
    recentTxns: [
      { person: 'Ananya Sharma', ref: 'MBA 2024',         amount: '₹85,000',  status: 'Paid',    date: 'Today' },
      { person: 'Rohan Mehta',   ref: 'BBA Sem 3',        amount: '₹42,500',  status: 'Partial', date: 'Yesterday' },
      { person: 'Priya Kapoor',  ref: 'B.Tech 2024',      amount: '₹1,20,000',status: 'Paid',    date: '2d ago' },
      { person: 'Vikram Rao',    ref: 'MBA Finance',      amount: '₹38,000',  status: 'Overdue', date: '5d ago' },
      { person: 'Nisha Patel',   ref: 'BCA 2nd Yr',       amount: '₹65,000',  status: 'Paid',    date: '6d ago' },
    ],
    // Sales tab
    salesKpi1Label: 'Total Collections',
    salesKpi2Label: 'Enrolments',
    salesKpi3Label: 'Avg. Fee',
    salesKpi4Label: 'Pipeline Value',
    salesKpi1: '₹2.1Cr', salesKpi2: '218', salesKpi3: '₹96,330', salesKpi4: '₹82L',
    salesVsTargetTitle: 'Collections vs Target',
    salesVsTargetSubtitle: 'Monthly enrolment revenue against goal',
    salesData: [
      { month: 'Jan', sales: 1800000, target: 2000000 }, { month: 'Feb', sales: 2200000, target: 2000000 },
      { month: 'Mar', sales: 1950000, target: 2200000 }, { month: 'Apr', sales: 2600000, target: 2400000 },
      { month: 'May', sales: 2400000, target: 2400000 }, { month: 'Jun', sales: 2900000, target: 2600000 },
      { month: 'Jul', sales: 2700000, target: 2600000 }, { month: 'Aug', sales: 3100000, target: 2800000 },
      { month: 'Sep', sales: 2950000, target: 3000000 },
    ],
    pipelineTitle: 'Enrollment Pipeline',
    pipelineStages: [
      { stage: 'Prospect',   count: 420, value: 3200000 }, { stage: 'Qualified', count: 284, value: 2800000 },
      { stage: 'Applied',    count: 148, value: 1600000 }, { stage: 'Offer Out', count: 72,  value: 980000 },
      { stage: 'Enrolled',   count: 218, value: 21000000 },
    ],
    leaderboardTitle: 'Counselor Leaderboard',
    leaderboardSubtitle: 'Top performers by enrolments',
    dealLabel: 'enrolments',
    agents: [
      { name: 'Riya Sharma',     closed: 42, revenue: 4200000 }, { name: 'Karan Malhotra', closed: 38, revenue: 3640000 },
      { name: 'Divya Nair',      closed: 35, revenue: 3200000 }, { name: 'Arjun Sood',     closed: 28, revenue: 2540000 },
      { name: 'Meera Pillai',    closed: 24, revenue: 2180000 },
    ],

    // Campaigns Tab
    campaignKpis: [
      { label: 'Total Campaigns', value: '48',     change: '+6',    up: true, icon: Megaphone },
      { label: 'Active Campaigns', value: '12',    change: '+3',    up: true, icon: Radio },
      { label: 'Leads Generated', value: '1,248',  change: '+22%',  up: true, icon: Users },
      { label: 'Avg. Open Rate',  value: '61.4%',  change: '+4.2%', up: true, icon: Eye },
    ],
    campaignRows: [
      { name: 'Summer Intake 2026',  channel: 'WhatsApp', status: 'COMPLETED',   sent: 2400, delivered: 2280, opened: 1640, converted: 142 },
      { name: 'Open House Invite',   channel: 'Email',    status: 'IN_PROGRESS', sent: 3200, delivered: 3100, opened: 1980, converted: 88 },
      { name: 'Scholarship Alert',   channel: 'SMS',      status: 'COMPLETED',   sent: 1800, delivered: 1750, opened: 1200, converted: 64 },
      { name: 'Webinar: MBA 2026',   channel: 'Email',    status: 'SCHEDULED',   sent: 0,    delivered: 0,    opened: 0,    converted: 0 },
      { name: 'Festival Offer',      channel: 'WhatsApp', status: 'COMPLETED',   sent: 4100, delivered: 3950, opened: 2800, converted: 210 },
      { name: 'Re-engagement Drive', channel: 'Email',    status: 'IN_PROGRESS', sent: 960,  delivered: 920,  opened: 540,  converted: 32 },
    ],
    campaignMonthlyData: [
      { month: 'Jan', leads: 68 },  { month: 'Feb', leads: 94 },  { month: 'Mar', leads: 82 },
      { month: 'Apr', leads: 118 }, { month: 'May', leads: 104 }, { month: 'Jun', leads: 138 },
      { month: 'Jul', leads: 126 }, { month: 'Aug', leads: 152 }, { month: 'Sep', leads: 166 },
    ],
    campaignChannelMix: [
      { name: 'WhatsApp', value: 54 },
      { name: 'Email',    value: 34 },
      { name: 'SMS',      value: 12 },
    ],
    campaignMonthlyTitle: 'Monthly Leads from Campaigns',

    // Marketing Tab
    marketingKpis: [
      { label: 'Total Reach',    value: '2.4L',   change: '+31%', up: true, icon: Globe },
      { label: 'Total Clicks',   value: '18,240', change: '+18%', up: true, icon: MousePointerClick },
      { label: 'Click Rate',     value: '7.6%',   change: '+1.4%', up: true, icon: TrendingUp },
      { label: 'Cost Per Lead',  value: '₹186',   change: '-12%', up: true, icon: DollarSign },
    ],
    marketingChannelROI: [
      { channel: 'Meta Ads',    spend: 48000, leads: 320, cpl: 150, roi: 4.2 },
      { channel: 'Google Ads',  spend: 62000, leads: 280, cpl: 221, roi: 3.1 },
      { channel: 'WhatsApp',    spend: 12000, leads: 410, cpl: 29,  roi: 8.6 },
      { channel: 'Email',       spend: 8000,  leads: 180, cpl: 44,  roi: 6.4 },
      { channel: 'Organic SEO', spend: 15000, leads: 240, cpl: 62,  roi: 5.8 },
    ],
    marketingMonthlySpendLeads: [
      { month: 'Jan', spend: 85000,  leads: 142 }, { month: 'Feb', spend: 96000,  leads: 168 },
      { month: 'Mar', spend: 78000,  leads: 148 }, { month: 'Apr', spend: 110000, leads: 204 },
      { month: 'May', spend: 102000, leads: 188 }, { month: 'Jun', spend: 124000, leads: 238 },
      { month: 'Jul', spend: 116000, leads: 220 }, { month: 'Aug', spend: 138000, leads: 258 },
      { month: 'Sep', spend: 148000, leads: 276 },
    ],
    marketingTopKeywords: [
      { keyword: 'MBA admission 2026',   clicks: 2840, impressions: 38000, ctr: 7.5 },
      { keyword: 'BBA colleges near me', clicks: 2210, impressions: 30000, ctr: 7.4 },
      { keyword: 'engineering college',  clicks: 1880, impressions: 28000, ctr: 6.7 },
      { keyword: 'distance MBA course',  clicks: 1640, impressions: 24000, ctr: 6.8 },
      { keyword: 'scholarship 2026',     clicks: 1420, impressions: 22000, ctr: 6.5 },
    ],
    marketingSpendVsLeadsTitle: 'Monthly Spend vs Leads',
    marketingSourceMixTitle: 'Source Mix',
    marketingRoiTitle: 'Channel ROI Breakdown',
  },

  REAL_ESTATE: {
    pageTitle: 'Business Intelligence',
    pageSubtitle: 'Unified insights across your real estate operations',
    pageIcon: Building2,
    leadsTab: 'Prospect Generation',
    financeTab: 'Revenue',
    salesTab: 'Sales',
    totalLeadsLabel: 'Total Prospects',
    conversionLabel: 'Booking Rate',
    newThisMonthLabel: 'New This Month',
    funnelTitle: 'Booking Funnel',
    funnelSubtitle: 'Prospect to booking conversion',
    funnelStages: [
      { stage: 'Enquiry',    count: 1540 },
      { stage: 'Qualified',  count: 890 },
      { stage: 'Site Visit', count: 520 },
      { stage: 'Offer',      count: 280 },
      { stage: 'Booked',     count: 164 },
    ],
    monthlyLabel: 'Monthly Prospect Volume',
    monthlySubtitle: 'New prospects generated per month',
    monthlyData: [
      { month: 'Jan', value: 98 }, { month: 'Feb', value: 124 }, { month: 'Mar', value: 112 },
      { month: 'Apr', value: 148 }, { month: 'May', value: 136 }, { month: 'Jun', value: 162 },
      { month: 'Jul', value: 154 }, { month: 'Aug', value: 178 }, { month: 'Sep', value: 191 },
    ],
    sourceTitle: 'Prospect Source Distribution',
    channelRankTitle: 'Top Lead Channels',
    sources: [
      { name: 'Property Portals', value: 480 }, { name: 'Referral', value: 260 },
      { name: 'Site Campaign', value: 200 }, { name: 'Social Ads', value: 340 },
      { name: 'Walk-in', value: 140 }, { name: 'Email', value: 90 },
    ],
    topSources: [
      { source: 'Property Portals', count: 480, pct: 31 },
      { source: 'Social Ads', count: 340, pct: 22 },
      { source: 'Referral', count: 260, pct: 17 },
      { source: 'Site Campaign', count: 200, pct: 13 },
      { source: 'Walk-in', count: 140, pct: 9 },
    ],
    revenueLabel: 'Total Booking Value',
    collectedLabel: 'Received',
    pendingLabel: 'Pending',
    overdueLabel: 'Overdue',
    revenueTrendTitle: 'Booking Revenue vs Received',
    revenueTrendSubtitle: 'Monthly payment collection performance',
    paymentMixTitle: 'Payment Mix',
    paymentMixSubtitle: 'How clients are paying',
    paymentMix: [
      { name: 'Full Payment', value: 34 }, { name: 'Down + EMI', value: 46 },
      { name: 'Bank Loan', value: 14 }, { name: 'Pending', value: 6 },
    ],
    revenueByMonth: [
      { month: 'Jan', revenue: 1200000, collected: 980000 }, { month: 'Feb', revenue: 1800000, collected: 1560000 },
      { month: 'Mar', revenue: 1400000, collected: 1100000 }, { month: 'Apr', revenue: 2100000, collected: 1800000 },
      { month: 'May', revenue: 1900000, collected: 1600000 }, { month: 'Jun', revenue: 2400000, collected: 2100000 },
      { month: 'Jul', revenue: 2200000, collected: 1900000 }, { month: 'Aug', revenue: 2600000, collected: 2300000 },
      { month: 'Sep', revenue: 2900000, collected: 2500000 },
    ],
    txnTableTitle: 'Recent Client Payments',
    txnTableSubtitle: 'Latest transaction activity',
    col1: 'Client', col2: 'Property',
    recentTxns: [
      { person: 'Rajesh Khanna',  ref: 'Sky Tower 4B',     amount: '₹8,50,000',  status: 'Paid',    date: 'Today' },
      { person: 'Supriya Nair',   ref: 'Palm Residency 7',  amount: '₹4,20,000',  status: 'Partial', date: 'Yesterday' },
      { person: 'Arun Gupta',     ref: 'Maple Heights 12',  amount: '₹12,0,000', status: 'Paid',    date: '2d ago' },
      { person: 'Divya Menon',    ref: 'Sunrise Villa 3',   amount: '₹3,80,000',  status: 'Overdue', date: '5d ago' },
      { person: 'Mohan Das',      ref: 'Green Acres Plot 9', amount: '₹6,50,000',  status: 'Paid',    date: '6d ago' },
    ],
    salesKpi1Label: 'Total Sales Value',
    salesKpi2Label: 'Bookings',
    salesKpi3Label: 'Avg. Deal Size',
    salesKpi4Label: 'Pipeline Value',
    salesKpi1: '₹8.4Cr', salesKpi2: '164', salesKpi3: '₹51.2L', salesKpi4: '₹22Cr',
    salesVsTargetTitle: 'Sales vs Target',
    salesVsTargetSubtitle: 'Monthly booking revenue against target',
    salesData: [
      { month: 'Jan', sales: 5200000, target: 6000000 }, { month: 'Feb', sales: 7800000, target: 6000000 },
      { month: 'Mar', sales: 6400000, target: 7000000 }, { month: 'Apr', sales: 9100000, target: 8000000 },
      { month: 'May', sales: 8400000, target: 8000000 }, { month: 'Jun', sales: 10200000, target: 9000000 },
      { month: 'Jul', sales: 9600000, target: 9000000 }, { month: 'Aug', sales: 11400000, target: 10000000 },
      { month: 'Sep', sales: 10800000, target: 11000000 },
    ],
    pipelineTitle: 'Booking Pipeline',
    pipelineStages: [
      { stage: 'Enquiry',    count: 320, value: 8200000 }, { stage: 'Qualified', count: 184, value: 12400000 },
      { stage: 'Site Visit', count: 96,  value: 8800000 }, { stage: 'Offer Out', count: 48,  value: 6400000 },
      { stage: 'Booked',     count: 164, value: 84000000 },
    ],
    leaderboardTitle: 'Agent Leaderboard',
    leaderboardSubtitle: 'Top performers by bookings closed',
    dealLabel: 'bookings',
    agents: [
      { name: 'Suresh Pillai',  closed: 28, revenue: 14400000 }, { name: 'Kavita Sharma', closed: 24, revenue: 12200000 },
      { name: 'Ramesh Nair',    closed: 22, revenue: 11200000 }, { name: 'Priya Sood',    closed: 18, revenue: 9200000 },
      { name: 'Deepak Rao',     closed: 14, revenue: 7200000 },
    ],

    // Campaigns Tab
    campaignKpis: [
      { label: 'Total Campaigns', value: '36',     change: '+4',    up: true, icon: Megaphone },
      { label: 'Active Campaigns', value: '8',     change: '+2',    up: true, icon: Radio },
      { label: 'Prospects Generated', value: '842',  change: '+18%',  up: true, icon: Users },
      { label: 'Avg. Open Rate',  value: '65.2%',  change: '+5.1%', up: true, icon: Eye },
    ],
    campaignRows: [
      { name: 'Luxury Villas Launch',  channel: 'WhatsApp', status: 'COMPLETED',   sent: 1500, delivered: 1420, opened: 1080, converted: 84 },
      { name: 'Site Visit Invitation', channel: 'Email',    status: 'IN_PROGRESS', sent: 2800, delivered: 2700, opened: 1720, converted: 56 },
      { name: 'Festive Booking Offer', channel: 'SMS',      status: 'COMPLETED',   sent: 1200, delivered: 1150, opened: 780,  converted: 42 },
      { name: 'Pre-Launch Webinar',    channel: 'Email',    status: 'SCHEDULED',   sent: 0,    delivered: 0,    opened: 0,    converted: 0 },
      { name: 'Investor Meet Drive',   channel: 'WhatsApp', status: 'COMPLETED',   sent: 3100, delivered: 2980, opened: 2100, converted: 124 },
      { name: 'Re-engagement Drive',   channel: 'Email',    status: 'IN_PROGRESS', sent: 850,  delivered: 810,  opened: 480,  converted: 22 },
    ],
    campaignMonthlyData: [
      { month: 'Jan', leads: 42 },  { month: 'Feb', leads: 58 },  { month: 'Mar', leads: 52 },
      { month: 'Apr', leads: 74 },  { month: 'May', leads: 68 },  { month: 'Jun', leads: 88 },
      { month: 'Jul', leads: 82 },  { month: 'Aug', leads: 96 },  { month: 'Sep', leads: 105 },
    ],
    campaignChannelMix: [
      { name: 'WhatsApp', value: 60 },
      { name: 'Email',    value: 28 },
      { name: 'SMS',      value: 12 },
    ],
    campaignMonthlyTitle: 'Monthly Prospects from Campaigns',

    // Marketing Tab
    marketingKpis: [
      { label: 'Total Reach',    value: '1.8L',   change: '+24%', up: true, icon: Globe },
      { label: 'Total Clicks',   value: '12,410', change: '+15%', up: true, icon: MousePointerClick },
      { label: 'Click Rate',     value: '6.8%',   change: '+0.9%', up: true, icon: TrendingUp },
      { label: 'Cost Per Prospect', value: '₹1,450',  change: '-8%',  up: true, icon: DollarSign },
    ],
    marketingChannelROI: [
      { channel: 'Property Portals', spend: 180000, leads: 120, cpl: 1500, roi: 4.8 },
      { channel: 'Google Ads',      spend: 220000, leads: 140, cpl: 1571, roi: 3.6 },
      { channel: 'Meta Ads',         spend: 140000, leads: 160, cpl: 875,  roi: 5.2 },
      { channel: 'Email Marketing',  spend: 24000,  leads: 48,  cpl: 500,  roi: 6.8 },
      { channel: 'Organic SEO',      spend: 45000,  leads: 90,  cpl: 500,  roi: 7.2 },
    ],
    marketingMonthlySpendLeads: [
      { month: 'Jan', spend: 250000, leads: 74 }, { month: 'Feb', spend: 280000, leads: 88 },
      { month: 'Mar', spend: 240000, leads: 78 }, { month: 'Apr', spend: 320000, leads: 110 },
      { month: 'May', spend: 290000, leads: 98 }, { month: 'Jun', spend: 380000, leads: 132 },
      { month: 'Jul', spend: 350000, leads: 124 }, { month: 'Aug', spend: 410000, leads: 146 },
      { month: 'Sep', spend: 450000, leads: 158 },
    ],
    marketingTopKeywords: [
      { keyword: 'luxury apartments for sale', clicks: 1840, impressions: 24000, ctr: 7.6 },
      { keyword: 'flats near metro station',   clicks: 1520, impressions: 21000, ctr: 7.2 },
      { keyword: 'buy 3 BHK villa',           clicks: 1180, impressions: 18000, ctr: 6.5 },
      { keyword: 'real estate investment',     clicks: 960,  impressions: 15000, ctr: 6.4 },
      { keyword: 'gated community plots',      clicks: 840,  impressions: 13000, ctr: 6.4 },
    ],
    marketingSpendVsLeadsTitle: 'Monthly Spend vs Prospects',
    marketingSourceMixTitle: 'Source Mix',
    marketingRoiTitle: 'Channel ROI Breakdown',
  },

  HEALTHCARE: {
    pageTitle: 'Clinical Analytics',
    pageSubtitle: 'Unified insights across your healthcare practice',
    pageIcon: HeartPulse,
    leadsTab: 'Patient Pipeline',
    financeTab: 'Billing',
    salesTab: 'Performance',
    totalLeadsLabel: 'Total Patient Leads',
    conversionLabel: 'Admission Rate',
    newThisMonthLabel: 'New This Month',
    funnelTitle: 'Patient Funnel',
    funnelSubtitle: 'Lead to admission conversion',
    funnelStages: [
      { stage: 'Enquiry',    count: 980 },
      { stage: 'Qualified',  count: 640 },
      { stage: 'Consulted',  count: 410 },
      { stage: 'Treatment',  count: 280 },
      { stage: 'Admitted',   count: 195 },
    ],
    monthlyLabel: 'Monthly Patient Leads',
    monthlySubtitle: 'New patient leads per month',
    monthlyData: [
      { month: 'Jan', value: 72 }, { month: 'Feb', value: 88 }, { month: 'Mar', value: 80 },
      { month: 'Apr', value: 105 }, { month: 'May', value: 96 }, { month: 'Jun', value: 114 },
      { month: 'Jul', value: 108 }, { month: 'Aug', value: 122 }, { month: 'Sep', value: 135 },
    ],
    sourceTitle: 'Patient Referral Distribution',
    channelRankTitle: 'Top Referral Channels',
    sources: [
      { name: 'Doctor Referral', value: 320 }, { name: 'Word of Mouth', value: 210 },
      { name: 'Online Search', value: 180 }, { name: 'Camp / Event', value: 140 },
      { name: 'Walk-in', value: 90 }, { name: 'Insurance', value: 40 },
    ],
    topSources: [
      { source: 'Doctor Referral', count: 320, pct: 33 },
      { source: 'Word of Mouth', count: 210, pct: 21 },
      { source: 'Online Search', count: 180, pct: 18 },
      { source: 'Camp / Event', count: 140, pct: 14 },
      { source: 'Walk-in', count: 90, pct: 9 },
    ],
    revenueLabel: 'Total Billing',
    collectedLabel: 'Collected',
    pendingLabel: 'Pending',
    overdueLabel: 'Overdue',
    revenueTrendTitle: 'Billing vs Collected',
    revenueTrendSubtitle: 'Monthly billing performance',
    paymentMixTitle: 'Payment Mix',
    paymentMixSubtitle: 'How patients are paying',
    paymentMix: [
      { name: 'Insurance', value: 42 }, { name: 'Cash', value: 30 },
      { name: 'Card / UPI', value: 20 }, { name: 'Pending', value: 8 },
    ],
    revenueByMonth: [
      { month: 'Jan', revenue: 180000, collected: 148000 }, { month: 'Feb', revenue: 220000, collected: 188000 },
      { month: 'Mar', revenue: 196000, collected: 162000 }, { month: 'Apr', revenue: 248000, collected: 218000 },
      { month: 'May', revenue: 230000, collected: 200000 }, { month: 'Jun', revenue: 274000, collected: 244000 },
      { month: 'Jul', revenue: 258000, collected: 226000 }, { month: 'Aug', revenue: 292000, collected: 260000 },
      { month: 'Sep', revenue: 318000, collected: 282000 },
    ],
    txnTableTitle: 'Recent Patient Billing',
    txnTableSubtitle: 'Latest billing activity',
    col1: 'Patient', col2: 'Service',
    recentTxns: [
      { person: 'Meena Krishnan',  ref: 'Cardiology OPD',  amount: '₹4,200',  status: 'Paid',    date: 'Today' },
      { person: 'Suresh Pillai',   ref: 'Ortho Surgery',   amount: '₹32,0,000', status: 'Partial', date: 'Yesterday' },
      { person: 'Amita Joshi',     ref: 'Maternity Care',  amount: '₹18,500', status: 'Paid',    date: '2d ago' },
      { person: 'Ravi Kumar',      ref: 'Neuro Consult',   amount: '₹3,800',  status: 'Overdue', date: '5d ago' },
      { person: 'Sanjana Iyer',    ref: 'Dental Implant',  amount: '₹14,000', status: 'Paid',    date: '6d ago' },
    ],
    salesKpi1Label: 'Total Billing',
    salesKpi2Label: 'Admissions',
    salesKpi3Label: 'Avg. Bill Value',
    salesKpi4Label: 'Active Cases',
    salesKpi1: '₹1.2Cr', salesKpi2: '195', salesKpi3: '₹6,154', salesKpi4: '412',
    salesVsTargetTitle: 'Revenue vs Target',
    salesVsTargetSubtitle: 'Monthly billing against performance target',
    salesData: [
      { month: 'Jan', sales: 148000, target: 180000 }, { month: 'Feb', sales: 188000, target: 200000 },
      { month: 'Mar', sales: 162000, target: 200000 }, { month: 'Apr', sales: 218000, target: 220000 },
      { month: 'May', sales: 200000, target: 220000 }, { month: 'Jun', sales: 244000, target: 240000 },
      { month: 'Jul', sales: 226000, target: 240000 }, { month: 'Aug', sales: 260000, target: 260000 },
      { month: 'Sep', sales: 282000, target: 280000 },
    ],
    pipelineTitle: 'Patient Stage Overview',
    pipelineStages: [
      { stage: 'Enquiry',   count: 210, value: 420000 }, { stage: 'Qualified', count: 148, value: 590000 },
      { stage: 'Consulted', count: 96,  value: 480000 }, { stage: 'Treatment', count: 52,  value: 832000 },
      { stage: 'Admitted',  count: 195, value: 1200000 },
    ],
    leaderboardTitle: 'Staff Leaderboard',
    leaderboardSubtitle: 'Top performers by patients handled',
    dealLabel: 'patients',
    agents: [
      { name: 'Dr. Priya Menon',  closed: 68, revenue: 418000 }, { name: 'Dr. Kiran Rao',   closed: 54, revenue: 334000 },
      { name: 'Dr. Anita Shah',   closed: 48, revenue: 296000 }, { name: 'Dr. Suresh Kumar', closed: 40, revenue: 248000 },
      { name: 'Dr. Lalitha Nair', closed: 34, revenue: 210000 },
    ],

    // Campaigns Tab
    campaignKpis: [
      { label: 'Total Campaigns', value: '32',     change: '+5',    up: true, icon: Megaphone },
      { label: 'Active Campaigns', value: '6',      change: '+1',    up: true, icon: Radio },
      { label: 'Patients Registered', value: '612',  change: '+15%',  up: true, icon: Users },
      { label: 'Avg. Open Rate',  value: '58.7%',  change: '+3.8%', up: true, icon: Eye },
    ],
    campaignRows: [
      { name: 'Free Wellness Camp',    channel: 'WhatsApp', status: 'COMPLETED',   sent: 1800, delivered: 1720, opened: 1240, converted: 110 },
      { name: 'Cardiology Screening',  channel: 'Email',    status: 'IN_PROGRESS', sent: 2200, delivered: 2120, opened: 1320, converted: 45 },
      { name: 'Vaccination Drive',     channel: 'SMS',      status: 'COMPLETED',   sent: 1500, delivered: 1460, opened: 980,  converted: 82 },
      { name: 'Maternity Care Seminar', channel: 'Email',    status: 'SCHEDULED',   sent: 0,    delivered: 0,    opened: 0,    converted: 0 },
      { name: 'Health Checkup Alert',  channel: 'WhatsApp', status: 'COMPLETED',   sent: 2600, delivered: 2480, opened: 1750, converted: 140 },
      { name: 'Re-engagement Drive',   channel: 'Email',    status: 'IN_PROGRESS', sent: 720,  delivered: 680,  opened: 390,  converted: 18 },
    ],
    campaignMonthlyData: [
      { month: 'Jan', leads: 34 },  { month: 'Feb', leads: 48 },  { month: 'Mar', leads: 42 },
      { month: 'Apr', leads: 58 },  { month: 'May', leads: 51 },  { month: 'Jun', leads: 68 },
      { month: 'Jul', leads: 62 },  { month: 'Aug', leads: 76 },  { month: 'Sep', leads: 85 },
    ],
    campaignChannelMix: [
      { name: 'WhatsApp', value: 50 },
      { name: 'Email',    value: 32 },
      { name: 'SMS',      value: 18 },
    ],
    campaignMonthlyTitle: 'Monthly Patients from Campaigns',

    // Marketing Tab
    marketingKpis: [
      { label: 'Total Reach',    value: '1.4L',   change: '+18%', up: true, icon: Globe },
      { label: 'Total Clicks',   value: '9,840',  change: '+12%', up: true, icon: MousePointerClick },
      { label: 'Click Rate',     value: '7.0%',   change: '+1.1%', up: true, icon: TrendingUp },
      { label: 'Cost Per Patient', value: '₹480',   change: '-10%', up: true, icon: DollarSign },
    ],
    marketingChannelROI: [
      { channel: 'Doctor Referrals', spend: 45000, leads: 150, cpl: 300, roi: 6.2 },
      { channel: 'Google Ads',      spend: 54000, leads: 110, cpl: 490, roi: 3.8 },
      { channel: 'Meta Ads',         spend: 38000, leads: 120, cpl: 316, roi: 4.5 },
      { channel: 'Health Camps',     spend: 28000, leads: 95,  cpl: 294, roi: 5.4 },
      { channel: 'Organic SEO',      spend: 18000, leads: 80,  cpl: 225, roi: 7.8 },
    ],
    marketingMonthlySpendLeads: [
      { month: 'Jan', spend: 120000, leads: 58 }, { month: 'Feb', spend: 140000, leads: 72 },
      { month: 'Mar', spend: 128000, leads: 64 }, { month: 'Apr', spend: 165000, leads: 88 },
      { month: 'May', spend: 152000, leads: 80 }, { month: 'Jun', spend: 184000, leads: 104 },
      { month: 'Jul', spend: 172000, leads: 96 }, { month: 'Aug', spend: 205000, leads: 118 },
      { month: 'Sep', spend: 228000, leads: 126 },
    ],
    marketingTopKeywords: [
      { keyword: 'best cardiologist near me', clicks: 1420, impressions: 18000, ctr: 7.8 },
      { keyword: 'private hospital admission', clicks: 1210, impressions: 16000, ctr: 7.5 },
      { keyword: 'maternity package cost',    clicks: 980,  impressions: 14000, ctr: 7.0 },
      { keyword: 'health checkup packages',   clicks: 880,  impressions: 13000, ctr: 6.7 },
      { keyword: 'dental clinic appointment',  clicks: 760,  impressions: 11000, ctr: 6.9 },
    ],
    marketingSpendVsLeadsTitle: 'Monthly Spend vs Patients',
    marketingSourceMixTitle: 'Source Mix',
    marketingRoiTitle: 'Channel ROI Breakdown',
  },
} satisfies Record<string, SectorCfg>;

type Cfg = SectorCfg;

// ─── Shared Mock (unchanged across sectors) ───────────────────────────────────
const mockComm = {
  kpis: [
    { label: 'Messages Sent', value: '9,340', change: '+22%', up: true, icon: MessageSquare },
    { label: 'Open Rate',     value: '61.3%', change: '+4.1%', up: true, icon: Mail },
    { label: 'Calls Logged',  value: '2,108', change: '+11%',  up: true, icon: Phone },
    { label: 'Avg. Response', value: '1.8h',  change: '-0.4h', up: true, icon: Zap },
  ],
  channelData: [
    { channel: 'Email',    sent: 4200, opened: 2600 },
    { channel: 'WhatsApp', sent: 3100, opened: 2800 },
    { channel: 'SMS',      sent: 1200, opened: 840 },
    { channel: 'In-App',   sent: 840,  opened: 620 },
  ],
  dailyActivity: [
    { day: 'Mon', messages: 420, calls: 88 }, { day: 'Tue', messages: 510, calls: 112 },
    { day: 'Wed', messages: 380, calls: 74 }, { day: 'Thu', messages: 560, calls: 130 },
    { day: 'Fri', messages: 490, calls: 105 }, { day: 'Sat', messages: 220, calls: 42 },
    { day: 'Sun', messages: 140, calls: 28 },
  ],
  recentLogs: [
    { type: 'email',    name: 'Aditya Verma', message: 'Confirmation sent',        time: '2 min ago',  status: 'delivered' },
    { type: 'call',     name: 'Priya Singh',  message: 'Follow-up call — 8 min',   time: '15 min ago', status: 'completed' },
    { type: 'whatsapp', name: 'Rohan Mehta',  message: 'Fee reminder broadcast',   time: '1h ago',     status: 'delivered' },
    { type: 'email',    name: 'Kavya Nair',   message: 'Welcome email sent',        time: '2h ago',     status: 'opened' },
    { type: 'sms',      name: 'Arjun Das',    message: 'OTP for portal access',    time: '3h ago',     status: 'delivered' },
  ],
};

const mockNotif = {
  kpis: [
    { label: 'Sent',      value: '5,214', change: '+30%', up: true, icon: Bell },
    { label: 'Delivered', value: '4,980', change: '+29%', up: true, icon: CheckCircle },
    { label: 'Opened',    value: '3,412', change: '+18%', up: true, icon: Eye },
    { label: 'Failed',    value: '234',   change: '-8%',  up: true, icon: AlertCircle },
  ],
  deliverabilityWeekly: [
    { day: 'Mon', sent: 740, delivered: 710, opened: 480 }, { day: 'Tue', sent: 820, delivered: 800, opened: 560 },
    { day: 'Wed', sent: 680, delivered: 660, opened: 420 }, { day: 'Thu', sent: 900, delivered: 870, opened: 610 },
    { day: 'Fri', sent: 760, delivered: 740, opened: 510 }, { day: 'Sat', sent: 380, delivered: 360, opened: 210 },
    { day: 'Sun', sent: 200, delivered: 190, opened: 100 },
  ],
  typeBreakdown: [
    { name: 'Reminder',        value: 1840 }, { name: 'Status Update', value: 1210 },
    { name: 'Event Invite',    value: 980 },  { name: 'Follow-up',     value: 740 },
    { name: 'System Alert',    value: 444 },
  ],
  recent: [
    { title: 'Deadline Reminder', target: '412 contacts', time: '30 min ago', rate: '89%' },
    { title: 'New Event Invite',  target: '1,240 leads',  time: '2h ago',     rate: '74%' },
    { title: 'Status Approved',   target: '38 records',   time: '4h ago',     rate: '98%' },
    { title: 'Monthly Newsletter', target: '2,100 contacts', time: 'Yesterday', rate: '61%' },
  ],
};

const PIE_COLORS_FINANCE = ['#059669', '#6EE7B7', '#A7F3D0', '#D1FAE5'];
const PIE_COLORS_NOTIF   = ['#D97706', '#FBBF24', '#FCD34D', '#FDE68A', '#FEF3C7'];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtRupee = (v: number) =>
  v >= 10000000 ? `₹${(v / 10000000).toFixed(1)}Cr` :
  v >= 100000   ? `₹${(v / 100000).toFixed(1)}L`    :
  `₹${(v / 1000).toFixed(0)}k`;

const tooltipStyle = {
  contentStyle: { background: '#fff', border: '1px solid #E8E3DC', borderRadius: 10, fontSize: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' },
};

// ─── Shared UI ────────────────────────────────────────────────────────────────
function KpiCard({ label, value, change, up, icon: Icon, accent, light }: any) {
  return (
    <div className="bg-white border border-black/6 rounded-[16px] p-5 flex flex-col gap-3 hover:shadow-md transition-all duration-200">
      <div className="flex items-center justify-between">
        <div className="w-10 h-10 rounded-[10px] flex items-center justify-center" style={{ background: light }}>
          <Icon size={18} style={{ color: accent }} />
        </div>
        <span className={`flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
          up ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
          {up ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}{change}
        </span>
      </div>
      <div>
        <p className="text-[22px] font-bold text-[#1A1A1A] tracking-tight leading-none">{value}</p>
        <p className="text-xs text-[#888] mt-1 font-medium">{label}</p>
      </div>
    </div>
  );
}

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`bg-white border border-black/6 rounded-[16px] p-6 ${className}`}>{children}</div>;
}

function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-5">
      <h3 className="text-[14px] font-bold text-[#1A1A1A]">{title}</h3>
      {subtitle && <p className="text-[11px] text-[#999] mt-0.5">{subtitle}</p>}
    </div>
  );
}

function Legend2({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5 text-[11px] text-[#666]">
      <span className="w-3 h-3 rounded-sm inline-block flex-shrink-0" style={{ background: color }} />
      {label}
    </span>
  );
}

// ─── Tab Panels ───────────────────────────────────────────────────────────────
function LeadGenReport({ cfg }: { cfg: Cfg }) {
  const C = TAB_COLORS.leads;
  const kpis = [
    { label: cfg.totalLeadsLabel, value: cfg.funnelStages[0].count.toLocaleString(), change: '+14%', up: true, icon: Users },
    { label: cfg.conversionLabel, value: `${Math.round((cfg.funnelStages[cfg.funnelStages.length-1].count / cfg.funnelStages[0].count) * 100)}%`, change: '+3.2%', up: true, icon: Target },
    { label: cfg.newThisMonthLabel, value: Math.round(cfg.monthlyData[cfg.monthlyData.length-1].value).toLocaleString(), change: '+8%', up: true, icon: TrendingUp },
    { label: 'Avg. Response Time', value: '4.2h', change: '-0.8h', up: true, icon: Clock },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k) => <KpiCard key={k.label} {...k} accent={C.accent} light={C.light} />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Funnel */}
        <Card>
          <SectionTitle title={cfg.funnelTitle} subtitle={cfg.funnelSubtitle} />
          <div className="space-y-4">
            {cfg.funnelStages.map((item, idx) => {
              const pct = Math.round((item.count / cfg.funnelStages[0].count) * 100);
              const alphas = [1, 0.8, 0.6, 0.45, 0.3];
              return (
                <div key={item.stage}>
                  <div className="flex justify-between items-center mb-1.5 text-[12px]">
                    <span className="font-semibold text-[#444]">{item.stage}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-[#999]">{pct}%</span>
                      <span className="font-bold text-[#1A1A1A] w-14 text-right">{item.count.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="h-2.5 w-full bg-[#F5F1EB] rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${pct}%`, backgroundColor: C.accent, opacity: alphas[idx] }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
        {/* Monthly Trend */}
        <Card>
          <SectionTitle title={cfg.monthlyLabel} subtitle={cfg.monthlySubtitle} />
          <div className="h-[230px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={cfg.monthlyData}>
                <defs>
                  <linearGradient id="lgGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={C.chart1} stopOpacity={0.18} />
                    <stop offset="95%" stopColor={C.chart1} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0EDE8" vertical={false} />
                <XAxis dataKey="month" fontSize={10} tickLine={false} axisLine={false} stroke="#BBB" />
                <YAxis fontSize={10} tickLine={false} axisLine={false} stroke="#BBB" />
                <Tooltip {...tooltipStyle} />
                <Area type="monotone" dataKey="value" name="Volume" stroke={C.chart1} fill="url(#lgGrad)" strokeWidth={2.5} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Source Bar */}
        <Card>
          <SectionTitle title={cfg.sourceTitle} subtitle="Where your leads come from" />
          <div className="h-[230px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cfg.sources} layout="vertical" barSize={16}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0EDE8" horizontal={false} />
                <XAxis type="number" fontSize={10} tickLine={false} axisLine={false} stroke="#BBB" />
                <YAxis dataKey="name" type="category" fontSize={10} tickLine={false} axisLine={false} stroke="#BBB" width={100} />
                <Tooltip {...tooltipStyle} />
                <Bar dataKey="value" name="Count" fill={C.chart1} radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        {/* Top Sources Ranking */}
        <Card>
          <SectionTitle title={cfg.channelRankTitle} subtitle="Ranked by volume" />
          <div className="space-y-3">
            {cfg.topSources.map((s, i) => (
              <div key={s.source} className="flex items-center gap-3 p-3 rounded-[10px]"
                style={{ background: i === 0 ? C.light : '#F9F7F4' }}>
                <span className="text-xs font-bold w-5" style={{ color: i === 0 ? C.accent : '#AAA' }}>#{i + 1}</span>
                <div className="flex-1">
                  <p className="text-[13px] font-semibold text-[#1A1A1A]">{s.source}</p>
                  <div className="h-1.5 bg-[#E8E3DC] rounded-full mt-1.5 overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${s.pct}%`, background: C.accent }} />
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[13px] font-bold text-[#1A1A1A]">{s.count}</p>
                  <p className="text-[10px] text-[#AAA]">{s.pct}%</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

function CommunicationReport() {
  const C = TAB_COLORS.communication;
  const commIcon: Record<string, React.ReactNode> = {
    email:    <Mail size={13} style={{ color: C.accent }} />,
    call:     <Phone size={13} style={{ color: C.accent }} />,
    whatsapp: <MessageSquare size={13} style={{ color: C.accent }} />,
    sms:      <Bell size={13} style={{ color: C.accent }} />,
  };
  const statusBadge = (s: string) => {
    if (s === 'opened')    return 'bg-indigo-50 text-indigo-700';
    if (s === 'completed') return 'bg-emerald-50 text-emerald-700';
    return 'bg-[#F5F1EB] text-[#888]';
  };
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {mockComm.kpis.map((k) => <KpiCard key={k.label} {...k} accent={C.accent} light={C.light} />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <SectionTitle title="Daily Communication Activity" subtitle="Messages & calls this week" />
          <div className="h-[230px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mockComm.dailyActivity} barGap={3}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0EDE8" vertical={false} />
                <XAxis dataKey="day" fontSize={10} tickLine={false} axisLine={false} stroke="#BBB" />
                <YAxis fontSize={10} tickLine={false} axisLine={false} stroke="#BBB" />
                <Tooltip {...tooltipStyle} />
                <Bar dataKey="messages" name="Messages" fill={C.chart1} radius={[4,4,0,0]} barSize={12} />
                <Bar dataKey="calls"    name="Calls"    fill={C.chart2} radius={[4,4,0,0]} barSize={12} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex gap-5 mt-3">
            <Legend2 color={C.chart1} label="Messages" />
            <Legend2 color={C.chart2} label="Calls" />
          </div>
        </Card>
        <Card>
          <SectionTitle title="Channel Open Rate" subtitle="Messages opened per channel" />
          <div className="space-y-5 mt-2">
            {mockComm.channelData.map((c) => {
              const rate = Math.round((c.opened / c.sent) * 100);
              return (
                <div key={c.channel}>
                  <div className="flex justify-between text-[12px] mb-1.5">
                    <span className="font-semibold text-[#1A1A1A]">{c.channel}</span>
                    <span className="text-[#888]">{c.opened.toLocaleString()}&nbsp;/&nbsp;{c.sent.toLocaleString()}&nbsp;—&nbsp;
                      <strong style={{ color: C.accent }}>{rate}%</strong>
                    </span>
                  </div>
                  <div className="h-2.5 bg-[#F5F1EB] rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${rate}%`, background: `linear-gradient(90deg, ${C.chart1}, ${C.chart2})` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
      <Card>
        <SectionTitle title="Recent Communication Log" subtitle="Latest interactions across all channels" />
        <div className="space-y-2">
          {mockComm.recentLogs.map((log, i) => (
            <div key={i} className="flex items-center gap-4 p-3.5 rounded-[10px] bg-[#F9F7F4] hover:bg-[#F5F1EB] transition-colors">
              <div className="w-8 h-8 rounded-[8px] flex items-center justify-center" style={{ background: C.light }}>
                {commIcon[log.type]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-[#1A1A1A]">{log.name}</p>
                <p className="text-[11px] text-[#999] truncate">{log.message}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusBadge(log.status)}`}>{log.status}</span>
                <p className="text-[10px] text-[#BBB] mt-1">{log.time}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function FinanceReport({ cfg }: { cfg: Cfg }) {
  const C = TAB_COLORS.finance;
  const statusStyle = (s: string) => {
    if (s === 'Paid')    return 'bg-emerald-50 text-emerald-700';
    if (s === 'Partial') return 'bg-amber-50 text-amber-700';
    if (s === 'Overdue') return 'bg-red-50 text-red-600';
    return 'bg-[#F5F1EB] text-[#888]';
  };
  const totRev = cfg.revenueByMonth.reduce((a, b) => a + b.revenue, 0);
  const totCol = cfg.revenueByMonth.reduce((a, b) => a + b.collected, 0);
  const kpis = [
    { label: cfg.revenueLabel,   value: fmtRupee(totRev),           change: '+18%', up: true,  icon: DollarSign },
    { label: cfg.collectedLabel, value: fmtRupee(totCol),           change: '+12%', up: true,  icon: CheckCircle },
    { label: cfg.pendingLabel,   value: fmtRupee(totRev - totCol),  change: '-5%',  up: false, icon: Clock },
    { label: cfg.overdueLabel,   value: fmtRupee(Math.round(totRev * 0.06)), change: '-2%', up: true, icon: AlertCircle },
  ];
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k) => <KpiCard key={k.label} {...k} accent={C.accent} light={C.light} />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <SectionTitle title={cfg.revenueTrendTitle} subtitle={cfg.revenueTrendSubtitle} />
          <div className="h-[230px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cfg.revenueByMonth} barGap={3}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0EDE8" vertical={false} />
                <XAxis dataKey="month" fontSize={10} tickLine={false} axisLine={false} stroke="#BBB" />
                <YAxis fontSize={10} tickLine={false} axisLine={false} stroke="#BBB" tickFormatter={fmtRupee} />
                <Tooltip {...tooltipStyle} formatter={(v: any) => fmtRupee(v)} />
                <Bar dataKey="revenue"   name="Billed"    fill={C.chart2} radius={[4,4,0,0]} barSize={12} />
                <Bar dataKey="collected" name="Collected" fill={C.chart1} radius={[4,4,0,0]} barSize={12} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex gap-5 mt-3">
            <Legend2 color={C.chart1} label="Collected" />
            <Legend2 color={C.chart2} label="Billed" />
          </div>
        </Card>
        <Card>
          <SectionTitle title={cfg.paymentMixTitle} subtitle={cfg.paymentMixSubtitle} />
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <RechartPie>
                <Pie data={[...cfg.paymentMix]} cx="50%" cy="50%" innerRadius={58} outerRadius={88} paddingAngle={3} dataKey="value">
                  {[...cfg.paymentMix].map((_, i) => <Cell key={i} fill={PIE_COLORS_FINANCE[i % PIE_COLORS_FINANCE.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: '#fff', border: '1px solid #E8E3DC', borderRadius: 10, fontSize: 12 }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              </RechartPie>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
      <Card>
        <SectionTitle title={cfg.txnTableTitle} subtitle={cfg.txnTableSubtitle} />
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="text-[11px] text-[#999] uppercase tracking-wide border-b border-black/5">
                <th className="pb-3 text-left font-semibold">{cfg.col1}</th>
                <th className="pb-3 text-left font-semibold">{cfg.col2}</th>
                <th className="pb-3 text-right font-semibold">Amount</th>
                <th className="pb-3 text-center font-semibold">Status</th>
                <th className="pb-3 text-right font-semibold">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/4">
              {[...cfg.recentTxns].map((t, i) => (
                <tr key={i} className="hover:bg-[#F9F7F4] transition-colors">
                  <td className="py-3 font-semibold text-[#1A1A1A]">{t.person}</td>
                  <td className="py-3 text-[#666]">{t.ref}</td>
                  <td className="py-3 text-right font-bold text-[#1A1A1A]">{t.amount}</td>
                  <td className="py-3 text-center">
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${statusStyle(t.status)}`}>{t.status}</span>
                  </td>
                  <td className="py-3 text-right text-[#999]">{t.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function NotificationsReport() {
  const C = TAB_COLORS.notifications;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {mockNotif.kpis.map((k) => <KpiCard key={k.label} {...k} accent={C.accent} light={C.light} />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <SectionTitle title="Weekly Deliverability" subtitle="Sent → Delivered → Opened" />
          <div className="h-[230px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mockNotif.deliverabilityWeekly}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0EDE8" vertical={false} />
                <XAxis dataKey="day" fontSize={10} tickLine={false} axisLine={false} stroke="#BBB" />
                <YAxis fontSize={10} tickLine={false} axisLine={false} stroke="#BBB" />
                <Tooltip {...tooltipStyle} />
                <Line type="monotone" dataKey="sent"      name="Sent"      stroke="#E8D5B0" strokeWidth={2}   dot={false} />
                <Line type="monotone" dataKey="delivered" name="Delivered" stroke={C.chart2} strokeWidth={2}   dot={false} />
                <Line type="monotone" dataKey="opened"    name="Opened"    stroke={C.chart1} strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="flex gap-5 mt-3">
            <Legend2 color="#E8D5B0" label="Sent" />
            <Legend2 color={C.chart2} label="Delivered" />
            <Legend2 color={C.chart1} label="Opened" />
          </div>
        </Card>
        <Card>
          <SectionTitle title="Notification Types" subtitle="Volume by category" />
          <div className="h-[230px]">
            <ResponsiveContainer width="100%" height="100%">
              <RechartPie>
                <Pie data={mockNotif.typeBreakdown} cx="50%" cy="50%" outerRadius={85} paddingAngle={3} dataKey="value">
                  {mockNotif.typeBreakdown.map((_, i) => <Cell key={i} fill={PIE_COLORS_NOTIF[i % PIE_COLORS_NOTIF.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: '#fff', border: '1px solid #E8E3DC', borderRadius: 10, fontSize: 12 }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              </RechartPie>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
      <Card>
        <SectionTitle title="Recent Broadcasts" subtitle="Last sent notifications" />
        <div className="space-y-3">
          {mockNotif.recent.map((n, i) => (
            <div key={i} className="flex items-center gap-4 p-4 bg-[#F9F7F4] rounded-[12px] hover:bg-[#FFFBEB] transition-colors">
              <div className="w-9 h-9 rounded-[9px] flex items-center justify-center flex-shrink-0" style={{ background: C.light }}>
                <Bell size={15} style={{ color: C.accent }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-bold text-[#1A1A1A]">{n.title}</p>
                <p className="text-[11px] text-[#999]">{n.target}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-[13px] font-bold text-emerald-600">{n.rate} opened</p>
                <p className="text-[10px] text-[#BBB]">{n.time}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function SalesReport({ cfg }: { cfg: Cfg }) {
  const C = TAB_COLORS.sales;
  const rankColors = [C.accent, '#9F6EF5', '#B89EF8', '#DDD8F8', '#EEF0F8'];
  const kpis = [
    { label: cfg.salesKpi1Label, value: cfg.salesKpi1, change: '+24%', up: true, icon: TrendingUp },
    { label: cfg.salesKpi2Label, value: cfg.salesKpi2, change: '+16%', up: true, icon: Star },
    { label: cfg.salesKpi3Label, value: cfg.salesKpi3, change: '+7%',  up: true, icon: Activity },
    { label: cfg.salesKpi4Label, value: cfg.salesKpi4, change: '+11%', up: true, icon: BarChart3 },
  ];
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k) => <KpiCard key={k.label} {...k} accent={C.accent} light={C.light} />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <SectionTitle title={cfg.salesVsTargetTitle} subtitle={cfg.salesVsTargetSubtitle} />
          <div className="h-[230px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[...cfg.salesData]} barGap={3}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0EDE8" vertical={false} />
                <XAxis dataKey="month" fontSize={10} tickLine={false} axisLine={false} stroke="#BBB" />
                <YAxis fontSize={10} tickLine={false} axisLine={false} stroke="#BBB" tickFormatter={fmtRupee} />
                <Tooltip {...tooltipStyle} formatter={(v: any) => fmtRupee(v)} />
                <Bar dataKey="sales"  name="Achieved" fill={C.chart1} radius={[4,4,0,0]} barSize={12} />
                <Bar dataKey="target" name="Target"   fill={C.chart2} radius={[4,4,0,0]} barSize={12} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex gap-5 mt-3">
            <Legend2 color={C.chart1} label="Achieved" />
            <Legend2 color={C.chart2} label="Target" />
          </div>
        </Card>
        <Card>
          <SectionTitle title={cfg.pipelineTitle} subtitle="Stage-wise count and value" />
          <div className="space-y-3 mt-1">
            {[...cfg.pipelineStages].map((s) => {
              const maxC = Math.max(...cfg.pipelineStages.map((x) => x.count));
              const pct  = Math.round((s.count / maxC) * 100);
              return (
                <div key={s.stage}>
                  <div className="flex justify-between text-[12px] mb-1.5">
                    <span className="font-semibold text-[#1A1A1A]">{s.stage}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-[#999]">{s.count} {cfg.dealLabel}</span>
                      <span className="font-bold" style={{ color: C.accent }}>{fmtRupee(s.value)}</span>
                    </div>
                  </div>
                  <div className="h-2 bg-[#F5F1EB] rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${C.chart1}, ${C.chart2})` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
      <Card>
        <SectionTitle title={cfg.leaderboardTitle} subtitle={cfg.leaderboardSubtitle} />
        <div className="space-y-3">
          {[...cfg.agents].map((a, i) => (
            <div key={a.name} className="flex items-center gap-4 p-4 rounded-[12px] hover:bg-[#F5F3FF] transition-colors"
              style={{ background: i === 0 ? C.light : '#F9F7F4' }}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold flex-shrink-0 text-white"
                style={{ background: rankColors[i] }}>
                {i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-bold text-[#1A1A1A]">{a.name}</p>
                <p className="text-[11px] text-[#999]">{a.closed} {cfg.dealLabel} closed</p>
              </div>
              <div className="text-right">
                <p className="text-[13px] font-bold" style={{ color: C.accent }}>{fmtRupee(a.revenue)}</p>
                <p className="text-[10px] text-[#BBB]">revenue</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

const PIE_COLORS_CAMPAIGN = ['#0D9488', '#6366F1', '#D97706'];
const PIE_COLORS_MARKETING = ['#0EA5E9', '#6366F1', '#0D9488', '#059669', '#7C3AED'];

// ─── Campaign Report Component ────────────────────────────────────────────────
function CampaignReport({ cfg }: { cfg: Cfg }) {
  const C = TAB_COLORS.campaign;

  const channelBadge: Record<string, string> = {
    WhatsApp: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    Email:    'bg-blue-50 text-blue-700 border-blue-100',
    SMS:      'bg-amber-50 text-amber-700 border-amber-100',
  };
  const statusBadge: Record<string, string> = {
    COMPLETED:   'bg-emerald-50 text-emerald-700',
    IN_PROGRESS: 'bg-blue-50 text-blue-700',
    SCHEDULED:   'bg-violet-50 text-violet-700',
    DRAFT:       'bg-[#F5F1EB] text-[#888]',
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cfg.campaignKpis.map((k) => <KpiCard key={k.label} {...k} accent={C.accent} light={C.light} />)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly leads from campaigns */}
        <Card>
          <SectionTitle title={cfg.campaignMonthlyTitle} subtitle="Leads attributed to campaigns" />
          <div className="h-[230px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={cfg.campaignMonthlyData}>
                <defs>
                  <linearGradient id="campGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={C.chart1} stopOpacity={0.18} />
                    <stop offset="95%" stopColor={C.chart1} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0EDE8" vertical={false} />
                <XAxis dataKey="month" fontSize={10} tickLine={false} axisLine={false} stroke="#BBB" />
                <YAxis fontSize={10} tickLine={false} axisLine={false} stroke="#BBB" />
                <Tooltip {...tooltipStyle} />
                <Area type="monotone" dataKey="leads" name="Leads" stroke={C.chart1} fill="url(#campGrad)" strokeWidth={2.5} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Channel Mix Donut */}
        <Card>
          <SectionTitle title="Campaign Channel Mix" subtitle="Distribution by channel type" />
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <RechartPie>
                <Pie data={[...cfg.campaignChannelMix]} cx="50%" cy="50%" innerRadius={58} outerRadius={88} paddingAngle={3} dataKey="value">
                  {[...cfg.campaignChannelMix].map((_, i) => <Cell key={i} fill={PIE_COLORS_CAMPAIGN[i % PIE_COLORS_CAMPAIGN.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: '#fff', border: '1px solid #E8E3DC', borderRadius: 10, fontSize: 12 }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              </RechartPie>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Campaign Performance Table */}
      <Card>
        <SectionTitle title="Campaign Performance" subtitle="Results across all recent campaigns" />
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="text-[11px] text-[#999] uppercase tracking-wide border-b border-black/5">
                {['Campaign Name', 'Channel', 'Status', 'Sent', 'Delivered', 'Opened', 'Converted', 'Open Rate'].map(h => (
                  <th key={h} className="pb-3 text-left font-semibold whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-black/4">
              {[...cfg.campaignRows].map((row, i) => {
                const openRate = row.sent > 0 ? Math.round((row.opened / row.sent) * 100) : 0;
                return (
                  <tr key={i} className="hover:bg-[#F9F7F4] transition-colors">
                    <td className="py-3 font-semibold text-[#1A1A1A]">{row.name}</td>
                    <td className="py-3">
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${channelBadge[row.channel] ?? channelBadge.Email}`}>{row.channel}</span>
                    </td>
                    <td className="py-3">
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${statusBadge[row.status] ?? statusBadge.DRAFT}`}>{row.status.replace('_',' ')}</span>
                    </td>
                    <td className="py-3 text-[#555]">{row.sent.toLocaleString()}</td>
                    <td className="py-3 text-[#555]">{row.delivered.toLocaleString()}</td>
                    <td className="py-3 text-[#555]">{row.opened.toLocaleString()}</td>
                    <td className="py-3 font-bold text-emerald-700">{row.converted.toLocaleString()}</td>
                    <td className="py-3">
                      {row.sent > 0 ? (
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-16 bg-[#F5F1EB] rounded-full overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${openRate}%`, background: C.accent }} />
                          </div>
                          <span className="text-[12px] font-bold" style={{ color: C.accent }}>{openRate}%</span>
                        </div>
                      ) : <span className="text-[#BBB] text-[11px]">Pending</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// ─── Marketing Report Component ───────────────────────────────────────────────
function MarketingReport({ cfg }: { cfg: Cfg }) {
  const C = TAB_COLORS.marketing;

  // Find lead label from cost label to stay consistent
  const cplLabel = cfg.marketingKpis.find(k => k.label.startsWith('Cost'))?.label ?? 'Cost Per Lead';
  const leadLabel = cplLabel.replace('Cost Per ', '') + 's';

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cfg.marketingKpis.map((k) => <KpiCard key={k.label} {...k} accent={C.accent} light={C.light} />)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Spend vs Leads */}
        <Card>
          <SectionTitle title={cfg.marketingSpendVsLeadsTitle} subtitle="Budget efficiency over time" />
          <div className="h-[230px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[...cfg.marketingMonthlySpendLeads]} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0EDE8" vertical={false} />
                <XAxis dataKey="month" fontSize={10} tickLine={false} axisLine={false} stroke="#BBB" />
                <YAxis yAxisId="left"  fontSize={10} tickLine={false} axisLine={false} stroke="#BBB" tickFormatter={fmtRupee} />
                <YAxis yAxisId="right" orientation="right" fontSize={10} tickLine={false} axisLine={false} stroke="#BBB" />
                <Tooltip {...tooltipStyle} />
                <Bar yAxisId="left"  dataKey="spend" name="Spend"        fill={C.chart2} radius={[4,4,0,0]} barSize={12} />
                <Bar yAxisId="right" dataKey="leads" name={leadLabel}   fill={C.chart1} radius={[4,4,0,0]} barSize={12} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex gap-5 mt-3">
            <Legend2 color={C.chart1} label={leadLabel} />
            <Legend2 color={C.chart2} label="Ad Spend" />
          </div>
        </Card>

        {/* Channel ROI Donut */}
        <Card>
          <SectionTitle title={cfg.marketingSourceMixTitle} subtitle={`${leadLabel} by acquisition source`} />
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <RechartPie>
                <Pie data={cfg.marketingChannelROI.map(c => ({ name: c.channel, value: c.leads }))} cx="50%" cy="50%" outerRadius={85} paddingAngle={3} dataKey="value">
                  {cfg.marketingChannelROI.map((_, i) => <Cell key={i} fill={PIE_COLORS_MARKETING[i % PIE_COLORS_MARKETING.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: '#fff', border: '1px solid #E8E3DC', borderRadius: 10, fontSize: 12 }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              </RechartPie>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Channel ROI Table */}
      <Card>
        <SectionTitle title={cfg.marketingRoiTitle} subtitle="Cost efficiency across every acquisition channel" />
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="text-[11px] text-[#999] uppercase tracking-wide border-b border-black/5">
                {['Channel', 'Ad Spend', leadLabel, 'Cost Per Lead', 'ROI Score'].map(h => (
                  <th key={h} className="pb-3 text-left font-semibold whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-black/4">
              {[...cfg.marketingChannelROI].map((row, i) => (
                <tr key={i} className="hover:bg-[#F9F7F4] transition-colors">
                  <td className="py-3 font-bold text-[#1A1A1A]">{row.channel}</td>
                  <td className="py-3 text-[#555]">₹{row.spend.toLocaleString()}</td>
                  <td className="py-3 font-semibold text-[#1A1A1A]">{row.leads}</td>
                  <td className="py-3 text-[#555]">₹{row.cpl}</td>
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-20 bg-[#F5F1EB] rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${Math.min(row.roi * 10, 100)}%`, background: C.accent }} />
                      </div>
                      <span className="text-[12px] font-bold" style={{ color: C.accent }}>{row.roi}x</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Top Keywords */}
      <Card>
        <SectionTitle title="Top Search Keywords" subtitle="Organic & paid keyword performance" />
        <div className="space-y-3">
          {[...cfg.marketingTopKeywords].map((kw, i) => (
            <div key={kw.keyword} className="flex items-center gap-4 p-3.5 rounded-[10px]" style={{ background: i === 0 ? C.light : '#F9F7F4' }}>
              <span className="text-[11px] font-bold w-5" style={{ color: i === 0 ? C.accent : '#BBB' }}>#{i + 1}</span>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-[#1A1A1A] truncate">{kw.keyword}</p>
                <p className="text-[11px] text-[#999]">{kw.impressions.toLocaleString()} impressions</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-[13px] font-bold text-[#1A1A1A]">{kw.clicks.toLocaleString()} clicks</p>
                <p className="text-[11px]" style={{ color: C.accent }}>{kw.ctr}% CTR</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
type TabId = 'leads' | 'communication' | 'finance' | 'notifications' | 'sales' | 'campaign' | 'marketing';

export default function ReportsPage() {
  const { user } = useAuthStore();
  const { fetchFunnel, fetchPrograms, fetchFinance, fetchLeadStats, fetchCounselors } = useReportStore();
  const sector = user?.sector ?? 'GENERIC';
  const cfg: Cfg = (SECTOR_CONFIG as Record<string, SectorCfg>)[sector] ?? SECTOR_CONFIG.GENERIC;

  const [activeTab, setActiveTab] = useState<TabId>('marketing');
  const [exporting, setExporting] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    fetchFunnel(); fetchPrograms(); fetchFinance(); fetchLeadStats(); fetchCounselors();
  }, [fetchFunnel, fetchPrograms, fetchFinance, fetchLeadStats, fetchCounselors]);

  // Dynamic tabs — sector-aware labels, fixed ids (arranged logically by funnel stages)
  const TABS: { id: TabId; label: string; icon: any }[] = [
    { id: 'marketing',     label: 'Marketing',      icon: Globe },
    { id: 'campaign',      label: 'Campaigns',      icon: Radio },
    { id: 'leads',         label: cfg.leadsTab,    icon: Users },
    { id: 'communication', label: 'Communication',  icon: MessageSquare },
    { id: 'sales',         label: cfg.salesTab,     icon: TrendingUp },
    { id: 'finance',       label: cfg.financeTab,   icon: DollarSign },
    { id: 'notifications', label: 'Notifications',  icon: Bell },
  ];

  // ─── PDF Export ──────────────────────────────────────────────────────────────
  const handleExportPdf = useCallback(async () => {
    if (!contentRef.current || exporting) return;
    setExporting(true);
    try {
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import('html2canvas'), import('jspdf'),
      ]);
      const canvas = await html2canvas(contentRef.current, {
        scale: 2, useCORS: true, backgroundColor: '#F5F1EB', logging: false,
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      const pw = pdf.internal.pageSize.getWidth();
      const ph = pdf.internal.pageSize.getHeight();
      const imgW = pw - 20;
      const imgH = (imgW / canvas.width) * canvas.height;
      let y = 10, rem = imgH;
      pdf.addImage(imgData, 'PNG', 10, y, imgW, imgH);
      rem -= ph - y - 10;
      while (rem > 0) {
        pdf.addPage();
        y = -(imgH - rem) - 10;
        pdf.addImage(imgData, 'PNG', 10, y, imgW, imgH);
        rem -= ph - 20;
      }
      const tabLabel = TABS.find((t) => t.id === activeTab)?.label ?? activeTab;
      pdf.save(`compass-report-${tabLabel.toLowerCase().replace(/\s+/g, '-')}.pdf`);
    } catch (err) {
      console.error('[PDF Export]', err);
    } finally {
      setExporting(false);
    }
  }, [activeTab, exporting, TABS]);

  return (
    <MainLayout>
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-[12px] bg-[#1A1A1A] flex items-center justify-center flex-shrink-0">
            <cfg.pageIcon size={20} color="#F5F1EB" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#1A1A1A] tracking-tight">{cfg.pageTitle}</h1>
            <p className="text-sm text-[#999] mt-0.5">{cfg.pageSubtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live Data
          </div>
          <button onClick={handleExportPdf} disabled={exporting}
            className="flex items-center gap-2 text-[13px] font-semibold px-4 py-2 rounded-[8px] bg-[#1A1A1A] text-white border border-[#1A1A1A] hover:bg-[#333] transition-colors duration-200 disabled:opacity-60">
            {exporting ? <><Loader2 size={13} className="animate-spin" /> Exporting…</> : <><Download size={13} /> Export PDF</>}
          </button>
        </div>
      </div>

      {/* ── Tab Bar ── */}
      <div className="flex gap-1 bg-[#F5F1EB] p-1 rounded-[12px] mb-8 overflow-x-auto">
        {TABS.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-[9px] text-[13px] font-semibold whitespace-nowrap transition-all duration-200 flex-shrink-0 border ${
                active ? 'bg-white text-[#1A1A1A] border-black/8 shadow-sm' : 'text-[#999] border-transparent hover:text-[#555] hover:bg-white/60'
              }`}>
              <tab.icon size={14} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── Tab Content ── */}
      <div ref={contentRef}>
        {activeTab === 'leads'         && <LeadGenReport      cfg={cfg} />}
        {activeTab === 'communication' && <CommunicationReport />}
        {activeTab === 'finance'       && <FinanceReport       cfg={cfg} />}
        {activeTab === 'notifications' && <NotificationsReport />}
        {activeTab === 'sales'         && <SalesReport         cfg={cfg} />}
        {activeTab === 'campaign'      && <CampaignReport      cfg={cfg} />}
        {activeTab === 'marketing'     && <MarketingReport     cfg={cfg} />}
      </div>
    </MainLayout>
  );
}
