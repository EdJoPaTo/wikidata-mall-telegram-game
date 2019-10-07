import * as userInfo from '../data/user-info'
import * as userSessions from '../data/user-sessions'
import * as userShops from '../data/shops'
import * as userSkills from '../data/skills'

import {DAY_IN_SECONDS} from '../math/timestamp-constants'

import {lastTimeActive} from '../game-math/shop-time'

export async function removeOld(): Promise<void> {
	const now = Date.now() / 1000
	try {
		await removeOldUsers(now)
	} catch (error) {
		console.error('removeOld Error', error)
	}
}

async function removeOldUsers(now: number): Promise<void> {
	console.time('removeOldUsers')
	const allShops = await userShops.getAll()
	const minTimestamp = now - (DAY_IN_SECONDS * 90)

	const toDelete = Object.keys(allShops)
		.map(o => Number(o))
		.filter(o => {
			const active = lastTimeActive(allShops[o])
			return isFinite(active) && active < minTimestamp
		})

	console.timeLog('removeOldUsers', toDelete.length, toDelete)

	await Promise.all(toDelete.map(async o => userInfo.remove(o)))
	await Promise.all(toDelete.map(async o => userShops.remove(o)))
	await Promise.all(toDelete.map(async o => userSkills.remove(o)))

	for (const userId of toDelete) {
		userSessions.removeUser(userId)
	}

	console.timeEnd('removeOldUsers')
}
