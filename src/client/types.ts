import { Layer, CheckStatus } from '@prisma/client';

export type { Layer, CheckStatus };

export interface OverviewStats {
  sitesMonitored: number;
  uptime30dPercent: number | null;
  avgResponseMs: number | null;
  activeIncidents: number;
}

export interface SiteLayerTile {
  layer: Layer;
  status: CheckStatus;
  latencyMs: number | null;
  errorMessage: string | null;
  timestamp: string;
}

export interface SiteCard {
  id: string;
  name: string;
  url: string;
  hasActiveIncident: boolean;
  layers: SiteLayerTile[];
}

export interface IncidentItem {
  id: string;
  siteName: string;
  layer: Layer;
  status: 'open' | 'resolved';
  startedAt: string;
  resolvedAt: string | null;
  firstError: string;
  aiDiagnosis: string | null;
}

export interface ApiOverviewResponse {
  stats: OverviewStats;
  sites: SiteCard[];
}

export interface ApiIncidentsResponse {
  incidents: IncidentItem[];
}

export interface SiteHistoryLayer {
  layer: Layer;
  checks: Array<{
    status: CheckStatus;
    latencyMs: number | null;
    errorMessage: string | null;
    timestamp: string;
  }>;
}

export interface SiteDetailResponse {
  site: {
    id: string;
    name: string;
    url: string;
    healthUrl: string | null;
    checkIntervalSeconds: number;
    active: boolean;
  };
  history: SiteHistoryLayer[];
  incidents: IncidentItem[];
}
