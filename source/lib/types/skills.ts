type QNumber = string
type UnixTimestamp = number

export type SkillCategorySet = Record<QNumber, number>

/**
 * Contains Skill Levels
 */
export interface SimpleSkills {
	/**
	 * Increase number of applicant seats available
	 */
	applicantSeats?: number;

	/**
	 * Speed increase of incoming applicants
	 */
	applicantSpeed?: number;

	/**
	 * Improves the timespan until people retire
	 */
	healthCare?: number;

	/**
	 * Improves the amount of products possible per shop
	 */
	logistics?: number;

	/**
	 * Improve storage capacity for the category
	 */
	machinePress?: number;

	/**
	 * Allows for 'Buy all' and reduces its additional cost
	 */
	magnetism?: number;

	/**
	 * Improve purchase cost of products
	 */
	metalScissors?: number;

	/**
	 * Improve product sell price for the category
	 */
	packaging?: number;
}

export interface CategorySkills {
	/**
	 * Skill Level per Shop a player ever had
	 */
	collector?: SkillCategorySet;
}

export interface Skills extends SimpleSkills, CategorySkills {
}

export interface SkillInTraining {
	readonly skill: Skill;
	readonly category?: QNumber;
	readonly endTimestamp: UnixTimestamp;
}

export type SimpleSkill = keyof SimpleSkills
export type CategorySkill = keyof CategorySkills
export type Skill = SimpleSkill | CategorySkill

export const SIMPLE_SKILLS: readonly SimpleSkill[] = [
	'applicantSeats',
	'applicantSpeed',
	'healthCare',
	'logistics',
	'machinePress',
	'magnetism',
	'metalScissors',
	'packaging'
]

export const CATEGORY_SKILLS: readonly CategorySkill[] = [
	'collector'
]
