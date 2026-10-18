const { test } = require('node:test')
const assert = require('node:assert/strict')
const { htmlToText } = require('../utils/htmlToText')

test('pusty HTML daje pusty tekst', () => {
	assert.equal(htmlToText(''), '')
	assert.equal(htmlToText(null), '')
})

test('akapity i nagłówki rozdziela pustą linią, bez tagów', () => {
	const text = htmlToText('<h2>Wniosek urlopowy</h2><p>Jan złożył wniosek.</p><p>Od 1 do 5 lipca.</p>')
	assert.equal(text, 'Wniosek urlopowy\n\nJan złożył wniosek.\n\nOd 1 do 5 lipca.')
})

test('link zamienia na „tekst: adres”, a mailto zostawia sam tekst', () => {
	const text = htmlToText('<p><a href="https://app.planopia.pl/leave">Zobacz wniosek</a> albo <a href="mailto:biuro@planopia.pl">biuro@planopia.pl</a></p>')
	assert.equal(text, 'Zobacz wniosek: https://app.planopia.pl/leave albo biuro@planopia.pl')
})

test('pomija head, style i title, dekoduje encje', () => {
	const html = '<html><head><title>Tytuł</title><style>p{color:red}</style></head><body><p>A &amp; B &lt;3&gt; &quot;ok&quot;&nbsp;tak</p></body></html>'
	assert.equal(htmlToText(html), 'A & B <3> "ok" tak')
})

test('br i listy dają czytelne linie', () => {
	assert.equal(htmlToText('Linia 1<br>Linia 2<ul><li>Pierwszy</li><li>Drugi</li></ul>'), 'Linia 1\nLinia 2\n\n- Pierwszy\n- Drugi')
})

test('szablon tabelowy nie zostawia ciągów spacji ani wielu pustych linii', () => {
	const html = '<table><tr><td>  <h1>Planopia</h1>  </td></tr><tr><td><p>Treść</p></td></tr></table>'
	assert.equal(htmlToText(html), 'Planopia\n\nTreść')
})
