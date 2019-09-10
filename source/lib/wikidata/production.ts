import arrayFilterUnique from 'array-filter-unique'
import WikidataEntityReader from 'wikidata-entity-reader'

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
