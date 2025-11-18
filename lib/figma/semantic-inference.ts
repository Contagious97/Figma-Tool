import { DetectedButton } from './button-detector'
import { Connection } from './flow-parser'

export interface SuggestedConnection extends Connection {
  confidence: number // 0-100
  reasoning: string
}

export class SemanticInference {
  private readonly COMMON_PATTERNS = [
    { pattern: /log\s*in|sign\s*in|login/i, target: /dashboard|home/i },
    { pattern: /sign\s*up|register|create account/i, target: /confirm|verify|welcome/i },
    { pattern: /forgot password|reset password/i, target: /email|check|sent/i },
    { pattern: /next|continue/i, target: /step|page|screen/i },
    { pattern: /back|previous/i, target: /previous|last/i },
    { pattern: /settings|preferences/i, target: /settings|config/i },
    { pattern: /profile|account/i, target: /profile|account/i },
    { pattern: /checkout|pay|purchase/i, target: /payment|confirm|success/i },
    { pattern: /search/i, target: /results|search/i },
    { pattern: /view details|see more|learn more/i, target: /detail|info/i },
  ]

  inferConnections(
    buttons: DetectedButton[],
    frames: Map<string, { id: string; name: string }>,
    existingConnections: Connection[]
  ): SuggestedConnection[] {
    const suggestions: SuggestedConnection[] = []
    const existingPairs = new Set(
      existingConnections.map((c) => `${c.fromFrameId}-${c.toFrameId}`)
    )

    for (const button of buttons) {
      // Skip if already has prototype connection
      if (button.destination) continue

      const potentials = this.findPotentialDestinations(button, frames)

      for (const potential of potentials) {
        const pairKey = `${button.frameId}-${potential.frameId}`

        // Skip if connection already exists
        if (existingPairs.has(pairKey)) continue

        suggestions.push({
          id: `suggested-${button.id}-${potential.frameId}`,
          fromFrameId: button.frameId,
          toFrameId: potential.frameId,
          triggerElementId: button.id,
          connectionType: 'semantic',
          interactionType: 'tap',
          confirmed: false,
          confidence: potential.confidence,
          reasoning: potential.reasoning,
        })
      }
    }

    return suggestions.sort((a, b) => b.confidence - a.confidence)
  }

  private findPotentialDestinations(
    button: DetectedButton,
    frames: Map<string, { id: string; name: string }>
  ): Array<{ frameId: string; confidence: number; reasoning: string }> {
    const buttonLabel = button.label.toLowerCase()
    const potentials: Array<{
      frameId: string
      confidence: number
      reasoning: string
    }> = []

    // Check against common patterns
    for (const { pattern, target } of this.COMMON_PATTERNS) {
      if (pattern.test(buttonLabel)) {
        // Find frames matching target pattern
        Array.from(frames.entries()).forEach(([frameId, frame]) => {
          // Don't suggest same frame
          if (frameId === button.frameId) return

          if (target.test(frame.name.toLowerCase())) {
            potentials.push({
              frameId,
              confidence: 80,
              reasoning: `Button "${button.label}" commonly leads to screens like "${frame.name}"`,
            })
          }
        })
      }
    }

    // String similarity matching
    Array.from(frames.entries()).forEach(([frameId, frame]) => {
      if (frameId === button.frameId) return

      const similarity = this.stringSimilarity(buttonLabel, frame.name.toLowerCase())

      if (similarity > 0.6) {
        potentials.push({
          frameId,
          confidence: Math.round(similarity * 70), // Max 70% confidence
          reasoning: `Button label "${button.label}" is similar to frame "${frame.name}"`,
        })
      }
    })

    // Extract destination hints from button label
    const destinationHints = this.extractDestinationHints(buttonLabel)

    for (const hint of destinationHints) {
      Array.from(frames.entries()).forEach(([frameId, frame]) => {
        if (frameId === button.frameId) return

        if (frame.name.toLowerCase().includes(hint)) {
          potentials.push({
            frameId,
            confidence: 65,
            reasoning: `Button mentions "${hint}" which appears in frame "${frame.name}"`,
          })
        }
      })
    }

    // Deduplicate and return top suggestions
    const unique = new Map<string, (typeof potentials)[0]>()

    for (const potential of potentials) {
      const existing = unique.get(potential.frameId)

      if (!existing || potential.confidence > existing.confidence) {
        unique.set(potential.frameId, potential)
      }
    }

    return Array.from(unique.values())
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 3) // Top 3 suggestions per button
  }

  private stringSimilarity(str1: string, str2: string): number {
    // Levenshtein distance
    const longer = str1.length > str2.length ? str1 : str2
    const shorter = str1.length > str2.length ? str2 : str1

    if (longer.length === 0) return 1.0

    const editDistance = this.levenshteinDistance(longer, shorter)
    return (longer.length - editDistance) / longer.length
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = []

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i]
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1]
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          )
        }
      }
    }

    return matrix[str2.length][str1.length]
  }

  private extractDestinationHints(label: string): string[] {
    const hints: string[] = []

    // "Go to X", "Open X", "View X"
    const goToMatch = label.match(/(?:go to|open|view|see|show)\s+(\w+)/i)
    if (goToMatch) {
      hints.push(goToMatch[1])
    }

    // "X screen", "X page"
    const screenMatch = label.match(/(\w+)\s+(?:screen|page)/i)
    if (screenMatch) {
      hints.push(screenMatch[1])
    }

    return hints
  }
}
