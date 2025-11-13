-- Drop the existing unique constraint on path
ALTER TABLE data_room_documents DROP CONSTRAINT IF EXISTS data_room_documents_path_key;

-- Add a new unique constraint on (created_by, path) combination
-- This allows different users to have documents with the same path
ALTER TABLE data_room_documents 
ADD CONSTRAINT data_room_documents_user_path_key UNIQUE (created_by, path);