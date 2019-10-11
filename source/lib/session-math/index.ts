import WikidataEntityStore from 'wikidata-entity-store'

import {Session, Persist} from '../types'

import * as applicants from './applicants'
import * as income from './income'
import * as mall from './mall'
import notification from './notification'
import * as personal from './personal'
import * as skills from './skills'

export default function middleware(): (ctx: any, next: any) => Promise<void> {
	return async (ctx, next) => {
		const session = ctx.session as Session
		const persist = ctx.persist as Persist
		const store = ctx.wd.store as WikidataEntityStore
		const now = Math.floor(Date.now() / 1000)

		// TODO: remove migration
		if ((session as any).achievements) {
			session.gameStarted = (session as any).achievements.gameStarted
			delete (session as any).achievements
		}

		init(session, now)
		ensureStats(session)

		// TODO: remove migration
		if ((session as any).construction) {
			delete (session as any).construction
		}

		mall.startup(persist)
		skills.startup(session, persist)

		let nextCalculationUntilTimestamp
		do {
			nextCalculationUntilTimestamp = Math.min(
				now,
				mall.incomeUntil(persist),
				personal.incomeUntil(persist),
				skills.incomeUntil(session)
			)

			income.incomeLoop(session, persist, nextCalculationUntilTimestamp)

			mall.incomeLoop(persist, nextCalculationUntilTimestamp)
			personal.incomeLoop(persist, nextCalculationUntilTimestamp)
			skills.incomeLoop(session, persist, nextCalculationUntilTimestamp)
		} while (nextCalculationUntilTimestamp < now)

		applicants.before(session, persist, now)
		await mall.before(persist, store, now)

		await next()

		applicants.after(persist)

		notification(ctx.from.id, session, persist)
	}
}

function init(session: Session, now: number): void {
	if (!session.gameStarted) {
		session.gameStarted = now
	}

	if (!isFinite(session.money)) {
		session.money = 300
	}
}

function ensureStats(session: Session): void {
	if (!session.stats) {
		session.stats = {
			productsBought: 0
		}
	}
}
