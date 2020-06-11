import {MenuTemplate, Body} from 'telegraf-inline-menu'

import {Context} from '../lib/types'
import {Talent, TALENTS} from '../lib/types/people'

import {buttonText, bodyPhoto, backButtons} from '../lib/interface/menu'
import {emojis} from '../lib/interface/emojis'
import {infoHeader} from '../lib/interface/formatted-strings'
import {shopEmployeeOverview, employeeStatsPart} from '../lib/interface/person'

import {createHelpMenu, helpButtonText} from './help'

function menuBody(ctx: Context): Body {
	const talentSelection = ctx.session.employeeViewTalent
	const talents = talentSelection ? [talentSelection] : TALENTS

	const reader = ctx.wd.reader('menu.employee')

	let text = ''
	text += infoHeader(reader, {titlePrefix: emojis.person})

	text += ctx.persist.shops
		.map(o => shopEmployeeOverview(ctx, o, talents))
		.join('\n\n')
	text += '\n\n'

	text += employeeStatsPart(ctx, ctx.persist.shops, talents)

	return {
		...bodyPhoto(reader),
		text, parse_mode: 'Markdown'
	}
}

export const menu = new MenuTemplate<Context>(menuBody)

menu.toggle(ctx => ctx.wd.reader('menu.allLanguages').label(), 'all', {
	isSet: ctx => !ctx.session.employeeViewTalent,
	set: (ctx, newState) => {
		if (newState) {
			delete ctx.session.employeeViewTalent
		} else {
			ctx.session.employeeViewTalent = 'purchasing'
		}
	}
})

menu.select('talent', TALENTS, {
	isSet: (ctx, key) => ctx.session.employeeViewTalent === key,
	set: (ctx, key) => {
		ctx.session.employeeViewTalent = key as Talent
	},
	buttonText: (ctx, key) => {
		const label = ctx.wd.reader(`person.talents.${key}`).label()
		const emoji = emojis[key]
		return emoji + label
	}
})

menu.url(
	buttonText(emojis.wikidataItem, 'menu.wikidataItem'),
	ctx => ctx.wd.reader('menu.employee').url()
)

menu.submenu(helpButtonText(), 'help', createHelpMenu('help.employees'))

menu.manualRow(backButtons)
