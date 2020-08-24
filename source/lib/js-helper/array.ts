import randomItem from 'random-item'

export function randomUnusedEntry<T>(all: readonly T[], used: readonly T[] = []): T {
	const possible = all
		.filter(o => !used.includes(o))

	if (possible.length === 0) {
		throw new Error('no entries to chose from')
	}

	return randomItem(possible)
}

export function randomUniqueEntries<T>(all: readonly T[], amount: number, used: readonly T[] = []): T[] {
	const result: T[] = []
	const possible = all
		.filter(o => !used.includes(o))

	while (result.length < amount) {
		result.push(
			randomUnusedEntry(possible, result)
		)
	}

	return result
}
