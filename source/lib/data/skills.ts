import {KeyValueInMemoryFiles} from '@edjopato/datastore'

import {Skills} from '../types/skills'

import {generatePersistMiddleware} from './persist-middleware'

console.time('load user skills')
const data = new KeyValueInMemoryFiles<Skills>('persist/skills')
console.timeEnd('load user skills')

export async function getAll(): Promise<Record<number, Skills>> {
	const result: Record<number, Skills> = {}
	for (const key of data.keys()) {
		result[Number(key)] = data.get(key)!
	}

	return result
}

export async function remove(userId: number): Promise<void> {
	data.delete(String(userId))
}

export function middleware(): (ctx: any, next: () => Promise<void>) => Promise<void> {
	return generatePersistMiddleware('skills', data, ctx => String(ctx.from!.id))
}
