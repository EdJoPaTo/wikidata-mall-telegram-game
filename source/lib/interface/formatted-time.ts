export function countdownHourMinute(secondsLeft: number): string {
	const totalMinutes = secondsLeft / 60
	return formatClock(totalMinutes)
}

export function countdownMinuteSecond(secondsLeft: number): string {
	return formatClock(secondsLeft)
}

function formatClock(total: number): string {
	const first = Math.floor(total / 60)
	const second = Math.floor(total % 60)

	const firstString = first.toString()
	const secondString = `${second < 10 ? '0' : ''}${second}`
	return `${firstString}:${secondString}`
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
