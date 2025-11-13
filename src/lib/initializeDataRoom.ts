import { supabase } from "@/integrations/supabase/client";

export interface DocumentToCreate {
  name: string;
  description: string;
  type: "pdf" | "link" | "markdown";
  path: string;
  version: string;
  section_id: string;
  restricted?: boolean;
}

const INITIAL_DOCUMENTS: DocumentToCreate[] = [
  // Overview Section
  {
    name: "One Pager",
    description: "Executive summary with key metrics and value proposition",
    type: "markdown",
    path: "/data-room-docs/one-pager.md",
    version: "v2.1",
    section_id: "overview",
  },
  {
    name: "Product Overview",
    description: "Comprehensive product features, use cases, and roadmap",
    type: "markdown",
    path: "/data-room-docs/product-overview.md",
    version: "v1.5",
    section_id: "overview",
  },
  {
    name: "MVP Status Report",
    description: "Current development stage, implemented features, and limitations",
    type: "markdown",
    path: "/data-room-docs/mvp-status.md",
    version: "v1.0",
    section_id: "overview",
  },
  
  // Product Section
  {
    name: "MVP Demo Link",
    description: "Interactive demonstration of core platform features",
    type: "link",
    path: window.location.origin,
    version: "v1.0",
    section_id: "product",
  },
  
  // Technology Section
  {
    name: "Technical Architecture",
    description: "Complete system architecture, stack, and design patterns",
    type: "markdown",
    path: "/data-room-docs/technical-architecture.md",
    version: "v1.3",
    section_id: "technology",
  },
  {
    name: "Metrics Whitepaper",
    description: "Technical methodology for quality and efficiency scoring",
    type: "markdown",
    path: "/data-room-docs/metrics-methodology.md",
    version: "v1.3",
    section_id: "technology",
  },
  {
    name: "Security Practices",
    description: "Data protection, encryption, and compliance measures",
    type: "markdown",
    path: "/data-room-docs/security-practices.md",
    version: "v2.0",
    section_id: "technology",
  },
  {
    name: "API Documentation",
    description: "Developer guide for integration and automation",
    type: "markdown",
    path: "/data-room-docs/api-documentation.md",
    version: "v1.1",
    section_id: "technology",
  },
  
  // Financials Section
  {
    name: "Financial Projections",
    description: "Early-stage financial overview and funding requirements",
    type: "markdown",
    path: "/data-room-docs/financial-projections.md",
    version: "v1.0",
    section_id: "financials",
  },
  
  // Market Section
  {
    name: "Market Analysis",
    description: "Market overview, competitive landscape, and target segments",
    type: "markdown",
    path: "/data-room-docs/market-analysis.md",
    version: "v1.0",
    section_id: "market",
  },
];

/**
 * Initialize data room with documents from public folder
 */
export async function initializeDataRoom(): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error("User not authenticated");
  }

  // Check if documents already exist
  const client: any = supabase;
  const { data: existing } = await client
    .from("data_room_documents")
    .select("path")
    .eq("created_by", user.id);

  const existingPaths = new Set(
    existing?.map((doc) => doc.path) || []
  );

  // Insert only new documents (check by path to avoid unique constraint violation)
  const documentsToInsert = INITIAL_DOCUMENTS.filter(
    (doc) => !existingPaths.has(doc.path)
  ).map((doc) => ({
    name: doc.name,
    description: doc.description,
    type: doc.type,
    path: doc.path,
    storage_path: null, // Documents are in public folder
    version: doc.version,
    section_id: doc.section_id,
    restricted: doc.restricted || false,
    created_by: user.id,
  }));

  if (documentsToInsert.length > 0) {
    const { error } = await client
      .from("data_room_documents")
      .insert(documentsToInsert);

    if (error) {
      console.error("Failed to initialize data room:", error);
      throw error;
    }
  }
}

/**
 * Check if data room needs initialization
 */
export async function checkDataRoomInitialization(): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return false;

  const client: any = supabase;
  const { data, error } = await client
    .from("data_room_documents")
    .select("id")
    .eq("created_by", user.id)
    .limit(1);

  if (error) {
    console.error("Failed to check data room:", error);
    return false;
  }

  return (data?.length || 0) === 0;
}
