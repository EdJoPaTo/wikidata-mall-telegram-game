import {MenuTemplate, Body} from 'telegraf-inline-menu'

import {Context} from '../../lib/types'

import {applicantSeats} from '../../lib/game-math/applicant'

import {buttonText, bodyPhoto, backButtons} from '../../lib/interface/menu'
import {emojis} from '../../lib/interface/emojis'
import {infoHeader} from '../../lib/interface/formatted-strings'
import {personMarkdown} from '../../lib/interface/person'

import {helpButtonText, createHelpMenu} from '../help'

async function menuBody(ctx: Context): Promise<Body> {
	const now = Date.now() / 1000
	const {applicants, mall, shops, skills} = ctx.persist
	if (!mall) {
		throw new Error('You are not part of a mall')
	}

	const shopIds = new Set(shops.map(o => o.id))
	const personalMaxSeats = applicantSeats(skills)
	const personalMaxSeatsReached = applicants.list.length > personalMaxSeats

	let text = ''
	text += infoHeader(await ctx.wd.reader('menu.applicant'))

	const applicantEntries = await Promise.all(mall.applicants
		.map(async applicant => {
			const hobbyIsFitting = shopIds.has(applicant.hobby)
			return personMarkdown(ctx, applicant, hobbyIsFitting, now)
		})
	)

	if (applicantEntries.length > 0) {
		text += applicantEntries.join('\n\n')
		if (personalMaxSeatsReached) {
			text += '\n\n'
			text += emojis.requireAttention + emojis.seat
		}

		const reader = await ctx.wd.reader(mall.applicants[0]!.hobby)
		return {
			...bodyPhoto(reader),
			text, parse_mode: 'Markdown'
		}
	}

	text += emojis.noPerson
	return {text, parse_mode: 'Markdown'}
}

export const menu = new MenuTemplate<Context>(menuBody)

menu.interact(buttonText(emojis.seat, 'other.seat'), 'takeAll', {
	hide: ctx => {
		const {applicants, mall, skills} = ctx.persist
		const maxSeats = applicantSeats(skills)
		const maxSeatsReached = applicants.list.length > maxSeats
		return !mall || mall.applicants.length === 0 || maxSeatsReached
	},
	do: ctx => {
		const {applicants, mall} = ctx.persist
		if (!mall) {
			throw new Error('You are not part of a mall')
		}

		applicants.list.push(...mall.applicants)
		mall.applicants = []
		return '.'
	}
})

menu.url(
	buttonText(emojis.wikidataItem, 'menu.wikidataItem'),
	async ctx => (await ctx.wd.reader('menu.applicant')).url()
)

menu.submenu(helpButtonText(), 'help', createHelpMenu('help.applicants'))

menu.manualRow(backButtons)
