import TelegrafInlineMenu from 'telegraf-inline-menu'

import {Session, Persist} from '../../../lib/types'
import {Shop} from '../../../lib/types/shop'

import {costForAdditionalShop} from '../../../lib/game-math/shop-cost'

import {buttonText, menuPhoto} from '../../../lib/interface/menu'
import {constructionSuffix} from '../../../lib/interface/shop-construction'
import {emojis} from '../../../lib/interface/emojis'
import {infoHeader, moneyCostPart} from '../../../lib/interface/formatted-strings'

import {createHelpMenu, helpButtonText} from '../../help'
import {replyMenu} from '..'

function fromCtx(ctx: any): {construction: string} {
	const construction = ctx.match[1]
	return {construction}
}

function menuText(ctx: any): string {
	const session = ctx.session as Session
	const persist = ctx.persist as Persist
	const cost = costForAdditionalShop(persist.shops.length)
	const {construction} = fromCtx(ctx)

	let text = ''
	text += infoHeader(ctx.wd.r(construction), {
		titlePrefix: emojis.construction + emojis.shop,
		titleSuffix: constructionSuffix(persist.skills, construction)
	})

	text += moneyCostPart(ctx, session.money, cost)

	return text
}

const menu = new TelegrafInlineMenu(menuText, {
	photo: menuPhoto(ctx => fromCtx(ctx).construction)
})

menu.simpleButton(buttonText(emojis.construction, 'action.construction'), 'construct', {
	hide: (ctx: any) => {
		const session = ctx.session as Session
		const persist = ctx.persist as Persist

		const cost = costForAdditionalShop(persist.shops.length)
		if (cost > session.money) {
			return true
		}

		const {construction} = fromCtx(ctx)
		if (persist.shops.some(o => o.id === construction)) {
			return true
		}

		return false
	},
	doFunc: async (ctx: any) => {
		const session = ctx.session as Session
		const persist = ctx.persist as Persist
		const now = Math.floor(Date.now() / 1000)
		const {construction} = fromCtx(ctx)

		if (persist.shops.some(o => o.id === construction)) {
			throw new Error('you already have that shop')
		}

		const cost = costForAdditionalShop(persist.shops.length)
		if (session.money < cost) {
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

		session.money -= cost
		persist.shops.push(newShop)
		await ctx.answerCbQuery(emojis.yes)
		await replyMenu.middleware()(ctx, undefined)
	}
})

menu.urlButton(
	buttonText(emojis.wikidataItem, 'menu.wikidataItem'),
	(ctx: any) => ctx.wd.r(fromCtx(ctx).construction).url()
)

menu.submenu(helpButtonText(), 'help', createHelpMenu('help.shops-construction'))

export default menu
