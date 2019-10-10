import stringify from 'json-stable-stringify'

import {randomUniqueEntries} from '../js-helper/array'

import {Construction} from '../types/shop'

import {HOUR_IN_SECONDS} from '../math/timestamp-constants'

import * as dataShopConstruction from '../data/shop-construction'
import * as wdShops from '../wikidata/shops'

export const CHANGE_INTERVAL_IN_SECONDS = HOUR_IN_SECONDS
export const ENTRY_AMOUNT = 5

export async function getCurrentConstructions(now: number): Promise<Construction> {
	let data = await dataShopConstruction.get()
	const before = stringify(data)

	if (!data) {
		data = {
			timestamp: 0,
			possibleShops: []
		}
	}

	removeOldEntries(data, now)
	const allShops = wdShops.allShops()
	fillMissingConstructions(data, allShops)

	const after = stringify(data)
	if (before !== after) {
		dataShopConstruction.set(data)
	}

	return data
}

export function removeOldEntries(data: Construction, now: number): void {
	const removeAmount = Math.floor((now - data.timestamp) / CHANGE_INTERVAL_IN_SECONDS)
	data.possibleShops = data.possibleShops.slice(removeAmount)
	data.timestamp = lastConstructionChange(now)
}

export function fillMissingConstructions(data: Construction, allPossibleShops: readonly string[]): void {
	const missing = ENTRY_AMOUNT - data.possibleShops.length
	data.possibleShops.push(
		...randomUniqueEntries(allPossibleShops, missing, data.possibleShops)
	)
}

export function lastConstructionChange(now: number): number {
	return Math.floor(now / CHANGE_INTERVAL_IN_SECONDS) * CHANGE_INTERVAL_IN_SECONDS
}

export function nextConstructionChange(now: number): number {
	return Math.ceil(now / CHANGE_INTERVAL_IN_SECONDS) * CHANGE_INTERVAL_IN_SECONDS
}
