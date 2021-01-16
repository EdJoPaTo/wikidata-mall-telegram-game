import {Context as TelegrafContext} from 'telegraf'
import {I18nContext} from '@edjopato/telegraf-i18n'
import {MiddlewareProperty} from 'telegraf-wikibase'

import {Session} from './session'
import {Persist} from './persist'

export interface Context extends TelegrafContext {
	readonly i18n: I18nContext;
	readonly match: RegExpExecArray | null | undefined;
	readonly persist: Persist;
	readonly session: Session;
	readonly wd: MiddlewareProperty;
}
