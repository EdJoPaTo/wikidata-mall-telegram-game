import gaussian, {Gaussian} from 'gaussian'
import randomItem from 'random-item'

import {Person, Talents, TALENTS, PersonType} from '../types/people'
import {Skills} from '../types/skills'

import * as wdName from '../wikidata/name'
import * as wdSets from '../wikidata/sets'
import * as wdShops from '../wikidata/shops'

import {DAY_IN_SECONDS} from '../math/timestamp-constants'
import {randomBetween} from '../math/probability'

import {daysUntilRetirement} from '../game-math/applicant'

export function createApplicant(skills: Skills, now: number): Person {
	const name = wdName.randomName()

	const retirementRandom = Math.random()
	const type = typeFromRandom(retirementRandom)

	const retirement = daysUntilRetirement(skills)
	const retirementDays = randomBetween(retirement.min, retirement.max, retirementRandom)
	const retirementTimestamp = Math.floor(now + (DAY_IN_SECONDS * retirementDays))

	return {
		name,
		type,
		hobby: hobbyForType(type),
		retirementTimestamp,
		talents: randomTalents(talentDistributionForType(type))
	}
}

function typeFromRandom(random: number): PersonType {
	if (random < 0.01) {
		return 'alien'
	}

	if (random > 0.95) {
		return 'robot'
	}

	return random > 0.6 ? 'refined' : 'temporary'
}

function hobbyForType(type: PersonType): string {
	if (type === 'robot') {
		return 'person.robotHobby'
	}

	if (type === 'alien') {
		return wdSets.getRandom('alienHobby')
	}

	return randomItem(wdShops.allShops())
}

function talentDistributionForType(type: PersonType): Gaussian {
	switch (type) {
		case 'robot': return distributionRobot
		case 'refined': return distributionRefined
		case 'alien': return distributionAlien
		default: return distributionTemporary
	}
}

const MINIMAL_TALENT = 0.001
// Gaussian takes sigma^2, everyone else takes sigma (standardDeviation)
// -> use sigma and square it on startup
const distributionRefined = gaussian(1.25, 0.2 ** 2)
const distributionTemporary = gaussian(1.1, 0.15 ** 2)
const distributionRobot = gaussian(1.25, 0.01 ** 2)
const distributionAlien = gaussian(2.5, 0.5 ** 2)
/* DEBUG
debugDistribution('before', gaussian(1.1, 0.06))
debugDistribution('refined', distributionRefined)
debugDistribution('temporary', distributionTemporary)
debugDistribution('robot', distributionRobot)
debugDistribution('alien', distributionAlien)
function debugDistribution(name: string, distribution: Gaussian): void {
	console.log('debugDistribution', name, distribution.mean, distribution.standardDeviation)
	console.log('probability', '<0  :', distribution.cdf(MINIMAL_TALENT))
	console.log('probability', '<0.2:', distribution.cdf(0.2))
	console.log('probability', '>1  :', 1 - distribution.cdf(1))
	console.log('probability', '>1.2:', 1 - distribution.cdf(1.2))
	console.log('probability', '>1.4:', 1 - distribution.cdf(1.4))
	console.log('probability', '>1.6:', 1 - distribution.cdf(1.6))
	console.log('probability', '>1.8:', 1 - distribution.cdf(1.8))
	console.log('probability', '>2  :', 1 - distribution.cdf(2))
	console.log('probability', '>2.5:', 1 - distribution.cdf(2.5))
	console.log('percentile', '0.001', distribution.ppf(0.001))
	console.log('percentile', '0.010', distribution.ppf(0.01))
	console.log('percentile', '0.100', distribution.ppf(0.1))
	console.log('percentile', '0.250', distribution.ppf(0.25))
	console.log('percentile', '0.500', distribution.ppf(0.5))
	console.log('percentile', '0.750', distribution.ppf(0.75))
	console.log('percentile', '0.900', distribution.ppf(0.9))
	console.log('percentile', '0.990', distribution.ppf(0.99))
	console.log('percentile', '0.999', distribution.ppf(0.999))
	console.log('all negative', distribution.cdf(1) ** TALENTS.length)
	console.log()
}
/**/

function randomTalents(distribution: Gaussian): Talents {
	const talents: any = {}
	for (const t of TALENTS) {
		const factor = distribution.ppf(Math.random())
		talents[t] = Math.max(MINIMAL_TALENT, factor)
	}

	return talents
}
