import test from 'ava'

import {sortDictKeysByNumericValues, sortDictKeysByStringValues, recreateDictWithGivenKeyOrder} from '../../source/lib/js-helper/dictionary'

test('sortDictKeysByNumericValues', t => {
	const input = {
		a: 5,
		b: 2,
		c: 8,
		d: 0
	}

	const result = sortDictKeysByNumericValues(input)
	t.deepEqual(result, ['d', 'b', 'a', 'c'])
})

test('sortDictKeysByNumericValues reversed', t => {
	const input = {
		a: 5,
		b: 2,
		c: 8,
		d: 0
	}

	const result = sortDictKeysByNumericValues(input, true)
	t.deepEqual(result, ['c', 'a', 'b', 'd'])
})

test('sortDictKeysByStringValues', t => {
	const input = {
		a: 'Baum',
		b: 'Tisch',
		c: 'Stuhl',
		d: 'Apfel'
	}

	const result = sortDictKeysByStringValues(input)
	t.deepEqual(result, ['d', 'a', 'c', 'b'])
})

test('sortDictKeysByStringValues locale de', t => {
	const input = {
		a: 'Baum',
		b: 'Tisch',
		c: 'Stuhl',
		d: 'Apfel'
	}

	const result = sortDictKeysByStringValues(input, 'de')
	t.deepEqual(result, ['d', 'a', 'c', 'b'])
})

test('recreateDictWithGivenKeyOrder', t => {
	const input = {
		a: 5,
		b: 2,
		c: 8,
		d: 0
	}

	const result = recreateDictWithGivenKeyOrder(input, ['d', 'b', 'a', 'c'])
	t.log(result)
	t.deepEqual(result, input)
	t.deepEqual(Object.keys(result), ['d', 'b', 'a', 'c'])
})

test('recreateDictWithGivenKeyOrder fails on numeric keys', t => {
	const input = {
		5: 5,
		2: 2,
		8: 8,
		0: 0
	}

	t.log(input)
	t.log(JSON.stringify(input))

	t.throws(
		() => recreateDictWithGivenKeyOrder(input, ['8', '5', '2', '0']),
		{message: /numbers.+optimization/}
	)
})
