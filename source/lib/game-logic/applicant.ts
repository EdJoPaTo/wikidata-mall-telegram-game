import randomItem from 'random-item'

import {Person, TALENTS, PersonType, RobotWorker} from '../types/people'
import {Skills} from '../types/skills'

import * as wdName from '../wikidata/name'
import * as wdSets from '../wikidata/sets'
import * as wdShops from '../wikidata/shops'

import {DAY_IN_SECONDS} from '../math/timestamp-constants'
import {randomBetween} from '../math/probability'

import {daysUntilRetirement} from '../game-math/applicant'
import {ROBOT_TINKER_CHANGE, ROBOT_TINKER_INCREASE_LUCK} from '../game-math/constants'

import {talentsForType} from './applicant-talent'

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

export function createRobot(skills: Skills, now: number): RobotWorker {
	const retirement = daysUntilRetirement(skills)
	const retirementTimestamp = Math.floor(now + (DAY_IN_SECONDS * retirement.max))

	return {
		name: wdName.randomName(),
		type: 'robot',
		hobby: hobbyForType('robot'),
		retirementTimestamp,
		talents: talentsForType('robot')
	}
}

export function tinkerWithRobot(robot: RobotWorker): void {
	robot.tinkeredAmount = (robot.tinkeredAmount || 0) + 1

	for (const t of TALENTS) {
		const isImprovement = Math.random() < ROBOT_TINKER_INCREASE_LUCK
		const change = isImprovement ? ROBOT_TINKER_CHANGE : -ROBOT_TINKER_CHANGE
		robot.talents[t] += change
	}
}
