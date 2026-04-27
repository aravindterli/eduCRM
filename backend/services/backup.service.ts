import { PrismaClient } from '@prisma/client';
import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';

const prisma = new PrismaClient();

export class BackupService {
  async performBackup() {
    const backupDir = path.join(__dirname, '../../backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const sqlFile = path.join(backupDir, `backup-${timestamp}.sql`);
    const jsonFile = path.join(backupDir, `backup-${timestamp}.json`);
    const dbUrl = process.env.DATABASE_URL;

    if (!dbUrl) {
      console.error('[BackupService] DATABASE_URL missing');
      return false;
    }

    console.log(`[BackupService] Starting backup sequence at ${timestamp}`);

    return new Promise((resolve) => {
      // 1. Try pg_dump first
      const command = `pg_dump "${dbUrl}" > "${sqlFile}"`;
      exec(command, async (error) => {
        if (!error) {
          console.log(`[BackupService] SQL backup successful via pg_dump: ${sqlFile}`);
          resolve(true);
          return;
        }

        console.warn('[BackupService] pg_dump failed. Falling back to Node-native extraction...');
        try {
          const backupData: any = {};
          let sqlContent = `-- CentraCRM Native SQL Backup\n-- Generated: ${new Date().toISOString()}\n\n`;
          sqlContent += "SET session_replication_role = 'replica';\n\n";

          const models = Object.keys(prisma).filter(key => 
            !key.startsWith('_') && 
            !key.startsWith('$') && 
            typeof (prisma as any)[key].findMany === 'function'
          );

          for (const modelName of models) {
            console.log(`[BackupService] Extracting ${modelName}...`);
            const records = await (prisma as any)[modelName].findMany();
            backupData[modelName] = records;

            if (records.length > 0) {
              sqlContent += this.generateSqlInsert(modelName, records);
            }
          }

          sqlContent += "\nSET session_replication_role = 'origin';\n";

          fs.writeFileSync(jsonFile, JSON.stringify(backupData, null, 2));
          fs.writeFileSync(sqlFile, sqlContent);
          
          console.log(`[BackupService] Portable backup successful: ${jsonFile} & ${sqlFile}`);
          resolve(true);
        } catch (err: any) {
          console.error(`[BackupService] Fatal backup failure: ${err.message}`);
          resolve(false);
        } finally {
          await prisma.$disconnect();
        }
      });
    });
  }

  private generateSqlInsert(modelName: string, records: any[]): string {
    const tableName = modelName.toLowerCase(); // Simple mapping for this schema
    const columns = Object.keys(records[0]);
    let sql = `-- Table: ${tableName}\n`;
    sql += `TRUNCATE TABLE "${tableName}" CASCADE;\n`;
    
    // Chunking inserts to avoid huge single statements
    const chunkSize = 100;
    for (let i = 0; i < records.length; i += chunkSize) {
      const chunk = records.slice(i, i + chunkSize);
      sql += `INSERT INTO "${tableName}" ("${columns.join('", "')}") VALUES\n`;
      
      const values = chunk.map(record => {
        return `(${columns.map(col => this.toSqlValue(record[col])).join(', ')})`;
      }).join(',\n');
      
      sql += values + ';\n';
    }
    return sql + '\n';
  }

  private toSqlValue(value: any): string {
    if (value === null || value === undefined) return 'NULL';
    if (typeof value === 'boolean') return value ? 'true' : 'false';
    if (typeof value === 'number') return value.toString();
    if (value instanceof Date) return `'${value.toISOString().replace('T', ' ').replace('Z', '')}'`;
    if (typeof value === 'object') return `'${JSON.stringify(value).replace(/'/g, "''")}'`;
    
    // String escaping
    return `'${value.toString().replace(/'/g, "''")}'`;
  }
}

export default new BackupService();
