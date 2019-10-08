import {randomBetween} from '../math/probability'

import {Attraction} from '../types/mall'

import * as wdAttraction from '../wikidata/attractions'
import * as wdSets from '../wikidata/sets'

import {secondsUntilAttractionDisaster} from '../game-math/mall'

export function createAttraction(qNumber: string, now: number): Attraction {
	const disaster = secondsUntilAttractionDisaster()
	const disasterSeconds = randomBetween(disaster.min, disaster.max)
	const disasterTimestamp = Math.floor(now + disasterSeconds)

	return {
		item: qNumber,
		opening: now,
		disasterKind: wdSets.getRandom('disaster'),
		disasterTimestamp
	}
}

export function getAttractionHeight(attraction: Attraction | undefined): number | undefined {
	const height = attraction && wdAttraction.getHeight(attraction.item)
	return height
}
