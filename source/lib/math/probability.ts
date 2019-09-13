export function happens(probability: number): boolean {
	return Math.random() < probability
}

export function randomBetween(min: number, max: number, random = Math.random()): number {
	const range = max - min
	const rnd = range * random
	return rnd + min
}
