import test, { describe } from "node:test"
import assert from "node:assert"
import { encodeSearchText } from "./search"

describe("encodeSearchText", () => {
  test("does not emit whitespace or punctuation tokens", () => {
    assert.deepStrictEqual(encodeSearchText("Sour Cherry & rye"), ["sour", "cherry", "rye"])
  })

  test("keeps Latin accented characters within words", () => {
    assert.deepStrictEqual(encodeSearchText("Café brûlée"), ["café", "brûlée"])
  })

  test("keeps numeric search terms", () => {
    assert.deepStrictEqual(encodeSearchText("140°F, 2% salt"), ["140", "f", "2", "salt"])
  })
})
