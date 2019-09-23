import {Mall} from '../types/mall'

import {MALL_MIN_PEOPLE, MALL_MAX_PEOPLE} from './constants'

export function mallMemberAmountWithinLimits(mall: Mall): boolean {
	const memberAmount = mall.member.length
	return memberAmount >= MALL_MIN_PEOPLE && memberAmount <= MALL_MAX_PEOPLE
}
