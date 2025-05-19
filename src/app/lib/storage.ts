import { createClient } from '@/app/utils/supabase/client';

/**
 * Delete a file from Supabase storage
 * @param filePath The path of the file to delete
 * @param bucket The storage bucket name
 * @returns Promise resolving to a boolean indicating success or failure
 */
export async function deleteFileFromStorage(filePath: string, bucket: string): Promise<boolean> {
  try {
    const supabase = createClient();
    const { error } = await supabase.storage.from(bucket).remove([filePath]);
    
    if (error) {
      console.error('Error deleting file from storage:', error);
      return false;
    }
    
    return true;
  } catch (err) {
    console.error('Unexpected error deleting file:', err);
    return false;
  }
} 