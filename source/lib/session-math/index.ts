import {Middleware} from 'telegraf'

import {Context, Session} from '../types'

import * as applicants from './applicants'
import * as income from './income'
import * as mall from './mall'
import notification from './notification'
import * as personal from './personal'
import * as skills from './skills'

export default function middleware(): Middleware<Context> {
	return async (ctx, next) => {
		const now = Math.floor(Date.now() / 1000)

		// TODO: remove migration
		if ((ctx.session as any).achievements) {
			ctx.session.gameStarted = (ctx.session as any).achievements.gameStarted
			delete (ctx.session as any).achievements
		}

		init(ctx.session, now)
		ensureStats(ctx.session)

		// TODO: remove migration
		if ((ctx.session as any).construction) {
			delete (ctx.session as any).construction
		}

		mall.startup(ctx.persist)
		skills.startup(ctx.session, ctx.persist)

		let nextCalculationUntilTimestamp
		do {
			nextCalculationUntilTimestamp = Math.min(
				now,
				mall.incomeUntil(ctx.persist),
				personal.incomeUntil(ctx.persist),
				skills.incomeUntil(ctx.session)
			)

			income.incomeLoop(ctx.session, ctx.persist, nextCalculationUntilTimestamp)

			mall.incomeLoop(ctx.persist, nextCalculationUntilTimestamp)
			personal.incomeLoop(ctx.persist, nextCalculationUntilTimestamp)
			skills.incomeLoop(ctx.session, ctx.persist, nextCalculationUntilTimestamp)
		} while (nextCalculationUntilTimestamp < now)

		applicants.before(ctx.session, ctx.persist, now)
		await mall.before(ctx.persist, ctx.wd, now)

		await next()

		await notification(ctx.from!.id, ctx.session, ctx.persist)
	}
}

function init(session: Session, now: number): void {
	if (!session.gameStarted) {
		session.gameStarted = now
	}

	if (!Number.isFinite(session.money)) {
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
