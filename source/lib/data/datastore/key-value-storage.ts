import {Dictionary, MaybePromise} from './types'

export interface KeyValueStorage<T> {
	delete(key: string): MaybePromise<void>;
	entries(): MaybePromise<Dictionary<T>>;
	get(key: string): MaybePromise<T | undefined>;
	keys(): MaybePromise<readonly string[]>;
	set(key: string, value: T): MaybePromise<void>;
}
