import test from 'ava'

import {Shop} from '../../source/lib/types/shop'
import {Person} from '../../source/lib/types/people'

import {personalBonus, personalBonusWhenEmployed} from '../../source/lib/game-math/personal'

const examplePerson: Person = {
	name: {
		given: 'A',
		family: 'B'
	},
	hobby: 'Q42',
	retirementTimestamp: 0,
	talents: {
		purchasing: 0.5,
		selling: 1,
		storage: 2
	}
}

const exampleShop: Shop = {
	id: 'Q5',
	personal: {
		storage: {
			...examplePerson
		}
	},
	products: []
}

test('personalBonusWhenEmployed without hobby', t => {
	t.is(personalBonusWhenEmployed(exampleShop, 'purchasing', examplePerson), 0.5)
	t.is(personalBonusWhenEmployed(exampleShop, 'selling', examplePerson), 1)
	t.is(personalBonusWhenEmployed(exampleShop, 'storage', examplePerson), 2)
})

test('personalBonusWhenEmployed with hobby', t => {
	const p: Person = {
		...examplePerson,
		hobby: 'Q5'
	}

	t.is(personalBonusWhenEmployed(exampleShop, 'purchasing', p), 1.25)
	t.is(personalBonusWhenEmployed(exampleShop, 'selling', p), 2.5)
	t.is(personalBonusWhenEmployed(exampleShop, 'storage', p), 5)
})

test('personalBonus when spot empty', t => {
	t.is(personalBonus(exampleShop, 'purchasing'), 1)
})

test('personalBonus with taken spot', t => {
	t.is(personalBonus(exampleShop, 'storage'), 2)
})