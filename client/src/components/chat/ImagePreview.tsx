import React, { useState } from 'react';
import { Dialog, DialogContent } from '../ui/dialog';

interface ImagePreviewProps {
  isOpen: boolean;
  onClose: () => void;
  imageSrc: string;
  imageAlt: string;
}

const ImagePreview: React.FC<ImagePreviewProps> = ({
  isOpen,
  onClose,
  imageSrc,
  imageAlt,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Reset state when dialog opens
  React.useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      setHasError(false);
    }
  }, [isOpen]);

  // Handle keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  const handleImageLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  const handleImageError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = imageSrc;
    link.download = imageAlt || 'image';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden bg-black border-none">
        <div className="relative flex items-center justify-center min-h-[60vh]">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-20 p-3 bg-white/10 backdrop-blur-sm text-white rounded-full hover:bg-white/20 transition-all duration-200"
            title="Close (ESC)"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>

          {/* Download Button */}
          <button
            onClick={handleDownload}
            className="absolute top-4 right-20 z-20 p-3 bg-white/10 backdrop-blur-sm text-white rounded-full hover:bg-white/20 transition-all duration-200"
            title="Download image"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 10v6m0 0l-3-3m3 3l3-3"
              />
            </svg>
          </button>

          {/* Loading Spinner */}
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
            </div>
          )}

          {/* Error State */}
          {hasError && (
            <div className="absolute inset-0 flex items-center justify-center text-white">
              <div className="text-center">
                <svg
                  className="w-16 h-16 mx-auto mb-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
                <p className="text-lg">Failed to load image</p>
                <p className="text-sm text-gray-400 mt-2">
                  The image could not be displayed
                </p>
              </div>
            </div>
          )}

          {/* Image */}
          <img
            src={imageSrc}
            alt={imageAlt}
            className={`max-w-full max-h-[85vh] object-contain transition-opacity duration-300 ${
              isLoading ? 'opacity-0' : 'opacity-100'
            }`}
            onLoad={handleImageLoad}
            onError={handleImageError}
            style={{ display: hasError ? 'none' : 'block' }}
          />

          {/* Image Info */}
          {!isLoading && !hasError && (
            <div className="absolute bottom-4 left-4 bg-white/10 backdrop-blur-sm text-white px-3 py-2 rounded-lg text-sm">
              {imageAlt}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImagePreview;
