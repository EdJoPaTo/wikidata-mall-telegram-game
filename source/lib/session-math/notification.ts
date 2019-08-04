import WikidataEntityStore from 'wikidata-entity-store'

import {Session, Persist} from '../types'

import * as userSessions from '../data/user-sessions'
import * as userShops from '../data/shops'
import * as userSkills from '../data/skills'

import {generateNotifications} from '../notification/generate'
import {NotificationManager} from '../notification/manager'

let notificationManager: NotificationManager | undefined
let wdEntityStore: WikidataEntityStore | undefined

export async function initialize(notififyManager: NotificationManager, entityStore: WikidataEntityStore): Promise<void> {
	notificationManager = notififyManager
	wdEntityStore = entityStore

	const allShops = await userShops.getAllShops()
	const allSkills = await userSkills.getAllSkills()

	for (const {user, data} of userSessions.getRaw()) {
		const shops = allShops[user] || []
		const skills = allSkills[user]
		const persist: Persist = {shops, skills}
		updateNotification(user, data, persist)
	}
}

export default function updateNotification(user: number, session: Session, persist: Persist): void {
	notificationManager!.clear(user)

	const notifications = generateNotifications(session, persist, wdEntityStore!)
	for (const n of notifications) {
		notificationManager!.add(user, n)
	}
}
