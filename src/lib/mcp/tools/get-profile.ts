import { createClient } from "@supabase/supabase-js";
import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";

function supabaseForUser(ctx: ToolContext) {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    {
      global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    },
  );
}

export default defineTool({
  name: "get_profile",
  title: "Get my profile",
  description:
    "Return the signed-in user's profile: email, credits, lifetime access flag, maker flag, configured API provider. Never returns the stored API key value.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_input, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("profiles")
      .select("id, email, credits, has_lifetime_access, is_maker, api_provider, custom_api_key, created_at")
      .eq("id", ctx.getUserId())
      .maybeSingle();

    if (error) {
      return { content: [{ type: "text", text: error.message }], isError: true };
    }
    if (!data) {
      return { content: [{ type: "text", text: "Profile not found" }], isError: true };
    }
    // Redact the API key — never surface the raw value.
    const safe = {
      id: data.id,
      email: data.email,
      credits: data.credits,
      has_lifetime_access: data.has_lifetime_access,
      is_maker: data.is_maker,
      api_provider: data.api_provider,
      has_custom_api_key: !!data.custom_api_key,
      created_at: data.created_at,
    };
    return {
      content: [{ type: "text", text: JSON.stringify(safe, null, 2) }],
      structuredContent: safe,
    };
  },
});
