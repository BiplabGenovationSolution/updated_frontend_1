const content = `Here is some text. **This is bold**. And this is ***bold and italic***. Also ** bold with spaces **.`
let processed = content.replace(/\\n/g, '\n')

// 1. FIRST: Handle headers precisely (standalone lines only)
processed = processed
  .replace(/^\s*([A-Z][\w\s&:\(\)\-]{5,50}?)\s*\n\s*={3,}\s*$/gm, '### $1')
  .replace(/^\s*([A-Z][\w\s&:\(\)\-]{5,50}?)\s*\n\s*-{3,}\s*$/gm, '#### $1')
  .replace(/^#{1,2}\s+(.+)$/gm, (match, title) => {
    const level = match.startsWith('##') ? '###' : '##'
    return `${level} ${title}`
  })

// 2. Math conversion (safe after headers)
processed = processed.replace(
  /([a-zA-Z0-9]+)\^([0-9]+)/g,
  (match, base, exp) => `$${base}^{${exp}}$`
)

// 3. Lists - robust multi-pattern detection
processed = processed
  // Inline asterisk lists → proper lists
  .replace(/([^\n*])\*\s+([A-Za-z])/g, '$1\n\n* $2')
  // Inline numbered lists
  .replace(/([^\n0-9])\d+\.\s+([A-Za-z])/g, '$1\n\n1. $2')
  // Colon + list patterns (common in AI responses)
  .replace(/:\s+\*\s+([A-Za-z])/g, ':\n\n* $1')
  // Ensure proper list formatting
  .replace(/^\*\s+/gm, '* ')
  .replace(/^\d+\.\s+/gm, '1. ')

// 4. Bold section headers on new lines
processed = processed.replace(/([.!?])\s+\*\*([A-Z][^\*]+?)\*\*/g, '$1\n\n**$2**')

// 5. Paragraph breaks for readability
if (!processed.includes('\n') && processed.length > 200) {
  processed = processed.replace(/([.!?])\s+([A-Z])/g, '$1\n\n$2')
}

// 6. Clean excessive whitespace
processed = processed.replace(/\n{4,}/g, '\n\n\n').trim()

console.log(processed)
