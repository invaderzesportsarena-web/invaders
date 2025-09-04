import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { removeBackground, loadImage } from '@/utils/backgroundRemoval';
import { Upload, Download, Loader2 } from 'lucide-react';

interface BackgroundRemoverProps {
  onImageProcessed?: (processedImageUrl: string) => void;
}

export const BackgroundRemover: React.FC<BackgroundRemoverProps> = ({ onImageProcessed }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const { toast } = useToast();

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Error",
        description: "Please select a valid image file",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    try {
      // Show original image
      const originalUrl = URL.createObjectURL(file);
      setOriginalImage(originalUrl);

      // Load and process the image
      const imageElement = await loadImage(file);
      const processedBlob = await removeBackground(imageElement);
      
      // Create URL for processed image
      const processedUrl = URL.createObjectURL(processedBlob);
      setProcessedImage(processedUrl);
      
      if (onImageProcessed) {
        onImageProcessed(processedUrl);
      }

      toast({
        title: "Success",
        description: "Background removed successfully!",
      });
    } catch (error) {
      console.error('Error processing image:', error);
      toast({
        title: "Error",
        description: "Failed to remove background. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadProcessedImage = () => {
    if (!processedImage) return;
    
    const link = document.createElement('a');
    link.href = processedImage;
    link.download = 'processed-image.png';
    link.click();
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-text-primary mb-2">
          Background Remover
        </h2>
        <p className="text-text-secondary">
          Remove black backgrounds from your images using AI
        </p>
      </div>

      {/* Upload Section */}
      <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
        <input
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          disabled={isProcessing}
          className="hidden"
          id="image-upload"
        />
        <label
          htmlFor="image-upload"
          className={`cursor-pointer flex flex-col items-center space-y-4 ${
            isProcessing ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {isProcessing ? (
            <Loader2 className="w-12 h-12 text-primary animate-spin" />
          ) : (
            <Upload className="w-12 h-12 text-primary" />
          )}
          <div>
            <p className="text-lg font-medium text-text-primary">
              {isProcessing ? 'Processing...' : 'Click to upload image'}
            </p>
            <p className="text-sm text-text-secondary">
              PNG, JPG, GIF up to 10MB
            </p>
          </div>
        </label>
      </div>

      {/* Image Preview Section */}
      {(originalImage || processedImage) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {originalImage && (
            <div>
              <h3 className="text-lg font-semibold text-text-primary mb-2">Original</h3>
              <div className="border border-border rounded-lg overflow-hidden">
                <img
                  src={originalImage}
                  alt="Original"
                  className="w-full h-auto max-h-64 object-contain"
                />
              </div>
            </div>
          )}

          {processedImage && (
            <div>
              <h3 className="text-lg font-semibold text-text-primary mb-2">Processed</h3>
              <div className="border border-border rounded-lg overflow-hidden bg-gray-100">
                <img
                  src={processedImage}
                  alt="Processed"
                  className="w-full h-auto max-h-64 object-contain"
                />
              </div>
              <Button
                onClick={downloadProcessedImage}
                className="mt-2 w-full"
                variant="outline"
              >
                <Download className="w-4 h-4 mr-2" />
                Download Processed Image
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};