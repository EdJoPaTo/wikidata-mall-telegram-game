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
	return producable[product] ?? []
}

export async function preload(logger: (...args: any[]) => void): Promise<void> {
	const resultsArray = await sequentialAsync(preloadCategory, CATEGORIES)
	logger('finished queries')

	const results = joinDictArrayArrays(resultsArray)
	logger('products', Object.keys(results).length)
	for (const o of Object.keys(results)) {
		if (blacklist.basicIncludes(o)) {
			delete results[o]
		}
	}

	logger('products after blacklist', Object.keys(results).length)
	producable = results
}

async function preloadCategory(category: string): Promise<Record<string, string[]>> {
	const query = buildQuery(category)
	const result = await sparqlQuerySimplified(query) as ReadonlyArray<Record<string, string>>

	const reduced = result.reduce<Record<string, string[]>>((coll, add) => reduceRowsIntoKeyValue(coll, add), {})
	const filteredKeys = filterDictKeysByValues(reduced, (_, v) => v.length >= 3)
	const filtered = recreateDictWithGivenKeyOrder(reduced, filteredKeys)
	return filtered
}

function reduceRowsIntoKeyValue(coll: Record<string, string[]>, add: Record<string, string>): Record<string, string[]> {
	const product = add.product!
	const part = add.part!
	if (!coll[product]) {
		coll[product] = []
	}

	if (!coll[product]!.includes(part) && Boolean(part)) {
		coll[product]!.push(part)
	}

	return coll
}
