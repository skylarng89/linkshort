-- Drop tables if they exist to ensure a clean slate (optional, for development)
DROP TABLE IF EXISTS clicks;
DROP TABLE IF EXISTS links;

-- Sequence for generating unique IDs for short codes
CREATE SEQUENCE IF NOT EXISTS link_id_seq START 1;
DROP TABLE IF EXISTS users; -- If user accounts are implemented
DROP TABLE IF EXISTS bulk_jobs; -- If bulk processing is implemented

-- Links Table: Stores all shortened URLs
CREATE TABLE links (
  id SERIAL PRIMARY KEY,
  short_code VARCHAR(50) UNIQUE NOT NULL,
  original_url TEXT NOT NULL,
  custom_back_half BOOLEAN DEFAULT FALSE,
  user_id INTEGER NULL, -- Foreign key to users table (if implemented)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP WITH TIME ZONE NULL,
  is_active BOOLEAN DEFAULT TRUE,
  click_count INTEGER DEFAULT 0
  -- CONSTRAINT fk_user FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE SET NULL -- If users table exists
);

-- Clicks Table: Tracks individual click events on links
CREATE TABLE clicks (
  id SERIAL PRIMARY KEY,
  link_id INTEGER NOT NULL,
  clicked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  ip_address INET,
  user_agent TEXT,
  country_code VARCHAR(2), -- Store country code from IP geolocation
  referer TEXT,
  CONSTRAINT fk_link FOREIGN KEY(link_id) REFERENCES links(id) ON DELETE CASCADE
);

-- Users Table: Optional, for user accounts and management
-- CREATE TABLE users (
--   id SERIAL PRIMARY KEY,
--   username VARCHAR(50) UNIQUE NOT NULL,
--   email VARCHAR(100) UNIQUE NOT NULL,
--   password_hash VARCHAR(255) NOT NULL,
--   created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
--   updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
-- );

-- Bulk Jobs Table: Optional, for tracking status of bulk link shortening jobs
-- CREATE TABLE bulk_jobs (
--   id SERIAL PRIMARY KEY,
--   user_id INTEGER NOT NULL,
--   file_name VARCHAR(255) NOT NULL,
--   status VARCHAR(20) DEFAULT 'pending', -- e.g., pending, processing, completed, failed
--   total_links INTEGER DEFAULT 0,
--   processed_links INTEGER DEFAULT 0,
--   created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
--   completed_at TIMESTAMP WITH TIME ZONE NULL,
--   result_file_path VARCHAR(255) NULL, -- Path to the generated file with shortened links
--   CONSTRAINT fk_bulk_user FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE -- If users table exists
-- );

-- Indexes for performance optimization
CREATE INDEX idx_links_short_code ON links(short_code);
CREATE INDEX idx_links_user_id ON links(user_id); -- If user_id is used
CREATE INDEX idx_links_created_at ON links(created_at);
CREATE INDEX idx_links_expires_at ON links(expires_at);

CREATE INDEX idx_clicks_link_id ON clicks(link_id);
CREATE INDEX idx_clicks_clicked_at ON clicks(clicked_at);

-- CREATE INDEX idx_users_email ON users(email); -- If users table exists
-- CREATE INDEX idx_bulk_jobs_user_id ON bulk_jobs(user_id); -- If bulk_jobs table exists
-- CREATE INDEX idx_bulk_jobs_status ON bulk_jobs(status); -- If bulk_jobs table exists

-- Function to update click_count on links table (optional, can be handled by application logic)
CREATE OR REPLACE FUNCTION update_link_click_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE links
  SET click_count = click_count + 1
  WHERE id = NEW.link_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update click_count after a new click is inserted
CREATE TRIGGER after_click_insert
AFTER INSERT ON clicks
FOR EACH ROW
EXECUTE FUNCTION update_link_click_count();

-- You might want to add more specific constraints, like CHECK constraints for URL formats, etc.
-- Example: ALTER TABLE links ADD CONSTRAINT check_url_format CHECK (original_url ~* '^https?://');

COMMENT ON TABLE links IS 'Stores all shortened URLs, their original destinations, and metadata.';
COMMENT ON COLUMN links.short_code IS 'The unique short identifier for the link.';
COMMENT ON COLUMN links.original_url IS 'The original long URL that the short link redirects to.';
COMMENT ON COLUMN links.custom_back_half IS 'True if the short_code was user-defined.';
COMMENT ON COLUMN links.user_id IS 'Identifier of the user who created the link (if applicable).';
COMMENT ON COLUMN links.expires_at IS 'Timestamp when the link should automatically deactivate.';
COMMENT ON COLUMN links.click_count IS 'Counter for the number of times the link has been clicked.';

COMMENT ON TABLE clicks IS 'Records each click event for analytics purposes.';
COMMENT ON COLUMN clicks.link_id IS 'Foreign key referencing the link that was clicked.';
COMMENT ON COLUMN clicks.ip_address IS 'IP address of the user who clicked the link.';
COMMENT ON COLUMN clicks.user_agent IS 'User agent string of the client that made the click.';
COMMENT ON COLUMN clicks.country_code IS 'Two-letter country code derived from IP, for geo-analytics.';
COMMENT ON COLUMN clicks.referer IS 'The referring URL, if available.';
