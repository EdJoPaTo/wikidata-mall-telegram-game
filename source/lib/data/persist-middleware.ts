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
	getIdFromCtx: (ctx: Context) => string | Promise<string>,
	get: (ctx: string) => Promise<Persist[Key] | undefined>,
	save: (ctx: string, value: Persist[Key]) => Promise<void>
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

		const entryId = await getIdFromCtx(ctx)
		const content = await get(entryId)
		if (content) {
			ctx.persist[key] = content
		}

		const before = stringify(ctx.persist[key])
		await next()
		const after = stringify(ctx.persist[key])

		if (before !== after) {
			await save(entryId, ctx.persist[key])
		}
	}
}

export function generatePersistMiddleware<Key extends keyof Persist>(
	key: Key, datastore: Datastore<Persist[Key]>, getIdFunc: (ctx: Context) => string | Promise<string>
): (ctx: any, next: any) => Promise<void> {
	return generatePersistMiddlewareManually(
		key,
		getIdFunc,
		async id => datastore.get(id),
		async (id, value) => datastore.set(id, value)
	)
}
