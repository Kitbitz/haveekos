import React, { useState, useRef } from 'react';
import { Upload, X, Loader } from 'lucide-react';
import { storage } from '../lib/firebase';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import Resizer from 'react-image-file-resizer';

interface ImageUploadProps {
  imageUrl: string | null | undefined;
  onImageUpload: (url: string) => void;
  onImageDelete: () => void;
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

const ImageUpload: React.FC<ImageUploadProps> = ({ 
  imageUrl, 
  onImageUpload, 
  onImageDelete, 
  size = 'medium',
  className = ''
}) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const dimensions = {
    small: { width: 80, height: 80 },
    medium: { width: 128, height: 128 },
    large: { width: 256, height: 256 }
  };

  const { width, height } = dimensions[size];

  const resizeImage = (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      Resizer.imageFileResizer(
        file,
        800, // max width
        800, // max height
        'JPEG',
        80, // quality
        0, // rotation
        (blob) => {
          if (blob instanceof Blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to resize image'));
          }
        },
        'blob'
      );
    });
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Reset input value to allow uploading the same file again
    event.target.value = '';

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image size should be less than 5MB');
      return;
    }

    try {
      setUploading(true);
      setError(null);
      setUploadProgress(0);

      // Resize image before upload
      const resizedImage = await resizeImage(file);

      // Create a unique filename
      const timestamp = Date.now();
      const filename = `menu_images/${timestamp}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
      const storageRef = ref(storage, filename);

      // Upload with progress tracking
      const uploadTask = uploadBytesResumable(storageRef, resizedImage);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(Math.round(progress));
        },
        (error) => {
          console.error('Upload error:', error);
          setError('Failed to upload image. Please try again.');
          setUploading(false);
        },
        async () => {
          try {
            const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
            onImageUpload(downloadUrl);
            setError(null);
          } catch (error) {
            console.error('Failed to get download URL:', error);
            setError('Failed to complete upload. Please try again.');
          } finally {
            setUploading(false);
            setUploadProgress(0);
          }
        }
      );
    } catch (error) {
      console.error('Image processing error:', error);
      setError('Failed to process image. Please try again.');
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDelete = async () => {
    if (!imageUrl) return;

    try {
      // Get the full path from the URL
      const imageRef = ref(storage, getImagePathFromUrl(imageUrl));
      await deleteObject(imageRef);
      onImageDelete();
      setError(null);
    } catch (error) {
      console.error('Delete error:', error);
      // Call onImageDelete even if storage deletion fails to maintain UI consistency
      onImageDelete();
      setError('Failed to delete image from storage, but removed from menu item.');
    }
  };

  // Helper function to extract the path from Firebase Storage URL
  const getImagePathFromUrl = (url: string): string => {
    try {
      const baseUrl = 'https://firebasestorage.googleapis.com/v0/b/';
      const startIndex = url.indexOf(baseUrl) + baseUrl.length;
      const endIndex = url.indexOf('?');
      const fullPath = url.substring(startIndex, endIndex);
      const pathParts = fullPath.split('/o/');
      if (pathParts.length < 2) throw new Error('Invalid URL format');
      return decodeURIComponent(pathParts[1]);
    } catch (error) {
      console.error('Error parsing image URL:', error);
      throw new Error('Invalid image URL format');
    }
  };

  return (
    <div className={`relative ${className}`}>
      {error && (
        <div className="absolute -top-8 left-0 right-0 bg-red-100 text-red-600 px-2 py-1 rounded text-xs">
          {error}
        </div>
      )}

      {imageUrl ? (
        <div className="relative group">
          <img
            src={imageUrl}
            alt="Menu item"
            className={`object-cover rounded-lg ${
              size === 'small' ? 'w-20 h-20' :
              size === 'large' ? 'w-64 h-64' :
              'w-32 h-32'
            }`}
            style={{ width, height }}
            loading="lazy"
          />
          <button
            onClick={handleDelete}
            className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            title="Remove image"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      ) : (
        <div 
          className={`border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 transition-colors bg-gray-50`}
          onClick={() => fileInputRef.current?.click()}
          style={{ width, height }}
        >
          {uploading ? (
            <div className="text-center">
              <Loader className="w-5 h-5 animate-spin text-blue-500 mx-auto mb-1" />
              <div className="w-12 h-1 bg-gray-200 rounded-full mx-auto">
                <div 
                  className="h-full bg-blue-500 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <span className="text-xs text-gray-500">{uploadProgress}%</span>
            </div>
          ) : (
            <>
              <Upload className="w-5 h-5 text-gray-400 mb-1" />
              <span className="text-xs text-gray-500">Upload</span>
            </>
          )}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
};

export default ImageUpload;