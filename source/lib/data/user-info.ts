import {KeyValueInMemoryFiles} from '@edjopato/datastore'

import {Context as TelegrafContext, Middleware} from 'telegraf'
import {User} from 'typegram'
import stringify from 'json-stable-stringify'

console.time('load user info')
const data = new KeyValueInMemoryFiles<User>('persist/user-info')
console.timeEnd('load user info')

export async function get(id: number): Promise<User | undefined> {
	return data.get(String(id))
}

export async function getAll(): Promise<Record<number, User>> {
	const result: Record<number, User> = {}
	for (const key of data.keys()) {
		result[Number(key)] = data.get(key)!
	}

	return result
}

export async function remove(userId: number): Promise<void> {
	data.delete(String(userId))
}

export function middleware(): Middleware<TelegrafContext> {
	return async (ctx, next) => {
		if (ctx.from) {
			const old = data.get(String(ctx.from.id))
			const oldString = stringify(old)
			const current = stringify(ctx.from)
			if (oldString !== current) {
				await data.set(String(ctx.from.id), ctx.from)
			}
		}

		return next()
	}
}
