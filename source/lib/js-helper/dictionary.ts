export function recreateDictWithGivenKeyOrder<T>(dict: Readonly<Record<string, T>>, newOrder: readonly string[]): Record<string, T> {
	const result: Record<string, T> = {}
	for (const key of newOrder) {
		if (!Number.isNaN(Number(key))) {
			throw new TypeError('this will not work as numbers are ordered for performance optimization')
		}

		result[key] = dict[key]
	}

	return result
}

export function sortDictKeysByValues<Value>(dict: Readonly<Record<string, Value>>, compareFn: (a: Value, b: Value) => number): string[] {
	return Object.keys(dict)
		.sort((a, b) => compareFn(dict[a], dict[b]))
}

export function sortDictKeysByStringValues(dict: Readonly<Record<string, string>>, locale?: string): string[] {
	return sortDictKeysByValues(dict, (a, b) => a.localeCompare(b, locale))
}

export function sortDictKeysByNumericValues(dict: Readonly<Record<string, number>>, reverse = false): string[] {
	return sortDictKeysByValues(dict, reverse ? (a, b) => b - a : (a, b) => a - b)
}

export function filterDictKeysByValues<Value>(dict: Readonly<Record<string, Value>>, filterFn: (key: string, value: Value) => boolean): string[] {
	const keys = Object.keys(dict)
	const resultKeys = keys
		.filter(o => filterFn(o, dict[o]))

	return resultKeys
}

export function joinDictArrayArrays<Value>(dictArray: ReadonlyArray<Readonly<Record<string, Value[]>>>): Record<string, Value[]> {
	const result: Record<string, Value[]> = {}

	for (const entry of dictArray) {
		const keys = Object.keys(entry)
		for (const key of keys) {
			if (!result[key]) {
				result[key] = []
			}

			result[key].push(...entry[key])
		}
	}

	return result
}
