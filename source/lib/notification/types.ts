import WikidataEntityReader from 'wikidata-entity-reader'

export interface MiniWikidataStore {
	readonly reader: (keyOrEntityId: string, locale: string) => Promise<WikidataEntityReader>;
	readonly preload: (entityIds: readonly string[]) => Promise<void>;
}
