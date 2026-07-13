import React from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeSanitize from 'rehype-sanitize'
import { normalizeTicketMarkdownForRender } from './ticketMarkdownUtils'

export default function TicketMarkdown({ content, className = '' }) {
	const source = normalizeTicketMarkdownForRender(content)
	if (!source.trim()) return null

	return (
		<div className={`help-center__md ${className}`.trim()}>
			<ReactMarkdown
				remarkPlugins={[remarkGfm]}
				rehypePlugins={[rehypeSanitize]}
				components={{
					a: ({ href, children }) => (
						<a href={href} target="_blank" rel="noopener noreferrer">
							{children}
						</a>
					),
				}}
			>
				{source}
			</ReactMarkdown>
		</div>
	)
}
