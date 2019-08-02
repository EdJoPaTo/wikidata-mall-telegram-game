import {Skills} from '../types/skills'

import {InMemoryFiles} from './datastore'
import {generatePersistMiddleware} from './persist-middleware'

type Dictionary<T> = {[key: string]: T}

console.time('load user skills')
const data = new InMemoryFiles<Skills>('persist/skills')
console.timeEnd('load user skills')

export async function getAllSkills(): Promise<Dictionary<Skills>> {
	return data.entries()
}

export function middleware(): (ctx: any, next: any) => Promise<void> {
	return generatePersistMiddleware('skills', data)
}
