# Existing saved project data

The code ZIP contains the complete application source and model, not a backup of production D1 records or R2 screenshot objects. The existing hosted project and its data remain unchanged. New Supabase tables start empty. The house walkthrough is fully included and does not depend on those saved records.

If you need existing notes, saved viewpoints, decisions, material publications and specifications on the new deployment:

1. Export all rows of the original `review_records` table and all referenced screenshot objects from the original hosting environment, with authorized account access.
2. Create each authorized reviewer in Supabase and explicitly add them to `project_members`.
3. Create a deliberate map from the old platform `user_id` strings to the corresponding Supabase Auth UUIDs. Do not copy old user IDs into a UUID foreign key or automatically assign all authorship to one user.
4. Preserve record `id`, `kind`, `title`, `body`, `status`, `author`, timestamps and revision. Parse the original JSON string in `data` into JSONB. Preserve snapshot coordinates, lighting, palette and edition metadata.
5. Upload each JPEG into the private `review-images` bucket using `NEW_USER_UUID/RECORD_UUID` as the object path. Update `data.image` to that path. Do not make the bucket public. An authorized administrative import may be needed for historical authors.
6. Import the transformed records, then compare row counts, image counts and sample snapshots. Keep the original export as a backup. Do not delete the old data until the migration is verified.
7. Existing links use the old domain. Change their domain to your Vercel/custom domain while preserving `?view=RECORD_UUID`. The record IDs must remain unchanged.

No credentials or production data are included in this export. This guide describes the migration; it does not claim the migration has been performed. Do not place real database exports or saved screenshots into a public GitHub repository.
