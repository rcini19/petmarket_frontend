import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeftRight,
  CalendarDays,
  Camera,
  CheckCircle2,
  Heart,
  LayoutDashboard,
  LoaderCircle,
  LogOut,
  Mail,
  Package,
  PawPrint,
  PencilLine,
  ReceiptText,
  Search,
  Shield,
  UserRound,
  XCircle,
} from 'lucide-react';
import {
  changePassword,
  getOrderHistory,
  getProfile,
  getTradeHistory,
  updateProfile,
  updateProfilePhoto,
} from '../services/api';
import { clearAuthStorage, saveAuthSession } from '../utils/auth';
import './Profile.css';

const NAV_ITEMS = [
  { label: 'Dashboard', icon: LayoutDashboard },
  { label: 'Browse', icon: Search },
  { label: 'My Pets', icon: Heart },
  { label: 'Trades', icon: ArrowLeftRight },
  { label: 'Profile', icon: UserRound },
];

function Profile() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [profile, setProfile] = useState(null);
  const [orders, setOrders] = useState([]);
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingError, setLoadingError] = useState('');
  const [feedback, setFeedback] = useState({ type: '', text: '' });

  const [editingProfile, setEditingProfile] = useState(false);
  const [editingPassword, setEditingPassword] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const [profileForm, setProfileForm] = useState({
    fullName: '',
    email: '',
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const isUnauthorizedError = (error) => {
    const status = error?.response?.status;
    return status === 401 || status === 403;
  };

  const handleLogout = useCallback(() => {
    clearAuthStorage();
    navigate('/login', { replace: true });
  }, [navigate]);

  const syncUserStorage = useCallback((profileData) => {
    let cachedUser = {};

    try {
      cachedUser = JSON.parse(localStorage.getItem('user') || '{}');
    } catch {
      cachedUser = {};
    }

    localStorage.setItem(
      'user',
      JSON.stringify({
        ...cachedUser,
        fullName: profileData.fullName,
        email: profileData.email,
        role: profileData.role,
        profileImageUrl: profileData.profileImageUrl || null,
      })
    );
  }, []);

  const fetchProfileData = useCallback(async () => {
    setLoading(true);
    setLoadingError('');

    try {
      const profileResponse = await getProfile();
      const [orderResult, tradeResult] = await Promise.allSettled([
        getOrderHistory(),
        getTradeHistory(),
      ]);

      const profileData = profileResponse.data;
      setProfile(profileData);
      setOrders(orderResult.status === 'fulfilled' ? orderResult.value.data || [] : []);
      setTrades(tradeResult.status === 'fulfilled' ? tradeResult.value.data || [] : []);
      setProfileForm({
        fullName: profileData.fullName || '',
        email: profileData.email || '',
      });
      syncUserStorage(profileData);
    } catch (error) {
      const message = error?.response?.data?.error || 'Unable to load profile data right now.';
      if (isUnauthorizedError(error)) {
        handleLogout();
        return;
      }
      setLoadingError(message);
    } finally {
      setLoading(false);
    }
  }, [handleLogout, syncUserStorage]);

  useEffect(() => {
    fetchProfileData();
  }, [fetchProfileData]);

  const memberSince = useMemo(() => {
    if (!profile?.memberSince) {
      return 'N/A';
    }

    const date = new Date(profile.memberSince);
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
    });
  }, [profile]);

  const profileInitials = useMemo(() => {
    const fullName = profile?.fullName || 'PetMarket User';
    return fullName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0].toUpperCase())
      .join('');
  }, [profile]);

  const totalSpent = useMemo(() => {
    const amount = orders.reduce((sum, order) => sum + (Number(order.amount) || 0), 0);
    return amount;
  }, [orders]);

  const setSuccess = (text) => {
    setFeedback({ type: 'success', text });
  };

  const setError = (text) => {
    setFeedback({ type: 'error', text });
  };

  const handleProfileSubmit = async (event) => {
    event.preventDefault();
    setFeedback({ type: '', text: '' });
    setSavingProfile(true);

    try {
      const response = await updateProfile(profileForm.fullName, profileForm.email);
      const updatedProfile = response.data;
      setProfile(updatedProfile);
      syncUserStorage(updatedProfile);
      if (updatedProfile?.token) {
        saveAuthSession({
          token: updatedProfile.token,
          user: {
            email: updatedProfile.email,
            fullName: updatedProfile.fullName,
            role: updatedProfile.role,
            profileImageUrl: updatedProfile.profileImageUrl || null,
          },
        });
      }
      setEditingProfile(false);
      setSuccess('Profile information updated.');
    } catch (error) {
      if (isUnauthorizedError(error)) {
        handleLogout();
        return;
      }
      const message = error?.response?.data?.error || 'Failed to update profile.';
      setError(message);
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();
    setFeedback({ type: '', text: '' });

    if (passwordForm.newPassword.length < 8) {
      setError('New password must be at least 8 characters long.');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('New password and confirm password do not match.');
      return;
    }

    setSavingPassword(true);
    try {
      await changePassword(
        passwordForm.currentPassword,
        passwordForm.newPassword,
        passwordForm.confirmPassword
      );
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setEditingPassword(false);
      setSuccess('Password changed successfully.');
    } catch (error) {
      if (isUnauthorizedError(error)) {
        handleLogout();
        return;
      }
      const message = error?.response?.data?.error || 'Failed to change password.';
      setError(message);
    } finally {
      setSavingPassword(false);
    }
  };

  const handlePhotoChange = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) {
      return;
    }

    const fileType = (file.type || '').toLowerCase();
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];

    if (!allowedTypes.includes(fileType)) {
      setError('Only JPG/JPEG and PNG images are supported.');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setError('Please upload an image smaller than 2MB.');
      return;
    }

    setUploadingPhoto(true);
    setFeedback({ type: '', text: '' });

    try {
      const imageDataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error('Could not read selected image.'));
        reader.readAsDataURL(file);
      });

      const response = await updateProfilePhoto(imageDataUrl);
      const updatedProfile = response?.data?.profile;
      const successMessage = response?.data?.message || 'Profile photo updated.';

      if (updatedProfile) {
        setProfile(updatedProfile);
        syncUserStorage(updatedProfile);
      }

      setSuccess(successMessage);
    } catch (error) {
      if (isUnauthorizedError(error)) {
        handleLogout();
        return;
      }
      const message = error?.response?.data?.error || 'Failed to upload profile photo.';
      setError(message);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const accountType = profile?.accountType || (profile?.role === 'ADMIN' ? 'Administrator' : 'Member');

  if (loading) {
    return (
      <div className="profile-screen profile-loading-screen">
        <LoaderCircle className="spin" size={30} />
        <p>Loading your profile...</p>
      </div>
    );
  }

  return (
    <div className="profile-screen">
      <header className="profile-topbar">
        <div className="topbar-brand">
          <div className="brand-mark">
            <PawPrint size={18} />
          </div>
          <span>PetMarket</span>
        </div>

        <nav className="topbar-nav" aria-label="Primary">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <button
                type="button"
                key={item.label}
                className={`nav-btn ${item.label === 'Profile' ? 'active' : ''}`}
                aria-current={item.label === 'Profile' ? 'page' : undefined}
              >
                <Icon size={16} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="topbar-user">
          <div className="mini-avatar">
            {profile?.profileImageUrl ? (
              <img src={profile.profileImageUrl} alt="Profile avatar" />
            ) : (
              <span>{profileInitials || 'PM'}</span>
            )}
          </div>
          <div className="mini-user-meta">
            <strong>{profile?.fullName || 'PetMarket User'}</strong>
            <span>{accountType}</span>
          </div>
          <button type="button" className="logout-btn" onClick={handleLogout}>
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      </header>

      <main className="profile-content">
        <section className="profile-heading">
          <h1>Profile</h1>
          <p>Manage your account settings and profile information</p>
        </section>

        {loadingError && (
          <section className="system-message error">
            <XCircle size={16} />
            <span>{loadingError}</span>
            <button type="button" onClick={fetchProfileData}>Retry</button>
          </section>
        )}

        {feedback.text && (
          <section className={`system-message ${feedback.type}`}>
            {feedback.type === 'success' ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
            <span>{feedback.text}</span>
          </section>
        )}

        <section className="panel profile-card">
          <div className="avatar-column">
            <div className="profile-avatar">
              {profile?.profileImageUrl ? (
                <img src={profile.profileImageUrl} alt="Profile" />
              ) : (
                <span>{profileInitials}</span>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg"
              onChange={handlePhotoChange}
              hidden
            />
            <button
              type="button"
              className="secondary-btn"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingPhoto}
            >
              {uploadingPhoto ? <LoaderCircle size={16} className="spin" /> : <Camera size={16} />}
              <span>{uploadingPhoto ? 'Uploading...' : 'Change photo'}</span>
            </button>
          </div>

          <div className="details-column">
            <div className="details-grid">
              <div className="detail-item">
                <UserRound size={16} />
                <div>
                  <label>Full Name</label>
                  <strong>{profile?.fullName}</strong>
                </div>
              </div>

              <div className="detail-item">
                <Mail size={16} />
                <div>
                  <label>Email</label>
                  <strong>{profile?.email}</strong>
                </div>
              </div>

              <div className="detail-item">
                <Shield size={16} />
                <div>
                  <label>Account Type</label>
                  <strong>{accountType}</strong>
                </div>
              </div>

              <div className="detail-item">
                <CalendarDays size={16} />
                <div>
                  <label>Member Since</label>
                  <strong>{memberSince}</strong>
                </div>
              </div>
            </div>

            <div className="profile-actions">
              <button
                type="button"
                className="primary-btn"
                onClick={() => {
                  setEditingProfile((current) => !current);
                  setEditingPassword(false);
                }}
              >
                <PencilLine size={16} />
                <span>{editingProfile ? 'Close Edit Profile' : 'Edit Profile'}</span>
              </button>

              <button
                type="button"
                className="secondary-btn"
                onClick={() => {
                  setEditingPassword((current) => !current);
                  setEditingProfile(false);
                }}
              >
                <Shield size={16} />
                <span>{editingPassword ? 'Close Change Password' : 'Change Password'}</span>
              </button>
            </div>
          </div>
        </section>

        {editingProfile && (
          <section className="panel form-panel">
            <h2>Edit Profile</h2>
            <form className="profile-form" onSubmit={handleProfileSubmit}>
              <label htmlFor="fullName">Full Name</label>
              <input
                id="fullName"
                type="text"
                value={profileForm.fullName}
                onChange={(event) =>
                  setProfileForm((current) => ({
                    ...current,
                    fullName: event.target.value,
                  }))
                }
                required
              />

              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={profileForm.email}
                onChange={(event) =>
                  setProfileForm((current) => ({
                    ...current,
                    email: event.target.value,
                  }))
                }
                required
              />

              <button type="submit" className="primary-btn" disabled={savingProfile}>
                {savingProfile ? <LoaderCircle className="spin" size={16} /> : <PencilLine size={16} />}
                <span>{savingProfile ? 'Saving...' : 'Save Profile'}</span>
              </button>
            </form>
          </section>
        )}

        {editingPassword && (
          <section className="panel form-panel">
            <h2>Change Password</h2>
            <form className="profile-form" onSubmit={handlePasswordSubmit}>
              <label htmlFor="currentPassword">Current Password</label>
              <input
                id="currentPassword"
                type="password"
                value={passwordForm.currentPassword}
                onChange={(event) =>
                  setPasswordForm((current) => ({
                    ...current,
                    currentPassword: event.target.value,
                  }))
                }
                required
              />

              <label htmlFor="newPassword">New Password</label>
              <input
                id="newPassword"
                type="password"
                value={passwordForm.newPassword}
                onChange={(event) =>
                  setPasswordForm((current) => ({
                    ...current,
                    newPassword: event.target.value,
                  }))
                }
                required
                minLength={8}
              />

              <label htmlFor="confirmPassword">Confirm New Password</label>
              <input
                id="confirmPassword"
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(event) =>
                  setPasswordForm((current) => ({
                    ...current,
                    confirmPassword: event.target.value,
                  }))
                }
                required
                minLength={8}
              />

              <button type="submit" className="primary-btn" disabled={savingPassword}>
                {savingPassword ? <LoaderCircle className="spin" size={16} /> : <Shield size={16} />}
                <span>{savingPassword ? 'Updating...' : 'Update Password'}</span>
              </button>
            </form>
          </section>
        )}

        <section className="stat-grid">
          <article className="panel stat-card">
            <Package size={18} />
            <div>
              <strong>{orders.length}</strong>
              <span>Purchases</span>
            </div>
          </article>

          <article className="panel stat-card">
            <ArrowLeftRight size={18} />
            <div>
              <strong>{trades.length}</strong>
              <span>Trades</span>
            </div>
          </article>

          <article className="panel stat-card">
            <ReceiptText size={18} />
            <div>
              <strong>${totalSpent.toFixed(2)}</strong>
              <span>Spent</span>
            </div>
          </article>
        </section>

        <section className="panel history-panel">
          <h2>Order History</h2>
          {orders.length === 0 ? (
            <div className="history-empty">No order records yet. Data loading is ready for future orders.</div>
          ) : (
            <ul className="history-list">
              {orders.map((order) => (
                <li key={order.id}>
                  <div>
                    <strong>{order.title}</strong>
                    <span>{order.date}</span>
                  </div>
                  <div>
                    <strong>${Number(order.amount || 0).toFixed(2)}</strong>
                    <span>{order.status}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="panel history-panel">
          <h2>Trade History</h2>
          {trades.length === 0 ? (
            <div className="history-empty">No trade records yet. Data loading is ready for future trades.</div>
          ) : (
            <ul className="history-list">
              {trades.map((trade) => (
                <li key={trade.id}>
                  <div>
                    <strong>{trade.title}</strong>
                    <span>{trade.date}</span>
                  </div>
                  <div>
                    <strong>{trade.subtitle || trade.status}</strong>
                    <span>{trade.status}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}

export default Profile;
