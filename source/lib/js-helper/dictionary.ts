export function recreateDictWithGivenKeyOrder<T>(dict: Record<string, T>, newOrder: readonly string[]): Record<string, T> {
	const result: Record<string, T> = {}
	for (const key of newOrder) {
		if (!isNaN(Number(key))) {
			throw new TypeError('this will not work as numbers are ordered for performance optimization')
		}

		result[key] = dict[key]
	}

	return result
}

export function sortDictKeysByValues<Value>(dict: Record<string, Value>, compareFn: (a: Value, b: Value) => number): string[] {
	return Object.keys(dict)
		.sort((a, b) => compareFn(dict[a], dict[b]))
}

export function sortDictKeysByStringValues(dict: Record<string, string>, locale?: string): string[] {
	return sortDictKeysByValues(dict, (a, b) => a.localeCompare(b, locale))
}

export function sortDictKeysByNumericValues(dict: Record<string, number>, reverse = false): string[] {
	return sortDictKeysByValues(dict, reverse ? (a, b) => b - a : (a, b) => a - b)
}

