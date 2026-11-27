import { SINGAPORE_BUS_STOPS } from '../data/singaporeStops';
import {
  BusArrivalResponse,
  BusServiceArrival,
  BusStopDirectoryEntry,
  BusType,
  LoadStatus,
  NextBusInfo,
  OperatorCode,
} from '../types/bus';

interface LtaNextBusRaw {
  OriginCode?: string;
  DestinationCode?: string;
  EstimatedArrival?: string;
  Monitored?: 0 | 1;
  Latitude?: string;
  Longitude?: string;
  VisitNumber?: string;
  Load?: LoadStatus;
  Feature?: 'WAB' | '';
  Type?: BusType;
}

interface LtaServiceRaw {
  ServiceNo?: string;
  Operator?: OperatorCode;
  NextBus?: LtaNextBusRaw;
  NextBus2?: LtaNextBusRaw;
  NextBus3?: LtaNextBusRaw;
}

interface LtaBusArrivalPayload {
  BusStopCode?: string;
  Services?: LtaServiceRaw[];
}

export interface ApiHealthStatus {
  status: string;
  service: string;
  ltaConfigured: boolean;
  timestamp: string;
}

function hashString(str: string): number {
  let hash = 2166136261;
  for (let i = 0; i < str.length; i += 1) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function getLoadForOffset(seed: number, minutesAhead: number): LoadStatus {
  const roll = (seed + minutesAhead * 7) % 10;
  if (roll <= 5) return 'SEA';
  if (roll <= 8) return 'SDA';
  return 'LSD';
}

function getBusType(preferred: Exclude<BusType, ''>, seed: number, slot: number): BusType {
  if ((seed + slot) % 5 === 0) {
    return preferred === 'DD' ? 'SD' : 'DD';
  }
  return preferred;
}

function buildNextBus(
  busStopCode: string,
  etaDate: Date,
  load: LoadStatus,
  busType: BusType
): NextBusInfo {
  return {
    OriginCode: busStopCode,
    DestinationCode: `${busStopCode.slice(0, 2)}009`,
    EstimatedArrival: etaDate.toISOString(),
    Monitored: 1,
    Latitude: '1.3000',
    Longitude: '103.8500',
    VisitNumber: '1',
    Load: load,
    Feature: 'WAB',
    Type: busType,
  };
}

function normalizeNextBus(raw: LtaNextBusRaw | undefined, fallbackStopCode: string): NextBusInfo {
  return {
    OriginCode: raw?.OriginCode ?? fallbackStopCode,
    DestinationCode: raw?.DestinationCode ?? '',
    EstimatedArrival: raw?.EstimatedArrival ?? '',
    Monitored: raw?.Monitored === 1 ? 1 : 0,
    Latitude: raw?.Latitude ?? '',
    Longitude: raw?.Longitude ?? '',
    VisitNumber: raw?.VisitNumber ?? '1',
    Load: raw?.Load ?? '',
    Feature: raw?.Feature === 'WAB' ? 'WAB' : '',
    Type: raw?.Type ?? '',
  };
}

function computeLiveEtas(
  busStopCode: string,
  serviceNo: string,
  baseFreq: number,
  nowMs: number
): [number, number, number] {
  const seed = hashString(`${busStopCode}-${serviceNo}`);
  const cycleSec = Math.max(4, baseFreq) * 60;
  const elapsedInCycle = (Math.floor(nowMs / 1000) + (seed % cycleSec)) % cycleSec;
  const firstSec = Math.max(0, cycleSec - elapsedInCycle - 40);
  const firstMin = Math.round(firstSec / 60);
  const secondMin = firstMin + baseFreq + ((seed >> 2) % 3);
  const thirdMin = secondMin + baseFreq + ((seed >> 4) % 4);
  return [firstMin, secondMin, thirdMin];
}

export function getBusStopByCode(code: string): BusStopDirectoryEntry | undefined {
  const normalized = code.trim();
  return SINGAPORE_BUS_STOPS.find((stop) => stop.BusStopCode === normalized);
}

export function searchBusStops(query: string): BusStopDirectoryEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return SINGAPORE_BUS_STOPS;

  return SINGAPORE_BUS_STOPS.filter((stop) => {
    const codeMatch = stop.BusStopCode.includes(q);
    const nameMatch = stop.Description.toLowerCase().includes(q);
    const roadMatch = stop.RoadName.toLowerCase().includes(q);
    const landmarkMatch = stop.Landmark?.toLowerCase().includes(q) ?? false;
    const serviceMatch = stop.Services.some((svc) => svc.ServiceNo.toLowerCase() === q);
    return codeMatch || nameMatch || roadMatch || landmarkMatch || serviceMatch;
  });
}

function buildDirectoryPreview(
  cleanCode: string,
  directoryStop: BusStopDirectoryEntry | undefined,
  now: Date
): BusArrivalResponse {
  const nowMs = now.getTime();

  if (!directoryStop) {
    return {
      BusStopCode: cleanCode,
      StopName: `Bus Stop ${cleanCode}`,
      RoadName: 'Awaiting LTA_ACCOUNT_KEY',
      Region: 'Central',
      IsKnownStop: false,
      DataSource: 'unconfigured',
      LastUpdated: now.toISOString(),
      Services: [],
    };
  }

  const services: BusServiceArrival[] = directoryStop.Services.map((svc) => {
    const seed = hashString(`${cleanCode}:${svc.ServiceNo}`);
    const [eta1, eta2, eta3] = computeLiveEtas(
      cleanCode,
      svc.ServiceNo,
      svc.BaseFrequencyMin,
      nowMs
    );

    return {
      ServiceNo: svc.ServiceNo,
      Operator: svc.Operator,
      DestinationName: svc.DestinationName,
      UpcomingStops: svc.UpcomingStops,
      NextBus: buildNextBus(
        cleanCode,
        new Date(nowMs + eta1 * 60_000),
        getLoadForOffset(seed, eta1),
        getBusType(svc.PreferredType, seed, 1)
      ),
      NextBus2: buildNextBus(
        cleanCode,
        new Date(nowMs + eta2 * 60_000),
        getLoadForOffset(seed, eta2),
        getBusType(svc.PreferredType, seed, 2)
      ),
      NextBus3: buildNextBus(
        cleanCode,
        new Date(nowMs + eta3 * 60_000),
        getLoadForOffset(seed, eta3),
        getBusType(svc.PreferredType, seed, 3)
      ),
    };
  });

  services.sort(
    (a, b) =>
      new Date(a.NextBus.EstimatedArrival).getTime() -
      new Date(b.NextBus.EstimatedArrival).getTime()
  );

  return {
    BusStopCode: directoryStop.BusStopCode,
    StopName: directoryStop.Description,
    RoadName: directoryStop.RoadName,
    Region: directoryStop.Region,
    IsKnownStop: true,
    DataSource: 'preview',
    LastUpdated: now.toISOString(),
    Services: services,
  };
}

function mapLtaPayloadToArrivalResponse(
  cleanCode: string,
  payload: LtaBusArrivalPayload,
  directoryStop: BusStopDirectoryEntry | undefined,
  now: Date
): BusArrivalResponse {
  const rawServices = Array.isArray(payload.Services) ? payload.Services : [];

  const services: BusServiceArrival[] = rawServices.map((raw) => {
    const serviceNo = raw.ServiceNo ?? '';
    const directorySvc = directoryStop?.Services.find(
      (item) => item.ServiceNo.toLowerCase() === serviceNo.toLowerCase()
    );
    const nextBus = normalizeNextBus(raw.NextBus, cleanCode);
    const destStop = nextBus.DestinationCode
      ? getBusStopByCode(nextBus.DestinationCode)
      : undefined;

    const destinationLabel =
      directorySvc?.DestinationName ??
      destStop?.Description ??
      (nextBus.DestinationCode ? `Stop ${nextBus.DestinationCode}` : 'Terminus');

    return {
      ServiceNo: serviceNo,
      Operator: raw.Operator ?? directorySvc?.Operator ?? 'SBST',
      DestinationName: destinationLabel,
      UpcomingStops: directorySvc?.UpcomingStops,
      NextBus: nextBus,
      NextBus2: normalizeNextBus(raw.NextBus2, cleanCode),
      NextBus3: normalizeNextBus(raw.NextBus3, cleanCode),
    };
  });

  services.sort((a, b) => {
    const aTime = a.NextBus.EstimatedArrival
      ? new Date(a.NextBus.EstimatedArrival).getTime()
      : Number.MAX_SAFE_INTEGER;
    const bTime = b.NextBus.EstimatedArrival
      ? new Date(b.NextBus.EstimatedArrival).getTime()
      : Number.MAX_SAFE_INTEGER;
    return aTime - bTime;
  });

  return {
    BusStopCode: payload.BusStopCode ?? cleanCode,
    StopName: directoryStop?.Description ?? `Bus Stop ${cleanCode}`,
    RoadName: directoryStop?.RoadName ?? 'Live LTA DataMall Stop',
    Region: directoryStop?.Region ?? 'Central',
    IsKnownStop: true,
    DataSource: 'live',
    LastUpdated: now.toISOString(),
    Services: services,
  };
}

export async function checkApiHealth(): Promise<ApiHealthStatus | null> {
  try {
    const res = await fetch('/api/health');
    if (!res.ok) return null;
    return (await res.json()) as ApiHealthStatus;
  } catch {
    return null;
  }
}

export async function fetchBusStopArrivals(
  busStopCode: string,
  now: Date = new Date(),
  serviceNo?: string
): Promise<BusArrivalResponse> {
  const cleanCode = busStopCode.trim();
  const directoryStop = getBusStopByCode(cleanCode);

  const params = new URLSearchParams({ BusStopCode: cleanCode });
  if (serviceNo?.trim()) {
    params.set('ServiceNo', serviceNo.trim());
  }

  try {
    const response = await fetch(`/api/busarrival?${params.toString()}`);

    if (response.ok) {
      const payload = (await response.json()) as LtaBusArrivalPayload;
      return mapLtaPayloadToArrivalResponse(cleanCode, payload, directoryStop, now);
    }

    const errorBody = (await response.json().catch(() => ({}))) as {
      error?: string;
      message?: string;
    };

    if (response.status === 503 && errorBody.error === 'LTA_ACCOUNT_KEY_MISSING') {
      return buildDirectoryPreview(cleanCode, directoryStop, now);
    }

    return {
      BusStopCode: cleanCode,
      StopName: directoryStop?.Description ?? `Bus Stop ${cleanCode}`,
      RoadName: directoryStop?.RoadName ?? 'Singapore Bus Stop',
      Region: directoryStop?.Region ?? 'Central',
      IsKnownStop: Boolean(directoryStop),
      DataSource: 'error',
      ErrorMessage: errorBody.message ?? 'Unable to load arrivals from LTA DataMall.',
      LastUpdated: now.toISOString(),
      Services: [],
    };
  } catch {
    return buildDirectoryPreview(cleanCode, directoryStop, now);
  }
}

export function formatMinutesAway(isoTimestamp: string, nowMs: number = Date.now()): {
  minutes: number;
  label: string;
  isArriving: boolean;
  clockTime: string;
} {
  if (!isoTimestamp) {
    return { minutes: -1, label: '—', isArriving: false, clockTime: '--:--' };
  }
  const target = new Date(isoTimestamp);
  if (Number.isNaN(target.getTime())) {
    return { minutes: -1, label: '—', isArriving: false, clockTime: '--:--' };
  }
  const diffMin = Math.max(0, Math.round((target.getTime() - nowMs) / 60_000));
  const clockTime = target.toLocaleTimeString('en-SG', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  if (diffMin <= 1) {
    return { minutes: diffMin, label: 'Arr', isArriving: true, clockTime };
  }
  return { minutes: diffMin, label: `${diffMin} min`, isArriving: false, clockTime };
}
