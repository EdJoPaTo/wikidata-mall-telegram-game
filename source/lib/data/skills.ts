import {KeyValueStorage, KeyValueInMemoryFiles} from '@edjopato/datastore'

import {Skills} from '../types/skills'

import {generatePersistMiddleware} from './persist-middleware'

console.time('load user skills')
const data: KeyValueStorage<Skills> = new KeyValueInMemoryFiles<Skills>('persist/skills')
console.timeEnd('load user skills')

export async function getAllSkills(): Promise<Record<string, Skills>> {
	return data.entries()
}

export async function remove(userId: number): Promise<void> {
	return data.delete(String(userId))
}

export function middleware(): (ctx: any, next: any) => Promise<void> {
	return generatePersistMiddleware('skills', data, ctx => String(ctx.from.id))
}
