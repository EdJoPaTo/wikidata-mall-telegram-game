export function stateful(initialValue = 1): (next: number) => number {
	let last = initialValue
	return next => {
		const result = next + last
		last = next
		return result
	}
}

const cache = [0, 1]
export function cached(i: number): number {
	fillArray(cache, i)
	return cache[i]!
}

export function fillArray(numbers: number[], untilIndex: number): void {
	if (numbers.length < 2) {
		throw new Error('number array is too short for fibonaci calculation')
	}

	if (!Number.isFinite(untilIndex)) {
		throw new TypeError('only finite fibonacci number indicies are supported')
	}

	while (numbers.length <= untilIndex) {
		numbers.push(numbers[numbers.length - 2]! + numbers[numbers.length - 1]!)
	}
}
