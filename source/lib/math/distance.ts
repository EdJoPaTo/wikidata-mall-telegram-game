export function distanceSteps(values: readonly number[]): number[] {
	const sorted = [...values].sort((a, b) => a - b)
	const distanceArray = sorted.reduce((curr: number[], add, i, array) => {
		if (i === 0) {
			return curr
		}

		const distance = add - array[i - 1]
		curr.push(distance)

		return curr
	}, [])

	return distanceArray
}

export function interpolate(start: number, end: number, position: number): number {
	return start + ((end - start) * position)
}

export function relativePositionBetween(start: number, end: number, x: number): number {
	return (x - start) / (end - start)
}
