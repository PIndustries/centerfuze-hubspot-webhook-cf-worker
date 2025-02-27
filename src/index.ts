import { renderHtml } from "./renderHtml";

export interface Env {
  DB: D1Database;
  HUBSPOT_CLIENT_ID: string;
  HUBSPOT_CLIENT_SECRET: string;
  HUBSPOT_REDIRECT_URI: string;
  HUBSPOT_SCOPE?: string;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // Route to the appropriate handler based on the path
    if (path.includes('/hubspot/install')) {
      return await handleHubspotInstall(env);
    } else if (path.includes('/hubspot/oauth-callback')) {
      return await handleOauthCallback(request, env);
    } else if (path.includes('/hubspot/webhook')) {
      return await handleWebhook(request, env);
    }

    // Default response - show comments from database
    const stmt = env.DB.prepare("SELECT * FROM comments LIMIT 5");
    const { results } = await stmt.all();

    return new Response(renderHtml(JSON.stringify(results, null, 2)), {
      headers: {
        "content-type": "text/html",
      },
    });
  },
} satisfies ExportedHandler<Env>;

// HubSpot Install Handler
async function handleHubspotInstall(env: Env): Promise<Response> {
  try {
    // Get HubSpot secrets from environment variables
    const CLIENT_ID = env.HUBSPOT_CLIENT_ID;
    const SCOPES = env.HUBSPOT_SCOPE || "crm.objects.contacts.read";
    const REDIRECT_URI = env.HUBSPOT_REDIRECT_URI;

    if (!CLIENT_ID || !REDIRECT_URI) {
      throw new Error("Missing required environment variables");
    }

    const authUrl =
      "https://app.hubspot.com/oauth/authorize" +
      `?client_id=${encodeURIComponent(CLIENT_ID)}` +
      `&scope=${encodeURIComponent(SCOPES)}` +
      `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`;

    // Return 302 redirect
    return new Response("", {
      status: 302,
      headers: { Location: authUrl }
    });
  } catch (err) {
    console.error("Error building HubSpot install URL:", err);
    return new Response("Error fetching secrets", {
      status: 500
    });
  }
}

// OAuth Callback Handler
async function handleOauthCallback(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  
  if (!code) {
    console.error("Missing code parameter in the request.");
    return new Response("Missing code parameter.", { status: 400 });
  }

  try {
    // Get HubSpot configuration from environment variables
    const CLIENT_ID = env.HUBSPOT_CLIENT_ID;
    const CLIENT_SECRET = env.HUBSPOT_CLIENT_SECRET;
    const REDIRECT_URI = env.HUBSPOT_REDIRECT_URI;

    if (!CLIENT_ID || !CLIENT_SECRET || !REDIRECT_URI) {
      throw new Error("Missing required environment variables");
    }

    // Build the payload for token exchange
    const authCodeProof = {
      grant_type: 'authorization_code',
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      redirect_uri: REDIRECT_URI,
      code: code
    };

    // Exchange the code for tokens
    const tokens = await exchangeForTokens(authCodeProof);
    
    // Store the tokens in D1 database
    await storeTokens(env.DB, tokens);

    // Redirect the user back to app.hubspot.com after successful token storage
    return new Response("", {
      status: 302,
      headers: {
        Location: "https://app.hubspot.com"
      }
    });
  } catch (err) {
    console.error("Error exchanging code for tokens:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}

// Webhook Handler
async function handleWebhook(request: Request, env: Env): Promise<Response> {
  try {
    // Validate the incoming request
    if (!await validateRequestSignature(request, env.HUBSPOT_CLIENT_SECRET)) {
      console.error("HubSpot signature validation failed!");
      return new Response("Invalid Signature", { status: 400 });
    }

    // Parse the JSON body (expecting an array of events)
    let events;
    try {
      const bodyText = await request.text();
      events = JSON.parse(bodyText);
    } catch (err) {
      console.error("Cannot parse JSON body:", err);
      return new Response("Invalid JSON", { status: 400 });
    }
    
    if (!Array.isArray(events)) {
      console.error("Expected an array of events from HubSpot Webhooks");
      return new Response("Expected JSON array", { status: 400 });
    }

    // Process each event
    for (const event of events) {
      // Process HubSpot webhook events
      // Implementation details would go here
      console.log("Processing event:", event);
    }

    return new Response("OK", { status: 200 });
  } catch (err) {
    console.error("Error in HubSpot webhook function:", err);
    return new Response("Internal Server Error", { status: 500 });
  }
}

// Helper Functions
async function exchangeForTokens(authCodeProof: any): Promise<any> {
  const params = new URLSearchParams();
  for (const key in authCodeProof) {
    params.append(key, authCodeProof[key]);
  }
  
  const response = await fetch("https://api.hubapi.com/oauth/v1/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(`HubSpot API error: ${JSON.stringify(error)}`);
  }
  
  return response.json();
}

async function storeTokens(db: D1Database, tokenData: any): Promise<void> {
  try {
    // Add timestamp to token data
    const tokenWithTimestamp = {
      ...tokenData,
      createdAt: new Date().toISOString()
    };
    
    // Insert the token data into D1 database
    await db.prepare(
      `INSERT INTO hubspot_tokens (
        access_token, 
        refresh_token, 
        expires_in, 
        token_type, 
        created_at
      ) VALUES (?, ?, ?, ?, ?)`
    )
    .bind(
      tokenWithTimestamp.access_token,
      tokenWithTimestamp.refresh_token,
      tokenWithTimestamp.expires_in,
      tokenWithTimestamp.token_type,
      tokenWithTimestamp.createdAt
    )
    .run();
  } catch (err) {
    console.error("Error storing tokens in D1:", err);
    throw err;
  }
}

async function validateRequestSignature(request: Request, clientSecret: string): Promise<boolean> {
  // Simple placeholder for signature validation
  // In a real implementation, this would validate HubSpot's signature
  return true;
}
