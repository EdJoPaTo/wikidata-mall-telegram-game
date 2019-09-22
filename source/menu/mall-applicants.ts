import TelegrafInlineMenu from 'telegraf-inline-menu'

import {Persist} from '../lib/types'

import {buttonText, menuPhoto} from '../lib/interface/menu'
import {emojis} from '../lib/interface/emojis'
import {infoHeader} from '../lib/interface/formatted-strings'
import {personMarkdown} from '../lib/interface/person'

import {helpButtonText, createHelpMenu} from './help'

async function menuText(ctx: any): Promise<string> {
	const now = Date.now() / 1000
	const {mall, shops} = ctx.persist as Persist
	if (!mall) {
		throw new Error('You are not part of a mall')
	}

	const shopIds = shops.map(o => o.id)

	let text = ''
	text += infoHeader(ctx.wd.r('menu.applicant'))
	text += '\n\n'

	const applicantEntries = mall.applicants
		.map(applicant => {
			const hobbyIsFitting = shopIds.some(o => o === applicant.hobby)
			return personMarkdown(ctx, applicant, hobbyIsFitting, now)
		})

	if (applicantEntries.length > 0) {
		text += applicantEntries.join('\n\n')
	} else {
		text += emojis.noPerson
	}

	text += '\n\n'

	return text
}

const menu = new TelegrafInlineMenu(menuText, {
	photo: menuPhoto((ctx: any) => {
		const {mall} = ctx.persist as Persist
		if (!mall || mall.applicants.length === 0) {
			return undefined
		}

		return mall.applicants[0].hobby
	})
})

menu.button(buttonText(emojis.seat, 'other.seat'), 'takeAll', {
	hide: (ctx: any) => {
		const {mall} = ctx.persist as Persist
		return !mall || mall.applicants.length === 0
	},
	doFunc: async (ctx: any) => {
		const {applicants, mall} = ctx.persist as Persist
		if (!mall) {
			throw new Error('You are not part of a mall')
		}

		applicants.list.push(...mall.applicants)
		mall.applicants = []
	}
})

menu.urlButton(
	buttonText(emojis.wikidataItem, 'menu.wikidataItem'),
	(ctx: any) => ctx.wd.r('menu.applicant').url()
)

menu.submenu(helpButtonText(), 'help', createHelpMenu('help.applicants'))

export default menu
