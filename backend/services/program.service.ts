
import prisma from '../config/prisma';

export class ProgramService {
  async getAllPrograms(tenantId?: string) {
    return await prisma.program.findMany({
      where: tenantId ? { tenantId } : {},
      orderBy: { name: 'asc' }
    });
  }

  async updateProgram(id: string, data: any) {
    return await prisma.program.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        baseFee: data.baseFee,
      }
    });
  }

  async createProgram(data: any) {
    return await prisma.program.create({
      data: {
        name: data.name,
        description: data.description,
        baseFee: data.baseFee || 0,
        tenantId: data.tenantId,
      }
    });
  }
}

export default new ProgramService();
