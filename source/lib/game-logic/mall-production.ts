import WikidataEntityStore from 'wikidata-entity-store'
import WikidataEntityReader from 'wikidata-entity-reader'

import {DAY_IN_SECONDS, HOUR_IN_SECONDS} from '../math/timestamp-constants'

import {getParts} from '../wikidata/production'

export async function preloadWithParts(store: WikidataEntityStore, qNumber: string, now: number): Promise<void> {
	await store.loadQNumbers(now - HOUR_IN_SECONDS, qNumber)
	const reader = new WikidataEntityReader(store.entity(qNumber))
	if (!canProduce(reader)) {
		return
	}

	const parts = getParts(reader)
	await store.loadQNumbers(now - DAY_IN_SECONDS, ...parts)
}

export function canProduce(item: WikidataEntityReader): boolean {
	const parts = getParts(item)
	return parts.length >= 3
}
