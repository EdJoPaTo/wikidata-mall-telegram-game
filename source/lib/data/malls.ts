import {KeyValueInMemoryFiles} from '@edjopato/datastore'

import {Mall} from '../types/mall'

import {generatePersistMiddleware} from './persist-middleware'

console.time('load malls')
const data = new KeyValueInMemoryFiles<Mall | undefined>('persist/malls')
console.timeEnd('load malls')

export async function getAll(): Promise<Record<number, Mall>> {
	const result: Record<number, Mall> = {}
	for (const key of data.keys()) {
		result[Number(key)] = data.get(key)!
	}

	return result
}

export async function getMallIdOfUser(userId: number): Promise<number | undefined> {
	const dict = await getAll()
	for (const [key, mall] of Object.entries(dict)) {
		if (mall.member.includes(userId)) {
			return Number(key)
		}
	}

	return undefined
}

export async function get(mallId: number): Promise<Mall | undefined> {
	return data.get(String(mallId))
}

export async function set(mallId: number, mall: Mall): Promise<void> {
	return data.set(String(mallId), mall)
}

export async function remove(mallId: number): Promise<void> {
	data.delete(String(mallId))
}

export function middleware(): (ctx: any, next: () => Promise<void>) => Promise<void> {
	return generatePersistMiddleware('mall', data, async ctx => String(await getMallIdOfUser(ctx.from!.id)))
}
