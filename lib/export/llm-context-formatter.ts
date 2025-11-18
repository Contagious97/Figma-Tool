export class LLMContextFormatter {
  formatForLLM(projectData: any): string {
    const sections: string[] = []

    sections.push('# DESIGN CONTEXT FOR LLM')
    sections.push('')
    sections.push(this.formatProjectOverview(projectData.project))
    sections.push('')
    sections.push(this.formatDesignSystem(projectData.designSystem))
    sections.push('')
    sections.push(this.formatScreens(projectData.frames))
    sections.push('')
    sections.push(this.formatFlows(projectData.connections))

    return sections.join('\n')
  }

  private formatProjectOverview(project: any): string {
    const frameCount = project.frame_count || project.frameCount || 0
    const mobileCount = project.mobile_count || project.mobileCount || 0
    const tabletCount = project.tablet_count || project.tabletCount || 0
    const desktopCount = project.desktop_count || project.desktopCount || 0

    return [
      '## PROJECT OVERVIEW',
      '',
      `This is a ${frameCount}-screen application designed in Figma.`,
      `The design includes ${mobileCount} mobile screens, ${tabletCount} tablet screens, and ${desktopCount} desktop screens.`,
      '',
    ].join('\n')
  }

  private formatDesignSystem(designSystem: any): string {
    const lines: string[] = []

    lines.push('## DESIGN SYSTEM')
    lines.push('')
    lines.push('When implementing this design, you must follow these exact specifications:')
    lines.push('')

    // Colors
    lines.push('### Colors')
    lines.push('')
    const primary = designSystem.colors.find((c: any) => c.category === 'primary')
    const secondary = designSystem.colors.find((c: any) => c.category === 'secondary')
    const neutrals = designSystem.colors.filter((c: any) => c.category === 'neutral')

    if (primary) {
      lines.push(`**Primary Color:** ${primary.hex}`)
      lines.push(`  - Use for: Primary buttons, links, key interactive elements`)
      lines.push('')
    }

    if (secondary) {
      lines.push(`**Secondary Color:** ${secondary.hex}`)
      lines.push(`  - Use for: Secondary actions, accents`)
      lines.push('')
    }

    if (neutrals.length > 0) {
      lines.push('**Neutral Colors:**')
      for (const neutral of neutrals.slice(0, 5)) {
        lines.push(`  - ${neutral.hex}`)
      }
      lines.push('')
    }

    // Typography
    lines.push('### Typography')
    lines.push('')
    const typeScale = designSystem.typography || []

    const h1 = typeScale.find((t: any) => t.category === 'h1')
    if (h1) {
      const fontFamily = h1.fontFamily || h1.font_family
      const fontWeight = h1.fontWeight || h1.font_weight
      const fontSize = h1.fontSize || h1.font_size
      const lineHeight = h1.lineHeight || h1.line_height
      lines.push(
        `**Heading 1:** ${fontFamily} ${fontWeight} ${fontSize}px / ${lineHeight}px`
      )
    }

    const body = typeScale.find((t: any) => t.category === 'body')
    if (body) {
      const fontFamily = body.fontFamily || body.font_family
      const fontWeight = body.fontWeight || body.font_weight
      const fontSize = body.fontSize || body.font_size
      const lineHeight = body.lineHeight || body.line_height
      lines.push(`**Body Text:** ${fontFamily} ${fontWeight} ${fontSize}px / ${lineHeight}px`)
    }
    lines.push('')

    // Spacing
    const spacing = designSystem.spacing
    if (spacing?.detectedScale || spacing?.detected_scale) {
      lines.push('### Spacing Scale')
      lines.push('')
      const scale = spacing.detectedScale || spacing.detected_scale
      lines.push(`Use these spacing values: ${scale.join(', ')}px`)
      lines.push('Maintain consistent spacing throughout the application.')
      lines.push('')
    }

    return lines.join('\n')
  }

  private formatScreens(frames: any[]): string {
    const lines: string[] = []

    lines.push('## SCREENS')
    lines.push('')

    // Group by device type
    const byDevice = frames.reduce((acc: any, frame: any) => {
      const deviceType = frame.deviceType || frame.device_type || 'other'
      if (!acc[deviceType]) acc[deviceType] = []
      acc[deviceType].push(frame)
      return acc
    }, {})

    for (const [deviceType, deviceFrames] of Object.entries(byDevice)) {
      lines.push(`### ${deviceType.toUpperCase()} SCREENS`)
      lines.push('')

      for (const frame of deviceFrames as any[]) {
        lines.push(this.formatSingleScreen(frame))
        lines.push('')
      }
    }

    return lines.join('\n')
  }

  private formatSingleScreen(frame: any): string {
    const lines: string[] = []

    lines.push(`**${frame.name}** (${frame.width}×${frame.height}px)`)
    lines.push('')

    const analysisData = frame.analysisData || frame.analysis_data
    if (analysisData) {
      const analysis = typeof analysisData === 'string' ? JSON.parse(analysisData) : analysisData

      // Layout description
      if (analysis.layout) {
        lines.push('Layout:')
        if (analysis.layout.type === 'stack') {
          lines.push(
            `  - Vertical ${analysis.layout.direction} stack with ${
              analysis.layout.gap || 0
            }px gaps`
          )
        } else if (analysis.layout.type === 'grid') {
          lines.push(
            `  - ${analysis.layout.columns}-column grid with ${
              analysis.layout.gutterSize || 0
            }px gutters`
          )
        }
      }

      // Key elements
      if (analysis.elements) {
        const buttons = analysis.elements.filter((e: any) =>
          ['button', 'btn'].some((k) => e.name.toLowerCase().includes(k))
        )
        const inputs = analysis.elements.filter((e: any) =>
          ['input', 'field'].some((k) => e.name.toLowerCase().includes(k))
        )

        if (buttons.length > 0) {
          lines.push('')
          lines.push('Buttons:')
          for (const btn of buttons.slice(0, 5)) {
            lines.push(`  - "${btn.name || btn.textContent}" button`)
          }
        }

        if (inputs.length > 0) {
          lines.push('')
          lines.push('Input Fields:')
          for (const input of inputs.slice(0, 5)) {
            lines.push(`  - ${input.name} input`)
          }
        }
      }

      // Components used
      if (analysis.components && analysis.components.length > 0) {
        lines.push('')
        lines.push('Components:')
        const compCounts = analysis.components.reduce((acc: any, comp: any) => {
          acc[comp.name] = (acc[comp.name] || 0) + 1
          return acc
        }, {})

        for (const [name, count] of Object.entries(compCounts)) {
          lines.push(`  - ${count}× ${name}`)
        }
      }
    }

    return lines.join('\n')
  }

  private formatFlows(connections: any[]): string {
    const lines: string[] = []

    lines.push('## USER FLOWS')
    lines.push('')
    lines.push('The following navigation flows exist in the design:')
    lines.push('')

    // Group by source frame
    const bySource = connections.reduce((acc: any, conn: any) => {
      const fromId = conn.fromFrameId || conn.from_frame_id
      if (!acc[fromId]) acc[fromId] = []
      acc[fromId].push(conn)
      return acc
    }, {})

    for (const [frameId, frameConnections] of Object.entries(bySource)) {
      const firstConn = (frameConnections as any[])[0]
      const fromName =
        firstConn.fromFrameName || firstConn.from_frame_name || firstConn.fromFrameId || frameId

      lines.push(`From **${fromName}**:`)

      for (const conn of frameConnections as any[]) {
        const toName = conn.toFrameName || conn.to_frame_name || conn.toFrameId || conn.to_frame_id
        const interactionType = conn.interactionType || conn.interaction_type
        lines.push(`  → ${toName} (${interactionType} interaction)`)
      }

      lines.push('')
    }

    return lines.join('\n')
  }
}
