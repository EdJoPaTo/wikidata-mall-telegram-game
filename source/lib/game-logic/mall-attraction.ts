import {DAY_IN_SECONDS} from '../math/timestamp-constants'
import {randomBetween} from '../math/probability'

import {Attraction} from '../types/mall'

import {daysUntilAttractionDisaster} from '../game-math/mall'

export async function createAttraction(qNumber: string, now: number): Promise<Attraction> {
	const disaster = daysUntilAttractionDisaster()
	const disasterDays = randomBetween(disaster.min, disaster.max)
	const disasterTimestamp = Math.floor(now + (DAY_IN_SECONDS * disasterDays))

	return {
		item: qNumber,
		destruction: disasterTimestamp
	}
}
