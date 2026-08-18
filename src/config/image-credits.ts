/**
 * Attribution for campus photos sourced from Wikimedia Commons.
 *
 * CC BY-SA requires credit wherever the image is shown, so every cover listed
 * here renders a credit line on the college detail page. A college whose cover
 * was supplied by the institution itself is simply absent from this map and
 * renders no credit.
 *
 * Do not add an entry unless the file really is under a free licence — the
 * point of this file is that the site can prove where each photo came from.
 */
export type ImageCredit = {
  /** Photographer or uploader, as named on the file page. */
  author: string;
  /** Licence exactly as stated on the file page, e.g. "CC BY-SA 4.0". */
  license: string;
  /** Link to the licence deed. */
  licenseUrl: string;
  /** Link to the Commons file page. */
  sourceUrl: string;
};

export const coverCredits: Record<string, ImageCredit> = {
  "haldia-institute-of-technology": {
    author: "Wikimedia Commons contributor",
    license: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Hithaldia.jpg",
  },
  "iimt-university": {
    author: "Ravi Dwivedi",
    license: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
    sourceUrl:
      "https://commons.wikimedia.org/wiki/File:IIMT_University,_Meerut.jpg",
  },
  "silver-oak-university": {
    author: "Udaysou",
    license: "CC0",
    licenseUrl: "https://creativecommons.org/publicdomain/zero/1.0/",
    sourceUrl:
      "https://commons.wikimedia.org/wiki/File:Campus_Landmark_at_Silver_Oak_University.jpg",
  },
};

export function coverCredit(slug: string): ImageCredit | null {
  return coverCredits[slug] ?? null;
}
