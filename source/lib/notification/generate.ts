import {Mall} from '../types/mall'
import {Notification} from '../types/notification'
import {Session, Persist} from '../types'
import {Shop} from '../types/shop'

import {allEmployees} from '../game-math/personal'
import {attractionCustomerBonus} from '../game-math/mall'
import {shopProductsEmptyTimestamps} from '../game-math/shop-time'

import {getAttractionHeight} from '../game-logic/mall-attraction'

import {attractionDisasterNotification, productionPartNotificationString} from '../interface/mall'
import {nameMarkdown} from '../interface/person'
import {skillFinishedNotificationString} from '../interface/skill'

import {MiniWikidataStore} from './types'

export async function generateNotifications(userId: number, session: Session, persist: Persist, entityStore: MiniWikidataStore): Promise<readonly Notification[]> {
	const locale = session.__wikibase_language_code ?? 'en'

	const partials = await Promise.all([
		generateProductsEmpty(persist.shops, persist.mall, entityStore, locale),
		generateShopsPersonalRetirement(persist.shops, entityStore, locale),
		generateMallProductionPartFinished(userId, persist.mall, entityStore, locale),
		generateMallAttractionDestruction(persist.mall, entityStore, locale),
		generateSkill(session, entityStore, locale)
	])

	return partials.flat()
}

async function generateProductsEmpty(shops: readonly Shop[], mall: Mall | undefined, entityStore: MiniWikidataStore, locale: string): Promise<readonly Notification[]> {
	const attractionHeight = getAttractionHeight(mall?.attraction)
	const bonus = attractionCustomerBonus(attractionHeight)
	const all = await Promise.all(shops.map(async s => generateProductsEmptyShop(s, bonus, entityStore, locale)))
	return all.flat()
}

async function generateProductsEmptyShop(shop: Shop, attractionCustomerBonus: number, entityStore: MiniWikidataStore, locale: string): Promise<readonly Notification[]> {
	const emptyTimestamps = shopProductsEmptyTimestamps(shop, attractionCustomerBonus)
	const max = Math.max(...emptyTimestamps)
	if (max < 1) {
		return []
	}

	const text = await entityStore.reader(shop.id, locale).then(r => r.label())

	return [{
		type: 'storeProductsEmpty',
		date: new Date(max * 1000),
		text
	}]
}

async function generateShopsPersonalRetirement(shops: readonly Shop[], entityStore: MiniWikidataStore, locale: string): Promise<readonly Notification[]> {
	const all = await Promise.all(shops.map(async shop => generateShopPersonalRetirement(shop, entityStore, locale)))
	return all.flat()
}

async function generateShopPersonalRetirement(shop: Shop, entityStore: MiniWikidataStore, locale: string): Promise<readonly Notification[]> {
	const shopText = await entityStore.reader(shop.id, locale ?? 'en').then(r => r.label())

	const employees = allEmployees(shop.personal)
	const result: Notification[] = employees
		.map((o): Notification => ({
			type: 'employeeRetired',
			date: new Date(o.retirementTimestamp * 1000),
			text: `${nameMarkdown(o.name)}\n${shopText}`
		}))

	return result
}

async function generateMallAttractionDestruction(mall: Mall | undefined, entityStore: MiniWikidataStore, locale: string): Promise<readonly Notification[]> {
	if (!mall || !mall.attraction) {
		return []
	}

	return [{
		type: 'mallAttractionDisaster',
		date: new Date(mall.attraction.disasterTimestamp * 1000),
		...await attractionDisasterNotification(mall.attraction, entityStore, locale)
	}]
}

async function generateMallProductionPartFinished(userId: number, mall: Mall | undefined, entityStore: MiniWikidataStore, locale: string): Promise<readonly Notification[]> {
	if (!mall) {
		return []
	}

	return Promise.all(mall.production
		.filter(o => o.user === userId)
		.map(async (o): Promise<Notification> => ({
			type: 'mallProductionPartFinished',
			date: new Date(o.finishTimestamp * 1000),
			text: await productionPartNotificationString(o, entityStore, locale)
		}))
	)
}

async function generateSkill(session: Session, entityStore: MiniWikidataStore, locale: string): Promise<readonly Notification[]> {
	const {skillQueue} = session
	if (!skillQueue) {
		return []
	}

	const result: Notification[] = await Promise.all(skillQueue
		.map(async (o): Promise<Notification> => ({
			type: 'skillFinished',
			date: new Date(o.endTimestamp * 1000),
			text: await skillFinishedNotificationString(o, entityStore, locale)
		}))
	)

	return result
}
