export const STATION_IDS = [
  'home-base',
  'llm-product',
  'marketplace-chat',
  'admin-app',
  'ai-engineering',
  'systems',
  'flight-log',
  'this-world',
  'contact',
] as const;

export type StationId = (typeof STATION_IDS)[number];

export const stationIndex = (id: StationId): number => {
  return STATION_IDS.indexOf(id);
};

export const stationAt = (index: number): StationId | null => {
  return STATION_IDS[index] ?? null;
};
