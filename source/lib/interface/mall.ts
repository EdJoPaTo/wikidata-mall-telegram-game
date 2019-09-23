import emojiRegex from 'emoji-regex'

import {Mall} from '../types/mall'

import {MALL_MIN_PEOPLE, MALL_MAX_PEOPLE} from '../game-math/constants'
import {mallMemberAmountWithinLimits} from '../game-math/mall'

import {emojis} from './emojis'

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
