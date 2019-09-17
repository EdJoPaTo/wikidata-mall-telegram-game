import test, {ExecutionContext} from 'ava'

import {Skills} from '../../source/lib/types/skills'

import {
	shopProductsPossible,
	storageFilledPercentage
} from '../../source/lib/game-math/shop-capacity'

import {generateShop} from './_shop'

function storageFilledPercentageMacro(t: ExecutionContext, amounts: readonly number[], expected: number): void {
	const skills: Skills = {}
	const shop = generateShop(amounts)
	t.is(storageFilledPercentage(shop, skills), expected)
}

test('storageFilledPercentage without products', storageFilledPercentageMacro, [], 0)
test('storageFilledPercentage one product empty', storageFilledPercentageMacro, [0], 0)
test('storageFilledPercentage one product full', storageFilledPercentageMacro, [200], 1)
test('storageFilledPercentage two product empty', storageFilledPercentageMacro, [0, 0], 0)
test('storageFilledPercentage two product full', storageFilledPercentageMacro, [200, 200], 1)
test('storageFilledPercentage two product empty and full', storageFilledPercentageMacro, [0, 200], 0.5)
test('storageFilledPercentage two product half full', storageFilledPercentageMacro, [100, 100], 0.5)

function shopProductsPossibleMacro(t: ExecutionContext, level: number, expected: number): void {
	t.is(shopProductsPossible(level), expected)
}

test('shopProductsPossible 0', shopProductsPossibleMacro, 0, 2)
test('shopProductsPossible 1', shopProductsPossibleMacro, 1, 3)
test('shopProductsPossible 2', shopProductsPossibleMacro, 2, 4)
test('shopProductsPossible 4', shopProductsPossibleMacro, 4, 6)
