import type { Request, Response } from 'express';

const LTA_BUS_ARRIVAL_V3_URL =
  'https://datamall2.mytransport.sg/ltaodataservice/v3/BusArrival';

const BUS_STOP_CODE_RE = /^\d{5}$/;
const SERVICE_NO_RE = /^[0-9A-Za-z]{1,6}$/;

function getSingleQueryParam(value: unknown): string {
  if (typeof value === 'string') return value.trim();
  if (Array.isArray(value) && typeof value[0] === 'string') {
    return value[0].trim();
  }
  return '';
}

export default async function handler(req: Request, res: Response): Promise<void> {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    res.status(405).json({ error: 'METHOD_NOT_ALLOWED', message: 'Only GET requests are supported.' });
    return;
  }

  const busStopCode = getSingleQueryParam(req.query.BusStopCode ?? req.query.busStopCode);
  const serviceNo = getSingleQueryParam(req.query.ServiceNo ?? req.query.serviceNo);

  if (!BUS_STOP_CODE_RE.test(busStopCode)) {
    res.status(400).json({
      error: 'INVALID_BUS_STOP_CODE',
      message: 'BusStopCode must be a 5-digit Singapore bus stop code (e.g. 04121).',
    });
    return;
  }

  if (serviceNo && !SERVICE_NO_RE.test(serviceNo)) {
    res.status(400).json({
      error: 'INVALID_SERVICE_NO',
      message: 'ServiceNo must be 1 to 6 alphanumeric characters (e.g. 7 or 382G).',
    });
    return;
  }

  const accountKey = process.env.LTA_ACCOUNT_KEY?.trim();
  if (!accountKey) {
    res.status(503).json({
      error: 'LTA_ACCOUNT_KEY_MISSING',
      message:
        'LTA_ACCOUNT_KEY is not configured on the server. Add it to your environment secrets.',
    });
    return;
  }

  const upstreamUrl = new URL(LTA_BUS_ARRIVAL_V3_URL);
  upstreamUrl.searchParams.set('BusStopCode', busStopCode);
  if (serviceNo) {
    upstreamUrl.searchParams.set('ServiceNo', serviceNo);
  }

  try {
    const upstreamResponse = await fetch(upstreamUrl.toString(), {
      method: 'GET',
      headers: {
        AccountKey: accountKey,
        accept: 'application/json',
      },
      signal: AbortSignal.timeout(8000),
    });

    if (!upstreamResponse.ok) {
      res.status(502).json({
        error: 'LTA_UPSTREAM_ERROR',
        status: upstreamResponse.status,
        message: 'Failed to retrieve bus arrival data from LTA DataMall.',
      });
      return;
    }

    const data = (await upstreamResponse.json()) as Record<string, unknown>;

    // LTA DataMall v3 updates every 20 seconds
    res.setHeader('Cache-Control', 'public, s-maxage=15, stale-while-revalidate=5');
    res.status(200).json(data);
  } catch (err: unknown) {
    const isTimeout = err instanceof Error && err.name === 'TimeoutError';
    res.status(isTimeout ? 504 : 502).json({
      error: isTimeout ? 'LTA_UPSTREAM_TIMEOUT' : 'LTA_UPSTREAM_UNREACHABLE',
      message: isTimeout
        ? 'LTA DataMall request timed out.'
        : 'Unable to reach LTA DataMall service.',
    });
  }
}
