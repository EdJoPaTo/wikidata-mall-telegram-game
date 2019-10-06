import {Product, Shop} from '../types/shop'
import {Skills} from '../types/skills'

import {PURCHASING_FACTOR} from './constants'

import {currentLevel} from './skill'
import {personalBonus} from './personal'

export function purchasingCost(shop: Shop, product: Product, skills: Skills): number {
	const personal = personalBonus(shop, 'purchasing')
	const scissorsLevel = currentLevel(skills, 'metalScissors')
	const scissorsBonus = purchasingCostScissorsBonus(scissorsLevel)
	const bonus = personal * scissorsBonus
	return productBasePrice(product, skills) * (PURCHASING_FACTOR / bonus)
}

export function sellingCost(shop: Shop, product: Product, skills: Skills): number {
	const personal = personalBonus(shop, 'selling')
	const packagingLevel = currentLevel(skills, 'packaging')
	const packagingBonus = sellingCostPackagingBonus(packagingLevel)
	return productBasePrice(product, skills) * personal * packagingBonus
}

export function productBasePrice(product: Product, skills: Skills): number {
	const base = Number(product.id[1]) * 2
	const collectorFactor = productBasePriceCollectorFactor(skills)
	return base * collectorFactor
}

export function productBasePriceCollectorFactor(skills: Skills): number {
	const collectorLevel = currentLevel(skills, 'collector')
	return 1 + (collectorLevel * 0.1)
}

export function purchasingCostScissorsBonus(scissorsLevel: number): number {
	return 1 + (scissorsLevel * 0.05)
}

export function sellingCostPackagingBonus(packagingLevel: number): number {
	return 1 + (packagingLevel * 0.05)
}
