import gaussian, {Gaussian} from 'gaussian'

import {Talents, PersonType} from '../types/people'

import {randomTalents, randomTalentsDistinct} from '../game-math/applicant'

// Gaussian takes sigma^2, everyone else takes sigma (standardDeviation)
// -> use sigma and square it on startup
const distribution: Record<string, Gaussian> = {
	alienOther: gaussian(1.4, 0.1 ** 2),
	alienSell: gaussian(6, 0.5 ** 2),
	eventGood: gaussian(1.4, 0.1 ** 2),
	eventBad: gaussian(1.05, 0.08 ** 2),
	normal: gaussian(1.15, 0.18 ** 2)
}

export function talentsForType(type: PersonType): Talents {
	switch (type) {
		case 'alien': return randomTalentsDistinct(distribution.alienOther, distribution.alienSell, distribution.alienOther)
		case 'christmasAngel': return randomTalentsDistinct(distribution.eventGood, distribution.eventBad, distribution.eventGood)
		case 'halloweenPumpkin': return randomTalentsDistinct(distribution.eventGood, distribution.eventBad, distribution.eventGood)
		default: return randomTalents(distribution.normal)
	}
}

/* DEBUG
for (const name of Object.keys(distribution)) {
	debugDistribution(name, distribution[name])
}

function debugDistribution(name: string, distribution: Gaussian): void {
	console.log('debugDistribution', name, distribution.mean, distribution.standardDeviation)
	if (distribution.mean > 0.6) {
		console.log('all negative', distribution.cdf(1) ** TALENTS.length)

		for (const x of [0, 0.2, 0.5]) {
			const prob = distribution.cdf(x)
			if (prob > 0) {
				console.log('probability', `<${x.toFixed(1)}`, prob)
			}
		}

		for (const x of [1, 1.2, 1.4, 1.6, 1.8, 2, 2.5]) {
			const prob = 1 - distribution.cdf(x)
			if (prob > 0) {
				console.log('probability', `>${x.toFixed(1)}`, prob)
			}
		}
	}

	for (const p of [0.001, 0.01, 0.1, 0.25, 0.5, 0.75, 0.9, 0.99, 0.999]) {
		console.log('percentile', p.toFixed(3), distribution.ppf(p))
	}

	console.log()
}
/**/
