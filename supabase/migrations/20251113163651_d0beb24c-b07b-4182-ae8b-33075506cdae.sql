-- Fix PUBLIC_DATA_EXPOSURE: Restrict data_room_documents access to document creators only
DROP POLICY IF EXISTS "Authenticated users can view data room document metadata" ON data_room_documents;

CREATE POLICY "Users can view their own documents"
ON data_room_documents
FOR SELECT
USING (auth.uid() = created_by);