-- Create hubspot_tokens table
CREATE TABLE IF NOT EXISTS hubspot_tokens (
  id INTEGER PRIMARY KEY,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_in INTEGER NOT NULL,
  token_type TEXT NOT NULL,
  portal_id TEXT,
  created_at TEXT NOT NULL
);

-- Create clients table
CREATE TABLE IF NOT EXISTS clients (
  id INTEGER PRIMARY KEY,
  email TEXT,
  first_name TEXT,
  last_name TEXT,
  org_id TEXT,
  account_links_hubspot_id TEXT,
  account_links_hubspot_portal_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Create org_application_links table
CREATE TABLE IF NOT EXISTS org_application_links (
  id INTEGER PRIMARY KEY,
  org_id TEXT NOT NULL,
  hubspot_portal_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Create payment_methods table
CREATE TABLE IF NOT EXISTS payment_methods (
  id INTEGER PRIMARY KEY,
  associated_object_id TEXT NOT NULL,
  associated_object_type TEXT NOT NULL,
  portal_id TEXT NOT NULL,
  payment_method_data TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Create invoices table
CREATE TABLE IF NOT EXISTS invoices (
  id INTEGER PRIMARY KEY,
  associated_object_id TEXT NOT NULL,
  associated_object_type TEXT NOT NULL,
  portal_id TEXT NOT NULL,
  invoice_data TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
