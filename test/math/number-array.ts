import test from 'ava'

import {calcQuickStats, numberArrayOnlyFinite} from '../../source/lib/math/number-array'

import {createInputOutputDeepEqualMacro} from '../_helper'

const numberArrayFilterIsFiniteMacro = createInputOutputDeepEqualMacro(numberArrayOnlyFinite)

test('numberArrayFilterIsFinite empty still empty', numberArrayFilterIsFiniteMacro, [], [])
test('numberArrayFilterIsFinite null gone', numberArrayFilterIsFiniteMacro, [], [null])
test('numberArrayFilterIsFinite undefined gone', numberArrayFilterIsFiniteMacro, [], [undefined])
test('numberArrayFilterIsFinite NaN gone', numberArrayFilterIsFiniteMacro, [], [Number.NaN])
test('numberArrayFilterIsFinite Infinity gone', numberArrayFilterIsFiniteMacro, [], [Infinity])
test('numberArrayFilterIsFinite 0 still there', numberArrayFilterIsFiniteMacro, [0], [0])
test('numberArrayFilterIsFinite big example', numberArrayFilterIsFiniteMacro, [0, 2, 4], [0, Infinity, null, 2, Number.NaN, undefined, 4])

const calcQuickStatsMacro = createInputOutputDeepEqualMacro(calcQuickStats)

test('calcQuickStats empty input', calcQuickStatsMacro, {amount: 0, sum: 0, avg: Number.NaN, min: Infinity, max: -Infinity}, [])
test('calcQuickStats single number', calcQuickStatsMacro, {amount: 1, sum: 5, avg: 5, min: 5, max: 5}, [5])
test('calcQuickStats two numbers', calcQuickStatsMacro, {amount: 2, sum: 10, avg: 5, min: 2, max: 8}, [2, 8])
