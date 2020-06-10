import test from 'ava'

import {cached, fillArray, stateful} from '../../source/lib/math/fibonacci'

test('stateful example', t => {
	const func = stateful()
	t.is(func(1), 2)
	t.is(func(2), 3)
	t.is(func(3), 5)
	t.is(func(5), 8)
	t.is(func(8), 13)
})

test('fillArray example', t => {
	const array = [0, 1]
	fillArray(array, 5)
	t.deepEqual(array, [0, 1, 1, 2, 3, 5])
})

test('fillArray does not work to infinity', t => {
	const array = [0, 1]
	t.throws(() => fillArray(array, Infinity), {message: /finite/})
})

test('fillArray does need start numbers', t => {
	t.throws(() => fillArray([], 5), {message: /array.+too short/})
})

test('cached works', t => {
	t.is(cached(1), 1)
	t.is(cached(5), 5)
})
