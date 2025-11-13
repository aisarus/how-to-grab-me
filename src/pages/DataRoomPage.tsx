import { useState } from 'react';
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
  type: 'pdf' | 'link' | 'image' | 'excel';
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

const sections: Section[] = [
  {
    id: 'overview',
    title: 'Overview',
    icon: FileText,
    description: 'High-level company overview, mission, and key highlights for quick investor onboarding.',
    documents: [
      { name: 'One Pager', description: 'Executive summary with key metrics and value proposition', type: 'pdf', path: '01_Overview/OnePager_v2.1.pdf', version: 'v2.1', lastUpdated: '2025-01-15' },
      { name: 'Executive Summary', description: 'Detailed company overview and strategic vision', type: 'pdf', path: '01_Overview/Executive_Summary.pdf', version: 'v1.5', lastUpdated: '2025-01-10' },
      { name: 'Founder Letter', description: 'Personal message from founders on vision and journey', type: 'pdf', path: '01_Overview/Founder_Letter.pdf', version: 'v1.0', lastUpdated: '2024-12-20' }
    ]
  },
  {
    id: 'product',
    title: 'Product',
    icon: Lightbulb,
    description: 'Live demos, product screenshots, user flows, and feature documentation.',
    documents: [
      { name: 'MVP Demo Link', description: 'Interactive demonstration of core platform features', type: 'link', path: 'https://lovable-promptops-demo.app', version: 'v1.0', lastUpdated: '2025-01-12' },
      { name: 'Product Screenshots', description: 'Visual walkthrough of user interface and workflows', type: 'image', path: '02_Product/UI_Screenshots_Jan2025.png', version: 'v3.0', lastUpdated: '2025-01-12' },
      { name: 'Before/After Examples', description: 'Real-world optimization results and improvements', type: 'pdf', path: '02_Product/BeforeAfter_Cases.pdf', version: 'v1.2', lastUpdated: '2025-01-08' },
      { name: 'User Flow Diagrams', description: 'Complete user journey and interaction patterns', type: 'image', path: '02_Product/UserFlow_Diagrams.png', version: 'v2.0', lastUpdated: '2024-12-28' }
    ]
  },
  {
    id: 'technology',
    title: 'Technology',
    icon: Shield,
    description: 'Technical architecture, PCV pipeline details, security practices, and performance metrics.',
    documents: [
      { name: 'PCV Pipeline Architecture', description: 'Complete system architecture and data flow design', type: 'image', path: '03_Technology/PCV_Flowchart_v1.0.png', version: 'v1.0', lastUpdated: '2025-01-05' },
      { name: 'Metrics Whitepaper', description: 'Technical methodology for quality and efficiency scoring', type: 'pdf', path: '03_Technology/Metrics_Whitepaper.pdf', version: 'v1.3', lastUpdated: '2024-12-15' },
      { name: 'Security Practices', description: 'Data protection, encryption, and compliance measures', type: 'pdf', path: '03_Technology/Security_Documentation.pdf', version: 'v2.0', lastUpdated: '2025-01-03' },
      { name: 'API Documentation', description: 'Developer guide for integration and automation', type: 'link', path: 'https://docs.lovable-promptops.com/api', version: 'v1.1', lastUpdated: '2025-01-10' }
    ]
  },
  {
    id: 'ip',
    title: 'Intellectual Property',
    icon: Lock,
    description: 'Patents, research papers, invention disclosures, and licensing information.',
    documents: [
      { name: 'Algorithmic Tolerance Budget', description: 'Novel approach to prompt optimization scoring', type: 'pdf', path: '04_IP/Algorithmic_Tolerance_Budget.pdf', version: 'v1.0', lastUpdated: '2024-11-20' },
      { name: 'Research Papers', description: 'Published studies on prompt engineering efficiency', type: 'pdf', path: '04_IP/Research_Papers_Collection.pdf', version: 'v1.2', lastUpdated: '2024-12-01' },
      { name: 'Invention Disclosures', description: 'Proprietary methods and patent applications', type: 'pdf', path: '04_IP/Invention_Disclosures.pdf', version: 'v1.0', lastUpdated: '2024-10-15', restricted: true },
      { name: 'Open Source Licenses', description: 'Third-party dependencies and compliance report', type: 'pdf', path: '04_IP/OSS_License_Audit.pdf', version: 'v2.0', lastUpdated: '2025-01-02' }
    ]
  },
  {
    id: 'market',
    title: 'Market & Business',
    icon: TrendingUp,
    description: 'Market analysis, competitive landscape, GTM strategy, and growth projections.',
    documents: [
      { name: 'TAM/SAM/SOM Analysis', description: 'Total addressable market sizing and segmentation', type: 'excel', path: '05_Market/Market_Sizing_Model.xlsx', version: 'v1.4', lastUpdated: '2025-01-08' },
      { name: 'Competitive Analysis', description: 'Competitor landscape and differentiation strategy', type: 'pdf', path: '05_Market/Competitive_Matrix.pdf', version: 'v2.1', lastUpdated: '2025-01-12' },
      { name: 'GTM Strategy', description: 'Go-to-market plan and customer acquisition channels', type: 'pdf', path: '05_Market/GTM_Strategy_2025.pdf', version: 'v1.3', lastUpdated: '2024-12-20' },
      { name: 'Customer Case Studies', description: 'Early adopter results and testimonials', type: 'pdf', path: '05_Market/Case_Studies_Q4_2024.pdf', version: 'v1.0', lastUpdated: '2024-12-30' }
    ]
  },
  {
    id: 'financials',
    title: 'Financials',
    icon: DollarSign,
    description: 'Financial model, projections, assumptions, and use of funds breakdown.',
    documents: [
      { name: 'Financial Model (3Y)', description: 'Detailed revenue, cost, and cash flow projections', type: 'excel', path: '06_Financials/Financial_Model_3Y.xlsx', version: 'v2.3', lastUpdated: '2025-01-14', restricted: true },
      { name: 'Key Assumptions', description: 'Growth drivers, unit economics, and sensitivity analysis', type: 'pdf', path: '06_Financials/Model_Assumptions.pdf', version: 'v1.5', lastUpdated: '2025-01-14' },
      { name: 'Use of Funds', description: 'Detailed allocation plan for seed funding', type: 'pdf', path: '06_Financials/Use_of_Funds.pdf', version: 'v1.2', lastUpdated: '2025-01-10' },
      { name: 'Historical Metrics', description: 'Past performance data and KPIs', type: 'excel', path: '06_Financials/Historical_Metrics_2024.xlsx', version: 'v1.0', lastUpdated: '2025-01-05' }
    ]
  },
  {
    id: 'legal',
    title: 'Legal',
    icon: Scale,
    description: 'NDAs, founder agreements, terms of service, and compliance documentation.',
    documents: [
      { name: 'NDA Template', description: 'Standard non-disclosure agreement for investors', type: 'pdf', path: '07_Legal/NDA_Template.pdf', version: 'v1.0', lastUpdated: '2024-11-01' },
      { name: 'Founder Agreements', description: 'Co-founder equity split and vesting schedules', type: 'pdf', path: '07_Legal/Founder_Agreements.pdf', version: 'v1.0', lastUpdated: '2024-09-15', restricted: true },
      { name: 'Terms of Service', description: 'Platform usage terms and conditions', type: 'pdf', path: '07_Legal/ToS_Draft_v2.pdf', version: 'v2.0', lastUpdated: '2024-12-18' },
      { name: 'Privacy Policy', description: 'Data handling and GDPR compliance documentation', type: 'pdf', path: '07_Legal/Privacy_Policy.pdf', version: 'v1.1', lastUpdated: '2024-12-20' }
    ]
  },
  {
    id: 'admin',
    title: 'Changelog & Access',
    icon: Clock,
    description: 'Data room updates, version history, and access permissions management.',
    documents: [
      { name: 'Update Log', description: 'Chronological record of all data room changes', type: 'pdf', path: '08_Admin/DataRoom_Changelog.pdf', version: 'v1.0', lastUpdated: '2025-01-15' },
      { name: 'Access Permissions', description: 'Investor access levels and document restrictions', type: 'pdf', path: '08_Admin/Access_Matrix.pdf', version: 'v1.0', lastUpdated: '2025-01-12', restricted: true }
    ]
  }
];

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'pdf': return FileText;
    case 'link': return LinkIcon;
    case 'image': return ImageIcon;
    case 'excel': return FileSpreadsheet;
    default: return FileText;
  }
};

const DataRoomPage = () => {
  const [activeSection, setActiveSection] = useState('overview');
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedSectionId, setSelectedSectionId] = useState('');

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
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
        onUploadSuccess={() => {
          console.log('Upload successful');
        }}
      />
    </div>
  );
};

export default DataRoomPage;
