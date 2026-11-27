export type OperatorCode = 'SBST' | 'SMRT' | 'TTS' | 'GAS';

export type LoadStatus = 'SEA' | 'SDA' | 'LSD' | '';

export type BusType = 'SD' | 'DD' | 'BD' | '';

export type BusFeature = 'WAB' | '';

export type SingaporeRegion = 'Central' | 'East' | 'West' | 'North-East' | 'North';

export interface NextBusInfo {
  OriginCode: string;
  DestinationCode: string;
  EstimatedArrival: string; // ISO-8601 timestamp matching LTA DataMall schema
  Monitored: 0 | 1;
  Latitude: string;
  Longitude: string;
  VisitNumber: string;
  Load: LoadStatus;
  Feature: BusFeature;
  Type: BusType;
}

export interface BusServiceArrival {
  ServiceNo: string;
  Operator: OperatorCode;
  DestinationName: string;
  UpcomingStops?: string[];
  NextBus: NextBusInfo;
  NextBus2: NextBusInfo;
  NextBus3: NextBusInfo;
}

export interface BusArrivalResponse {
  BusStopCode: string;
  StopName: string;
  RoadName: string;
  Region: SingaporeRegion;
  IsKnownStop: boolean;
  LastUpdated: string;
  Services: BusServiceArrival[];
}

export interface BusStopDirectoryEntry {
  BusStopCode: string;
  Description: string;
  RoadName: string;
  Region: SingaporeRegion;
  Landmark?: string;
  Services: {
    ServiceNo: string;
    Operator: OperatorCode;
    DestinationName: string;
    BaseFrequencyMin: number;
    PreferredType: Exclude<BusType, ''>;
    UpcomingStops: string[];
  }[];
}

export interface FavoriteStop {
  BusStopCode: string;
  Description: string;
  RoadName: string;
  Region: SingaporeRegion;
  Nickname?: string;
  PinnedServices?: string[];
  AddedAt: number;
}
