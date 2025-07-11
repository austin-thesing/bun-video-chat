import React, { useState, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useWebSocket } from '../../contexts/WebSocketContext';
import { Button } from '../ui/button';

interface FileUploadProps {
  roomId: number;
  onUploadComplete?: () => void;
}

const FileUpload: React.FC<FileUploadProps> = ({
  roomId,
  onUploadComplete,
}) => {
  const { user } = useAuth();
  const { send } = useWebSocket();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList) => {
    if (!files.length || !user) return;

    const file = files[0];

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      alert('File too large (max 10MB)');
      return;
    }

    // Validate file type
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];

    if (!allowedTypes.includes(file.type)) {
      alert('File type not allowed');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('room_id', roomId.toString());

      // Create XMLHttpRequest for progress tracking
      const xhr = new XMLHttpRequest();
      
      // Set up progress handler
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percentComplete = (event.loaded / event.total) * 100;
          setUploadProgress(percentComplete);
        }
      };

      // Create promise for the upload
      const uploadPromise = new Promise((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const response = JSON.parse(xhr.responseText);
              resolve(response);
            } catch (e) {
              reject(new Error('Invalid response format'));
            }
          } else {
            reject(new Error(xhr.responseText || 'Upload failed'));
          }
        };
        
        xhr.onerror = () => reject(new Error('Network error'));
        
        xhr.open('POST', '/api/upload');
        xhr.setRequestHeader('credentials', 'include');
        xhr.withCredentials = true;
        xhr.send(formData);
      });

      const message = await uploadPromise;

      // The API already creates and broadcasts the message via WebSocket
      // No need to send another WebSocket message here

      onUploadComplete?.();
    } catch (error) {
      console.error('Upload failed:', error);
      alert(`Upload failed: ${error.message}`);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  return (
    <div className="relative">
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileInputChange}
        className="hidden"
        accept="image/*,.pdf,.txt,.doc,.docx,.xls,.xlsx"
      />

      <Button
        type="button"
        onClick={handleFileSelect}
        disabled={isUploading}
        size="sm"
        variant="outline"
        className="px-3"
      >
        {isUploading ? (
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
            <span className="text-xs">{Math.round(uploadProgress)}%</span>
          </div>
        ) : (
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
            />
          </svg>
        )}
      </Button>

      {/* Drag and drop overlay */}
      {dragActive && (
        <div
          className="fixed inset-0 bg-blue-500/20 border-2 border-dashed border-blue-500 flex items-center justify-center z-50"
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
            <div className="text-center">
              <svg
                className="w-12 h-12 mx-auto mb-4 text-blue-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              <p className="text-lg font-medium">Drop file here to upload</p>
              <p className="text-sm text-gray-500">
                Max 10MB • Images, PDFs, Documents
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Upload Progress Bar */}
      {isUploading && (
        <div className="fixed bottom-0 left-0 right-0 z-30 bg-background/95 backdrop-blur-sm border-t p-4">
          <div className="max-w-md mx-auto">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="font-medium">Uploading...</span>
                  <span className="text-muted-foreground">{Math.round(uploadProgress)}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
