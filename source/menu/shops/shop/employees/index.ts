import {MenuTemplate, Body} from 'telegraf-inline-menu'

import {Context} from '../../../../lib/types'
import {Shop} from '../../../../lib/types/shop'
import {TALENTS, Talent} from '../../../../lib/types/people'

import {buttonText, bodyPhoto, backButtons} from '../../../../lib/interface/menu'
import {emojis} from '../../../../lib/interface/emojis'
import {infoHeader} from '../../../../lib/interface/formatted-strings'
import {personInShopLine} from '../../../../lib/interface/person'

import {createHelpMenu, helpButtonText} from '../../../help'

import {menu as employee} from './employee'

function fromCtx(ctx: Context): {shop: Shop} {
	const shopType = ctx.match![1]!
	const shop = ctx.persist.shops.find(o => o.id === shopType)!
	return {shop}
}

async function talentLine(ctx: Context, shop: Shop, talent: Talent): Promise<string> {
	const person = shop.personal[talent]

	let text = ''
	text += emojis[talent]
	text += '*'
	text += (await ctx.wd.reader(`person.talents.${talent}`)).label()
	text += '*'
	text += '\n  '

	text += person ? personInShopLine(shop, talent) : emojis.noPerson

	return text
}

async function menuBody(ctx: Context): Promise<Body> {
	const {shop} = fromCtx(ctx)
	let text = ''
	const reader = await ctx.wd.reader('menu.employee')
	text += infoHeader(reader)

	const talentLines = await Promise.all(TALENTS.map(async o => talentLine(ctx, shop, o)))
	text += talentLines.join('\n')

	return {
		...bodyPhoto(reader),
		text, parse_mode: 'Markdown'
	}
}

export const menu = new MenuTemplate<Context>(menuBody)

menu.chooseIntoSubmenu('t', TALENTS, employee, {
	columns: 1,
	buttonText: buttonText((_, key) => emojis[key as Talent], (_, key) => `person.talents.${key}`)
})

menu.url(
	buttonText(emojis.wikidataItem, 'menu.wikidataItem'),
	async ctx => (await ctx.wd.reader('menu.employee')).url()
)

menu.submenu(helpButtonText(), 'help', createHelpMenu('help.shop-employees'))

menu.manualRow(backButtons)
