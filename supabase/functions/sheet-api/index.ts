import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "@supabase/supabase-js";
import { eq } from "drizzle-orm";
import { db, closeDb } from "./db/index.ts";
import { sheets } from "./db/schema.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

/**
 * Get user ID from Authorization header
 */
async function getUserId(req: Request): Promise<string | null> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return null;

  try {
    const token = authHeader.replace("Bearer ", "");
    // Create a Supabase client to verify the token
    // SUPABASE_URL and SUPABASE_ANON_KEY are automatically provided by the runtime
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    
    if (!supabaseUrl || !supabaseKey) {
      console.error("SUPABASE_URL or SUPABASE_ANON_KEY not available in runtime");
      return null;
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify token and get user
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      console.error("Error verifying token:", error);
      return null;
    }
    return user.id;
  } catch (error) {
    console.error("Error verifying token:", error);
    return null;
  }
}

/**
 * Handle GET /:id - Fetch a sheet by ID
 * Note: No authentication required (public read access)
 */
async function handleGet(id: string): Promise<Response> {
  try {
    const [sheet] = await db.select().from(sheets).where(eq(sheets.id, id)).limit(1);

    if (!sheet) {
      return new Response(
        JSON.stringify({ error: "Sheet not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify(sheet),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error fetching sheet:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
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
  try {
    const userId = await getUserId(req);
    if (!userId) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const body = await req.json();
    const { data } = body;

    if (!data || typeof data !== "object") {
      return new Response(
        JSON.stringify({ error: "Invalid data: 'data' field is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const [newSheet] = await db
      .insert(sheets)
      .values({
        ownerId: userId,
        data: data as Record<string, unknown>,
      })
      .returning();

    return new Response(
      JSON.stringify(newSheet),
      {
        status: 201,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error creating sheet:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
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
  try {
    const userId = await getUserId(req);
    if (!userId) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // First, check if sheet exists and user owns it
    const [existingSheet] = await db
      .select()
      .from(sheets)
      .where(eq(sheets.id, id))
      .limit(1);

    if (!existingSheet) {
      return new Response(
        JSON.stringify({ error: "Sheet not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (existingSheet.ownerId !== userId) {
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
      return new Response(
        JSON.stringify({ error: "Invalid data: 'data' field is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const [updatedSheet] = await db
      .update(sheets)
      .set({
        data: data as Record<string, unknown>,
        updatedAt: new Date(),
      })
      .where(eq(sheets.id, id))
      .returning();

    return new Response(
      JSON.stringify(updatedSheet),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error updating sheet:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
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
  try {
    const userId = await getUserId(req);
    if (!userId) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // First, check if sheet exists and user owns it
    const [existingSheet] = await db
      .select()
      .from(sheets)
      .where(eq(sheets.id, id))
      .limit(1);

    if (!existingSheet) {
      return new Response(
        JSON.stringify({ error: "Sheet not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (existingSheet.ownerId !== userId) {
      return new Response(
        JSON.stringify({ error: "Forbidden: You don't own this sheet" }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    await db.delete(sheets).where(eq(sheets.id, id));

    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error deleting sheet:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
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
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    // Extract the sheet ID from the path
    // Path format: /functions/v1/sheet-api/:id
    const pathParts = url.pathname.split("/").filter(Boolean);
    // Find the index of 'sheet-api' and get the next part as ID
    const apiIndex = pathParts.indexOf("sheet-api");
    const id = apiIndex >= 0 && pathParts[apiIndex + 1] ? pathParts[apiIndex + 1] : null;

    let response: Response;

    switch (req.method) {
      case "GET":
        if (!id) {
          response = new Response(
            JSON.stringify({ error: "Sheet ID is required" }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        } else {
          response = await handleGet(id);
        }
        break;

      case "POST":
        response = await handlePost(req);
        break;

      case "PUT":
        if (!id) {
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
        response = new Response(
          JSON.stringify({ error: "Method not allowed" }),
          {
            status: 405,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
    }

    return response;
  } catch (error) {
    console.error("Unhandled error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
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

