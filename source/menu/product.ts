import TelegrafInlineMenu from 'telegraf-inline-menu'
import WikidataEntityReader from 'wikidata-entity-reader'

import {Session, Persist} from '../lib/types'
import {Shop, Product} from '../lib/types/shop'
import {Skills} from '../lib/types/skills'
import {TalentName} from '../lib/types/people'

import {collectorTotalLevel, currentLevel} from '../lib/game-math/skill'
import {sellingCost, purchasingCost, productBasePrice, productBasePriceCollectorFactor, sellingCostPackagingBonus, purchasingCostScissorsBonus} from '../lib/game-math/product'
import {storageCapacity} from '../lib/game-math/shop'

import {formatInt} from '../lib/interface/format-number'
import {infoHeader, labeledInt, labeledFloat} from '../lib/interface/formatted-strings'
import {menuPhoto} from '../lib/interface/menu'
import {percentBonusString} from '../lib/interface/format-percent'
import {personInShopLine} from '../lib/interface/person'
import emoji from '../lib/interface/emojis'

function fromCtx(ctx: any): {shop: Shop; product: Product} {
	const shopType = ctx.match[1]
	const productId = ctx.match[2]
	const persist = ctx.persist as Persist
	const shop = persist.shops.filter(o => o.id === shopType)[0]
	const product = shop.products.filter(o => o.id === productId)[0]
	return {shop, product}
}

function bonusPerson(shop: Shop, talent: TalentName): string {
	const person = shop.personal[talent]
	if (!person) {
		return ''
	}

	return '\n  ' + emoji.person + personInShopLine(shop, talent)
}

function bonusSkill(ctx: any, shop: Shop, skills: Skills, skill: keyof Skills, bonusFunc: (level: number) => number): string {
	const level = currentLevel(skills, skill, shop.id)
	const bonus = bonusFunc(level)
	if (bonus === 1) {
		return ''
	}

	let text = ''
	text += '\n'
	text += '  '
	text += emoji.skill
	text += percentBonusString(bonus)
	text += ' '
	text += ctx.wd.r(`skill.${skill}`).label()
	text += ' ('
	text += level
	text += ')'

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

function menuText(ctx: any): string {
	const {product, shop} = fromCtx(ctx)
	const session = ctx.session as Session
	const persist = ctx.persist as Persist
	const reader = ctx.wd.r(product.id) as WikidataEntityReader

	const capacity = storageCapacity(shop, persist.skills)
	const basePrice = productBasePrice(product, persist.skills)
	const purchaseCostPerItem = purchasingCost(shop, product, persist.skills)
	const sellingCostPerItem = sellingCost(shop, product, persist.skills)

	const collectorLevel = collectorTotalLevel(persist.skills)

	let text = ''
	text += infoHeader(reader)
	text += '\n\n'

	text += labeledFloat(ctx.wd.r('other.money'), session.money, emoji.currency)
	text += '\n\n'

	text += emoji.storage
	text += labeledInt(ctx.wd.r('product.storage'), product.itemsInStore)
	text += ' / '
	text += formatInt(capacity)
	text += '\n'

	text += '\n'
	text += '*'
	text += ctx.wd.r('other.cost').label()
	text += '*'
	text += '\n'

	text += labeledFloat(ctx.wd.r('product.listprice'), basePrice, emoji.currency)
	text += '\n'
	if (collectorLevel > 0) {
		text += '  '
		text += emoji.skill
		text += percentBonusString(productBasePriceCollectorFactor(persist.skills))
		text += ' '
		text += ctx.wd.r('skill.collector').label()
		text += ' ('
		text += collectorLevel
		text += ')'
		text += '\n'
	}

	text += emoji.purchasing
	text += labeledFloat(ctx.wd.r('person.talents.purchasing'), purchaseCostPerItem, emoji.currency)
	text += bonusPerson(shop, 'purchasing')
	text += bonusSkill(ctx, shop, persist.skills, 'metalScissors', purchasingCostScissorsBonus)
	text += '\n'

	text += emoji.selling
	text += labeledFloat(ctx.wd.r('person.talents.selling'), sellingCostPerItem, emoji.currency)
	text += bonusPerson(shop, 'selling')
	text += bonusSkill(ctx, shop, persist.skills, 'packaging', sellingCostPackagingBonus)
	text += '\n'

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

menu.button((ctx: any) => `${emoji.purchasing} ${ctx.wd.r('person.talents.purchasing').label()} (${itemsPurchasableCtx(ctx)})`, 'fill', {
	hide: ctx => itemsPurchasableCtx(ctx) < 1,
	doFunc: (ctx: any) => {
		const now = Math.floor(Date.now() / 1000)
		buyAmount(ctx, Infinity, now)
	}
})

menu.select('buy', [1, 5, 10, 42, 50, 100, 250, 500].map(o => String(o)), {
	columns: 4,
	hide: (ctx, key) => itemsPurchasableCtx(ctx) < Number(key),
	textFunc: (_, key) => `${emoji.purchasing}${key}`,
	setFunc: (ctx, key) => {
		const now = Math.floor(Date.now() / 1000)
		buyAmount(ctx, Number(key), now)
	}
})

menu.urlButton(
	(ctx: any) => `${emoji.wikidataItem} ${ctx.wd.r('menu.wikidataItem').label()}`,
	(ctx: any) => ctx.wd.r(fromCtx(ctx).product.id).url()
)

export default menu
