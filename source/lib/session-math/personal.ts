import {Persist} from '../types'
import {Personal} from '../types/shop'
import {TALENTS, Person} from '../types/people'

import {allEmployees, modifyDistributionOfType} from '../game-math/personal'
import {EMPLOYMENT_TALENT_MODIFICATION_SECONDS} from '../game-math/constants'

export function incomeUntil(persist: Persist): number {
	const retirements = persist.shops
		.flatMap(o => o.personal.selling as Person).filter(o => o)
		.flatMap(o => [o.retirementTimestamp, o.nextTalentModification || Infinity])
	return Math.min(...retirements)
}

export function incomeLoop(persist: Persist, now: number): void {
	for (const shop of persist.shops) {
		retireShopPersonal(shop.personal, now)
	}

	const employees = persist.shops
		.flatMap(o => allEmployees(o.personal))

	modifyTalents(employees, now)
}

function retireShopPersonal(personal: Personal, now: number): void {
	for (const talent of TALENTS) {
		const person = personal[talent]
		const retire = !person || person.retirementTimestamp <= now
		if (retire) {
			delete personal[talent]
		}
	}
}

function modifyTalents(employees: readonly Person[], now: number): void {
	const nextModify = now + EMPLOYMENT_TALENT_MODIFICATION_SECONDS

	for (const person of employees) {
		modifyTalentsPerson(person, now, nextModify)
	}
}

function modifyTalentsPerson(person: Person, now: number, nextModify: number): void {
	if (person.nextTalentModification === undefined) {
		person.nextTalentModification = nextModify
		return
	}

	if (person.nextTalentModification > now) {
		return
	}

	person.nextTalentModification = nextModify

	const distribution = modifyDistributionOfType(person.type)
	for (const t of TALENTS) {
		const beforeModify = person.talents[t]
		const rand = Math.random()
		const change = distribution.ppf(rand)
		const afterModify = beforeModify + change
		person.talents[t] = afterModify
	}
}
