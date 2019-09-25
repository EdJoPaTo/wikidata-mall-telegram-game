import {mkdirSync, readdirSync, readFileSync, unlinkSync, existsSync} from 'fs'

import writeJsonFile from 'write-json-file'

import {Dictionary} from './types'
import {KeyValueStorage} from './key-value-storage'

export class PerKeyInMemoryFile<T> implements KeyValueStorage<T> {
	private _inMemoryStorage: Dictionary<T> = {}

	constructor(
		private readonly _directory: string
	) {
		mkdirSync(_directory, {recursive: true})

		const entries = this._listFromFS()
		for (const e of entries) {
			this._inMemoryStorage[e] = this._getFromFS(e)
		}
	}

	entries(): Dictionary<T> {
		return this._inMemoryStorage
	}

	keys(): readonly string[] {
		return Object.keys(this._inMemoryStorage)
	}

	get(key: string): T | undefined {
		return this._inMemoryStorage[key]
	}

	async set(key: string, value: T): Promise<void> {
		this._inMemoryStorage[key] = value
		await writeJsonFile(this._pathOfKey(key), value, {sortKeys: true})
	}

	delete(key: string): void {
		delete this._inMemoryStorage[key]
		if (existsSync(this._pathOfKey(key))) {
			unlinkSync(this._pathOfKey(key))
		}
	}

	private _pathOfKey(key: string): string {
		return `${this._directory}/${key}.json`
	}

	private _listFromFS(): readonly string[] {
		return readdirSync(this._directory)
			.map(o => o.replace('.json', ''))
	}

	private _getFromFS(key: string): T {
		const content = readFileSync(this._pathOfKey(key), 'utf8')
		const json = JSON.parse(content)
		return json
	}
}
