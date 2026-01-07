import React from 'react';
import fs from 'fs';
import path from 'path';
import LegalHeader from './LegalHeader';

interface LegalDocumentPageProps {
	documentType: 'TERMS' | 'PRIVACY' | 'DPA';
	title: string;
	lang?: 'pl' | 'en';
}

// Server Component - reads markdown files at build time
export default function LegalDocumentPage({ documentType, title, lang = 'pl' }: LegalDocumentPageProps) {
	// Read markdown file from legal-documents folder
	const fileName = lang === 'en' ? `${documentType}_EN.md` : `${documentType}.md`;
	const filePath = path.join(process.cwd(), '..', 'legal-documents', fileName);
	let content: string | null = null;
	let error: string | null = null;

	try {
		content = fs.readFileSync(filePath, 'utf-8');
	} catch (err) {
		console.error(`Error reading ${documentType} document:`, err);
		error = lang === 'en' 
			? 'Failed to load document.' 
			: 'Nie udało się załadować dokumentu.';
	}

	if (error) {
		return (
			<>
				<LegalHeader lang={lang} />
				<div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
					<div className="bg-white p-8 rounded-lg shadow-md text-center max-w-2xl" style={{ marginTop: '50px' }}>
						<h1 className="text-2xl font-bold text-red-600 mb-4">
							{lang === 'en' ? 'Error' : 'Błąd'}
						</h1>
						<p className="text-gray-700">{error}</p>
					</div>
				</div>
			</>
		);
	}

	// Simple markdown rendering (basic conversion)
	const renderMarkdown = (text: string) => {
		const lines = text.split('\n');
		const elements: React.ReactNode[] = [];
		let inCodeBlock = false;
		let codeBlockContent: string[] = [];
		let firstH1Skipped = false;

		lines.forEach((line, index) => {
			if (line.startsWith('```')) {
				if (inCodeBlock) {
					// End code block
					elements.push(
						<pre key={index} className="bg-gray-100 p-4 rounded-lg overflow-x-auto my-4">
							<code>{codeBlockContent.join('\n')}</code>
						</pre>
					);
					codeBlockContent = [];
					inCodeBlock = false;
				} else {
					// Start code block
					inCodeBlock = true;
				}
				return;
			}

			if (inCodeBlock) {
				codeBlockContent.push(line);
				return;
			}

			// Headers - pomiń pierwszy H1, bo już mamy nagłówek z props title
			if (line.startsWith('# ')) {
				if (!firstH1Skipped) {
					firstH1Skipped = true;
					return; // Pomiń pierwszy H1
				}
				elements.push(<h1 key={index} className="text-3xl font-bold mt-8 mb-4">{line.substring(2)}</h1>);
			} else if (line.startsWith('## ')) {
				elements.push(<h2 key={index} className="text-2xl font-bold mt-6 mb-3">{line.substring(3)}</h2>);
			} else if (line.startsWith('### ')) {
				elements.push(<h3 key={index} className="text-xl font-semibold mt-4 mb-2">{line.substring(4)}</h3>);
			} else if (line.startsWith('**') && line.endsWith('**')) {
				// Bold text
				elements.push(<p key={index} className="font-bold my-2">{line.replace(/\*\*/g, '')}</p>);
			} else if (line.trim() === '') {
				elements.push(<br key={index} />);
			} else {
				// Regular paragraph with basic formatting
				const processedLine = line
					.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
					.replace(/\*(.*?)\*/g, '<em>$1</em>');
				elements.push(
					<p key={index} className="mb-4 text-gray-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: processedLine }} />
				);
			}
		});

		return elements;
	};

	return (
		<>
			<LegalHeader lang={lang} />
			<div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
				<div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-md" style={{ marginTop: '50px' }}>
					<h1 className="text-3xl font-bold text-gray-900 mb-6">{title}</h1>
					<div className="prose max-w-none">
						{content && renderMarkdown(content)}
					</div>
				</div>
			</div>
		</>
	);
}
