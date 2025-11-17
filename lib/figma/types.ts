// Figma API Types

export interface FigmaUser {
  id: string
  email: string
  handle: string
  img_url: string
}

export interface FigmaFile {
  name: string
  lastModified: string
  thumbnailUrl: string
  version: string
  document: FigmaNode
  components: Record<string, FigmaComponent>
  schemaVersion: number
  styles: Record<string, FigmaStyle>
}

export interface FigmaNode {
  id: string
  name: string
  type: NodeType
  children?: FigmaNode[]
  // Layout properties
  absoluteBoundingBox?: {
    x: number
    y: number
    width: number
    height: number
  }
  // Style properties
  backgroundColor?: Color
  fills?: Paint[]
  strokes?: Paint[]
  strokeWeight?: number
  cornerRadius?: number
  // Text properties
  characters?: string
  style?: TypeStyle
  // Constraints
  constraints?: LayoutConstraint
  // Component properties
  componentId?: string
  // Frame properties
  clipsContent?: boolean
  layoutMode?: 'NONE' | 'HORIZONTAL' | 'VERTICAL'
  primaryAxisSizingMode?: 'FIXED' | 'AUTO'
  counterAxisSizingMode?: 'FIXED' | 'AUTO'
  paddingLeft?: number
  paddingRight?: number
  paddingTop?: number
  paddingBottom?: number
  itemSpacing?: number
  // Effects
  effects?: Effect[]
  // Blend mode
  blendMode?: BlendMode
  opacity?: number
}

export type NodeType =
  | 'DOCUMENT'
  | 'CANVAS'
  | 'FRAME'
  | 'GROUP'
  | 'VECTOR'
  | 'BOOLEAN_OPERATION'
  | 'STAR'
  | 'LINE'
  | 'ELLIPSE'
  | 'REGULAR_POLYGON'
  | 'RECTANGLE'
  | 'TEXT'
  | 'SLICE'
  | 'COMPONENT'
  | 'COMPONENT_SET'
  | 'INSTANCE'

export interface Color {
  r: number
  g: number
  b: number
  a: number
}

export interface Paint {
  type: 'SOLID' | 'GRADIENT_LINEAR' | 'GRADIENT_RADIAL' | 'GRADIENT_ANGULAR' | 'GRADIENT_DIAMOND' | 'IMAGE' | 'EMOJI'
  visible?: boolean
  opacity?: number
  color?: Color
  gradientHandlePositions?: Vector[]
  gradientStops?: ColorStop[]
  scaleMode?: 'FILL' | 'FIT' | 'TILE' | 'STRETCH'
  imageRef?: string
}

export interface Vector {
  x: number
  y: number
}

export interface ColorStop {
  position: number
  color: Color
}

export interface TypeStyle {
  fontFamily: string
  fontPostScriptName: string
  fontWeight: number
  fontSize: number
  textAlignHorizontal: 'LEFT' | 'CENTER' | 'RIGHT' | 'JUSTIFIED'
  textAlignVertical: 'TOP' | 'CENTER' | 'BOTTOM'
  letterSpacing: number
  lineHeightPx: number
  lineHeightPercent: number
}

export interface LayoutConstraint {
  vertical: 'TOP' | 'BOTTOM' | 'CENTER' | 'TOP_BOTTOM' | 'SCALE'
  horizontal: 'LEFT' | 'RIGHT' | 'CENTER' | 'LEFT_RIGHT' | 'SCALE'
}

export interface Effect {
  type: 'INNER_SHADOW' | 'DROP_SHADOW' | 'LAYER_BLUR' | 'BACKGROUND_BLUR'
  visible: boolean
  radius: number
  color?: Color
  offset?: Vector
  spread?: number
}

export type BlendMode =
  | 'PASS_THROUGH'
  | 'NORMAL'
  | 'DARKEN'
  | 'MULTIPLY'
  | 'LINEAR_BURN'
  | 'COLOR_BURN'
  | 'LIGHTEN'
  | 'SCREEN'
  | 'LINEAR_DODGE'
  | 'COLOR_DODGE'
  | 'OVERLAY'
  | 'SOFT_LIGHT'
  | 'HARD_LIGHT'
  | 'DIFFERENCE'
  | 'EXCLUSION'
  | 'HUE'
  | 'SATURATION'
  | 'COLOR'
  | 'LUMINOSITY'

export interface FigmaComponent {
  key: string
  name: string
  description: string
  componentSetId?: string
}

export interface FigmaStyle {
  key: string
  name: string
  styleType: 'FILL' | 'TEXT' | 'EFFECT' | 'GRID'
  description: string
}

export interface FigmaImagesResponse {
  images: Record<string, string>
  err?: string
}

export interface FigmaFileNodesResponse {
  nodes: Record<string, {
    document: FigmaNode
    components: Record<string, FigmaComponent>
    schemaVersion: number
    styles: Record<string, FigmaStyle>
  }>
  err?: string
}

export interface ParsedFigmaUrl {
  fileKey: string
  fileName?: string
  nodeId?: string
}

export class FigmaApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public response?: any
  ) {
    super(message)
    this.name = 'FigmaApiError'
  }
}
