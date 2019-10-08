import {Notification} from '../types/notification'

import {countdownHourMinute} from './formatted-time'
import {emojis} from './emojis'

export function notificationText(notification: Notification, fireDate: Date): string {
	const millisecondsUntil = notification.date.getTime() - fireDate.getTime()
	const secondsUntil = millisecondsUntil / 1000

	let text = ''

	switch (notification.type) {
		case 'skillFinished':
			text += emojis.skillFinished
			text += emojis.skill
			break
		case 'storeProductsEmpty':
			text += emojis.requireAttention
			text += emojis.storage
			break
		case 'employeeRetired':
			text += emojis.retirement
			break
		case 'applicantGraduated':
			text += emojis.graduation
			break
		case 'mallAttractionDisaster':
			text += emojis.attraction + emojis.disaster
			break
		default:
			throw new Error(`notification message not implemented for type: ${notification.type}`)
	}

	text += notification.text

	if (secondsUntil > 60) {
		text += '\n'
		text += countdownHourMinute(secondsUntil)
	}

	return text
}
