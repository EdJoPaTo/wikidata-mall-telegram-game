import stringify from 'json-stable-stringify'

import {randomUniqueEntries} from '../js-helper/array'

import {Construction} from '../types/shop'

import {HOUR_IN_SECONDS} from '../math/timestamp-constants'

import * as dataShopConstruction from '../data/shop-construction'
import * as wdShops from '../wikidata/shops'

const CHANGE_INTERVAL_IN_SECONDS = HOUR_IN_SECONDS * 3

export async function getCurrentConstructions(now: number): Promise<Construction> {
	let data = await dataShopConstruction.get()
	const before = stringify(data)

	const lastChange = lastConstructionChange(now)
	if (!data || data.timestamp < lastChange) {
		data = {
			timestamp: lastChange,
			possibleShops: generatePossibleShops(3)
		}
	}

	const after = stringify(data)
	if (before !== after) {
		dataShopConstruction.set(data)
	}

	return data
}

function generatePossibleShops(amount: number): string[] {
	const allShops = wdShops.allShops()
	return randomUniqueEntries(allShops, amount)
}

export function lastConstructionChange(now: number): number {
	return Math.floor(now / CHANGE_INTERVAL_IN_SECONDS) * CHANGE_INTERVAL_IN_SECONDS
}

export function nextConstructionChange(now: number): number {
	return Math.ceil(now / CHANGE_INTERVAL_IN_SECONDS) * CHANGE_INTERVAL_IN_SECONDS
}
