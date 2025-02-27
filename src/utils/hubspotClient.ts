/**
 * Fetches contact details from HubSpot API.
 * 
 * @param contactId - The HubSpot contact ID
 * @param accessToken - The HubSpot access token
 * @returns The contact details
 */
export async function fetchHubspotContactDetails(contactId: string, accessToken: string): Promise<any> {
  try {
    if (!accessToken) {
      throw new Error('Missing access token for HubSpot API.');
    }
    if (!contactId) {
      throw new Error('Missing contactId when fetching HubSpot contact details.');
    }
    
    const contactIdStr = contactId.toString();
    const url = `https://api.hubapi.com/crm/v3/objects/contacts/${contactIdStr}?properties=email,firstname,lastname`;
    
    console.log(`DEBUG: Fetching contact details for contactId: ${contactIdStr}`);
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HubSpot API error: ${response.status} ${response.statusText}`);
    }
    
    console.log(`DEBUG: HubSpot responded with status: ${response.status}`);
    return await response.json();
  } catch (err) {
    console.error('ERROR: Failed to fetch HubSpot contact details:', err);
    throw err;
  }
}
