import { pgTable, text, timestamp, uuid, varchar, boolean, jsonb, integer } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

// Users table - stores authenticated users from Google OAuth
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }),
  email: varchar('email', { length: 255 }).unique().notNull(),
  emailVerified: timestamp('email_verified'),
  image: text('image'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// Accounts table - OAuth provider information
export const accounts = pgTable('accounts', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  type: varchar('type', { length: 255 }).notNull(),
  provider: varchar('provider', { length: 255 }).notNull(),
  providerAccountId: varchar('provider_account_id', { length: 255 }).notNull(),
  refreshToken: text('refresh_token'),
  accessToken: text('access_token'),
  expiresAt: integer('expires_at'),
  tokenType: varchar('token_type', { length: 255 }),
  scope: text('scope'),
  idToken: text('id_token'),
  sessionState: text('session_state'),
})

// Sessions table - user sessions
export const sessions = pgTable('sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  sessionToken: varchar('session_token', { length: 255 }).unique().notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  expires: timestamp('expires').notNull(),
})

// Verification tokens table (for email verification)
export const verificationTokens = pgTable('verification_tokens', {
  identifier: text('identifier').notNull(),
  token: text('token').notNull(),
  expires: timestamp('expires').notNull(),
})

// User tokens table - encrypted Figma Personal Access Tokens
export const userTokens = pgTable('user_tokens', {
  userId: uuid('user_id').primaryKey().references(() => users.id, { onDelete: 'cascade' }),
  figmaToken: text('figma_token').notNull(), // Encrypted token
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// Projects table - represents imported Figma files
export const projects = pgTable('projects', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  figmaFileKey: varchar('figma_file_key', { length: 50 }).notNull(),
  fileName: text('file_name').notNull(),
  thumbnail: text('thumbnail'),
  lastModified: timestamp('last_modified'),
  figmaVersion: varchar('figma_version', { length: 50 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// Figma pages table - pages within a Figma file
export const figmaPages = pgTable('figma_pages', {
  id: uuid('id').defaultRandom().primaryKey(),
  projectId: uuid('project_id').references(() => projects.id, { onDelete: 'cascade' }).notNull(),
  figmaPageId: varchar('figma_page_id', { length: 50 }).notNull(),
  name: text('name').notNull(),
  order: integer('order').notNull(),
  included: boolean('included').default(true).notNull(), // User can exclude pages
})

// Figma frames table - frames/screens within pages
export const figmaFrames = pgTable('figma_frames', {
  id: uuid('id').defaultRandom().primaryKey(),
  pageId: uuid('page_id').references(() => figmaPages.id, { onDelete: 'cascade' }).notNull(),
  figmaNodeId: varchar('figma_node_id', { length: 50 }).notNull(),
  name: text('name').notNull(),
  type: varchar('type', { length: 50 }).notNull(), // FRAME, COMPONENT, etc.
  x: integer('x').notNull(),
  y: integer('y').notNull(),
  width: integer('width').notNull(),
  height: integer('height').notNull(),
  thumbnail: text('thumbnail'),
  backgroundColor: varchar('background_color', { length: 50 }),
  // Device classification
  deviceType: varchar('device_type', { length: 20 }), // mobile, tablet, desktop, other
  deviceClassificationConfidence: varchar('device_classification_confidence', { length: 20 }), // high, medium, low
  deviceClassificationReason: text('device_classification_reason'),
  // Parsed design data
  parsedData: jsonb('parsed_data'), // Stores all frame properties, children, styles
  analysisData: jsonb('analysis_data'), // Stores deep analysis results
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// Buttons table - detected interactive button elements
export const buttons = pgTable('buttons', {
  id: uuid('id').defaultRandom().primaryKey(),
  projectId: uuid('project_id').references(() => projects.id, { onDelete: 'cascade' }).notNull(),
  frameId: uuid('frame_id').references(() => figmaFrames.id, { onDelete: 'cascade' }).notNull(),
  figmaNodeId: varchar('figma_node_id', { length: 50 }).notNull(),
  name: text('name').notNull(),
  label: text('label').notNull(),
  type: varchar('type', { length: 20 }).notNull(), // primary, secondary, tertiary, text, icon, unknown
  state: varchar('state', { length: 20 }).notNull(), // default, hover, pressed, disabled, unknown
  x: integer('x').notNull(),
  y: integer('y').notNull(),
  width: integer('width').notNull(),
  height: integer('height').notNull(),
  componentId: varchar('component_id', { length: 50 }),
  destinationFrameId: uuid('destination_frame_id').references(() => figmaFrames.id, { onDelete: 'set null' }),
  destinationInteractionType: varchar('destination_interaction_type', { length: 20 }), // tap, hover, drag, key
  confidence: integer('confidence').notNull(), // 0-100
  detectionReasons: jsonb('detection_reasons').notNull(), // Array of strings
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// Input fields table - detected form input elements
export const inputFields = pgTable('input_fields', {
  id: uuid('id').defaultRandom().primaryKey(),
  projectId: uuid('project_id').references(() => projects.id, { onDelete: 'cascade' }).notNull(),
  frameId: uuid('frame_id').references(() => figmaFrames.id, { onDelete: 'cascade' }).notNull(),
  figmaNodeId: varchar('figma_node_id', { length: 50 }).notNull(),
  name: text('name').notNull(),
  type: varchar('type', { length: 20 }).notNull(), // text, email, password, number, search, textarea, unknown
  placeholder: text('placeholder'),
  label: text('label'),
  required: boolean('required').default(false).notNull(),
  x: integer('x').notNull(),
  y: integer('y').notNull(),
  width: integer('width').notNull(),
  height: integer('height').notNull(),
  state: varchar('state', { length: 20 }).notNull(), // default, focus, error, disabled
  confidence: integer('confidence').notNull(), // 0-100
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// Flow connections table - enhanced connection tracking between frames
export const flowConnections = pgTable('flow_connections', {
  id: uuid('id').defaultRandom().primaryKey(),
  projectId: uuid('project_id').references(() => projects.id, { onDelete: 'cascade' }).notNull(),
  sourceFrameId: uuid('source_frame_id').references(() => figmaFrames.id, { onDelete: 'cascade' }).notNull(),
  targetFrameId: uuid('target_frame_id').references(() => figmaFrames.id, { onDelete: 'cascade' }).notNull(),
  triggerElementId: varchar('trigger_element_id', { length: 50 }), // Button/element ID that triggers
  connectionType: varchar('connection_type', { length: 20 }).notNull(), // prototype, semantic, manual
  interactionType: varchar('interaction_type', { length: 20 }).notNull(), // tap, hover, drag, key, timer, other
  transitionType: varchar('transition_type', { length: 20 }), // instant, dissolve, slide, push, move
  duration: integer('duration'), // milliseconds
  easing: text('easing'),
  confirmed: boolean('confirmed').default(false).notNull(), // For semantic connections
  confidence: integer('confidence'), // 0-100 for semantic connections
  reasoning: text('reasoning'), // Explanation for semantic connections
  label: text('label'), // Optional label for the connection
  metadata: jsonb('metadata'), // Additional connection metadata
  createdAt: timestamp('created_at').defaultNow().notNull(),
  createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
})

// Export history table - tracks generated exports
export const exports = pgTable('exports', {
  id: uuid('id').defaultRandom().primaryKey(),
  projectId: uuid('project_id').references(() => projects.id, { onDelete: 'cascade' }).notNull(),
  format: varchar('format', { length: 20 }).notNull(), // 'markdown', 'json', etc.
  content: text('content').notNull(),
  sizeBytes: integer('size_bytes').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// Components table - Figma component definitions
export const components = pgTable('components', {
  id: uuid('id').defaultRandom().primaryKey(),
  projectId: uuid('project_id').references(() => projects.id, { onDelete: 'cascade' }).notNull(),
  figmaComponentId: varchar('figma_component_id', { length: 50 }).notNull(),
  figmaComponentKey: varchar('figma_component_key', { length: 50 }).notNull(),
  name: text('name').notNull(),
  description: text('description'),
  type: varchar('type', { length: 20 }).notNull(), // component, variant
  variantGroupId: varchar('variant_group_id', { length: 50 }),
  variantProperties: jsonb('variant_properties'),
  width: integer('width').notNull(),
  height: integer('height').notNull(),
  containingPage: text('containing_page'),
  instanceCount: integer('instance_count').default(0),
  thumbnailUrl: text('thumbnail_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// Component instances table - tracks component usage
export const componentInstances = pgTable('component_instances', {
  id: uuid('id').defaultRandom().primaryKey(),
  projectId: uuid('project_id').references(() => projects.id, { onDelete: 'cascade' }).notNull(),
  instanceId: varchar('instance_id', { length: 50 }).notNull(),
  componentId: varchar('component_id', { length: 50 }).notNull(),
  componentKey: varchar('component_key', { length: 50 }).notNull(),
  frameId: varchar('frame_id', { length: 50 }).notNull(),
  name: text('name').notNull(),
  x: integer('x').notNull(),
  y: integer('y').notNull(),
  overrides: jsonb('overrides'),
  scaleFactor: integer('scale_factor'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
  sessions: many(sessions),
  tokens: many(userTokens),
  projects: many(projects),
}))

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
}))

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}))

export const userTokensRelations = relations(userTokens, ({ one }) => ({
  user: one(users, {
    fields: [userTokens.userId],
    references: [users.id],
  }),
}))

export const projectsRelations = relations(projects, ({ one, many }) => ({
  user: one(users, {
    fields: [projects.userId],
    references: [users.id],
  }),
  pages: many(figmaPages),
  connections: many(flowConnections),
  exports: many(exports),
  components: many(components),
  componentInstances: many(componentInstances),
}))

export const figmaPagesRelations = relations(figmaPages, ({ one, many }) => ({
  project: one(projects, {
    fields: [figmaPages.projectId],
    references: [projects.id],
  }),
  frames: many(figmaFrames),
}))

export const figmaFramesRelations = relations(figmaFrames, ({ one, many }) => ({
  page: one(figmaPages, {
    fields: [figmaFrames.pageId],
    references: [figmaPages.id],
  }),
  sourceConnections: many(flowConnections, { relationName: 'sourceFrame' }),
  targetConnections: many(flowConnections, { relationName: 'targetFrame' }),
  buttons: many(buttons),
  inputFields: many(inputFields),
}))

export const flowConnectionsRelations = relations(flowConnections, ({ one }) => ({
  project: one(projects, {
    fields: [flowConnections.projectId],
    references: [projects.id],
  }),
  sourceFrame: one(figmaFrames, {
    fields: [flowConnections.sourceFrameId],
    references: [figmaFrames.id],
    relationName: 'sourceFrame',
  }),
  targetFrame: one(figmaFrames, {
    fields: [flowConnections.targetFrameId],
    references: [figmaFrames.id],
    relationName: 'targetFrame',
  }),
}))

export const exportsRelations = relations(exports, ({ one }) => ({
  project: one(projects, {
    fields: [exports.projectId],
    references: [projects.id],
  }),
}))

export const componentsRelations = relations(components, ({ one }) => ({
  project: one(projects, {
    fields: [components.projectId],
    references: [projects.id],
  }),
}))

export const componentInstancesRelations = relations(componentInstances, ({ one }) => ({
  project: one(projects, {
    fields: [componentInstances.projectId],
    references: [projects.id],
  }),
}))

export const buttonsRelations = relations(buttons, ({ one }) => ({
  project: one(projects, {
    fields: [buttons.projectId],
    references: [projects.id],
  }),
  frame: one(figmaFrames, {
    fields: [buttons.frameId],
    references: [figmaFrames.id],
  }),
  destinationFrame: one(figmaFrames, {
    fields: [buttons.destinationFrameId],
    references: [figmaFrames.id],
  }),
}))

export const inputFieldsRelations = relations(inputFields, ({ one }) => ({
  project: one(projects, {
    fields: [inputFields.projectId],
    references: [projects.id],
  }),
  frame: one(figmaFrames, {
    fields: [inputFields.frameId],
    references: [figmaFrames.id],
  }),
}))

// Types
export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert

export type Account = typeof accounts.$inferSelect
export type NewAccount = typeof accounts.$inferInsert

export type Session = typeof sessions.$inferSelect
export type NewSession = typeof sessions.$inferInsert

export type UserToken = typeof userTokens.$inferSelect
export type NewUserToken = typeof userTokens.$inferInsert

export type Project = typeof projects.$inferSelect
export type NewProject = typeof projects.$inferInsert

export type FigmaPage = typeof figmaPages.$inferSelect
export type NewFigmaPage = typeof figmaPages.$inferInsert

export type FigmaFrame = typeof figmaFrames.$inferSelect
export type NewFigmaFrame = typeof figmaFrames.$inferInsert

export type FlowConnection = typeof flowConnections.$inferSelect
export type NewFlowConnection = typeof flowConnections.$inferInsert

export type Export = typeof exports.$inferSelect
export type NewExport = typeof exports.$inferInsert

export type Component = typeof components.$inferSelect
export type NewComponent = typeof components.$inferInsert

export type ComponentInstance = typeof componentInstances.$inferSelect
export type NewComponentInstance = typeof componentInstances.$inferInsert

export type Button = typeof buttons.$inferSelect
export type NewButton = typeof buttons.$inferInsert

export type InputField = typeof inputFields.$inferSelect
export type NewInputField = typeof inputFields.$inferInsert
