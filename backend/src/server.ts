import app from './app';
import { connectDB } from './config/database';
import { SeedService } from './services/SeedService';

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    const dbUri = await connectDB();
    console.log(`[Server] Connected to DB at ${dbUri}`);

    // Seed sample records if database is empty
    await SeedService.seedIfEmpty();

    app.listen(PORT, () => {
      console.log(`=======================================================`);
      console.log(`🚀 3Age Threat Engine API running on port ${PORT}`);
      console.log(`👉 Health check: http://localhost:${PORT}/api/health`);
      console.log(`⚡ Mode: SIMULATED / DEMO MODE`);
      console.log(`=======================================================`);
    });
  } catch (error) {
    console.error('[Server] Fatal error during startup:', error);
    process.exit(1);
  }
};

startServer();
