import { SINGAPORE_BUS_STOPS } from '../data/singaporeStops';
import {
  BusArrivalResponse,
  BusServiceArrival,
  BusStopDirectoryEntry,
  BusType,
  LoadStatus,
  NextBusInfo,
} from '../types/bus';

/**
 * Frontend Bus Arrival Service Layer
 * ----------------------------------
 * Currently powered by deterministic live-ticking frontend simulation data
 * matching Singapore LTA DataMall Bus Arrival v3 response shapes.
 *
 * When ready to connect your backend proxy / LTA DataMall API:
 * 1. Replace `fetchBusStopArrivals` implementation with:
 *      const res = await fetch(`/api/bus-arrivals?BusStopCode=${encodeURIComponent(busStopCode)}`);
 *      return res.json();
 * 2. Keep all UI components untouched — they consume `BusArrivalResponse`.
 */

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
  serviceNo: string,
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

export async function fetchBusStopArrivals(
  busStopCode: string,
  now: Date = new Date()
): Promise<BusArrivalResponse> {
  // Subtle realistic async delay so loading states & spinners behave identically to live API calls
  await new Promise((resolve) => setTimeout(resolve, 140));

  const cleanCode = busStopCode.trim();
  const directoryStop = getBusStopByCode(cleanCode);
  const nowMs = now.getTime();

  if (!directoryStop) {
    return {
      BusStopCode: cleanCode,
      StopName: `Bus Stop ${cleanCode}`,
      RoadName: 'Custom Stop Code Lookup',
      Region: 'Central',
      IsKnownStop: false,
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

    const d1 = new Date(nowMs + eta1 * 60_000);
    const d2 = new Date(nowMs + eta2 * 60_000);
    const d3 = new Date(nowMs + eta3 * 60_000);

    return {
      ServiceNo: svc.ServiceNo,
      Operator: svc.Operator,
      DestinationName: svc.DestinationName,
      UpcomingStops: svc.UpcomingStops,
      NextBus: buildNextBus(
        cleanCode,
        svc.ServiceNo,
        d1,
        getLoadForOffset(seed, eta1),
        getBusType(svc.PreferredType, seed, 1)
      ),
      NextBus2: buildNextBus(
        cleanCode,
        svc.ServiceNo,
        d2,
        getLoadForOffset(seed, eta2),
        getBusType(svc.PreferredType, seed, 2)
      ),
      NextBus3: buildNextBus(
        cleanCode,
        svc.ServiceNo,
        d3,
        getLoadForOffset(seed, eta3),
        getBusType(svc.PreferredType, seed, 3)
      ),
    };
  });

  // Sort ascending by soonest arrival time, matching commuter expectations
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
    LastUpdated: now.toISOString(),
    Services: services,
  };
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
