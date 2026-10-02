import { describe, expect, it } from "vitest";
import { ManuscriptExportError, parseManuscriptExport } from "../src/parse.js";
import { MANUSCRIPT_EXPORT_FORMAT, MANUSCRIPT_EXPORT_KIND, type ManuscriptExport } from "../src/schema.js";

const validExport: ManuscriptExport = {
  kind: MANUSCRIPT_EXPORT_KIND,
  format: MANUSCRIPT_EXPORT_FORMAT,
  exportedAt: "2026-10-02T00:00:00.000Z",
  sourceApp: "storybook-ai",
  sourceBookId: "book-1",
  title: "Night Keys",
  illustrationStyle: "Watercolor",
  chapters: [{ id: "ch1", sequence_index: 0, title: "The quay", prose: "Emma walked to the quay." }],
  bible: [
    {
      kind: "characters",
      label: "Characters",
      entities: [
        {
          entity_ref: "emma",
          name: "Emma",
          facts: [{ predicate: "core.identity", label: "Identity", value: "Bartender" }],
          referenceImages: []
        }
      ]
    }
  ]
};

describe("parseManuscriptExport", () => {
  it("accepts a well-formed export", () => {
    expect(parseManuscriptExport(validExport)).toEqual(validExport);
  });

  it("rejects a non-object", () => {
    expect(() => parseManuscriptExport("not an object")).toThrow(ManuscriptExportError);
    try {
      parseManuscriptExport(null);
    } catch (err) {
      expect((err as ManuscriptExportError).code).toBe("not-export");
    }
  });

  it("rejects a file of the wrong kind", () => {
    try {
      parseManuscriptExport({ ...validExport, kind: "storybook-ai.manuscript" });
      throw new Error("expected to throw");
    } catch (err) {
      expect((err as ManuscriptExportError).code).toBe("wrong-kind");
    }
  });

  it("rejects a newer format than this build understands", () => {
    try {
      parseManuscriptExport({ ...validExport, format: MANUSCRIPT_EXPORT_FORMAT + 1 });
      throw new Error("expected to throw");
    } catch (err) {
      expect((err as ManuscriptExportError).code).toBe("newer-format");
    }
  });

  it("rejects a structurally invalid export", () => {
    try {
      parseManuscriptExport({ ...validExport, bible: "not an array" });
      throw new Error("expected to throw");
    } catch (err) {
      expect((err as ManuscriptExportError).code).toBe("invalid");
    }
  });

  it("fills in defaults for optional arrays", () => {
    const { facts, referenceImages, ...entityWithoutDefaults } = validExport.bible[0]!.entities[0]!;
    const result = parseManuscriptExport({
      ...validExport,
      bible: [{ ...validExport.bible[0], entities: [entityWithoutDefaults] }]
    });
    expect(result.bible[0]?.entities[0]?.facts).toEqual([]);
    expect(result.bible[0]?.entities[0]?.referenceImages).toEqual([]);
  });
});
