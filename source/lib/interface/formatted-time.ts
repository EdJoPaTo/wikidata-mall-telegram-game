export function countdownHourMinute(secondsLeft: number): string {
	const totalMinutes = secondsLeft / 60
	const minutes = totalMinutes % 60
	const totalHours = totalMinutes / 60

	const hourString = Math.floor(totalHours).toString()
	const minuteString = `${minutes < 10 ? '0' : ''}${Math.floor(minutes)}`

	return `${hourString}:${minuteString}`
}

export function humanReadableTimestamp(unixTimestamp: number, locale: string | undefined, timeZone: string | undefined): string {
	const date = new Date(unixTimestamp * 1000)
	return date.toLocaleString(locale === 'wikidatanish' ? 'en' : locale, {
		timeZone: timeZone || 'UTC',
		timeZoneName: 'short',
		year: 'numeric',
		month: 'short',
		day: 'numeric',
		hour: 'numeric',
		minute: '2-digit'
	})
}
