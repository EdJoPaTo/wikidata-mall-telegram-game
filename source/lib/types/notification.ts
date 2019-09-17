export interface Notification {
	type: 'skillFinished' | 'storeProductsEmpty' | 'employeeRetired' | 'applicantGraduated';
	date: Date;
	text: string;
}
