
import prisma from '../config/prisma';

export class ProgramService {
  async getAllPrograms() {
    return await prisma.program.findMany({
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
      }
    });
  }
}

export default new ProgramService();
