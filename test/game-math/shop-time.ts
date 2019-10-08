import test from 'ava'

import {Shop} from '../../source/lib/types/shop'

import {
	customerInterval,
	customerPerMinute,
	lastTimeActive,
	shopProductsEmptyTimestamps
} from '../../source/lib/game-math/shop-time'

import {generateShop} from './_shop'

test('customerInterval', t => {
	t.is(customerInterval(), 30)
})

test('customerPerMinute', t => {
	t.is(customerPerMinute(), 2)
})

test('shopProductsEmptyTimestamps', t => {
	const amounts = [0, 1, 10]
	const shop = generateShop(amounts)
	t.deepEqual(shopProductsEmptyTimestamps(shop), [
		0,
		30,
		300
	])
})

test('lastTimeActive empty', t => {
	const result = lastTimeActive([])
	t.is(result, -Infinity)
})

test('lastTimeActive product max', t => {
	const shop: Shop = {
		id: 'Q5',
		opening: 0,
		personal: {
			purchasing: undefined,
			selling: undefined,
			storage: undefined
		},
		products: [
			{
				id: 'Q42',
				itemTimestamp: 300,
				itemsInStore: 1337
			},
			{
				id: 'Q42',
				itemTimestamp: 200,
				itemsInStore: 1337
			}
		]
	}

	const result = lastTimeActive([
		shop
	])
	t.is(result, 300)
})

test('lastTimeActive opening', t => {
	const shop: Shop = {
		id: 'Q5',
		opening: 100,
		personal: {
			purchasing: undefined,
			selling: undefined,
			storage: undefined
		},
		products: []
	}

	const result = lastTimeActive([
		shop
	])
	t.is(result, 100)
})
