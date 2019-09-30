import WikidataEntityReader from 'wikidata-entity-reader'

import {Person, TalentName, Name, TALENTS, Talents} from '../types/people'
import {Session} from '../types'
import {Shop} from '../types/shop'

import {personalBonus} from '../game-math/personal'
import {getRefinedState, canBeEmployed} from '../game-math/applicant'

import {emojis} from './emojis'
import {humanReadableTimestamp} from './formatted-time'
import {percentBonusString} from './format-percent'

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
	text += '*'
	text += ctx.wd.r('person.hobby').label()
	text += '*'
	text += ': '
	text += ctx.wd.r(hobby).label()
	text += '\n'

	if (seatProtectionUntil && seatProtectionUntil > now) {
		text += emojis.seatProtection
		text += '*'
		text += ctx.wd.r('person.seatProtection').label()
		text += '*'
		text += ':\n  '
		text += humanReadableTimestamp(seatProtectionUntil, locale, timeZone)
		text += '\n'
	}

	text += emojis.retirement
	text += '*'
	text += ctx.wd.r('person.retirement').label()
	text += '*'
	text += ':\n  '
	text += humanReadableTimestamp(retirementTimestamp, locale, timeZone)

	if (canBeEmployed(person, now)) {
		text += '\n'
		text += '*'
		text += ctx.wd.r('person.talent').label()
		text += '*'
		text += '\n'

		text += (Object.keys(talents) as TalentName[])
			.map(t => talentLine(ctx, t, talents[t]))
			.join('\n')
	}

	return text
}

export function nameMarkdown(name: Name): string {
	const {given, family} = name
	return `*${given}* ${family}`
}

function talentLine(ctx: any, t: TalentName, percentage: number): string {
	const reader = ctx.wd.r(`person.talents.${t}`) as WikidataEntityReader
	return `${emojis[t]} ${reader.label()}: ${percentBonusString(percentage)}`
}

export function personAllTalentsLine(talents: Talents): string {
	return TALENTS
		.map(o => emojis[o] + percentBonusString(talents[o]))
		.join(' ')
}

export function personInShopLine(shop: Shop, talent: TalentName): string {
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

export function shopEmployeeOverview(ctx: any, shop: Shop): string {
	const employeeEntries = TALENTS
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

function shopEmployeeEntry(ctx: any, shop: Shop, talent: TalentName): string {
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
