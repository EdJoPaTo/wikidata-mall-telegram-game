import {Persist} from '../types'
import {Personal} from '../types/shop'
import {TALENTS, Person} from '../types/people'

export function incomeUntil(persist: Persist): number {
	const retirements = persist.shops
		.flatMap(o => o.personal.selling as Person)
		.filter(o => o)
		.map(o => o.retirementTimestamp)
	return Math.min(...retirements)
}

export function incomeLoop(persist: Persist, now: number): void {
	for (const shop of persist.shops) {
		retireShopPersonal(shop.personal, now)
	}
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
