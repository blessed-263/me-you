import express from 'express';

import path from 'path';

import { fileURLToPath } from 'url';

import type { Pool } from 'pg';

import { checkDatabase, getPool } from './db.js';

import { createJuneRsvpHandler } from './juneRsvp.js';

import { createRsvpHandler } from './rsvp.js';
import { createThirdEditionRsvpHandler } from './thirdEditionRsvp.js';

import { getAllowedOrigins, isOriginAllowedForCors } from './middleware/allowedOrigins.js';

import { requireAllowedOrigin } from './middleware/requireAllowedOrigin.js';
import { createRsvpRateLimit } from './middleware/rateLimit.js';
import { securityHeadersMiddleware } from './middleware/securityHeaders.js';
import { createStoreProxy } from './storeProxy.js';



const __dirname = path.dirname(fileURLToPath(import.meta.url));



export type CreateAppOptions = {

  getPoolFn?: () => Pool | null;

  serveStatic?: boolean;

};



async function healthHandler(

  _req: express.Request,

  res: express.Response,

): Promise<void> {

  const database = await checkDatabase();

  const ok = database === 'connected' || database === 'not_configured';

  res.status(ok ? 200 : 503).json({

    ok: database === 'connected',

    database,

    ...(database === 'not_configured'

      ? {

          hint: 'Set DATABASE_URL on this Railway service (reference from Postgres plugin).',

        }

      : {}),

  });

}



export function createApp(options: CreateAppOptions = {}): express.Express {

  const poolFn = options.getPoolFn ?? getPool;

  const allowedOrigins = getAllowedOrigins();



  const app = express();

  const rsvpRateLimit = createRsvpRateLimit();

  app.set('trust proxy', 1);

  app.use(securityHeadersMiddleware);



  app.use((req, res, next) => {

    const origin = req.headers.origin;

    if (origin && isOriginAllowedForCors(origin, allowedOrigins)) {

      res.setHeader('Access-Control-Allow-Origin', origin);

      res.setHeader('Vary', 'Origin');

    }

    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');

    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {

      res.sendStatus(204);

      return;

    }

    next();

  });



  app.use(express.json({ limit: '32kb' }));

  app.use(createStoreProxy());

  app.get('/api/health', healthHandler);

  app.get('/health', healthHandler);



  app.post(

    '/api/rsvp',

    requireAllowedOrigin,

    rsvpRateLimit,

    createRsvpHandler({ getPool: poolFn }),

  );

  app.post(

    '/api/rsvp/june',

    requireAllowedOrigin,

    rsvpRateLimit,

    createJuneRsvpHandler({ getPool: poolFn }),

  );

  app.post(

    '/api/rsvp/third',

    requireAllowedOrigin,

    rsvpRateLimit,

    createThirdEditionRsvpHandler({ getPool: poolFn }),

  );



  if (options.serveStatic) {

    const staticDir = path.join(__dirname, '../dist');

    app.use(express.static(staticDir));

    app.get(/^(?!\/api).*/, (_req, res) => {

      res.sendFile(path.join(staticDir, 'index.html'));

    });

  } else {

    app.get('/', (_req, res) => {

      res.json({

        service: 'You & Me API',

        health: '/api/health',

        rsvp: 'POST /api/rsvp',

        juneRsvp: 'POST /api/rsvp/june',

        thirdEditionRsvp: 'POST /api/rsvp/third',

      });

    });

  }



  return app;

}


