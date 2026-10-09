const lowercaseConnectors = new Set([
  "de",
  "del",
  "la",
  "las",
  "el",
  "los",
  "y",
  "e",
  "o",
  "u",
  "en",
  "a",
  "con",
  "para",
  "por",
  "of",
  "the",
  "and",
  "in",
  "for",
  "on",
]);

export function capitalizeWords(text) {
  if (typeof text !== "string") return text;

  let wordIndex = 0;
  return text.replace(/\p{L}[\p{L}\p{M}\p{N}'’]*/gu, (word) => {
    const isConnector = wordIndex > 0 && lowercaseConnectors.has(word.toLocaleLowerCase("en"));
    wordIndex += 1;
    return isConnector ? word : `${word[0].toLocaleUpperCase("es")}${word.slice(1)}`;
  });
}
