import React, { useState, useCallback, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Download,
  FileText,
  Image,
  Video,
  ExternalLink,
  AlertTriangle,
  Eye,
  EyeOff
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Logger } from '@/utils/logger';
import CloudinaryVideoPlayer from './CloudinaryVideoPlayer';
import { ILecture } from '@/types/course';

interface ContentViewerProps {
  lecture: ILecture;
  onDownload?: (url: string, filename: string) => void;
  enableDownload?: boolean;
  className?: string;
}

interface ContentItem {
  type: 'video' | 'pdf' | 'document' | 'image' | 'unknown';
  url: string;
  title: string;
  size?: string;
  format?: string;
  downloadable: boolean;
}

const UnifiedContentViewer: React.FC<ContentViewerProps> = ({
  lecture,
  onDownload,
  enableDownload = true,
  className
}) => {
  const { toast } = useToast();
  const [activeContent, setActiveContent] = useState<string>('video');
  const [showPreview, setShowPreview] = useState(true);

  // Process lecture content into unified format
  const contentItems = useMemo((): ContentItem[] => {
    const items: ContentItem[] = [];

    // Add video content
    if (lecture.videoUrl || lecture.hlsUrl || lecture.videoResolutions?.length) {
      items.push({
        type: 'video',
        url: lecture.hlsUrl || lecture.videoUrl || lecture.videoResolutions?.[0]?.url || '',
        title: `${lecture.lectureTitle} - Video`,
        format: lecture.hlsUrl ? 'HLS' : 'MP4',
        downloadable: enableDownload && !!lecture.videoUrl
      });
    }

    // Add PDF content
    if (lecture.pdfUrl) {
      items.push({
        type: 'pdf',
        url: lecture.pdfUrl,
        title: `${lecture.lectureTitle} - Materials`,
        format: 'PDF',
        downloadable: enableDownload
      });
    }

    return items;
  }, [lecture, enableDownload]);

  // Note: getContentType function removed as it's not currently used
  // Can be re-added if needed for future content type detection

  // Handle download functionality
  const handleDownload = useCallback(async (item: ContentItem) => {
    if (!item.downloadable) {
      toast({
        title: "Download Not Available",
        description: "This content is not available for download.",
        variant: "destructive"
      });
      return;
    }

    try {
      if (onDownload) {
        onDownload(item.url, item.title);
      } else {
        // Default download behavior
        const link = document.createElement('a');
        link.href = item.url;
        link.download = item.title;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

      toast({
        title: "Download Started",
        description: `Downloading ${item.title}...`
      });

      Logger.info('Content download initiated', { 
        lectureId: lecture._id, 
        contentType: item.type,
        url: item.url 
      });
    } catch (error) {
      Logger.error('Download failed:', error);
      toast({
        title: "Download Failed",
        description: "Failed to download the content. Please try again.",
        variant: "destructive"
      });
    }
  }, [onDownload, toast, lecture._id]);

  // Render content based on type
  const renderContent = useCallback((item: ContentItem) => {
    switch (item.type) {
      case 'video':
        return (
          <CloudinaryVideoPlayer
            src={item.url}
            videoResolutions={lecture.videoResolutions}
            hlsUrl={lecture.hlsUrl}
            poster={lecture.thumbnailUrl}
            videoId={lecture._id}
            enableDownload={item.downloadable}
            enableAnalytics={true}
            autoRetry={true}
            maxRetries={3}
            className="w-full"
          />
        );

      case 'pdf':
        return (
          <div className="w-full h-96 border rounded-lg overflow-hidden bg-gray-50">
            {showPreview ? (
              <iframe
                src={`${item.url}#toolbar=1&navpanes=1&scrollbar=1`}
                className="w-full h-full"
                title={item.title}
                loading="lazy"
                onError={() => {
                  toast({
                    title: "PDF Load Error",
                    description: "Failed to load PDF. You can still download it.",
                    variant: "destructive"
                  });
                }}
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">PDF preview is disabled</p>
                  <Button onClick={() => setShowPreview(true)}>
                    <Eye className="h-4 w-4 mr-2" />
                    Show Preview
                  </Button>
                </div>
              </div>
            )}
          </div>
        );

      case 'document':
        return (
          <div className="w-full h-96 border rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center">
            <div className="text-center">
              <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">Document preview not available</p>
              <Button onClick={() => handleDownload(item)}>
                <Download className="h-4 w-4 mr-2" />
                Download to View
              </Button>
            </div>
          </div>
        );

      case 'image':
        return (
          <div className="w-full max-h-96 border rounded-lg overflow-hidden bg-gray-50">
            <img
              src={item.url}
              alt={item.title}
              className="w-full h-auto object-contain"
              loading="lazy"
              onError={() => {
                toast({
                  title: "Image Load Error",
                  description: "Failed to load image.",
                  variant: "destructive"
                });
              }}
            />
          </div>
        );

      default:
        return (
          <div className="w-full h-96 border rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center">
            <div className="text-center">
              <AlertTriangle className="h-16 w-16 text-amber-500 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">Unsupported content type</p>
              <Button onClick={() => handleDownload(item)}>
                <ExternalLink className="h-4 w-4 mr-2" />
                Open in New Tab
              </Button>
            </div>
          </div>
        );
    }
  }, [lecture, showPreview, toast, handleDownload]);

  // Get icon for content type
  const getContentIcon = useCallback((type: ContentItem['type']) => {
    switch (type) {
      case 'video':
        return <Video className="h-4 w-4" />;
      case 'pdf':
        return <FileText className="h-4 w-4" />;
      case 'document':
        return <FileText className="h-4 w-4" />;
      case 'image':
        return <Image className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  }, []);

  if (contentItems.length === 0) {
    return (
      <Card className={cn("w-full", className)}>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertTriangle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No content available for this lecture</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const activeItem = contentItems.find(item => 
    item.type === activeContent || 
    (activeContent === 'video' && item.type === 'video') ||
    (activeContent === 'pdf' && item.type === 'pdf')
  ) || contentItems[0];

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Lecture Content</CardTitle>
          
          <div className="flex items-center gap-2">
            {/* Content type tabs */}
            {contentItems.length > 1 && (
              <div className="flex bg-gray-100 rounded-lg p-1">
                {contentItems.map((item) => (
                  <Button
                    key={item.type}
                    variant={activeContent === item.type ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setActiveContent(item.type)}
                    className="gap-2"
                  >
                    {getContentIcon(item.type)}
                    <span className="capitalize">{item.type}</span>
                  </Button>
                ))}
              </div>
            )}

            {/* Content controls */}
            <div className="flex items-center gap-1">
              {activeItem.type === 'pdf' && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowPreview(!showPreview)}
                  title={showPreview ? "Hide preview" : "Show preview"}
                >
                  {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              )}
              
              {activeItem.downloadable && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDownload(activeItem)}
                  title="Download content"
                >
                  <Download className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Content metadata */}
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Badge variant="secondary" className="gap-1">
            {getContentIcon(activeItem.type)}
            {activeItem.format}
          </Badge>
          
          {activeItem.size && (
            <Badge variant="outline">{activeItem.size}</Badge>
          )}
          
          {activeItem.downloadable && (
            <Badge variant="outline" className="text-green-600 border-green-200">
              Downloadable
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent>
        <div className="transition-all duration-300">
          {renderContent(activeItem)}
        </div>
      </CardContent>
    </Card>
  );
};

export default UnifiedContentViewer;
