import {DAY_IN_SECONDS} from '../math/timestamp-constants'
import {randomBetween} from '../math/probability'

import {Attraction} from '../types/mall'

import * as wdAttraction from '../wikidata/attractions'

import {daysUntilAttractionDisaster} from '../game-math/mall'

export function createAttraction(qNumber: string, now: number): Attraction {
	const disaster = daysUntilAttractionDisaster()
	const disasterDays = randomBetween(disaster.min, disaster.max)
	const disasterTimestamp = Math.floor(now + (DAY_IN_SECONDS * disasterDays))

	return {
		item: qNumber,
		opening: now,
		disasterTimestamp
	}
}

export function getAttractionHeight(attraction: Attraction | undefined): number | undefined {
	const height = attraction && wdAttraction.getHeight(attraction.item)
	return height
}
