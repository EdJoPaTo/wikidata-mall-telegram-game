export type Dictionary<T> = {[key: string]: T}

export function recreateDictWithGivenKeyOrder<T>(dict: Dictionary<T>, newOrder: readonly string[]): Dictionary<T> {
	const result: Dictionary<T> = {}
	for (const key of newOrder) {
		if (!isNaN(Number(key))) {
			throw new TypeError('this will not work as numbers are ordered for performance optimization')
		}

		result[key] = dict[key]
	}

	return result
}

export function sortDictKeysByValues<T>(dict: Dictionary<T>, compareFn: (a: T, b: T) => number): string[] {
	return Object.keys(dict)
		.sort((a, b) => compareFn(dict[a], dict[b]))
}

export function sortDictKeysByStringValues(dict: Dictionary<string>, locale?: string): string[] {
	return sortDictKeysByValues(dict, (a, b) => a.localeCompare(b, locale))
}

export function sortDictKeysByNumericValues(dict: Dictionary<number>, reverse = false): string[] {
	return sortDictKeysByValues(dict, reverse ? (a, b) => b - a : (a, b) => a - b)
}

