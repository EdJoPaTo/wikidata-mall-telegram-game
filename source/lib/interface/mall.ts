import {markdown as format} from 'telegram-format'
import emojiRegex from 'emoji-regex'

import {Context} from '../types'
import {Mall, Attraction, ProductionPart} from '../types/mall'

import {MALL_MIN_PEOPLE, MALL_MAX_PEOPLE} from '../game-math/constants'
import {mallMemberAmountWithinLimits, attractionCustomerBonus} from '../game-math/mall'

import {MiniWikidataStore} from '../notification/types'
import * as wdAttractions from '../wikidata/attractions'

import {emojis} from './emojis'
import {formatFloat} from './format-number'
import {infoHeader, labeledValue} from './formatted-strings'
import {percentBonusString} from './format-percent'

export function mallMoji(mall: Mall): string {
	const regex = emojiRegex()
	const match = regex.exec(String(mall.chat.title))
	const emoji = match ? match[0]! : '??'
	return emoji
}

export async function hintIncorrectPeopleAmount(ctx: Context, mall: Mall): Promise<string> {
	if (mallMemberAmountWithinLimits(mall)) {
		return ''
	}

	let text = ''
	text += emojis.warning
	text += mall.member.length
	text += ' '
	text += (await ctx.wd.reader('mall.participation')).label()
	text += ' ('
	text += MALL_MIN_PEOPLE
	text += ' - '
	text += MALL_MAX_PEOPLE
	text += ')'
	text += '\n\n'
	return text
}

export async function mallAttractionPart(ctx: Context, attraction: string): Promise<string> {
	const attractionReader = await ctx.wd.reader(attraction)
	const height = wdAttractions.getHeight(attraction)

	let text = ''
	text += infoHeader(attractionReader, {
		titlePrefix: emojis.attraction
	})

	text += labeledValue(
		await ctx.wd.reader('other.height'),
		`${formatFloat(height)} ${(await ctx.wd.reader('unit.meter')).label()}`
	)
	text += labeledValue(
		(await ctx.wd.reader('other.customer')).label(),
		percentBonusString(attractionCustomerBonus(height))
	)

	text += '\n'
	return text
}

export async function productionPartNotificationString(productionPart: ProductionPart, entityStore: MiniWikidataStore, locale: string): Promise<string> {
	const reader = await entityStore.reader(productionPart.part, locale)
	return reader.label()
}

export async function attractionDisasterNotification(attraction: Attraction, entityStore: MiniWikidataStore, locale: string): Promise<{text: string; photo?: string}> {
	const attractionReader = await entityStore.reader(attraction.item, locale)
	const disasterReader = await entityStore.reader(attraction.disasterKind, locale)

	let text = ''
	text += format.bold(format.escape(
		disasterReader.label()
	))
	text += '\n'
	text += attractionReader.label()

	const photoUrls = disasterReader.images(800)
	const photo = photoUrls[0]

	return {photo, text}
}
