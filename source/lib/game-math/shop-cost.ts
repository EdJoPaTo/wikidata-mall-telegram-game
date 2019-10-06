import {Shop, Product} from '../types/shop'
import {Skills} from '../types/skills'

import {currentLevel} from './skill'
import {purchasingCost, sellingCost} from './product'

import {customerPerMinute} from './shop-time'
import {storageCapacity} from './shop-capacity'

export function costForAdditionalShop(existingShops: number): number {
	return 5 ** (existingShops + 3)
}

export function addProductToShopCost(indexOfShop: number, existingProducts: number): number {
	return costForAdditionalShop(indexOfShop) * (existingProducts / 2.5)
}

export function totalCostOfShopWithProducts(shopsBefore: number, productsToAdd: number): number {
	const buildCost = costForAdditionalShop(shopsBefore)
	let totalCost = buildCost
	for (let i = 0; i < productsToAdd; i++) {
		totalCost += addProductToShopCost(shopsBefore, i)
	}

	return totalCost
}

export function moneyForShopClosure(existingShops: number, productsInShop: number, shopIsBuildableUnderCurrentConditions: boolean): number {
	const lastBuildCost = costForAdditionalShop(existingShops - 1)
	const factor = shopIsBuildableUnderCurrentConditions ? 0.5 : 1
	const productsInShopBonus = 1 + (Math.max(0, productsInShop - 1) * 0.4)
	return Math.ceil(factor * lastBuildCost * productsInShopBonus)
}

export function buyAllCostFactor(skills: Skills, shopsToBuyIn: number): number {
	const magnetismLevel = currentLevel(skills, 'magnetism')
	// This would require someone to have magnetism level 16 for factor 1 -> Fib 16 alone is 1597 which equals 66 days
	const reductionByLevel = magnetismLevel * 0.04
	const base = shopsToBuyIn > 1 ? 3 : 1.68
	return base - reductionByLevel
}

export function buyAllCost(shops: readonly Shop[], skills: Skills): number {
	const factor = buyAllCostFactor(skills, shops.length)
	const cost = shops
		.map(o => shopTotalPurchaseCost(o, skills))
		.reduce((a, b) => a + b, 0)

	return cost * factor
}

export function shopTotalPurchaseCost(shop: Shop, skills: Skills): number {
	const storage = storageCapacity(shop, skills)
	return shop.products
		.map(product => {
			const oneCost = purchasingCost(shop, product, skills)
			const amount = storage - product.itemsInStore
			return oneCost * amount
		})
		.reduce((a, b) => a + b, 0)
}

export function returnOnInvestment(shops: readonly Shop[], skills: Skills, purchaseFactor = 1): number {
	const relevantShops = shops.filter(o => o.products.length > 0)

	const cost = relevantShops
		.map(shop => purchasingCost(shop, shop.products[0], skills))
		.reduce((a, b) => a + b, 0)

	const income = relevantShops
		.map(shop => sellingCost(shop, shop.products[0], skills))
		.reduce((a, b) => a + b, 0)

	const costWithFactor = cost * purchaseFactor
	return income / costWithFactor
}

export function sellPerMinute(shop: Shop, skills: Skills, productFilter: (product: Product) => boolean): number {
	const itemsPerMinute = customerPerMinute()
	return shop.products
		.filter(productFilter)
		.map(o => sellingCost(shop, o, skills) * itemsPerMinute)
		.reduce((a, b) => a + b, 0)
}

export function magnetEnabled(shops: readonly Shop[], skills: Skills, currentMoney: number): boolean {
	const magnetismLevel = currentLevel(skills, 'magnetism')
	const cost = buyAllCost(shops, skills)
	const factor = buyAllCostFactor(skills, shops.length)
	const magnetROI = returnOnInvestment(shops, skills, factor)
	return magnetismLevel > 0 && cost < currentMoney && cost > 1 && magnetROI > 1
}
