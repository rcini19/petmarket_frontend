import React, { useEffect, useMemo, useState } from 'react';
import AppLayout from '../../components/AppLayout/AppLayout';
import { deleteAdminPet, getAdminPets, getAdminUsers, suspendAdminUser } from '../../services/api';
import { hasRole } from '../../utils/auth';
import './AdminPanel.css';

function AdminPanel() {
  const [tab, setTab] = useState('listings');
  const [pets, setPets] = useState([]);
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [loadError, setLoadError] = useState('');
  const [loading, setLoading] = useState(true);

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
      const [petsRes, usersRes] = await Promise.all([getAdminPets(), getAdminUsers()]);
      setPets(petsRes.data || []);
      setUsers(usersRes.data || []);
    } catch (error) {
      setPets([]);
      setUsers([]);
      const message = error?.response?.data?.error || error?.response?.data?.message || 'Unable to load admin data.';
      setLoadError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

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

  const onDeleteListing = async (petId) => {
    try {
      await deleteAdminPet(petId);
      load();
    } catch {
      // noop
    }
  };

  const onSuspendUser = async (userId) => {
    try {
      await suspendAdminUser(userId);
      load();
    } catch {
      // noop
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
              <div className="panel-card stat-box"><div><div className="stat-value">{pets.length}</div><div className="stat-label">Total Listings</div></div></div>
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
          </>
        ) : (
          <>
            <div className="stat-row" style={{ gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', marginBottom: 12 }}>
              <div className="panel-card stat-box"><div><div className="stat-value">{users.length}</div><div className="stat-label">Total Users</div></div></div>
              <div className="panel-card stat-box"><div><div className="stat-value">{activeUsers}</div><div className="stat-label">Active</div></div></div>
              <div className="panel-card stat-box"><div><div className="stat-value">{users.length - activeUsers}</div><div className="stat-label">Suspended</div></div></div>
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
                      <td>{formatJoinedDate(user.joinedAt)}</td>
                      <td>{Number(user.purchases || 0)} purchases • {Number(user.trades || 0)} trades</td>
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
          </>
        )}
      </section>
    </AppLayout>
  );
}

export default AdminPanel;
