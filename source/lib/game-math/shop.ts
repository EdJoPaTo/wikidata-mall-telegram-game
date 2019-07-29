import {Shop} from '../types/shop'

import {distanceDiversity} from '../math/distance'

import {personalBonus} from './personal'
import {productBasePrice} from './product'

export function buildCost(existingShops: number): number {
	return 10 ** (existingShops + 2)
}

export function productCost(existingShops: number, existingProducts: number): number {
	return buildCost(existingShops - 1) * existingProducts
}

export function storageCapacity(shop: Shop): number {
	const personal = personalBonus(shop, 'storage')
	return Math.round(100 * personal)
}

export function shopDiversificationFactor(shop: Shop): number {
	const basePrices = shop.products
		.map(p => productBasePrice(p))

	const diversity = distanceDiversity(basePrices)

	return diversity * 2
}

export function customerInterval(shop: Shop): number {
	const diversityFactor = shopDiversificationFactor(shop)

	const factor = diversityFactor
	return 30 / factor
}