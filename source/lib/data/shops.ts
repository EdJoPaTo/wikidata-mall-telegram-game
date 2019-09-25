import {Shop} from '../types/shop'

import {Dictionary, KeyValueStorage, PerKeyInMemoryFile} from './datastore'
import {generatePersistMiddleware} from './persist-middleware'

console.time('load user shops')
const data: KeyValueStorage<Shop[]> = new PerKeyInMemoryFile<Shop[]>('persist/shops')
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
