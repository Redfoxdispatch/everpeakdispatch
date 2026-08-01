/**
 * Curated freight/logistics photography, originally sourced from Unsplash
 * (Unsplash License — free commercial use) and downloaded locally to
 * `public/images/marketing/` so the site doesn't depend on a third-party
 * CDN at runtime. Traceable back to the original source photo ID in each
 * comment for attribution/replacement.
 *
 * This is a truck dispatch freight brokerage — imagery is road/trucking
 * (highways, semis, flatbeds, warehouses), never ocean/port/vessel freight.
 *
 * Swap for commissioned photography once available — every usage in the
 * codebase reads from this file, so replacement is a one-line change.
 */

export const MARKETING_IMAGES = {
  /** Semi truck approaching on a highway at night, headlights cutting through fog — hero background. Source: unsplash.com/photos/1736134869393-bb43683d5d28 */
  truckHighwayNight: {
    src: "/images/marketing/truck-highway-night.jpg",
    alt: "Semi truck driving down a highway at night",
  },
  /** Cable-stayed bridge at golden hour with a freight truck crossing. Source: unsplash.com/photos/1504846257989-a76209d9d2ac */
  bridgeAtDusk: {
    src: "/images/marketing/bridge-at-dusk.jpg",
    alt: "Freight truck crossing a suspension bridge at sunset",
  },
  /** Modern warehouse racking, converging perspective lines. Source: unsplash.com/photos/1587293852726-70cdb56c2866 */
  warehouseInterior: {
    src: "/images/marketing/warehouse-interior.jpg",
    alt: "Modern warehouse distribution racking",
  },
  /** Aerial night shot of a highway interchange — network/route motif. Source: unsplash.com/photos/1718634657344-3af38d7ed851 */
  highwayInterchange: {
    src: "/images/marketing/highway-interchange.jpg",
    alt: "Aerial view of a highway interchange at night",
  },
  /** Straight-down aerial of a truck and cars on a highway through farmland — editorial, graphic. Source: unsplash.com/photos/1708193203896-ba0630862bb6 */
  highwayTrucksAerial: {
    src: "/images/marketing/highway-trucks-aerial.jpg",
    alt: "Aerial view of a truck and cars on a highway",
  },
  /** Trucks on a highway at dusk, dramatic sky. Source: unsplash.com/photos/1745956983820-6e960f7e8472 */
  highwaySunsetTrucks: {
    src: "/images/marketing/highway-sunset-trucks.jpg",
    alt: "Trucks driving on a highway at sunset",
  },
  /** Flatbed trailer truck on a winding mountain road at dusk. Source: unsplash.com/photos/1564957341116-ab017c60daca */
  flatbedMountainRoad: {
    src: "/images/marketing/flatbed-mountain-road.jpg",
    alt: "Flatbed trailer truck on a winding mountain road",
  },
} as const;
