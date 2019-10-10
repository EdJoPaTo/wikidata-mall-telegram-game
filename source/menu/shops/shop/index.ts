import TelegrafInlineMenu from 'telegraf-inline-menu'
import WikidataEntityReader from 'wikidata-entity-reader'

import {Mall} from '../../../lib/types/mall'
import {Session, Persist} from '../../../lib/types'
import {Shop, Product} from '../../../lib/types/shop'
import {Skills} from '../../../lib/types/skills'
import {TALENTS} from '../../../lib/types/people'

import {randomUnusedEntry} from '../../../lib/js-helper/array'

import {addProductToShopCost, buyAllCost, buyAllCostFactor, magnetEnabled} from '../../../lib/game-math/shop-cost'
import {allEmployees} from '../../../lib/game-math/personal'
import {attractionCustomerBonus} from '../../../lib/game-math/mall'
import {currentLevel} from '../../../lib/game-math/skill'
import {customerInterval} from '../../../lib/game-math/shop-time'
import {storageCapacity, storageCapactiyPressBonus, shopProductsPossible} from '../../../lib/game-math/shop-capacity'

import * as wdShop from '../../../lib/wikidata/shops'

import {getAttractionHeight} from '../../../lib/game-logic/mall-attraction'

import {buttonText, menuPhoto} from '../../../lib/interface/menu'
import {emojis} from '../../../lib/interface/emojis'
import {formatFloat} from '../../../lib/interface/format-number'
import {incomePart} from '../../../lib/interface/shop'
import {infoHeader, labeledInt, moneyCostPart} from '../../../lib/interface/formatted-strings'
import {percentBonusString} from '../../../lib/interface/format-percent'
import {personInShopLine} from '../../../lib/interface/person'

import {createHelpMenu, helpButtonText} from '../../help'

import closureMenu from './shop-closure'
import employeeMenu from './employees'
import productMenu from './product'

function fromCtx(ctx: any): {shop: Shop; indexOfShop: number} {
	const persist = ctx.persist as Persist
	const shopType = ctx.match[1]
	const indexOfShop = persist.shops.map(o => o.id).indexOf(shopType)
	const shop = persist.shops[indexOfShop]
	return {shop, indexOfShop}
}

function canAddProductTechnically(shop: Shop, skills: Skills): boolean {
	const logisticsLevel = currentLevel(skills, 'logistics')
	const possibleProducts = shopProductsPossible(logisticsLevel)

	const currentProductsAmount = shop.products.length
	if (currentProductsAmount >= possibleProducts) {
		return false
	}

	const allAvailableProductsForShop = (wdShop.products(shop.id) || []).length
	const productsAvailable = allAvailableProductsForShop - currentProductsAmount
	if (productsAvailable <= 0) {
		return false
	}

	return true
}

function storageCapacityPart(ctx: any, shop: Shop, skills: Skills, showExplanation: boolean): string {
	let text = ''
	text += emojis.storage
	text += labeledInt(ctx.wd.r('product.storageCapacity'), storageCapacity(shop, skills))
	if (showExplanation && shop.personal.storage) {
		text += '  '
		text += emojis.person
		text += personInShopLine(shop, 'storage')
		text += '\n'
	}

	const pressLevel = currentLevel(skills, 'machinePress')
	const pressBonus = storageCapactiyPressBonus(pressLevel)
	if (showExplanation && pressBonus !== 1) {
		text += '  '
		text += emojis.skill
		text += percentBonusString(pressBonus)
		text += ' '
		text += ctx.wd.r('skill.machinePress').label()
		text += ' ('
		text += pressLevel
		text += ')'
		text += '\n'
	}

	text += '\n'
	return text
}

function productsPart(ctx: any, shop: Shop, skills: Skills, showExplanation: boolean): string {
	if (shop.products.length === 0) {
		return ''
	}

	const logisticsLevel = currentLevel(skills, 'logistics')
	const productsPossible = shopProductsPossible(logisticsLevel)
	const allAvailableProductsForShop = (wdShop.products(shop.id) || []).length

	let text = ''
	text += '*'
	text += ctx.wd.r('other.assortment').label()
	text += '*'
	text += ' ('
	text += shop.products.length
	text += ' / '
	text += Math.min(productsPossible, allAvailableProductsForShop)
	text += ')'
	text += '\n'

	if (showExplanation && logisticsLevel > 0) {
		text += '  '
		text += emojis.skill
		text += '+'
		text += logisticsLevel
		text += ' '
		text += ctx.wd.r('skill.logistics').label()
		text += ' ('
		text += logisticsLevel
		text += ')'
		text += '\n'
	}

	text += shop.products
		.map(product => labeledInt(ctx.wd.r(product.id), product.itemsInStore, emojis.storage))
		.map(o => o.trim())
		.join('\n')
	text += '\n\n'
	return text
}

function addProductPart(ctx: any, shop: Shop, money: number): string {
	const persist = ctx.persist as Persist

	if (!canAddProductTechnically(shop, persist.skills)) {
		return ''
	}

	const indexOfShop = persist.shops.map(o => o.id).indexOf(shop.id)
	const cost = addProductToShopCost(indexOfShop, shop.products.length)

	let text = ''
	text += emojis.add
	text += '*'
	text += ctx.wd.r('other.assortment').label()
	text += '*'
	text += '\n'

	text += moneyCostPart(ctx, money, cost)

	return text
}

function customerIntervalPart(ctx: any, shop: Shop, mall: Mall | undefined, showExplanation: boolean): string {
	if (shop.products.length === 0) {
		return ''
	}

	const height = getAttractionHeight(mall && mall.attraction)
	const bonus = attractionCustomerBonus(height)

	let text = ''
	text += '1 '
	text += ctx.wd.r('other.customer').label()
	text += ' / '
	text += formatFloat(customerInterval(bonus))
	text += ' '
	text += ctx.wd.r('unit.second').label()
	if (shop.products.length > 1) {
		text += ' / '
		text += ctx.wd.r('product.product').label()
	}

	if (showExplanation && mall && mall.attraction) {
		text += '\n  '
		text += emojis.attraction
		text += percentBonusString(bonus)
		text += ' '
		text += ctx.wd.r(mall.attraction.item).label()
	}

	text += '\n\n'
	return text
}

function menuText(ctx: any): string {
	const {shop} = fromCtx(ctx)
	const reader = ctx.wd.r(shop.id) as WikidataEntityReader

	const session = ctx.session as Session
	const persist = ctx.persist as Persist

	let text = ''
	text += infoHeader(reader, {titlePrefix: emojis.shop})
	text += '\n\n'

	text += customerIntervalPart(ctx, shop, persist.mall, !session.hideExplanationMath)
	text += incomePart(ctx, [shop], persist, !session.hideExplanationMath)
	text += storageCapacityPart(ctx, shop, persist.skills, !session.hideExplanationMath)
	text += productsPart(ctx, shop, persist.skills, !session.hideExplanationMath)
	text += addProductPart(ctx, shop, session.money)

	return text
}

const menu = new TelegrafInlineMenu(menuText, {
	photo: menuPhoto(ctx => fromCtx(ctx).shop.id)
})

function userProducts(ctx: any): string[] {
	const {shop} = fromCtx(ctx)
	return shop.products.map(o => o.id)
}

menu.selectSubmenu('p', userProducts, productMenu, {
	columns: 2,
	textFunc: (ctx: any, key) => ctx.wd.r(key).label()
})

menu.button(buttonText(emojis.add, 'other.assortment'), 'addProduct', {
	hide: (ctx: any) => {
		const session = ctx.session as Session
		const persist = ctx.persist as Persist
		const {shop, indexOfShop} = fromCtx(ctx)

		if (!canAddProductTechnically(shop, persist.skills)) {
			return true
		}

		return addProductToShopCost(indexOfShop, shop.products.length) > session.money
	},
	doFunc: (ctx: any) => {
		const {shop, indexOfShop} = fromCtx(ctx)
		const session = ctx.session as Session
		const now = Math.floor(Date.now() / 1000)

		const cost = addProductToShopCost(indexOfShop, shop.products.length)
		if (session.money < cost) {
			// Fishy
			return
		}

		const pickedProductId = randomUnusedEntry(
			wdShop.products(shop.id) || [],
			userProducts(ctx)
		)

		const pickedProduct: Product = {
			id: pickedProductId,
			itemsInStore: 10,
			itemTimestamp: now
		}

		session.money -= cost
		shop.products.push(pickedProduct)
	}
})

function buyAllAdditionalCostString(ctx: any): string {
	const persist = ctx.persist as Persist
	const factor = buyAllCostFactor(persist.skills, 1)
	const content = percentBonusString(factor) + emojis.currency
	return `(${content})`
}

menu.button(buttonText(emojis.magnetism, 'person.talents.purchasing', {suffix: buyAllAdditionalCostString}), 'buy-all', {
	hide: (ctx: any) => {
		const {shop} = fromCtx(ctx)
		const session = ctx.session as Session
		const persist = ctx.persist as Persist

		return !magnetEnabled([shop], persist.skills, session.money)
	},
	doFunc: (ctx: any) => {
		const {shop} = fromCtx(ctx)
		const session = ctx.session as Session
		const persist = ctx.persist as Persist
		const now = Math.floor(Date.now() / 1000)

		const cost = buyAllCost([shop], persist.skills)
		const storage = storageCapacity(shop, persist.skills)

		if (cost > session.money) {
			// What?
			return
		}

		for (const product of shop.products) {
			product.itemsInStore = storage
			product.itemTimestamp = now
		}

		session.money -= cost
	}
})

function employeesRequireAttention(ctx: any): boolean {
	const {shop} = fromCtx(ctx)
	return TALENTS.length - allEmployees(shop.personal).length > 0
}

menu.submenu(buttonText(emojis.person, 'menu.employee', {requireAttention: employeesRequireAttention}), 'e', employeeMenu)

menu.submenu(buttonText(emojis.close, 'action.close'), 'remove', closureMenu, {
	joinLastRow: true,
	hide: (ctx: any) => {
		const persist = ctx.persist as Persist
		return persist.shops.length <= 1
	}
})

menu.urlButton(
	buttonText(emojis.wikidataItem, 'menu.wikidataItem'),
	(ctx: any) => ctx.wd.r(fromCtx(ctx).shop.id).url()
)

menu.submenu(helpButtonText(), 'help', createHelpMenu('help.shop'))

export default menu
