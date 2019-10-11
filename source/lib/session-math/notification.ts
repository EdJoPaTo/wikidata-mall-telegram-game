import WikidataEntityStore from 'wikidata-entity-store'

import {Session, Persist} from '../types'

import * as userApplicants from '../data/applicants'
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

	const allApplicants = await userApplicants.getAll()
	const allShops = await userShops.getAll()
	const allSkills = await userSkills.getAll()

	for (const {user, data} of userSessions.getRaw()) {
		const applicants = allApplicants[user] || {
			list: [],
			timestamp: 0
		}
		const shops = allShops[user] || []
		const skills = allSkills[user] || {}
		const persist: Persist = {applicants, shops, skills}
		updateNotification(user, data, persist)
	}
}

export default function updateNotification(user: number, session: Session, persist: Persist): void {
	notificationManager!.clear(user)

	const notifications = generateNotifications(user, session, persist, wdEntityStore!)
	for (const n of notifications) {
		notificationManager!.add(user, n)
	}
}
