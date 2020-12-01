import * as attractions from './attractions'
import * as blacklist from './blacklist'
import * as production from './production'
import * as sets from './sets'
import * as shops from './shops'

type Logger = (...args: any[]) => void

export async function preload(): Promise<void> {
	console.time('wikidata preload')
	await preloadSpecific('blacklist', async () => blacklist.preload())
	await preloadSpecific('attractions', async logger => attractions.preload(logger))
	await preloadSpecific('production', async logger => production.preload(logger))
	await preloadSpecific('sets', async logger => sets.preload(logger))
	await preloadSpecific('shops', async logger => shops.preload(logger))

	console.timeEnd('wikidata preload')
}

export async function update(): Promise<void> {
	console.time('wikidata preload')

	try {
		await preloadSpecific('blacklist', async () => blacklist.preload())
		await preloadSpecific('attractions', async logger => attractions.preload(logger))
		await preloadSpecific('production', async logger => production.preload(logger))
		await preloadSpecific('sets', async logger => sets.preload(logger))
		await preloadSpecific('shops', async logger => shops.preload(logger))
	} catch {
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
	} catch (error: unknown) {
		console.error('wikidata preloadSpecific', title, 'failed:', error)
		throw new Error(`wikidata preload ${title} failed`)
	}
}
