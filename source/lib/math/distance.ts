export function distanceSteps(values: readonly number[]): number[] {
	const sorted = [...values].sort((a, b) => a - b)
	const distanceArr = sorted.reduce((curr: number[], add, i, arr) => {
		if (i === 0) {
			return curr
		}

		const distance = add - arr[i - 1]
		curr.push(distance)

		return curr
	}, [])

	return distanceArr
}
