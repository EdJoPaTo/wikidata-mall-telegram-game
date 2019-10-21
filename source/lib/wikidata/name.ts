import randomItem from 'random-item'
import * as wdkGot from 'wikidata-sdk-got'

const cache = new Map()

const givenNames: string[] = []
const familyNames: string[] = []

export async function preload(logger: (...args: any[]) => void): Promise<void> {
	const [first, second] = await Promise.all([
		// Unisex given names
		instancesOfLabels(logger, 'Q3409032'),
		instancesOfLabels(logger, 'Q101352')
	])

	for (const name of first) {
		if (!(name in givenNames)) {
			givenNames.push(name)
		}
	}

	for (const name of second) {
		if (!(name in familyNames)) {
			familyNames.push(name)
		}
	}
}

function buildQuery(category: string): string {
	return `SELECT DISTINCT ?label WHERE {
?item wdt:P31 wd:${category}.
?item rdfs:label ?label.
FILTER(LANG(?label) = "en")
}
LIMIT 5000`
}

async function instancesOfLabels(logger: (...args: any[]) => void, category: string): Promise<string[]> {
	const query = buildQuery(category)
	const results = await wdkGot.sparqlQuerySimplifiedMinified(query, {cache}) as string[]
	const sorted = results
		.sort((a, b) => a.localeCompare(b))

	logger(category)
	return sorted
}

export function getGivenNames(): readonly string[] {
	return givenNames
}

export function getFamilyNames(): readonly string[] {
	return familyNames
}

export function randomName(): {given: string; family: string} {
	if (givenNames.length === 0 || familyNames.length === 0) {
		throw new Error('Names not yet loaded')
	}

	return {
		given: randomItem(givenNames),
		family: randomItem(familyNames)
	}
}
