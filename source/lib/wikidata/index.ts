import {readFileSync} from 'fs'

import WikidataEntityStore from 'wikidata-entity-store'

import * as attractions from './attractions'
import * as blacklist from './blacklist'
import * as inUseItems from './preload-in-use-items'
import * as name from './name'
import * as production from './production'
import * as sets from './sets'
import * as shops from './shops'

type Logger = (...args: any[]) => void

export async function preload(store: WikidataEntityStore): Promise<void> {
	console.time('wikidata preload')
	const qNumbers: string[] = []

	await preloadSpecific('resourceKeys', async () => store.addResourceKeyYaml(
		readFileSync('wikidata-items.yaml', 'utf8')
	))
	await preloadSpecific('name', async logger => name.preload(logger))
	await preloadSpecific('blacklist', async () => blacklist.preload())
	qNumbers.push(...await preloadSpecific('attractions', async logger => attractions.preload(logger)))
	qNumbers.push(...await preloadSpecific('production', async logger => production.preload(logger)))
	qNumbers.push(...await preloadSpecific('sets', async logger => sets.preload(logger)))
	qNumbers.push(...await preloadSpecific('shops', async logger => shops.preload(logger)))

	await preloadSpecific('preload wdItems', async () => store.preloadQNumbers(...qNumbers))

	// Load them last to see how much is missing
	await preloadSpecific('in-use-items', async logger => inUseItems.preload(store, logger))

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
		qNumbers.push(...await preloadSpecific('attractions', async logger => attractions.preload(logger)))
		qNumbers.push(...await preloadSpecific('production', async logger => production.preload(logger)))
		qNumbers.push(...await preloadSpecific('sets', async logger => sets.preload(logger)))
		qNumbers.push(...await preloadSpecific('shops', async logger => shops.preload(logger)))

		await preloadSpecific('update wdItems', async () => store.updateQNumbers(qNumbers))
	} catch (_) {
		// Ignore update error. It is logged anyway and the game can run without the update working
	}

	console.timeEnd('wikidata preload')
}

async function preloadSpecific<T>(title: string, loadFunc: (log: Logger) => Promise<T>): Promise<T> {
	try {
		const identifier = `wikidata preload ${title}`
		const logFn: Logger = (...args) => console.timeLog(identifier, ...args)

		console.timeLog('wikidata preload', 'start', title)
		console.time(identifier)
		const result = await loadFunc(logFn)
		console.timeEnd(identifier)
		console.timeLog('wikidata preload', 'finish', title)
		return result
	} catch (error) {
		console.error('wikidata preloadSpecific', title, 'failed:', error)
		throw new Error(`wikidata preload ${title} failed`)
	}
}
