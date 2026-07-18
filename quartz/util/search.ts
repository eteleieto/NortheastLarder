const latinWordPattern = /[a-z0-9\u00c0-\u024f]+/g

/** Split searchable text into words without indexing punctuation or whitespace. */
export function encodeSearchText(value: string): string[] {
  return value.toLocaleLowerCase().match(latinWordPattern) ?? []
}
