import { createServer } from 'node:http';

import { app } from './app.js';
import { connectDatabase } from './config/db.js';
import { env } from './config/env.js';

const start = async () => {
  try {
    await connectDatabase();
    const server = createServer(app);

    server.listen(env.PORT, () => {
      process.stdout.write(`Server listening on port ${env.PORT}\n`);
    });
  } catch (error) {
    process.stderr.write(
      `${error instanceof Error ? error.message : 'Failed to start server'}\n`,
    );
    process.exit(1);
  }
};

void start();
