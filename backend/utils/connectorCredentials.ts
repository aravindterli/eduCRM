/**
 * ConnectorCredentials Utility
 *
 * Centralised resolver for per-tenant third-party integration credentials.
 * Priority order:
 *   1. Tenant connector config stored in `tenant.config` JSON column
 *   2. Global `.env` variables (fallback — keeps existing setups working)
 *   3. If neither is present: throws ConnectorNotConfiguredError
 *
 * Uses a lightweight 30-second in-memory cache per tenant to avoid N+1 DB reads.
 */

import prisma from '../config/prisma';
import { ConnectorNotConfiguredError } from './connectorError';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface TwilioCredentials {
  accountSid: string;
  authToken: string;
  phoneNumber: string;
  twimlAppSid?: string;
  apiKey?: string;
  apiSecret?: string;
}

export interface MetaCredentials {
  whatsappToken: string;
  phoneNumberId: string;
  accessToken?: string;
  pageId?: string;
  appSecret?: string;
  verifyToken?: string;
}

export interface RazorpayCredentials {
  keyId: string;
  keySecret: string;
  webhookSecret?: string;
}

export interface SmtpCredentials {
  host: string;
  port: number;
  user: string;
  pass: string;
  from: string;
  secure: boolean;
}

export interface GoogleAdsCredentials {
  webhookKey: string;
}

// ─── Cache ────────────────────────────────────────────────────────────────────

interface CacheEntry {
  config: Record<string, any>;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 30_000; // 30 seconds

async function getConfig(tenantId: string): Promise<Record<string, any>> {
  const now = Date.now();
  const cached = cache.get(tenantId);
  if (cached && cached.expiresAt > now) return cached.config;

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { config: true },
  });

  const config = (tenant?.config as Record<string, any>) || {};
  cache.set(tenantId, { config, expiresAt: now + CACHE_TTL_MS });
  return config;
}

/** Call this whenever a tenant updates their config so the cache is invalidated */
export function invalidateConnectorCache(tenantId: string): void {
  cache.delete(tenantId);
}

// ─── Resolvers ────────────────────────────────────────────────────────────────

export const ConnectorCredentials = {
  /**
   * Resolve Twilio credentials for a tenant.
   * Falls back to .env values if tenant has not configured Twilio.
   * Throws ConnectorNotConfiguredError if neither is available.
   */
  async getTwilio(tenantId: string): Promise<TwilioCredentials> {
    const config = await getConfig(tenantId);
    const t = config.twilio || {};

    const accountSid = t.accountSid || process.env.TWILIO_ACCOUNT_SID || '';
    const authToken = t.authToken || process.env.TWILIO_AUTH_TOKEN || '';
    const phoneNumber = t.phoneNumber || process.env.TWILIO_PHONE_NUMBER || '';

    if (!accountSid || !authToken || !phoneNumber) {
      throw new ConnectorNotConfiguredError(
        'Twilio',
        'Please configure your Twilio Account SID, Auth Token, and Phone Number in Settings → Connectors to send SMS / make calls.'
      );
    }

    return {
      accountSid,
      authToken,
      phoneNumber,
      twimlAppSid: t.twimlAppSid || process.env.TWILIO_TWIML_APP_SID,
      apiKey: t.apiKey || process.env.TWILIO_API_KEY,
      apiSecret: t.apiSecret || process.env.TWILIO_API_SECRET,
    };
  },

  /**
   * Resolve Meta / WhatsApp credentials for a tenant.
   * Throws ConnectorNotConfiguredError if neither tenant config nor .env is set.
   */
  async getMeta(tenantId: string): Promise<MetaCredentials> {
    const config = await getConfig(tenantId);
    const m = config.meta || {};

    const whatsappToken = m.whatsappToken || process.env.META_WHATSAPP_TOKEN || '';
    const phoneNumberId = m.phoneNumberId || process.env.META_PHONE_NUMBER_ID || '';

    if (!whatsappToken || !phoneNumberId) {
      throw new ConnectorNotConfiguredError(
        'Meta (WhatsApp)',
        'Please configure your Meta WhatsApp Token and Phone Number ID in Settings → Connectors to send WhatsApp messages.'
      );
    }

    return {
      whatsappToken,
      phoneNumberId,
      accessToken: m.accessToken || process.env.META_ACCESS_TOKEN,
      pageId: m.pageId || process.env.META_PAGE_ID,
      appSecret: m.appSecret || process.env.META_APP_SECRET,
      verifyToken: m.verifyToken || process.env.META_VERIFY_TOKEN,
    };
  },

  /**
   * Resolve Razorpay credentials for a tenant.
   * Throws ConnectorNotConfiguredError if neither is available.
   */
  async getRazorpay(tenantId: string): Promise<RazorpayCredentials> {
    const config = await getConfig(tenantId);
    const r = config.razorpay || {};

    const keyId = r.keyId || process.env.RAZORPAY_KEY_ID || '';
    const keySecret = r.keySecret || process.env.RAZORPAY_KEY_SECRET || '';

    if (!keyId || !keySecret) {
      throw new ConnectorNotConfiguredError(
        'Razorpay',
        'Please configure your Razorpay Key ID and Key Secret in Settings → Connectors to generate payment links.'
      );
    }

    return {
      keyId,
      keySecret,
      webhookSecret: r.webhookSecret || process.env.RAZORPAY_WEBHOOK_SECRET,
    };
  },

  /**
   * Resolve SMTP credentials for a tenant.
   * Throws ConnectorNotConfiguredError if neither is available.
   */
  async getSmtp(tenantId: string): Promise<SmtpCredentials> {
    const config = await getConfig(tenantId);
    const s = config.smtp || {};

    const host = s.host || process.env.SMTP_HOST || '';
    const user = s.user || process.env.SMTP_USER || '';
    const pass = s.pass || process.env.SMTP_PASS || '';

    if (!host || !user || !pass) {
      throw new ConnectorNotConfiguredError(
        'SMTP Email',
        'Please configure your SMTP email credentials in Settings → Connectors to send email notifications.'
      );
    }

    return {
      host,
      port: Number(s.port || process.env.SMTP_PORT || 587),
      user,
      pass,
      from: s.from || process.env.EMAIL_FROM || `"CentraCRM" <no-reply@centracrm.com>`,
      secure: s.secure === true || s.secure === 'true' || false,
    };
  },

  /**
   * Resolve Google Ads webhook key for a tenant.
   * Throws ConnectorNotConfiguredError if neither is available.
   */
  async getGoogleAds(tenantId: string): Promise<GoogleAdsCredentials> {
    const config = await getConfig(tenantId);
    const g = config.googleAds || {};

    const webhookKey = g.webhookKey || process.env.GOOGLE_ADS_WEBHOOK_KEY || '';

    if (!webhookKey) {
      throw new ConnectorNotConfiguredError(
        'Google Ads',
        'Please configure your Google Ads Webhook Key in Settings → Connectors to receive Google Ads leads.'
      );
    }

    return { webhookKey };
  },

  /**
   * Returns a status map of which connectors are configured for a tenant.
   * Does NOT expose secrets — just boolean configured flags.
   */
  async getStatusMap(tenantId: string): Promise<Record<string, { configured: boolean; source: 'tenant' | 'env' | 'none' }>> {
    const config = await getConfig(tenantId);
    const t = config.twilio || {};
    const m = config.meta || {};
    const r = config.razorpay || {};
    const s = config.smtp || {};
    const g = config.googleAds || {};

    const check = (tenantValue: any, envValue: any): { configured: boolean; source: 'tenant' | 'env' | 'none' } => {
      if (tenantValue) return { configured: true, source: 'tenant' };
      if (envValue) return { configured: true, source: 'env' };
      return { configured: false, source: 'none' };
    };

    return {
      twilio: check(t.accountSid, process.env.TWILIO_ACCOUNT_SID),
      meta: check(m.whatsappToken, process.env.META_WHATSAPP_TOKEN),
      razorpay: check(r.keyId, process.env.RAZORPAY_KEY_ID),
      smtp: check(s.host, process.env.SMTP_HOST),
      googleAds: check(g.webhookKey, process.env.GOOGLE_ADS_WEBHOOK_KEY),
    };
  },
};

export default ConnectorCredentials;
