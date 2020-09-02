import {LeaderboardView} from './leaderboard'
import {SkillInTraining} from './skills'
import {Stats} from './stats'
import {Talent} from './people'

type UnixTimestamp = number

// Contains smaller things only relevant to a specific player
export interface Session {
	__wikibase_language_code?: string;
	employeeViewTalent?: Talent;
	gameStarted: UnixTimestamp;
	hideExplanationMath?: true;
	leaderboardView?: LeaderboardView;
	money: number;
	page?: number;
	hideAllSkillsSeenBefore?: true;
	showAllLanguages?: true;
	skillQueue: SkillInTraining[];
	stats: Stats;
	timeZone?: string;
}
