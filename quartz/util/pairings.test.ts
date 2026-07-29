import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { parsePairings } from "./pairings"

describe("parsePairings", () => {
  it("parses wikilinks, aliases, and plain page names", () => {
    assert.deepEqual(parsePairings(["[[Fenugreek]]", "[[Brown Rice|brown rice]]", "Rhubarb"]), [
      { label: "Fenugreek", slug: "Fenugreek" },
      { label: "brown rice", slug: "Brown-Rice" },
      { label: "Rhubarb", slug: "Rhubarb" },
    ])
  })

  it("ignores empty values and de-duplicates destinations", () => {
    assert.deepEqual(parsePairings(["", "[[Lovage]]", "[[Lovage|lovage]]", null]), [
      { label: "lovage", slug: "Lovage" },
    ])
  })
})
