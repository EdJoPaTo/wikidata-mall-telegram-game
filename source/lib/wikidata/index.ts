import {readFileSync} from 'fs'

import WikidataEntityStore from 'wikidata-entity-store'

import * as name from './name'
import * as sets from './sets'
import * as shops from './shops'
import * as inUseItems from './preload-in-use-items'

export async function preload(store: WikidataEntityStore): Promise<void> {
	console.time('wikidata preload')
	const qNumbers: string[] = []

	await preloadSpecific('resourceKeys', async () => store.addResourceKeyYaml(
		readFileSync('wikidata-items.yaml', 'utf8')
	))
	await preloadSpecific('name', async () => name.preload())
	qNumbers.push(...await preloadSpecific('sets', async () => sets.preload()))
	qNumbers.push(...await preloadSpecific('shops', async () => shops.preload()))

	await preloadSpecific('preload wdItems', async () => store.preloadQNumbers(...qNumbers))

	// Load them last to see how much is missing
	await preloadSpecific('in-use-items', async () => inUseItems.preload(store))

	console.timeEnd('wikidata preload')
}

export async function update(store: WikidataEntityStore): Promise<void> {
	console.time('wikidata preload')
	const qNumbers: string[] = []

	try {
		await preloadSpecific('resourceKeys', async () => store.addResourceKeyYaml(
			readFileSync('wikidata-items.yaml', 'utf8')
		))
		const resourceKeys = store.availableResourceKeys()
		const resourceKeyQItems = resourceKeys.map(o => store.qNumber(o))
		qNumbers.push(...resourceKeyQItems)

		qNumbers.push(...await preloadSpecific('sets', async () => sets.preload()))
		qNumbers.push(...await preloadSpecific('shops', async () => shops.preload()))

		await preloadSpecific('update wdItems', async () => store.updateQNumbers(qNumbers))
	} catch (_) {
		// Ignore update error. It is logged anyway and the game can run without the update working
	}

	console.timeEnd('wikidata preload')
}

async function preloadSpecific<T>(title: string, loadFunc: () => Promise<T>): Promise<T> {
	try {
		console.timeLog('wikidata preload', 'start', title)
		const result = await loadFunc()
		console.timeLog('wikidata preload', 'finish', title)
		return result
	} catch (error) {
		console.error('wikidata preloadSpecific', title, 'failed:', error)
		throw new Error(`wikidata preload ${title} failed`)
	}
}
