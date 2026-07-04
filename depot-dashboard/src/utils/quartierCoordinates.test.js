import { getCoordinatesForQuartier } from "./quartierCoordinates";

describe("getCoordinatesForQuartier", () => {
  it("returns the coordinates for a known quartier", () => {
    expect(getCoordinatesForQuartier("Poto-Poto")).toEqual({
      latitude: -4.2726,
      longitude: 15.2663,
    });
  });

  it("falls back to Brazzaville defaults when the quartier is unknown", () => {
    expect(getCoordinatesForQuartier("Inconnu")).toEqual({
      latitude: -4.2726,
      longitude: 15.2663,
    });
  });
});
