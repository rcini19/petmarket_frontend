import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Camera, LoaderCircle, Mail, PencilLine, Shield, UserRound } from 'lucide-react';
import AppLayout from '../../components/AppLayout/AppLayout';
import { changePassword, getOrderHistory, getProfile, getTradeHistory, updateProfile, updateProfilePhoto } from '../../services/api';
import { clearAuthStorage, saveAuthSession } from '../../utils/auth';
import './Profile.css';

function Profile() {
  const [profile, setProfile] = useState(null);
  const [orders, setOrders] = useState([]);
  const [trades, setTrades] = useState([]);
  const [editingProfile, setEditingProfile] = useState(false);
  const [editingPassword, setEditingPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState('');

  const [profileForm, setProfileForm] = useState({ fullName: '', email: '' });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const fileRef = useRef(null);

  const load = useCallback(async () => {
    try {
      const [profileRes, orderRes, tradeRes] = await Promise.all([getProfile(), getOrderHistory(), getTradeHistory()]);
      setProfile(profileRes.data);
      setOrders(orderRes.data || []);
      setTrades(tradeRes.data || []);
      setProfileForm({ fullName: profileRes.data.fullName || '', email: profileRes.data.email || '' });
    } catch {
      clearAuthStorage();
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const initials = useMemo(() => {
    const name = profile?.fullName || 'User';
    return name.split(' ').filter(Boolean).slice(0, 2).map((x) => x[0]?.toUpperCase()).join('');
  }, [profile?.fullName]);

  const onProfileSave = async (event) => {
    event.preventDefault();
    setSaving(true);
    setFeedback('');
    try {
      const response = await updateProfile(profileForm.fullName, profileForm.email);
      const payload = response.data;
      setProfile(payload);
      if (payload?.token) {
        saveAuthSession({
          token: payload.token,
          user: {
            email: payload.email,
            fullName: payload.fullName,
            role: payload.role,
            profileImageUrl: payload.profileImageUrl || null,
          },
        });
      }
      setEditingProfile(false);
      setFeedback('Profile updated successfully.');
    } catch (error) {
      setFeedback(error?.response?.data?.error || 'Unable to save profile.');
    } finally {
      setSaving(false);
    }
  };

  const onPasswordSave = async (event) => {
    event.preventDefault();
    setSaving(true);
    setFeedback('');
    try {
      await changePassword(passwordForm.currentPassword, passwordForm.newPassword, passwordForm.confirmPassword);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setEditingPassword(false);
      setFeedback('Password changed successfully.');
    } catch (error) {
      setFeedback(error?.response?.data?.error || 'Unable to change password.');
    } finally {
      setSaving(false);
    }
  };

  const onPhotoChange = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) {
      return;
    }

    try {
      const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error('Read failed'));
        reader.readAsDataURL(file);
      });

      const response = await updateProfilePhoto(dataUrl);
      const updated = response?.data?.profile;
      if (updated) {
        setProfile(updated);
      }
      setFeedback(response?.data?.message || 'Profile photo updated.');
    } catch (error) {
      setFeedback(error?.response?.data?.error || 'Unable to upload photo.');
    }
  };

  if (!profile) {
    return (
      <AppLayout>
        <div className="panel-card" style={{ padding: 16, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <LoaderCircle className="spin" size={16} />
          <span>Loading profile...</span>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <section className="market-page">
        <div className="market-header">
          <h1>Profile</h1>
          <p>Your account and transaction history</p>
        </div>

        {feedback && <div className="panel-card" style={{ padding: 10, marginBottom: 10 }}>{feedback}</div>}

        <div className="panel-card" style={{ padding: 14, marginBottom: 12, display: 'grid', gridTemplateColumns: '120px 1fr', gap: 12 }}>
          <div style={{ display: 'grid', gap: 8, justifyItems: 'center' }}>
            <div style={{ width: 90, height: 90, borderRadius: '50%', overflow: 'hidden', border: '1px solid #d1d5db', display: 'grid', placeItems: 'center', background: '#eff6ff' }}>
              {profile.profileImageUrl ? <img src={profile.profileImageUrl} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <strong>{initials}</strong>}
            </div>
            <input type="file" ref={fileRef} accept="image/png,image/jpeg,image/jpg" hidden onChange={onPhotoChange} />
            <button type="button" className="btn-secondary" onClick={() => fileRef.current?.click()}><Camera size={14} /> Change photo</button>
          </div>

          <div>
            <div className="pet-grid" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', marginBottom: 10 }}>
              <div className="panel-card" style={{ padding: 10 }}><div className="pet-meta">Full Name</div><strong>{profile.fullName}</strong></div>
              <div className="panel-card" style={{ padding: 10 }}><div className="pet-meta">Email</div><strong>{profile.email}</strong></div>
              <div className="panel-card" style={{ padding: 10 }}><div className="pet-meta">Account Type</div><strong>{profile.accountType}</strong></div>
              <div className="panel-card" style={{ padding: 10 }}><div className="pet-meta">Member Since</div><strong>{new Date(profile.memberSince).toLocaleDateString()}</strong></div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn-primary" onClick={() => { setEditingProfile((value) => !value); setEditingPassword(false); }}><PencilLine size={14} /> Edit Profile</button>
              <button className="btn-secondary" onClick={() => { setEditingPassword((value) => !value); setEditingProfile(false); }}><Shield size={14} /> Change Password</button>
            </div>
          </div>
        </div>

        {editingProfile && (
          <form className="panel-card form-grid" style={{ padding: 14, marginBottom: 12, display: 'grid', gap: 8, maxWidth: 520 }} onSubmit={onProfileSave}>
            <h2 style={{ margin: 0, fontSize: 22 }}>Edit Profile</h2>
            <label>Full Name</label>
            <input value={profileForm.fullName} onChange={(event) => setProfileForm((v) => ({ ...v, fullName: event.target.value }))} required />
            <label>Email</label>
            <input value={profileForm.email} type="email" onChange={(event) => setProfileForm((v) => ({ ...v, email: event.target.value }))} required />
            <button className="btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save Profile'}</button>
          </form>
        )}

        {editingPassword && (
          <form className="panel-card form-grid" style={{ padding: 14, marginBottom: 12, display: 'grid', gap: 8, maxWidth: 520 }} onSubmit={onPasswordSave}>
            <h2 style={{ margin: 0, fontSize: 22 }}>Change Password</h2>
            <label>Current Password</label>
            <input type="password" value={passwordForm.currentPassword} onChange={(event) => setPasswordForm((v) => ({ ...v, currentPassword: event.target.value }))} required />
            <label>New Password</label>
            <input type="password" value={passwordForm.newPassword} onChange={(event) => setPasswordForm((v) => ({ ...v, newPassword: event.target.value }))} required />
            <label>Confirm New Password</label>
            <input type="password" value={passwordForm.confirmPassword} onChange={(event) => setPasswordForm((v) => ({ ...v, confirmPassword: event.target.value }))} required />
            <button className="btn-primary" disabled={saving}>{saving ? 'Updating...' : 'Update Password'}</button>
          </form>
        )}

        <div className="stat-row" style={{ marginBottom: 12 }}>
          <div className="panel-card stat-box"><div><div className="stat-value">{orders.length}</div><div className="stat-label">Purchases</div></div><Mail size={16} color="#2563eb" /></div>
          <div className="panel-card stat-box"><div><div className="stat-value">{trades.length}</div><div className="stat-label">Trades</div></div><UserRound size={16} color="#2563eb" /></div>
          <div className="panel-card stat-box"><div><div className="stat-value">${orders.reduce((s, item) => s + Number(item.amount || 0), 0).toFixed(0)}</div><div className="stat-label">Spent</div></div><Shield size={16} color="#2563eb" /></div>
        </div>

        <div className="panel-card" style={{ padding: 12, marginBottom: 10 }}>
          <h2 style={{ margin: 0, fontSize: 20, marginBottom: 10 }}>Order History</h2>
          {orders.length === 0 ? (
            <p className="pet-meta">No order records yet.</p>
          ) : (
            <div style={{ display: 'grid', gap: 8 }}>
              {orders.map((order) => (
                <div key={order.id} className="panel-card" style={{ padding: 10, display: 'grid', gridTemplateColumns: '1fr auto', gap: 8, alignItems: 'center' }}>
                  <div>
                    <strong style={{ fontSize: 16 }}>{order.title}</strong>
                    <div className="pet-meta">{order.subtitle}</div>
                    <div className="pet-meta">{order.date}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="pet-price" style={{ fontSize: 18 }}>${order.amount}</div>
                    <span className="pill ok">{order.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="panel-card" style={{ padding: 12 }}>
          <h2 style={{ margin: 0, fontSize: 20, marginBottom: 10 }}>Trade History</h2>
          {trades.length === 0 ? (
            <p className="pet-meta">No trade records yet.</p>
          ) : (
            <div style={{ display: 'grid', gap: 8 }}>
              {trades.map((trade) => (
                <div key={trade.id} className="panel-card" style={{ padding: 10, display: 'grid', gridTemplateColumns: '1fr auto', gap: 8, alignItems: 'center' }}>
                  <div>
                    <strong style={{ fontSize: 16 }}>{trade.title}</strong>
                    <div className="pet-meta">{trade.subtitle}</div>
                    <div className="pet-meta">{trade.date}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span className="pill trade">{trade.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </AppLayout>
  );
}

export default Profile;
