import {MenuTemplate, Body} from 'telegraf-inline-menu'

import {Session, Context} from '../../../lib/types'
import {Shop, Product} from '../../../lib/types/shop'
import {Skills, SimpleSkill} from '../../../lib/types/skills'
import {Talent} from '../../../lib/types/people'

import {currentLevel} from '../../../lib/game-math/skill'
import {sellingCost, purchasingCost, productBasePrice, productBasePriceCollectorFactor, sellingCostPackagingBonus, purchasingCostScissorsBonus} from '../../../lib/game-math/product'
import {storageCapacity} from '../../../lib/game-math/shop-capacity'

import {buttonText, bodyPhoto, backButtons} from '../../../lib/interface/menu'
import {emojis} from '../../../lib/interface/emojis'
import {formatInt} from '../../../lib/interface/format-number'
import {infoHeader, labeledFloat, labeledValue} from '../../../lib/interface/formatted-strings'
import {percentBonusString} from '../../../lib/interface/format-percent'
import {personInShopLine} from '../../../lib/interface/person'

import {createHelpMenu, helpButtonText} from '../../help'

function fromCtx(ctx: Context): {shop: Shop; product: Product} {
	const shopType = ctx.match![1]
	const productId = ctx.match![2]
	const shop = ctx.persist.shops.filter(o => o.id === shopType)[0]
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

function bonusSkill(ctx: Context, skills: Skills, skill: SimpleSkill, bonusFunc: (level: number) => number): string {
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
	text += ctx.wd.reader(`skill.${skill}`).label()
	text += ' ('
	text += level
	text += ')'
	text += '\n'

	return text
}

function itemsPurchasableCtx(ctx: Context): number {
	const {shop, product} = fromCtx(ctx)
	return itemsPurchasable(ctx.session, shop, product, ctx.persist.skills)
}

function itemsPurchasable(session: Session, shop: Shop, product: Product, skills: Skills): number {
	const capacity = storageCapacity(shop, skills)
	const freeCapacity = capacity - product.itemsInStore

	const cost = purchasingCost(shop, product, skills)
	const moneyAvailableForAmount = Math.floor(session.money / cost)

	return Math.max(0, Math.min(freeCapacity, moneyAvailableForAmount))
}

function itemsPurchasableButtonSuffix(ctx: Context): string {
	return `(${itemsPurchasableCtx(ctx)})`
}

function menuBody(ctx: Context): Body {
	const {product, shop} = fromCtx(ctx)
	const reader = ctx.wd.reader(product.id)

	const capacity = storageCapacity(shop, ctx.persist.skills)
	const basePrice = productBasePrice(product, ctx.persist.skills)
	const purchaseCostPerItem = purchasingCost(shop, product, ctx.persist.skills)
	const sellingCostPerItem = sellingCost(shop, product, ctx.persist.skills)

	let text = ''
	text += infoHeader(reader)

	text += labeledFloat(ctx.wd.reader('other.money'), ctx.session.money, emojis.currency)
	text += '\n'

	text += emojis.storage
	text += labeledValue(
		ctx.wd.reader('product.storage'),
		`${formatInt(product.itemsInStore)} / ${formatInt(capacity)}`
	)

	text += '\n'
	text += '*'
	text += ctx.wd.reader('other.cost').label()
	text += '*'
	text += '\n'

	if (!ctx.session.hideExplanationMath) {
		text += labeledFloat(ctx.wd.reader('product.listprice'), basePrice, emojis.currency)
		const collectorFactor = productBasePriceCollectorFactor(ctx.persist.skills)
		if (collectorFactor > 1) {
			text += '  '
			text += emojis.skill
			text += percentBonusString(collectorFactor)
			text += ' '
			text += ctx.wd.reader('skill.collector').label()
			text += '\n'
		}
	}

	text += emojis.purchasing
	text += labeledFloat(ctx.wd.reader('person.talents.purchasing'), purchaseCostPerItem, emojis.currency)
	if (!ctx.session.hideExplanationMath) {
		text += bonusPerson(shop, 'purchasing')
		text += bonusSkill(ctx, ctx.persist.skills, 'metalScissors', purchasingCostScissorsBonus)
	}

	text += emojis.selling
	text += labeledFloat(ctx.wd.reader('person.talents.selling'), sellingCostPerItem, emojis.currency)
	if (!ctx.session.hideExplanationMath) {
		text += bonusPerson(shop, 'selling')
		text += bonusSkill(ctx, ctx.persist.skills, 'packaging', sellingCostPackagingBonus)
	}

	return {
		...bodyPhoto(reader),
		text, parse_mode: 'Markdown'
	}
}

export const menu = new MenuTemplate<Context>(menuBody)

function buyAmount(ctx: Context, amount: number, now: number): void {
	const {shop, product} = fromCtx(ctx)

	const maxItems = itemsPurchasable(ctx.session, shop, product, ctx.persist.skills)
	const buyItems = Math.min(amount, maxItems)
	if (buyItems < 1) {
		return
	}

	const costPerItem = purchasingCost(shop, product, ctx.persist.skills)
	ctx.session.money -= buyItems * costPerItem
	product.itemsInStore += buyItems
	product.itemTimestamp = now
	ctx.session.stats.productsBought += buyItems
}

menu.interact(buttonText(emojis.purchasing, 'person.talents.purchasing', {suffix: itemsPurchasableButtonSuffix}), 'fill', {
	hide: ctx => itemsPurchasableCtx(ctx) < 1,
	do: ctx => {
		const now = Math.floor(Date.now() / 1000)
		buyAmount(ctx, Infinity, now)
		return '.'
	}
})

function buyOptions(ctx: Context): number[] {
	const max = itemsPurchasableCtx(ctx)
	return [1, 5, 10, 42, 50, 100, 250, 500]
		.filter(o => o <= max)
}

menu.choose('buy', buyOptions, {
	columns: 4,
	buttonText: (_, key) => `${emojis.purchasing}${key}`,
	do: (ctx, key) => {
		const now = Math.floor(Date.now() / 1000)
		buyAmount(ctx, Number(key), now)
		return '.'
	}
})

menu.url(
	ctx => `${emojis.wikidataItem} ${ctx.wd.reader('menu.wikidataItem').label()}`,
	ctx => ctx.wd.reader(fromCtx(ctx).product.id).url()
)

menu.submenu(helpButtonText(), 'help', createHelpMenu('help.product'))

menu.manualRow(backButtons)
