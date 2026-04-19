import { createApp } from './app';
import { env } from './config/env';
import { prisma } from './config/prisma';

/**
 * Server entrypoint.
 *
 * Responsibilities:
 *   - Build the app
 *   - Verify DB connectivity before accepting traffic
 *   - Start listening
 *   - Handle graceful shutdown (SIGTERM from containers, SIGINT from Ctrl+C)
 *   - Handle unhandled promise rejections + uncaught exceptions
 */

async function main(): Promise<void> {
  const app = createApp();

  // Verify DB connection on startup.
  // Better to fail fast than to serve requests that will all 500.
  try {
    await prisma.$connect();
    console.log('✅ Database connected');
  } catch (err) {
    console.error('❌ Database connection failed:', err);
    process.exit(1);
  }

  const server = app.listen(env.PORT, () => {
    console.log(`🚀 Server listening on port ${env.PORT} (${env.NODE_ENV})`);
    console.log(`   Health:  http://localhost:${env.PORT}/health`);
    console.log(`   Auth:    http://localhost:${env.PORT}/api/auth`);
    console.log(`   Issues:  http://localhost:${env.PORT}/api/issues`);
  });

  // Graceful shutdown — stop accepting new requests, finish in-flight ones, then exit.
  const shutdown = async (signal: string): Promise<void> => {
    console.log(`\n${signal} received — shutting down gracefully...`);

    server.close(async () => {
      console.log('✅ HTTP server closed');
      await prisma.$disconnect();
      console.log('✅ Database disconnected');
      process.exit(0);
    });

    // Force exit if shutdown hangs (e.g. long-running request)
    setTimeout(() => {
      console.error('⚠️  Forced shutdown after 10s timeout');
      process.exit(1);
    }, 10_000).unref();
  };

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));

  // Surface unhandled errors — never let them silently pass.
  process.on('unhandledRejection', (reason) => {
    console.error('❌ Unhandled promise rejection:', reason);
  });
  process.on('uncaughtException', (err) => {
    console.error('❌ Uncaught exception:', err);
    // Uncaught exceptions can leave the process in an undefined state.
    // Best practice is to crash and let the container restart us.
    process.exit(1);
  });
}

main().catch((err) => {
  console.error('❌ Fatal startup error:', err);
  process.exit(1);
});
