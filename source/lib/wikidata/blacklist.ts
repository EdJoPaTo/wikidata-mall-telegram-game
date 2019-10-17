import * as wdGot from 'wikidata-sdk-got'
import arrayFilterUnique from 'array-filter-unique/dist'

const BLACKLIST_BASICS_TOPLEVEL = [
	'Q18643213', // Military Equipment
	'Q25570959', // Animal structure
	'Q2956046', // Change of state
	'Q309314', // Quantity
	'Q43022214', // Gendered anatomical structure
	'Q728' // Weapon
]

const BLACKLIST_PRODUCTION_TOPLEVEL = [
	'Q1274979' // Creature
]

let BLACKLIST_BASICS: string[] = []
let BLACKLIST_PRODUCTION: string[] = []

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
	BLACKLIST_PRODUCTION = await loadFromToplevel(BLACKLIST_PRODUCTION_TOPLEVEL)
}

export function basicIncludes(item: string): boolean {
	return BLACKLIST_BASICS.includes(item)
}

export function productionIncludes(item: string): boolean {
	if (BLACKLIST_BASICS.includes(item)) {
		return true
	}

	return BLACKLIST_PRODUCTION.includes(item)
}
