import { useEffect } from 'react';

interface ArticleSchemaProps {
  title: string;
  description?: string;
  datePublished: string | null;
  dateModified?: string | null;
  category?: string | null;
  coverImage?: string | null;
  url: string;
}

export default function ArticleSchema({
  title,
  description,
  datePublished,
  dateModified,
  category,
  coverImage,
  url
}: ArticleSchemaProps) {
  useEffect(() => {
    // Generate article description from title if not provided
    const articleDescription = description || `Read our comprehensive ${category ? category.toLowerCase() + ' ' : ''}article: ${title}. Expert insights and guides from InvaderZ Esports Arena.`;

    // Create the JSON-LD schema
    const schema = {
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": title,
      "description": articleDescription,
      "datePublished": datePublished,
      "dateModified": dateModified || datePublished,
      "author": {
        "@type": "Organization",
        "name": "InvaderZ Esports Arena"
      },
      "publisher": {
        "@type": "Organization",
        "name": "InvaderZ Esports Arena",
        "logo": {
          "@type": "ImageObject",
          "url": "https://qbiwmbpfgcforgolqeri.supabase.co/storage/v1/object/public/covers/invaderz-logo.png"
        }
      },
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": url
      },
      ...(coverImage && {
        "image": {
          "@type": "ImageObject",
          "url": coverImage
        }
      }),
      ...(category && {
        "articleSection": category
      })
    };

    // Remove existing schema if any
    const existingSchema = document.querySelector('script[type="application/ld+json"][data-article-schema]');
    if (existingSchema) {
      existingSchema.remove();
    }

    // Add new schema to head
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.setAttribute('data-article-schema', 'true');
    script.textContent = JSON.stringify(schema);
    document.head.appendChild(script);

    // Cleanup on component unmount
    return () => {
      const schemaToRemove = document.querySelector('script[type="application/ld+json"][data-article-schema]');
      if (schemaToRemove) {
        schemaToRemove.remove();
      }
    };
  }, [title, description, datePublished, dateModified, category, coverImage, url]);

  return null;
}