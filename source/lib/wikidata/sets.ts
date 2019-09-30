import randomItem from 'random-item'
import {sparqlQuerySimplifiedMinified} from 'wikidata-sdk-got'

const queries: Record<string, string> = {
	alienHobby: `SELECT DISTINCT ?planet WHERE {
?planet wdt:P31 ?class.
?class wdt:P279* wd:Q128207.
?planet wdt:P18 ?image.
}`,
	attractions: `SELECT DISTINCT ?item WHERE {
?item wdt:P31*/wdt:P279* wd:Q570116.
?item rdfs:label ?label.
?item wdt:P18 ?image.
?item wdt:P2048 ?height.
FILTER((LANG(?label)) = "en")
}`
}

const entities: Record<string, string[]> = {}

export async function preload(): Promise<string[]> {
	console.time('wikidata-sets')
	await Promise.all(
		Object.keys(queries)
			.map(async key => loadQNumbersOfKey(key))
	)

	const qNumbers = Object.values(entities).flat()
	console.timeLog('wikidata-sets', 'sum', qNumbers.length)
	console.timeEnd('wikidata-sets')
	return qNumbers
}

async function loadQNumbersOfKey(key: string): Promise<void> {
	try {
		const results = await sparqlQuerySimplifiedMinified(queries[key])
		const qNumbers = results as string[]
		entities[key] = qNumbers
		console.timeLog('wikidata-sets', key, qNumbers.length)
	} catch (error) {
		console.error('wikidata-set query failed', key, error)
	}
}

export function get(key: string): readonly string[] {
	return entities[key] || []
}

export function getRandom(key: string): string {
	return randomItem(get(key))
}
