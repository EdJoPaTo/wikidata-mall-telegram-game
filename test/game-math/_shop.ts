import {Product, Shop} from '../../source/lib/types/shop'
import {Talents, Person} from '../../source/lib/types/people'

export function generateShop(amounts: readonly number[], talents?: Talents): Shop {
	const products: Product[] = amounts.map(o => ({id: 'Q42', itemTimestamp: 0, itemsInStore: o}))
	const talentsEnsured: Talents = talents || {
		purchasing: 1,
		selling: 1,
		storage: 1
	}

	const person: Person = {
		name: {given: '', family: ''},
		type: 'temporary',
		hobby: 'Q666',
		retirementTimestamp: 0,
		talents: talentsEnsured
	}

	return {
		id: 'Q5',
		opening: 0,
		personal: {
			purchasing: person,
			selling: person,
			storage: person
		},
		products
	}
}
