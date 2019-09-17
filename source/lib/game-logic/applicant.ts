import gaussian from 'gaussian'
import randomItem from 'random-item'

import {Person, Talents, TALENTS} from '../types/people'
import {Skills} from '../types/skills'

import * as wdName from '../wikidata/name'
import * as wdShops from '../wikidata/shops'

import {DAY_IN_SECONDS} from '../math/timestamp-constants'
import {randomBetween} from '../math/probability'

import {daysUntilRetirement} from '../game-math/applicant'

export function createApplicant(skills: Skills, now: number): Person {
	const name = wdName.randomName()

	const retirement = daysUntilRetirement(skills)
	const retirementDays = randomBetween(retirement.min, retirement.max)
	const retirementTimestamp = Math.floor(now + (DAY_IN_SECONDS * retirementDays))

	return {
		name,
		hobby: randomItem(wdShops.allShops()),
		retirementTimestamp,
		talents: randomTalents()
	}
}

const MINIMAL_TALENT = 0.001
const talentDistribution = gaussian(1.1, 0.06)
/* DEBUG
console.log('talentDistribution', talentDistribution.mean, talentDistribution.variance)
console.log('talentDistribution probability', '<0  :', talentDistribution.cdf(MINIMAL_TALENT))
console.log('talentDistribution probability', '<0.2:', talentDistribution.cdf(0.2))
console.log('talentDistribution probability', '>1  :', 1 - talentDistribution.cdf(1))
console.log('talentDistribution probability', '>1.2:', 1 - talentDistribution.cdf(1.2))
console.log('talentDistribution probability', '>1.5:', 1 - talentDistribution.cdf(1.5))
console.log('talentDistribution probability', '>1.8:', 1 - talentDistribution.cdf(1.8))
console.log('talentDistribution probability', '>2  :', 1 - talentDistribution.cdf(2))
console.log('talentDistribution probability', '>2.5:', 1 - talentDistribution.cdf(2.5))
console.log('talentDistribution all negative', talentDistribution.cdf(1) ** TALENTS.length)
/**/

function randomTalents(): Talents {
	const talents: any = {}
	for (const t of TALENTS) {
		const factor = talentDistribution.ppf(Math.random())
		talents[t] = Math.max(MINIMAL_TALENT, factor)
	}

	return talents
}
