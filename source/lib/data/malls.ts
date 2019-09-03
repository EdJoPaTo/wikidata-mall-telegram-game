import {Mall} from '../types/mall'

import {InMemoryFiles} from './datastore'

type Dictionary<T> = {[key: string]: T}

console.time('load malls')
const data = new InMemoryFiles<Mall>('persist/malls')
console.timeEnd('load malls')

export async function getAllMalls(): Promise<Dictionary<Mall>> {
	return data.entries()
}

export async function getMallIdOfUser(userId: number): Promise<number | undefined> {
	const dict = await data.entries()
	for (const key of Object.keys(dict)) {
		const mall = dict[key]
		if (mall.member.includes(userId)) {
			return Number(key)
		}
	}

	return undefined
}

export async function getMallOfUser(userId: number): Promise<Mall | undefined> {
	for (const mall of Object.values(await data.entries())) {
		if (mall.member.includes(userId)) {
			return mall
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
