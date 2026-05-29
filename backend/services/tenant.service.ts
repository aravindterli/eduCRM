import prisma from '../config/prisma';
import { Sector } from '@prisma/client';
import bcrypt from 'bcryptjs';

export class TenantService {
  async createTenant(data: { 
    name: string; 
    slug: string; 
    sector: Sector; 
    config?: any;
    adminName: string;
    adminEmail: string;
    adminPassword?: string;
  }) {
    const hashedPassword = await bcrypt.hash(data.adminPassword || 'admin123', 10);

    return await prisma.$transaction(async (tx) => {
      // 1. Create Tenant
      const tenant = await tx.tenant.create({
        data: {
          name: data.name,
          slug: data.slug,
          sector: data.sector,
          config: data.config || {},
        },
      });

      // 2. Create Admin Role for this tenant
      const adminRole = await tx.role.create({
        data: {
          name: 'Admin',
          type: 'ADMIN' as any,
          permissions: {
            description: 'Default permissions for Admin'
          },
          tenantId: tenant.id
        }
      });

      // 3. Create Admin User
      await tx.user.create({
        data: {
          name: data.adminName,
          email: data.adminEmail,
          password: hashedPassword,
          roleId: adminRole.id,
          tenantId: tenant.id,
        }
      });

      return tenant;
    });
  }

  async getAllTenants() {
    return await prisma.tenant.findMany({
      include: {
        _count: {
          select: {
            users: true,
            leads: true,
          }
        }
      }
    });
  }

  async getTenantById(id: string) {
    return await prisma.tenant.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            users: true,
            leads: true,
          }
        }
      }
    });
  }

  async updateTenant(id: string, data: Partial<{ name: string; sector: Sector; config: any; subscriptionStatus: string }>) {
    return await prisma.tenant.update({
      where: { id },
      data
    });
  }

  async getSystemStats() {
    const [tenantCount, userCount, leadCount, revenue] = await Promise.all([
      prisma.tenant.count(),
      prisma.user.count(),
      prisma.lead.count(),
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: { status: 'SUCCESS' }
      })
    ]);

    return {
      totalTenants: tenantCount,
      totalUsers: userCount,
      totalLeads: leadCount,
      totalRevenue: revenue._sum.amount || 0,
    };
  }

  async getGlobalLeads(params: { limit: number; offset: number; sector?: Sector; search?: string }) {
    const where: any = {};
    
    if (params.sector) {
      where.tenant = { sector: params.sector };
    }

    if (params.search) {
      where.OR = [
        { name: { contains: params.search, mode: 'insensitive' } },
        { email: { contains: params.search, mode: 'insensitive' } },
        { phone: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    return await prisma.lead.findMany({
      where,
      include: {
        tenant: {
          select: { name: true, sector: true }
        }
      },
      take: params.limit,
      skip: params.offset,
      orderBy: { createdAt: 'desc' }
    });
  }

  async getBillingSummary() {
    const tenants = await prisma.tenant.findMany({
      select: {
        id: true,
        name: true,
        subscriptionPlan: true,
        subscriptionStatus: true,
        nextBillingDate: true,
        _count: { select: { payments: true } }
      }
    });
    return tenants;
  }

  // Form Management
  async getFormTemplates(sector?: Sector) {
    return await prisma.formTemplate.findMany({
      where: sector ? { sector } : {},
    });
  }

  async createFormTemplate(data: any) {
    return await prisma.formTemplate.create({ data });
  }

  async getActiveFormTemplate(tenantId: string, sector: Sector) {
    const globalTemplate = await prisma.formTemplate.findFirst({
      where: { sector: 'GENERIC', isActive: true },
      orderBy: { createdAt: 'desc' }
    });

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { config: true }
    });

    const tenantConfig = tenant?.config as any;
    const tenantCustomFields = tenantConfig?.customFields || [];
    const globalFields = (globalTemplate?.fields as any[]) || [];
    
    const mergedFields = [...globalFields];
    tenantCustomFields.forEach((field: any) => {
      const exists = mergedFields.find(f => f.name === field.name);
      if (!exists) {
        mergedFields.push(field);
      }
    });

    if (!globalTemplate) {
      return {
        id: 'default',
        name: 'Default Template',
        sector: 'GENERIC' as Sector,
        fields: mergedFields,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        tenantId: 'system'
      };
    }

    return {
      ...globalTemplate,
      fields: mergedFields,
    };
  }

  async getAnalytics() {
    // 1. Revenue by month (last 6 months)
    const revenueByMonth = await prisma.payment.groupBy({
      by: ['createdAt'],
      _sum: { amount: true },
      where: { status: 'SUCCESS' },
      orderBy: { createdAt: 'asc' }
    });

    // 2. Leads by month
    const leadsByMonth = await prisma.lead.groupBy({
      by: ['createdAt'],
      _count: { id: true },
      orderBy: { createdAt: 'asc' }
    });

    // 3. Tenants by Sector
    const tenantsBySector = await prisma.tenant.groupBy({
      by: ['sector'],
      _count: { id: true }
    });

    // 4. Top Tenants (by lead count)
    const topTenants = await prisma.tenant.findMany({
      include: {
        _count: { select: { leads: true } }
      },
      orderBy: {
        leads: { _count: 'desc' }
      },
      take: 5
    });

    return {
      revenueByMonth,
      leadsByMonth,
      tenantsBySector,
      topTenants
    };
  }
}

export default new TenantService();
