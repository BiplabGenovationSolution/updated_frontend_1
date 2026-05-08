





// import React from 'react'
// import ReactMarkdown from 'react-markdown'
// import remarkGfm from 'remark-gfm'
// import remarkMath from 'remark-math'
// import rehypeRaw from 'rehype-raw'
// import rehypeKatex from 'rehype-katex'
// import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
// import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
// import { Copy, Check, ExternalLink } from 'lucide-react'
// import { cn } from '@/lib/utils'

// // Import Katex CSS for math support
// import 'katex/dist/katex.min.css'

// interface MarkdownContentProps {
//   content: string
//   isUser?: boolean
//   isDarkTheme?: boolean
//   className?: string
// }

// export function MarkdownContent({
//   content,
//   isUser = false,
//   isDarkTheme = false,
//   className
// }: MarkdownContentProps) {
//   const [copiedCode, setCopiedCode] = React.useState<string | null>(null)

//   const copyToClipboard = async (text: string) => {
//     try {
//       await navigator.clipboard.writeText(text)
//       setCopiedCode(text)
//       setTimeout(() => setCopiedCode(null), 2000)
//     } catch (error) {
//       console.error('Failed to copy:', error)
//     }
//   }

//   // ✅ FIXED: Robust preprocessing pipeline
//   const processedContent = React.useMemo(() => {
//     if (!content) return ''
//     let processed = content.replace(/\\n/g, '\n')

//     // 1. FIRST: Handle headers precisely (standalone lines only)
//     processed = processed
//       // H3: Title followed by === on next line
//       .replace(/^\s*([A-Z][\w\s&:\(\)\-]{5,50}?)\s*\n\s*={3,}\s*$/gm, '### $1')
//       // H4: Title followed by --- on next line
//       .replace(/^\s*([A-Z][\w\s&:\(\)\-]{5,50}?)\s*\n\s*-{3,}\s*$/gm, '#### $1')
//       // H2/H1: # or ## patterns
//       .replace(/^#{1,2}\s+(.+)$/gm, (match, title) => {
//         const level = match.startsWith('##') ? '###' : '##'
//         return `${level} ${title}`
//       })

//     // 2. Math conversion (safe after headers)
//     processed = processed.replace(
//       /([a-zA-Z0-9]+)\^([0-9]+)/g,
//       (match, base, exp) => `$${base}^{${exp}}$`
//     )

//     // 3. Lists - robust multi-pattern detection
//     processed = processed
//       // Inline asterisk lists → proper lists
//       .replace(/([^\n*])\*\s+([A-Za-z])/g, '$1\n\n* $2')
//       // Inline numbered lists
//       .replace(/([^\n0-9])\d+\.\s+([A-Za-z])/g, '$1\n\n1. $2')
//       // Colon + list patterns (common in AI responses)
//       .replace(/:\s+\*\s+([A-Za-z])/g, ':\n\n* $1')
//       // Ensure proper list formatting
//       .replace(/^\*\s+/gm, '* ')
//       .replace(/^\d+\.\s+/gm, '1. ')

//     // 4. Bold section headers on new lines
//     processed = processed.replace(/([.!?])\s+\*\*([A-Z][^\*]+?)\*\*/g, '$1\n\n**$2**')

//     // 5. Paragraph breaks for readability
//     if (!processed.includes('\n') && processed.length > 200) {
//       processed = processed.replace(/([.!?])\s+([A-Z])/g, '$1\n\n$2')
//     }

//     // 6. Clean excessive whitespace
//     processed = processed.replace(/\n{4,}/g, '\n\n\n').trim()

//     return processed
//   }, [content])

//   return (
//     <div
//       className={cn(
//         'w-full max-w-none prose prose-slate md:prose-lg dark:prose-invert',
//         // ✅ IMPROVED: Better header styling for Perplexity format
//         'prose-headings:scroll-mt-20 prose-headings:font-semibold prose-headings:border-b prose-headings:border-gray-200 dark:prose-headings:border-gray-700 prose-headings:pb-2 prose-headings:mt-8 prose-headings:mb-4',
//         'prose-p:leading-relaxed prose-p:mb-5',
//         'prose-strong:font-bold prose-strong:text-inherit',
//         'prose-code:text-[0.9em] prose-code:font-normal prose-code:bg-transparent prose-code:px-0 prose-code:py-0 prose-code:before:content-none prose-code:after:content-none',
//         'prose-ul:my-5 prose-ol:my-5 prose-ul:pl-6 prose-ol:pl-6',
//         'prose-li:my-2 prose-li:pl-1 marker:text-slate-400',
//         'prose-blockquote:border-l-4 prose-blockquote:border-gray-300 dark:prose-blockquote:border-gray-700 prose-blockquote:bg-gray-50 dark:prose-blockquote:bg-gray-900/50 prose-blockquote:py-2 prose-blockquote:rounded-r-xl',
//         // Theme-aware text color
//         isDarkTheme ? 'text-gray-100' : 'text-[16px] text-[#374151]',
//         // No extra margin on last child
//         '[&>*:last-child]:mb-0',
//         className
//       )}
//     >
//       <ReactMarkdown
//         remarkPlugins={[remarkGfm, remarkMath]}
//         rehypePlugins={[rehypeKatex, rehypeRaw]}
//         urlTransform={(url) => url}
//         components={{
//           // Custom paragraphs
//           p: ({ children }) => (
//             <p className="mb-5 whitespace-pre-wrap last:mb-0">
//               {children}
//             </p>
//           ),

//           // ✅ FIXED: Consistent heading sizes
//           h1: ({ children }) => <h1 className="text-2xl font-bold mt-8 mb-4 first:mt-0">{children}</h1>,
//           h2: ({ children }) => <h2 className="text-xl font-bold mt-7 mb-3 border-b border-gray-200 dark:border-gray-700 pb-2">{children}</h2>,
//           h3: ({ children }) => <h3 className="text-lg font-bold mt-6 mb-2">{children}</h3>,
//           h4: ({ children }) => <h4 className="text-base font-semibold mt-5 mb-2 text-gray-900 dark:text-gray-100">{children}</h4>,

//           // Code blocks (unchanged - already good)
//           code: ({ className, children, ...props }: any) => {
//             const match = /language-(\w+)/.exec(className || '')
//             const isInline = !match

//             if (isInline) {
//               return (
//                 <code
//                   className={cn(
//                     'px-1.5 py-0.5 rounded-md font-mono text-[0.9em] bg-black/5 dark:bg-white/10'
//                   )}
//                   {...props}
//                 >
//                   {children}
//                 </code>
//               )
//             }

//             const language = match![1]
//             const codeString = String(children).replace(/\n$/, '')
//             const isCopied = copiedCode === codeString

//             return (
//               <div className="group relative my-6 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-[#0d0d0d] shadow-sm">
//                 <div className="flex items-center justify-between px-4 py-2.5 bg-[#2f2f2f] text-[#d1d5db]">
//                   <span className="text-xs font-sans font-medium">{language}</span>
//                   <button
//                     onClick={() => copyToClipboard(codeString)}
//                     className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs hover:bg-white/10 transition-colors"
//                   >
//                     {isCopied ? (
//                       <>
//                         <Check className="h-3.5 w-3.5 text-green-400" />
//                         <span className="text-green-400">Copied!</span>
//                       </>
//                     ) : (
//                       <>
//                         <Copy className="h-3.5 w-3.5" />
//                         <span>Copy code</span>
//                       </>
//                     )}
//                   </button>
//                 </div>
//                 <div className="overflow-x-auto scrollbar-minimal">
//                   <SyntaxHighlighter
//                     style={vscDarkPlus}
//                     language={language}
//                     PreTag="div"
//                     customStyle={{
//                       margin: 0,
//                       padding: '1.5rem',
//                       background: 'transparent',
//                       fontSize: '14px',
//                       lineHeight: '1.6',
//                       fontFamily: 'var(--font-mono)',
//                     }}
//                   >
//                     {codeString}
//                   </SyntaxHighlighter>
//                 </div>
//               </div>
//             )
//           },

//           // Enhanced tables
//           table: ({ children }) => (
//             <div className="my-6 overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
//               <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800 m-0 text-sm">
//                 {children}
//               </table>
//             </div>
//           ),
//           thead: ({ children }) => <thead className="bg-gray-50 dark:bg-gray-900">{children}</thead>,
//           th: ({ children }) => (
//             <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wider">
//               {children}
//             </th>
//           ),
//           tbody: ({ children }) => <tbody className="divide-y divide-gray-200 dark:divide-gray-800">{children}</tbody>,
//           tr: ({ children }) => <tr className="hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors">{children}</tr>,
//           td: ({ children }) => <td className="px-4 py-3 whitespace-nowrap">{children}</td>,

//           // Links
//           a: ({ href, children }) => (
//             <a
//               href={href}
//               target="_blank"
//               rel="noopener noreferrer"
//               className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline decoration-blue-500/30 underline-offset-4"
//             >
//               {children}
//               {href?.startsWith('http') && <ExternalLink className="h-3.5 w-3.5 opacity-50" />}
//             </a>
//           ),

//           // Blockquotes
//           blockquote: ({ children }) => (
//             <blockquote className="border-l-4 border-slate-300 dark:border-slate-600 pl-4 py-1 my-6 italic text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50 rounded-r-xl">
//               {children}
//             </blockquote>
//           ),

//           // Lists
//           ul: ({ children }) => <ul className="list-disc pl-6 my-5 space-y-2">{children}</ul>,
//           ol: ({ children }) => <ol className="list-decimal pl-6 my-5 space-y-2">{children}</ol>,
//           li: ({ children }) => <li className="pl-1 marker:text-slate-400">{children}</li>,

//           // Images
//           img: ({ src, alt }) => {
//             const cleanSrc = src?.replace(/\s/g, '') || ''
//             return (
//               <div className="my-10 flex flex-col items-center">
//                 <img
//                   src={cleanSrc}
//                   alt={alt || 'Visual content'}
//                   className="rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 max-w-full h-auto hover:scale-[1.01] transition-transform duration-500"
//                   loading="lazy"
//                 />
//                 {alt && <span className="mt-4 text-sm text-slate-500 font-medium italic">{alt}</span>}
//               </div>
//             )
//           },

//           hr: () => <hr className="my-10 border-slate-200 dark:border-slate-800" />,
//         }}
//       >
//         {processedContent}
//       </ReactMarkdown>
//     </div>
//   )
// }



import React from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeRaw from 'rehype-raw'
import rehypeKatex from 'rehype-katex'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { Copy, Check, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'

// Import Katex CSS for math support
import 'katex/dist/katex.min.css'

interface MarkdownContentProps {
  content: string
  isDarkTheme?: boolean
  className?: string
}

export function MarkdownContent({
  content,
  isDarkTheme = false,
  className
}: MarkdownContentProps) {
  const [copiedCode, setCopiedCode] = React.useState<string | null>(null)

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedCode(text)
      setTimeout(() => setCopiedCode(null), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  // Simple preprocessing with math auto-conversion
  const processedContent = React.useMemo(() => {
    if (!content) return ''
    let processed = content.replace(/\\n/g, '\n')

    // Auto-convert exponents: x^2 → $x^2$
    // Match pattern: letter/number followed by ^ and a number
    processed = processed.replace(
      /([a-zA-Z0-9]+)\^([0-9]+)/g,
      (match, base, exp) => {
        // Check if already inside $ delimiters
        const beforeMatch = processed.substring(0, processed.indexOf(match))
        const dollarCount = (beforeMatch.match(/\$/g) || []).length
        if (dollarCount % 2 === 1) return match // Already in math mode

        return `$${base}^{${exp}}$`
      }
    )


    // Fix: If there are no newlines at all, try to add them after common sentence endings 
    // to avoid a giant wall of text if the LLM output is poorly formatted.
    if (!processed.includes('\n') && processed.length > 200) {
      // Prevent breaking immediately after a list number like "1. "
      processed = processed.replace(/(?<!\d)([.!?])\s+([A-Z])/g, '$1\n\n$2')
    }

    // Fix: Convert "Text =====" to "### Text" and "Text -----" to "#### Text" or "**Text**"
    // Handle both multiline and inline cases
    // We update this regex to be more aggressive for embedded headers in paragraphs
    // Example: "Some text. Header ---------- next paragraph"
    processed = processed
      // Headings with === (convert to H3)
      // Look for: [punctuation/newline] [space] [Title] [===]
      // Or just line start for Title
      .replace(/(?:^|[\.\!\?]\s+|\n)([A-Z][\w\s&:\(\)]{2,50}?)\s*-{3,}\s+/gm, '\n\n#### $1\n\n')
      .replace(/(?:^|[\.\!\?]\s+|\n)([A-Z][\w\s&:\(\)]{2,50}?)\s*={3,}\s+/gm, '\n\n### $1\n\n')

    // Fix: Ensure bold headers start on a new line if they follow punctuation
    // e.g. "Previous text. **Next Section**" -> "Previous text.\n\n**Next Section**"
    // Also handle if the bold text is at the start of the string or newline
    processed = processed.replace(/(?<!\d)([.!?])\s+(\*\*[A-Z].+?\*\*)/g, '$1\n\n$2')

    // Fix: Ensure list items with * start on a new line
    // e.g. "We recommend: * Item 1 * Item 2" -> "We recommend:\n* Item 1\n* Item 2"
    // Look for space-asterisk-space (or colon-space-asterisk-space)
    // We use a positive lookbehind (?<=) equivalent or capture group to simplify replacing
    processed = processed.replace(/([^\n])\s+(\*\s+[A-Za-z0-9])/g, '$1\n$2')

    // Fix: Ensure ordered list items start on a new line
    // e.g. "Previous item. 2. Next item" -> "Previous item.\n\n2. Next item"
    processed = processed.replace(/([^\n])\s+(\d+\.\s+[A-Z])/g, '$1\n\n$2')

    // Handle cases where === is on the same line but maybe not caught by multiline anchor if text is weird
    // e.g. "Summary =======" at end of string
    if (processed.match(/[=-]{3,}$/)) {
      processed = processed
        .replace(/([A-Z][\w\s&:\(\)]{2,50}?)\s*-{3,}$/gm, '\n\n#### $1')
        .replace(/([A-Z][\w\s&:\(\)]{2,50}?)\s*={3,}$/gm, '\n\n### $1')
    }

    return processed
  }, [content])

  return (
    <div
      className={cn(
        'w-full max-w-none prose prose-slate md:prose-lg dark:prose-invert',
        'prose-p:leading-relaxed prose-p:mb-5',
        'prose-headings:font-semibold prose-headings:tracking-tight prose-headings:mb-4 prose-headings:mt-8',
        'prose-strong:font-bold prose-strong:text-inherit',
        'prose-code:text-[0.9em] prose-code:font-normal prose-code:bg-transparent prose-code:px-0 prose-code:py-0 prose-code:before:content-none prose-code:after:content-none',
        'prose-ul:my-5 prose-ol:my-5',
        // 'prose-li:my-2', // Remove default li margin to handle custom styling
        'prose-blockquote:border-l-4 prose-blockquote:border-gray-300 dark:prose-blockquote:border-gray-700 prose-blockquote:bg-gray-50 dark:prose-blockquote:bg-gray-900/50 prose-blockquote:py-2 prose-blockquote:rounded-r-xl',

        // Base text styling
        isDarkTheme
          ? 'text-gray-100 text-[14px] leading-[1.75] font-normal'
          : 'text-[14px] text-gray-800 leading-[1.75] font-normal', // ChatGPT-like body text

        // Ensure last item doesn't have extra bottom margin
        '[&>*:last-child]:mb-0',

        // Fix overflow issues with long unbroken links/text
        'break-words [word-break:break-word] overflow-wrap-anywhere prose-a:break-all',

        className
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex, rehypeRaw]}
        urlTransform={(url) => url}
        components={{
          // Custom Paragraph to ensure wrapping correctly
          p: ({ children }) => (
            <p className="mb-5 whitespace-normal break-words [word-break:break-word] overflow-wrap-anywhere last:mb-0">
              {children}
            </p>
          ),

          // Custom Heading styling
          h1: ({ children }) => <h1 className="text-xl font-bold mt-6 mb-3 first:mt-0 break-words [word-break:break-word] overflow-wrap-anywhere">{children}</h1>,
          h2: ({ children }) => <h2 className="text-lg font-bold mt-5 mb-2 break-words [word-break:break-word] overflow-wrap-anywhere">{children}</h2>,
          h3: ({ children }) => <h3 className="text-base font-bold mt-4 mb-2 break-words [word-break:break-word] overflow-wrap-anywhere">{children}</h3>,

          // Enhanced Code blocks with ChatGPT header
          code: ({ className, children, ...props }: any) => {
            const match = /language-(\w+)/.exec(className || '')
            const isInline = !match

            if (isInline) {
              return (
                <code
                  className={cn(
                    'px-1.5 py-0.5 rounded-md font-mono text-[0.9em] bg-black/5 dark:bg-white/10',
                    'whitespace-pre-wrap break-all'
                  )}
                  {...props}
                >
                  {children}
                </code>
              )
            }

            const language = match[1]
            const codeString = String(children).replace(/\n$/, '')
            const isCopied = copiedCode === codeString

            return (
              <div className="group relative my-6 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-black shadow-sm">
                <div className="flex items-center justify-between px-4 py-2.5 bg-black text-[#d1d5db] border-b border-gray-200 dark:border-gray-700">
                  <span className="text-xs font-sans font-medium">{language}</span>
                  <button
                    onClick={() => copyToClipboard(codeString)}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs hover:bg-white/10 transition-colors"
                  >
                    {isCopied ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-green-400" />
                        <span className="text-green-400">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        <span>Copy code</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="overflow-x-auto scrollbar-minimal">
                  <SyntaxHighlighter
                    style={vscDarkPlus}
                    language={language}
                    PreTag="div"
                    customStyle={{
                      margin: 0,
                      padding: '1.5rem',
                      background: 'transparent',
                      fontSize: '14px',
                      lineHeight: '1.6',
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    {codeString}
                  </SyntaxHighlighter>
                </div>
              </div>
            )
          },

          // Better Tables
          table: ({ children }) => (
            <div className="my-6 overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800 m-0 text-sm">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => <thead className="bg-gray-50 dark:bg-gray-900">{children}</thead>,
          th: ({ children }) => (
            <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wider">
              {children}
            </th>
          ),
          tbody: ({ children }) => <tbody className="divide-y divide-gray-200 dark:divide-gray-800">{children}</tbody>,
          tr: ({ children }) => <tr className="hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors">{children}</tr>,
          td: ({ children }) => <td className="px-4 py-3 whitespace-nowrap">{children}</td>,

          // Improved Links
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline decoration-blue-500/30 underline-offset-4"
            >
              {children}
              {href?.startsWith('http') && <ExternalLink className="h-3.5 w-3.5 opacity-50" />}
            </a>
          ),

          // Stylized Blockquotes
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-slate-300 dark:border-slate-600 pl-4 py-1 my-6 italic text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50 rounded-r-xl">
              {children}
            </blockquote>
          ),

          // Lists and stylized items
          ul: ({ children }) => <ul className="list-disc pl-8 my-5 space-y-3 marker:text-blue-500">{children}</ul>,
          // Renders ordered lists as dots based on user preference, matching UL styling
          ol: ({ children }) => <ol className="list-disc pl-8 my-5 space-y-3 marker:text-blue-500">{children}</ol>,
          li: ({ children }) => <li className="pl-1 text-gray-800 dark:text-gray-200">{children}</li>,

          // Images with premium styling
          img: ({ src, alt }) => {
            const cleanSrc = src?.replace(/\s/g, '') || ''
            return (
              <div className="my-10 flex flex-col items-center">
                <img
                  src={cleanSrc}
                  alt={alt || 'Visual content'}
                  className="rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 max-w-full h-auto hover:scale-[1.01] transition-transform duration-500"
                  loading="lazy"
                />
                {alt && <span className="mt-4 text-sm text-slate-500 font-medium italic">{alt}</span>}
              </div>
            )
          },

          // Custom horizontal rule
          hr: () => <hr className="my-10 border-slate-200 dark:border-slate-800" />,
        }}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  )
}


