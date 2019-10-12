import TelegrafInlineMenu from 'telegraf-inline-menu'

import {Persist} from '../../../../lib/types'
import {Shop} from '../../../../lib/types/shop'
import {TALENTS, Talent} from '../../../../lib/types/people'

import {buttonText, menuPhoto} from '../../../../lib/interface/menu'
import {emojis} from '../../../../lib/interface/emojis'
import {infoHeader} from '../../../../lib/interface/formatted-strings'
import {personInShopLine} from '../../../../lib/interface/person'

import {createHelpMenu, helpButtonText} from '../../../help'

import employee from './employee'

function fromCtx(ctx: any): {shop: Shop} {
	const shopType = ctx.match[1]
	const persist = ctx.persist as Persist
	const shop = persist.shops.filter(o => o.id === shopType)[0]
	return {shop}
}

function talentLine(ctx: any, shop: Shop, talent: Talent): string {
	const person = shop.personal[talent]

	let text = ''
	text += emojis[talent]
	text += '*'
	text += ctx.wd.r(`person.talents.${talent}`).label()
	text += '*'
	text += '\n  '

	if (person) {
		text += personInShopLine(shop, talent)
	} else {
		text += emojis.noPerson
	}

	return text
}

function menuText(ctx: any): string {
	const {shop} = fromCtx(ctx)
	let text = ''
	text += infoHeader(ctx.wd.r('menu.employee'))

	text +=	TALENTS
		.map(o => talentLine(ctx, shop, o))
		.join('\n')

	return text
}

const menu = new TelegrafInlineMenu(menuText, {
	photo: menuPhoto('menu.employee')
})

menu.selectSubmenu('t', TALENTS, employee, {
	columns: 1,
	textFunc: buttonText((_ctx, key) => emojis[key!], (_ctx, key) => `person.talents.${key}`)
})

menu.urlButton(
	buttonText(emojis.wikidataItem, 'menu.wikidataItem'),
	(ctx: any) => ctx.wd.r('menu.employee').url()
)

menu.submenu(helpButtonText(), 'help', createHelpMenu('help.shop-employees'))

export default menu
