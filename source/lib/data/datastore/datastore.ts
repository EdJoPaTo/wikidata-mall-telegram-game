type Dictionary<T> = {[key: string]: T}

type MaybePromise<T> = T | Promise<T>

export interface Datastore<T> {
	delete(key: string): MaybePromise<void>;
	entries(): MaybePromise<Dictionary<T>>;
	get(key: string): MaybePromise<T | undefined>;
	keys(): MaybePromise<readonly string[]>;
	set(key: string, value: T): MaybePromise<void>;
}
