import { attachSamplePhotos, type SamplePhoto } from "./shared";
import { BALI_PHOTOS, makeBaliSample } from "./bali";
import { INDIA_PHOTOS, makeIndiaSample } from "./india";
import type { Itinerary } from "@/lib/types";

export interface SampleDefinition {
  id: string;
  label: string;
  description: string;
  build: () => Itinerary;
  photos: SamplePhoto[];
}

/** The demo itineraries offered under “Load sample itinerary”. */
export const SAMPLES: SampleDefinition[] = [
  {
    id: "india",
    label: "India family tour",
    description: "10 days · 5 states · 4 adults + 3 children",
    build: makeIndiaSample,
    photos: INDIA_PHOTOS,
  },
  {
    id: "bali",
    label: "Bali escape",
    description: "6 days · international · 2 adults",
    build: makeBaliSample,
    photos: BALI_PHOTOS,
  },
];

export function getSample(id: string): SampleDefinition {
  return SAMPLES.find((s) => s.id === id) ?? SAMPLES[0];
}

/** Loads a sample's photos onto it. Returns the same object if none loaded. */
export function withSamplePhotos(sample: SampleDefinition, itinerary: Itinerary) {
  return attachSamplePhotos(itinerary, sample.photos);
}

export type { SamplePhoto };
