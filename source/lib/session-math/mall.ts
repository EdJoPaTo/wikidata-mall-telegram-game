import {Persist} from '../types'
import {Mall} from '../types/mall'

import * as mallProduction from '../data/mall-production'

export default async function manageMall(persist: Persist, now: number): Promise<void> {
	if (!persist.mall) {
		return
	}

	await updateMallProduction(persist.mall, now)
	removePartsByLeftMembers(persist.mall)
}

async function updateMallProduction(mall: Mall, now: number): Promise<void> {
	if (mall.productionFinishes) {
		if (mall.productionFinishes > now) {
			delete mall.partsProducedBy
		} else {
			const content = await mallProduction.get()
			if (content.competitionSince < now) {
				const mallId = mall.chat.id
				if (!content.itemsProducedPerMall[mallId]) {
					content.itemsProducedPerMall[mallId] = 0
				}

				content.itemsProducedPerMall[mallId]++
				await mallProduction.set(content)
			}

			delete mall.productionFinishes
		}
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
