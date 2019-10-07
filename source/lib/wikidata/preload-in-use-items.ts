import arrayFilterUnique from 'array-filter-unique'
import WikidataEntityStore from 'wikidata-entity-store'

import {CATEGORY_SKILLS} from '../types/skills'

import * as userShops from '../data/shops'
import * as userSkills from '../data/skills'

export async function preload(wdItemStore: WikidataEntityStore): Promise<void> {
	console.time('wikidata-preload-in-use-items')
	const allPlayerShops = await userShops.getAll()
	const shops = Object.values(allPlayerShops).flat()

	const shopIds = shops
		.map(o => o.id)
		.filter(arrayFilterUnique())
	console.timeLog('wikidata-preload-in-use-items', 'shops', shopIds.length)

	const products = shops.flatMap(o => o.products)
	const productIds = products
		.map(o => o.id)
		.filter(arrayFilterUnique())
	console.timeLog('wikidata-preload-in-use-items', 'products', productIds.length)

	const allPlayerSkills = await userSkills.getAll()
	const skills = Object.values(allPlayerSkills)
	const categories = skills
		.flatMap(s =>
			CATEGORY_SKILLS.flatMap(categorySkill => Object.keys(s[categorySkill] || {}))
		)
		.filter(arrayFilterUnique())
	console.timeLog('wikidata-preload-in-use-items', 'skill categories', categories.length)

	const ids = [
		...categories,
		...productIds,
		...shopIds
	].filter(arrayFilterUnique())
	console.timeLog('wikidata-preload-in-use-items', 'total ids', ids.length)

	const availableEntities = wdItemStore.availableEntities()
	const unknownIds = ids.filter(o => !availableEntities.includes(o))
	console.timeLog('wikidata-preload-in-use-items', 'unknown ids', unknownIds.length)

	await wdItemStore.preloadQNumbers(...unknownIds)
	console.timeEnd('wikidata-preload-in-use-items')
}
