/**
 * Canonical GrooveX Stem Classification Service
 *
 * Implements deterministic identification of drum and percussion stems to guarantee
 * transposition immunity (non-percussion melodic stems transpose cleanly while ALL
 * drum and percussion content remains at its pristine original pitch and timing).
 *
 * Safety Rule: When uncertain whether a stem is percussive, DO NOT transpose it
 * (classify as percussive to protect transients and timing).
 */

export interface StemIdentifier {
  name?: string;
  label?: string;
  icon?: string;
}

/** Known percussion instruments, drum kit components, and bus descriptors */
const EXACT_PERCUSSION_TERMS = new Set([
  'kick',
  'kickdrum',
  'bd',
  'snare',
  'snaredrum',
  'sd',
  'tom',
  'toms',
  'racktom',
  'floortom',
  'cymbal',
  'cymbals',
  'hihat',
  'hat',
  'hats',
  'hh',
  'ride',
  'crash',
  'splash',
  'china',
  'overhead',
  'overheads',
  'oh',
  'drum',
  'drums',
  'drumkit',
  'drumset',
  'drumloop',
  'drumloops',
  'percussion',
  'percussions',
  'perc',
  'percs',
  'shaker',
  'tambourine',
  'tamb',
  'bongo',
  'bongos',
  'conga',
  'congas',
  'cowbell',
  'timpani',
  'timbale',
  'timbales',
  'cajon',
  'djembe',
  'claves',
  'maraca',
  'maracas',
  'triangle',
  'woodblock',
  'castanets',
  'chimes',
  'handclaps',
  'claps',
  'snaps',
  'beat',
  'beats',
]);

/** Phrases that always represent percussion even if compound */
const COMPOUND_PERCUSSION_PATTERNS = [
  /\bkick\s*drum\b/i,
  /\bbass\s*drum\b/i,
  /\bsnare\s*drum\b/i,
  /\bsnare[\s/_-]*cymbals?\b/i,
  /\bkick[\s/_-]*snare\b/i,
  /\bhi[\s/_-]*hats?\b/i,
  /\bride[\s/_-]*cymbals?\b/i,
  /\bcrash[\s/_-]*cymbals?\b/i,
  /\bdrum[\s/_-]*loops?\b/i,
  /\bdrum[\s/_-]*kit\b/i,
  /\bdrum[\s/_-]*set\b/i,
  /\bdrum[\s/_-]*track\b/i,
  /\bdrum[\s/_-]*bus\b/i,
  /\bacoustic[\s/_-]*drums?\b/i,
  /\belectronic[\s/_-]*drums?\b/i,
  /\bpercussion[\s/_-]*loops?\b/i,
];

/** Melodic stem keywords that definitely should be transposed */
const MELODIC_EXCLUSION_PATTERNS = [
  /\bguitars?\b/i,
  /\bbass\s*guitar\b/i,
  /\belectric\s*bass\b/i,
  /\bsynth\s*bass\b/i,
  /\bvocals?\b/i,
  /\bvox\b/i,
  /\bbacking\b/i,
  /\blead\b/i,
  /\bkeys\b/i,
  /\bpiano\b/i,
  /\bsynth\b/i,
  /\borgan\b/i,
  /\bstrings\b/i,
  /\bbrass\b/i,
  /\bsax(ophone)?\b/i,
  /\bhorn\b/i,
  /\bflute\b/i,
  /\bcrowd\b/i,
  /\baudience\b/i,
];

/**
 * Normalizes input stem identifiers (name, label, or string) into clean tokens.
 */
function extractTokens(input: StemIdentifier | string): { normalized: string; tokens: string[] } {
  const raw = typeof input === 'string' ? input : `${input.name || ''} ${input.label || ''}`.trim();

  // Replace punctuation, underscores, slashes, hyphens with spaces
  const normalized = raw
    .toLowerCase()
    .replace(/[-_./\\+&]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const tokens = normalized.split(' ').filter(Boolean);

  return { normalized, tokens };
}

/**
 * Checks if a stem contains drum or percussion content.
 *
 * @param stem Stem identifier object ({ name, label, icon }) or stem name string.
 * @returns true if the stem is percussive (and must be immune to transposition).
 */
export function isPercussionStem(stem: StemIdentifier | string): boolean {
  if (!stem) return false;

  const { normalized, tokens } = extractTokens(stem);
  if (!normalized) return false;

  // 1. Check compound percussion patterns (e.g. "bass drum", "hi-hat", "drum loop")
  for (const pattern of COMPOUND_PERCUSSION_PATTERNS) {
    if (pattern.test(normalized)) {
      return true;
    }
  }

  // 2. Check if the entire normalized string or any token is an exact percussion term
  if (EXACT_PERCUSSION_TERMS.has(normalized)) {
    return true;
  }

  for (const token of tokens) {
    if (EXACT_PERCUSSION_TERMS.has(token)) {
      // Check if this token is qualified by a melodic exclusion (e.g. "synth beat" is percussive, but "bass" alone is melodic)
      if (token === 'bass') {
        // "bass" alone is melodic bass guitar / synth bass; only "bass drum" is percussive (caught by COMPOUND pattern)
        continue;
      }
      return true;
    }
  }

  // 3. Icon metadata hint
  if (typeof stem === 'object' && stem.icon) {
    const icon = stem.icon.toLowerCase();
    if (
      icon === 'layers' &&
      (tokens.includes('kick') || tokens.includes('drum') || tokens.includes('drums'))
    ) {
      return true;
    }
  }

  // 4. Check explicit melodic exclusions
  for (const pattern of MELODIC_EXCLUSION_PATTERNS) {
    if (pattern.test(normalized)) {
      return false;
    }
  }

  // 5. Standalone melodic "bass"
  if (normalized === 'bass' || normalized.endsWith(' bass') || normalized.startsWith('bass ')) {
    return false;
  }

  // 6. Substring safety fallbacks (e.g. "perc", "drum", "cymbal")
  if (
    normalized.includes('drum') ||
    normalized.includes('perc') ||
    normalized.includes('cymbal') ||
    normalized.includes('snare') ||
    normalized.includes('hihat') ||
    normalized.includes('shaker') ||
    normalized.includes('tambourine')
  ) {
    return true;
  }

  // Default: melodic stem eligible for transposition
  return false;
}
