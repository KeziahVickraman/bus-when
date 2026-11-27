import type { Request, Response } from 'express';

export interface HealthResponse {
  status: 'ok';
  service: string;
  ltaConfigured: boolean;
  timestamp: string;
}

export default function handler(_req: Request, res: Response): void {
  const ltaConfigured = Boolean(process.env.LTA_ACCOUNT_KEY?.trim());

  const payload: HealthResponse = {
    status: 'ok',
    service: 'nextbus-sg-api',
    ltaConfigured,
    timestamp: new Date().toISOString(),
  };

  res.setHeader('Cache-Control', 'no-store');
  res.status(200).json(payload);
}
