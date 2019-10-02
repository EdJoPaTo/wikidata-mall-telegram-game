import {Persist} from '../types'
import {Personal} from '../types/shop'
import {TALENTS} from '../types/people'

export default function calcPersonal(persist: Persist, now: number): void {
	for (const shop of persist.shops) {
		retireShopPersonal(shop.personal, now)
	}
}

function retireShopPersonal(personal: Personal, now: number): void {
	for (const talent of TALENTS) {
		const person = personal[talent]
		const retire = !person || person.retirementTimestamp < now
		if (retire) {
			delete personal[talent]
		}
	}
}
