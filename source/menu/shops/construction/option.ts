import {MenuTemplate, Body} from 'telegraf-inline-menu'

import {Context} from '../../../lib/types'
import {Shop} from '../../../lib/types/shop'

import {costForAdditionalShop} from '../../../lib/game-math/shop-cost'

import {buttonText, backButtons, bodyPhoto} from '../../../lib/interface/menu'
import {constructionSuffix} from '../../../lib/interface/shop-construction'
import {emojis} from '../../../lib/interface/emojis'
import {infoHeader, moneyCostPart} from '../../../lib/interface/formatted-strings'

import {createHelpMenu, helpButtonText} from '../../help'

function fromCtx(ctx: Context): {construction: string} {
	const construction = ctx.match![1]
	return {construction}
}

function menuBody(ctx: Context): Body {
	const cost = costForAdditionalShop(ctx.persist.shops.length)
	const {construction} = fromCtx(ctx)

	let text = ''
	const reader = ctx.wd.reader(construction)
	text += infoHeader(reader, {
		titlePrefix: emojis.construction + emojis.shop,
		titleSuffix: constructionSuffix(ctx.persist.skills, construction)
	})

	text += moneyCostPart(ctx, ctx.session.money, cost)

	return {
		...bodyPhoto(reader),
		text, parse_mode: 'Markdown'
	}
}

export const menu = new MenuTemplate<Context>(menuBody)

menu.interact(buttonText(emojis.construction, 'action.construction'), 'construct', {
	hide: ctx => {
		const cost = costForAdditionalShop(ctx.persist.shops.length)
		if (cost > ctx.session.money) {
			return true
		}

		const {construction} = fromCtx(ctx)
		if (ctx.persist.shops.some(o => o.id === construction)) {
			return true
		}

		return false
	},
	do: async ctx => {
		const now = Math.floor(Date.now() / 1000)
		const {construction} = fromCtx(ctx)

		if (ctx.persist.shops.some(o => o.id === construction)) {
			throw new Error('you already have that shop')
		}

		const cost = costForAdditionalShop(ctx.persist.shops.length)
		if (ctx.session.money < cost) {
			throw new Error('not enough money for construction')
		}

		const newShop: Shop = {
			id: construction,
			opening: now,
			personal: {
				purchasing: undefined,
				selling: undefined,
				storage: undefined
			},
			products: []
		}

		ctx.session.money -= cost
		ctx.persist.shops.push(newShop)
		await ctx.answerCbQuery(emojis.yes)
		return '../..'
	}
})

menu.url(
	buttonText(emojis.wikidataItem, 'menu.wikidataItem'),
	ctx => ctx.wd.reader(fromCtx(ctx).construction).url()
)

menu.submenu(helpButtonText(), 'help', createHelpMenu('help.shops-construction'))

menu.manualRow(backButtons)
