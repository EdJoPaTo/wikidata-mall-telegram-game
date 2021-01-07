import test from 'ava'

import {Shop} from '../../source/lib/types/shop'

import {
	customerInterval,
	customerPerMinute,
	lastTimeActive,
	shopProductsEmptyTimestamps
} from '../../source/lib/game-math/shop-time'

import {generateShop} from './_shop'

test('customerInterval without bonus', t => {
	t.is(customerInterval(1), 30)
})

test('customerInterval doubled', t => {
	t.is(customerInterval(2), 15)
})

test('customerPerMinute without bonus', t => {
	t.is(customerPerMinute(1), 2)
})

test('customerPerMinute doubled', t => {
	t.is(customerPerMinute(2), 4)
})

test('shopProductsEmptyTimestamps without bonus', t => {
	const amounts = [0, 1, 10]
	const shop = generateShop(amounts)
	t.deepEqual(shopProductsEmptyTimestamps(shop, 1), [
		0,
		30,
		300
	])
})

test('lastTimeActive empty', t => {
	const result = lastTimeActive([])
	t.is(result, Number.NEGATIVE_INFINITY)
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
