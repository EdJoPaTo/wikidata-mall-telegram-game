import {Persist} from '../types'
import {Mall} from '../types/mall'

import {DAY_IN_SECONDS} from '../math/timestamp-constants'

import {productionReward} from '../game-math/mall'

import * as mallProduction from '../data/mall-production'

const PRODUCTION_TIMESPAN_IN_SECONDS = DAY_IN_SECONDS

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

export async function before(persist: Persist, now: number): Promise<void> {
	if (!persist.mall) {
		return
	}

	await updateCurrentProduction(now)
	await updateProductionProcessOfMall(persist.mall, now)
	removePartsByLeftMembers(persist.mall)
}

async function updateCurrentProduction(now: number): Promise<void> {
	const content = await mallProduction.get()
	const expectedFinish = (Math.ceil(now / PRODUCTION_TIMESPAN_IN_SECONDS) * PRODUCTION_TIMESPAN_IN_SECONDS) - 1

	if (content.competitionUntil !== expectedFinish) {
		const expectedStart = Math.floor(now / PRODUCTION_TIMESPAN_IN_SECONDS) * PRODUCTION_TIMESPAN_IN_SECONDS
		content.competitionSince = expectedStart
		content.competitionUntil = expectedFinish

		// TODO: handle winner in some way
		content.itemsProducedPerMall = {}

		// TODO: define new item to produce from the vote

		await mallProduction.set(content)
	}
}

async function updateProductionProcessOfMall(mall: Mall, now: number): Promise<void> {
	if (mall.partsProducedBy && mall.productionFinishes && mall.productionFinishes <= now) {
		const content = await mallProduction.get()
		if (content.competitionSince < now) {
			const mallId = mall.chat.id
			if (!content.itemsProducedPerMall[mallId]) {
				content.itemsProducedPerMall[mallId] = 0
			}

			content.itemsProducedPerMall[mallId]++
			await mallProduction.set(content)
		}

		const participants = Object.keys(mall.partsProducedBy).length
		mall.money += productionReward(participants)

		delete mall.productionFinishes
		delete mall.partsProducedBy
	}
}

function removePartsByLeftMembers(mall: Mall): void {
	if (mall.partsProducedBy) {
		const removeKeys = Object.keys(mall.partsProducedBy)
			.filter(o => !mall.member.includes(mall.partsProducedBy![o]))

		for (const key of removeKeys) {
			delete mall.partsProducedBy[key]
		}
	}
}
