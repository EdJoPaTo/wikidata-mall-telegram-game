import arrayFilterUnique from 'array-filter-unique'
import WikidataEntityReader from 'wikidata-entity-reader'
import WikidataEntityStore from 'wikidata-entity-store'

import * as mallProduction from '../data/mall-production'

const PART_CLAIMS = [
	'P186', // Material used
	'P527', // Has Part
	'P2670' // Has Part of the class
]
export function getParts(item: WikidataEntityReader): string[] {
	return PART_CLAIMS
		.flatMap(o => item.claim(o))
		.filter(arrayFilterUnique())
}

export async function preload(store: WikidataEntityStore): Promise<string[]> {
	const current = await mallProduction.get()
	await store.forceloadQNumbers(current.itemToProduce)
	const reader = new WikidataEntityReader(store.entity(current.itemToProduce))
	const parts = getParts(reader)
	return parts
}
