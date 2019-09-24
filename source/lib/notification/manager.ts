import {scheduleJob, Job} from 'node-schedule'

import {Notification} from '../types/notification'

type Dictionary<T> = {[key: string]: T}

export class NotificationManager {
	private readonly _currentJobs: Dictionary<Job[]> = {}

	constructor(
		private readonly _sendFunc: (chatId: string | number, notification: Notification, fireDate: Date) => (Promise<void> | void)
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

		const job = scheduleJob(notification.date, async fireDate =>
			this._sendFunc(chatId, notification, fireDate)
		)

		if (job) {
			// Created Job in the past does not need to be added
			this._currentJobs[chatId].push(job)
		}
	}
}
