import TelegrafInlineMenu from 'telegraf-inline-menu'

import {MINUTE_IN_SECONDS} from '../lib/math/timestamp-constants'
import {randomBetween} from '../lib/math/probability'

import {Person} from '../lib/types/people'
import {Persist} from '../lib/types'

import {minutesUntilGraduation} from '../lib/game-math/applicant'

import {buttonText, menuPhoto} from '../lib/interface/menu'
import {emojis} from '../lib/interface/emojis'
import {personMarkdown} from '../lib/interface/person'

import {createHelpMenu, helpButtonText} from './help'

function fromCtx(ctx: any): {applicantId: number; applicant: Person; hobbyIsFitting: boolean} {
	const applicantId = Number(ctx.match[1])
	const persist = ctx.persist as Persist
	const applicant: Person = persist.applicants.list[applicantId]
	if (!applicant) {
		throw new Error('The applicant you are looking for is not there.')
	}

	const shopIds = persist.shops.map(o => o.id)
	const hobbyIsFitting = shopIds.some(o => o === applicant.hobby)
	return {applicantId, applicant, hobbyIsFitting}
}

function menuText(ctx: any): string {
	const {applicant, hobbyIsFitting} = fromCtx(ctx)
	const now = Date.now() / 1000
	return personMarkdown(ctx, applicant, hobbyIsFitting, now)
}

const menu = new TelegrafInlineMenu(menuText, {
	photo: menuPhoto(ctx => fromCtx(ctx).applicant.hobby)
})

menu.button(buttonText(emojis.personStudent, 'action.education'), 'educate', {
	hide: (ctx: any) => {
		const {applicant} = fromCtx(ctx)
		return applicant.type !== 'refined' || Boolean(applicant.graduation)
	},
	doFunc: (ctx: any) => {
		const now = Date.now() / 1000
		const {applicant} = fromCtx(ctx)
		if (applicant.type !== 'refined' || applicant.graduation) {
			return
		}

		const grad = minutesUntilGraduation()
		const minutesUntil = randomBetween(grad.min, grad.max)
		const timestamp = Math.floor(now + (minutesUntil * MINUTE_IN_SECONDS))
		applicant.graduation = timestamp
	}
})

menu.button(buttonText(emojis.door, 'other.door'), 'remove', {
	joinLastRow: true,
	setParentMenuAfter: true,
	doFunc: (ctx: any) => {
		const {applicantId} = fromCtx(ctx)
		const {applicants} = ctx.persist as Persist
		applicants.list.splice(applicantId, 1)
	}
})

menu.urlButton(
	(ctx: any) => {
		const {applicant, hobbyIsFitting} = fromCtx(ctx)
		const hobby = hobbyIsFitting ? emojis.hobbyMatch : emojis.hobbyDifferent
		return `${emojis.wikidataItem}${hobby} ${ctx.wd.r('person.hobby').label()} ${ctx.wd.r(applicant.hobby).label()}`
	},
	(ctx: any) => ctx.wd.r(fromCtx(ctx).applicant.hobby).url()
)

menu.submenu(helpButtonText(), 'help', createHelpMenu('help.applicants'))

export default menu
