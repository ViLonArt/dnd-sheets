import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "@supabase/supabase-js";
import { eq } from "drizzle-orm";
import { db, closeDb } from "./db/index.ts";
import { characterSheets } from "./db/schema.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
};

function generateSlug(name: string): string {
  const baseName = name && name.trim() ? name.trim() : "unnamed";
  const slugified = baseName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const randomId = Math.random().toString(36).substring(2, 6);
  return `${slugified}-${randomId}`;
}

async function getUserId(req: Request): Promise<string | null> {
  const authHeader = req.headers.get("Authorization");
  console.log(`[Auth] Authorization header exists: ${!!authHeader}`);

  if (!authHeader) {
    console.log("[Auth] No Authorization header found");
    return null;
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY");

    if (!supabaseUrl || !supabaseKey) {
      console.error("[Config Error] SUPABASE_URL or SUPABASE_ANON_KEY not available in runtime");
      return null;
    }

    const supabaseClient = createClient(
      supabaseUrl,
      supabaseKey,
      {
        global: {
          headers: { Authorization: authHeader },
        },
        auth: {
          persistSession: false,
        },
      }
    );

    const { data: { user }, error } = await supabaseClient.auth.getUser();

    if (error || !user) {
      console.error("[Auth Error] getUser failed:", error);
      return null;
    }

    return user.id;
  } catch (error) {
    console.error("[Auth Exception] Error verifying token:", error);
    return null;
  }
}

async function handleGet(req: Request, pathId?: string): Promise<Response> {
  const url = new URL(req.url);
  const lookup = url.searchParams.get("id") || url.searchParams.get("slug") || pathId;

  if (!lookup) {
    return new Response(
      JSON.stringify({ error: "Sheet ID or slug is required" }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    .test(lookup);

  try {
    let sheet;
    if (isUuid) {
      [sheet] = await db
        .select()
        .from(characterSheets)
        .where(eq(characterSheets.id, lookup))
        .limit(1);
    } else {
      [sheet] = await db
        .select()
        .from(characterSheets)
        .where(eq(characterSheets.slug, lookup))
        .limit(1);
    }

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
    console.error("[GET Error] Error fetching character sheet:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
}

async function handlePost(req: Request): Promise<Response> {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
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
      return new Response(
        JSON.stringify({ error: "Internal server error", details: "Configuration missing" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabaseClient = createClient(
      supabaseUrl,
      supabaseKey,
      {
        global: {
          headers: { Authorization: authHeader },
        },
        auth: {
          persistSession: false,
        },
      }
    );

    const { data: { user }, error } = await supabaseClient.auth.getUser();

    if (error || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized", details: error?.message || "User verification failed" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const userId = user.id;
    const body = await req.json();
    const { data, slug } = body;

    if (!data || typeof data !== "object") {
      return new Response(
        JSON.stringify({ error: "Invalid data: 'data' field is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    let finalSlug = slug;
    if (!finalSlug || typeof finalSlug !== "string" || !finalSlug.trim()) {
      const name = (data as Record<string, unknown>)?.name;
      const nameStr = typeof name === "string" ? name : "";
      finalSlug = generateSlug(nameStr);
    }

    const [newSheet] = await db
      .insert(characterSheets)
      .values({
        ownerId: userId,
        slug: finalSlug,
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
    console.error("[POST Error] Error creating character sheet:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
}

async function handlePut(id: string, req: Request): Promise<Response> {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
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
      return new Response(
        JSON.stringify({ error: "Internal server error", details: "Configuration missing" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabaseClient = createClient(
      supabaseUrl,
      supabaseKey,
      {
        global: {
          headers: { Authorization: authHeader },
        },
        auth: {
          persistSession: false,
        },
      }
    );

    const { data: { user }, error } = await supabaseClient.auth.getUser();

    if (error || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized", details: error?.message || "User verification failed" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const userId = user.id;
    const [existingSheet] = await db
      .select()
      .from(characterSheets)
      .where(eq(characterSheets.id, id))
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
      .update(characterSheets)
      .set({
        data: data as Record<string, unknown>,
        updatedAt: new Date(),
      })
      .where(eq(characterSheets.id, id))
      .returning();

    return new Response(
      JSON.stringify(updatedSheet),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("[PUT Error] Error updating character sheet:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
}

async function handleDelete(id: string, req: Request): Promise<Response> {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
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
      return new Response(
        JSON.stringify({ error: "Internal server error", details: "Configuration missing" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabaseClient = createClient(
      supabaseUrl,
      supabaseKey,
      {
        global: {
          headers: { Authorization: authHeader },
        },
        auth: {
          persistSession: false,
        },
      }
    );

    const { data: { user }, error } = await supabaseClient.auth.getUser();

    if (error || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized", details: error?.message || "User verification failed" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const userId = user.id;
    const [existingSheet] = await db
      .select()
      .from(characterSheets)
      .where(eq(characterSheets.id, id))
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

    await db.delete(characterSheets).where(eq(characterSheets.id, id));

    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("[DELETE Error] Error deleting character sheet:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const pathParts = url.pathname.split("/").filter(Boolean);
    const apiIndex = pathParts.indexOf("character-sheet-api");
    const id = apiIndex >= 0 && pathParts[apiIndex + 1] ? pathParts[apiIndex + 1] : null;

    let response: Response;

    switch (req.method) {
      case "GET":
        response = await handleGet(req, id || undefined);
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
    console.error("[Unhandled Error] Exception in main handler:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } finally {
    await closeDb();
  }
});
