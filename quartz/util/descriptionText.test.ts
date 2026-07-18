import test, { describe } from "node:test"
import assert from "node:assert"
import type { Root } from "hast"
import { extractBodyText } from "./descriptionText"

describe("extractBodyText", () => {
  test("includes tight list items when a page also has paragraphs", () => {
    const tree: Root = {
      type: "root",
      children: [
        {
          type: "element",
          tagName: "p",
          properties: {},
          children: [{ type: "text", value: "Opening paragraph." }],
        },
        {
          type: "element",
          tagName: "ul",
          properties: {},
          children: [
            {
              type: "element",
              tagName: "li",
              properties: {},
              children: [{ type: "text", value: "Whole sour cherries" }],
            },
          ],
        },
      ],
    }

    assert.strictEqual(extractBodyText(tree), "Opening paragraph.\nWhole sour cherries")
  })

  test("does not duplicate paragraphs inside loose list items", () => {
    const tree: Root = {
      type: "root",
      children: [
        {
          type: "element",
          tagName: "ul",
          properties: {},
          children: [
            {
              type: "element",
              tagName: "li",
              properties: {},
              children: [
                {
                  type: "element",
                  tagName: "p",
                  properties: {},
                  children: [{ type: "text", value: "One list paragraph." }],
                },
              ],
            },
          ],
        },
      ],
    }

    assert.strictEqual(extractBodyText(tree), "One list paragraph.")
  })
})
