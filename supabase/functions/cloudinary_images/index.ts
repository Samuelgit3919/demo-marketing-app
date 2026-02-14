// index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*", // ← tighten in production (e.g. "https://your-domain.com")
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, accept, x-requested-with",
  "Access-Control-Max-Age": "86400", // cache preflight 24 hours
};

serve(async (req: Request): Promise<Response> => {
  // ─────────────────────────────────────────────
  // 1. Handle CORS preflight (OPTIONS)
  // ─────────────────────────────────────────────
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,                    // 204 No Content is more correct for OPTIONS
      headers: corsHeaders,
    });
  }

  // ─────────────────────────────────────────────
  // 2. Only allow GET & POST
  // ─────────────────────────────────────────────
  if (req.method !== "GET" && req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  try {
    // ─────────────────────────────────────────────
    // 3. Read folder from query param (GET) or body (POST)
    // ─────────────────────────────────────────────
    let folder = "";

    if (req.method === "GET") {
      const url = new URL(req.url);
      folder = url.searchParams.get("folder") || "";
    } else if (req.method === "POST") {
      const contentType = req.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        const body = await req.json().catch(() => ({}));
        folder = body.folder || "";
      }
    }

    // Optional: normalize folder (remove leading/trailing slashes)
    folder = folder.replace(/^\/+|\/+$/g, "");

    // ─────────────────────────────────────────────
    // 4. Cloudinary credentials
    // ─────────────────────────────────────────────
    const CLOUD_NAME = Deno.env.get("CLOUDINARY_CLOUD_NAME") || "dxqdiffon";
    const API_KEY = Deno.env.get("CLOUDINARY_API_KEY");
    const API_SECRET = Deno.env.get("CLOUDINARY_API_SECRET");

    if (!API_KEY || !API_SECRET) {
      return new Response(
        JSON.stringify({
          error: "Cloudinary credentials not configured in environment variables",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // ─────────────────────────────────────────────
    // 5. Build Cloudinary Admin API URL
    // ─────────────────────────────────────────────
    const params = new URLSearchParams({
      prefix: folder ? `${folder}/` : "",
      max_results: "200",           // increase if needed (max 500)
      type: "upload",
      resource_type: "image",
    });

    const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/resources/image?${params}`;

    const auth = btoa(`${API_KEY}:${API_SECRET}`);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Basic ${auth}`,
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "No response body");
      return new Response(
        JSON.stringify({
          error: `Cloudinary API failed`,
          status: response.status,
          details: errorText,
        }),
        {
          status: response.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const data = await response.json();

    // ─────────────────────────────────────────────
    // 6. Transform resources into cleaner format
    // ─────────────────────────────────────────────
    const images = (data.resources || []).map((r: any) => ({
      public_id: r.public_id,
      filename: r.public_id.split("/").pop() || "",
      url: r.secure_url,
      thumbnail: r.secure_url.replace("/upload/", "/upload/c_fill,w_400,h_400/"),
      width: r.width,
      height: r.height,
      format: r.format,
      bytes: r.bytes,
      created_at: r.created_at,
      tags: r.tags || [],
      folder: r.folder || "",
    }));

    // Optional: sort by creation date (newest first)
    images.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return new Response(
      JSON.stringify({
        success: true,
        folder,
        count: images.length,
        total_count: data.total_count || images.length,
        images,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (err: any) {
    console.error("[cloudinary-images]", err);

    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: err?.message || "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});