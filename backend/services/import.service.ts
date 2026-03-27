import prisma from '../config/prisma';
import assignmentService from './assignment.service';

export class ImportService {
  async importLeadsFromCSV(leadsData: any[]) {
    const results = {
      total: leadsData.length,
      success: 0,
      failed: 0,
      errors: [] as any[]
    };

    for (const data of leadsData) {
      try {
        // 1. Create Lead
        const lead = await prisma.lead.create({
          data: {
            name: data.name,
            email: data.email,
            phone: data.phone,
            leadSource: data.leadSource || 'CSV_IMPORT',
            location: data.location,
            eduBackground: data.eduBackground,
            stage: 'NEW_LEAD',
          }
        });

        // 2. Auto-Assign
        await assignmentService.assignLead(lead.id);

        results.success++;
      } catch (error: any) {
        results.failed++;
        results.errors.push({ name: data.name, error: error.message });
      }
    }

    return results;
  }
}

export default new ImportService();
