import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, User, ChevronLeft, ChevronRight } from 'lucide-react';
import AppLayout from '../../components/AppLayout/AppLayout';
import { getPets } from '../../services/api';
import { getStoredUser } from '../../utils/auth';
import './BrowsePets.css';

function BrowsePets() {
  const [pets, setPets] = useState([]);
  const [pageInfo, setPageInfo] = useState(null);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const currentUser = getStoredUser();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const response = await getPets({ search, listingType: filterType, page: currentPage, pageSize: 20 });
        setPets(response.data?.content || []);
        setPageInfo(response.data?.pageInfo || null);
      } catch (err) {
        console.error('Error loading pets:', err);
        setPets([]);
        setPageInfo(null);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [search, filterType, currentPage]);

  const resultCountText = useMemo(() => {
    if (!pageInfo) return 'No results';
    return `${pageInfo.totalElements} total • Page ${pageInfo.page + 1} of ${pageInfo.totalPages}`;
  }, [pageInfo]);

  const isOwnPet = (pet) => {
    return currentUser?.id && pet.ownerId === currentUser.id;
  };

  const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=900';

  const handleImageError = (e) => {
    e.target.onerror = null;
    e.target.src = DEFAULT_IMAGE;
  };

  const handlePreviousPage = () => {
    if (pageInfo && pageInfo.hasPrevious) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (pageInfo && pageInfo.hasNext) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handleSearch = (value) => {
    setSearch(value);
    setCurrentPage(0);
  };

  const handleFilterChange = (value) => {
    setFilterType(value);
    setCurrentPage(0);
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
                onChange={(event) => handleSearch(event.target.value)}
                placeholder="Search by name, breed, or species..."
              />
            </div>
            <select value={filterType} onChange={(event) => handleFilterChange(event.target.value)}>
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

        {pageInfo && (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 12,
            marginTop: 20,
            marginBottom: 20
          }}>
            <button
              onClick={handlePreviousPage}
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
                fontWeight: 500,
                transition: 'all 0.2s'
              }}
            >
              <ChevronLeft size={16} />
              Previous
            </button>

            <span style={{ color: '#6b7280', fontSize: 13, fontWeight: 500 }}>
              Page {pageInfo.page + 1} of {pageInfo.totalPages}
            </span>

            <button
              onClick={handleNextPage}
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
                fontWeight: 500,
                transition: 'all 0.2s'
              }}
            >
              Next
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </section>
    </AppLayout>
  );
}

export default BrowsePets;
