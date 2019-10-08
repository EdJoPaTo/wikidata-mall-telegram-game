import {Session, Persist} from '../types'
import {Shop, Product} from '../types/shop'

import {attractionCustomerBonus} from '../game-math/mall'
import {customerInterval} from '../game-math/shop-time'
import {sellingCost} from '../game-math/product'

import {getAttractionHeight} from '../game-logic/mall-attraction'

export function incomeLoop(session: Session, persist: Persist, now: number): void {
	for (const shop of persist.shops) {
		for (const product of shop.products) {
			incomeProduct(session, persist, shop, product, now)
		}
	}
}

function incomeProduct(session: Session, persist: Persist, shop: Shop, product: Product, now: number): void {
	const secondsAgo = now - product.itemTimestamp

	const attractionHeight = getAttractionHeight(persist.mall && persist.mall.attraction)
	const attractionBonus = attractionCustomerBonus(attractionHeight)
	const sellInterval = customerInterval(attractionBonus)

	const canSell = Math.floor(secondsAgo / sellInterval)
	const sellItems = Math.min(canSell, product.itemsInStore)
	const pricePerItem = sellingCost(shop, product, persist.skills)

	product.itemsInStore -= sellItems
	product.itemTimestamp += sellItems * sellInterval
	session.money += pricePerItem * sellItems
}
