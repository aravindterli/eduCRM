import prisma from '../config/prisma';

export class ReportService {
  async getLeadAnalytics() {
    const leadsBySource = await prisma.lead.groupBy({
      by: ['leadSource'],
      _count: { id: true },
    });

    const leadsByStage = await prisma.lead.groupBy({
      by: ['stage'],
      _count: { id: true },
    });

    const dailyLeads: any[] = await prisma.$queryRaw`
      SELECT CAST("createdAt" AS DATE) as date, COUNT(id)::int as count
      FROM "Lead"
      GROUP BY CAST("createdAt" AS DATE)
      ORDER BY date DESC
      LIMIT 30
    `;

    return {
      leadsBySource,
      leadsByStage,
      dailyLeads: this.serializeBigInt(dailyLeads),
    };
  }

  // Helper to convert BigInt to Number for JSON serialization
  private serializeBigInt(data: any): any {
    return JSON.parse(
      JSON.stringify(data, (key, value) => {
        return typeof value === 'bigint' ? Number(value) : value;
      })
    );
  }

  async getConversionFunnel() {
    const totalLeads = await prisma.lead.count();
    const scheduledCounseling = await prisma.counselingLog.count();
    const submittedApplications = await prisma.application.count({
      where: { status: { in: ['SUBMITTED', 'VERIFIED', 'VERIFICATION_PENDING'] } }
    });
    const confirmedAdmissions = await prisma.admission.count();

    return [
      { stage: 'Leads', count: totalLeads },
      { stage: 'Counseling', count: scheduledCounseling },
      { stage: 'Applications', count: submittedApplications },
      { stage: 'Admissions', count: confirmedAdmissions },
    ];
  }

  async getProgramPerformance() {
    return await prisma.program.findMany({
      select: {
        name: true,
        _count: {
          select: {
            applications: true,
            admissions: true,
          }
        }
      },
      orderBy: {
        applications: { _count: 'desc' }
      }
    });
  }

  async getFinancialAnalytics() {
    const revenueByMonth: any[] = await prisma.$queryRaw`
      SELECT 
        DATE_TRUNC('month', "createdAt") as month,
        SUM(amount) as revenue
      FROM "Payment"
      WHERE status = 'SUCCESS'
      GROUP BY month
      ORDER BY month ASC
    `;

    const feesByStatus = await prisma.fee.groupBy({
      by: ['status'],
      _count: { id: true },
      _sum: { amount: true }
    });

    return {
      revenueByMonth: this.serializeBigInt(revenueByMonth),
      feesByStatus
    };
  }

  async getCounselorPerformance() {
    return await prisma.user.findMany({
      where: { role: { type: 'COUNSELOR' } },
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            leads: true,
            counselingSessions: true,
          }
        }
      }
    });
  }

  async getRecentActivities() {
    return await prisma.auditLog.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        action: true,
        userId: true,
        createdAt: true,
        details: true
      }
    });
  }
}

export default new ReportService();
