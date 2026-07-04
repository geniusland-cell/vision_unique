export interface QuartierCoordinates {
  latitude: number;
  longitude: number;
}

const defaultCoordinates: QuartierCoordinates = {
  latitude: -4.2726,
  longitude: 15.2663,
};

const quartierCoordinates: Record<string, QuartierCoordinates> = {
  bakongo: { latitude: -4.2636, longitude: 15.2429 },
  "poto-poto": { latitude: -4.2726, longitude: 15.2663 },
  moungali: { latitude: -4.2514, longitude: 15.2721 },
  ouenzé: { latitude: -4.2857, longitude: 15.2514 },
  talangaï: { latitude: -4.2429, longitude: 15.2857 },
  mfilou: { latitude: -4.26, longitude: 15.3 },
  makélékélé: { latitude: -4.29, longitude: 15.24 },
  djiri: { latitude: -4.3, longitude: 15.2 },
  madibou: { latitude: -4.32, longitude: 15.18 },
};

export const getCoordinatesForQuartier = (
  quartier?: string,
): QuartierCoordinates => {
  if (!quartier) {
    return defaultCoordinates;
  }

  const normalizedQuartier = quartier.trim().toLowerCase();
  return quartierCoordinates[normalizedQuartier] || defaultCoordinates;
};
