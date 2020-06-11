import {scheduleJob, Job} from 'node-schedule'

import {Notification} from '../types/notification'

export class NotificationManager {
	private readonly _currentJobs: Record<string | number, Job[]> = {}

	constructor(
		private readonly _sendFunc: (chatId: string | number, notification: Notification, fireDate: Readonly<Date>) => (Promise<void> | void)
	) {}

	clear(chatId: string | number): void {
		const jobs = this._currentJobs[chatId] || []
		let j: Job | undefined
		while ((j = jobs.pop()) !== undefined) {
			j.cancel()
		}
	}

	add(chatId: string | number, notification: Notification): void {
		if (!this._currentJobs[chatId]) {
			this._currentJobs[chatId] = []
		}

		const date = new Date(notification.date.getTime())
		const job = scheduleJob(date, async (fireDate: Readonly<Date>) =>
			this._sendFunc(chatId, notification, fireDate)
		)

		if (job) {
			// Created Job in the past does not need to be added
			this._currentJobs[chatId].push(job)
		}
	}
}
