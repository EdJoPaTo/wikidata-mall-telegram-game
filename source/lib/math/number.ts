export function scientificExponent(number: number): number {
	const exp = Math.floor(Math.log10(Math.abs(number)))
	const sciExp = Math.max(0, Math.floor(exp / 3) * 3)
	return sciExp
}
