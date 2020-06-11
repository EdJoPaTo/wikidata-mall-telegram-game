import {KeyValueInMemoryFiles} from '@edjopato/datastore'

import {Shop} from '../types/shop'

import {generatePersistMiddleware} from './persist-middleware'

console.time('load user shops')
const data = new KeyValueInMemoryFiles<Shop[]>('persist/shops')
console.timeEnd('load user shops')

export async function getAll(): Promise<Record<number, Shop[]>> {
	const result: Record<number, Shop[]> = {}
	for (const key of data.keys()) {
		result[Number(key)] = data.get(key)!
	}

	return result
}

export async function remove(userId: number): Promise<void> {
	data.delete(String(userId))
}

export function middleware(): (ctx: any, next: () => Promise<void>) => Promise<void> {
	return generatePersistMiddleware('shops', data, ctx => String(ctx.from!.id))
}
