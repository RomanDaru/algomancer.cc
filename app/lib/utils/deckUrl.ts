const ALLOWED_HOSTS = new Set([
  "algomancer.cc",
  "www.algomancer.cc",
  "algomancer.gg",
  "www.algomancer.gg",
]);

const DECK_PATH_REGEX = /^\/decks\/([0-9a-fA-F]{24})(?:\/|$)/;

export const parseAlgomancerDeckId = (value: string) => {
  try {
    const url = new URL(value);
    if (!ALLOWED_HOSTS.has(url.hostname)) return null;
    const match = url.pathname.match(DECK_PATH_REGEX);
    if (!match) return null;
    return match[1];
  } catch {
    return null;
  }
};

export const isValidAlgomancerDeckUrl = (value: string) =>
  parseAlgomancerDeckId(value) !== null;
