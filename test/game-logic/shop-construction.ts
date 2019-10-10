import test from 'ava'

import {Construction} from '../../source/lib/types/shop'

import {CHANGE_INTERVAL_IN_SECONDS, removeOldEntries, fillMissingConstructions} from '../../source/lib/game-logic/shop-construction'

const allShops: readonly string[] = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I']
const timeOffset = 10 * CHANGE_INTERVAL_IN_SECONDS

test('removeOldEntries with empty input', t => {
	const data: Construction = {
		timestamp: 0,
		possibleShops: []
	}
	removeOldEntries(data, timeOffset)

	t.is(data.timestamp, timeOffset)
	t.is(data.possibleShops.length, 0)
})

test('removeOldEntries full remove nothing', t => {
	const data: Construction = {
		timestamp: timeOffset,
		possibleShops: ['A', 'B', 'C', 'D', 'E']
	}
	removeOldEntries(data, timeOffset + 10)

	t.is(data.timestamp, timeOffset)
	t.is(data.possibleShops.length, 5)
})

test('removeOldEntries full remove partially', t => {
	const data: Construction = {
		timestamp: timeOffset,
		possibleShops: ['A', 'B', 'C', 'D', 'E']
	}
	const now = timeOffset + (CHANGE_INTERVAL_IN_SECONDS * 2)
	removeOldEntries(data, now)

	t.is(data.timestamp, now)
	t.deepEqual(data.possibleShops, ['C', 'D', 'E'])
})

test('fillMissingConstructions with full input', t => {
	const data: Construction = {
		timestamp: 0,
		possibleShops: ['A', 'B', 'C', 'D', 'E']
	}
	fillMissingConstructions(data, allShops)

	t.deepEqual(data.possibleShops, ['A', 'B', 'C', 'D', 'E'])
})

test('fillMissingConstructions with partial input', t => {
	const data: Construction = {
		timestamp: 0,
		possibleShops: ['A', 'B', 'C']
	}
	fillMissingConstructions(data, allShops)

	t.is(data.possibleShops.length, 5)
	t.deepEqual(data.possibleShops.slice(0, 3), ['A', 'B', 'C'])
})
