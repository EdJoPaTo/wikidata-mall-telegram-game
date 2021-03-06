import {listTimeZones} from 'timezone-support'
import {markdown as format} from 'telegram-format'
import {MenuTemplate, Body} from 'telegraf-inline-menu'
import arrayFilterUnique from 'array-filter-unique'

import {Context} from '../../lib/types'

import {emojis} from '../../lib/interface/emojis'
import {humanReadableTimestamp} from '../../lib/interface/formatted-time'
import {infoHeader, labeledValue} from '../../lib/interface/formatted-strings'
import {backButtons, bodyPhoto} from '../../lib/interface/menu'

const tzNormal = listTimeZones()
	.map(o => o.split('/'))
	.filter(o => o.length >= 2)

const tzPrefixesRaw = tzNormal
	.map(o => o[0]!)
	.filter(arrayFilterUnique())

function tzPrefixes(ctx: Context): string[] {
	const {__wikibase_language_code: locale} = ctx.session
	return tzPrefixesRaw
		.sort((a, b) => a.localeCompare(b, locale === 'wikidatan' ? 'en' : locale))
}

function tzInPrefix(ctx: Context): string[] {
	const {__wikibase_language_code: locale} = ctx.session
	const prefix = ctx.match![1]!
	return tzNormal
		.filter(o => o[0] === prefix)
		.map(o => o.slice(1).join(':'))
		.sort((a, b) => a.localeCompare(b, locale === 'wikidatan' ? 'en' : locale))
}

async function menuBody(ctx: Context): Promise<Body> {
	const {__wikibase_language_code: locale} = ctx.session
	const current = ctx.session.timeZone ?? 'UTC'

	let text = ''
	const reader = await ctx.wd.reader('menu.timezone')
	text += infoHeader(reader, {titlePrefix: emojis.timezone})

	text += labeledValue(
		format.escape(current),
		humanReadableTimestamp(Date.now() / 1000, locale, ctx.session.timeZone)
	)
	text += '\n'

	if (ctx.match instanceof Object && ctx.match[1]) {
		text += format.bold(format.escape(ctx.match[1]))
		text += '\n\n'
	}

	return {
		...bodyPhoto(reader),
		text, parse_mode: 'Markdown'
	}
}

export const menu = new MenuTemplate<Context>(menuBody)

const specificMenu = new MenuTemplate<Context>(menuBody)

menu.toggle('UTC', 'utc', {
	isSet: ctx => !ctx.session.timeZone,
	set: ctx => {
		delete ctx.session.timeZone
		return true
	}
})

menu.chooseIntoSubmenu('s', tzPrefixes, specificMenu, {
	columns: 2,
	getCurrentPage,
	setPage
})

specificMenu.select('s', tzInPrefix, {
	columns: 2,
	isSet: isSetFunc,
	set: setFunc,
	getCurrentPage,
	setPage
})

specificMenu.manualRow(backButtons)

menu.manualRow(backButtons)

function createTz(match: RegExpMatchArray | undefined | null, key: string): string {
	const region = match?.[1]
	const area = key.replace(/:/g, '/')
	const tz = region ? `${region}/${area}` : area
	return tz
}

function isSetFunc(ctx: Context, key: string): boolean {
	return ctx.session.timeZone === createTz(ctx.match, key)
}

function setFunc(ctx: Context, key: string): true {
	ctx.session.timeZone = createTz(ctx.match, key)
	return true
}

function getCurrentPage(ctx: Context): number | undefined {
	return ctx.session.page
}

function setPage(ctx: Context, page: number): void {
	ctx.session.page = page
}
