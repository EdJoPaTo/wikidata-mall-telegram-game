import {markdown as format} from 'telegram-format'
import WikidataEntityReader from 'wikidata-entity-reader'

import {emojis} from './emojis'
import {formatFloat, formatInt} from './format-number'

interface InfoHeaderOptions {
	titlePrefix?: string;
	titleSuffix?: string;
}

export function infoHeader(wdr: WikidataEntityReader, options: InfoHeaderOptions = {}): string {
	const {titlePrefix, titleSuffix} = options
	const label = wdr.label()
	const description = wdr.description()

	let text = ''

	if (titlePrefix) {
		text += titlePrefix
		text += ' '
	}

	text += format.bold(label)

	if (titleSuffix) {
		text += ' '
		text += titleSuffix
	}

	if (description) {
		text += '\n'
		text += format.escape(description)
	}

	text += '\n\n'
	return text
}

export function labeledFloat(label: string | WikidataEntityReader, num: number, unit = ''): string {
	return labeledValue(label, `${formatFloat(num)}${unit}`)
}

export function labeledInt(label: string | WikidataEntityReader, num: number, unit = ''): string {
	return labeledValue(label, `${formatInt(num)}${unit}`)
}

export function labeledValue(label: string | WikidataEntityReader, value: string | WikidataEntityReader): string {
	const labelString = label instanceof WikidataEntityReader ? label.label() : label
	const valueString = value instanceof WikidataEntityReader ? value.label() : value
	const multiline = labelString.length > 4 && valueString.length > 4 && labelString.length + valueString.length > 30
	const seperator = multiline ? ':\n  ' : ': '
	return labelString + seperator + valueString + '\n'
}

export function moneyCostPart(ctx: any, currentMoney: number, cost: number): string {
	let text = ''
	text += labeledFloat(ctx.wd.r('other.money'), currentMoney, emojis.currency)

	if (currentMoney < cost) {
		text += emojis.requireAttention
	}

	text += labeledFloat(ctx.wd.r('other.cost'), cost, emojis.currency)
	text += '\n'
	return text
}

export function mallMoneyCostPart(ctx: any, currentMoney: number, cost: number): string {
	let text = ''
	text += labeledFloat(ctx.wd.r('other.money'), currentMoney, emojis.currencyMall)

	if (currentMoney < cost) {
		text += emojis.requireAttention
	}

	text += labeledFloat(ctx.wd.r('other.cost'), cost, emojis.currencyMall)
	text += '\n'
	return text
}
