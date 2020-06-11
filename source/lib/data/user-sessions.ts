import LocalSession from 'telegraf-session-local'
import randomItem from 'random-item'

import {Session} from '../types'

interface SessionRawEntry {
	readonly user: number;
	readonly data: Session;
}

const localSession = new LocalSession<Session>({
	// Database name/path, where sessions will be located (default: 'sessions.json')
	database: 'persist/sessions.json',
	// Format of storage/database (default: JSON.stringify / JSON.parse)
	format: {
		serialize: object => JSON.stringify(object, null, '\t'),
		deserialize: string => JSON.parse(string)
	},
	getSessionKey: ctx => `${ctx.from.id}`
})

export function getRaw(): readonly SessionRawEntry[] {
	return (localSession.DB as any)
		.get('sessions').value()
		.map((o: {id: string; data: any}) => {
			const user = Number(o.id.split(':')[0])
			return {user, data: o.data}
		})
}

export function getUser(userId: number): any {
	return (localSession.DB as any)
		.get('sessions')
		.getById(`${userId}`)
		.get('data')
		.value() || {}
}

export function removeUser(userId: number): void {
	return (localSession.DB as any)
		.get('sessions')
		.removeById(String(userId))
}

export function getRandomUser(filter: (o: SessionRawEntry) => boolean = () => true): SessionRawEntry {
	const rawArray = getRaw()
		.filter(filter)
	return randomItem(rawArray)
}

export function middleware(): (ctx: any, next: any) => void {
	return localSession.middleware() as any
}
