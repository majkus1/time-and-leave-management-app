import { describe, expect, it } from 'vitest'
import {
	normalizeTicketMarkdownForRender,
	sanitizeTicketLinkUrl,
} from './ticketMarkdownUtils.js'

describe('normalizeTicketMarkdownForRender', () => {
	it('preserves line breaks in plain text', () => {
		expect(normalizeTicketMarkdownForRender('linia 1\nlinia 2')).toBe('linia 1  \nlinia 2')
	})

	it('leaves markdown content unchanged', () => {
		const md = '**bold**\n- item'
		expect(normalizeTicketMarkdownForRender(md)).toBe(md)
	})
})

describe('sanitizeTicketLinkUrl', () => {
	it('allows https and mailto', () => {
		expect(sanitizeTicketLinkUrl('https://planopia.pl/x')).toBe('https://planopia.pl/x')
		expect(sanitizeTicketLinkUrl('mailto:help@planopia.pl')).toBe('mailto:help@planopia.pl')
	})

	it('blocks javascript and data urls', () => {
		expect(sanitizeTicketLinkUrl('javascript:alert(1)')).toBeNull()
		expect(sanitizeTicketLinkUrl('data:text/html,<script>')).toBeNull()
	})
})
