export type NotificationType =
	'employeeRetired' |
	'mallAttractionDisaster' |
	'mallProductionPartFinished' |
	'skillFinished' |
	'storeProductsEmpty'

type Url = string

export interface Notification {
	type: NotificationType;
	date: Date;
	text: string;
	photo?: Url;
}
