import WikidataEntityReader from 'wikidata-entity-reader'
import WikidataEntityStore from 'wikidata-entity-store'

import {Mall} from '../types/mall'
import {Notification} from '../types/notification'
import {Person, RefinedWorker} from '../types/people'
import {Session, Persist} from '../types'
import {Shop} from '../types/shop'

import {allEmployees} from '../game-math/personal'
import {attractionCustomerBonus} from '../game-math/mall'
import {shopProductsEmptyTimestamps} from '../game-math/shop-time'

import {getAttractionHeight} from '../game-logic/mall-attraction'

import {nameMarkdown} from '../interface/person'
import {skillFinishedNotificationString} from '../interface/skill'

export function generateNotifications(session: Session, persist: Persist, entityStore: WikidataEntityStore): readonly Notification[] {
	const {__wikibase_language_code: locale} = session

	return [
		...generateProductsEmpty(persist.shops, persist.mall, entityStore, locale),
		...generateShopsPersonalRetirement(session, persist.shops, entityStore),
		...generateApplicantGraduation(persist.applicants.list),
		...generateSkill(session, entityStore)
	]
}

function generateProductsEmpty(shops: readonly Shop[], mall: Mall | undefined, entityStore: WikidataEntityStore, locale: string | undefined): readonly Notification[] {
	const attractionHeight = getAttractionHeight(mall && mall.attraction)
	const bonus = attractionCustomerBonus(attractionHeight)
	return shops.flatMap(s => generateProductsEmptyShop(s, bonus, entityStore, locale))
}

function generateProductsEmptyShop(shop: Shop, attractionCustomerBonus: number, entityStore: WikidataEntityStore, locale: string | undefined): readonly Notification[] {
	const emptyTimestamps = shopProductsEmptyTimestamps(shop, attractionCustomerBonus)
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

function generateApplicantGraduation(applicants: readonly Person[]): readonly Notification[] {
	const refined = applicants
		.filter(o => o.type === 'refined') as RefinedWorker[]

	const result = refined
		.filter(o => o.graduation)
		.map((o): Notification => ({
			type: 'applicantGraduated',
			date: new Date(o.graduation! * 1000),
			text: `${nameMarkdown(o.name)}`
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
