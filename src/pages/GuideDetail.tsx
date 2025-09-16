import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, ArrowLeft, BookOpen } from "lucide-react";
import ReactMarkdown from "react-markdown";
import ArticleSchema from "@/components/ArticleSchema";

interface Post {
  id: string;
  title: string;
  slug: string;
  category: string | null;
  cover_url: string | null;
  published_at: string | null;
  content_md: string | null;
}

export default function GuideDetail() {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (slug) {
      fetchGuide(slug);
    }
  }, [slug]);

  const fetchGuide = async (slug: string) => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('slug', slug)
        .eq('type', 'guide')
        .eq('status', 'published')
        .single();

      if (error) {
        console.error('Error fetching guide:', error);
        setNotFound(true);
      } else {
        setPost(data);
      }
    } catch (error: any) {
      console.error('Error fetching guide:', error.message);
      setNotFound(true);
    }
    setLoading(false);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Unknown date';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  if (notFound || !post) {
    return (
      <div className="min-h-screen">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-secondary/50 rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-8 h-8 text-text-muted" />
            </div>
            <h1 className="text-2xl font-bold text-text-primary mb-2">Guide Not Found</h1>
            <p className="text-text-muted mb-6">The guide you're looking for doesn't exist.</p>
            <Button asChild variant="outline">
              <Link to="/guides">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Guides
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <ArticleSchema
        title={post.title}
        datePublished={post.published_at}
        category={post.category}
        coverImage={post.cover_url}
        url={`${window.location.origin}/guides/${post.slug}`}
      />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Back button */}
        <div className="mb-6">
          <Button variant="ghost" asChild>
            <Link to="/guides">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Guides
            </Link>
          </Button>
        </div>

        {/* Guide header */}
        <div className="mb-8">
          {post.cover_url && (
            <div className="aspect-video w-full overflow-hidden rounded-2xl mb-6">
              <img 
                src={post.cover_url} 
                alt={post.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          
          <div className="flex items-center gap-4 mb-4">
            {post.category && (
              <Badge variant="esports" className="text-sm">
                {post.category}
              </Badge>
            )}
            <div className="flex items-center gap-2 text-text-muted">
              <Calendar className="w-4 h-4" />
              <span>{formatDate(post.published_at)}</span>
            </div>
          </div>
          
          <h1 className="text-4xl font-bold text-text-primary mb-4">
            {post.title}
          </h1>
        </div>

        {/* Guide content */}
        <Card className="esports-card">
          <CardContent className="p-8">
            <div className="prose prose-invert max-w-none">
              <ReactMarkdown 
                components={{
                  h1: ({ children }) => <h1 className="text-3xl font-bold text-text-primary mb-4">{children}</h1>,
                  h2: ({ children }) => <h2 className="text-2xl font-semibold text-text-primary mb-3 mt-6">{children}</h2>,
                  h3: ({ children }) => <h3 className="text-xl font-semibold text-text-primary mb-2 mt-4">{children}</h3>,
                  p: ({ children }) => <p className="text-text-primary leading-relaxed mb-4">{children}</p>,
                  ul: ({ children }) => <ul className="list-disc list-inside text-text-primary mb-4 space-y-1">{children}</ul>,
                  ol: ({ children }) => <ol className="list-decimal list-inside text-text-primary mb-4 space-y-1">{children}</ol>,
                  li: ({ children }) => <li className="text-text-primary">{children}</li>,
                  strong: ({ children }) => <strong className="font-semibold text-text-primary">{children}</strong>
                }}
              >
                {post.content_md || 'No content available.'}
              </ReactMarkdown>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}