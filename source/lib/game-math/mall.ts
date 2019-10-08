import {Mall} from '../types/mall'

import {MALL_MIN_PEOPLE, MALL_MAX_PEOPLE} from './constants'

export function mallMemberAmountWithinLimits(mall: Mall): boolean {
	const memberAmount = mall.member.length
	return memberAmount >= MALL_MIN_PEOPLE && memberAmount <= MALL_MAX_PEOPLE
}

export function daysUntilAttractionDisaster(): {min: number; max: number} {
	return {min: 2, max: 5}
}

export function attractionCustomerBonus(height: number | undefined): number {
	if (height === undefined) {
		return 1
	}

	return 1 + (0.01 * height)
}

export function attractionCost(height: number): number {
	return 100 * height
}
