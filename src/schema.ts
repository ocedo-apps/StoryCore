import { z } from "zod";

/**
 * The shared vocabulary for what kind of thing a Story Bible entity is.
 * Mirrors StoryBook AI's own `BIBLE_KINDS` (`bibleGroups.ts`) — a small,
 * rarely-changing enum, intentionally duplicated here rather than imported,
 * since StoryCore must never depend on StoryBook AI's internal modules.
 */
export const BIBLE_KINDS = ["characters", "locations", "objects", "groups", "events", "concepts"] as const;
export const BibleKindSchema = z.enum(BIBLE_KINDS);
export type BibleKind = z.infer<typeof BibleKindSchema>;

/**
 * One claim about an entity. `predicate` is carried through as an opaque
 * string (provenance only) — a consuming app has no business interpreting
 * StoryBook AI's internal predicate taxonomy, only displaying `label` and
 * `value`. Classification into a `BibleKind` has already happened on the
 * StoryBook AI side before export; nothing here needs to re-derive it.
 */
export const ExportedFactSchema = z.object({
  predicate: z.string().min(1),
  label: z.string().min(1),
  value: z.string().min(1)
});
export type ExportedFact = z.infer<typeof ExportedFactSchema>;

/**
 * One Story Bible entity and everything a sibling app needs to use it —
 * structured fields, not the flattened display lines StoryBook AI's own
 * human-readable Publish export uses. `referenceImages` carries existing
 * portraits/pictures inline as data URLs, the same way StoryBook AI's own
 * backup format embeds images — no separate asset files to keep track of.
 */
export const ExportedEntitySchema = z.object({
  entity_ref: z.string().min(1),
  name: z.string().min(1),
  facts: z.array(ExportedFactSchema).default([]),
  pronoun: z.string().min(1).optional(),
  approximateAge: z.number().int().nonnegative().optional(),
  looks: z.string().min(1).optional(),
  personality: z.string().min(1).optional(),
  referenceImages: z.array(z.string().min(1)).default([])
});
export type ExportedEntity = z.infer<typeof ExportedEntitySchema>;

export const ExportedBibleSectionSchema = z.object({
  kind: BibleKindSchema,
  label: z.string().min(1),
  entities: z.array(ExportedEntitySchema)
});
export type ExportedBibleSection = z.infer<typeof ExportedBibleSectionSchema>;

export const ExportedChapterSchema = z.object({
  id: z.string().min(1),
  sequence_index: z.number().int().nonnegative(),
  title: z.string(),
  prose: z.string()
});
export type ExportedChapter = z.infer<typeof ExportedChapterSchema>;

export const MANUSCRIPT_EXPORT_KIND = "storycore.manuscript-export";
export const MANUSCRIPT_EXPORT_FORMAT = 1;

/**
 * The full export contract. Deliberately NOT StoryBook AI's internal `Book`
 * type — `Book` gains fields almost every release; binding a sibling app to
 * it directly would make every StoryBook AI change a possible breakage for
 * every sibling app. This shape only grows when the contract itself changes,
 * versioned via `format`.
 *
 * Only locked, visible facts belong in `bible` — the same visibility rule
 * Draft itself uses (`visibleLockedFacts`: locked, not superseded, not
 * hidden from the model, not a hidden entity), not StoryBook AI's more
 * permissive human-facing Publish export. A sibling app feeds this into
 * further AI generation, the same category of consumer as Draft, so it
 * should see only what Draft itself would see.
 */
export const ManuscriptExportSchema = z.object({
  kind: z.literal(MANUSCRIPT_EXPORT_KIND),
  format: z.literal(MANUSCRIPT_EXPORT_FORMAT),
  exportedAt: z.string().min(1),
  sourceApp: z.literal("storybook-ai"),
  sourceBookId: z.string().min(1),
  title: z.string(),
  illustrationStyle: z.string().default(""),
  chapters: z.array(ExportedChapterSchema),
  bible: z.array(ExportedBibleSectionSchema)
});
export type ManuscriptExport = z.infer<typeof ManuscriptExportSchema>;
