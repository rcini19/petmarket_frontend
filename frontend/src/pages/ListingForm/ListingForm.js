import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import AppLayout from '../../components/AppLayout/AppLayout';
import { createPet, getPetById, updatePet } from '../../services/api';
import { uploadPetImage, isStorageConfigured } from '../../services/storage';
import { getStoredUser } from '../../utils/auth';
import './ListingForm.css';

const initialForm = {
  name: '',
  species: '',
  breed: '',
  age: 0,
  description: '',
  imageUrl: '',
  listingType: 'SALE',
  price: '',
};

function ListingForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = useMemo(() => Boolean(id), [id]);
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');

  useEffect(() => {
    if (!imageFile) {
      setPreviewUrl('');
      return;
    }

    const objectUrl = URL.createObjectURL(imageFile);
    setPreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [imageFile]);

  useEffect(() => {
    if (!isEdit) {
      return;
    }

    const load = async () => {
      try {
        const response = await getPetById(id);
        const pet = response.data;
        setForm({
          name: pet.name,
          species: pet.species,
          breed: pet.breed,
          age: pet.age,
          description: pet.description || '',
          imageUrl: pet.imageUrl || '',
          listingType: pet.listingType,
          price: pet.price || '',
        });
      } catch {
        setError('Unable to load listing data.');
      }
    };

    load();
  }, [id, isEdit]);

  const setField = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const onImageChange = (event) => {
    const nextFile = event.target.files?.[0] || null;

    if (!nextFile) {
      setImageFile(null);
      return;
    }

    if (!String(nextFile.type || '').toLowerCase().startsWith('image/')) {
      setError('Please select a valid image file (JPEG, PNG, WEBP, etc).');
      setImageFile(null);
      event.target.value = '';
      return;
    }

    if (nextFile.size > 10 * 1024 * 1024) {
      setError('Image must be 10MB or smaller.');
      setImageFile(null);
      event.target.value = '';
      return;
    }

    setError('');
    setImageFile(nextFile);
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');

    // Validate price for SALE or BOTH listings
    if (form.listingType !== 'TRADE') {
      const priceValue = Number(form.price || 0);
      if (priceValue <= 0) {
        setError('Price is required and must be greater than 0 for Sale listings.');
        setSaving(false);
        return;
      }
    }

    try {
      let imageUrl = form.imageUrl || '';

      // Try to upload image if one is selected and storage is configured
      if (imageFile) {
        if (isStorageConfigured()) {
          try {
            const user = getStoredUser();
            imageUrl = await uploadPetImage(imageFile, user?.email || user?.id || 'guest');
          } catch (uploadErr) {
            // Image upload failed, but continue without image
            console.warn('Image upload failed:', uploadErr.message);
            setError('Image upload failed. Creating listing without image.');
            imageUrl = '';
          }
        } else {
          // Storage not configured, continue without image
          console.warn('Supabase storage not configured, skipping image upload');
        }
      }

      const payload = {
        ...form,
        imageUrl,
        age: Number(form.age || 0),
        price: form.listingType === 'TRADE' ? null : Number(form.price || 0),
      };

      console.log('Creating pet with payload:', payload);

      if (isEdit) {
        const response = await updatePet(id, payload);
        console.log('Update response:', response.data);
      } else {
        const response = await createPet(payload);
        console.log('Create response:', response.data);
      }
      navigate('/my-pets');
    } catch (err) {
      console.error('Error saving listing:', err);
      const errorMsg = err?.response?.data?.error || err?.response?.data?.message || err?.message || 'Unable to save listing.';
      setError(errorMsg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppLayout>
      <section className="market-page" style={{ maxWidth: 760, margin: '0 auto' }}>
        <Link to="/my-pets" style={{ display: 'inline-flex', gap: 6, alignItems: 'center', color: '#6b7280', textDecoration: 'none', marginBottom: 10 }}>
          <ArrowLeft size={14} />
          <span>Cancel</span>
        </Link>

        <div className="market-header">
          <h1>{isEdit ? 'Edit Listing' : 'Create Listing'}</h1>
          <p>{isEdit ? 'Update your pet listing details' : 'List your pet on the marketplace'}</p>
        </div>

        {error && <div className="panel-card" style={{ padding: 12, borderColor: '#fecaca', color: '#b91c1c', marginBottom: 10 }}>{error}</div>}

        <form onSubmit={onSubmit}>
          <div className="panel-card" style={{ padding: 16, marginBottom: 12 }}>
            <h2 style={{ margin: '0 0 10px', fontSize: 22 }}>Pet Information</h2>
            <div className="form-grid" style={{ display: 'grid', gap: 10 }}>
              <label>Name</label>
              <input value={form.name} onChange={(event) => setField('name', event.target.value)} placeholder="Pet name" required />

              <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
                <div>
                  <label>Species</label>
                  <input value={form.species} onChange={(event) => setField('species', event.target.value)} required />
                </div>
                <div>
                  <label>Breed</label>
                  <input value={form.breed} onChange={(event) => setField('breed', event.target.value)} required />
                </div>
              </div>

              <label>Age (years)</label>
              <input type="number" value={form.age} onChange={(event) => setField('age', event.target.value)} min={0} />

              <label>Pet Image</label>
              <input type="file" accept="image/*" onChange={onImageChange} />
              {(previewUrl || form.imageUrl) && (
                <img
                  src={previewUrl || form.imageUrl}
                  alt="Pet preview"
                  style={{ width: '100%', maxHeight: 260, objectFit: 'cover', borderRadius: 10, border: '1px solid #d1d5db' }}
                />
              )}

              <label>Description</label>
              <textarea
                value={form.description}
                onChange={(event) => setField('description', event.target.value)}
                placeholder="Describe your pet's personality, health, and any relevant info..."
              />
            </div>
          </div>

          <div className="panel-card" style={{ padding: 16, marginBottom: 12 }}>
            <h2 style={{ margin: '0 0 10px', fontSize: 22 }}>Listing Type</h2>
            <div style={{ display: 'grid', gap: 10 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8 }}>
                {['SALE', 'TRADE', 'BOTH'].map((type) => (
                  <button
                    key={type}
                    type="button"
                    className={form.listingType === type ? 'btn-primary' : 'btn-secondary'}
                    onClick={() => setField('listingType', type)}
                  >
                    {type === 'SALE' ? 'For Sale' : type === 'TRADE' ? 'For Trade' : 'Sale & Trade'}
                  </button>
                ))}
              </div>

              <label>Price (USD) {form.listingType !== 'TRADE' && <span style={{ color: '#ef4444' }}>*</span>}</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={form.price}
                onChange={(event) => setField('price', event.target.value)}
                disabled={form.listingType === 'TRADE'}
                required={form.listingType !== 'TRADE'}
                placeholder="0.00"
              />
            </div>
          </div>

          <div style={{ display: 'grid', gap: 8, gridTemplateColumns: '1fr 1fr' }}>
            <Link className="btn-secondary" to="/my-pets" style={{ textDecoration: 'none', textAlign: 'center' }}>Cancel</Link>
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving...' : isEdit ? 'Update Listing' : 'Create Listing'}</button>
          </div>
        </form>
      </section>
    </AppLayout>
  );
}

export default ListingForm;
