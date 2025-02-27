/**
 * Retrieves a HubSpot token from the D1 database.
 * 
 * @param db - The D1 database instance
 * @param portalId - The HubSpot portal ID
 * @returns The token document or null if not found
 */
export async function getHubspotToken(db: D1Database, portalId: string): Promise<any> {
  try {
    // Convert portalId to string for consistency with stored data
    const portalIdStr = String(portalId);
    
    const result = await db.prepare(
      `SELECT * FROM hubspot_tokens 
       WHERE portal_id = ? 
       ORDER BY created_at DESC 
       LIMIT 1`
    )
    .bind(portalIdStr)
    .first();
    
    return result;
  } catch (err) {
    console.error(`Error retrieving HubSpot token for portal ${portalId}:`, err);
    return null;
  }
}
