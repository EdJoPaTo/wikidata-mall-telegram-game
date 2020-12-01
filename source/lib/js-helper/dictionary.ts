export function recreateDictWithGivenKeyOrder<T>(dict: Readonly<Record<string, T>>, newOrder: readonly string[]): Record<string, T> {
	const result: Record<string, T> = {}
	for (const key of newOrder) {
		if (!Number.isNaN(Number(key))) {
			throw new TypeError('this will not work as numbers are ordered for performance optimization')
		}

		result[key] = dict[key]!
	}

	return result
}

export function sortDictKeysByValues<Value>(dict: Readonly<Record<string, Value>>, compareFn: (a: Value, b: Value) => number): string[] {
	return Object.entries(dict)
		.sort(([_akey, a], [_bkey, b]) => compareFn(a, b))
		.map(o => o[0])
}

export function sortDictKeysByStringValues(dict: Readonly<Record<string, string>>, locale?: string): string[] {
	return sortDictKeysByValues(dict, (a, b) => a.localeCompare(b, locale))
}

export function sortDictKeysByNumericValues(dict: Readonly<Record<string, number>>, reverse = false): string[] {
	return sortDictKeysByValues(dict, reverse ? (a, b) => b - a : (a, b) => a - b)
}

export function filterDictKeysByValues<Value>(dict: Readonly<Record<string, Value>>, filterFn: (key: string, value: Value) => boolean): string[] {
	return Object.entries(dict)
		.filter(([key, value]) => filterFn(key, value))
		.map(([key]) => key)
}

export function joinDictArrayArrays<Value>(dictArray: ReadonlyArray<Readonly<Record<string, Value[]>>>): Record<string, Value[]> {
	const result: Record<string, Value[]> = {}

	for (const entry of dictArray) {
		for (const [key, value] of Object.entries(entry)) {
			if (!result[key]) {
				result[key] = []
			}

			result[key]!.push(...value)
		}
	}

	return result
}
