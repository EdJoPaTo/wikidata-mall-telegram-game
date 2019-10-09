import gaussian, {Gaussian} from 'gaussian'

import {Shop, Personal} from '../types/shop'
import {Talent, Person, PersonType, TALENTS} from '../types/people'

export function personalBonus(shop: Shop, talent: Talent): number {
	const person = shop.personal[talent]
	return personalBonusWhenEmployed(shop, talent, person)
}

export function personalBonusWhenEmployed(shop: Shop, talent: Talent, person?: Person): number {
	if (!person) {
		return 1
	}

	const talentFactor = person.talents[talent]

	const isHobby = shop.id === person.hobby
	const hobbyFactor = isHobby ? 2 : 1

	return talentFactor * hobbyFactor
}

export function allEmployees(personal: Personal): readonly Person[] {
	const withUndefined: (Person | undefined)[] = Object.values(personal)
	return withUndefined.filter(o => o) as Person[]
}

export function modifyDistributionOfType(type: PersonType): Gaussian {
	switch (type) {
		case 'robot': return gaussian(0, 0.001 ** 2)
		case 'refined': return gaussian(0.01, 0.02 ** 2)
		default: return gaussian(0, 0.02 ** 2)
	}
}

export function possibleEmployeesWithShops(shopAmount: number): number {
	return shopAmount * TALENTS.length
}

export function employeesWithFittingHobbyAmount(shops: readonly Shop[], talents: readonly Talent[] = TALENTS): number {
	return shops
		.flatMap(shop => talents.map(t => {
			const person = shop.personal[t]
			return person !== undefined && person.hobby === shop.id
		}))
		.filter(o => o)
		.length
}
