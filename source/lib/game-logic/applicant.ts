import gaussian, {Gaussian} from 'gaussian'
import randomItem from 'random-item'

import {Person, Talents, TALENTS, PersonType} from '../types/people'
import {Skills} from '../types/skills'

import * as wdName from '../wikidata/name'
import * as wdShops from '../wikidata/shops'

import {DAY_IN_SECONDS} from '../math/timestamp-constants'
import {randomBetween} from '../math/probability'

import {daysUntilRetirement} from '../game-math/applicant'

export function createApplicant(skills: Skills, now: number): Person {
	const name = wdName.randomName()

	const retirementRandom = Math.random()
	const type: PersonType = retirementRandom > 0.6 ? 'refined' : 'temporary'
	const talentDistribution = type === 'refined' ? distributionRefined : distributionTemporary

	const retirement = daysUntilRetirement(skills)
	const retirementDays = randomBetween(retirement.min, retirement.max, retirementRandom)
	const retirementTimestamp = Math.floor(now + (DAY_IN_SECONDS * retirementDays))

	return {
		name,
		type,
		hobby: randomItem(wdShops.allShops()),
		retirementTimestamp,
		talents: randomTalents(talentDistribution)
	}
}

const MINIMAL_TALENT = 0.001
const distributionRefined = gaussian(1.25, 0.04)
const distributionTemporary = gaussian(1.1, 0.01)
/* DEBUG
debugDistribution('before', gaussian(1.1, 0.06))
debugDistribution('refined', distributionRefined)
debugDistribution('temporary', distributionTemporary)
function debugDistribution(name: string, distribution: Gaussian): void {

	console.log('debugDistribution', name, distribution.mean, distribution.variance)
	console.log('kinda min', distribution.ppf(0.0005))
	console.log('kinda max', distribution.ppf(0.9995))
	console.log('probability', '<0  :', distribution.cdf(MINIMAL_TALENT))
	console.log('probability', '<0.2:', distribution.cdf(0.2))
	console.log('probability', '>1  :', 1 - distribution.cdf(1))
	console.log('probability', '>1.2:', 1 - distribution.cdf(1.2))
	console.log('probability', '>1.4:', 1 - distribution.cdf(1.4))
	console.log('probability', '>1.6:', 1 - distribution.cdf(1.6))
	console.log('probability', '>1.8:', 1 - distribution.cdf(1.8))
	console.log('probability', '>2  :', 1 - distribution.cdf(2))
	console.log('probability', '>2.5:', 1 - distribution.cdf(2.5))
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
