import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { initializeDataRoom, checkDataRoomInitialization } from '@/lib/initializeDataRoom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { UserMenu } from '@/components/UserMenu';
import { UploadDocumentModal } from '@/components/UploadDocumentModal';
import { 
  FileText, 
  Download, 
  ExternalLink, 
  Image as ImageIcon, 
  FileSpreadsheet,
  Lock,
  Calendar,
  Mail,
  Building2,
  TrendingUp,
  Shield,
  Lightbulb,
  DollarSign,
  Scale,
  Clock,
  ChevronRight,
  Link as LinkIcon,
  Upload
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface Document {
  name: string;
  description: string;
  type: 'pdf' | 'link' | 'image' | 'excel' | 'markdown';
  path: string;
  version: string;
  lastUpdated: string;
  restricted?: boolean;
}

interface Section {
  id: string;
  title: string;
  icon: any;
  description: string;
  documents: Document[];
}

const SECTION_CONFIG: Omit<Section, 'documents'>[] = [
  {
    id: 'overview',
    title: 'Overview',
    icon: FileText,
    description: 'High-level company overview, mission, and key highlights for quick investor onboarding.',
  },
  {
    id: 'product',
    title: 'Product',
    icon: Lightbulb,
    description: 'Live demos, product screenshots, user flows, and feature documentation.',
  },
  {
    id: 'technology',
    title: 'Technology',
    icon: Shield,
    description: 'Technical architecture, PCV pipeline details, security practices, and performance metrics.',
  },
  {
    id: 'ip',
    title: 'Intellectual Property',
    icon: Lock,
    description: 'Patent applications, trademarks, and proprietary algorithms documentation.',
  },
  {
    id: 'financials',
    title: 'Financials',
    icon: DollarSign,
    description: 'Financial statements, projections, and unit economics.',
  },
  {
    id: 'legal',
    title: 'Legal',
    icon: Scale,
    description: 'Incorporation documents, contracts, and compliance records.',
  },
  {
    id: 'market',
    title: 'Market',
    icon: TrendingUp,
    description: 'Market analysis, competitive landscape, and growth opportunities.',
  },
];

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'pdf': return FileText;
    case 'link': return LinkIcon;
    case 'image': return ImageIcon;
    case 'excel': return FileSpreadsheet;
    case 'markdown': return FileText;
    default: return FileText;
  }
};

export default function DataRoomPage() {
  const [activeSection, setActiveSection] = useState('overview');
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedSectionId, setSelectedSectionId] = useState('');
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadDocuments();
    initIfNeeded();
  }, []);

  const initIfNeeded = async () => {
    try {
      const needsInit = await checkDataRoomInitialization();
      if (needsInit) {
        await initializeDataRoom();
        await loadDocuments();
        toast({ title: "Data Room Initialized", description: "Initial documents loaded." });
      }
    } catch (error) {
      console.error("Failed to initialize:", error);
    }
  };

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const client: any = supabase;
      const { data, error } = await client.from('data_room_documents').select('*').order('section_id').order('created_at');
      if (error) throw error;

      const sectionMap = new Map<string, Document[]>();
      data?.forEach((doc: any) => {
        const document: Document = {
          name: doc.name,
          description: doc.description || '',
          type: doc.type,
          path: doc.path,
          version: doc.version,
          lastUpdated: new Date(doc.updated_at).toISOString().split('T')[0],
          restricted: doc.restricted || false,
        };
        const existing = sectionMap.get(doc.section_id) || [];
        sectionMap.set(doc.section_id, [...existing, document]);
      });

      setSections(SECTION_CONFIG.map((config) => ({ ...config, documents: sectionMap.get(config.id) || [] })));
    } catch (error) {
      toast({ title: "Error", description: "Failed to load documents.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleDocumentAction = async (doc: Document) => {
    if (doc.type === 'link') {
      window.open(doc.path, '_blank');
    } else if (doc.type === 'markdown') {
      try {
        const response = await fetch(doc.path);
        const markdown = await response.text();
        const newWindow = window.open('', '_blank');
        if (newWindow) {
          newWindow.document.write(`<html><head><title>${doc.name}</title><style>body{font-family:system-ui;max-width:900px;margin:40px auto;padding:20px;line-height:1.6}pre{background:#f5f5f5;padding:15px;border-radius:5px;white-space:pre-wrap}h1,h2{margin-top:24px;border-bottom:1px solid #ddd;padding-bottom:8px}table{border-collapse:collapse;width:100%;margin:20px 0}th,td{border:1px solid #ddd;padding:12px;text-align:left}th{background:#f5f5f5}</style></head><body><pre>${markdown}</pre></body></html>`);
        }
      } catch (error) {
        toast({ title: "Error", description: "Failed to load document.", variant: "destructive" });
      }
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <ChevronRight className="w-4 h-4 rotate-180" />
              <span className="text-sm">Back to Main</span>
            </Link>
            <h1 className="text-2xl font-bold text-foreground mt-1">Lovable PromptOps Data Room</h1>
          </div>
          <UserMenu />
        </div>
      </header>

      {/* Navigation */}
      <nav className="sticky top-[73px] z-40 border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <ScrollArea className="w-full">
          <div className="container mx-auto px-4">
            <div className="flex gap-1 py-2">
              {sections.map((section) => {
                const Icon = section.icon;
                return (
                  <Button
                    key={section.id}
                    variant={activeSection === section.id ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => scrollToSection(section.id)}
                    className="gap-2 whitespace-nowrap"
                  >
                    <Icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{section.title}</span>
                  </Button>
                );
              })}
            </div>
          </div>
        </ScrollArea>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Summary Panel */}
          <Card className="mb-8 border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-2xl mb-2">Quick Access - Key Documents</CardTitle>
                  <CardDescription className="text-base">
                    Essential materials for initial review and due diligence
                  </CardDescription>
                </div>
                <div className="text-right text-sm text-muted-foreground">
                  <div className="flex items-center gap-2 justify-end mb-1">
                    <Calendar className="w-4 h-4" />
                    Last updated: Jan 15, 2025
                  </div>
                  <div className="flex items-center gap-2 justify-end">
                    <FileText className="w-4 h-4" />
                    {sections.reduce((acc, s) => acc + s.documents.length, 0)} documents
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card className="border-border/40 hover:border-primary/40 transition-colors">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="w-5 h-5 text-primary" />
                      <Badge variant="secondary">PDF</Badge>
                    </div>
                    <CardTitle className="text-lg">One Pager</CardTitle>
                    <CardDescription>Quick company overview</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button size="sm" className="w-full gap-2">
                      <Download className="w-4 h-4" />
                      Download
                    </Button>
                  </CardContent>
                </Card>

                <Card className="border-border/40 hover:border-primary/40 transition-colors">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2 mb-2">
                      <LinkIcon className="w-5 h-5 text-primary" />
                      <Badge variant="secondary">LINK</Badge>
                    </div>
                    <CardTitle className="text-lg">MVP Demo</CardTitle>
                    <CardDescription>Live product demonstration</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button size="sm" className="w-full gap-2" variant="outline">
                      <ExternalLink className="w-4 h-4" />
                      Open Demo
                    </Button>
                  </CardContent>
                </Card>

                <Card className="border-border/40 hover:border-primary/40 transition-colors">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2 mb-2">
                      <ImageIcon className="w-5 h-5 text-primary" />
                      <Badge variant="secondary">PNG</Badge>
                    </div>
                    <CardTitle className="text-lg">Architecture</CardTitle>
                    <CardDescription>System design diagram</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button size="sm" className="w-full gap-2" variant="outline">
                      <ExternalLink className="w-4 h-4" />
                      View
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>

          {/* Sections */}
          {sections.map((section, idx) => {
            const Icon = section.icon;
            return (
              <div key={section.id} id={section.id} className="mb-12 scroll-mt-32">
                <div className="mb-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <h2 className="text-3xl font-bold text-foreground">
                      {String(idx + 1).padStart(2, '0')}. {section.title}
                    </h2>
                  </div>
                  <p className="text-muted-foreground text-lg ml-14 max-w-4xl">
                    {section.description}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-14">
                  {section.documents.map((doc) => {
                    const TypeIcon = getTypeIcon(doc.type);
                    return (
                      <Card 
                        key={doc.path} 
                        className="border-border/40 hover:border-primary/40 transition-all hover:shadow-lg group"
                      >
                        <CardHeader>
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-md bg-primary/10 group-hover:bg-primary/20 transition-colors">
                                <TypeIcon className="w-5 h-5 text-primary" />
                              </div>
                              <div>
                                <Badge variant="outline" className="mb-1">
                                  {doc.type.toUpperCase()}
                                </Badge>
                                {doc.restricted && (
                                  <Badge variant="secondary" className="ml-1">
                                    <Lock className="w-3 h-3 mr-1" />
                                    Restricted
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <div className="text-xs text-muted-foreground text-right">
                              <div>{doc.version}</div>
                              <div className="flex items-center gap-1 mt-1">
                                <Calendar className="w-3 h-3" />
                                {doc.lastUpdated}
                              </div>
                            </div>
                          </div>
                          <CardTitle className="text-lg">{doc.name}</CardTitle>
                          <CardDescription className="text-sm">
                            {doc.description}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="flex gap-2">
                            {doc.type === 'link' ? (
                              <Button size="sm" className="flex-1 gap-2" variant="outline">
                                <ExternalLink className="w-4 h-4" />
                                Open Link
                              </Button>
                            ) : (
                              <>
                                <Button size="sm" className="flex-1 gap-2">
                                  <Download className="w-4 h-4" />
                                  Download
                                </Button>
                                <Button size="sm" variant="outline" className="gap-2">
                                  <ExternalLink className="w-4 h-4" />
                                  View
                                </Button>
                              </>
                            )}
                            <Button 
                              size="sm" 
                              variant="default"
                              className="gap-2 bg-green-600 hover:bg-green-700 text-white"
                              onClick={() => {
                                setSelectedSectionId(section.id);
                                setUploadModalOpen(true);
                              }}
                            >
                              <Upload className="w-4 h-4" />
                              Upload
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                {idx < sections.length - 1 && <Separator className="mt-12" />}
              </div>
            );
          })}

          {/* Footer */}
          <Card className="mt-12 border-border/40 bg-muted/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5" />
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                <div>
                  <div className="flex items-center gap-2 mb-2 text-muted-foreground">
                    <Building2 className="w-4 h-4" />
                    <span className="font-medium">Company</span>
                  </div>
                  <p className="text-foreground">Lovable PromptOps Inc.</p>
                  <p className="text-muted-foreground">AI Infrastructure for Developers</p>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-2 text-muted-foreground">
                    <Mail className="w-4 h-4" />
                    <span className="font-medium">Investor Relations</span>
                  </div>
                  <p className="text-foreground">investors@lovable-promptops.com</p>
                  <p className="text-muted-foreground">Response within 24 hours</p>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-2 text-muted-foreground">
                    <Lock className="w-4 h-4" />
                    <span className="font-medium">Data Room Access</span>
                  </div>
                  <p className="text-foreground">All documents confidential</p>
                  <p className="text-muted-foreground">NDA required for restricted files</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <UploadDocumentModal 
        open={uploadModalOpen}
        onOpenChange={setUploadModalOpen}
        sectionId={selectedSectionId}
        onUploadSuccess={loadDocuments}
      />
    </div>
  );
}
