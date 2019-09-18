import TelegrafInlineMenu from 'telegraf-inline-menu'

import {Session, Persist} from '../lib/types'
import {Person} from '../lib/types/people'

import {secondsBetweenApplicants, applicantSeats, canBeEmployed} from '../lib/game-math/applicant'

import {applicantInfluencesPart} from '../lib/interface/applicants'
import {emojis} from '../lib/interface/emojis'
import {formatFloat} from '../lib/interface/format-number'
import {humanReadableTimestamp} from '../lib/interface/formatted-time'
import {infoHeader} from '../lib/interface/formatted-strings'
import {menuPhoto, buttonText} from '../lib/interface/menu'
import {personAllTalentsLine, nameMarkdown, personStateEmoji} from '../lib/interface/person'

import {createHelpMenu, helpButtonText} from './help'
import applicantMenu from './applicant'

function applicantEntry(ctx: any, applicant: Person, isHobbyFitting: boolean): string {
	const {__wikibase_language_code: locale} = ctx.session as Session
	const now = Date.now() / 1000

	let text = ''
	text += personStateEmoji(applicant, now)
	text += nameMarkdown(applicant.name)
	text += '\n    '
	text += isHobbyFitting ? emojis.hobbyMatch : emojis.hobbyDifferent
	text += ctx.wd.r(applicant.hobby).label()
	if (canBeEmployed(applicant, now)) {
		text += '\n    '
		text += emojis.retirement
		text += humanReadableTimestamp(applicant.retirementTimestamp, locale)
		text += '\n    '
		text += personAllTalentsLine(applicant.talents)
	}

	return text
}

function menuText(ctx: any): string {
	const session = ctx.session as Session
	const persist = ctx.persist as Persist
	const now = Date.now() / 1000

	const maxSeats = applicantSeats(persist.skills)
	const interval = secondsBetweenApplicants(persist.skills)

	let text = ''
	text += infoHeader(ctx.wd.r('menu.applicant'))
	text += '\n\n'

	text += applicantInfluencesPart(ctx, persist.skills, persist.applicants.list.length, !session.hideExplanationMath)

	text += '\n'
	if (persist.applicants.list.length > 0) {
		const shopIds = persist.shops.map(o => o.id)
		text += persist.applicants.list
			.map(o => applicantEntry(ctx, o, shopIds.includes(o.hobby)))
			.join('\n')
		text += '\n\n'
	}

	if (persist.applicants.list.length < maxSeats) {
		const secondsUntilNext = (persist.applicants.timestamp + interval) - now
		text += ctx.wd.r('other.countdown').label()
		text += ': '
		text += formatFloat(secondsUntilNext)
		text += ' '
		text += ctx.wd.r('unit.second').label()
		text += '\n\n'
	}

	return text
}

const menu = new TelegrafInlineMenu(menuText, {
	photo: menuPhoto('menu.applicant')
})

function availableApplicants(ctx: any): string[] {
	const {applicants} = ctx.persist as Persist
	return Object.keys(applicants.list)
}

menu.selectSubmenu('a', availableApplicants, applicantMenu, {
	columns: 2,
	prefixFunc: (ctx: any, key) => {
		const now = Date.now() / 1000
		const {applicants} = ctx.persist as Persist
		const applicant = applicants.list[Number(key)]
		return personStateEmoji(applicant, now)
	},
	textFunc: (ctx: any, key) => {
		const persist = ctx.persist as Persist
		const {name, hobby} = persist.applicants.list[Number(key)]
		const hasShopOfHobby = persist.shops.some(o => o.id === hobby)
		const hasShopOfHobbyString = hasShopOfHobby ? emojis.hobbyMatch : ''
		return `${hasShopOfHobbyString}${name.given} ${name.family}`
	}
})

menu.urlButton(
	buttonText(emojis.wikidataItem, 'menu.wikidataItem'),
	(ctx: any) => ctx.wd.r('menu.applicant').url()
)

menu.submenu(helpButtonText(), 'help', createHelpMenu('help.applicants'))

export default menu
