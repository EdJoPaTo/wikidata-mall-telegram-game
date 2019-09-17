import {Applicants} from '../types/people'

import {Dictionary} from '../js-helper/dictionary'

import {InMemoryFiles} from './datastore'
import {generatePersistMiddleware} from './persist-middleware'

console.time('load user applicants')
const data = new InMemoryFiles<Applicants>('persist/applicants')
console.timeEnd('load user applicants')

export async function getAll(): Promise<Dictionary<Applicants>> {
	return data.entries()
}

export async function remove(userId: number): Promise<void> {
	return data.delete(String(userId))
}

export function middleware(): (ctx: any, next: any) => Promise<void> {
	return generatePersistMiddleware('applicants', data)
}