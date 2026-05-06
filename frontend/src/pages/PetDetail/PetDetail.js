import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, X } from 'lucide-react';
import AppLayout from '../../components/AppLayout/AppLayout';
import { createOrder, getPetById, getProfile } from '../../services/api';
import { getStoredUser, updateStoredUser } from '../../utils/auth';
import './PetDetail.css';

function PetDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [pet, setPet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [currentUser, setCurrentUser] = useState(getStoredUser);

  useEffect(() => {
    if (currentUser?.id) {
      return;
    }

    const loadCurrentUser = async () => {
      try {
        const response = await getProfile();
        const updatedUser = updateStoredUser({
          id: response.data?.id,
          email: response.data?.email,
          fullName: response.data?.fullName,
          role: response.data?.role,
          profileImageUrl: response.data?.profileImageUrl || null,
        });
        setCurrentUser(updatedUser);
      } catch {
        // Pet loading and the global API handler will handle auth/session failures.
      }
    };

    loadCurrentUser();
  }, [currentUser?.id]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setLoadError('');
      setPet(null);
      try {
        const response = await getPetById(id);
        setPet(response.data);
      } catch {
        setPet(null);
        setLoadError('Pet listing not found.');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  const isOwnPet = useMemo(() => {
    return currentUser?.id && Number(pet?.ownerId) === Number(currentUser.id);
  }, [pet, currentUser]);

  const canPurchase = useMemo(() => {
    if (!pet || isOwnPet) {
      return false;
    }
    return (pet.listingType === 'SALE' || pet.listingType === 'BOTH') && pet.status === 'AVAILABLE';
  }, [pet, isOwnPet]);

  const canTrade = useMemo(() => {
    if (!pet || isOwnPet) {
      return false;
    }
    return (pet.listingType === 'TRADE' || pet.listingType === 'BOTH') && pet.status === 'AVAILABLE';
  }, [pet, isOwnPet]);

  const confirmPurchase = async () => {
    if (!pet || !pet.price) {
      return;
    }

    try {
      const response = await createOrder({ petId: pet.id, totalPrice: pet.price });
      setShowConfirm(false);
      navigate('/browse', {
        replace: true,
        state: {
          purchaseSuccess: {
            petName: response.data?.petName || pet.name,
            totalPrice: response.data?.totalPrice || pet.price,
          },
        },
      });
    } catch {
      setShowConfirm(false);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="panel-card" style={{ padding: 18 }}>Loading pet details...</div>
      </AppLayout>
    );
  }

  if (!pet) {
    return (
      <AppLayout>
        <div className="panel-card" style={{ padding: 18 }}>{loadError || 'Pet listing not found.'}</div>
      </AppLayout>
    );
  }

  const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=900';

  const handleImageError = (e) => {
    e.target.onerror = null;
    e.target.src = DEFAULT_IMAGE;
  };

  return (
    <AppLayout>
      <section className="market-page">
        <Link to="/browse" style={{ display: 'inline-flex', gap: 6, alignItems: 'center', color: '#6b7280', textDecoration: 'none', marginBottom: 12 }}>
          <ArrowLeft size={14} />
          <span>Back to listings</span>
        </Link>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <img
            src={pet.imageUrl || DEFAULT_IMAGE}
            alt={pet.name}
            className="panel-card"
            style={{ width: '100%', height: 520, objectFit: 'cover' }}
            onError={handleImageError}
          />

          <div className="panel-card" style={{ padding: 16 }}>
            <div className="pet-title-row" style={{ marginBottom: 6 }}>
              <h1 style={{ margin: 0, fontSize: 42 }}>{pet.name}</h1>
              <div style={{ textAlign: 'right' }}>
                <div style={{ color: '#6b7280', fontSize: 12 }}>Price</div>
                <div className="pet-price" style={{ fontSize: 40 }}>{pet.price ? `$${pet.price}` : '-'}</div>
              </div>
            </div>
            <p className="pet-meta" style={{ margin: '0 0 8px', fontSize: 18 }}>{pet.breed}</p>

            <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
              {(pet.listingType === 'SALE' || pet.listingType === 'BOTH') && <span className="pill sale">For Sale</span>}
              {(pet.listingType === 'TRADE' || pet.listingType === 'BOTH') && <span className="pill trade">Available</span>}
            </div>

            <div className="pet-grid" style={{ gridTemplateColumns: 'repeat(2, minmax(0,1fr))' }}>
              <div className="panel-card" style={{ padding: 10 }}>
                <div className="pet-meta">Species</div>
                <strong>{pet.species}</strong>
              </div>
              <div className="panel-card" style={{ padding: 10 }}>
                <div className="pet-meta">Age</div>
                <strong>{pet.age} years</strong>
              </div>
            </div>

            <div className="panel-card" style={{ padding: 10, marginTop: 10 }}>
              <div className="pet-meta">Listed by</div>
              <strong>{pet.ownerName}</strong>
            </div>

            <h3 style={{ margin: '14px 0 6px', fontSize: 20 }}>About</h3>
            <p className="pet-meta" style={{ fontSize: 14 }}>{pet.description || 'No description provided.'}</p>

            {isOwnPet ? (
              <button className="btn-secondary" style={{ width: '100%', marginTop: 14 }} disabled>
                This is your listing
              </button>
            ) : canPurchase ? (
              <button className="btn-primary" style={{ width: '100%', marginTop: 14 }} onClick={() => setShowConfirm(true)}>
                Purchase - ${pet.price}
              </button>
            ) : (
              <button className="btn-secondary" style={{ width: '100%', marginTop: 14 }} disabled>
                This listing is not purchasable
              </button>
            )}

            {canTrade && (
              <button className="btn-secondary" style={{ width: '100%', marginTop: 8 }} onClick={() => navigate('/trades')}>
                Offer Trade
              </button>
            )}
          </div>
        </div>

        {showConfirm && (
          <div className="modal-overlay">
            <div className="modal-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ margin: 0, fontSize: 24 }}>Confirm Purchase</h2>
                <button className="btn-secondary" style={{ padding: 6 }} onClick={() => setShowConfirm(false)}>
                  <X size={14} />
                </button>
              </div>
              <p className="pet-meta" style={{ marginTop: 8 }}>You are about to purchase {pet.name} for ${pet.price}.</p>
              <div className="panel-card" style={{ marginTop: 10, padding: 10 }}>
                <div className="pet-title-row"><span>Pet</span><strong>{pet.name}</strong></div>
                <div className="pet-title-row"><span>Breed</span><strong>{pet.breed}</strong></div>
                <div className="pet-title-row"><span>Total</span><strong>${pet.price}</strong></div>
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setShowConfirm(false)}>Cancel</button>
                <button className="btn-primary" style={{ flex: 1 }} onClick={confirmPurchase}>Confirm</button>
              </div>
            </div>
          </div>
        )}

      </section>
    </AppLayout>
  );
}

export default PetDetail;
