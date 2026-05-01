import React, { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import AppLayout from '../../components/AppLayout/AppLayout';
import { deleteAdminPet, getAdminPets, getAdminUsers, suspendAdminUser } from '../../services/api';
import { hasRole } from '../../utils/auth';
import './AdminPanel.css';

function AdminPanel() {
  const [tab, setTab] = useState('listings');
  const [pets, setPets] = useState([]);
  const [users, setUsers] = useState([]);
  const [petPageInfo, setPetPageInfo] = useState(null);
  const [userPageInfo, setUserPageInfo] = useState(null);
  const [search, setSearch] = useState('');
  const [loadError, setLoadError] = useState('');
  const [actionError, setActionError] = useState('');
  const [loading, setLoading] = useState(true);
  const [petPage, setPetPage] = useState(0);
  const [userPage, setUserPage] = useState(0);

  const normalizeText = (value, fallback = '-') => {
    if (value === null || value === undefined) {
      return fallback;
    }
    const normalized = String(value).trim();
    return normalized ? normalized : fallback;
  };

  const formatJoinedDate = (value) => {
    if (!value) {
      return '-';
    }
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return '-';
    }
    return parsed.toISOString().slice(0, 10);
  };

  const load = async () => {
    setLoading(true);
    setLoadError('');
    try {
      const [petsRes, usersRes] = await Promise.all([
        getAdminPets({ page: petPage, pageSize: 20 }),
        getAdminUsers({ page: userPage, pageSize: 20 })
      ]);

      setPets(petsRes.data?.content || []);
      setPetPageInfo(petsRes.data?.pageInfo || null);

      setUsers(usersRes.data?.content || []);
      setUserPageInfo(usersRes.data?.pageInfo || null);
    } catch (error) {
      setPets([]);
      setUsers([]);
      setPetPageInfo(null);
      setUserPageInfo(null);
      const message = error?.response?.data?.error || error?.response?.data?.message || 'Unable to load admin data.';
      setLoadError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [petPage, userPage]);

  const filteredUsers = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) {
      return users;
    }

    return users.filter((user) =>
      String(user?.fullName || '').toLowerCase().includes(keyword)
      || String(user?.email || '').toLowerCase().includes(keyword)
    );
  }, [users, search]);

  const totalRevenue = useMemo(() => {
    return pets.reduce((sum, pet) => sum + Number(pet.price || 0), 0);
  }, [pets]);

  const activeUsers = useMemo(() => users.filter((user) => !user.suspended).length, [users]);

  const getOrderCount = (user) => Number(user?.orders ?? user?.purchases ?? 0);
  const getTradeOfferCount = (user) => Number(user?.tradeOffers ?? user?.trades ?? 0);

  const onDeleteListing = async (petId) => {
    setActionError('');
    try {
      await deleteAdminPet(petId);
      load();
    } catch (error) {
      const message = error?.response?.data?.error || error?.response?.data?.message || 'Failed to delete listing';
      setActionError(message);
    }
  };

  const onSuspendUser = async (userId) => {
    setActionError('');
    try {
      await suspendAdminUser(userId);
      load();
    } catch (error) {
      const message = error?.response?.data?.error || error?.response?.data?.message || 'Failed to suspend user';
      setActionError(message);
    }
  };

  if (!hasRole('ADMIN')) {
    return (
      <AppLayout>
        <div className="panel-card" style={{ padding: 16 }}>Admin access required.</div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <section className="market-page">
        <div className="market-header">
          <h1>Admin Panel</h1>
          <p>Manage listings, users, and platform activity</p>
        </div>

        {loadError && (
          <div className="panel-card" style={{ padding: 12, marginBottom: 12, borderColor: '#fecaca', color: '#b91c1c' }}>
            {loadError}
          </div>
        )}

        {actionError && (
          <div className="panel-card" style={{ padding: 12, marginBottom: 12, borderColor: '#fecaca', color: '#b91c1c' }}>
            {actionError}
            <button
              onClick={() => setActionError('')}
              style={{
                marginLeft: 12,
                padding: '4px 8px',
                background: '#b91c1c',
                color: '#fff',
                border: 'none',
                borderRadius: 4,
                fontSize: 12,
                cursor: 'pointer'
              }}
            >
              Dismiss
            </button>
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <button className={tab === 'listings' ? 'btn-primary' : 'btn-secondary'} onClick={() => setTab('listings')}>Listings</button>
          <button className={tab === 'users' ? 'btn-primary' : 'btn-secondary'} onClick={() => setTab('users')}>Users</button>
        </div>

        {loading && (
          <div className="panel-card" style={{ padding: 12, marginBottom: 12 }}>
            Loading admin data...
          </div>
        )}

        {tab === 'listings' ? (
          <>
            <div className="stat-row" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', marginBottom: 12 }}>
              <div className="panel-card stat-box"><div><div className="stat-value">{petPageInfo?.totalElements || 0}</div><div className="stat-label">Total Listings</div></div></div>
              <div className="panel-card stat-box"><div><div className="stat-value">${totalRevenue.toFixed(0)}</div><div className="stat-label">Total Revenue</div></div></div>
            </div>

            <div className="panel-card table-wrap">
              <table className="flat-table">
                <thead>
                  <tr>
                    <th>Pet</th>
                    <th>Owner</th>
                    <th>Type</th>
                    <th>Price</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pets.map((pet) => (
                    <tr key={pet.id}>
                      <td>{normalizeText(pet.name)}<div className="pet-meta">{normalizeText(pet.breed)}</div></td>
                      <td>{normalizeText(pet.ownerName)}</td>
                      <td>{normalizeText(pet.listingType)}</td>
                      <td>{pet.price ? `$${pet.price}` : '-'}</td>
                      <td><span className="pill ok">{normalizeText(pet.status, 'unknown').toLowerCase()}</span></td>
                      <td><button className="btn-danger" onClick={() => onDeleteListing(pet.id)}>Delete</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {petPageInfo && (
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: 12,
                marginTop: 16
              }}>
                <button
                  onClick={() => setPetPage(petPage - 1)}
                  disabled={!petPageInfo.hasPrevious || loading}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '8px 16px',
                    borderRadius: 6,
                    border: '1px solid #e5e7eb',
                    background: petPageInfo.hasPrevious && !loading ? '#fff' : '#f3f4f6',
                    color: petPageInfo.hasPrevious && !loading ? '#374151' : '#9ca3af',
                    cursor: petPageInfo.hasPrevious && !loading ? 'pointer' : 'not-allowed',
                    fontSize: 14,
                    fontWeight: 500
                  }}
                >
                  <ChevronLeft size={16} />
                  Previous
                </button>
                <span style={{ color: '#6b7280', fontSize: 13, fontWeight: 500 }}>
                  Page {petPageInfo.page + 1} of {petPageInfo.totalPages}
                </span>
                <button
                  onClick={() => setPetPage(petPage + 1)}
                  disabled={!petPageInfo.hasNext || loading}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '8px 16px',
                    borderRadius: 6,
                    border: '1px solid #e5e7eb',
                    background: petPageInfo.hasNext && !loading ? '#fff' : '#f3f4f6',
                    color: petPageInfo.hasNext && !loading ? '#374151' : '#9ca3af',
                    cursor: petPageInfo.hasNext && !loading ? 'pointer' : 'not-allowed',
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
        ) : (
          <>
            <div className="stat-row" style={{ gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', marginBottom: 12 }}>
              <div className="panel-card stat-box"><div><div className="stat-value">{userPageInfo?.totalElements || 0}</div><div className="stat-label">Total Users</div></div></div>
              <div className="panel-card stat-box"><div><div className="stat-value">{activeUsers}</div><div className="stat-label">Active</div></div></div>
              <div className="panel-card stat-box"><div><div className="stat-value">{(userPageInfo?.totalElements || 0) - activeUsers}</div><div className="stat-label">Suspended</div></div></div>
              <div className="panel-card stat-box"><div><div className="stat-value">${totalRevenue.toFixed(0)}</div><div className="stat-label">Total Revenue</div></div></div>
            </div>

            <div className="panel-card" style={{ padding: 10, marginBottom: 12 }}>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search users by name or email..."
              />
            </div>

            <div className="panel-card table-wrap">
              <table className="flat-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Joined</th>
                    <th>Activity</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id}>
                      <td>{normalizeText(user.fullName, 'Unnamed User')}</td>
                      <td>{normalizeText(user.email)}</td>
                      <td>{normalizeText(user.role, 'USER')}</td>
                      <td><span className="pill ok">{user.suspended ? 'suspended' : 'active'}</span></td>
                      <td>{formatJoinedDate(user.createdAt)}</td>
                      <td>{getOrderCount(user)} orders • {getTradeOfferCount(user)} trade offers</td>
                      <td>
                        <button
                          className="btn-danger"
                          disabled={user.suspended || String(user.role || '').toUpperCase() === 'ADMIN'}
                          onClick={() => onSuspendUser(user.id)}
                        >
                          Suspend
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {userPageInfo && (
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: 12,
                marginTop: 16
              }}>
                <button
                  onClick={() => setUserPage(userPage - 1)}
                  disabled={!userPageInfo.hasPrevious || loading}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '8px 16px',
                    borderRadius: 6,
                    border: '1px solid #e5e7eb',
                    background: userPageInfo.hasPrevious && !loading ? '#fff' : '#f3f4f6',
                    color: userPageInfo.hasPrevious && !loading ? '#374151' : '#9ca3af',
                    cursor: userPageInfo.hasPrevious && !loading ? 'pointer' : 'not-allowed',
                    fontSize: 14,
                    fontWeight: 500
                  }}
                >
                  <ChevronLeft size={16} />
                  Previous
                </button>
                <span style={{ color: '#6b7280', fontSize: 13, fontWeight: 500 }}>
                  Page {userPageInfo.page + 1} of {userPageInfo.totalPages}
                </span>
                <button
                  onClick={() => setUserPage(userPage + 1)}
                  disabled={!userPageInfo.hasNext || loading}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '8px 16px',
                    borderRadius: 6,
                    border: '1px solid #e5e7eb',
                    background: userPageInfo.hasNext && !loading ? '#fff' : '#f3f4f6',
                    color: userPageInfo.hasNext && !loading ? '#374151' : '#9ca3af',
                    cursor: userPageInfo.hasNext && !loading ? 'pointer' : 'not-allowed',
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

export default AdminPanel;
