export type NotificationType =
	'employeeRetired' |
	'mallAttractionDisaster' |
	'mallProductionPartFinished' |
	'skillFinished' |
	'storeProductsEmpty'

type Url = string

export interface Notification {
	readonly type: NotificationType;
	readonly date: Readonly<Date>;
	readonly text: string;
	readonly photo?: Url;
}
