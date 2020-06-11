export interface QuickStats {
	readonly amount: number;
	readonly sum: number;
	readonly avg: number;
	readonly min: number;
	readonly max: number;
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

export function numberArrayOnlyFinite(values: ReadonlyArray<number | null | undefined>): number[] {
	return values.filter(o => o !== null && o !== undefined && Number.isFinite(o)) as number[]
}
