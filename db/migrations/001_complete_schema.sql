-- ============================================
-- FIGMA FLOW MAPPER - COMPLETE DATABASE SCHEMA
-- ============================================

-- ============================================
-- EXTENSIONS
-- ============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- AUTHENTICATION & USERS
-- ============================================

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255),
  email VARCHAR(255) UNIQUE NOT NULL,
  email_verified TIMESTAMPTZ,
  image TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(255) NOT NULL,
  provider VARCHAR(255) NOT NULL,
  provider_account_id VARCHAR(255) NOT NULL,
  refresh_token TEXT,
  access_token TEXT,
  expires_at BIGINT,
  token_type VARCHAR(255),
  scope TEXT,
  id_token TEXT,
  session_state TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(provider, provider_account_id)
);

CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_token VARCHAR(255) UNIQUE NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS verification_tokens (
  identifier VARCHAR(255) NOT NULL,
  token VARCHAR(255) NOT NULL,
  expires TIMESTAMPTZ NOT NULL,
  PRIMARY KEY (identifier, token)
);

-- User Figma tokens (encrypted)
CREATE TABLE IF NOT EXISTS user_tokens (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  figma_token TEXT NOT NULL, -- Encrypted with AES-256-GCM
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PROJECTS
-- ============================================

CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  figma_file_id VARCHAR(50) NOT NULL, -- Figma file key
  figma_file_name VARCHAR(255) NOT NULL,
  selected_pages TEXT[], -- Array of page IDs
  status VARCHAR(50) DEFAULT 'pending', -- pending, processing, completed, failed
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);

-- ============================================
-- FRAMES
-- ============================================

CREATE TABLE IF NOT EXISTS frames (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  figma_node_id VARCHAR(255) NOT NULL, -- Figma's node ID
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL, -- FRAME, COMPONENT, INSTANCE
  width INTEGER NOT NULL,
  height INTEGER NOT NULL,
  x INTEGER NOT NULL,
  y INTEGER NOT NULL,
  page_id VARCHAR(255) NOT NULL,
  page_name VARCHAR(255) NOT NULL,
  background_color VARCHAR(50),
  thumbnail_url TEXT,
  device_type VARCHAR(50), -- mobile, tablet, desktop, other
  device_classification_confidence VARCHAR(50), -- high, medium, low
  device_classification_reason TEXT,
  canvas_position JSONB, -- {x, y} position on React Flow canvas
  group_id UUID, -- For grouping frames
  analysis_data JSONB, -- Full analysis results
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, figma_node_id)
);

CREATE INDEX IF NOT EXISTS idx_frames_project_id ON frames(project_id);
CREATE INDEX IF NOT EXISTS idx_frames_device_type ON frames(device_type);
CREATE INDEX IF NOT EXISTS idx_frames_page_name ON frames(page_name);
CREATE INDEX IF NOT EXISTS idx_frames_group_id ON frames(group_id);

-- ============================================
-- COMPONENTS
-- ============================================

CREATE TABLE IF NOT EXISTS components (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  figma_component_id VARCHAR(255) NOT NULL,
  figma_component_key VARCHAR(255) NOT NULL, -- Persistent key
  name VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(50) NOT NULL, -- component, variant
  variant_group_id VARCHAR(255), -- For variant groups
  variant_properties JSONB, -- {property: value}
  width INTEGER,
  height INTEGER,
  containing_page VARCHAR(255),
  instance_count INTEGER DEFAULT 0,
  thumbnail_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, figma_component_key)
);

CREATE INDEX IF NOT EXISTS idx_components_project_id ON components(project_id);
CREATE INDEX IF NOT EXISTS idx_components_variant_group_id ON components(variant_group_id);
CREATE INDEX IF NOT EXISTS idx_components_instance_count ON components(instance_count DESC);

-- Component instances
CREATE TABLE IF NOT EXISTS component_instances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  instance_id VARCHAR(255) NOT NULL, -- Figma instance node ID
  component_id VARCHAR(255) NOT NULL, -- References components.figma_component_id
  component_key VARCHAR(255) NOT NULL, -- References components.figma_component_key
  frame_id VARCHAR(255) NOT NULL, -- Parent frame Figma node ID
  name VARCHAR(255),
  x INTEGER,
  y INTEGER,
  overrides JSONB, -- Property overrides
  scale_factor DECIMAL(5, 2) DEFAULT 1.0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, instance_id)
);

CREATE INDEX IF NOT EXISTS idx_component_instances_project_id ON component_instances(project_id);
CREATE INDEX IF NOT EXISTS idx_component_instances_component_key ON component_instances(component_key);
CREATE INDEX IF NOT EXISTS idx_component_instances_frame_id ON component_instances(frame_id);

-- ============================================
-- INTERACTIVE ELEMENTS
-- ============================================

CREATE TABLE IF NOT EXISTS buttons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  frame_id UUID NOT NULL REFERENCES frames(id) ON DELETE CASCADE,
  figma_node_id VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  label TEXT,
  type VARCHAR(50), -- primary, secondary, tertiary, text, icon
  state VARCHAR(50), -- default, hover, pressed, disabled
  x INTEGER,
  y INTEGER,
  width INTEGER,
  height INTEGER,
  component_id VARCHAR(255), -- If button is a component instance
  destination_frame_id VARCHAR(255), -- Prototype destination
  confidence INTEGER, -- 0-100
  detection_reasons TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, figma_node_id)
);

CREATE INDEX IF NOT EXISTS idx_buttons_frame_id ON buttons(frame_id);
CREATE INDEX IF NOT EXISTS idx_buttons_destination_frame_id ON buttons(destination_frame_id);

CREATE TABLE IF NOT EXISTS input_fields (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  frame_id UUID NOT NULL REFERENCES frames(id) ON DELETE CASCADE,
  figma_node_id VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  type VARCHAR(50), -- text, email, password, number, search, textarea
  placeholder TEXT,
  label TEXT,
  required BOOLEAN DEFAULT FALSE,
  state VARCHAR(50), -- default, focus, error, disabled
  x INTEGER,
  y INTEGER,
  width INTEGER,
  height INTEGER,
  confidence INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, figma_node_id)
);

CREATE INDEX IF NOT EXISTS idx_input_fields_frame_id ON input_fields(frame_id);

-- ============================================
-- CONNECTIONS & FLOWS
-- ============================================

CREATE TABLE IF NOT EXISTS connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  from_frame_id UUID NOT NULL REFERENCES frames(id) ON DELETE CASCADE,
  to_frame_id UUID NOT NULL REFERENCES frames(id) ON DELETE CASCADE,
  trigger_element_id VARCHAR(255), -- Button/element that triggers (nullable for semantic)
  connection_type VARCHAR(50) NOT NULL, -- prototype, semantic, manual
  interaction_type VARCHAR(50), -- tap, hover, drag, key, timer, other
  transition_type VARCHAR(50), -- instant, dissolve, slide, push, move
  duration INTEGER, -- milliseconds
  easing VARCHAR(50),
  confirmed BOOLEAN DEFAULT TRUE, -- For semantic suggestions
  confidence INTEGER, -- 0-100 for semantic connections
  reasoning TEXT, -- Why this connection was suggested
  created_by UUID REFERENCES users(id), -- For manual connections
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, from_frame_id, to_frame_id, trigger_element_id)
);

CREATE INDEX IF NOT EXISTS idx_connections_project_id ON connections(project_id);
CREATE INDEX IF NOT EXISTS idx_connections_from_frame_id ON connections(from_frame_id);
CREATE INDEX IF NOT EXISTS idx_connections_to_frame_id ON connections(to_frame_id);
CREATE INDEX IF NOT EXISTS idx_connections_type ON connections(connection_type);

-- ============================================
-- DESIGN SYSTEM
-- ============================================

CREATE TABLE IF NOT EXISTS colors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  hex VARCHAR(9) NOT NULL, -- #RRGGBB or #RRGGBBAA
  r INTEGER NOT NULL CHECK (r >= 0 AND r <= 255),
  g INTEGER NOT NULL CHECK (g >= 0 AND g <= 255),
  b INTEGER NOT NULL CHECK (b >= 0 AND b <= 255),
  a DECIMAL(3, 2) DEFAULT 1.0 CHECK (a >= 0 AND a <= 1),
  h INTEGER CHECK (h >= 0 AND h <= 360),
  s INTEGER CHECK (s >= 0 AND s <= 100),
  l INTEGER CHECK (l >= 0 AND l <= 100),
  usage_count INTEGER DEFAULT 1,
  usage_types TEXT[], -- fill, stroke, text, background
  category VARCHAR(50), -- primary, secondary, accent, neutral, semantic
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_colors_project_id ON colors(project_id);
CREATE INDEX IF NOT EXISTS idx_colors_category ON colors(category);
CREATE INDEX IF NOT EXISTS idx_colors_usage_count ON colors(usage_count DESC);

CREATE TABLE IF NOT EXISTS typography_styles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  font_family VARCHAR(255) NOT NULL,
  font_weight INTEGER NOT NULL,
  font_size INTEGER NOT NULL,
  line_height DECIMAL(10, 2),
  letter_spacing DECIMAL(10, 2),
  text_case VARCHAR(50), -- ORIGINAL, UPPER, LOWER, TITLE
  text_decoration VARCHAR(50), -- NONE, UNDERLINE, STRIKETHROUGH
  usage_count INTEGER DEFAULT 1,
  category VARCHAR(50), -- h1, h2, h3, h4, h5, h6, body, body-sm, caption
  examples JSONB, -- [{text, nodeName}]
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_typography_styles_project_id ON typography_styles(project_id);
CREATE INDEX IF NOT EXISTS idx_typography_styles_category ON typography_styles(category);

CREATE TABLE IF NOT EXISTS spacing_scales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  detected_scale INTEGER[], -- [4, 8, 12, 16, ...]
  all_values INTEGER[],
  base_unit INTEGER, -- Usually 4 or 8
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_spacing_scales_project_id ON spacing_scales(project_id);

-- ============================================
-- GROUPING & ORGANIZATION
-- ============================================

CREATE TABLE IF NOT EXISTS frame_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  color VARCHAR(50), -- For visual distinction
  description TEXT,
  parent_group_id UUID REFERENCES frame_groups(id) ON DELETE CASCADE, -- For nesting
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_frame_groups_project_id ON frame_groups(project_id);
CREATE INDEX IF NOT EXISTS idx_frame_groups_parent_group_id ON frame_groups(parent_group_id);

-- Add foreign key to frames.group_id (if not already exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_frames_group_id'
  ) THEN
    ALTER TABLE frames ADD CONSTRAINT fk_frames_group_id
      FOREIGN KEY (group_id) REFERENCES frame_groups(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ============================================
-- EXPORT HISTORY
-- ============================================

CREATE TABLE IF NOT EXISTS exports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  format VARCHAR(50) NOT NULL, -- csv, json, llm
  file_size INTEGER, -- bytes
  download_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_exports_project_id ON exports(project_id);
CREATE INDEX IF NOT EXISTS idx_exports_user_id ON exports(user_id);

-- ============================================
-- AUDIT LOG
-- ============================================

CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  action VARCHAR(100) NOT NULL, -- project_created, frame_analyzed, connection_created, etc.
  entity_type VARCHAR(50), -- project, frame, connection, etc.
  entity_id UUID,
  metadata JSONB,
  ip_address VARCHAR(50),
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at DESC);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Update updated_at timestamp automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to all tables with updated_at (only if triggers don't exist)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_users_updated_at') THEN
    CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_accounts_updated_at') THEN
    CREATE TRIGGER update_accounts_updated_at BEFORE UPDATE ON accounts
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_user_tokens_updated_at') THEN
    CREATE TRIGGER update_user_tokens_updated_at BEFORE UPDATE ON user_tokens
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_projects_updated_at') THEN
    CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_frames_updated_at') THEN
    CREATE TRIGGER update_frames_updated_at BEFORE UPDATE ON frames
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_components_updated_at') THEN
    CREATE TRIGGER update_components_updated_at BEFORE UPDATE ON components
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_colors_updated_at') THEN
    CREATE TRIGGER update_colors_updated_at BEFORE UPDATE ON colors
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_typography_styles_updated_at') THEN
    CREATE TRIGGER update_typography_styles_updated_at BEFORE UPDATE ON typography_styles
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_frame_groups_updated_at') THEN
    CREATE TRIGGER update_frame_groups_updated_at BEFORE UPDATE ON frame_groups
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_spacing_scales_updated_at') THEN
    CREATE TRIGGER update_spacing_scales_updated_at BEFORE UPDATE ON spacing_scales
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- ============================================
-- ROW LEVEL SECURITY (Optional but recommended)
-- ============================================

-- Enable RLS on key tables
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE frames ENABLE ROW LEVEL SECURITY;
ALTER TABLE components ENABLE ROW LEVEL SECURITY;
ALTER TABLE connections ENABLE ROW LEVEL SECURITY;

-- Users can only see their own projects
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'projects_policy' AND tablename = 'projects'
  ) THEN
    CREATE POLICY projects_policy ON projects
      FOR ALL
      USING (user_id = current_setting('app.current_user_id', true)::UUID);
  END IF;
END $$;

-- Users can only see frames from their projects
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'frames_policy' AND tablename = 'frames'
  ) THEN
    CREATE POLICY frames_policy ON frames
      FOR ALL
      USING (project_id IN (
        SELECT id FROM projects WHERE user_id = current_setting('app.current_user_id', true)::UUID
      ));
  END IF;
END $$;

-- Users can only see components from their projects
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'components_policy' AND tablename = 'components'
  ) THEN
    CREATE POLICY components_policy ON components
      FOR ALL
      USING (project_id IN (
        SELECT id FROM projects WHERE user_id = current_setting('app.current_user_id', true)::UUID
      ));
  END IF;
END $$;

-- Users can only see connections from their projects
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'connections_policy' AND tablename = 'connections'
  ) THEN
    CREATE POLICY connections_policy ON connections
      FOR ALL
      USING (project_id IN (
        SELECT id FROM projects WHERE user_id = current_setting('app.current_user_id', true)::UUID
      ));
  END IF;
END $$;
