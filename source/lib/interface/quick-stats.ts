import {QuickStats} from '../math/number-array'

type FormatNumberFunc = (n: number) => string

export const characters = {
	amount: '',
	avg: '~',
	max: '≤',
	min: '≥',
	sum: '='
}

export function specific(quickStats: QuickStats, what: keyof QuickStats, formatNumber: FormatNumberFunc): string {
	return characters[what] + formatNumber(quickStats[what])
}

export function minAvgMax(quickStats: QuickStats, formatMinMax: FormatNumberFunc, formatAvg: FormatNumberFunc): string {
	return [
		specific(quickStats, 'min', formatMinMax),
		specific(quickStats, 'avg', formatAvg),
		specific(quickStats, 'max', formatMinMax)
	].join(' ')
}
