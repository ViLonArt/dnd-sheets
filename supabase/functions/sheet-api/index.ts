import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "@supabase/supabase-js";
import { eq, or } from "drizzle-orm";
import { db, closeDb } from "./db/index.ts";
import { sheets } from "./db/schema.ts";

// CORS headers - must be included in ALL responses
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
};

/**
 * Generate a URL-friendly slug from a name
 * Format: lowercase-name-with-dashes-randomid
 * Example: "Gandalf the Gray" -> "gandalf-the-gray-k9s2"
 */
function generateSlug(name: string): string {
  const baseName = name && name.trim() ? name.trim() : 'unnamed';
  const slugified = baseName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing dashes
  const randomId = Math.random().toString(36).substring(2, 6); // 4 character random ID
  return `${slugified}-${randomId}`;
}

/**
 * Get user ID from Authorization header
 * Returns user ID if authenticated, null otherwise
 */
async function getUserId(req: Request): Promise<string | null> {
  const authHeader = req.headers.get("Authorization");
  console.log(`[Auth] Authorization header exists: ${!!authHeader}`);
  
  if (!authHeader) {
    console.log("[Auth] No Authorization header found");
    return null;
  }

  try {
    console.log(`[Auth] Authorization header: ${authHeader.substring(0, 20)}...`);
    
    // Get environment variables
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY");
    
    console.log(`[Config] SUPABASE_URL exists: ${!!supabaseUrl}`);
    console.log(`[Config] SUPABASE_ANON_KEY exists: ${!!supabaseKey}`);
    
    if (!supabaseUrl || !supabaseKey) {
      console.error("[Config Error] SUPABASE_URL or SUPABASE_ANON_KEY not available in runtime");
      return null;
    }
    
    // Initialize Supabase Client with proper configuration
    // KEY FIX: persistSession: false is required for Edge Functions
    const supabaseClient = createClient(
      supabaseUrl,
      supabaseKey,
      {
        global: {
          headers: { Authorization: authHeader },
        },
        auth: {
          persistSession: false, // <--- THIS IS THE KEY FIX
        },
      }
    );
    console.log("[Auth] Supabase client created with persistSession: false");

    // Verify token and get user
    // Note: getUser() without arguments uses the Authorization header from global headers
    const { data: { user }, error } = await supabaseClient.auth.getUser();
    
    if (error) {
      console.error("[Auth Error] getUser failed:", error);
      console.error("[Auth Error] Error message:", error?.message);
      console.error("[Auth Error] Error status:", error?.status);
      return null;
    }
    
    if (!user) {
      console.error("[Auth Error] No user returned from getUser()");
      return null;
    }
    
    console.log(`[Auth Success] User ID: ${user.id}, Email: ${user.email || 'N/A'}`);
    return user.id;
  } catch (error) {
    console.error("[Auth Exception] Error verifying token:", error);
    if (error instanceof Error) {
      console.error("[Auth Exception] Error message:", error.message);
      console.error("[Auth Exception] Error stack:", error.stack);
    }
    return null;
  }
}

/**
 * Handle GET /:id or GET ?id=... or GET ?slug=... - Fetch a sheet by ID or slug
 * Note: No authentication required (public read access)
 */
async function handleGet(req: Request, pathId?: string): Promise<Response> {
  const url = new URL(req.url);
  
  // Extract lookup value from query parameters (id or slug) or path parameter
  const lookup = url.searchParams.get("id") || url.searchParams.get("slug") || pathId;
  
  if (!lookup) {
    console.error("[GET] No lookup parameter provided");
    return new Response(
      JSON.stringify({ error: "Sheet ID or slug is required" }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  // Validate if lookup is a UUID (to avoid type mismatch errors)
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(lookup);
  
  console.log(`[GET] Fetching sheet with lookup: ${lookup} (type: ${isUuid ? 'UUID' : 'slug'})`);
  try {
    // Conditionally query based on whether lookup is a UUID or slug
    // This avoids type mismatch errors when comparing text to UUID column
    let sheet;
    if (isUuid) {
      // Search by ID column (UUID type)
      [sheet] = await db
        .select()
        .from(sheets)
        .where(eq(sheets.id, lookup))
        .limit(1);
    } else {
      // Search by slug column (text/varchar type)
      [sheet] = await db
        .select()
        .from(sheets)
        .where(eq(sheets.slug, lookup))
        .limit(1);
    }

    if (!sheet) {
      console.log(`[GET] Sheet not found: ${lookup}`);
      return new Response(
        JSON.stringify({ error: "Sheet not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`[GET] Sheet found: ${sheet.id}, owner: ${sheet.ownerId}`);
    return new Response(
      JSON.stringify(sheet),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("[GET Error] Error fetching sheet:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: error instanceof Error ? error.message : String(error) }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
}

/**
 * Handle POST / - Create a new sheet
 */
async function handlePost(req: Request): Promise<Response> {
  console.log("[POST] Creating new sheet");
  try {
    // Get Supabase client with proper auth configuration
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("[POST] No Authorization header");
      return new Response(
        JSON.stringify({ error: "Unauthorized", details: "Missing Authorization header" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY");
    
    if (!supabaseUrl || !supabaseKey) {
      console.error("[POST] Missing Supabase environment variables");
      return new Response(
        JSON.stringify({ error: "Internal server error", details: "Configuration missing" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Initialize Supabase Client with proper configuration
    const supabaseClient = createClient(
      supabaseUrl,
      supabaseKey,
      {
        global: {
          headers: { Authorization: authHeader },
        },
        auth: {
          persistSession: false, // <--- KEY FIX
        },
      }
    );

    // Verify user
    const { data: { user }, error } = await supabaseClient.auth.getUser();

    if (error || !user) {
      console.error("[POST] Auth Error - getUser failed:", error);
      return new Response(
        JSON.stringify({ error: "Unauthorized", details: error?.message || "User verification failed" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const userId = user.id;
    console.log(`[POST] User authenticated: ${userId}`);
    const body = await req.json();
    console.log(`[POST] Request body received, data field exists: ${!!body.data}`);
    const { data, slug } = body;

    if (!data || typeof data !== "object") {
      console.error("[POST] Invalid data: 'data' field is required");
      return new Response(
        JSON.stringify({ error: "Invalid data: 'data' field is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Generate slug if not provided
    let finalSlug = slug;
    if (!finalSlug || typeof finalSlug !== "string" || !finalSlug.trim()) {
      const name = (data as Record<string, unknown>)?.name;
      const nameStr = typeof name === "string" ? name : "";
      finalSlug = generateSlug(nameStr);
      console.log(`[POST] Generated slug: ${finalSlug} from name: ${nameStr || 'unnamed'}`);
    } else {
      console.log(`[POST] Using provided slug: ${finalSlug}`);
    }

    console.log(`[POST] Inserting sheet into database for user: ${userId}`);
    const [newSheet] = await db
      .insert(sheets)
      .values({
        ownerId: userId,
        slug: finalSlug,
        data: data as Record<string, unknown>,
      })
      .returning();

    console.log(`[POST] Sheet created successfully: ${newSheet.id}`);
    return new Response(
      JSON.stringify(newSheet),
      {
        status: 201,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("[POST Error] Error creating sheet:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: error instanceof Error ? error.message : String(error) }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
}

/**
 * Handle PUT /:id - Update a sheet
 */
async function handlePut(id: string, req: Request): Promise<Response> {
  console.log(`[PUT] Updating sheet: ${id}`);
  try {
    // Get Supabase client with proper auth configuration
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("[PUT] No Authorization header");
      return new Response(
        JSON.stringify({ error: "Unauthorized", details: "Missing Authorization header" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY");
    
    if (!supabaseUrl || !supabaseKey) {
      console.error("[PUT] Missing Supabase environment variables");
      return new Response(
        JSON.stringify({ error: "Internal server error", details: "Configuration missing" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Initialize Supabase Client with proper configuration
    const supabaseClient = createClient(
      supabaseUrl,
      supabaseKey,
      {
        global: {
          headers: { Authorization: authHeader },
        },
        auth: {
          persistSession: false, // <--- KEY FIX
        },
      }
    );

    // Verify user
    const { data: { user }, error } = await supabaseClient.auth.getUser();

    if (error || !user) {
      console.error("[PUT] Auth Error - getUser failed:", error);
      return new Response(
        JSON.stringify({ error: "Unauthorized", details: error?.message || "User verification failed" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const userId = user.id;
    console.log(`[PUT] User authenticated: ${userId}`);
    // First, check if sheet exists and user owns it
    const [existingSheet] = await db
      .select()
      .from(sheets)
      .where(eq(sheets.id, id))
      .limit(1);

    if (!existingSheet) {
      console.log(`[PUT] Sheet not found: ${id}`);
      return new Response(
        JSON.stringify({ error: "Sheet not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`[PUT] Sheet found, owner: ${existingSheet.ownerId}, requester: ${userId}`);
    if (existingSheet.ownerId !== userId) {
      console.error(`[PUT] Forbidden: User ${userId} does not own sheet ${id}`);
      return new Response(
        JSON.stringify({ error: "Forbidden: You don't own this sheet" }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const body = await req.json();
    const { data } = body;

    if (!data || typeof data !== "object") {
      console.error("[PUT] Invalid data: 'data' field is required");
      return new Response(
        JSON.stringify({ error: "Invalid data: 'data' field is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`[PUT] Updating sheet ${id} in database`);
    const [updatedSheet] = await db
      .update(sheets)
      .set({
        data: data as Record<string, unknown>,
        updatedAt: new Date(),
      })
      .where(eq(sheets.id, id))
      .returning();

    console.log(`[PUT] Sheet updated successfully: ${id}`);
    return new Response(
      JSON.stringify(updatedSheet),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("[PUT Error] Error updating sheet:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: error instanceof Error ? error.message : String(error) }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
}

/**
 * Handle DELETE /:id - Delete a sheet
 */
async function handleDelete(id: string, req: Request): Promise<Response> {
  console.log(`[DELETE] Deleting sheet: ${id}`);
  try {
    // Get Supabase client with proper auth configuration
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("[DELETE] No Authorization header");
      return new Response(
        JSON.stringify({ error: "Unauthorized", details: "Missing Authorization header" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY");
    
    if (!supabaseUrl || !supabaseKey) {
      console.error("[DELETE] Missing Supabase environment variables");
      return new Response(
        JSON.stringify({ error: "Internal server error", details: "Configuration missing" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Initialize Supabase Client with proper configuration
    const supabaseClient = createClient(
      supabaseUrl,
      supabaseKey,
      {
        global: {
          headers: { Authorization: authHeader },
        },
        auth: {
          persistSession: false, // <--- KEY FIX
        },
      }
    );

    // Verify user
    const { data: { user }, error } = await supabaseClient.auth.getUser();

    if (error || !user) {
      console.error("[DELETE] Auth Error - getUser failed:", error);
      return new Response(
        JSON.stringify({ error: "Unauthorized", details: error?.message || "User verification failed" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const userId = user.id;
    console.log(`[DELETE] User authenticated: ${userId}`);
    // First, check if sheet exists and user owns it
    const [existingSheet] = await db
      .select()
      .from(sheets)
      .where(eq(sheets.id, id))
      .limit(1);

    if (!existingSheet) {
      console.log(`[DELETE] Sheet not found: ${id}`);
      return new Response(
        JSON.stringify({ error: "Sheet not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`[DELETE] Sheet found, owner: ${existingSheet.ownerId}, requester: ${userId}`);
    if (existingSheet.ownerId !== userId) {
      console.error(`[DELETE] Forbidden: User ${userId} does not own sheet ${id}`);
      return new Response(
        JSON.stringify({ error: "Forbidden: You don't own this sheet" }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`[DELETE] Deleting sheet ${id} from database`);
    await db.delete(sheets).where(eq(sheets.id, id));

    console.log(`[DELETE] Sheet deleted successfully: ${id}`);
    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("[DELETE Error] Error deleting sheet:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: error instanceof Error ? error.message : String(error) }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
}

/**
 * Main request handler
 */
serve(async (req) => {
  console.log(`[Request] ${req.method} ${req.url}`);
  
  // Step 1: Handle CORS preflight (OPTIONS request)
  if (req.method === "OPTIONS") {
    console.log("[CORS] Handling preflight request");
    return new Response("ok", { headers: corsHeaders });
  }

  // Step 2: Add debug logging
  console.log(`[Request] ${req.method} request received`);
  const authHeader = req.headers.get("Authorization");
  console.log(`[Auth] Authorization header exists: ${!!authHeader}`);
  if (authHeader) {
    console.log(`[Auth] Header starts with Bearer: ${authHeader.startsWith("Bearer ")}`);
  }

  try {
    const url = new URL(req.url);
    console.log(`[Request] URL path: ${url.pathname}`);
    const pathParts = url.pathname.split("/").filter(Boolean);
    console.log(`[Request] Path parts:`, pathParts);
    
    // Extract the sheet ID from the path
    // Path format: /functions/v1/sheet-api/:id
    const apiIndex = pathParts.indexOf("sheet-api");
    const id = apiIndex >= 0 && pathParts[apiIndex + 1] ? pathParts[apiIndex + 1] : null;
    console.log(`[Request] Extracted ID: ${id || "none"}`);

    let response: Response;

    switch (req.method) {
      case "GET":
        // handleGet now accepts both query params and path params
        response = await handleGet(req, id || undefined);
        break;

      case "POST":
        response = await handlePost(req);
        break;

      case "PUT":
        if (!id) {
          console.error("[PUT] Sheet ID is required");
          response = new Response(
            JSON.stringify({ error: "Sheet ID is required" }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        } else {
          response = await handlePut(id, req);
        }
        break;

      case "DELETE":
        if (!id) {
          console.error("[DELETE] Sheet ID is required");
          response = new Response(
            JSON.stringify({ error: "Sheet ID is required" }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        } else {
          response = await handleDelete(id, req);
        }
        break;

      default:
        console.error(`[Request] Method not allowed: ${req.method}`);
        response = new Response(
          JSON.stringify({ error: "Method not allowed" }),
          {
            status: 405,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
    }

    console.log(`[Response] Status: ${response.status}`);
    return response;
  } catch (error) {
    console.error("[Unhandled Error] Exception in main handler:", error);
    return new Response(
      JSON.stringify({ 
        error: "Internal server error", 
        details: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } finally {
    // Close database connection
    await closeDb();
  }
});

