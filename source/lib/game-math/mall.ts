import {HOUR_IN_SECONDS, DAY_IN_SECONDS} from '../math/timestamp-constants'

import {Mall} from '../types/mall'

import {MALL_MIN_PEOPLE, MALL_MAX_PEOPLE} from './constants'

export function mallMemberAmountWithinLimits(mall: Mall): boolean {
	const memberAmount = mall.member.length
	return memberAmount >= MALL_MIN_PEOPLE && memberAmount <= MALL_MAX_PEOPLE
}

export function productionReward(productionParticipants: number): number {
	return productionParticipants * 1000
}

export function secondsUntilAttractionDisaster(): {min: number; max: number} {
	return {min: 18 * HOUR_IN_SECONDS, max: 2 * DAY_IN_SECONDS}
}

export function attractionCustomerBonus(height: number | undefined): number {
	if (height === undefined) {
		return 1
	}

	return 1 + (0.01 * height)
}

export function attractionCost(height: number): number {
	return 2000 * height
}
