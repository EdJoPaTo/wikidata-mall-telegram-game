import {MenuTemplate, Body} from 'telegraf-inline-menu'

import {Mall} from '../../../lib/types/mall'
import {Context} from '../../../lib/types'
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

import {buttonText, bodyPhoto, backButtons} from '../../../lib/interface/menu'
import {emojis} from '../../../lib/interface/emojis'
import {formatFloat} from '../../../lib/interface/format-number'
import {incomePart} from '../../../lib/interface/shop'
import {infoHeader, labeledInt, moneyCostPart} from '../../../lib/interface/formatted-strings'
import {percentBonusString} from '../../../lib/interface/format-percent'
import {personInShopLine} from '../../../lib/interface/person'

import {createHelpMenu, helpButtonText} from '../../help'

import {menu as closureMenu} from './shop-closure'
import {menu as employeeMenu} from './employees'
import {menu as productMenu} from './product'

function fromCtx(ctx: Context): {shop: Shop; indexOfShop: number} {
	const shopType = ctx.match![1]
	const indexOfShop = ctx.persist.shops.map(o => o.id).indexOf(shopType)
	const shop = ctx.persist.shops[indexOfShop]
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

async function storageCapacityPart(ctx: Context, shop: Shop, skills: Skills, showExplanation: boolean): Promise<string> {
	let text = ''
	text += emojis.storage
	text += labeledInt(await ctx.wd.reader('product.storageCapacity'), storageCapacity(shop, skills))
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
		text += (await ctx.wd.reader('skill.machinePress')).label()
		text += ' ('
		text += pressLevel
		text += ')'
		text += '\n'
	}

	text += '\n'
	return text
}

async function productsPart(ctx: Context, shop: Shop, skills: Skills, showExplanation: boolean): Promise<string> {
	if (shop.products.length === 0) {
		return ''
	}

	const logisticsLevel = currentLevel(skills, 'logistics')
	const productsPossible = shopProductsPossible(logisticsLevel)
	const allAvailableProductsForShop = (wdShop.products(shop.id) || []).length

	let text = ''
	text += '*'
	text += (await ctx.wd.reader('other.assortment')).label()
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
		text += (await ctx.wd.reader('skill.logistics')).label()
		text += ' ('
		text += logisticsLevel
		text += ')'
		text += '\n'
	}

	const productLines = await Promise.all(shop.products.map(async product => labeledInt(await ctx.wd.reader(product.id), product.itemsInStore, emojis.storage).trim()))
	text += productLines.join('\n')
	text += '\n\n'
	return text
}

async function addProductPart(ctx: Context, shop: Shop, money: number): Promise<string> {
	if (!canAddProductTechnically(shop, ctx.persist.skills)) {
		return ''
	}

	const indexOfShop = ctx.persist.shops.map(o => o.id).indexOf(shop.id)
	const cost = addProductToShopCost(indexOfShop, shop.products.length)

	let text = ''
	text += emojis.add
	text += '*'
	text += (await ctx.wd.reader('other.assortment')).label()
	text += '*'
	text += '\n'

	text += await moneyCostPart(ctx, money, cost)

	return text
}

async function customerIntervalPart(ctx: Context, shop: Shop, mall: Mall | undefined, showExplanation: boolean): Promise<string> {
	if (shop.products.length === 0) {
		return ''
	}

	const height = getAttractionHeight(mall && mall.attraction)
	const bonus = attractionCustomerBonus(height)

	let text = ''
	text += '1 '
	text += (await ctx.wd.reader('other.customer')).label()
	text += ' / '
	text += formatFloat(customerInterval(bonus))
	text += ' '
	text += (await ctx.wd.reader('unit.second')).label()
	if (shop.products.length > 1) {
		text += ' / '
		text += (await ctx.wd.reader('product.product')).label()
	}

	if (showExplanation && mall && mall.attraction) {
		text += '\n  '
		text += emojis.attraction
		text += percentBonusString(bonus)
		text += ' '
		text += await ctx.wd.reader(mall.attraction.item).then(r => r.label())
	}

	text += '\n\n'
	return text
}

async function menuBody(ctx: Context): Promise<Body> {
	const {shop} = fromCtx(ctx)
	const reader = await ctx.wd.reader(shop.id)

	let text = ''
	text += infoHeader(reader, {titlePrefix: emojis.shop})

	text += await customerIntervalPart(ctx, shop, ctx.persist.mall, !ctx.session.hideExplanationMath)
	text += await incomePart(ctx, [shop], ctx.persist, !ctx.session.hideExplanationMath)
	text += await storageCapacityPart(ctx, shop, ctx.persist.skills, !ctx.session.hideExplanationMath)
	text += await productsPart(ctx, shop, ctx.persist.skills, !ctx.session.hideExplanationMath)
	text += await addProductPart(ctx, shop, ctx.session.money)

	return {
		...bodyPhoto(reader),
		text, parse_mode: 'Markdown'
	}
}

export const menu = new MenuTemplate<Context>(menuBody)

function userProducts(ctx: Context): string[] {
	const {shop} = fromCtx(ctx)
	return shop.products.map(o => o.id)
}

menu.chooseIntoSubmenu('p', userProducts, productMenu, {
	columns: 3,
	buttonText: async (ctx, key) => (await ctx.wd.reader(key)).label()
})

menu.interact(buttonText(emojis.add, 'other.assortment'), 'addProduct', {
	hide: ctx => {
		const {shop, indexOfShop} = fromCtx(ctx)

		if (!canAddProductTechnically(shop, ctx.persist.skills)) {
			return true
		}

		return addProductToShopCost(indexOfShop, shop.products.length) > ctx.session.money
	},
	do: ctx => {
		const {shop, indexOfShop} = fromCtx(ctx)
		const now = Math.floor(Date.now() / 1000)

		const cost = addProductToShopCost(indexOfShop, shop.products.length)
		if (ctx.session.money < cost) {
			// Fishy
			return '.'
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

		ctx.session.money -= cost
		shop.products.push(pickedProduct)
		return '.'
	}
})

function buyAllAdditionalCostString(ctx: Context): string {
	const factor = buyAllCostFactor(ctx.persist.skills, 1)
	const content = percentBonusString(factor) + emojis.currency
	return `(${content})`
}

menu.interact(buttonText(emojis.magnetism, 'person.talents.purchasing', {suffix: buyAllAdditionalCostString}), 'buy-all', {
	hide: ctx => {
		const {shop} = fromCtx(ctx)
		return !magnetEnabled([shop], ctx.persist.skills, ctx.session.money)
	},
	do: ctx => {
		const {shop} = fromCtx(ctx)
		const now = Math.floor(Date.now() / 1000)

		const cost = buyAllCost([shop], ctx.persist.skills)
		const storage = storageCapacity(shop, ctx.persist.skills)

		if (cost > ctx.session.money) {
			// What?
			return '.'
		}

		for (const product of shop.products) {
			product.itemsInStore = storage
			product.itemTimestamp = now
		}

		ctx.session.money -= cost
		return '.'
	}
})

function employeesRequireAttention(ctx: Context): boolean {
	const {shop} = fromCtx(ctx)
	return TALENTS.length - allEmployees(shop.personal).length > 0
}

menu.submenu(buttonText(emojis.person, 'menu.employee', {requireAttention: employeesRequireAttention}), 'e', employeeMenu)

menu.submenu(buttonText(emojis.close, 'action.close'), 'remove', closureMenu, {
	joinLastRow: true,
	hide: ctx => ctx.persist.shops.length <= 1
})

menu.url(
	buttonText(emojis.wikidataItem, 'menu.wikidataItem'),
	async ctx => (await ctx.wd.reader(fromCtx(ctx).shop.id)).url()
)

menu.submenu(helpButtonText(), 'help', createHelpMenu('help.shop'))

menu.manualRow(backButtons)
