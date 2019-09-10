import WikidataEntityStore from 'wikidata-entity-store'
import WikidataEntityReader from 'wikidata-entity-reader'

import {getParts} from '../wikidata/production'

export async function preloadWithParts(store: WikidataEntityStore, qNumber: string): Promise<void> {
	await store.preloadQNumbers(qNumber)
	const reader = new WikidataEntityReader(store.entity(qNumber))
	if (!canProduce(reader)) {
		return
	}

	const parts = getParts(reader)
	await store.preloadQNumbers(...parts)
}

export function canProduce(item: WikidataEntityReader): boolean {
	const parts = getParts(item)
	return parts.length >= 3
}
