/**
 * Curated Unsplash photography — see context/design.md §6. Each entry is a
 * specific, verified photo ID (not a random topic feed), hotlinked via
 * Unsplash's CDN under the Unsplash License (free commercial use). Traceable
 * at https://unsplash.com/photos/{id} for attribution/replacement.
 *
 * Swap for commissioned photography once available — every usage in the
 * codebase reads from this file, so replacement is a one-line change.
 */

function unsplash(id: string, params: string) {
  return `https://images.unsplash.com/photo-${id}?${params}`;
}

const BASE_PARAMS = "auto=format&fit=crop&q=80";

export const MARKETING_IMAGES = {
  /** Container port at night, cranes lit gold against a dark sky — hero background. */
  portAtNight: {
    id: "1758745791998-11ea5eb5df40",
    url: (w: number) => unsplash("1758745791998-11ea5eb5df40", `${BASE_PARAMS}&w=${w}`),
    alt: "Container port with illuminated cranes at night",
  },
  /** Cable-stayed bridge at golden hour with a freight truck crossing. */
  bridgeAtDusk: {
    id: "1504846257989-a76209d9d2ac",
    url: (w: number) => unsplash("1504846257989-a76209d9d2ac", `${BASE_PARAMS}&w=${w}`),
    alt: "Freight truck crossing a suspension bridge at sunset",
  },
  /** Modern warehouse racking, converging perspective lines. */
  warehouseInterior: {
    id: "1587293852726-70cdb56c2866",
    url: (w: number) => unsplash("1587293852726-70cdb56c2866", `${BASE_PARAMS}&w=${w}`),
    alt: "Modern warehouse distribution racking",
  },
  /** Aerial night shot of a highway interchange — network/route motif. */
  highwayInterchange: {
    id: "1718634657344-3af38d7ed851",
    url: (w: number) => unsplash("1718634657344-3af38d7ed851", `${BASE_PARAMS}&w=${w}`),
    alt: "Aerial view of a highway interchange at night",
  },
} as const;
