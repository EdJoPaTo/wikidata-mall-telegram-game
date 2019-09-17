import stringify from 'json-stable-stringify'

import {Session, Persist} from '../types'

import {Datastore} from './datastore'

interface Context {
	from: {
		id: number;
	};
	persist: Persist;
	session: Session;
}

const startTimestamp = Math.floor(Date.now() / 1000)

function generatePersistMiddlewareManually<Key extends keyof Persist>(
	key: Key,
	get: (playerId: number) => Promise<Persist[Key] | undefined>,
	save: (playerId: number, value: Persist[Key]) => Promise<void>
): (ctx: any, next: any) => Promise<void> {
	return async (ctx: Context, next) => {
		if (!ctx.persist) {
			const persist: Persist = {
				applicants: {
					list: [],
					timestamp: startTimestamp
				},
				shops: [],
				skills: {}
			}

			ctx.persist = persist
		}

		const content = await get(ctx.from.id)
		if (content) {
			ctx.persist[key] = content
		}

		const before = stringify(ctx.persist[key])
		await next()
		const after = stringify(ctx.persist[key])

		if (before !== after) {
			await save(ctx.from.id, ctx.persist[key])
		}
	}
}

export function generatePersistMiddleware<Key extends keyof Persist>(
	key: Key, datastore: Datastore<Persist[Key]>
): (ctx: any, next: any) => Promise<void> {
	return generatePersistMiddlewareManually(
		key,
		async playerId => datastore.get(String(playerId)),
		async (playerId, value) => datastore.set(String(playerId), value)
	)
}
