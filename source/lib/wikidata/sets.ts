import randomItem from 'random-item'
import {sparqlQuerySimplifiedMinified} from 'wikidata-sdk-got'

type SetName = 'alienHobby' | 'disaster'

const queries: Record<SetName, string> = {
	alienHobby: `SELECT DISTINCT ?planet WHERE {
?planet wdt:P31 ?class.
?class wdt:P279* wd:Q128207.
?planet wdt:P18 ?image.
}`,
	disaster: `SELECT DISTINCT ?item WHERE {
?item wdt:P279+ wd:Q3839081.
?item wdt:P18 ?image.
}`
}

const entities: Record<SetName, string[]> = {
	alienHobby: [],
	disaster: []
}

export async function preload(): Promise<string[]> {
	console.time('wikidata-sets')
	await Promise.all(
		(Object.keys(queries) as SetName[])
			.map(async key => loadQNumbersOfKey(key))
	)

	const qNumbers = Object.values(entities).flat()
	console.timeLog('wikidata-sets', 'sum', qNumbers.length)
	console.timeEnd('wikidata-sets')
	return qNumbers
}

async function loadQNumbersOfKey(key: SetName): Promise<void> {
	try {
		const results = await sparqlQuerySimplifiedMinified(queries[key])
		const qNumbers = results as string[]
		entities[key] = qNumbers
		console.timeLog('wikidata-sets', key, qNumbers.length)
	} catch (error) {
		console.error('wikidata-set query failed', key, error)
	}
}

export function get(key: SetName): readonly string[] {
	return entities[key] || []
}

export function getRandom(key: SetName): string {
	return randomItem(get(key))
}
