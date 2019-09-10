import {readFileSync, unlinkSync, existsSync} from 'fs'

import writeJsonFile from 'write-json-file'

export class InMemoryFile<T> {
	private _content: T | undefined

	constructor(
		private readonly filepath: string
	) {
		if (existsSync(this.filepath)) {
			const raw = readFileSync(this.filepath, 'utf8')
			const json = JSON.parse(raw)
			this._content = json
		}
	}

	async get(): Promise<T | undefined> {
		return this._content
	}

	async set(value: T): Promise<void> {
		this._content = value
		await writeJsonFile(this.filepath, value, {sortKeys: true})
	}

	async delete(): Promise<void> {
		this._content = undefined
		if (existsSync(this.filepath)) {
			unlinkSync(this.filepath)
		}
	}
}
