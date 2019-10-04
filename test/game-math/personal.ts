import test from 'ava'

import {Shop} from '../../source/lib/types/shop'
import {Person} from '../../source/lib/types/people'

import {personalBonus, personalBonusWhenEmployed, allEmployees, possibleEmployeesWithShops, employeesWithFittingHobbyAmount} from '../../source/lib/game-math/personal'

import {createInputOutputIsMacro} from '../_helper'

const examplePerson: Person = {
	name: {
		given: 'A',
		family: 'B'
	},
	type: 'temporary',
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
	opening: 0,
	personal: {
		purchasing: undefined,
		selling: undefined,
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

	t.is(personalBonusWhenEmployed(exampleShop, 'purchasing', p), 1)
	t.is(personalBonusWhenEmployed(exampleShop, 'selling', p), 2)
	t.is(personalBonusWhenEmployed(exampleShop, 'storage', p), 4)
})

test('personalBonus when spot empty', t => {
	t.is(personalBonus(exampleShop, 'purchasing'), 1)
})

test('personalBonus with taken spot', t => {
	t.is(personalBonus(exampleShop, 'storage'), 2)
})

test('allEmployees', t => {
	t.deepEqual(allEmployees(exampleShop.personal), [
		examplePerson
	])
})

const possibleEmployeesWithShopsMacro = createInputOutputIsMacro(possibleEmployeesWithShops, amount => `possibleEmployeesWithShops ${amount}`)
test(possibleEmployeesWithShopsMacro, 0, 0)
test(possibleEmployeesWithShopsMacro, 3, 1)
test(possibleEmployeesWithShopsMacro, 6, 2)

test('employeesWithFittingHobbyAmount no shops', t => {
	t.is(employeesWithFittingHobbyAmount([]), 0)
})

test('employeesWithFittingHobbyAmount 1', t => {
	const shop: Shop = {
		...exampleShop,
		personal: {
			purchasing: undefined,
			selling: undefined,
			storage: {
				...examplePerson,
				hobby: 'Q5'
			}
		}
	}

	t.is(employeesWithFittingHobbyAmount([shop]), 1)
})
