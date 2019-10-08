import TelegrafInlineMenu from 'telegraf-inline-menu'
import WikidataEntityReader from 'wikidata-entity-reader'

import {Session, Persist} from '../../../lib/types'
import {Shop, Product} from '../../../lib/types/shop'
import {Skills, SimpleSkill} from '../../../lib/types/skills'
import {Talent} from '../../../lib/types/people'

import {currentLevel} from '../../../lib/game-math/skill'
import {sellingCost, purchasingCost, productBasePrice, productBasePriceCollectorFactor, sellingCostPackagingBonus, purchasingCostScissorsBonus} from '../../../lib/game-math/product'
import {storageCapacity} from '../../../lib/game-math/shop-capacity'

import {emojis} from '../../../lib/interface/emojis'
import {formatInt} from '../../../lib/interface/format-number'
import {infoHeader, labeledFloat, labeledValue} from '../../../lib/interface/formatted-strings'
import {menuPhoto, buttonText} from '../../../lib/interface/menu'
import {percentBonusString} from '../../../lib/interface/format-percent'
import {personInShopLine} from '../../../lib/interface/person'

import {createHelpMenu, helpButtonText} from '../../help'

function fromCtx(ctx: any): {shop: Shop; product: Product} {
	const shopType = ctx.match[1]
	const productId = ctx.match[2]
	const persist = ctx.persist as Persist
	const shop = persist.shops.filter(o => o.id === shopType)[0]
	const product = shop.products.filter(o => o.id === productId)[0]
	return {shop, product}
}

function bonusPerson(shop: Shop, talent: Talent): string {
	const person = shop.personal[talent]
	if (!person) {
		return ''
	}

	return '  ' + emojis.person + personInShopLine(shop, talent) + '\n'
}

function bonusSkill(ctx: any, skills: Skills, skill: SimpleSkill, bonusFunc: (level: number) => number): string {
	const level = currentLevel(skills, skill)
	const bonus = bonusFunc(level)
	if (bonus === 1) {
		return ''
	}

	let text = ''
	text += '  '
	text += emojis.skill
	text += percentBonusString(bonus)
	text += ' '
	text += ctx.wd.r(`skill.${skill}`).label()
	text += ' ('
	text += level
	text += ')'
	text += '\n'

	return text
}

function itemsPurchasableCtx(ctx: any): number {
	const session = ctx.session as Session
	const persist = ctx.persist as Persist
	const {shop, product} = fromCtx(ctx)
	return itemsPurchasable(session, shop, product, persist.skills)
}

function itemsPurchasable(session: Session, shop: Shop, product: Product, skills: Skills): number {
	const capacity = storageCapacity(shop, skills)
	const freeCapacity = capacity - product.itemsInStore

	const cost = purchasingCost(shop, product, skills)
	const moneyAvailableForAmount = Math.floor(session.money / cost)

	return Math.max(0, Math.min(freeCapacity, moneyAvailableForAmount))
}

function itemsPurchasableButtonSuffix(ctx: any): string {
	return `(${itemsPurchasableCtx(ctx)})`
}

function menuText(ctx: any): string {
	const {product, shop} = fromCtx(ctx)
	const session = ctx.session as Session
	const persist = ctx.persist as Persist
	const reader = ctx.wd.r(product.id) as WikidataEntityReader

	const capacity = storageCapacity(shop, persist.skills)
	const basePrice = productBasePrice(product, persist.skills)
	const purchaseCostPerItem = purchasingCost(shop, product, persist.skills)
	const sellingCostPerItem = sellingCost(shop, product, persist.skills)

	let text = ''
	text += infoHeader(reader)
	text += '\n\n'

	text += labeledFloat(ctx.wd.r('other.money'), session.money, emojis.currency)
	text += '\n'

	text += emojis.storage
	text += labeledValue(
		ctx.wd.r('product.storage'),
		`${formatInt(product.itemsInStore)} / ${formatInt(capacity)}`
	)

	text += '\n'
	text += '*'
	text += ctx.wd.r('other.cost').label()
	text += '*'
	text += '\n'

	if (!session.hideExplanationMath) {
		text += labeledFloat(ctx.wd.r('product.listprice'), basePrice, emojis.currency)
		const collectorFactor = productBasePriceCollectorFactor(persist.skills)
		if (collectorFactor > 1) {
			text += '  '
			text += emojis.skill
			text += percentBonusString(collectorFactor)
			text += ' '
			text += ctx.wd.r('skill.collector').label()
			text += '\n'
		}
	}

	text += emojis.purchasing
	text += labeledFloat(ctx.wd.r('person.talents.purchasing'), purchaseCostPerItem, emojis.currency)
	if (!session.hideExplanationMath) {
		text += bonusPerson(shop, 'purchasing')
		text += bonusSkill(ctx, persist.skills, 'metalScissors', purchasingCostScissorsBonus)
	}

	text += emojis.selling
	text += labeledFloat(ctx.wd.r('person.talents.selling'), sellingCostPerItem, emojis.currency)
	if (!session.hideExplanationMath) {
		text += bonusPerson(shop, 'selling')
		text += bonusSkill(ctx, persist.skills, 'packaging', sellingCostPackagingBonus)
	}

	return text
}

const menu = new TelegrafInlineMenu(menuText, {
	photo: menuPhoto(ctx => fromCtx(ctx).product.id)
})

function buyAmount(ctx: any, amount: number, now: number): void {
	const session = ctx.session as Session
	const persist = ctx.persist as Persist
	const {shop, product} = fromCtx(ctx)

	const maxItems = itemsPurchasable(session, shop, product, persist.skills)
	const buyItems = Math.min(amount, maxItems)
	if (buyItems < 1) {
		return
	}

	const costPerItem = purchasingCost(shop, product, persist.skills)
	session.money -= buyItems * costPerItem
	product.itemsInStore += buyItems
	product.itemTimestamp = now
	session.stats.productsBought += buyItems
}

menu.button(buttonText(emojis.purchasing, 'person.talents.purchasing', {suffix: itemsPurchasableButtonSuffix}), 'fill', {
	hide: ctx => itemsPurchasableCtx(ctx) < 1,
	doFunc: (ctx: any) => {
		const now = Math.floor(Date.now() / 1000)
		buyAmount(ctx, Infinity, now)
	}
})

menu.select('buy', [1, 5, 10, 42, 50, 100, 250, 500].map(o => String(o)), {
	columns: 4,
	hide: (ctx, key) => itemsPurchasableCtx(ctx) < Number(key),
	textFunc: (_, key) => `${emojis.purchasing}${key}`,
	setFunc: (ctx, key) => {
		const now = Math.floor(Date.now() / 1000)
		buyAmount(ctx, Number(key), now)
	}
})

menu.urlButton(
	(ctx: any) => `${emojis.wikidataItem} ${ctx.wd.r('menu.wikidataItem').label()}`,
	(ctx: any) => ctx.wd.r(fromCtx(ctx).product.id).url()
)

menu.submenu(helpButtonText(), 'help', createHelpMenu('help.product'))

export default menu
