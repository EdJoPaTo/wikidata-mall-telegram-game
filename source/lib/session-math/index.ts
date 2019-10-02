import {Session, Persist} from '../types'

import * as applicants from './applicants'
import income from './income'
import mall from './mall'
import notification from './notification'
import * as personal from './personal'
import skills from './skills'

export default function middleware(): (ctx: any, next: any) => Promise<void> {
	return async (ctx, next) => {
		const session = ctx.session as Session
		const persist = ctx.persist as Persist
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

		applicants.before(session, persist, now)
		await mall(persist, now)
		personal.before(persist, now)

		income(session, persist, now)

		skills(session, persist, now)

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
