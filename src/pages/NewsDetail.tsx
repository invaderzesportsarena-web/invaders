import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, ArrowLeft } from "lucide-react";
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

export default function NewsDetail() {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (slug) {
      fetchNewsArticle();
    }
  }, [slug]);

  const fetchNewsArticle = async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('type', 'news')
        .eq('status', 'published')
        .eq('slug', slug)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          setNotFound(true);
        } else {
          throw error;
        }
      } else {
        setPost(data);
      }
    } catch (error: any) {
      console.error('Error fetching news article:', error.message);
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
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (notFound || !post) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-text-primary mb-4">Article Not Found</h1>
          <p className="text-text-muted mb-6">The news article you're looking for doesn't exist or has been removed.</p>
          <Link to="/news">
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to News
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <ArticleSchema
        title={post.title}
        datePublished={post.published_at}
        category={post.category}
        coverImage={post.cover_url}
        url={`${window.location.origin}/news/${post.slug}`}
      />
      
      <div className="mb-6">
        <Link to="/news">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to News
          </Button>
        </Link>
      </div>

      <article className="max-w-4xl mx-auto">
        {post.cover_url && (
          <div className="aspect-video overflow-hidden rounded-2xl mb-8">
            <img 
              src={post.cover_url} 
              alt={post.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <header className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            {post.category && (
              <Badge variant="esports">
                {post.category}
              </Badge>
            )}
            <div className="flex items-center gap-1 text-text-muted">
              <Calendar className="w-4 h-4" />
              <span>{formatDate(post.published_at)}</span>
            </div>
          </div>
          
          <h1 className="text-4xl font-bold text-text-primary leading-tight">
            {post.title}
          </h1>
        </header>

        <Card className="esports-card">
          <CardContent className="p-8">
            {post.content_md ? (
              <div className="prose prose-lg max-w-none text-text-primary">
                <ReactMarkdown>{post.content_md}</ReactMarkdown>
              </div>
            ) : (
              <p className="text-text-muted">No content available for this article.</p>
            )}
          </CardContent>
        </Card>
      </article>
    </div>
  );
}