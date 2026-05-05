import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { deletePet, getMyPets } from '../../services/api';
import AppLayout from '../../components/AppLayout/AppLayout';
import './MyPets.css';

function MyPets() {
  const [pets, setPets] = useState([]);
  const [pageInfo, setPageInfo] = useState(null);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await getMyPets({ page, pageSize: 20 });
      setPets(response.data?.content || []);
      setPageInfo(response.data?.pageInfo || null);
    } catch (err) {
      setError('Failed to load your pets. Please try again.');
      setPets([]);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    load();
  }, [load]);

  const totals = useMemo(() => {
    const total = pageInfo?.totalElements || 0;
    const available = pets.filter((pet) => String(pet.status || '').toUpperCase() === 'AVAILABLE').length;
    const purchased = pets.filter((pet) => String(pet.status || '').toUpperCase() === 'SOLD').length;
    return { total, available, purchased };
  }, [pets, pageInfo]);

  const onDelete = async (petId) => {
    try {
      await deletePet(petId);
      load();
    } catch {
      setError('Only available listings can be deleted.');
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
            <p>View your owned pets and manage active listings</p>
          </div>
          <Link className="btn-primary" to="/pets/new" style={{ textDecoration: 'none' }}>+ New Listing</Link>
        </div>

        <div className="stat-row" style={{ marginBottom: 12 }}>
          <div className="panel-card stat-box"><div><div className="stat-value">{totals.total}</div><div className="stat-label">Total</div></div></div>
          <div className="panel-card stat-box"><div><div className="stat-value">{totals.available}</div><div className="stat-label">Available</div></div></div>
          <div className="panel-card stat-box"><div><div className="stat-value">{totals.purchased}</div><div className="stat-label">Purchased</div></div></div>
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
            You don't have any pets yet. <Link to="/pets/new" style={{ color: '#2563eb' }}>Create your first listing</Link>
          </div>
        ) : (
          <>
            <div style={{ display: 'grid', gap: 10 }}>
              {pets.map((pet) => {
                const isAvailable = String(pet.status || '').toUpperCase() === 'AVAILABLE';
                return (
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
                  {isAvailable ? (
                    <>
                      <Link to={`/pets/${pet.id}/edit`} className="btn-secondary" style={{ textDecoration: 'none', textAlign: 'center' }}>Edit</Link>
                      <button className="btn-danger" onClick={() => onDelete(pet.id)}>Delete</button>
                    </>
                  ) : (
                    <span className="pill ok" style={{ textAlign: 'center' }}>Owned</span>
                  )}
                </div>
              </div>
                );
              })}
          </div>

            {pageInfo && (
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: 12,
                marginTop: 16
              }}>
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={!pageInfo.hasPrevious || loading}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '8px 16px',
                    borderRadius: 6,
                    border: '1px solid #e5e7eb',
                    background: pageInfo.hasPrevious && !loading ? '#fff' : '#f3f4f6',
                    color: pageInfo.hasPrevious && !loading ? '#374151' : '#9ca3af',
                    cursor: pageInfo.hasPrevious && !loading ? 'pointer' : 'not-allowed',
                    fontSize: 14,
                    fontWeight: 500
                  }}
                >
                  <ChevronLeft size={16} />
                  Previous
                </button>
                <span style={{ color: '#6b7280', fontSize: 13, fontWeight: 500 }}>
                  Page {pageInfo.page + 1} of {pageInfo.totalPages}
                </span>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={!pageInfo.hasNext || loading}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '8px 16px',
                    borderRadius: 6,
                    border: '1px solid #e5e7eb',
                    background: pageInfo.hasNext && !loading ? '#fff' : '#f3f4f6',
                    color: pageInfo.hasNext && !loading ? '#374151' : '#9ca3af',
                    cursor: pageInfo.hasNext && !loading ? 'pointer' : 'not-allowed',
                    fontSize: 14,
                    fontWeight: 500
                  }}
                >
                  Next
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </AppLayout>
  );
}

export default MyPets;
