let content = "see this \\*\\*bold\\*\\* and *** italic_bold *** and ** space bold **"

let processed = content.replace(/\\n/g, '\n')
processed = processed.replace(/\\\*/g, '*') // unescape

// Fix spaces inside bold/italic
processed = processed.replace(/\*\*\s+([^\*]+?)\s+\*\*/g, '**$1**')
processed = processed.replace(/\*\*\*\s+([^\*]+?)\s+\*\*\*/g, '***$1***')

console.log(processed)
