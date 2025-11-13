import { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, Link as LinkIcon, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { uploadPdf, uploadLink, DocumentMetadata } from '@/lib/upload';

interface UploadDocumentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sectionId: string;
  onUploadSuccess?: () => void;
}

export function UploadDocumentModal({ 
  open, 
  onOpenChange, 
  sectionId,
  onUploadSuccess 
}: UploadDocumentModalProps) {
  const { toast } = useToast();
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [linkUrl, setLinkUrl] = useState('');
  const [documentName, setDocumentName] = useState('');
  const [description, setDescription] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      const validTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif'];
      if (validTypes.includes(file.type)) {
        setSelectedFile(file);
        setDocumentName(file.name);
      } else {
        toast({
          title: "Invalid file type",
          description: "Please upload a PDF or image file (PNG, JPEG, WebP, GIF)",
          variant: "destructive"
        });
      }
    }
  }, [toast]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setDocumentName(file.name);
    }
  };

  const handleUploadFile = async () => {
    if (!selectedFile || !documentName) {
      toast({
        title: "Missing information",
        description: "Please select a file and provide a name",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);
    try {
      const metadata: DocumentMetadata = {
        name: documentName,
        description: description || undefined,
        section_id: sectionId,
        version: '1.0',
        restricted: false
      };

      await uploadPdf(selectedFile, metadata);
      
      toast({
        title: "Upload successful",
        description: `${documentName} has been uploaded`,
      });
      
      resetForm();
      onOpenChange(false);
      onUploadSuccess?.();
    } catch (error) {
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload file",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleUploadLink = async () => {
    if (!linkUrl || !documentName) {
      toast({
        title: "Missing information",
        description: "Please provide both URL and name",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);
    try {
      const metadata: DocumentMetadata = {
        name: documentName,
        description: description || undefined,
        section_id: sectionId,
        version: '1.0',
        restricted: false
      };

      await uploadLink(linkUrl, metadata);
      
      toast({
        title: "Link saved",
        description: `${documentName} has been added`,
      });
      
      resetForm();
      onOpenChange(false);
      onUploadSuccess?.();
    } catch (error) {
      toast({
        title: "Failed to save link",
        description: error instanceof Error ? error.message : "Failed to save link",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const resetForm = () => {
    setSelectedFile(null);
    setLinkUrl('');
    setDocumentName('');
    setDescription('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Upload Document</DialogTitle>
          <DialogDescription>
            Upload a PDF/image file or add a link to your document
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="file" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="file">File Upload</TabsTrigger>
            <TabsTrigger value="link">Add Link</TabsTrigger>
          </TabsList>

          <TabsContent value="file" className="space-y-4">
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                isDragging 
                  ? 'border-primary bg-primary/5' 
                  : 'border-border hover:border-primary/50'
              }`}
            >
              {selectedFile ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Upload className="h-5 w-5 text-primary" />
                    <span className="text-sm font-medium">{selectedFile.name}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedFile(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Drag and drop your file here, or click to browse
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Supported: PDF, PNG, JPEG, WebP, GIF
                  </p>
                  <input
                    type="file"
                    accept=".pdf,image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload">
                    <Button variant="outline" size="sm" asChild>
                      <span>Browse Files</span>
                    </Button>
                  </label>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="file-name">Document Name</Label>
              <Input
                id="file-name"
                value={documentName}
                onChange={(e) => setDocumentName(e.target.value)}
                placeholder="Enter document name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="file-description">Description (optional)</Label>
              <Input
                id="file-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description"
              />
            </div>

            <Button 
              onClick={handleUploadFile} 
              disabled={!selectedFile || !documentName || isUploading}
              className="w-full"
            >
              {isUploading ? 'Uploading...' : 'Upload Document'}
            </Button>
          </TabsContent>

          <TabsContent value="link" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="link-url">URL</Label>
              <div className="flex gap-2">
                <LinkIcon className="h-5 w-5 text-muted-foreground mt-2" />
                <Input
                  id="link-url"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://example.com/document"
                  type="url"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="link-name">Document Name</Label>
              <Input
                id="link-name"
                value={documentName}
                onChange={(e) => setDocumentName(e.target.value)}
                placeholder="Enter document name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="link-description">Description (optional)</Label>
              <Input
                id="link-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description"
              />
            </div>

            <Button 
              onClick={handleUploadLink} 
              disabled={!linkUrl || !documentName || isUploading}
              className="w-full"
            >
              {isUploading ? 'Saving...' : 'Save Link'}
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
