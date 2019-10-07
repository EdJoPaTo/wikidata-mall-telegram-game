import {KeyValueStorage, KeyValueInMemoryFiles} from '@edjopato/datastore'

import {Mall} from '../types/mall'

import {generatePersistMiddleware} from './persist-middleware'

console.time('load malls')
const data: KeyValueStorage<Mall> = new KeyValueInMemoryFiles<Mall>('persist/malls')
console.timeEnd('load malls')

export async function getAll(): Promise<Record<number, Mall>> {
	return data.entries()
}

async function getMallIdOfUser(userId: number): Promise<number | undefined> {
	const dict = await data.entries()
	for (const key of Object.keys(dict)) {
		const mall = dict[key]
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
	return data.delete(String(mallId))
}

export function middleware(): (ctx: any, next: any) => Promise<void> {
	return generatePersistMiddleware('mall', data, async ctx => String(await getMallIdOfUser(ctx.from.id)))
}
