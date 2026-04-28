-- Add images_id column to components_cms_content_sections if it doesn't exist
ALTER TABLE components_cms_content_sections ADD COLUMN IF NOT EXISTS images_id INTEGER;

-- Create junction table for images relationship
CREATE TABLE IF NOT EXISTS components_cms_content_sections_images (
  id SERIAL PRIMARY KEY,
  component_id INTEGER NOT NULL REFERENCES components_cms_content_sections(id) ON DELETE CASCADE,
  media_id INTEGER,
  field VARCHAR(255),
  "order" INTEGER
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_components_cms_content_sections_images_component_id 
  ON components_cms_content_sections_images(component_id);
