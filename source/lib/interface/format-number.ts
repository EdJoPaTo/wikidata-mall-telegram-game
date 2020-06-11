import {scientificExponent} from '../math/number'

const LETTERS = ['', 'k', 'M', 'G', 'T', 'P', 'E']

function formatNumber(number: number, formatRelevantNumber: (relevantNumPart: number, scientificExponent: number) => string): string {
	const sciExp = scientificExponent(number)
	const sciNumber = 10 ** sciExp
	const relevantNumberPart = number / sciNumber
	const numberString = formatRelevantNumber(relevantNumberPart, sciExp)

	const letterString = LETTERS[sciExp / 3]

	return numberString + letterString
}

export function formatFloat(number: number): string {
	return formatNumber(number, number => number.toPrecision(3))
}

export function formatInt(number: number): string {
	return formatNumber(number, (relevantNumberPart, sciExp) =>
		sciExp < 2 ? relevantNumberPart.toFixed(0) : relevantNumberPart.toPrecision(3)
	)
}
