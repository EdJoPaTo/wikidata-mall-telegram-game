import * as wdGot from 'wikidata-sdk-got'
import arrayFilterUnique from 'array-filter-unique/dist'

const BLACKLIST_TOPLEVEL = [
	'Q1274979',
	'Q18643213',
	'Q309314',
	'Q4936952',
	'Q728'
]

let BLACKLIST: string[] = []

export async function preload(): Promise<void> {
	let query = ''
	query += 'SELECT ?item WHERE {'
	query += BLACKLIST_TOPLEVEL
		.map(o => `{ ?item wdt:P279* wd:${o}. }`)
		.join('UNION')
	query += '}'

	const result = await wdGot.sparqlQuerySimplifiedMinified(query)
	BLACKLIST = (result as string[])
		.filter(arrayFilterUnique())
}

export function includes(item: string): boolean {
	return BLACKLIST.includes(item)
}
