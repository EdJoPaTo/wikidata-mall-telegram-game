import test, {ExecutionContext} from 'ava'

import {Shop} from '../../source/lib/types/shop'
import {Skills} from '../../source/lib/types/skills'

import {PURCHASING_FACTOR} from '../../source/lib/game-math/constants'

import {customerPerMinute} from '../../source/lib/game-math/shop-time'
import {productBasePrice, sellingCostPackagingBonus, purchasingCost, sellingCost} from '../../source/lib/game-math/product'
import {
	addProductToShopCost,
	buyAllCost,
	buyAllCostFactor,
	costForAdditionalShop,
	magnetEnabled,
	moneyForShopClosure,
	returnOnInvestment,
	sellPerMinute,
	shopTotalPurchaseCost,
	totalCostOfShopWithProducts
} from '../../source/lib/game-math/shop-cost'

import {generateShop} from './_shop'

function costForAdditionalShopMacro(t: ExecutionContext, existingShops: number, expectedCost: number): void {
	t.is(costForAdditionalShop(existingShops), expectedCost)
}

test('costForAdditionalShop 0 shops', costForAdditionalShopMacro, 0, 100)
test('costForAdditionalShop 1 shops', costForAdditionalShopMacro, 1, 1000)
test('costForAdditionalShop 2 shops', costForAdditionalShopMacro, 2, 10000)
test('costForAdditionalShop 3 shops', costForAdditionalShopMacro, 3, 100000)

function addProductToShopCostMacro(t: ExecutionContext, existingShops: number, existingProducts: number, expectedCost: number): void {
	t.is(addProductToShopCost(existingShops, existingProducts), expectedCost)
}

test('addProductToShopCost first shop 0 products', addProductToShopCostMacro, 0, 0, 0)
test('addProductToShopCost second shop 0 products', addProductToShopCostMacro, 1, 0, 0)
test('addProductToShopCost third shop 0 products', addProductToShopCostMacro, 2, 0, 0)

test('addProductToShopCost first shop 1 products', addProductToShopCostMacro, 0, 1, 100)
test('addProductToShopCost second shop 1 products', addProductToShopCostMacro, 1, 1, 1000)
test('addProductToShopCost third shop 1 products', addProductToShopCostMacro, 2, 1, 10000)

test('addProductToShopCost first shop 4 products', addProductToShopCostMacro, 0, 4, 400)
test('addProductToShopCost second shop 4 products', addProductToShopCostMacro, 1, 4, 4000)
test('addProductToShopCost third shop 4 products', addProductToShopCostMacro, 2, 4, 40000)

function totalCostOfShopWithProductsMacro(t: ExecutionContext, shopsBefore: number, products: number, expectedCost: number): void {
	t.is(totalCostOfShopWithProducts(shopsBefore, products), expectedCost)
}

test('totalCostOfShopWithProducts 0 shops, 0 products', totalCostOfShopWithProductsMacro, 0, 0, 100)
test('totalCostOfShopWithProducts 1 shops, 0 products', totalCostOfShopWithProductsMacro, 1, 0, 1000)
test('totalCostOfShopWithProducts 2 shops, 0 products', totalCostOfShopWithProductsMacro, 2, 0, 10000)

test('totalCostOfShopWithProducts 0 shops, 1 products', totalCostOfShopWithProductsMacro, 0, 1, 100)
test('totalCostOfShopWithProducts 1 shops, 1 products', totalCostOfShopWithProductsMacro, 1, 1, 1000)
test('totalCostOfShopWithProducts 2 shops, 1 products', totalCostOfShopWithProductsMacro, 2, 1, 10000)

test('totalCostOfShopWithProducts 0 shops, 2 products', totalCostOfShopWithProductsMacro, 0, 2, 200)
test('totalCostOfShopWithProducts 1 shops, 2 products', totalCostOfShopWithProductsMacro, 1, 2, 2000)
test('totalCostOfShopWithProducts 2 shops, 2 products', totalCostOfShopWithProductsMacro, 2, 2, 20000)

test('totalCostOfShopWithProducts 0 shops, 3 products', totalCostOfShopWithProductsMacro, 0, 3, 400)
test('totalCostOfShopWithProducts 1 shops, 3 products', totalCostOfShopWithProductsMacro, 1, 3, 4000)
test('totalCostOfShopWithProducts 2 shops, 3 products', totalCostOfShopWithProductsMacro, 2, 3, 40000)

function buyShopForClosureIsNotProfitableMacro(t: ExecutionContext, shopsAtStart: number, products: number): void {
	const totalCost = totalCostOfShopWithProducts(shopsAtStart, products)

	const closureMoney = moneyForShopClosure(shopsAtStart + 1, products, true)
	t.log(totalCost, closureMoney, closureMoney / totalCost)
	t.true(totalCost > closureMoney)
}

for (let shops = 1; shops <= 10; shops += 3) {
	for (let products = 0; products <= 10; products++) {
		test(`buy shop for closure is not profitable having ${shops} shop, buying ${products} products`, buyShopForClosureIsNotProfitableMacro, shops, products)
	}
}

test('buy shop for closure for insane players is not profitable', buyShopForClosureIsNotProfitableMacro, 12, 30)

function closureBringsNotMoreMoneyThenNewShopBuildCosts(t: ExecutionContext, currentShops: number, products: number): void {
	const buildCost = costForAdditionalShop(currentShops - 1)
	const closureMoney = moneyForShopClosure(currentShops, products, true)
	t.log(buildCost, closureMoney)
	t.true(buildCost * 3 > closureMoney, 'closure should not bring much more money than building a shop')
}

for (let shops = 1; shops <= 10; shops += 3) {
	for (let products = 0; products <= 10; products++) {
		test(`closure brings not more money then new shop build cost having ${shops} shop, buying ${products} products`, closureBringsNotMoreMoneyThenNewShopBuildCosts, shops, products)
	}
}

function buyAllCostFactorMacro(t: ExecutionContext, magnetismLevel: number, shops: number, expected: number): void {
	const skills: Skills = {magnetism: magnetismLevel}
	t.is(buyAllCostFactor(skills, shops).toFixed(4), expected.toFixed(4))
}

test('buyAllCostFactor 0 in single shop', buyAllCostFactorMacro, 0, 1, 1.68)
test('buyAllCostFactor 5 in single shop', buyAllCostFactorMacro, 5, 1, 1.48)
test('buyAllCostFactor 10 in single shop', buyAllCostFactorMacro, 10, 1, 1.28)

test('buyAllCostFactor 0 in multiple shops', buyAllCostFactorMacro, 0, 3, 3)
test('buyAllCostFactor 5 in multiple shops', buyAllCostFactorMacro, 5, 3, 2.8)
test('buyAllCostFactor 10 in multiple shops', buyAllCostFactorMacro, 10, 3, 2.6)

function shopTotalPurchaseCostMacro(t: ExecutionContext, amounts: readonly number[], expectedItemsToPayFor: number): void {
	const skills: Skills = {magnetism: 0}

	const basePrice = productBasePrice({id: 'Q42', itemTimestamp: 0, itemsInStore: 0}, skills)
	t.is(basePrice, 8, 'sanity check')
	const expectedCostForItemsAlone = basePrice * expectedItemsToPayFor
	const expectedCost = expectedCostForItemsAlone * PURCHASING_FACTOR

	const shop = generateShop(amounts)

	t.is(shopTotalPurchaseCost(shop, skills), expectedCost)
}

test('shopTotalPurchaseCost no products', shopTotalPurchaseCostMacro, [], 0)
test('shopTotalPurchaseCost single product full', shopTotalPurchaseCostMacro, [200], 0)
test('shopTotalPurchaseCost single product one missing', shopTotalPurchaseCostMacro, [199], 1)
test('shopTotalPurchaseCost two product each one missing', shopTotalPurchaseCostMacro, [199, 199], 2)
test('shopTotalPurchaseCost two product empty', shopTotalPurchaseCostMacro, [0, 0], 400)

test('buyAllCost', t => {
	const skills: Skills = {magnetism: 0}
	const shops: Shop[] = [
		generateShop([199]),
		generateShop([199, 199])
	]

	const expectedItemsToPayFor = 3

	const basePrice = productBasePrice({id: 'Q42', itemTimestamp: 0, itemsInStore: 0}, skills)
	t.is(basePrice, 8, 'sanity check')

	const costFactor = buyAllCostFactor(skills, shops.length)
	t.is(costFactor, 3, 'sanity check')

	const expectedCostForItemsAlone = basePrice * expectedItemsToPayFor
	const expectedCost = expectedCostForItemsAlone * costFactor * PURCHASING_FACTOR
	t.log('expectedCost', expectedCost)

	const actualCost = buyAllCost(shops, skills)
	t.log('actualCost', actualCost)

	t.is(Math.round(actualCost), Math.round(expectedCost))
})

test('returnOnInvestment without skills or personal', t => {
	const skills: Skills = {}
	const shop = generateShop([0])
	t.is(returnOnInvestment([shop], skills), 1 / PURCHASING_FACTOR)
})

test('returnOnInvestment without skills or personal and magnet', t => {
	const skills: Skills = {}
	const shop = generateShop([0])
	t.is(returnOnInvestment([shop], skills, 1.5), 1 / (PURCHASING_FACTOR * 1.5))
})

test('returnOnInvestment with personal without skills', t => {
	const skills: Skills = {}
	const shop = generateShop([0], {
		purchasing: 1,
		selling: 1.5,
		storage: 1
	})

	t.is(returnOnInvestment([shop], skills), 1.5 / PURCHASING_FACTOR)
})

test('returnOnInvestment without products', t => {
	const skills: Skills = {}
	const shop = generateShop([])
	t.is(returnOnInvestment([shop], skills), NaN)
})

test('returnOnInvestment with sell skill without personal', t => {
	const shop = generateShop([0])
	const skills: Skills = {
		packaging: 1
	}

	t.is(sellingCostPackagingBonus(1), 1.05, 'sanity check')
	t.is(returnOnInvestment([shop], skills), 1.05 / PURCHASING_FACTOR)
})

test('returnOnInvestment is the same as when calculated manually without magnet', t => {
	const skills: Skills = {metalScissors: 5, packaging: 5}
	const shop = generateShop([199], {
		purchasing: 1.2,
		selling: 1.2,
		storage: 1
	})

	const p = purchasingCost(shop, shop.products[0], skills)
	const s = sellingCost(shop, shop.products[0], skills)

	const manually = s / p
	const roi = returnOnInvestment([shop], skills)

	t.is(manually, roi)
})

test('returnOnInvestment is the same as when calculated manually with magnet', t => {
	const skills: Skills = {metalScissors: 5, packaging: 5, magnetism: 7}
	const shop = generateShop([199], {
		purchasing: 1.2,
		selling: 1.2,
		storage: 1
	})

	const magnetFactor = buyAllCostFactor(skills, 1)
	t.is(magnetFactor, 1.4, 'sanity check')

	const b = buyAllCost([shop], skills)
	const p = purchasingCost(shop, shop.products[0], skills) * magnetFactor
	t.is(b, p, 'sanety check buyAllCost calculates the same')

	const s = sellingCost(shop, shop.products[0], skills)

	const manually = s / p
	t.log('manually', manually)

	const roi = returnOnInvestment([shop], skills, magnetFactor)
	t.log('roi', roi)

	t.is(manually, roi)
})

test('sellPerMinute dont accept any product', t => {
	const skills: Skills = {}
	const shop = generateShop([0, 1])

	t.is(sellPerMinute(shop, skills, () => false), 0)
})

test('sellPerMinute accept any product', t => {
	const skills: Skills = {}
	const shop = generateShop([0, 1])

	const basePrice = productBasePrice({id: 'Q42', itemTimestamp: 0, itemsInStore: 0}, skills)
	t.is(basePrice, 8, 'sanity check')

	const itemsPerMinute = customerPerMinute()
	t.is(itemsPerMinute, 2, 'sanity check')

	t.is(sellPerMinute(shop, skills, () => true), 8 * 2 * 2)
})

function sellPerMinuteInStockMacro(t: ExecutionContext, amounts: readonly number[], expected: number): void {
	const skills: Skills = {}
	const shop = generateShop(amounts)

	const basePrice = productBasePrice({id: 'Q42', itemTimestamp: 0, itemsInStore: 0}, skills)
	t.is(basePrice, 8, 'sanity check')

	const itemsPerMinute = customerPerMinute()
	t.is(itemsPerMinute, 2, 'sanity check')

	t.is(sellPerMinute(shop, skills, o => o.itemsInStore > 0), expected)
}

test('sellPerMinute nothing', sellPerMinuteInStockMacro, [], 0)
test('sellPerMinute 0', sellPerMinuteInStockMacro, [0], 0)
test('sellPerMinute 0, 0', sellPerMinuteInStockMacro, [0, 0], 0)
test('sellPerMinute 1', sellPerMinuteInStockMacro, [1], 8 * 2)
test('sellPerMinute 1, 1', sellPerMinuteInStockMacro, [1, 1], 8 * 2 * 2)

test('magnetEnabled is enabled', t => {
	const skills: Skills = {magnetism: 1}
	const money = 1000000
	const shops = [
		generateShop([100], {purchasing: 3, selling: 3, storage: 3}),
		generateShop([100], {purchasing: 3, selling: 3, storage: 3})
	]

	t.true(magnetEnabled(shops, skills, money))
})

test('magnetEnabled not skilled', t => {
	const skills: Skills = {}
	const money = 1000000
	const shops = [
		generateShop([100], {purchasing: 3, selling: 3, storage: 3}),
		generateShop([100], {purchasing: 3, selling: 3, storage: 3})
	]

	t.false(magnetEnabled(shops, skills, money))
})

test('magnetEnabled too expensive', t => {
	const skills: Skills = {magnetism: 1}
	const money = 0
	const shops = [
		generateShop([100], {purchasing: 3, selling: 3, storage: 3}),
		generateShop([100], {purchasing: 3, selling: 3, storage: 3})
	]

	t.false(magnetEnabled(shops, skills, money))
})

test('magnetEnabled nothing to buy', t => {
	const skills: Skills = {magnetism: 1}
	const money = 1000000
	const shops = [
		generateShop([600], {purchasing: 3, selling: 3, storage: 3}),
		generateShop([600], {purchasing: 3, selling: 3, storage: 3})
	]

	t.false(magnetEnabled(shops, skills, money))
})

test('magnetEnabled ROI negative', t => {
	const skills: Skills = {magnetism: 1}
	const money = 1000000
	const shops = [
		generateShop([100], {purchasing: 0.3, selling: 0.3, storage: 3}),
		generateShop([100], {purchasing: 0.3, selling: 0.3, storage: 3})
	]

	t.false(magnetEnabled(shops, skills, money))
})
