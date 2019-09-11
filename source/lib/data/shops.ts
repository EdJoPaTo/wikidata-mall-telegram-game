import {Shop} from '../types/shop'

import {InMemoryFiles} from './datastore'
import {generatePersistMiddleware} from './persist-middleware'

type Dictionary<T> = {[key: string]: T}

console.time('load user shops')
const data = new InMemoryFiles<Shop[]>('persist/shops')
console.timeEnd('load user shops')

export async function getAllShops(): Promise<Dictionary<Shop[]>> {
	return data.entries()
}

export async function remove(userId: number): Promise<void> {
	return data.delete(String(userId))
}

export function middleware(): (ctx: any, next: any) => Promise<void> {
	return generatePersistMiddleware('shops', data, ctx => String(ctx.from.id))
}
