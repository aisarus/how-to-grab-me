import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listOptimizationsTool from "./tools/list-optimizations";
import getOptimizationTool from "./tools/get-optimization";
import getProfileTool from "./tools/get-profile";

// Build the OAuth issuer from the project ref (Vite inlines this at build time).
// Must be the direct supabase.co host, NOT the SUPABASE_URL proxy.
const projectRef =
  import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "tri-tfm-mcp",
  title: "TRI/TFM Prompt Optimizer",
  version: "0.1.0",
  instructions:
    "Read-only tools over the signed-in user's TRI/TFM prompt-optimization history. " +
    "Use `list_optimizations` to browse recent runs, `get_optimization` for full metrics of one run, " +
    "and `get_profile` for the user's account state. Running a new optimization happens inside the app UI, " +
    "not through this MCP server.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [listOptimizationsTool, getOptimizationTool, getProfileTool],
});
