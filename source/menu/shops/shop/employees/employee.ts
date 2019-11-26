import TelegrafInlineMenu from 'telegraf-inline-menu'

import {Persist} from '../../../../lib/types'
import {Shop} from '../../../../lib/types/shop'
import {Talent, Person} from '../../../../lib/types/people'

import {personalBonusWhenEmployed} from '../../../../lib/game-math/personal'

import {buttonText} from '../../../../lib/interface/menu'
import {emojis} from '../../../../lib/interface/emojis'
import {infoHeader} from '../../../../lib/interface/formatted-strings'
import {percentBonusString} from '../../../../lib/interface/format-percent'
import {personMarkdown, personStateEmoji} from '../../../../lib/interface/person'

import {createHelpMenu, helpButtonText} from '../../../help'

import confirmEmployee from './confirm-applicant'

function fromCtx(ctx: any): {shop: Shop; talent: Talent; employee?: Person} {
	const shopType = ctx.match[1]
	const talent = ctx.match[2] as Talent

	const persist = ctx.persist as Persist
	const shop = persist.shops.filter(o => o.id === shopType)[0]
	const employee = shop.personal[talent]

	return {shop, talent, employee}
}

function menuText(ctx: any): string {
	const {shop, talent, employee} = fromCtx(ctx)
	const now = Date.now() / 1000

	let text = ''
	text += infoHeader(ctx.wd.r(`person.talents.${talent}`), {titlePrefix: emojis[talent]})

	if (employee) {
		text += personMarkdown(ctx, employee, shop.id === employee.hobby, now)
	} else {
		text += emojis.noPerson
	}

	return text
}

const menu = new TelegrafInlineMenu(menuText)

function hideWhenNoApplicantOrEmploymentProtected(ctx: any): boolean {
	const now = Date.now() / 1000
	const {employee} = fromCtx(ctx)
	if (!employee) {
		return true
	}

	return Boolean(employee.seatProtectionUntil && employee.seatProtectionUntil > now)
}

menu.button(buttonText(emojis.employmentTermination, 'action.employmentTermination'), 'remove', {
	hide: ctx => !fromCtx(ctx).employee,
	doFunc: (ctx: any) => {
		const {shop, talent} = fromCtx(ctx)
		delete shop.personal[talent]
	}
})

menu.button(buttonText(emojis.seat, 'action.demotion'), 'toApplicants', {
	hide: hideWhenNoApplicantOrEmploymentProtected,
	doFunc: (ctx: any) => {
		const {applicants} = ctx.persist as Persist
		const {shop, talent} = fromCtx(ctx)

		const person = shop.personal[talent]
		if (!person) {
			// What?
			return
		}

		applicants.list.push(person)
		delete shop.personal[talent]
	}
})

function availableApplicants(ctx: any): string[] {
	const now = Date.now() / 1000
	const {applicants} = ctx.persist as Persist
	const {employee, shop, talent} = fromCtx(ctx)
	if (employee && employee.seatProtectionUntil && employee.seatProtectionUntil > now) {
		return []
	}

	const applicantBoni: Record<number, number> = {}
	for (let i = 0; i < applicants.list.length; i++) {
		const applicant = applicants.list[i]
		applicantBoni[i] = personalBonusWhenEmployed(shop, talent, applicant)
	}

	const currentBonus = personalBonusWhenEmployed(shop, talent, employee)
	const indiciesOfInterest = applicants.list
		.map((_, i) => i)
		.filter(i => applicantBoni[i] > currentBonus)
		.sort((a, b) => applicantBoni[b] - applicantBoni[a])

	return indiciesOfInterest.map(o => String(o))
}

menu.selectSubmenu('a', availableApplicants, confirmEmployee, {
	columns: 1,
	prefixFunc: (ctx: any, key) => {
		const {applicants} = ctx.persist as Persist
		const applicant = applicants.list[Number(key)]
		return personStateEmoji(applicant)
	},
	textFunc: (ctx: any, key) => {
		const {applicants} = ctx.persist as Persist
		const {shop, talent} = fromCtx(ctx)
		const applicant = applicants.list[Number(key)]

		const {name} = applicant

		const bonus = personalBonusWhenEmployed(shop, talent, applicant)
		const bonusString = percentBonusString(bonus)

		const isHobby = applicant.hobby === shop.id
		const hobbyString = isHobby ? emojis.hobbyMatch + ' ' : ''

		return `${name.given} ${name.family} (${hobbyString}${bonusString})`
	}
})

menu.urlButton(
	buttonText(emojis.wikidataItem, 'menu.wikidataItem'),
	(ctx: any) => ctx.wd.r(`person.talents.${fromCtx(ctx).talent}`).url()
)

menu.submenu(helpButtonText(), 'help', createHelpMenu('help.shop-employees'))

export default menu
