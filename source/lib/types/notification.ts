export interface Notification {
	type: 'skillFinished' | 'storeProductsEmpty' | 'employeeRetired' | 'applicantGraduated' | 'mallAttractionDisaster';
	date: Date;
	text: string;
}
