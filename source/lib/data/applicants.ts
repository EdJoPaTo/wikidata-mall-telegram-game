import {KeyValueInMemoryFiles} from '@edjopato/datastore'

import {Applicants} from '../types/people'

import {generatePersistMiddleware} from './persist-middleware'

console.time('load user applicants')
const data = new KeyValueInMemoryFiles<Applicants>('tmp/applicants')
console.timeEnd('load user applicants')

export async function getAll(): Promise<Record<number, Applicants>> {
	const result: Record<number, Applicants> = {}
	for (const key of data.keys()) {
		result[Number(key)] = data.get(key)!
	}

	return result
}

export async function remove(userId: number): Promise<void> {
	data.delete(String(userId))
}

export function middleware(): (ctx: any, next: any) => Promise<void> {
	return generatePersistMiddleware('applicants', data, ctx => String(ctx.from.id))
}
