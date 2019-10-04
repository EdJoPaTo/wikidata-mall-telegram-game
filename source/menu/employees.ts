import TelegrafInlineMenu from 'telegraf-inline-menu'

import {Persist} from '../lib/types'

import {emojis} from '../lib/interface/emojis'
import {infoHeader} from '../lib/interface/formatted-strings'
import {menuPhoto, buttonText} from '../lib/interface/menu'
import {shopEmployeeOverview, employeeStatsPart} from '../lib/interface/person'

import {createHelpMenu, helpButtonText} from './help'

function menuText(ctx: any): string {
	const persist = ctx.persist as Persist

	let text = ''
	text += infoHeader(ctx.wd.r('menu.employee'), {titlePrefix: emojis.person})
	text += '\n\n'

	text += employeeStatsPart(ctx, persist.shops)

	text += persist.shops
		.map(o => shopEmployeeOverview(ctx, o))
		.join('\n\n')

	return text
}

const menu = new TelegrafInlineMenu(menuText, {
	photo: menuPhoto('menu.employee')
})

menu.urlButton(
	buttonText(emojis.wikidataItem, 'menu.wikidataItem'),
	(ctx: any) => ctx.wd.r('menu.employee').url()
)

menu.submenu(helpButtonText(), 'help', createHelpMenu('help.employees'))

export default menu
