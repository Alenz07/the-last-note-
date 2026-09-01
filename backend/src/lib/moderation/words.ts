/**
 * Blocklist — a starting point, not a verdict. Policy: block slurs, targeted
 * abuse and contact details; allow ordinary profanity (a confession chain that
 * can't say "fucked up" is not a confession chain). Extend at runtime with
 * EXTRA_BLOCKED_WORDS="word1,word2" and review reports in /admin.
 *
 * Matching is whole-word after normalisation (leetspeak + repeated letters collapsed),
 * so "ch00tiya" and "chutiyaaa" both match "chutiya".
 */
export const BLOCKED_WORDS: string[] = [
  // Hinglish abuse / slurs
  'madarchod', 'madarchd', 'maderchod', 'mdrchd',
  'bhenchod', 'behenchod', 'bhnchod', 'bhenchd', 'behnchod',
  'bhosdike', 'bhosdiwale', 'bhosdi', 'bhosda', 'bsdk', 'bhsdk',
  'chutiya', 'chutiye', 'chutia', 'chutiyapa', 'chootiya', 'chotiya', 'chutya',
  'gandu', 'gaandu', 'gandoo',
  'randi', 'raand', 'randwa',
  'lund', 'lavda', 'lauda', 'lavde', 'laude', 'loda', 'lode',
  'harami', 'haramzada', 'haramzadi', 'haramkhor',
  'bhadwa', 'bhadwe', 'chinal', 'chinaal',
  'mkc', 'bkl', 'mc', 'bc',
  'chamar', 'bhangi',
  // English slurs / targeted abuse
  'nigger', 'nigga', 'niggas', 'niggers',
  'faggot', 'faggots', 'fag', 'fags',
  'tranny', 'trannies',
  'retard', 'retards', 'retarded',
  'chink', 'chinks', 'paki', 'pakis', 'kike', 'spic', 'wetback', 'coon',
  'cunt', 'cunts',
  'whore', 'whores', 'slut', 'sluts',
];

/** Multi-word phrases (matched on the normalised text). */
export const BLOCKED_PHRASES: string[] = ['kill yourself', 'kys', 'go die', 'jaake mar ja', 'mar ja'];
