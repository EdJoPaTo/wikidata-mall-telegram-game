import * as wdGot from 'wikidata-sdk-got'
import arrayFilterUnique from 'array-filter-unique'

const BLACKLIST_BASICS_TOPLEVEL = [
	'Q18643213', // Military Equipment
	'Q728' // Weapon
]

let BLACKLIST_BASICS: string[] = []

async function loadFromToplevel(toplevel: readonly string[]): Promise<string[]> {
	let query = ''
	query += 'SELECT ?item WHERE {'
	query += toplevel
		.map(o => `{ ?item wdt:P279* wd:${o}. }`)
		.join('UNION')
	query += '}'

	const result = await wdGot.sparqlQuerySimplifiedMinified(query)
	return (result as string[])
		.filter(arrayFilterUnique())
}

export async function preload(): Promise<void> {
	BLACKLIST_BASICS = await loadFromToplevel(BLACKLIST_BASICS_TOPLEVEL)
}

export function basicIncludes(item: string): boolean {
	return BLACKLIST_BASICS.includes(item)
}
