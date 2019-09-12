import {Achievements, Stats} from './achievements'
import {Person} from './people'
import {Shop, Construction} from './shop'
import {Skills, SkillInTraining} from './skills'

/* eslint @typescript-eslint/camelcase: warn */

export type LeaderboardView = 'returnOnInvestment' | 'collector'
export const LEADERBOARD_VIEWS: LeaderboardView[] = ['returnOnInvestment', 'collector']

// Contains smaller things only relevant to a specific player
export interface Session {
	__wikibase_language_code: string;
	achievements: Achievements;
	applicants: Person[];
	applicantTimestamp: number;
	construction?: Construction;
	hideExplanationMath: boolean;
	leaderboardView?: LeaderboardView;
	money: number;
	page?: number;
	// TODO: remove (migration in progress)
	skillInTraining?: SkillInTraining;
	skillQueue?: SkillInTraining[];
	stats: Stats;
}

// Contains things that are stored outside of the session
export interface Persist {
	shops: Shop[];
	skills: Skills;
}
