import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { initializeDataRoom } from '@/lib/initializeDataRoom';
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
      await initializeDataRoom(); // safe: inserts only missing docs
    } catch (error) {
      console.error("Failed to initialize:", error);
      // Continue loading documents even if init fails
    }
    await loadDocuments();
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
      // Ensure Executive Summary appears in Overview even if DB misses it
      const overviewList = sectionMap.get('overview') || [];
      if (!overviewList.some((d) => d.path === '/data-room-docs/executive-summary.md')) {
        overviewList.unshift({
          name: 'Executive Summary',
          description: 'Honest assessment of project status, metrics, risks, and next steps',
          type: 'markdown',
          path: '/data-room-docs/executive-summary.md',
          version: 'v1.0',
          lastUpdated: new Date().toISOString().split('T')[0],
        });
        sectionMap.set('overview', overviewList);
      }

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

  const handleDocumentAction = async (doc: Document, action: 'view' | 'download') => {
    if (doc.type === 'link') {
      window.open(doc.path, '_blank');
      return;
    }

    if (doc.type === 'markdown') {
      try {
        const response = await fetch(doc.path);
        if (!response.ok) throw new Error('Failed to fetch document');
        const markdown = await response.text();
        
        if (action === 'view') {
          const newWindow = window.open('', '_blank');
          if (newWindow) {
            newWindow.document.write(`
              <html>
                <head>
                  <title>${doc.name}</title>
                  <meta charset="UTF-8">
                  <style>
                    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif; max-width: 900px; margin: 40px auto; padding: 20px; line-height: 1.6; color: #333; }
                    pre { background: #f8f9fa; padding: 20px; border-radius: 8px; white-space: pre-wrap; overflow-x: auto; border: 1px solid #e9ecef; }
                    h1 { font-size: 2em; margin-top: 0; border-bottom: 2px solid #dee2e6; padding-bottom: 12px; }
                    h2 { font-size: 1.5em; margin-top: 32px; border-bottom: 1px solid #dee2e6; padding-bottom: 8px; }
                    h3 { font-size: 1.25em; margin-top: 24px; }
                    table { border-collapse: collapse; width: 100%; margin: 24px 0; border: 1px solid #dee2e6; }
                    th, td { border: 1px solid #dee2e6; padding: 12px 16px; text-align: left; }
                    th { background: #f8f9fa; font-weight: 600; }
                    tr:nth-child(even) { background: #f8f9fa; }
                    code { background: #f8f9fa; padding: 2px 6px; border-radius: 4px; font-family: 'SF Mono', Monaco, Consolas, monospace; }
                    ul, ol { margin: 16px 0; padding-left: 32px; }
                    li { margin: 8px 0; }
                    a { color: #0066cc; text-decoration: none; }
                    a:hover { text-decoration: underline; }
                    hr { border: none; border-top: 1px solid #dee2e6; margin: 32px 0; }
                  </style>
                </head>
                <body><pre>${markdown}</pre></body>
              </html>
            `);
            newWindow.document.close();
          }
        } else {
          // Download
          const blob = new Blob([markdown], { type: 'text/markdown' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${doc.name}.md`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }
      } catch (error) {
        console.error('Document load error:', error);
        toast({ 
          title: "Ошибка", 
          description: "Не удалось загрузить документ. Проверьте консоль для подробностей.", 
          variant: "destructive" 
        });
      }
    } else {
      // For PDF and other files
      const a = document.createElement('a');
      a.href = doc.path;
      a.download = doc.name;
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
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
                              <Button 
                                size="sm" 
                                className="flex-1 gap-2" 
                                variant="outline"
                                onClick={() => handleDocumentAction(doc, 'view')}
                              >
                                <ExternalLink className="w-4 h-4" />
                                Open Link
                              </Button>
                            ) : doc.type === 'markdown' ? (
                              <>
                                <Button 
                                  size="sm" 
                                  className="flex-1 gap-2"
                                  onClick={() => handleDocumentAction(doc, 'view')}
                                >
                                  <ExternalLink className="w-4 h-4" />
                                  View
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  className="gap-2"
                                  onClick={() => handleDocumentAction(doc, 'download')}
                                >
                                  <Download className="w-4 h-4" />
                                  Download
                                </Button>
                              </>
                            ) : (
                              <Button 
                                size="sm" 
                                className="flex-1 gap-2"
                                onClick={() => handleDocumentAction(doc, 'download')}
                              >
                                <Download className="w-4 h-4" />
                                Download
                              </Button>
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
