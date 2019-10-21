import {sparqlQuerySimplified} from 'wikidata-sdk-got'

import {filterDictKeysByValues, recreateDictWithGivenKeyOrder, joinDictArrayArrays} from '../js-helper/dictionary'
import {sequentialAsync} from '../js-helper/async'

import * as blacklist from './blacklist'

const CATEGORIES = [
	'Q2095', // Food
	'Q39546' // Tools
]

let producable: Record<string, string[]> = {}

function buildQuery(category: string): string {
	/*
	Properties
	P186 material used
	P527 has part (not used as it might include unique parts)
	P2670 has part of the class
	*/
	return `SELECT ?product ?part WHERE {
?product wdt:P279* wd:${category}.
FILTER EXISTS { ?product wdt:P18 ?image. }
{ ?product wdt:P186 ?part. }
UNION
{ ?product wdt:P2670 ?part. }
}`
}

export function getProducts(): readonly string[] {
	return Object.keys(producable)
}

export function getParts(product: string): readonly string[] {
	return producable[product] || []
}

export async function preload(): Promise<string[]> {
	const resultsArr = await sequentialAsync(preloadCategory, CATEGORIES)

	const results = joinDictArrayArrays(resultsArr)
	for (const o of Object.keys(results)) {
		if (blacklist.basicIncludes(o)) {
			delete results[o]
		}
	}

	producable = results

	const keys = Object.keys(producable)
	const values = Object.values(producable).flat()
	return [
		...keys,
		...values
	]
}

async function preloadCategory(category: string): Promise<Record<string, string[]>> {
	const query = buildQuery(category)
	const result = await sparqlQuerySimplified(query) as readonly Record<string, string>[]

	const reduced = result.reduce(reduceRowsIntoKeyValue, {})
	const filteredKeys = filterDictKeysByValues(reduced, (_, v) => v.length >= 3)
	const filtered = recreateDictWithGivenKeyOrder(reduced, filteredKeys)
	return filtered
}

function reduceRowsIntoKeyValue(coll: Record<string, string[]>, {product, part}: Record<string, string>): Record<string, string[]> {
	if (!coll[product]) {
		coll[product] = []
	}

	if (!coll[product].includes(part) && Boolean(part)) {
		coll[product].push(part)
	}

	return coll
}
