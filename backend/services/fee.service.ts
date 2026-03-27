import prisma from '../config/prisma';
import Razorpay from 'razorpay';
import { decrypt } from '../utils/encryption';

export class FeeService {
  private razorpay: Razorpay | null;

  constructor() {
    if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
      this.razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
      });
    } else {
      this.razorpay = null;
    }
  }

  async generateFeePlan(admissionId: string, baseAmount: number, scholarshipAmount: number = 0, installments: number = 1) {
    const finalAmount = Math.max(0, baseAmount - scholarshipAmount);
    if (finalAmount === 0 || installments <= 0) return [];

    const amountPerInstallment = finalAmount / installments;
    const generatedFees = [];

    // Create fee records spread across months
    for (let i = 0; i < installments; i++) {
      const dueDate = new Date();
      dueDate.setMonth(dueDate.getMonth() + i);

      const fee = await prisma.fee.create({
        data: {
          admissionId,
          amount: amountPerInstallment,
          dueDate,
          status: 'PENDING',
        }
      });
      generatedFees.push(fee);
    }

    const AuditService = (await import('./audit.service')).default;
    await AuditService.log(`Generated fee plan: ${installments} installments, Total: $${finalAmount} (Scholarship: $${scholarshipAmount})`, undefined, { admissionId });

    return generatedFees;
  }

  async recordPayment(data: any) {
    const payment = await prisma.payment.create({
      data: {
        feeId: data.feeId,
        amount: data.amount,
        method: data.method,
        transactionId: data.transactionId,
        status: 'SUCCESS',
      },
    });

    // Update fee status
    const fee = await prisma.fee.findUnique({
      where: { id: data.feeId },
      include: { payments: true },
    });

    if (fee) {
      const totalPaid = fee.payments.reduce((sum: number, p: any) => sum + p.amount, 0);
      const newStatus = totalPaid >= fee.amount ? 'COMPLETED' : 'PARTIAL';
      await prisma.fee.update({
        where: { id: fee.id },
        data: { status: newStatus },
      });
    }

    // Activity Logging
    const AuditService = (await import('./audit.service')).default;
    await AuditService.log(`Verified payment of $${payment.amount}`, undefined, { feeId: payment.feeId, transactionId: payment.transactionId });

    return payment;
  }

  async getRevenueStats() {
    const totalRevenue = await prisma.payment.aggregate({
      where: { status: 'SUCCESS' },
      _sum: { amount: true },
    });

    const revenueByMethod = await prisma.payment.groupBy({
      by: ['method'],
      where: { status: 'SUCCESS' },
      _sum: { amount: true },
    });

    return {
      total: totalRevenue._sum.amount || 0,
      breakdown: revenueByMethod,
    };
  }

  async getAllFees() {
    return await prisma.fee.findMany({
      include: {
        admission: {
          include: {
            application: {
              include: {
                lead: true,
                program: true,
              }
            }
          }
        },
        payments: true,
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getFeeByAdmission(admissionId: string) {
    return await prisma.fee.findFirst({
      where: { admissionId },
      include: { payments: true }
    });
  }

  async generatePaymentLink(feeId: string) {
    const fee = await prisma.fee.findUnique({ 
      where: { id: feeId }, 
      include: { admission: { include: { application: { include: { lead: true } } } } } 
    });
    
    if (!fee) throw new Error('Fee record not found');

    const totalPaid = (await prisma.payment.aggregate({ where: { feeId, status: 'SUCCESS' }, _sum: { amount: true } }))._sum.amount || 0;
    const amountDue = fee.amount - totalPaid;

    if (amountDue <= 0) throw new Error('Fee is already fully paid');

    if (this.razorpay) {
      try {
        const referenceId = `F_${fee.id}`;
        
        // Check if a link already exists for this fee
        try {
          const existingLinks = await this.razorpay.paymentLink.all({
            // Note: SDK might not support filtering by reference_id directly in .all() depending on version,
            // but the API does. If SDK fails, we'll catch and try to create anyway.
          });
          
          // Manual filtering as a fallback if the SDK filter doesn't work
          const existing = (existingLinks as any).items?.find((l: any) => l.reference_id === referenceId && l.status === 'created');
          if (existing) {
            console.log(`[Finance][Razorpay] Found existing active link for Fee ${fee.id}`);
            return { success: true, link: existing.short_url, paymentLinkId: existing.id, isNew: false };
          }
        } catch (linkError) {
          console.log('[Finance][Razorpay] Could not fetch existing links, proceeding with creation...');
        }

        const lead = fee.admission?.application?.lead;
        let email = lead?.email;
        let phone = lead?.phone;

        // Decrypt if necessary
        try {
          if (email && email.includes(':')) email = decrypt(email);
          if (phone && phone.includes(':')) phone = decrypt(phone);
        } catch (e) {
          console.error('[Finance] Decryption failed for lead data:', e);
        }

        const amount = Math.round(amountDue * 100);
        if (amount < 100) {
          throw new Error('Razorpay requires a minimum amount of 1.00 INR (100 paise). This fee is currently too low or already mostly paid.');
        }

        const payload = {
          amount,
          currency: 'INR',
          accept_partial: false,
          description: `EduCRM Tuition Installment`,
          customer: {
            name: lead?.name || 'Student',
            email: email || undefined,
            contact: phone || undefined,
          },
          notify: {
            sms: !!phone,
            email: !!email,
          },
          reminder_enable: true,
          reference_id: `F_${fee.id}`
        };

        console.log('[Finance][Razorpay] Creating Payment Link with Payload:', JSON.stringify(payload, null, 2));

        const paymentLink = await this.razorpay.paymentLink.create(payload);
        return { success: true, link: paymentLink.short_url, paymentLinkId: paymentLink.id, isNew: true };
      } catch (razorError: any) {
        console.error('[Finance][Razorpay] Complete Error Object:', JSON.stringify(razorError, null, 2));
        const errorMessage = razorError.error?.description || razorError.description || razorError.message || 'Unknown error';
        throw new Error(`Razorpay Error: ${errorMessage}`);
      }
    } else {
      console.log(`[Finance][Simulation] Razorpay keys missing. Mocking Payment Link for ${fee.id}`);
      return { success: true, link: `https://rzp.io/mock/${fee.id}`, paymentLinkId: `mock_${Date.now()}`, isNew: true };
    }
  }

  async syncPaymentStatus(feeId: string) {
    const fee = await prisma.fee.findUnique({ where: { id: feeId } });
    if (!fee) throw new Error('Fee record not found');
    if (fee.status === 'COMPLETED') return { status: 'COMPLETED', updated: false };

    if (this.razorpay) {
      try {
        const referenceId = `F_${fee.id}`;
        const links = await this.razorpay.paymentLink.all({
          reference_id: referenceId
        } as any);
        const paidLink = (links as any).items?.find((l: any) => l.reference_id === referenceId && l.status === 'paid');

        if (paidLink) {
          await this.recordPayment({
            feeId,
            amount: paidLink.amount_paid / 100,
            method: 'Razorpay (Manual Sync)',
            transactionId: paidLink.payment_id,
          });
          return { status: 'COMPLETED', updated: true };
        }
        return { status: fee.status, updated: false, message: 'No paid links found for this fee' };
      } catch (error: any) {
        console.error('[Finance][Sync] Razorpay Sync Error:', error);
        throw new Error(`Sync Failed: ${error.message}`);
      }
    }
    return { status: fee.status, updated: false, message: 'Simulation mode: Sync not possible' };
  }

  async getExistingLink(feeId: string) {
    if (this.razorpay) {
      try {
        const referenceId = `F_${feeId}`;
        // Pass reference_id to API to filter correctly and avoid pagination issues
        const links = await this.razorpay.paymentLink.all({
          reference_id: referenceId
        } as any);
        
        const active = (links as any).items?.find((l: any) => l.reference_id === referenceId && l.status === 'created');
        
        if (active) {
          return { success: true, link: active.short_url, paymentLinkId: active.id };
        }
      } catch (error) {
        console.error('[Finance] Error fetching existing link:', error);
      }
    }
    return null;
  }
}

export default new FeeService();
