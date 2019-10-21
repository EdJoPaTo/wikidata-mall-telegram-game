import {sparqlQuerySimplified} from 'wikidata-sdk-got'

type QNumber = string

interface Attraction {
	item: QNumber;
	height: number;
}

const query = `SELECT ?item ?height WHERE {
?item wdt:P31*/wdt:P279* wd:Q570116.
?item rdfs:label ?label.
?item wdt:P18 ?image.
?item p:P2048/psv:P2048 ?vn .
?vn wikibase:quantityAmount ?height .
?vn wikibase:quantityUnit ?unit .
FILTER (?unit = wd:Q11573)
FILTER((LANG(?label)) = "en")
}`

let attractions: Record<QNumber, number> = {}

export async function preload(logger: (...args: any[]) => void): Promise<string[]> {
	const result = await sparqlQuerySimplified(query)
	const resultAttractions: Attraction[] = result as any

	attractions = resultAttractions
		.reduce((coll: Record<QNumber, number>, add) => {
			const current = coll[add.item] === undefined ? -Infinity : coll[add.item]
			coll[add.item] = Math.max(current, add.height)
			return coll
		}, {})

	logger(Object.keys(attractions).length)
	return Object.keys(attractions)
}

export function all(): Record<QNumber, number> {
	return attractions
}

export function allHeightSortedArr(): readonly Attraction[] {
	return Object.keys(attractions)
		.map(o => ({item: o, height: attractions[o]}))
		.sort((a, b) => a.height - b.height)
}

export function getHeight(qNumber: QNumber): number {
	return attractions[qNumber]
}
