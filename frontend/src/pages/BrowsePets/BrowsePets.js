import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, User } from 'lucide-react';
import AppLayout from '../../components/AppLayout/AppLayout';
import { getPets } from '../../services/api';
import { getStoredUser } from '../../utils/auth';
import './BrowsePets.css';

function BrowsePets() {
  const [pets, setPets] = useState([]);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [loading, setLoading] = useState(true);
  const currentUser = getStoredUser();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const response = await getPets({ search, listingType: filterType });
        setPets(response.data || []);
      } catch (err) {
        console.error('Error loading pets:', err);
        setPets([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [search, filterType]);

  const resultCountText = useMemo(() => `${pets.length} results`, [pets.length]);

  const isOwnPet = (pet) => {
    return currentUser?.id && pet.ownerId === currentUser.id;
  };

  const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=900';

  const handleImageError = (e) => {
    e.target.onerror = null;
    e.target.src = DEFAULT_IMAGE;
  };

  return (
    <AppLayout>
      <section className="market-page">
        <div className="market-header">
          <h1>Browse Pets</h1>
          <p>Find your perfect companion</p>
        </div>

        <div className="panel-card" style={{ padding: 10, marginBottom: 12 }}>
          <div className="search-row">
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={14} style={{ position: 'absolute', left: 12, top: 12, color: '#6b7280' }} />
              <input
                style={{ paddingLeft: 32 }}
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by name, breed, or species..."
              />
            </div>
            <select value={filterType} onChange={(event) => setFilterType(event.target.value)}>
              <option value="">All Types</option>
              <option value="SALE">For Sale</option>
              <option value="TRADE">For Trade</option>
            </select>
          </div>
        </div>

        <p style={{ margin: '0 0 8px', color: '#6b7280', fontSize: 12 }}>{loading ? 'Loading...' : resultCountText}</p>

        <div className="pet-grid">
          {pets.map((pet) => (
            <Link key={pet.id} to={`/pets/${pet.id}`} className="panel-card pet-card" style={{ textDecoration: 'none', color: 'inherit', position: 'relative' }}>
              {isOwnPet(pet) && (
                <div style={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  background: '#2563eb',
                  color: '#fff',
                  padding: '4px 8px',
                  borderRadius: 6,
                  fontSize: 11,
                  fontWeight: 700,
                  zIndex: 1
                }}>
                  Your Listing
                </div>
              )}
              <img
                src={pet.imageUrl || DEFAULT_IMAGE}
                alt={pet.name}
                className="pet-image"
                onError={handleImageError}
              />
              <div className="pet-body">
                <div className="pet-title-row">
                  <h3>{pet.name}</h3>
                  <span className="pet-price">{pet.price ? `$${pet.price}` : 'Trade'}</span>
                </div>
                <div className="pet-meta">{pet.breed}</div>
                <div className="pet-meta">{pet.species} • {pet.age} yrs</div>
                <div className="pet-meta" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <User size={12} />
                  <span>{pet.ownerName || 'Unknown'}</span>
                </div>
                <div className="pet-meta" style={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  maxWidth: '100%'
                }}>
                  {pet.description}
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {(pet.listingType === 'SALE' || pet.listingType === 'BOTH') && <span className="pill sale">Sale</span>}
                  {(pet.listingType === 'TRADE' || pet.listingType === 'BOTH') && <span className="pill trade">Trade</span>}
                </div>
              </div>
            </Link>
          ))}
        </div>

        {!loading && pets.length === 0 && (
          <div className="panel-card" style={{ padding: 24, textAlign: 'center', color: '#6b7280' }}>
            No pets found. Try adjusting your search or filters.
          </div>
        )}
      </section>
    </AppLayout>
  );
}

export default BrowsePets;
