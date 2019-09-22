import TelegrafInlineMenu from 'telegraf-inline-menu'

import {MINUTE_IN_SECONDS} from '../lib/math/timestamp-constants'
import {randomBetween} from '../lib/math/probability'

import {Person} from '../lib/types/people'
import {Persist} from '../lib/types'

import {canBeEmployed, minutesUntilGraduation, getRefinedState} from '../lib/game-math/applicant'

import {buttonText, menuPhoto} from '../lib/interface/menu'
import {emojis} from '../lib/interface/emojis'
import {personMarkdown, personStateEmoji, wdResourceKeyOfPerson} from '../lib/interface/person'

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
	hide: (ctx: any) => {
		const now = Date.now() / 1000
		const {applicant} = fromCtx(ctx)
		return applicant.type === 'refined' && getRefinedState(applicant, now) === 'student'
	},
	doFunc: (ctx: any) => {
		const {applicantId} = fromCtx(ctx)
		const {applicants} = ctx.persist as Persist
		applicants.list.splice(applicantId, 1)
	}
})

menu.button(buttonText(emojis.mall, 'menu.mall'), 'toMall', {
	joinLastRow: true,
	setParentMenuAfter: true,
	hide: (ctx: any) => {
		const now = Date.now() / 1000
		const {applicant} = fromCtx(ctx)
		const {mall} = ctx.persist as Persist
		return !mall || mall.applicants.length > 0 || !canBeEmployed(applicant, now)
	},
	doFunc: (ctx: any) => {
		const {applicantId, applicant} = fromCtx(ctx)
		const {applicants, mall} = ctx.persist as Persist
		if (!mall) {
			throw new Error('You are not part of a mall')
		}

		if (mall.applicants.length > 0) {
			throw new Error('Mall seats are full')
		}

		mall.applicants.push(applicant)
		applicants.list.splice(applicantId, 1)
	}
})

menu.urlButton(
	(ctx: any) => {
		const {applicant} = fromCtx(ctx)
		const now = Date.now() / 1000
		const typeEmoji = personStateEmoji(applicant, now)
		const resourceKey = wdResourceKeyOfPerson(applicant, now)
		return `${emojis.wikidataItem}${typeEmoji}${ctx.wd.r(resourceKey).label()}`
	},
	(ctx: any) => {
		const {applicant} = fromCtx(ctx)
		const now = Date.now() / 1000
		const resourceKey = wdResourceKeyOfPerson(applicant, now)
		return ctx.wd.r(resourceKey).url()
	}
)

menu.urlButton(
	(ctx: any) => {
		const {applicant, hobbyIsFitting} = fromCtx(ctx)
		const hobby = hobbyIsFitting ? emojis.hobbyMatch : emojis.hobbyDifferent
		return `${emojis.wikidataItem}${hobby}${ctx.wd.r(applicant.hobby).label()}`
	},
	(ctx: any) => ctx.wd.r(fromCtx(ctx).applicant.hobby).url(),
	{
		joinLastRow: true
	}
)

menu.submenu(helpButtonText(), 'help', createHelpMenu('help.applicants'))

export default menu
