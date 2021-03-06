import {UNISEX, FAMILY} from 'wikidata-person-names'
import randomItem from 'random-item'

import {Person, PersonType, PERSON_EVENT_TYPES} from '../types/people'
import {Skills} from '../types/skills'

import * as wdSets from '../wikidata/sets'
import * as wdShops from '../wikidata/shops'

import {DAY_IN_SECONDS} from '../math/timestamp-constants'
import {randomBetween} from '../math/probability'
import {relativePositionBetween} from '../math/distance'

import {daysUntilRetirement} from '../game-math/applicant'

import {talentsForType} from './applicant-talent'

export function createApplicant(skills: Skills, now: number, retirementRandom = Math.random()): Person {
	const type = typeFromRandom(retirementRandom, now)
	return createSpecificApplicant(type, skills, retirementRandom, now)
}

function createSpecificApplicant(type: PersonType, skills: Skills, retirementRandom: number, now: number): Person {
	const name = {
		given: randomItem(UNISEX),
		family: randomItem(FAMILY)
	}

	return {
		name,
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

	if (month === 10 && dayOfMonth > 24) {
		// October -> Halloween
		const relativeDay = relativePositionBetween(24, 32, dayOfMonth + relativePositionOnDay)
		const probability = relativeDay * 0.7
		if (random < probability) {
			return 'halloweenPumpkin'
		}
	} else if (month === 12 && dayOfMonth <= 26) {
		// December -> Christmas
		const relativeDay = Math.min(1, relativePositionBetween(1, 24, dayOfMonth + relativePositionOnDay))
		const probability = relativeDay * 0.5
		if (random < probability) {
			return 'christmasAngel'
		}
	}

	if (random > 0.9) {
		return 'robot'
	}

	return 'refined'
}

function hobbyForType(type: PersonType): string {
	switch (type) {
		case 'alien': return wdSets.getRandom('alienHobby')
		case 'christmasAngel': return wdSets.getRandom('hobbyChristmas')
		case 'halloweenPumpkin': return wdSets.getRandom('hobbyHalloween')
		default: return randomItem(wdShops.allShops())
	}
}

function retirementTimestampForType(type: PersonType, skills: Skills, retirementRandom: number, now: number): number {
	const retirement = daysUntilRetirement(skills)
	const days = randomBetween(retirement.min, retirement.max,
		PERSON_EVENT_TYPES.includes(type) ? 1 - retirementRandom : retirementRandom
	)

	const retirementTimestamp = Math.floor(now + (DAY_IN_SECONDS * days))
	return retirementTimestamp
}
