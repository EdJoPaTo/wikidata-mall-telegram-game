import {Persist} from '../types'
import {Shop} from '../types/shop'

import {buyAllCostFactor, returnOnInvestment, currentSellPerMinute} from '../game-math/shop-cost'
import {currentLevel} from '../game-math/skill'

import {getAttractionHeight} from '../game-logic/mall-attraction'

import {emojis} from './emojis'
import {formatFloat} from './format-number'
import {percentBonusString} from './format-percent'

export function incomePart(ctx: any, shops: readonly Shop[], persist: Persist, showExplanation: boolean): string {
	const {skills, mall} = persist
	const magnetismLevel = currentLevel(skills, 'magnetism')
	const factor = buyAllCostFactor(skills, shops.length)
	const income = returnOnInvestment(shops, skills)
	const magnetIncome = returnOnInvestment(shops, skills, factor)

	const mallAttractionHeight = getAttractionHeight(mall && mall.attraction)
	const sell = shops
		.map(o => currentSellPerMinute(o, skills, mallAttractionHeight))
		.reduce((a, b) => a + b, 0)

	if (!Number.isFinite(income)) {
		return ''
	}

	let text = ''
	text += emojis.income
	text += '*'
	text += ctx.wd.r('other.income').label()
	text += '*'

	text += '\n'
	text += formatFloat(sell)
	text += emojis.currency
	text += ' / '
	text += ctx.wd.r('unit.minute').label()

	if (showExplanation) {
		text += '\n'
		text += ctx.wd.r('other.returnOnInvestment').label()
		text += ': '
		text += percentBonusString(income)

		if (magnetismLevel > 0) {
			text += ' ('
			text += emojis.magnetism
			text += percentBonusString(magnetIncome)
			text += ')'
		}
	}

	text += '\n\n'
	return text
}
