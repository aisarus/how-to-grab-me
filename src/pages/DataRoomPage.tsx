import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UserMenu } from '@/components/UserMenu';
import { Database, FileText, Lock, Users } from 'lucide-react';

const DataRoomPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-foreground">Data Room</h1>
          <UserMenu />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-border/40 bg-card/50 backdrop-blur">
              <CardHeader>
                <Database className="w-8 h-8 text-primary mb-2" />
                <CardTitle>Data Storage</CardTitle>
                <CardDescription>Manage your data assets</CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-border/40 bg-card/50 backdrop-blur">
              <CardHeader>
                <FileText className="w-8 h-8 text-primary mb-2" />
                <CardTitle>Documents</CardTitle>
                <CardDescription>Access shared files</CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-border/40 bg-card/50 backdrop-blur">
              <CardHeader>
                <Lock className="w-8 h-8 text-primary mb-2" />
                <CardTitle>Security</CardTitle>
                <CardDescription>Control access rights</CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-border/40 bg-card/50 backdrop-blur">
              <CardHeader>
                <Users className="w-8 h-8 text-primary mb-2" />
                <CardTitle>Collaborators</CardTitle>
                <CardDescription>Manage team access</CardDescription>
              </CardHeader>
            </Card>
          </div>

          <Card className="border-border/40 bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle>Data Room Content</CardTitle>
              <CardDescription>Your secure data repository</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <Database className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>Data Room ready for your content</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default DataRoomPage;
