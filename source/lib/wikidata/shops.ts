import {sparqlQuerySimplifiedMinified, sparqlQuerySimplified} from 'wikidata-sdk-got'
import arrayFilterUnique from 'array-filter-unique'

import {stagedAsync} from '../js-helper/async'

import * as blacklist from './blacklist'

const toplevelShopCategories: string[] = [
	'Q11410', // Game
	'Q11422', // Toy
	'Q11460', // Clothing
	'Q1146001', // Light source
	'Q1357761', // Utensil (everyday use)
	'Q13629441', // Electric vehicle
	'Q188460', // Natural Resource
	'Q2095', // Food
	'Q210729', // Electrical element
	'Q2294986', // Smart object
	'Q31807746', // Furniture
	'Q34379', // Musical instrument
	'Q40218', // Spacecraft
	'Q5082128', // Mobile device
	'Q628983', // Working ship
	'Q6999', // Astronomical object
	'Q729', // Animal
	'Q768186', // Sports Equipment
	'Q811909', // Technological component
	'Q838948', // Work of art
	'Q848944' // Merchant ship
]

const shopsWithProducts: Record<string, string[]> = {}
const shopPotentialProducts: Record<string, number> = {}

function shopTypesQuery(topmost: string): string {
	return `SELECT ?shop WHERE {
?shop wdt:P279+ wd:${topmost}.
?product wdt:P279 ?shop.
FILTER(EXISTS { ?shop wdt:P18 ?image. })
}
GROUP BY ?shop
HAVING ((COUNT(?product)) >= 8 )`
}

function productsQuery(shopType: string): string {
	return `SELECT ?product ?image WHERE {
?product wdt:P279 wd:${shopType}.
OPTIONAL { ?product wdt:P18 ?image. }
}`
}

export async function preload(): Promise<string[]> {
	console.time('wikidata-shops')

	const shopTypesArr = await stagedAsync(
		sparqlQuerySimplifiedMinified,
		toplevelShopCategories.map(o => shopTypesQuery(o))
	) as string[]

	const allShopTypes = shopTypesArr
		.filter(arrayFilterUnique())
	console.timeLog('wikidata-shops', 'allShopTypes', allShopTypes.length)

	const shopTypes = allShopTypes
		.filter(o => !blacklist.basicIncludes(o))
	console.timeLog('wikidata-shops', 'shopTypes without blacklisted ones', shopTypes.length)

	const products = await stagedAsync(
		loadProducts,
		shopTypes
	)

	console.timeLog('wikidata-shops', 'products', products.length)

	const amountRemoved = removeNotAnymoreExistingShops(shopTypes)
	console.timeLog('wikidata-shops', 'old shops removed', amountRemoved)

	console.timeLog('wikidata-shops', 'shops with products', Object.keys(shopsWithProducts).length)
	console.timeEnd('wikidata-shops')
	return [
		...Object.keys(shopsWithProducts),
		...products
	]
}

function removeNotAnymoreExistingShops(shops: string[]): number {
	const remove = Object.keys(shopsWithProducts)
		.filter(o => !shops.includes(o))
	for (const shop of remove) {
		delete shopsWithProducts[shop]
	}

	return remove.length
}

async function loadProducts(shopType: string): Promise<string[]> {
	const result = await sparqlQuerySimplified(productsQuery(shopType)) as {product: string; image: string | undefined}[]

	const products = result
		.filter(o => o.image)
		.map(o => o.product)
		.filter(arrayFilterUnique())

	const potential = result
		.map(o => o.product)
		.filter(arrayFilterUnique())
		.length

	if (products.length < 2) {
		delete shopsWithProducts[shopType]
		return []
	}

	shopsWithProducts[shopType] = products
	shopPotentialProducts[shopType] = potential
	return products
}

export function allShops(): readonly string[] {
	return Object.keys(shopsWithProducts)
}

export function allProductsAmount(): number {
	return Object.values(shopsWithProducts).flat().length
}

export function products(shop: string): readonly string[] | undefined {
	return shopsWithProducts[shop]
}

export function productPotential(shop: string): number {
	return shopPotentialProducts[shop] || 0
}
