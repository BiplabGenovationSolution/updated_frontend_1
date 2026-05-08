/**
 * useStableTypingEffect Hook
 * Simulates a typing effect with stable rendering to prevent layout shifts
 * Updates at word boundaries instead of every character
 */

import { useState, useEffect, useRef } from 'react'

interface UseStableTypingEffectOptions {
    /**
     * Speed in characters per second
     * Default: 15 (similar to ChatGPT)
     */
    speed?: number
}

/**
 * Hook that creates a typing effect with stable rendering
 * Updates at word/sentence boundaries to prevent Markdown re-parsing on every character
 * @param fullText - The complete text to display
 * @param options - Configuration options
 * @returns The text to display (gradually revealed at word boundaries)
 */
export function useStableTypingEffect(
    fullText: string,
    options: UseStableTypingEffectOptions = {}
): string {
    const { speed = 15 } = options

    const [displayedText, setDisplayedText] = useState('')
    const fullTextRef = useRef(fullText)
    const displayedLengthRef = useRef(0)

    useEffect(() => {
        // Update ref when fullText changes
        fullTextRef.current = fullText

        // If text is empty, reset
        if (!fullText) {
            setDisplayedText('')
            displayedLengthRef.current = 0
            return
        }

        // If fullText is shorter than displayed (e.g., new message), reset
        if (fullText.length < displayedLengthRef.current) {
            setDisplayedText(fullText)
            displayedLengthRef.current = fullText.length
            return
        }

        // If we've already displayed all text, show it
        if (displayedLengthRef.current >= fullText.length) {
            setDisplayedText(fullText)
            return
        }

        // Calculate delay between updates (in milliseconds)
        // Update 1 character at a time for very slow, smooth effect
        const delayMs = 1000 / speed

        // Gradually reveal text in chunks
        const timer = setInterval(() => {
            const currentDisplayed = displayedLengthRef.current
            const targetLength = fullTextRef.current.length

            if (currentDisplayed < targetLength) {
                // Reveal next character
                const nextLength = currentDisplayed + 1
                setDisplayedText(fullTextRef.current.slice(0, nextLength))
                displayedLengthRef.current = nextLength
            } else {
                // All text revealed, stop timer
                clearInterval(timer)
            }
        }, delayMs)

        return () => clearInterval(timer)
    }, [fullText, speed])

    return displayedText
}
