import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log: [
        { emit: 'event', level: 'error' },
        { emit: 'event', level: 'info' },
        { emit: 'event', level: 'warn' },
      ],
      errorFormat: 'pretty',
    });
  }

  async onModuleInit() {
    const dbUrl = process.env.DATABASE_URL;
    const directUrl = process.env.DIRECT_URL;

    if (!dbUrl) {
      this.logger.error('DATABASE_URL is not set in environment variables');
      return;
    }

    // Log connection info (without sensitive data)
    try {
      const urlObj = new URL(dbUrl);
      this.logger.log(`Connecting to database: ${urlObj.hostname}:${urlObj.port || 5432}`);
    } catch {
      this.logger.log('Connecting to database...');
    }
    
    if (!directUrl) {
      this.logger.warn('DIRECT_URL is not set. Some Prisma operations (like migrations) may fail.');
      this.logger.warn('For Supabase, use connection pooler URL for DATABASE_URL and direct URL for DIRECT_URL');
    }

    try {
      await this.$connect();
      this.logger.log('Database connection established successfully');
    } catch (error: any) {
      this.logger.error('Failed to connect to database:', error.message);
      
      if (error.code === 'P1001' || error.message?.includes('Timed out')) {
        this.logger.error('Connection pool timeout or cannot reach database server.');
        this.logger.error('');
        this.logger.error('Troubleshooting steps:');
        this.logger.error('1. Check your DATABASE_URL format in .env file');
        this.logger.error('2. For Supabase, use:');
        this.logger.error('   DATABASE_URL="postgresql://postgres:PASSWORD@HOST.pooler.supabase.com:5432/postgres?pgbouncer=true&connection_limit=1"');
        this.logger.error('   DIRECT_URL="postgresql://postgres:PASSWORD@HOST.pooler.supabase.com:5432/postgres"');
        this.logger.error('3. Verify database server is running and accessible');
        this.logger.error('4. Check network connectivity and firewall settings');
        this.logger.error('5. Ensure credentials are correct');
        this.logger.error('6. Try reducing connection_limit in DATABASE_URL if pool is exhausted');
      } else if (error.code === 'P1008') {
        this.logger.error('Connection pool timeout - too many connections or pool exhausted');
        this.logger.error('Solution: Add connection_limit=1 to your DATABASE_URL query parameters');
      }
      
      // Don't throw - let the app start but operations will fail
      // This allows the app to start and show better error messages
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Database connection closed');
  }
}
