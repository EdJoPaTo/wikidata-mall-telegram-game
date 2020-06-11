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
	const shopType = ctx.match![1]
	const shop = ctx.persist.shops.filter(o => o.id === shopType)[0]
	return {shop}
}

function talentLine(ctx: Context, shop: Shop, talent: Talent): string {
	const person = shop.personal[talent]

	let text = ''
	text += emojis[talent]
	text += '*'
	text += ctx.wd.reader(`person.talents.${talent}`).label()
	text += '*'
	text += '\n  '

	if (person) {
		text += personInShopLine(shop, talent)
	} else {
		text += emojis.noPerson
	}

	return text
}

function menuBody(ctx: Context): Body {
	const {shop} = fromCtx(ctx)
	let text = ''
	const reader = ctx.wd.reader('menu.employee')
	text += infoHeader(reader)

	text +=	TALENTS
		.map(o => talentLine(ctx, shop, o))
		.join('\n')

	return {
		...bodyPhoto(reader),
		text, parse_mode: 'Markdown'
	}
}

export const menu = new MenuTemplate<Context>(menuBody)

menu.chooseIntoSubmenu('t', TALENTS, employee, {
	columns: 1,
	buttonText: buttonText((_, key) => emojis[key!], (_, key) => `person.talents.${key}`)
})

menu.url(
	buttonText(emojis.wikidataItem, 'menu.wikidataItem'),
	ctx => ctx.wd.reader('menu.employee').url()
)

menu.submenu(helpButtonText(), 'help', createHelpMenu('help.shop-employees'))

menu.manualRow(backButtons)
