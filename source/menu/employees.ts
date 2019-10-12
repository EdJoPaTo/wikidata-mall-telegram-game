import TelegrafInlineMenu from 'telegraf-inline-menu'

import {Session, Persist} from '../lib/types'
import {Talent, TALENTS} from '../lib/types/people'

import {emojis} from '../lib/interface/emojis'
import {infoHeader} from '../lib/interface/formatted-strings'
import {menuPhoto, buttonText} from '../lib/interface/menu'
import {shopEmployeeOverview, employeeStatsPart} from '../lib/interface/person'

import {createHelpMenu, helpButtonText} from './help'

function menuText(ctx: any): string {
	const session = ctx.session as Session
	const persist = ctx.persist as Persist

	const talentSelection = session.employeeViewTalent
	const talents = talentSelection ? [talentSelection] : TALENTS

	let text = ''
	text += infoHeader(ctx.wd.r('menu.employee'), {titlePrefix: emojis.person})

	text += persist.shops
		.map(o => shopEmployeeOverview(ctx, o, talents))
		.join('\n\n')
	text += '\n\n'

	text += employeeStatsPart(ctx, persist.shops, talents)

	return text
}

const menu = new TelegrafInlineMenu(menuText, {
	photo: menuPhoto('menu.employee')
})

menu.toggle((ctx: any) => ctx.wd.r('menu.allLanguages').label(), 'all', {
	isSetFunc: (ctx: any) => {
		const session = ctx.session as Session
		return !session.employeeViewTalent
	},
	setFunc: (ctx: any, newState) => {
		const session = ctx.session as Session
		if (newState) {
			delete session.employeeViewTalent
		} else {
			session.employeeViewTalent = 'purchasing'
		}
	}
})

menu.select('talent', TALENTS, {
	isSetFunc: (ctx: any, key) => {
		const session = ctx.session as Session
		return session.employeeViewTalent === key
	},
	setFunc: (ctx: any, key) => {
		const session = ctx.session as Session
		session.employeeViewTalent = key as Talent
	},
	textFunc: (ctx: any, key) => {
		const label: string = ctx.wd.r(`person.talents.${key}`).label()
		const emoji = emojis[key]
		return emoji + label
	}
})

menu.urlButton(
	buttonText(emojis.wikidataItem, 'menu.wikidataItem'),
	(ctx: any) => ctx.wd.r('menu.employee').url()
)

menu.submenu(helpButtonText(), 'help', createHelpMenu('help.employees'))

export default menu
