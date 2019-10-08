import emojiRegex from 'emoji-regex'
import WikidataEntityReader from 'wikidata-entity-reader'

import {Mall} from '../types/mall'

import {MALL_MIN_PEOPLE, MALL_MAX_PEOPLE} from '../game-math/constants'
import {mallMemberAmountWithinLimits, attractionCustomerBonus} from '../game-math/mall'

import * as wdAttractions from '../wikidata/attractions'

import {emojis} from './emojis'
import {formatFloat} from './format-number'
import {infoHeader, labeledValue} from './formatted-strings'
import {percentBonusString} from './format-percent'

export function mallMoji(mall: Mall): string {
	const regex = emojiRegex()
	let match
	while ((match = regex.exec(String(mall.chat.title)))) {
		const emoji = match[0]
		return emoji
	}

	return '??'
}

export function hintIncorrectPeopleAmount(ctx: any, mall: Mall): string {
	if (mallMemberAmountWithinLimits(mall)) {
		return ''
	}

	let text = ''
	text += emojis.warning
	text += mall.member.length
	text += ' '
	text += ctx.wd.r('mall.participation').label()
	text += ' ('
	text += MALL_MIN_PEOPLE
	text += ' - '
	text += MALL_MAX_PEOPLE
	text += ')'
	text += '\n\n'
	return text
}

export function mallAttractionPart(ctx: any, attraction: string): string {
	const attractionReader = ctx.wd.r(attraction) as WikidataEntityReader
	const height = wdAttractions.getHeight(attraction)

	let text = ''
	text += infoHeader(attractionReader, {
		titlePrefix: emojis.attraction
	})
	text += '\n\n'

	text += labeledValue(
		ctx.wd.r('other.height').label(),
		`${formatFloat(height)} ${ctx.wd.r('unit.meter').label()}`
	)
	text += labeledValue(
		ctx.wd.r('other.customer').label(),
		percentBonusString(attractionCustomerBonus(height))
	)

	text += '\n'
	return text
}
