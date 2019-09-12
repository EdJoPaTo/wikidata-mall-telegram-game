import stringify from 'json-stable-stringify'

import {randomUniqueEntries} from '../js-helper/array'

import {Construction} from '../types/shop'

import {HOUR_IN_SECONDS} from '../math/timestamp-constants'

import * as dataShopConstruction from '../data/shop-construction'
import * as wdShops from '../wikidata/shops'

export async function getCurrentConstructions(now: number): Promise<Construction> {
	let data = await dataShopConstruction.get()
	const before = stringify(data)

	const nowHour = Math.floor(now / HOUR_IN_SECONDS) * HOUR_IN_SECONDS
	if (!data || data.timestamp !== nowHour) {
		data = {
			timestamp: nowHour,
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
