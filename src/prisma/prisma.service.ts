import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    const dbUrl = process.env.DATABASE_URL;
    
    // Configure connection pool settings
    const connectionConfig: any = {
      log: [
        { emit: 'event', level: 'error' },
        { emit: 'event', level: 'info' },
        { emit: 'event', level: 'warn' },
      ],
      errorFormat: 'pretty',
    };

    super(connectionConfig);

    // Check connection_limit after super() is called
    if (dbUrl) {
      try {
        const url = new URL(dbUrl);
        // Ensure connection_limit is set in URL for Supabase pooler
        if (url.searchParams.get('connection_limit') === null) {
          this.logger.warn(
            'connection_limit not found in DATABASE_URL. Recommended: Add ?connection_limit=1 to your connection string',
          );
        }
      } catch {
        // URL parsing failed, continue with default config
      }
    }
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
      this.logger.log(
        `Connecting to database: ${urlObj.hostname}:${urlObj.port || 5432}`,
      );
    } catch {
      this.logger.log('Connecting to database...');
    }

    if (!directUrl) {
      this.logger.warn(
        'DIRECT_URL is not set. Some Prisma operations (like migrations) may fail.',
      );
      this.logger.warn(
        'For Supabase, use connection pooler URL for DATABASE_URL and direct URL for DIRECT_URL',
      );
    }

    // Retry connection with exponential backoff
    const maxRetries = 3;
    let retryCount = 0;
    let lastError: any;

    while (retryCount < maxRetries) {
      try {
        await this.$connect();
        this.logger.log('Database connection established successfully');
        return;
      } catch (error: any) {
        lastError = error;
        retryCount++;

        if (retryCount < maxRetries) {
          const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff
          this.logger.warn(
            `Connection attempt ${retryCount} failed. Retrying in ${delay}ms...`,
          );
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    // All retries failed
    this.logger.error('Failed to connect to database after all retries');
    this.logger.error('Error:', lastError?.message);

    if (
      lastError?.code === 'P1001' ||
      lastError?.code === 'P2024' ||
      lastError?.message?.includes('Timed out')
    ) {
      this.logger.error(
        'Connection pool timeout or cannot reach database server.',
      );
      this.logger.error('');
      this.logger.error('Troubleshooting steps:');
      this.logger.error('1. Check your DATABASE_URL format in .env file');
      this.logger.error('2. For Supabase, use:');
      this.logger.error(
        '   DATABASE_URL="postgresql://postgres:PASSWORD@HOST.pooler.supabase.com:5432/postgres?pgbouncer=true&connection_limit=1"',
      );
      this.logger.error(
        '   DIRECT_URL="postgresql://postgres:PASSWORD@HOST.pooler.supabase.com:5432/postgres"',
      );
      this.logger.error(
        '3. Verify database server is running and accessible',
      );
      this.logger.error(
        '4. Check network connectivity and firewall settings',
      );
      this.logger.error('5. Ensure credentials are correct');
      this.logger.error(
        '6. Try reducing connection_limit in DATABASE_URL if pool is exhausted',
      );
      this.logger.error(
        '7. Consider using Prisma Accelerate for better connection pooling',
      );
    } else if (lastError?.code === 'P1008') {
      this.logger.error(
        'Connection pool timeout - too many connections or pool exhausted',
      );
      this.logger.error(
        'Solution: Add connection_limit=1 to your DATABASE_URL query parameters',
      );
    }

    // Don't throw - let the app start but operations will fail
    // This allows the app to start and show better error messages
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Database connection closed');
  }
}
