export type NotificationType =
	'applicantGraduated' |
	'employeeRetired' |
	'mallAttractionDisaster' |
	'mallProductionPartFinished' |
	'skillFinished' |
	'storeProductsEmpty'

export interface Notification {
	type: NotificationType;
	date: Date;
	text: string;
}
