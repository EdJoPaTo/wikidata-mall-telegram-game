import arrayFilterUnique from 'array-filter-unique/dist'
import stringify from 'json-stable-stringify'
import WikidataEntityReader from 'wikidata-entity-reader'
import WikidataEntityStore from 'wikidata-entity-store'

import {Mall, MallProduction} from '../types/mall'
import {Persist} from '../types'

import {DAY_IN_SECONDS} from '../math/timestamp-constants'

import {productionReward} from '../game-math/mall'

import {getParts} from '../wikidata/production'

import * as mallProduction from '../data/mall-production'

import {decideVoteWinner} from '../game-logic/mall-production'

const PRODUCTION_TIMESPAN_IN_SECONDS = DAY_IN_SECONDS

export function startup(persist: Persist): void {
	const {mall} = persist
	if (!mall) {
		return
	}

	// TODO: remove migration
	if (!mall.production) {
		mall.production = []
	}

	delete (mall as any).productionFinishes
	delete (mall as any).partsProducedBy
}

export function incomeUntil(persist: Persist): number {
	const {mall} = persist
	if (!mall || !mall.attraction) {
		return Infinity
	}

	// TODO: has to handle opening too -> shouldnt calc income before opening
	return mall.attraction.disasterTimestamp
}

export function incomeLoop(persist: Persist, now: number): void {
	const {mall} = persist
	if (!mall || !mall.attraction || now < mall.attraction.disasterTimestamp) {
		return
	}

	delete mall.attraction
}

export async function before(persist: Persist, store: WikidataEntityStore, now: number): Promise<void> {
	if (!persist.mall) {
		return
	}

	const production = await mallProduction.get()
	const productionBefore = stringify(production)

	updateCurrentProduction(production, now)

	if (production.itemToProduce) {
		await store.preloadQNumbers(production.itemToProduce)
	}

	const parts = production.itemToProduce ? getParts(new WikidataEntityReader(store.entity(production.itemToProduce))) : []
	removePartsNotInCurrentProduction(persist.mall, parts)
	removePartsByLeftMembers(persist.mall)
	updateProductionProcessOfMall(persist.mall, production, parts, now)

	const productionAfter = stringify(production)
	if (productionBefore !== productionAfter) {
		await mallProduction.set(production)
	}
}

function updateCurrentProduction(production: MallProduction, now: number): void {
	const expectedFinish = (Math.ceil(now / PRODUCTION_TIMESPAN_IN_SECONDS) * PRODUCTION_TIMESPAN_IN_SECONDS) - 1
	if (production.competitionUntil === expectedFinish) {
		return
	}

	const expectedStart = Math.floor(now / PRODUCTION_TIMESPAN_IN_SECONDS) * PRODUCTION_TIMESPAN_IN_SECONDS
	production.competitionSince = expectedStart
	production.competitionUntil = expectedFinish

	if (production.itemToProduce) {
		production.lastProducedItems.splice(0, 0, production.itemToProduce)
	}

	production.lastProducedItems = production.lastProducedItems
		.filter(arrayFilterUnique())
		.slice(0, 3) // The last 3 items are remembered for the votes

	production.itemsProducedPerMall = {}

	production.itemToProduce = decideVoteWinner(production.nextItemVote)

	if (production.itemToProduce) {
		delete production.nextItemVote[production.itemToProduce]
	}

	for (const o of Object.keys(production.nextItemVote)) {
		production.nextItemVote[o] = []
	}
}

function updateProductionProcessOfMall(mall: Mall, currentProduction: MallProduction, parts: readonly string[], now: number): void {
	const finishedParts = mall.production
		.filter(o => o.finishTimestamp < now)

	if (finishedParts.length === parts.length && parts.length > 0) {
		const mallId = mall.chat.id
		if (!currentProduction.itemsProducedPerMall[mallId]) {
			currentProduction.itemsProducedPerMall[mallId] = 0
		}

		currentProduction.itemsProducedPerMall[mallId]++

		mall.money += productionReward(parts.length)
		mall.production = []
	}
}

function removePartsNotInCurrentProduction(mall: Mall, parts: readonly string[]): void {
	mall.production = mall.production
		.filter(o => parts.includes(o.part))
}

function removePartsByLeftMembers(mall: Mall): void {
	mall.production = mall.production
		.filter(o => mall.member.includes(o.user))
}
