type Dictionary<T> = {[key: string]: T}
type UnixTimestamp = number

export type AchievementSet = Dictionary<UnixTimestamp>

export interface Achievements {
	gameStarted: UnixTimestamp;
	moneyCollected?: AchievementSet;
	productsBought?: AchievementSet;
	productsInAssortment?: AchievementSet;
	shopsOpened?: AchievementSet;
}

export interface Stats {
	productsBought: number;
}