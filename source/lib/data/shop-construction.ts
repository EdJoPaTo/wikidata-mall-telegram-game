import {Construction} from '../types/shop'

import {InMemoryFile} from './datastore/in-memory-file'

const data = new InMemoryFile<Construction>('persist/shop-construction.json')

export default data

export async function get(): Promise<Construction | undefined> {
	return data.get()
}

export async function set(construction: Construction): Promise<void> {
	return data.set(construction)
}
