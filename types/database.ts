/**
 * TypeScript type definitions for database models
 * Based on the complete database schema
 */

export interface User {
  id: string
  name: string | null
  email: string
  email_verified: Date | null
  image: string | null
  created_at: Date
  updated_at: Date
}

export interface Account {
  id: string
  user_id: string
  type: string
  provider: string
  provider_account_id: string
  refresh_token: string | null
  access_token: string | null
  expires_at: number | null
  token_type: string | null
  scope: string | null
  id_token: string | null
  session_state: string | null
  created_at: Date
  updated_at: Date
}

export interface Session {
  id: string
  session_token: string
  user_id: string
  expires: Date
  created_at: Date
}

export interface UserToken {
  user_id: string
  figma_token: string // Encrypted
  created_at: Date
  updated_at: Date
}

export type ProjectStatus = 'pending' | 'processing' | 'completed' | 'failed'

export interface Project {
  id: string
  user_id: string
  figma_file_id: string
  figma_file_name: string
  selected_pages: string[]
  status: ProjectStatus
  created_at: Date
  updated_at: Date
}

export type FrameType = 'FRAME' | 'COMPONENT' | 'INSTANCE'
export type DeviceType = 'mobile' | 'tablet' | 'desktop' | 'other'
export type ClassificationConfidence = 'high' | 'medium' | 'low'

export interface Frame {
  id: string
  project_id: string
  figma_node_id: string
  name: string
  type: FrameType
  width: number
  height: number
  x: number
  y: number
  page_id: string
  page_name: string
  background_color: string | null
  thumbnail_url: string | null
  device_type: DeviceType | null
  device_classification_confidence: ClassificationConfidence | null
  device_classification_reason: string | null
  canvas_position: { x: number; y: number } | null
  group_id: string | null
  analysis_data: Record<string, any> | null
  created_at: Date
  updated_at: Date
}

export type ComponentType = 'component' | 'variant'

export interface Component {
  id: string
  project_id: string
  figma_component_id: string
  figma_component_key: string
  name: string
  description: string | null
  type: ComponentType
  variant_group_id: string | null
  variant_properties: Record<string, string> | null
  width: number | null
  height: number | null
  containing_page: string | null
  instance_count: number
  thumbnail_url: string | null
  created_at: Date
  updated_at: Date
}

export interface ComponentInstance {
  id: string
  project_id: string
  instance_id: string
  component_id: string
  component_key: string
  frame_id: string
  name: string | null
  x: number | null
  y: number | null
  overrides: Record<string, any> | null
  scale_factor: number
  created_at: Date
}

export type ButtonType = 'primary' | 'secondary' | 'tertiary' | 'text' | 'icon'
export type ButtonState = 'default' | 'hover' | 'pressed' | 'disabled'

export interface Button {
  id: string
  project_id: string
  frame_id: string
  figma_node_id: string
  name: string | null
  label: string | null
  type: ButtonType | null
  state: ButtonState | null
  x: number | null
  y: number | null
  width: number | null
  height: number | null
  component_id: string | null
  destination_frame_id: string | null
  confidence: number | null
  detection_reasons: string[] | null
  created_at: Date
}

export type InputFieldType = 'text' | 'email' | 'password' | 'number' | 'search' | 'textarea'
export type InputFieldState = 'default' | 'focus' | 'error' | 'disabled'

export interface InputField {
  id: string
  project_id: string
  frame_id: string
  figma_node_id: string
  name: string | null
  type: InputFieldType | null
  placeholder: string | null
  label: string | null
  required: boolean
  state: InputFieldState | null
  x: number | null
  y: number | null
  width: number | null
  height: number | null
  confidence: number | null
  created_at: Date
}

export type ConnectionType = 'prototype' | 'semantic' | 'manual'
export type InteractionType = 'tap' | 'hover' | 'drag' | 'key' | 'timer' | 'other'
export type TransitionType = 'instant' | 'dissolve' | 'slide' | 'push' | 'move'

export interface Connection {
  id: string
  project_id: string
  from_frame_id: string
  to_frame_id: string
  trigger_element_id: string | null
  connection_type: ConnectionType
  interaction_type: InteractionType | null
  transition_type: TransitionType | null
  duration: number | null
  easing: string | null
  confirmed: boolean
  confidence: number | null
  reasoning: string | null
  created_by: string | null
  created_at: Date
}

export type ColorCategory = 'primary' | 'secondary' | 'accent' | 'neutral' | 'semantic'

export interface Color {
  id: string
  project_id: string
  hex: string
  r: number
  g: number
  b: number
  a: number
  h: number | null
  s: number | null
  l: number | null
  usage_count: number
  usage_types: string[]
  category: ColorCategory | null
  created_at: Date
  updated_at: Date
}

export type TextCase = 'ORIGINAL' | 'UPPER' | 'LOWER' | 'TITLE'
export type TextDecoration = 'NONE' | 'UNDERLINE' | 'STRIKETHROUGH'
export type TypographyCategory = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'body' | 'body-sm' | 'caption'

export interface TypographyStyle {
  id: string
  project_id: string
  font_family: string
  font_weight: number
  font_size: number
  line_height: number | null
  letter_spacing: number | null
  text_case: TextCase | null
  text_decoration: TextDecoration | null
  usage_count: number
  category: TypographyCategory | null
  examples: Array<{ text: string; nodeName: string }> | null
  created_at: Date
  updated_at: Date
}

export interface SpacingScale {
  id: string
  project_id: string
  detected_scale: number[]
  all_values: number[]
  base_unit: number | null
  created_at: Date
  updated_at: Date
}

export interface FrameGroup {
  id: string
  project_id: string
  name: string
  color: string | null
  description: string | null
  parent_group_id: string | null
  created_at: Date
  updated_at: Date
}

export type ExportFormat = 'csv' | 'json' | 'llm'

export interface Export {
  id: string
  project_id: string
  user_id: string
  format: ExportFormat
  file_size: number | null
  download_count: number
  created_at: Date
}

export interface AuditLog {
  id: string
  user_id: string | null
  action: string
  entity_type: string | null
  entity_id: string | null
  metadata: Record<string, any> | null
  ip_address: string | null
  user_agent: string | null
  created_at: Date
}
