/**
 * Content / expansion model.
 *
 * TI4 content ships in layers (Base -> Prophecy of Kings -> Codex 1/2/3...), and Codices
 * include Omega (Ω) errata that *replace* an earlier version of a card. Every static game
 * entity carries the fields in {@link ContentTagged} so it can be filtered by the enabled
 * content set and have its Ω revisions resolved centrally (see content.rules.ts).
 */

export const CONTENT_SOURCES = ['base', 'pok', 'codex1', 'codex2', 'codex3'] as const;

export type ContentSource = (typeof CONTENT_SOURCES)[number];

export type EnabledContent = readonly ContentSource[];

/** What the group currently plays: Base + Prophecy of Kings + Codex 1 (Ordinian). */
export const DEFAULT_ENABLED_CONTENT: EnabledContent = ['base', 'pok', 'codex1'];

export function isContentSource(value: unknown): value is ContentSource {
  return typeof value === 'string' && (CONTENT_SOURCES as readonly string[]).includes(value);
}

/**
 * Fields every static game entity carries. Spread/extend this into entity types
 * (Tech, Planet, Faction, ...) so the content rules apply uniformly across features.
 */
export interface ContentTagged {
  /** Stable identifier, e.g. "gravity_drive". */
  readonly id: string;
  /** Which content set introduced this entity (or this Ω revision of it). */
  readonly source: ContentSource;
  /** Present when this entity is an Ω (omega) errata revision of another entity. */
  readonly errata?: 'omega';
  /** When {@link errata} is set, the id of the entity this revision replaces. */
  readonly supersedesId?: string;
}
