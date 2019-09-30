import {KeyValueStorage, KeyValueInMemoryFiles} from '@edjopato/datastore'

import {Applicants} from '../types/people'

import {generatePersistMiddleware} from './persist-middleware'

console.time('load user applicants')
const data: KeyValueStorage<Applicants> = new KeyValueInMemoryFiles<Applicants>('persist/applicants')
console.timeEnd('load user applicants')

export async function getAll(): Promise<Record<string, Applicants>> {
	return data.entries()
}

export async function remove(userId: number): Promise<void> {
	return data.delete(String(userId))
}

export function middleware(): (ctx: any, next: any) => Promise<void> {
	return generatePersistMiddleware('applicants', data, ctx => String(ctx.from.id))
}
