import {sparqlQuerySimplifiedMinified} from 'wikidata-sdk-got'
import arrayFilterUnique from 'array-filter-unique'

import {stagedAsync} from '../js-helper/async'

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

function shopTypesQuery(topmost: string): string {
	return `SELECT ?shop WHERE {
?shop wdt:P279+ wd:${topmost}.
?product wdt:P279 ?shop.
FILTER(EXISTS { ?shop wdt:P18 ?image. })
FILTER(EXISTS { ?product wdt:P18 ?image. })
}
GROUP BY ?shop
HAVING ((COUNT(?product)) >= 4 )`
}

function productsQuery(shopType: string): string {
	return `SELECT ?product WHERE {
?product wdt:P279 wd:${shopType}.
FILTER(EXISTS { ?product wdt:P18 ?image. })
}`
}

export async function preload(): Promise<string[]> {
	console.time('wikidata-shops')

	const shopTypesArr = await stagedAsync(
		sparqlQuerySimplifiedMinified,
		toplevelShopCategories.map(o => shopTypesQuery(o))
	) as string[]

	const shopTypes = shopTypesArr
		.filter(arrayFilterUnique())

	console.timeLog('wikidata-shops', 'shopTypes', shopTypes.length)

	const products = await stagedAsync(
		loadProducts,
		shopTypes
	)

	console.timeLog('wikidata-shops', 'products', products.length)

	const amountRemoved = removeNotAnymoreExistingShops(shopTypes)
	console.timeLog('wikidata-shops', 'old shops removed', amountRemoved)

	console.timeEnd('wikidata-shops')
	return [
		...shopTypes,
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
	const products = await sparqlQuerySimplifiedMinified(productsQuery(shopType)) as string[]
	shopsWithProducts[shopType] = products
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
