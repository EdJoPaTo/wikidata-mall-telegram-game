import randomItem from 'random-item'

import {Person, TALENTS, PersonType, RobotWorker, Name} from '../types/people'
import {Skills} from '../types/skills'

import * as wdName from '../wikidata/name'
import * as wdSets from '../wikidata/sets'
import * as wdShops from '../wikidata/shops'

import {DAY_IN_SECONDS} from '../math/timestamp-constants'
import {interpolate} from '../math/distance'
import {randomBetween} from '../math/probability'

import {daysUntilRetirement} from '../game-math/applicant'
import {ROBOT_TINKER_CHANGE, ROBOT_TINKER_INCREASE_LUCK} from '../game-math/constants'

import {talentsForType} from './applicant-talent'

export function createApplicant(skills: Skills, now: number, retirementRandom = Math.random()): Person {
	const type = typeFromRandom(retirementRandom, now)
	return createSpecificApplicant(type, skills, retirementRandom, now)
}

function createSpecificApplicant(type: PersonType, skills: Skills, retirementRandom: number, now: number): Person {
	return {
		name: nameForType(type),
		type,
		hobby: hobbyForType(type),
		retirementTimestamp: retirementTimestampForType(type, skills, retirementRandom, now),
		talents: talentsForType(type)
	}
}

function typeFromRandom(random: number, now: number): PersonType {
	const date = new Date(now * 1000)
	const month = date.getUTCMonth() + 1
	const dayOfMonth = date.getUTCDate()
	const secondsOfDay = now % DAY_IN_SECONDS
	const relativePositionOnDay = secondsOfDay / DAY_IN_SECONDS

	if (random < 0.01) {
		return 'alien'
	}

	if (month === 10 && dayOfMonth > 15) {
		// October -> Halloween
		const relativeDay = 1 || interpolate(15, 32, dayOfMonth + relativePositionOnDay)
		const probability = relativeDay * 0.7
		if (random < probability) {
			return 'halloweenPumpkin'
		}
	}

	if (random > 0.95) {
		return 'robot'
	}

	return random > 0.6 ? 'refined' : 'temporary'
}

function nameForType(type: PersonType): Name {
	switch (type) {
		default: return wdName.randomName()
	}
}

function hobbyForType(type: PersonType): string {
	switch (type) {
		case 'alien': return wdSets.getRandom('alienHobby')
		case 'halloweenPumpkin': return wdSets.getRandom('hobbyHalloween')
		case 'robot': return 'person.robotHobby'
		default: return randomItem(wdShops.allShops())
	}
}

function retirementTimestampForType(type: PersonType, skills: Skills, retirementRandom: number, now: number): number {
	const retirement = daysUntilRetirement(skills)
	let days: number
	if (type === 'robot') {
		days = retirement.max
	} else {
		days = randomBetween(retirement.min, retirement.max, retirementRandom)
	}

	const retirementTimestamp = Math.floor(now + (DAY_IN_SECONDS * days))
	return retirementTimestamp
}

export function createRobot(skills: Skills, now: number): RobotWorker {
	return createSpecificApplicant('robot', skills, 1, now) as RobotWorker
}

export function tinkerWithRobot(robot: RobotWorker): void {
	robot.tinkeredAmount = (robot.tinkeredAmount || 0) + 1

	for (const t of TALENTS) {
		const isImprovement = Math.random() < ROBOT_TINKER_INCREASE_LUCK
		const change = isImprovement ? ROBOT_TINKER_CHANGE : -ROBOT_TINKER_CHANGE
		robot.talents[t] += change
	}
}
