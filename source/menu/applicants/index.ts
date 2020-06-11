import {MenuTemplate, Body} from 'telegraf-inline-menu'

import {Context} from '../../lib/types'
import {Person} from '../../lib/types/people'

import {secondsBetweenApplicants, applicantSeats} from '../../lib/game-math/applicant'

import {applicantInfluencesPart} from '../../lib/interface/applicants'
import {buttonText, bodyPhoto, backButtons} from '../../lib/interface/menu'
import {emojis} from '../../lib/interface/emojis'
import {formatFloat} from '../../lib/interface/format-number'
import {humanReadableTimestamp} from '../../lib/interface/formatted-time'
import {infoHeader} from '../../lib/interface/formatted-strings'
import {personAllTalentsLine, nameMarkdown, personStateEmoji} from '../../lib/interface/person'

import {createHelpMenu, helpButtonText} from '../help'

import {menu as applicantMenu} from './applicant'

function applicantEntry(ctx: Context, applicant: Person, isHobbyFitting: boolean): string {
	const {timeZone, __wikibase_language_code: locale} = ctx.session

	let text = ''
	text += personStateEmoji(applicant)
	text += nameMarkdown(applicant.name)
	text += '\n    '
	text += isHobbyFitting ? emojis.hobbyMatch : emojis.hobbyDifferent
	text += ctx.wd.reader(applicant.hobby).label()
	text += '\n    '
	text += emojis.retirement
	text += humanReadableTimestamp(applicant.retirementTimestamp, locale, timeZone)
	text += '\n    '
	text += personAllTalentsLine(applicant.talents)

	return text
}

function menuBody(ctx: Context): Body {
	const now = Date.now() / 1000

	const maxSeats = applicantSeats(ctx.persist.skills)
	const interval = secondsBetweenApplicants(ctx.persist.skills)

	let text = ''
	const reader = ctx.wd.reader('menu.applicant')
	text += infoHeader(reader)

	text += applicantInfluencesPart(ctx, ctx.persist.skills, ctx.persist.applicants.list.length, !ctx.session.hideExplanationMath)

	text += '\n'
	if (ctx.persist.applicants.list.length > 0) {
		const maxPages = Math.ceil(ctx.persist.applicants.list.length / 20)
		const page = Math.min(ctx.session.page || 1, maxPages)
		const offset = (page - 1) * 20

		const shopIds = new Set(ctx.persist.shops.map(o => o.id))
		text += ctx.persist.applicants.list
			.slice(offset, offset + 20)
			.map(o => applicantEntry(ctx, o, shopIds.has(o.hobby)))
			.join('\n')
		text += '\n\n'
	}

	if (ctx.persist.applicants.list.length < maxSeats) {
		const secondsUntilNext = (ctx.persist.applicants.timestamp + interval) - now
		text += ctx.wd.reader('other.countdown').label()
		text += ': '
		text += formatFloat(secondsUntilNext)
		text += ' '
		text += ctx.wd.reader('unit.second').label()
		text += '\n\n'
	}

	return {
		...bodyPhoto(reader),
		text, parse_mode: 'Markdown'
	}
}

export const menu = new MenuTemplate<Context>(menuBody)

function availableApplicants(ctx: Context): string[] {
	return Object.keys(ctx.persist.applicants.list)
}

menu.chooseIntoSubmenu('a', availableApplicants, applicantMenu, {
	columns: 2,
	getCurrentPage: ctx => ctx.session.page,
	setPage: (ctx, page) => {
		ctx.session.page = page
	},
	buttonText: (ctx, key) => {
		const applicant = ctx.persist.applicants.list[Number(key)]
		const hasShopOfHobby = ctx.persist.shops.some(o => o.id === applicant.hobby)
		const hasShopOfHobbyString = hasShopOfHobby ? emojis.hobbyMatch : ''
		const stateEmoji = personStateEmoji(applicant)
		return `${stateEmoji} ${hasShopOfHobbyString}${applicant.name.given} ${applicant.name.family}`
	}
})

menu.url(
	buttonText(emojis.wikidataItem, 'menu.wikidataItem'),
	ctx => ctx.wd.reader('menu.applicant').url()
)

menu.submenu(helpButtonText(), 'help', createHelpMenu('help.applicants'))

menu.manualRow(backButtons)
