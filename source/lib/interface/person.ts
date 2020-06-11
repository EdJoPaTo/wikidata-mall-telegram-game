import {calcQuickStats} from '../math/number-array'

import {Person, Talent, Name, TALENTS, Talents} from '../types/people'
import {Context} from '../types'
import {Shop} from '../types/shop'

import {personalBonus, employeesWithFittingHobbyAmount} from '../game-math/personal'

import {emojis} from './emojis'
import {humanReadableTimestamp} from './formatted-time'
import {labeledValue} from './formatted-strings'
import {percentBonusString, percentString} from './format-percent'
import * as formatQuickStats from './quick-stats'

export function personStateEmoji(person: Person): string {
	switch (person.type) {
		case 'alien': return emojis.personAlien
		case 'christmasAngel': return emojis.christmasAngel
		case 'halloweenPumpkin': return emojis.halloweenPumpkin
		case 'refined': return emojis.personRefined
		case 'robot': return emojis.personRobot
		default: return emojis.personTemporary
	}
}

export function wdResourceKeyOfPerson(person: Person): string {
	return `person.type.${person.type}`
}

export async function personMarkdown(ctx: Context, person: Person, isFitting: boolean, now: number): Promise<string> {
	const {timeZone, __wikibase_language_code: locale} = ctx.session
	const {name, hobby, seatProtectionUntil, retirementTimestamp, talents} = person

	let text = ''
	text += nameMarkdown(name)
	text += '\n'
	text += personStateEmoji(person)
	text += await ctx.wd.reader(wdResourceKeyOfPerson(person)).then(r => r.label())
	text += '\n'

	text += isFitting ? emojis.hobbyMatch : emojis.hobbyDifferent
	text += labeledValue(await ctx.wd.reader('person.hobby'), await ctx.wd.reader(hobby))

	if (seatProtectionUntil && seatProtectionUntil > now) {
		text += emojis.seatProtection
		text += labeledValue(await ctx.wd.reader('person.seatProtection'), humanReadableTimestamp(seatProtectionUntil, locale, timeZone))
	}

	text += emojis.retirement
	text += labeledValue(await ctx.wd.reader('person.retirement'), humanReadableTimestamp(retirementTimestamp, locale, timeZone))

	text += '*'
	text += (await ctx.wd.reader('person.talent')).label()
	text += '*'
	text += '\n'

	const talentLines = await Promise.all((Object.keys(talents) as Talent[])
		.map(async t => talentLine(ctx, t, talents[t]))
	)
	text += talentLines.join('\n')

	return text.trim()
}

export function nameMarkdown(name: Name): string {
	const {given, family} = name
	return `*${given}* ${family}`
}

async function talentLine(ctx: Context, t: Talent, percentage: number): Promise<string> {
	const reader = await ctx.wd.reader(`person.talents.${t}`)
	return `${emojis[t]} ${reader.label()}: ${percentBonusString(percentage)}`
}

export function personAllTalentsLine(talents: Talents): string {
	return TALENTS
		.map(o => emojis[o] + percentBonusString(talents[o]))
		.join(' ')
}

export function personInShopLine(shop: Shop, talent: Talent): string {
	const person = shop.personal[talent]
	if (!person) {
		throw new Error(`There is no person in the shop assigned to the position + ${talent}`)
	}

	const {name, hobby} = person
	const namePart = nameMarkdown(name)
	const isHobby = hobby === shop.id
	const bonus = personalBonus(shop, talent)

	return `${percentBonusString(bonus)} ${isHobby ? emojis.hobbyMatch + ' ' : ''}${namePart}`
}

export async function shopEmployeeOverview(ctx: Context, shop: Shop, talents: readonly Talent[] = TALENTS): Promise<string> {
	const employeeEntries = await Promise.all(talents.map(async t => shopEmployeeEntry(ctx, shop, t)))

	let text = ''
	text += emojis.shop
	text += '*'
	text += await ctx.wd.reader(shop.id).then(r => r.label())
	text += '*'
	text += '\n'

	text += employeeEntries
		.join('\n')

	return text
}

async function shopEmployeeEntry(ctx: Context, shop: Shop, talent: Talent): Promise<string> {
	const {timeZone, __wikibase_language_code: locale} = ctx.session
	const person = shop.personal[talent]

	let text = ''
	text += '  '
	text += emojis[talent]

	if (!person) {
		text += emojis.noPerson
		return text
	}

	text += personInShopLine(shop, talent)

	if (person.hobby !== shop.id) {
		text += '\n'
		text += '    '
		text += emojis.hobbyDifferent
		text += await ctx.wd.reader(person.hobby).then(r => r.label())
	}

	text += '\n'
	text += '    '
	text += emojis.retirement
	text += humanReadableTimestamp(person.retirementTimestamp, locale, timeZone)

	return text
}

export async function employeeStatsPart(ctx: Context, shops: readonly Shop[], talents: readonly Talent[]): Promise<string> {
	const {timeZone, __wikibase_language_code: locale} = ctx.session
	const employeesInTalents = shops
		.flatMap(o => {
			const employees: Person[] = []
			for (const t of talents) {
				const employee = o.personal[t]
				if (employee) {
					employees.push(employee)
				}
			}

			return employees
		})

	const entries: string[] = [
		await hobbiesStatsLine(ctx, shops, talents),
		...retirementLines(employeesInTalents, locale, timeZone),
		...talents.map(t => talentStatsLine(shops, t))
	].filter(o => Boolean(o))

	if (entries.length === 0) {
		return ''
	}

	return entries.join('\n') + '\n\n'
}

function talentStatsLine(shops: readonly Shop[], talent: Talent): string {
	const boni = shops.map(s => personalBonus(s, talent))
	const stats = calcQuickStats(boni)
	if (stats.amount === 0) {
		return ''
	}

	let text = ''
	text += emojis[talent]
	text += formatQuickStats.minAvgMax(stats, percentBonusString, percentBonusString)
	return text
}

function retirementLines(people: readonly Person[], locale: string | undefined, timeZone: string | undefined): string[] {
	if (people.length === 0) {
		return []
	}

	const stats = calcQuickStats(people.map(o => o.retirementTimestamp))
	const formatNumber = (n: number): string => humanReadableTimestamp(n, locale, timeZone)

	return [
		emojis.retirement + formatQuickStats.specific(stats, 'min', formatNumber),
		emojis.retirement + formatQuickStats.specific(stats, 'max', formatNumber)
	]
}

async function hobbiesStatsLine(ctx: Context, shops: readonly Shop[], talents: readonly Talent[]): Promise<string> {
	const currently = employeesWithFittingHobbyAmount(shops, talents)
	const possible = shops.length * talents.length
	if (currently === 0 || possible === 0) {
		return ''
	}

	let text = ''
	text += emojis.hobbyMatch
	text += labeledValue(
		await ctx.wd.reader('person.hobby'),
		`${currently} / ${possible} (${percentString(currently / possible)})`
	)
	return text.trim()
}
