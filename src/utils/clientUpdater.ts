/**
 * Upserts a client record in the D1 database.
 * 
 * @param db - The D1 database instance
 * @param clientData - The client data to upsert
 * @returns The result of the upsert operation
 */
export async function upsertClient(db: D1Database, clientData: any): Promise<any> {
  try {
    console.log('DEBUG: Attempting upserting client with data:', clientData);
    
    // Check if client already exists
    const existingClient = await db.prepare(
      `SELECT id FROM clients 
       WHERE account_links_hubspot_id = ? 
       AND account_links_hubspot_portal_id = ?`
    )
    .bind(
      clientData.account_links.hubspot_id,
      clientData.account_links.hubspot_portal_id
    )
    .first();
    
    let result;
    if (existingClient) {
      // Update existing client
      result = await db.prepare(
        `UPDATE clients 
         SET email = ?, 
             first_name = ?, 
             last_name = ?, 
             org_id = ?, 
             updated_at = ?
         WHERE id = ?`
      )
      .bind(
        clientData.email,
        clientData.first_name,
        clientData.last_name,
        clientData.org_id,
        new Date().toISOString(),
        existingClient.id
      )
      .run();
    } else {
      // Insert new client
      result = await db.prepare(
        `INSERT INTO clients (
           email, 
           first_name, 
           last_name, 
           org_id, 
           account_links_hubspot_id, 
           account_links_hubspot_portal_id, 
           created_at, 
           updated_at
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        clientData.email,
        clientData.first_name,
        clientData.last_name,
        clientData.org_id,
        clientData.account_links.hubspot_id,
        clientData.account_links.hubspot_portal_id,
        new Date().toISOString(),
        new Date().toISOString()
      )
      .run();
    }
    
    console.log('DEBUG: Upsert client result:', result);
    return result;
  } catch (err) {
    console.error('ERROR: Failed to upsert client:', err);
    throw err;
  }
}

/**
 * Deletes a client record from the D1 database.
 * 
 * @param db - The D1 database instance
 * @param hubspotId - The HubSpot contact ID
 * @param portalId - The HubSpot portal ID
 * @returns The result of the delete operation
 */
export async function deleteClient(db: D1Database, hubspotId: string, portalId: string): Promise<any> {
  try {
    const result = await db.prepare(
      `DELETE FROM clients 
       WHERE account_links_hubspot_id = ? 
       AND account_links_hubspot_portal_id = ?`
    )
    .bind(
      String(hubspotId),
      String(portalId)
    )
    .run();
    
    console.log('DEBUG: Delete client result:', result);
    return result;
  } catch (err) {
    console.error('ERROR: Failed to delete client:', err);
    throw err;
  }
}

/**
 * Updates associations for merged contacts in the D1 database.
 * 
 * @param db - The D1 database instance
 * @param newContactId - The new HubSpot contact ID
 * @param oldContactId - The old HubSpot contact ID
 * @param portalId - The HubSpot portal ID
 */
export async function updateAssociationsForMergedContact(
  db: D1Database, 
  newContactId: string, 
  oldContactId: string, 
  portalId: string
): Promise<void> {
  try {
    // Update payment_methods
    const paymentResult = await db.prepare(
      `UPDATE payment_methods 
       SET associated_object_id = ? 
       WHERE associated_object_id = ? 
       AND associated_object_type = 'CONTACT' 
       AND portal_id = ?`
    )
    .bind(
      String(newContactId),
      String(oldContactId),
      String(portalId)
    )
    .run();
    
    console.log(`DEBUG: Updated ${paymentResult.meta.changes} payment_methods from ${oldContactId} to ${newContactId}`);

    // Update invoices
    const invoiceResult = await db.prepare(
      `UPDATE invoices 
       SET associated_object_id = ? 
       WHERE associated_object_id = ? 
       AND associated_object_type = 'CONTACT' 
       AND portal_id = ?`
    )
    .bind(
      String(newContactId),
      String(oldContactId),
      String(portalId)
    )
    .run();
    
    console.log(`DEBUG: Updated ${invoiceResult.meta.changes} invoices from ${oldContactId} to ${newContactId}`);
  } catch (err) {
    console.error('ERROR: Failed to update associations for merged contact:', err);
    throw err;
  }
}
