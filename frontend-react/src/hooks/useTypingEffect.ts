/**
 * useTypingEffect Hook
 * Simulates a typing effect by gradually revealing text
 * Makes streaming responses appear slower and more readable
 */

import { useState, useEffect, useRef } from 'react'

interface UseTypingEffectOptions {
    /**
     * Speed in characters per second
     * Default: 50 (similar to ChatGPT)
     */
    speed?: number

    /**
     * Whether typing is currently active
     */
    isTyping?: boolean
}

/**
 * Hook that creates a typing effect for streaming text
 * @param fullText - The complete text to display
 * @param options - Configuration options
 * @returns The text to display (gradually revealed)
 */
export function useTypingEffect(
    fullText: string,
    options: UseTypingEffectOptions = {}
): string {
    const { speed = 50, isTyping = true } = options

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

        // If we've already displayed all text, no need to animate
        if (displayedLengthRef.current >= fullText.length) {
            setDisplayedText(fullText)
            return
        }

        // Calculate delay between characters (in milliseconds)
        const delayMs = 1000 / speed

        // Gradually reveal text
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
