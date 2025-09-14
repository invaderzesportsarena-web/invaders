import { supabase } from "@/integrations/supabase/client";
import { SUPABASE_CONFIG } from "@/config/supabase";

/**
 * Storage utilities for handling file uploads and bucket management
 */

export class StorageManager {
  private static bucketExists = new Map<string, boolean>();

  /**
   * Ensures the wallet proofs bucket exists, creates it if needed
   */
  static async ensureBucketExists(bucketName: string = SUPABASE_CONFIG.storage.buckets.WALLET_PROOFS): Promise<string> {
    // Check cache first
    if (this.bucketExists.get(bucketName)) {
      return bucketName;
    }

    try {
      // Check if bucket exists
      const { data: buckets, error } = await supabase.storage.listBuckets();
      if (error) throw error;

      const bucketExists = buckets?.some(bucket => bucket.name === bucketName);
      
      if (bucketExists) {
        this.bucketExists.set(bucketName, true);
        return bucketName;
      }

      // Try to create the bucket
      const { error: createError } = await supabase.storage.createBucket(bucketName, {
        public: false,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
        fileSizeLimit: 5 * 1024 * 1024, // 5MB
      });

      if (createError) {
        console.warn(`Failed to create bucket ${bucketName}:`, createError);
        // Fall back to existing bucket
        const fallbackBucket = SUPABASE_CONFIG.storage.buckets.FALLBACK_BUCKET;
        console.warn(`Falling back to bucket: ${fallbackBucket}`);
        this.bucketExists.set(fallbackBucket, true);
        return fallbackBucket;
      }

      this.bucketExists.set(bucketName, true);
      return bucketName;
    } catch (error) {
      console.error('Error managing storage bucket:', error);
      // Use fallback bucket
      const fallbackBucket = SUPABASE_CONFIG.storage.buckets.FALLBACK_BUCKET;
      console.warn(`Using fallback bucket: ${fallbackBucket}`);
      return fallbackBucket;
    }
  }

  /**
   * Upload a file to the specified bucket with proper error handling
   */
  static async uploadFile(
    file: File, 
    userId: string, 
    requestId: string, 
    bucketName?: string
  ): Promise<{ url: string; error?: string }> {
    try {
      const actualBucket = await this.ensureBucketExists(bucketName);
      const fileName = `${userId}/${requestId}/${Date.now()}-${file.name}`;

      const { error: uploadError } = await supabase.storage
        .from(actualBucket)
        .upload(fileName, file);

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      // For private buckets like wallet_proofs, use signed URLs
      if (actualBucket === SUPABASE_CONFIG.storage.buckets.WALLET_PROOFS) {
        const { data, error: signedError } = await supabase.storage
          .from(actualBucket)
          .createSignedUrl(fileName, 60 * 60 * 24 * 7); // 7 days expiry

        if (signedError) {
          throw new Error(`Failed to create signed URL: ${signedError.message}`);
        }

        return { url: data?.signedUrl || '' };
      } else {
        // For public buckets, use public URL
        const { data: { publicUrl } } = supabase.storage
          .from(actualBucket)
          .getPublicUrl(fileName);

        return { url: publicUrl };
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      return { 
        url: '', 
        error: error.message || 'Upload failed. Please try again.' 
      };
    }
  }

  /**
   * Get a signed URL for private files
   */
  static async getSignedUrl(bucketName: string, fileName: string, expiresIn: number = 3600): Promise<string | null> {
    try {
      const { data, error } = await supabase.storage
        .from(bucketName)
        .createSignedUrl(fileName, expiresIn);

      if (error) throw error;
      return data?.signedUrl || null;
    } catch (error) {
      console.error('Error getting signed URL:', error);
      return null;
    }
  }
}