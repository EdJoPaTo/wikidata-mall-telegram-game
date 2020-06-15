import {sparqlQuerySimplifiedMinified} from 'wikidata-sdk-got'
import randomItem from 'random-item'

type SetName =
	'alienHobby' |
	'disaster' |
	'hobbyChristmas' |
	'hobbyHalloween'

const queries: Record<SetName, string> = {
	alienHobby: `SELECT DISTINCT ?planet WHERE {
?planet wdt:P31 ?class.
?class wdt:P279* wd:Q128207.
?planet wdt:P18 ?image.
}`,
	disaster: `SELECT DISTINCT ?item WHERE {
?item wdt:P279+ wd:Q3839081.
?item wdt:P18 ?image.
}`,
	hobbyChristmas: `SELECT ?item WHERE {
?item wdt:P171 wd:Q39624.
FILTER EXISTS { ?item wdt:P18 ?image. }
}`,
	hobbyHalloween: `SELECT ?item WHERE {
?item wdt:P171 wd:Q28425.
FILTER EXISTS { ?item wdt:P18 ?image. }
}`
}

const entities: Record<SetName, string[]> = {
	alienHobby: [],
	disaster: [],
	hobbyChristmas: [],
	hobbyHalloween: []
}

export async function preload(logger: (...args: any[]) => void): Promise<void> {
	await Promise.all(
		(Object.keys(queries) as SetName[])
			.map(async key => loadQNumbersOfKey(logger, key))
	)

	const qNumbers = Object.values(entities).flat()
	logger('sum', qNumbers.length)
}

async function loadQNumbersOfKey(logger: (...args: any[]) => void, key: SetName): Promise<void> {
	try {
		const results = await sparqlQuerySimplifiedMinified(queries[key])
		const qNumbers = results as string[]
		entities[key] = qNumbers
		logger(key, qNumbers.length)
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
