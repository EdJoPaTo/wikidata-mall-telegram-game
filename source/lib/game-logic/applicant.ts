import gaussian, {Gaussian} from 'gaussian'
import randomItem from 'random-item'

import {Person, Talents, TALENTS, PersonType, RobotWorker} from '../types/people'
import {Skills} from '../types/skills'

import * as wdName from '../wikidata/name'
import * as wdSets from '../wikidata/sets'
import * as wdShops from '../wikidata/shops'

import {DAY_IN_SECONDS} from '../math/timestamp-constants'
import {randomBetween} from '../math/probability'

import {daysUntilRetirement} from '../game-math/applicant'
import {ROBOT_TINKER_CHANGE, ROBOT_TINKER_INCREASE_LUCK} from '../game-math/constants'

export function createApplicant(skills: Skills, now: number, retirementRandom = Math.random()): Person {
	const name = wdName.randomName()
	const type = typeFromRandom(retirementRandom)

	const retirement = daysUntilRetirement(skills)
	const retirementDays = randomBetween(retirement.min, retirement.max, retirementRandom)
	const retirementTimestamp = Math.floor(now + (DAY_IN_SECONDS * retirementDays))

	return {
		name,
		type,
		hobby: hobbyForType(type),
		retirementTimestamp,
		talents: talentsForType(type)
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

function talentsForType(type: PersonType): Talents {
	switch (type) {
		case 'robot': return randomTalents(distribution.robot)
		case 'refined': return randomTalents(distribution.refined)
		case 'alien': return {
			purchasing: distribution.alienOther.ppf(Math.random()),
			selling: distribution.alienSell.ppf(Math.random()),
			storage: distribution.alienOther.ppf(Math.random())
		}
		default: return randomTalents(distribution.temporary)
	}
}

const MINIMAL_TALENT = 0.001
// Gaussian takes sigma^2, everyone else takes sigma (standardDeviation)
// -> use sigma and square it on startup
const distribution: Record<string, Gaussian> = {
	refined: gaussian(1.23, 0.18 ** 2),
	temporary: gaussian(1.08, 0.13 ** 2),
	robot: gaussian(1.28, 0.005 ** 2),
	alienSell: gaussian(6, 0.5 ** 2),
	alienOther: gaussian(1.4, 0.1 ** 2)
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

function randomTalents(distribution: Gaussian): Talents {
	const talents: any = {}
	for (const t of TALENTS) {
		const factor = distribution.ppf(Math.random())
		talents[t] = Math.max(MINIMAL_TALENT, factor)
	}

	return talents
}

export function tinkerWithRobot(robot: RobotWorker): void {
	robot.tinkeredAmount = (robot.tinkeredAmount || 0) + 1

	for (const t of TALENTS) {
		const isImprovement = Math.random() < ROBOT_TINKER_INCREASE_LUCK
		const change = isImprovement ? ROBOT_TINKER_CHANGE : -ROBOT_TINKER_CHANGE
		robot.talents[t] += change
	}
}
