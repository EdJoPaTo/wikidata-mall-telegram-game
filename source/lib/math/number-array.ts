export interface QuickStats {
	amount: number;
	sum: number;
	avg: number;
	min: number;
	max: number;
}

export function calcQuickStats(numbers: readonly number[]): QuickStats {
	const sum = numbers.reduce((a, b) => a + b, 0)
	const amount = numbers.length
	const avg = sum / amount

	return {
		amount,
		avg,
		min: Math.min(...numbers),
		max: Math.max(...numbers),
		sum
	}
}

export function numberArrayOnlyFinite(values: readonly (number | null | undefined)[]): number[] {
	return values.filter(o => o !== null && o !== undefined && Number.isFinite(o)) as number[]
}
