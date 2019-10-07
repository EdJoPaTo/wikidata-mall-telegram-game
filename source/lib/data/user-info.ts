import {KeyValueStorage, KeyValueInMemoryFiles} from '@edjopato/datastore'

import {ContextMessageUpdate, Middleware} from 'telegraf'
import {User} from 'telegram-typings'
import stringify from 'json-stable-stringify'

console.time('load user info')
const data: KeyValueStorage<User> = new KeyValueInMemoryFiles<User>('persist/user-info')
console.timeEnd('load user info')

export async function get(id: number): Promise<User | undefined> {
	return data.get(String(id))
}

export async function getAll(): Promise<Record<number, User>> {
	return data.entries()
}

export async function remove(userId: number): Promise<void> {
	return data.delete(String(userId))
}

export function middleware(): Middleware<ContextMessageUpdate> {
	return async (ctx, next) => {
		if (ctx.from) {
			const old = await data.get(String(ctx.from.id))
			const oldString = stringify(old)
			const current = stringify(ctx.from)
			if (oldString !== current) {
				await data.set(String(ctx.from.id), ctx.from)
			}
		}

		return next && next()
	}
}
