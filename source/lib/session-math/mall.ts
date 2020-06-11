import arrayFilterUnique from 'array-filter-unique'
import stringify from 'json-stable-stringify'

import {randomUniqueEntries} from '../js-helper/array'

import {DAY_IN_SECONDS} from '../math/timestamp-constants'

import {Mall, MallProduction} from '../types/mall'
import {MiniWikidataStore} from '../notification/types'
import {Persist} from '../types'

import {productionReward} from '../game-math/mall'

import {getProducts, getParts} from '../wikidata/production'

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

export async function before(persist: Persist, store: MiniWikidataStore, now: number): Promise<void> {
	if (!persist.mall) {
		return
	}

	const production = await mallProduction.get()
	const productionBefore = stringify(production)

	updateCurrentProduction(production, now)
	removeUnavailableVoteItems(production)
	fillupPossibleVoteItems(production)

	if (production.itemToProduce) {
		await store.preload([production.itemToProduce])
	}

	const parts = production.itemToProduce ? getParts(production.itemToProduce) : []
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
		.slice(0, 10) // The last items are remembered for the votes

	production.itemsProducedPerMall = {}

	production.itemToProduce = decideVoteWinner(production.nextItemVote)

	if (production.itemToProduce) {
		delete production.nextItemVote[production.itemToProduce]
	}

	for (const o of Object.keys(production.nextItemVote)) {
		// Keep but reset when someone voted. Remove when noone was interested
		if (production.nextItemVote[o].length > 0) {
			production.nextItemVote[o] = []
		} else {
			delete production.nextItemVote[o]
		}
	}
}

function removeUnavailableVoteItems(currentProduction: MallProduction): void {
	const allPossible = getProducts()
	const remove = Object.keys(currentProduction.nextItemVote)
		.filter(o => !allPossible.includes(o))

	for (const o of remove) {
		delete currentProduction.nextItemVote[o]
	}
}

function fillupPossibleVoteItems(currentProduction: MallProduction): void {
	const currentlyPossibleVoteEntries = Object.keys(currentProduction.nextItemVote)

	const fillAmount = 6 - currentlyPossibleVoteEntries.length

	const used: string[] = [
		...currentProduction.lastProducedItems,
		...currentlyPossibleVoteEntries
	]
	if (currentProduction.itemToProduce) {
		used.push(currentProduction.itemToProduce)
	}

	const fill = randomUniqueEntries(getProducts(), fillAmount, used)
	for (const o of fill) {
		currentProduction.nextItemVote[o] = []
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
