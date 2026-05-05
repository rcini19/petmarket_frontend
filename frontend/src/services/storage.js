import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY;
const PET_IMAGES_BUCKET = process.env.REACT_APP_SUPABASE_PET_IMAGES_BUCKET || 'pet-images';

let supabaseClient;

export const isStorageConfigured = () => {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
};

const ensureClient = () => {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('Supabase is not configured. Set REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY.');
  }

  if (!supabaseClient) {
    supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }

  return supabaseClient;
};

const sanitizeFileName = (name) => {
  const baseName = (name || 'pet-image').toLowerCase();
  return baseName
    .replace(/[^a-z0-9._-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
};

export const uploadPetImage = async (file, ownerId = 'guest') => {
  if (!file) {
    throw new Error('Image file is required.');
  }

  const client = ensureClient();
  const sanitizedName = sanitizeFileName(file.name);
  const objectPath = `pets/${ownerId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${sanitizedName}`;

  const { error: uploadError } = await client.storage
    .from(PET_IMAGES_BUCKET)
    .upload(objectPath, file, {
      upsert: false,
      contentType: file.type || undefined,
      cacheControl: '3600',
    });

  if (uploadError) {
    throw new Error(uploadError.message || 'Failed to upload image.');
  }

  const { data } = client.storage.from(PET_IMAGES_BUCKET).getPublicUrl(objectPath);
  return data.publicUrl;
};
