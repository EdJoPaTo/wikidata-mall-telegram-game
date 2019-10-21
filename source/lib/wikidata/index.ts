import {readFileSync} from 'fs'

import WikidataEntityStore from 'wikidata-entity-store'

import * as attractions from './attractions'
import * as blacklist from './blacklist'
import * as inUseItems from './preload-in-use-items'
import * as name from './name'
import * as production from './production'
import * as sets from './sets'
import * as shops from './shops'

export async function preload(store: WikidataEntityStore): Promise<void> {
	console.time('wikidata preload')
	const qNumbers: string[] = []

	await preloadSpecific('resourceKeys', async () => store.addResourceKeyYaml(
		readFileSync('wikidata-items.yaml', 'utf8')
	))
	await preloadSpecific('name', async () => name.preload())
	await preloadSpecific('blacklist', async () => blacklist.preload())
	qNumbers.push(...await preloadSpecific('attractions', async () => attractions.preload()))
	qNumbers.push(...await preloadSpecific('production', async () => production.preload()))
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

		await preloadSpecific('blacklist', async () => blacklist.preload())
		qNumbers.push(...await preloadSpecific('attractions', async () => attractions.preload()))
		qNumbers.push(...await preloadSpecific('production', async () => production.preload()))
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
