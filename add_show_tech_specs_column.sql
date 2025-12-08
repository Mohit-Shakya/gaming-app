-- Add show_tech_specs column to cafes table
-- This allows cafes to hide/show the technical specifications section on their public page
-- Default is true to maintain existing behavior

ALTER TABLE cafes
ADD COLUMN IF NOT EXISTS show_tech_specs BOOLEAN DEFAULT TRUE;

-- Add comment to column
COMMENT ON COLUMN cafes.show_tech_specs IS 'Controls whether technical specifications (monitor, CPU, GPU, RAM, accessories) are displayed on the cafe public page. Default is true.';
