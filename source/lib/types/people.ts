type QNumber = string
type UnixTimestamp = number

interface BasicPerson {
	name: Name;
	type: PersonType;
	hobby: QNumber;
	employmentProtectionUntil?: UnixTimestamp;
	retirementTimestamp: UnixTimestamp;
	talents: Talents;
}

export interface SimpleWorker extends BasicPerson {
	type: Exclude<PersonType, 'refined'>;
}

export interface RefinedWorker extends BasicPerson {
	type: 'refined';
	graduation?: UnixTimestamp;
}

export type Person = SimpleWorker | RefinedWorker

export interface Name {
	given: string;
	family: string;
}

export type PersonType = 'refined' | 'temporary' | 'robot' | 'alien'
export type RefinedState = 'toddler' | 'student' | 'finished'

export interface Talents {
	purchasing: number;
	selling: number;
	storage: number;
}

export type TalentName = keyof Talents
export const TALENTS: TalentName[] = ['purchasing', 'selling', 'storage']

export interface Applicants {
	list: Person[];
	timestamp: UnixTimestamp;
}
