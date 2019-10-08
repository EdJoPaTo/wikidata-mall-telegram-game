import {Shop} from '../types/shop'

/**
 * Returns the interval in seconds between two customers in a given shop
 */
export function customerInterval(attractionBonus: number): number {
	return 30 / attractionBonus
}

export function customerPerMinute(attractionBonus: number): number {
	return 60 / customerInterval(attractionBonus)
}

export function shopProductsEmptyTimestamps(shop: Shop, attractionCustomerBonus: number): readonly number[] {
	const interval = customerInterval(attractionCustomerBonus)

	const emptyTimestamps = shop.products.map(p =>
		p.itemTimestamp + (interval * p.itemsInStore)
	)

	return emptyTimestamps
}

export function lastTimeActive(shops: readonly Shop[]): number {
	const itemTimestamps = shops.flatMap(o => o.products.map(o => o.itemTimestamp))
	const openingTimestamps = shops.map(o => o.opening)
	return Math.max(
		...itemTimestamps,
		...openingTimestamps
	)
}
