import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { deletePet, getMyPets } from '../../services/api';
import AppLayout from '../../components/AppLayout/AppLayout';
import './MyPets.css';

function MyPets() {
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await getMyPets();
      setPets(response.data || []);
    } catch (err) {
      setError('Failed to load your pets. Please try again.');
      setPets([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const totals = useMemo(() => {
    const total = pets.length;
    const sale = pets.filter((pet) => pet.listingType === 'SALE' || pet.listingType === 'BOTH').length;
    const trade = pets.filter((pet) => pet.listingType === 'TRADE' || pet.listingType === 'BOTH').length;
    return { total, sale, trade };
  }, [pets]);

  const onDelete = async (petId) => {
    try {
      await deletePet(petId);
      load();
    } catch {
      // noop
    }
  };

  const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=900';

  const handleImageError = (e) => {
    e.target.onerror = null;
    e.target.src = DEFAULT_IMAGE;
  };

  return (
    <AppLayout>
      <section className="market-page">
        <div className="market-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1>My Pets</h1>
            <p>Manage your active listings</p>
          </div>
          <Link className="btn-primary" to="/pets/new" style={{ textDecoration: 'none' }}>+ New Listing</Link>
        </div>

        <div className="stat-row" style={{ marginBottom: 12 }}>
          <div className="panel-card stat-box"><div><div className="stat-value">{totals.total}</div><div className="stat-label">Total</div></div></div>
          <div className="panel-card stat-box"><div><div className="stat-value">{totals.sale}</div><div className="stat-label">For Sale</div></div></div>
          <div className="panel-card stat-box"><div><div className="stat-value">{totals.trade}</div><div className="stat-label">For Trade</div></div></div>
        </div>

        {error && (
          <div className="panel-card" style={{ padding: 12, borderColor: '#fecaca', color: '#b91c1c', marginBottom: 10 }}>
            {error}
            <button onClick={load} style={{ marginLeft: 10, padding: '4px 8px', cursor: 'pointer' }}>Retry</button>
          </div>
        )}

        {loading ? (
          <div className="panel-card" style={{ padding: 24, textAlign: 'center', color: '#6b7280' }}>
            Loading your pets...
          </div>
        ) : pets.length === 0 ? (
          <div className="panel-card" style={{ padding: 24, textAlign: 'center', color: '#6b7280' }}>
            You don't have any active listings yet. <Link to="/pets/new" style={{ color: '#2563eb' }}>Create your first listing</Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 10 }}>
            {pets.map((pet) => (
            <div key={pet.id} className="panel-card" style={{ display: 'grid', gridTemplateColumns: '86px 1fr auto auto', gap: 12, padding: 10, alignItems: 'center' }}>
              <img
                src={pet.imageUrl || DEFAULT_IMAGE}
                alt={pet.name}
                style={{ width: 86, height: 86, objectFit: 'cover', borderRadius: 8 }}
                onError={handleImageError}
              />
              <div>
                <h3 style={{ margin: 0, fontSize: 20 }}>{pet.name}</h3>
                <div className="pet-meta">{pet.breed} • {pet.age} yrs</div>
                <div className="pet-meta">{pet.description}</div>
                <div style={{ marginTop: 6, display: 'flex', gap: 6 }}>
                  {(pet.listingType === 'SALE' || pet.listingType === 'BOTH') && <span className="pill sale">Sale</span>}
                  {(pet.listingType === 'TRADE' || pet.listingType === 'BOTH') && <span className="pill trade">Trade</span>}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className="pet-price" style={{ fontSize: 24 }}>{pet.price ? `$${pet.price}` : '-'}</div>
                <span className="pill ok">{pet.status.toLowerCase()}</span>
              </div>
              <div style={{ display: 'grid', gap: 6 }}>
                <Link to={`/pets/${pet.id}/edit`} className="btn-secondary" style={{ textDecoration: 'none', textAlign: 'center' }}>Edit</Link>
                <button className="btn-danger" onClick={() => onDelete(pet.id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
        )}
      </section>
    </AppLayout>
  );
}

export default MyPets;
