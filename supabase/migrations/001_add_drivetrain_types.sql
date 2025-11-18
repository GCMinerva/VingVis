-- Migration: Add new drivetrain types to template_type check constraint
-- Date: 2024-01-XX
-- Description: Adds tank-drive, holonomic-drive, x-drive, and swerve-drive to the allowed template_type values

-- Drop the existing check constraint
ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_template_type_check;

-- Add the new check constraint with all drivetrain types
ALTER TABLE projects ADD CONSTRAINT projects_template_type_check
  CHECK (template_type IN ('tank-drive', 'omni-wheel', 'mecanum-wheel', 'holonomic-drive', 'x-drive', 'swerve-drive'));
