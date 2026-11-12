/**
 * /api/v1 route aggregator.
 * Phase 4: Only ping/placeholder routes are mounted.
 * Subsequent phases will mount domain routers here.
 */

import { Router } from 'express';

export const v1Router: Router = Router();

v1Router.get('/api/v1/ping', (_req, res) => {
  res.status(200).json({ success: true, data: { message: 'pong', version: 'v1' } });
});
