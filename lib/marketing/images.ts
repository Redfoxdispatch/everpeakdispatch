/**
 * Curated freight/logistics photography, originally sourced from Unsplash
 * (Unsplash License — free commercial use) and downloaded locally to
 * `public/images/marketing/` so the site doesn't depend on a third-party
 * CDN at runtime. Traceable back to the original source photo ID in each
 * comment for attribution/replacement.
 *
 * Swap for commissioned photography once available — every usage in the
 * codebase reads from this file, so replacement is a one-line change.
 */

export const MARKETING_IMAGES = {
  /** Container port at night, cranes lit gold against a dark sky — hero background. Source: unsplash.com/photos/1758745791998-11ea5eb5df40 */
  portAtNight: {
    src: "/images/marketing/port-at-night.jpg",
    alt: "Container port with illuminated cranes at night",
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
  /** Straight-down aerial of a container ship underway — editorial, graphic. Source: unsplash.com/photos/1594110336951-5bc8c12d6b27 */
  shipTopDown: {
    src: "/images/marketing/ship-top-down.jpg",
    alt: "Aerial view directly above a container ship at sea",
  },
  /** Straight-down aerial of a tanker/bulk carrier — deep navy water. Source: unsplash.com/photos/1518527989017-5baca7a58d3c */
  tankerTopDown: {
    src: "/images/marketing/tanker-top-down.jpg",
    alt: "Aerial view directly above a tanker vessel at sea",
  },
  /** Low-angle wall of stacked shipping containers. Source: unsplash.com/photos/1710762382866-2d12000736ea */
  containerWall: {
    src: "/images/marketing/container-wall.jpg",
    alt: "Low-angle view of stacked shipping containers",
  },
} as const;
