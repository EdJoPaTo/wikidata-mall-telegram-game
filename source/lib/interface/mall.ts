import emojiRegex from 'emoji-regex'

import {Mall} from '../types/mall'

export function mallMoji(mall: Mall): string {
	const regex = emojiRegex()
	let match
	while ((match = regex.exec(String(mall.chat.title)))) {
		const emoji = match[0]
		return emoji
	}

	return '??'
}
