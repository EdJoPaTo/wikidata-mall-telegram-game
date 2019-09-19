import {Skills} from '../types/skills'
import {RefinedWorker, RefinedState, Person} from '../types/people'

import {currentLevel} from './skill'

export function applicantSeats(skills: Skills): number {
	const level = currentLevel(skills, 'applicantSeats')
	return 1 + level
}

export function secondsBetweenApplicants(skills: Skills): number {
	const applicantSpeedLevel = currentLevel(skills, 'applicantSpeed')
	return 300 / (applicantSpeedLevel + 1)
}

export function daysUntilRetirement(skills: Skills): {min: number; max: number} {
	const healthCareLevel = currentLevel(skills, 'healthCare')
	const min = 0
	const max = 6 + healthCareLevel
	return {min, max}
}

export function getRefinedState(person: RefinedWorker, now: number): RefinedState {
	if (!person.graduation) {
		return 'toddler'
	}

	return person.graduation > now ? 'student' : 'finished'
}

export function canBeEmployed(person: Person, now: number): boolean {
	return person.type !== 'refined' || getRefinedState(person, now) === 'finished'
}

export function minutesUntilGraduation(): {min: number; max: number} {
	return {
		min: 2,
		max: 15
	}
}
