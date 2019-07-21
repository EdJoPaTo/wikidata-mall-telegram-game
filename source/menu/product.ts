import TelegrafInlineMenu from 'telegraf-inline-menu'
import WikidataEntityReader from 'wikidata-entity-reader'

import {Session} from '../lib/types'
import {Shop, Product} from '../lib/types/shop'
import {TalentName} from '../lib/types/people'

import {storageCapacity, sellingCost, purchasingCost} from '../lib/math/product'

import {infoHeader, bonusPercentString, labeledInt, labeledFloat} from '../lib/interface/formatted-strings'
import {menuPhoto, buttonText} from '../lib/interface/menu'
import {personInShopLine} from '../lib/interface/person'
import emoji from '../lib/interface/emojis'

function fromCtx(ctx: any): {shop: Shop; product: Product} {
	const shopType = ctx.match[1]
	const productId = ctx.match[2]
	const session = ctx.session as Session
	const shop = session.shops.filter(o => o.id === shopType)[0]
	const product = shop.products.filter(o => o.id === productId)[0]
	return {shop, product}
}

function bonusPerson(shop: Shop, talent: TalentName): string {
	const person = shop.personal[talent]
	if (!person) {
		return ''
	}

	return '\n  ' + personInShopLine(shop, talent)
}

function itemsPurchasable(session: Session, shop: Shop, product: Product): number {
	const capacity = storageCapacity(shop)
	const freeCapacity = capacity - product.itemsInStore

	const cost = purchasingCost(shop, product)
	const moneyAvailableForAmount = Math.floor(session.money / cost)

	return Math.max(0, Math.min(freeCapacity, moneyAvailableForAmount))
}

function menuText(ctx: any): string {
	const {product, shop} = fromCtx(ctx)
	const session = ctx.session as Session
	const reader = ctx.wd.r(product.id) as WikidataEntityReader

	const capacity = storageCapacity(shop)
	const freeCapacity = capacity - product.itemsInStore
	const purchaseCostPerItem = purchasingCost(shop, product)
	const sellingCostPerItem = sellingCost(shop, product)

	let text = ''
	text += infoHeader(reader)
	text += '\n\n'

	text += labeledFloat(ctx.wd.r('other.money'), session.money, emoji.currency)
	text += '\n\n'

	text += emoji.storage
	text += labeledInt(ctx.wd.r('product.storage'), product.itemsInStore)
	text += '\n'
	text += labeledInt(ctx.wd.r('product.storageCapacity'), capacity)
	text += bonusPerson(shop, 'storage')
	text += '\n'

	text += '\n'
	text += '*'
	text += ctx.wd.r('other.cost').label()
	text += '*'
	text += ' (1)'
	text += '\n'

	text += emoji.purchasing
	text += labeledFloat(ctx.wd.r('person.talents.purchasing'), purchaseCostPerItem, emoji.currency)
	text += bonusPerson(shop, 'purchasing')
	text += '\n'

	text += emoji.selling
	text += labeledFloat(ctx.wd.r('person.talents.selling'), sellingCostPerItem, emoji.currency)
	text += bonusPerson(shop, 'selling')
	text += '\n'

	text += emoji.income
	text += ctx.wd.r('other.income').label()
	text += ': '
	text += bonusPercentString(sellingCostPerItem / purchaseCostPerItem)
	text += '\n'

	if (freeCapacity > 0) {
		text += '\n'
		text += emoji.purchasing
		text += '*'
		text += ctx.wd.r('person.talents.purchasing').label()
		text += '*'
		text += ` (${freeCapacity})`
		text += '\n'
		text += labeledFloat(ctx.wd.r('other.cost'), purchaseCostPerItem * freeCapacity, emoji.currency)
		text += '\n'
	}

	return text
}

const menu = new TelegrafInlineMenu(menuText, {
	photo: menuPhoto(ctx => fromCtx(ctx).product.id)
})

menu.button(buttonText(emoji.purchasing, 'person.talents.purchasing'), 'fill', {
	hide: (ctx: any) => {
		const session = ctx.session as Session
		const {shop, product} = fromCtx(ctx)
		return itemsPurchasable(session, shop, product) < 1
	},
	doFunc: (ctx: any) => {
		const session = ctx.session as Session
		const now = Math.floor(Date.now() / 1000)
		const {shop, product} = fromCtx(ctx)

		const buyItems = itemsPurchasable(session, shop, product)
		if (buyItems < 1) {
			return
		}

		const costPerItem = purchasingCost(shop, product)
		session.money -= buyItems * costPerItem
		product.itemsInStore += buyItems
		product.itemTimestamp = now
	}
})

menu.urlButton(
	(ctx: any) => `${emoji.wikidataItem} ${ctx.wd.r('menu.wikidataItem').label()}`,
	(ctx: any) => ctx.wd.r(fromCtx(ctx).product.id).url()
)

export default menu
