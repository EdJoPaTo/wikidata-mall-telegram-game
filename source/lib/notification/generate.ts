import WikidataEntityReader from 'wikidata-entity-reader'
import WikidataEntityStore from 'wikidata-entity-store'

import {Notification} from '../types/notification'
import {Session, Persist} from '../types'
import {Shop} from '../types/shop'

import {shopProductsEmptyTimestamps} from '../game-math/shop-time'

import {nameMarkdown} from '../interface/person'
import {skillFinishedNotificationString} from '../interface/skill'
import {allEmployees} from '../game-math/personal'

export function generateNotifications(session: Session, persist: Persist, entityStore: WikidataEntityStore): readonly Notification[] {
	const {__wikibase_language_code: locale} = session

	return [
		...generateProductsEmpty(persist.shops, entityStore, locale),
		...generateShopsPersonalRetirement(session, persist.shops, entityStore),
		...generateSkill(session, entityStore)
	]
}

function generateProductsEmpty(shops: readonly Shop[], entityStore: WikidataEntityStore, locale: string | undefined): readonly Notification[] {
	return shops.flatMap(s => generateProductsEmptyShop(s, entityStore, locale))
}

function generateProductsEmptyShop(shop: Shop, entityStore: WikidataEntityStore, locale: string | undefined): readonly Notification[] {
	const emptyTimestamps = shopProductsEmptyTimestamps(shop)
	const max = Math.max(...emptyTimestamps)
	if (max < 1) {
		return []
	}

	const text = new WikidataEntityReader(entityStore.entity(shop.id), locale).label()

	return [{
		type: 'storeProductsEmpty',
		date: new Date(max * 1000),
		text
	}]
}

function generateShopsPersonalRetirement(session: Session, shops: readonly Shop[], entityStore: WikidataEntityStore): readonly Notification[] {
	return shops.flatMap(shop => generateShopPersonalRetirement(session, shop, entityStore))
}

function generateShopPersonalRetirement(session: Session, shop: Shop, entityStore: WikidataEntityStore): readonly Notification[] {
	const {__wikibase_language_code: locale} = session

	const shopText = new WikidataEntityReader(entityStore.entity(shop.id), locale).label()

	const employees = allEmployees(shop.personal)
	const result: Notification[] = employees
		.map((o): Notification => ({
			type: 'employeeRetired',
			date: new Date(o.retirementTimestamp * 1000),
			text: `${nameMarkdown(o.name)}\n${shopText}`
		}))

	return result
}

function generateSkill(session: Session, entityStore: WikidataEntityStore): readonly Notification[] {
	const {skillQueue, __wikibase_language_code: locale} = session
	if (!skillQueue) {
		return []
	}

	const result: Notification[] = skillQueue
		.map((o): Notification => ({
			type: 'skillFinished',
			date: new Date(o.endTimestamp * 1000),
			text: skillFinishedNotificationString(o, entityStore, locale)
		}))

	return result
}
