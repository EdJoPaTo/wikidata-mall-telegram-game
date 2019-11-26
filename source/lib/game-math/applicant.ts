import {Gaussian} from 'gaussian'

import {Skills} from '../types/skills'
import {Talents} from '../types/people'

import {currentLevel} from './skill'
import {MINIMAL_TALENT} from './constants'

export function applicantSeats(skills: Skills): number {
	const level = currentLevel(skills, 'applicantSeats')
	return 1 + level
}

export function secondsBetweenApplicants(skills: Skills): number {
	const applicantSpeedLevel = currentLevel(skills, 'applicantSpeed')
	return 480 / (applicantSpeedLevel + 1)
}

export function daysUntilRetirement(skills: Skills): {min: number; max: number} {
	const healthCareLevel = currentLevel(skills, 'healthCare')
	const min = 0
	const max = 6 + healthCareLevel
	return {min, max}
}

export function randomTalents(distribution: Gaussian, randomFunction: () => number = Math.random): Talents {
	return randomTalentsDistinct(distribution, distribution, distribution, randomFunction)
}

export function randomTalentsDistinct(purchaseDistribution: Gaussian, sellingDistribution: Gaussian, storageDistribution: Gaussian, randomFunction: () => number = Math.random): Talents {
	return {
		purchasing: randomTalent(purchaseDistribution, randomFunction()),
		selling: randomTalent(sellingDistribution, randomFunction()),
		storage: randomTalent(storageDistribution, randomFunction())
	}
}

export function randomTalent(distribution: Gaussian, x: number = Math.random()): number {
	const result = distribution.ppf(x)
	return Math.max(MINIMAL_TALENT, result)
}
