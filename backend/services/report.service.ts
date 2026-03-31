import PDFDocument from 'pdfkit';
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

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const leadsToday = await prisma.lead.count({
      where: { createdAt: { gte: today } }
    });

    return {
      leadsToday,
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
      { 
        stage: 'Upcoming Webinars', 
        count: await prisma.webinar.count({ where: { date: { gte: new Date() } } }),
        details: await (await import('./webinar.service')).default.getUpcomingWebinars()
      },
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

  async getMonthlyReport() {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [newLeads, newApplications, newAdmissions, monthlyRevenue] = await Promise.all([
      prisma.lead.count({ where: { createdAt: { gte: startOfMonth } } }),
      prisma.application.count({ where: { createdAt: { gte: startOfMonth } } }),
      prisma.admission.count({ where: { admittedAt: { gte: startOfMonth } } }),
      prisma.payment.aggregate({
        where: { 
          status: 'SUCCESS',
          createdAt: { gte: startOfMonth }
        },
        _sum: { amount: true }
      })
    ]);

    const leadsBySource = await prisma.lead.groupBy({
      by: ['leadSource'],
      where: { createdAt: { gte: startOfMonth } },
      _count: { id: true }
    });

    return {
      month: startOfMonth.toLocaleString('default', { month: 'long', year: 'numeric' }),
      metrics: {
        newLeads,
        newApplications,
        newAdmissions,
        revenue: monthlyRevenue._sum.amount || 0
      },
      leadsBySource: this.serializeBigInt(leadsBySource)
    };
  }

  async generateMonthlyPDF(doc: PDFKit.PDFDocument, data: any) {
    // Header
    doc.fillColor('#2563eb').fontSize(24).text('EduCRM', 50, 50);
    doc.fillColor('#64748b').fontSize(10).text('MONTHLY PERFORMANCE REPORT', 50, 80);
    doc.fillColor('#1e293b').fontSize(14).text(data.month, 50, 95);
    
    doc.moveTo(50, 120).lineTo(550, 120).stroke('#e2e8f0');

    // Metrics grid (simulated)
    let x = 50;
    let y = 150;
    
    const metrics = [
        { label: 'NEW LEADS', value: data.metrics.newLeads },
        { label: 'APPLICATIONS', value: data.metrics.newApplications },
        { label: 'ADMISSIONS', value: data.metrics.newAdmissions },
        { label: 'REVENUE', value: `INR ${data.metrics.revenue.toLocaleString()}` }
    ];

    metrics.forEach((m, i) => {
        doc.fillColor('#f8fafc').roundedRect(x, y, 115, 60, 8).fill();
        doc.fillColor('#64748b').fontSize(8).text(m.label, x + 10, y + 15);
        doc.fillColor('#1e293b').fontSize(12).text(m.value.toString(), x + 10, y + 30);
        x += 125;
    });

    // Lead Source Table
    y = 250;
    doc.fillColor('#1e293b').fontSize(12).text('Lead Source Breakdown', 50, y);
    y += 25;
    
    // Table Header
    doc.fillColor('#f1f5f9').rect(50, y, 500, 20).fill();
    doc.fillColor('#475569').fontSize(8).text('SOURCE', 60, y + 7);
    doc.text('TOTAL LEADS', 250, y + 7);
    doc.text('SHARE %', 450, y + 7);
    
    y += 30;
    
    data.leadsBySource.forEach((s: any) => {
        doc.fillColor('#1e293b').fontSize(9).text(s.leadSource, 60, y);
        doc.text(s._count.id.toString(), 250, y);
        const share = Math.round((s._count.id / (data.metrics.newLeads || 1)) * 100);
        doc.text(`${share}%`, 450, y);
        
        doc.moveTo(50, y + 15).lineTo(550, y + 15).stroke('#f1f5f9');
        y += 25;
    });

    // Footer
    doc.fillColor('#94a3b8').fontSize(8).text(`Generated on ${new Date().toLocaleString()} • EduCRM Intelligence`, 50, 700, { align: 'center', width: 500 });
    
    doc.end();
  }

  async generateReceiptPDF(doc: PDFKit.PDFDocument, feeId: string) {
    const fee = await prisma.fee.findUnique({
      where: { id: feeId },
      include: {
        admission: {
          include: {
            application: {
              include: {
                lead: true,
                program: true
              }
            }
          }
        },
        payments: {
          where: { status: 'SUCCESS' },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!fee) throw new Error('Fee record not found');

    const lead = fee.admission.application.lead;
    const program = fee.admission.application.program;
    const totalPaid = fee.payments.reduce((sum, p) => sum + p.amount, 0);

    // Decorative Header
    doc.rect(0, 0, 612, 120).fill('#0f172a');
    doc.fillColor('#3b82f6').fontSize(28).text('EduCRM', 50, 45, { characterSpacing: 1 });
    doc.fillColor('#ffffff').fontSize(10).text('OFFICIAL PAYMENT RECEIPT', 50, 80, { characterSpacing: 2 });
    
    // Receipt Info (Right aligned in header)
    doc.fillColor('#94a3b8').fontSize(8).text('RECEIPT NO:', 400, 45);
    doc.fillColor('#ffffff').fontSize(10).text(fee.id.split('-')[0].toUpperCase(), 400, 58);
    doc.fillColor('#94a3b8').fontSize(8).text('DATE:', 400, 75);
    doc.fillColor('#ffffff').fontSize(10).text(new Date().toLocaleDateString(), 400, 88);

    // Student & Program Section
    let y = 150;
    doc.fillColor('#1e293b').fontSize(12).text('Billed To:', 50, y);
    doc.fontSize(14).font('Helvetica-Bold').text(lead.name, 50, y + 20);
    doc.fontSize(10).font('Helvetica').fillColor('#64748b').text(`Enrollment ID: ${fee.admission.enrollmentId}`, 50, y + 40);
    doc.text(`Phone: ${lead.phone}`, 50, y + 55);
    
    doc.fillColor('#1e293b').fontSize(12).text('Program Details:', 300, y);
    doc.fontSize(11).font('Helvetica-Bold').text(program.name, 300, y + 20);
    doc.fontSize(9).font('Helvetica').fillColor('#64748b').text('Global Education Partnership', 300, y + 40);

    // Payment Summary Boxes
    y = 250;
    const boxes = [
      { label: 'TOTAL FEE', value: `INR ${fee.amount.toLocaleString()}`, color: '#f1f5f9', text: '#475569' },
      { label: 'AMOUNT PAID', value: `INR ${totalPaid.toLocaleString()}`, color: '#f0fdf4', text: '#16a34a' },
      { label: 'BALANCE DUE', value: `INR ${(fee.amount - totalPaid).toLocaleString()}`, color: '#fff7ed', text: '#ea580c' }
    ];

    let x = 50;
    boxes.forEach(box => {
      doc.fillColor(box.color).roundedRect(x, y, 160, 60, 8).fill();
      doc.fillColor('#94a3b8').fontSize(8).text(box.label, x + 15, y + 15);
      doc.fillColor(box.text).fontSize(14).font('Helvetica-Bold').text(box.value, x + 15, y + 30);
      x += 175;
    });

    // Payment Table
    y = 350;
    doc.fillColor('#1e293b').fontSize(12).font('Helvetica-Bold').text('Payment History', 50, y);
    y += 25;

    // Table Header
    doc.fillColor('#f8fafc').rect(50, y, 500, 25).fill();
    doc.fillColor('#475569').fontSize(9).text('TRANSACTION ID', 60, y + 8);
    doc.text('METHOD', 200, y + 8);
    doc.text('DATE', 350, y + 8);
    doc.text('AMOUNT', 480, y + 8);

    y += 35;
    doc.font('Helvetica');
    fee.payments.forEach(p => {
      doc.fillColor('#1e293b').fontSize(9).text(p.transactionId || 'N/A', 60, y);
      doc.text(p.method, 200, y);
      doc.text(new Date(p.createdAt).toLocaleDateString(), 350, y);
      doc.font('Helvetica-Bold').text(`INR ${p.amount.toLocaleString()}`, 480, y);
      doc.font('Helvetica');
      
      doc.moveTo(50, y + 15).lineTo(550, y + 15).stroke('#f1f5f9');
      y += 30;
    });

    // Signature Area
    y = 650;
    doc.moveTo(350, y).lineTo(550, y).stroke('#e2e8f0');
    doc.fillColor('#64748b').fontSize(9).text('Authorized Signatory', 350, y + 10, { align: 'center', width: 200 });
    doc.fontSize(8).text('EduCRM Financial Department', 350, y + 25, { align: 'center', width: 200 });

    // Footer
    doc.fillColor('#cbd5e1').fontSize(8).text('This is a computer-generated document and does not require a physical signature.', 50, 730, { align: 'center', width: 500 });
    doc.fillColor('#94a3b8').text('EduCRM Global • www.educrm.com • support@educrm.com', 50, 745, { align: 'center', width: 500 });

    doc.end();
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
