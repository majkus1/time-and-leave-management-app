'use client'

import { useState } from 'react'
import DatePicker, { registerLocale } from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { pl } from 'date-fns/locale/pl'
import { enGB } from 'date-fns/locale/en-GB'

registerLocale('pl', pl)
registerLocale('en-GB', enGB)

type Props = {
	id: string
	locale: 'pl' | 'en'
	selected: Date | null
	onChange: (date: Date | null) => void
	placeholder: string
	timeCaption: string
	className: string
	autoOpen?: boolean
}

export default function LandingContactDatePicker({
	id,
	locale,
	selected,
	onChange,
	placeholder,
	timeCaption,
	className,
	autoOpen = false,
}: Props) {
	const [open, setOpen] = useState(autoOpen)

	const minTime = new Date()
	minTime.setHours(8, 0, 0)
	const maxTime = new Date()
	maxTime.setHours(17, 0, 0)
	const minDate = new Date()
	minDate.setHours(0, 0, 0, 0)

	return (
		<DatePicker
			id={id}
			selected={selected}
			onChange={onChange}
			showTimeSelect
			timeIntervals={30}
			minDate={minDate}
			minTime={minTime}
			maxTime={maxTime}
			dateFormat="Pp"
			timeCaption={timeCaption}
			locale={locale === 'pl' ? 'pl' : 'en-GB'}
			placeholderText={placeholder}
			className={className}
			open={open}
			onInputClick={() => setOpen(true)}
			onClickOutside={() => setOpen(false)}
			onSelect={() => setOpen(false)}
		/>
	)
}
