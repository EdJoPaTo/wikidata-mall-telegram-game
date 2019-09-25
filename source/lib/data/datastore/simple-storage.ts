import {MaybePromise} from './types'

export interface SimpleStorage<T> {
	delete(): MaybePromise<void>;
	get(): MaybePromise<T | undefined>;
	set(value: T): MaybePromise<void>;
}
