/**
 * Retrieves the organization ID associated with a HubSpot portal ID.
 * 
 * @param db - The D1 database instance
 * @param portalId - The HubSpot portal ID
 * @returns The organization ID or null if not found
 */
export async function getOrgIdFromHubspotPortalId(db: D1Database, portalId: string): Promise<string | null> {
  try {
    // Convert the portalId to a string for consistency
    const portalIdStr = String(portalId);
    console.log(`DEBUG: Looking up org_id for portalId "${portalIdStr}"`);
    
    const result = await db.prepare(
      `SELECT org_id FROM org_application_links 
       WHERE hubspot_portal_id = ?`
    )
    .bind(portalIdStr)
    .first();
    
    if (result && result.org_id) {
      console.log(`DEBUG: Found org_id "${result.org_id}" for hubspot_portal_id "${portalIdStr}"`);
      return result.org_id;
    } else {
      console.log(`DEBUG: No org_id found for hubspot_portal_id "${portalIdStr}"`);
      return null;
    }
  } catch (err) {
    console.error(`ERROR in getOrgIdFromHubspotPortalId: ${err}`);
    return null;
  }
}
