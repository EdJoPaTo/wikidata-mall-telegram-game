import {Achievements, Stats} from './achievements'
import {Person} from './people'
import {Shop} from './shop'
import {Skills, SkillInTraining} from './skills'

/* eslint @typescript-eslint/camelcase: warn */

// Contains smaller things only relevant to a specific player
export interface Session {
	__wikibase_language_code: string;
	achievements: Achievements;
	applicants: Person[];
	applicantTimestamp: number;
	money: number;
	page: number;
	skillInTraining?: SkillInTraining;
	stats: Stats;
}

// Contains things that are stored outside of the session
export interface Persist {
	shops: Shop[];
	skills: Skills;
}
