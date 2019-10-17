import WikidataEntityReader from 'wikidata-entity-reader'

import {calcQuickStats} from '../math/number-array'

import {Person, Talent, Name, TALENTS, Talents} from '../types/people'
import {Session} from '../types'
import {Shop} from '../types/shop'

import {getRefinedState, canBeEmployed} from '../game-math/applicant'
import {personalBonus, employeesWithFittingHobbyAmount} from '../game-math/personal'

import {emojis} from './emojis'
import {humanReadableTimestamp} from './formatted-time'
import {labeledValue} from './formatted-strings'
import {percentBonusString, percentString} from './format-percent'
import * as formatQuickStats from './quick-stats'

export function personStateEmoji(person: Person, now: number): string {
	if (person.type === 'refined') {
		const state = getRefinedState(person, now)
		switch (state) {
			case 'toddler':
				return emojis.personToddler
			case 'student':
				return emojis.personStudent
			case 'finished':
				return emojis.personRefined
			default:
				throw new Error('unknown person state')
		}
	}

	switch (person.type) {
		case 'alien': return emojis.personAlien
		case 'halloweenPumpkin': return emojis.halloweenPumpkin
		case 'robot': return emojis.personRobot
		default: return emojis.personTemporary
	}
}

export function wdResourceKeyOfPerson(person: Person, now: number): string {
	const typeResourceKey = person.type === 'refined' ? getRefinedState(person, now) : person.type
	return `person.type.${typeResourceKey}`
}

export function personMarkdown(ctx: any, person: Person, isFitting: boolean, now: number): string {
	const {timeZone, __wikibase_language_code: locale} = ctx.session as Session
	const {name, hobby, seatProtectionUntil, retirementTimestamp, talents} = person

	let text = ''
	text += nameMarkdown(name)
	text += '\n'
	text += personStateEmoji(person, now)
	text += ctx.wd.r(wdResourceKeyOfPerson(person, now)).label()
	text += '\n'

	text += isFitting ? emojis.hobbyMatch : emojis.hobbyDifferent
	text += labeledValue(ctx.wd.r('person.hobby'), ctx.wd.r(hobby))

	if (seatProtectionUntil && seatProtectionUntil > now) {
		text += emojis.seatProtection
		text += labeledValue(ctx.wd.r('person.seatProtection'), humanReadableTimestamp(seatProtectionUntil, locale, timeZone))
	}

	text += emojis.retirement
	text += labeledValue(ctx.wd.r('person.retirement'), humanReadableTimestamp(retirementTimestamp, locale, timeZone))

	if (canBeEmployed(person, now)) {
		text += '*'
		text += ctx.wd.r('person.talent').label()
		text += '*'
		text += '\n'

		text += (Object.keys(talents) as Talent[])
			.map(t => talentLine(ctx, t, talents[t]))
			.join('\n')
	}

	return text.trim()
}

export function nameMarkdown(name: Name): string {
	const {given, family} = name
	return `*${given}* ${family}`
}

function talentLine(ctx: any, t: Talent, percentage: number): string {
	const reader = ctx.wd.r(`person.talents.${t}`) as WikidataEntityReader
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

export function shopEmployeeOverview(ctx: any, shop: Shop, talents: readonly Talent[] = TALENTS): string {
	const employeeEntries = talents
		.map(t => shopEmployeeEntry(ctx, shop, t))

	let text = ''
	text += emojis.shop
	text += '*'
	text += ctx.wd.r(shop.id).label()
	text += '*'
	text += '\n'

	text += employeeEntries
		.join('\n')

	return text
}

function shopEmployeeEntry(ctx: any, shop: Shop, talent: Talent): string {
	const {timeZone, __wikibase_language_code: locale} = ctx.session as Session
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
		text += ctx.wd.r(person.hobby).label()
	}

	text += '\n'
	text += '    '
	text += emojis.retirement
	text += humanReadableTimestamp(person.retirementTimestamp, locale, timeZone)

	return text
}

export function employeeStatsPart(ctx: any, shops: readonly Shop[], talents: readonly Talent[]): string {
	const {timeZone, __wikibase_language_code: locale} = ctx.session as Session
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
		hobbiesStatsLine(ctx, shops, talents),
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

function hobbiesStatsLine(ctx: any, shops: readonly Shop[], talents: readonly Talent[]): string {
	const currently = employeesWithFittingHobbyAmount(shops, talents)
	const possible = shops.length * talents.length
	if (currently === 0 || possible === 0) {
		return ''
	}

	let text = ''
	text += emojis.hobbyMatch
	text += labeledValue(
		ctx.wd.r('person.hobby'),
		`${currently} / ${possible} (${percentString(currently / possible)})`
	)
	return text.trim()
}
