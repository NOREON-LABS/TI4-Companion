import type { ContentSource, ContentTagged, EnabledContent } from './content.types';

export function isContentEnabled(source: ContentSource, enabled: EnabledContent): boolean {
  return enabled.includes(source);
}

/** Drop entities whose source is not part of the enabled content set. */
export function filterByContent<T extends ContentTagged>(
  entities: readonly T[],
  enabled: EnabledContent,
): T[] {
  return entities.filter((entity) => isContentEnabled(entity.source, enabled));
}

/**
 * Resolve Codex Ω (omega) errata: when an Ω revision is present, the entity it supersedes
 * is removed so only the active version remains. Run this *after* {@link filterByContent}
 * so a present Ω revision is guaranteed to be from an enabled content set.
 */
export function resolveOmega<T extends ContentTagged>(entities: readonly T[]): T[] {
  const supersededIds = new Set<string>();
  for (const entity of entities) {
    if (entity.errata === 'omega' && entity.supersedesId) {
      supersededIds.add(entity.supersedesId);
    }
  }
  return entities.filter((entity) => !supersededIds.has(entity.id));
}

/** Filter by enabled content, then resolve Ω errata. The canonical "active set" pipeline. */
export function activeEntities<T extends ContentTagged>(
  entities: readonly T[],
  enabled: EnabledContent,
): T[] {
  return resolveOmega(filterByContent(entities, enabled));
}
