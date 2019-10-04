import test from 'ava'

import {Skills} from '../../source/lib/types/skills'

import {
	shopProductsPossible,
	storageFilledPercentage
} from '../../source/lib/game-math/shop-capacity'

import {createInputOutputIsMacro} from '../_helper'
import {generateShop} from './_shop'

const storageFilledPercentageMacro = createInputOutputIsMacro((amounts: readonly number[]) => {
	const skills: Skills = {}
	const shop = generateShop(amounts)
	return storageFilledPercentage(shop, skills)
})

test('storageFilledPercentage without products', storageFilledPercentageMacro, 0, [])
test('storageFilledPercentage one product empty', storageFilledPercentageMacro, 0, [0])
test('storageFilledPercentage one product full', storageFilledPercentageMacro, 1, [200])
test('storageFilledPercentage two product empty', storageFilledPercentageMacro, 0, [0, 0])
test('storageFilledPercentage two product full', storageFilledPercentageMacro, 1, [200, 200])
test('storageFilledPercentage two product empty and full', storageFilledPercentageMacro, 0.5, [0, 200])
test('storageFilledPercentage two product half full', storageFilledPercentageMacro, 0.5, [100, 100])

const shopProductsPossibleMacro = createInputOutputIsMacro(shopProductsPossible)

test('shopProductsPossible 0', shopProductsPossibleMacro, 2, 0)
test('shopProductsPossible 1', shopProductsPossibleMacro, 3, 1)
test('shopProductsPossible 2', shopProductsPossibleMacro, 4, 2)
test('shopProductsPossible 4', shopProductsPossibleMacro, 6, 4)
