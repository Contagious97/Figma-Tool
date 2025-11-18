export class CSVGenerator {
  generateProjectExport(projectData: {
    project: any
    frames: any[]
    components: any[]
    connections: any[]
    designSystem: {
      colors: any[]
      typography: any[]
      spacing: any
    }
  }): string {
    const sections: string[] = []

    // Header
    sections.push(this.generateHeader(projectData.project))
    sections.push('')

    // Design System
    sections.push('## DESIGN SYSTEM')
    sections.push('')
    sections.push(this.generateColorTable(projectData.designSystem.colors))
    sections.push('')
    sections.push(this.generateTypographyTable(projectData.designSystem.typography))
    sections.push('')
    sections.push(this.generateSpacingTable(projectData.designSystem.spacing))
    sections.push('')

    // Frames
    sections.push('## FRAMES')
    sections.push('')
    sections.push(this.generateFramesTable(projectData.frames))
    sections.push('')

    // Components
    sections.push('## COMPONENTS')
    sections.push('')
    sections.push(this.generateComponentsTable(projectData.components))
    sections.push('')

    // Frame Details
    sections.push('## FRAME DETAILS')
    for (const frame of projectData.frames) {
      sections.push('')
      sections.push(this.generateFrameDetail(frame))
    }
    sections.push('')

    // Connections
    sections.push('## CONNECTIONS')
    sections.push('')
    sections.push(this.generateConnectionsTable(projectData.connections))
    sections.push('')

    return sections.join('\n')
  }

  private generateHeader(project: any): string {
    return [
      '# FIGMA DESIGN EXPORT',
      `Project: ${project.fileName || project.file_name}`,
      `Figma File: ${project.figmaFileKey || project.figma_file_key}`,
      `Exported: ${new Date().toISOString()}`,
      `Total Frames: ${project.frame_count || 0}`,
    ].join('\n')
  }

  private generateColorTable(colors: any[]): string {
    const lines: string[] = []
    lines.push('### Colors')
    lines.push('hex,rgb,hsl,usage_count,usage_type,category')

    for (const color of colors) {
      const rgb = color.rgba || color.rgb || { r: 0, g: 0, b: 0 }
      const rgbStr = `rgb(${Math.round(rgb.r * 255)}, ${Math.round(
        rgb.g * 255
      )}, ${Math.round(rgb.b * 255)})`

      lines.push(
        [
          color.hex,
          `"${rgbStr}"`,
          `""`, // HSL not computed
          color.usageCount || color.usage_count || 0,
          Array.isArray(color.usageType)
            ? color.usageType.join('|')
            : color.usage_type || 'unknown',
          color.category || 'unknown',
        ].join(',')
      )
    }

    return lines.join('\n')
  }

  private generateTypographyTable(typography: any[]): string {
    const lines: string[] = []
    lines.push('### Typography')
    lines.push(
      'font_family,font_weight,font_size,line_height,letter_spacing,category,usage_count'
    )

    for (const style of typography) {
      lines.push(
        [
          `"${style.fontFamily || style.font_family}"`,
          style.fontWeight || style.font_weight,
          style.fontSize || style.font_size,
          style.lineHeight || style.line_height,
          style.letterSpacing || style.letter_spacing || 0,
          style.category,
          style.usageCount || style.usage_count,
        ].join(',')
      )
    }

    return lines.join('\n')
  }

  private generateSpacingTable(spacing: any): string {
    const lines: string[] = []
    lines.push('### Spacing Scale')
    lines.push('value')

    const scale = spacing.detectedScale || spacing.detected_scale || []
    for (const value of scale) {
      lines.push(String(value))
    }

    return lines.join('\n')
  }

  private generateFramesTable(frames: any[]): string {
    const lines: string[] = []
    lines.push(
      'frame_id,name,device_type,width,height,page_name,components_count,buttons_count,thumbnail_url'
    )

    for (const frame of frames) {
      lines.push(
        [
          frame.id,
          `"${this.escapeCsv(frame.name)}"`,
          frame.deviceType || frame.device_type,
          frame.width,
          frame.height,
          `"${this.escapeCsv(frame.pageName || frame.page_name || '')}"`,
          frame.componentsCount || frame.components_count || 0,
          frame.buttonsCount || frame.buttons_count || 0,
          frame.thumbnailUrl || frame.thumbnail || '',
        ].join(',')
      )
    }

    return lines.join('\n')
  }

  private generateComponentsTable(components: any[]): string {
    const lines: string[] = []
    lines.push(
      'component_id,component_key,name,type,width,height,instance_count,containing_page'
    )

    for (const component of components) {
      lines.push(
        [
          component.figmaComponentId || component.figma_component_id,
          component.figmaComponentKey || component.figma_component_key,
          `"${this.escapeCsv(component.name)}"`,
          component.type,
          component.width,
          component.height,
          component.instanceCount || component.instance_count,
          `"${this.escapeCsv(component.containingPage || component.containing_page || '')}"`,
        ].join(',')
      )
    }

    return lines.join('\n')
  }

  private generateFrameDetail(frame: any): string {
    const lines: string[] = []

    lines.push(`### ${frame.name}`)
    lines.push(`Device: ${frame.deviceType || frame.device_type}`)
    lines.push(`Dimensions: ${frame.width}×${frame.height}px`)
    lines.push(`Page: ${frame.pageName || frame.page_name || 'Unknown'}`)
    lines.push('')

    // Analysis data
    const analysisData = frame.analysisData || frame.analysis_data
    if (analysisData) {
      const analysis = typeof analysisData === 'string' ? JSON.parse(analysisData) : analysisData

      // Layout
      if (analysis.layout) {
        lines.push('**Layout:**')
        lines.push(`- Type: ${analysis.layout.type}`)
        if (analysis.layout.direction) {
          lines.push(`- Direction: ${analysis.layout.direction}`)
        }
        if (analysis.layout.gap) {
          lines.push(`- Gap: ${analysis.layout.gap}px`)
        }
        lines.push('')
      }

      // Colors
      if (analysis.colors && analysis.colors.length > 0) {
        lines.push('**Colors Used:**')
        for (const color of analysis.colors.slice(0, 5)) {
          lines.push(`- ${color.hex} (${color.usageCount} uses)`)
        }
        lines.push('')
      }

      // Typography
      if (analysis.typography && analysis.typography.length > 0) {
        lines.push('**Typography:**')
        for (const typo of analysis.typography.slice(0, 5)) {
          lines.push(
            `- ${typo.fontFamily} ${typo.fontWeight} ${typo.fontSize}px (${typo.category})`
          )
        }
        lines.push('')
      }

      // Components
      if (analysis.components && analysis.components.length > 0) {
        lines.push('**Components:**')
        for (const comp of analysis.components) {
          lines.push(`- ${comp.name} at (${comp.x}, ${comp.y})`)
        }
        lines.push('')
      }

      // Elements
      if (analysis.elements && analysis.elements.length > 0) {
        lines.push('**Elements:**')
        const buttons = analysis.elements.filter((e: any) =>
          e.name.toLowerCase().includes('button')
        )
        if (buttons.length > 0) {
          lines.push('Buttons:')
          for (const btn of buttons) {
            lines.push(`  - "${btn.name}" at (${btn.x}, ${btn.y})`)
          }
        }
        lines.push('')
      }
    }

    return lines.join('\n')
  }

  private generateConnectionsTable(connections: any[]): string {
    const lines: string[] = []
    lines.push('from_frame,to_frame,connection_type,interaction_type,trigger_element')

    for (const conn of connections) {
      lines.push(
        [
          conn.fromFrameName || conn.from_frame_name || conn.fromFrameId || conn.from_frame_id,
          conn.toFrameName || conn.to_frame_name || conn.toFrameId || conn.to_frame_id,
          conn.connectionType || conn.connection_type,
          conn.interactionType || conn.interaction_type,
          conn.triggerElementName || conn.trigger_element_name || '',
        ].join(',')
      )
    }

    return lines.join('\n')
  }

  private escapeCsv(value: string): string {
    if (!value) return ''
    return value.replace(/"/g, '""')
  }
}
