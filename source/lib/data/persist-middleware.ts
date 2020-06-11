import stringify from 'json-stable-stringify'

import {Context, Persist} from '../types'

const startTimestamp = Math.floor(Date.now() / 1000)

type MaybePromise<T> = T | Promise<T>

interface Store<T> {
	get: (key: string) => MaybePromise<T | undefined>;
	set: (ctx: string, value: T) => Promise<void>;
}

function generatePersistMiddlewareManually<Key extends keyof Persist>(
	key: Key,
	getIdFromCtx: (ctx: Context) => string | Promise<string>,
	get: (key: string) => Promise<Persist[Key] | undefined>,
	save: (key: string, value: Persist[Key]) => Promise<void>
): (ctx: Context, next: () => Promise<void>) => Promise<void> {
	return async (ctx: Context, next) => {
		if (!ctx.persist) {
			const persist: Persist = {
				applicants: {
					list: [],
					timestamp: startTimestamp
				},
				shops: [],
				skills: {}
			};

			(ctx as any).persist = persist
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
	key: Key, datastore: Store<Persist[Key]>, getIdFunc: (ctx: Context) => string | Promise<string>
): (ctx: Context, next: () => Promise<void>) => Promise<void> {
	return generatePersistMiddlewareManually(
		key,
		getIdFunc,
		async id => datastore.get(id),
		async (id, value) => datastore.set(id, value)
	)
}
