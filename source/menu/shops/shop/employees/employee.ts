import {MenuTemplate, Body} from 'telegraf-inline-menu'

import {Context} from '../../../../lib/types'
import {Shop} from '../../../../lib/types/shop'
import {Talent, Person} from '../../../../lib/types/people'

import {personalBonusWhenEmployed} from '../../../../lib/game-math/personal'

import {buttonText, backButtons} from '../../../../lib/interface/menu'
import {emojis} from '../../../../lib/interface/emojis'
import {infoHeader} from '../../../../lib/interface/formatted-strings'
import {percentBonusString} from '../../../../lib/interface/format-percent'
import {personMarkdown, personStateEmoji} from '../../../../lib/interface/person'

import {createHelpMenu, helpButtonText} from '../../../help'

import {menu as confirmEmployee} from './confirm-applicant'

function fromCtx(ctx: Context): {shop: Shop; talent: Talent; employee?: Person} {
	const shopType = ctx.match![1]
	const talent = ctx.match![2] as Talent

	const shop = ctx.persist.shops.filter(o => o.id === shopType)[0]
	const employee = shop.personal[talent]

	return {shop, talent, employee}
}

async function menuBody(ctx: Context): Promise<Body> {
	const {shop, talent, employee} = fromCtx(ctx)
	const now = Date.now() / 1000

	let text = ''
	text += infoHeader(await ctx.wd.reader(`person.talents.${talent}`), {titlePrefix: emojis[talent]})

	if (employee) {
		text += await personMarkdown(ctx, employee, shop.id === employee.hobby, now)
	} else {
		text += emojis.noPerson
	}

	return {text, parse_mode: 'Markdown'}
}

export const menu = new MenuTemplate<Context>(menuBody)

function hideWhenNoApplicantOrEmploymentProtected(ctx: Context): boolean {
	const now = Date.now() / 1000
	const {employee} = fromCtx(ctx)
	if (!employee) {
		return true
	}

	return Boolean(employee.seatProtectionUntil && employee.seatProtectionUntil > now)
}

menu.interact(buttonText(emojis.employmentTermination, 'action.employmentTermination'), 'remove', {
	hide: ctx => !fromCtx(ctx).employee,
	do: ctx => {
		const {shop, talent} = fromCtx(ctx)
		delete shop.personal[talent]
		return '.'
	}
})

menu.interact(buttonText(emojis.seat, 'action.demotion'), 'toApplicants', {
	hide: hideWhenNoApplicantOrEmploymentProtected,
	do: ctx => {
		const {applicants} = ctx.persist
		const {shop, talent} = fromCtx(ctx)

		const person = shop.personal[talent]
		if (!person) {
			// What?
			return
		}

		applicants.list.push(person)
		delete shop.personal[talent]
		return '.'
	}
})

function availableApplicants(ctx: Context): string[] {
	const now = Date.now() / 1000
	const {applicants} = ctx.persist
	const {employee, shop, talent} = fromCtx(ctx)
	if (employee?.seatProtectionUntil && employee.seatProtectionUntil > now) {
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

menu.chooseIntoSubmenu('a', availableApplicants, confirmEmployee, {
	columns: 1,
	buttonText: (ctx, key) => {
		const {applicants} = ctx.persist
		const {shop, talent} = fromCtx(ctx)
		const applicant = applicants.list[Number(key)]

		const {name} = applicant

		const bonus = personalBonusWhenEmployed(shop, talent, applicant)
		const bonusString = percentBonusString(bonus)

		const isHobby = applicant.hobby === shop.id
		const hobbyString = isHobby ? emojis.hobbyMatch + ' ' : ''

		const stateEmoji = personStateEmoji(applicant)

		return `${stateEmoji} ${name.given} ${name.family} (${hobbyString}${bonusString})`
	}
})

menu.url(
	buttonText(emojis.wikidataItem, 'menu.wikidataItem'),
	async ctx => (await ctx.wd.reader(`person.talents.${fromCtx(ctx).talent}`)).url()
)

menu.submenu(helpButtonText(), 'help', createHelpMenu('help.shop-employees'))

menu.manualRow(backButtons)
