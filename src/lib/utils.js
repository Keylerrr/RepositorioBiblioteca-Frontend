import { cn } from "cn";

export { cn };

/**
 * Helper to capitalize the first letter of each word in a string
 * (e.g. "español" -> "Español", "ingeniería de sistemas" -> "Ingeniería De Sistemas")
 */
export function capitalizeWords(str) {
  if (!str || typeof str !== "string") return "";
  // Check if string starts with an emoji (e.g. "🇨🇴 colombia")
  const emojiRegex = /^(\p{Extended_Pictographic}|\p{Regional_Indicator}{2})\s*/u;
  const match = str.match(emojiRegex);
  let prefix = "";
  let textToFormat = str;

  if (match) {
    prefix = match[0];
    textToFormat = str.slice(prefix.length);
  }

  // Lowercase exceptions (prepositions/conjunctions in Spanish)
  const minorWords = new Set(["de", "del", "en", "y", "o", "la", "el", "los", "las", "por", "para", "con"]);

  const formattedText = textToFormat
    .split(/\s+/)
    .map((word, index) => {
      const lower = word.toLowerCase();
      // Keep acronyms like "API", "OAI-PMH", "REST", "ES", "PT", "EN", "ISSN", "IEEE" uppercase
      if (["api", "oai-pmh", "rest", "es", "pt", "en", "issn", "ieee", "pdf", "json", "rss", "atom"].includes(lower)) {
        return word.toUpperCase();
      }
      if (index > 0 && minorWords.has(lower)) {
        return lower;
      }
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(" ");

  return prefix + formattedText;
}
