import {Session, Persist} from '../types'

import achievements from './achievements'
import applicants from './applicants'
import income from './income'
import personal from './personal'
import skills from './skills'

export default function middleware(): (ctx: any, next: any) => Promise<void> {
	return async (ctx, next) => {
		const session = ctx.session as Session
		const persist = ctx.persist as Persist
		const now = Date.now() / 1000

		init(session)
		ensureStats(session)

		applicants(session, persist, now)
		personal(session, persist, now)

		income(session, persist, now)

		skills(session, persist, now)

		await next()

		achievements(session, persist, now)
	}
}

function init(session: Session): void {
	const {money} = session

	if (!isFinite(money)) {
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
