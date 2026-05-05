import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeftRight, Heart, Plus, Search, Shield, Store, Users } from 'lucide-react';
import AppLayout from '../../components/AppLayout/AppLayout';
import { getAdminPets, getAdminUsers, getMyPets, getPets, getTradeOffers } from '../../services/api';
import { hasRole } from '../../utils/auth';
import './Dashboard.css';

function Dashboard() {
  const [totalListings, setTotalListings] = useState(0);
  const [pendingTrades, setPendingTrades] = useState(0);
  const [myPetsCount, setMyPetsCount] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [dashboardError, setDashboardError] = useState('');
  const isAdmin = hasRole('ADMIN');

  useEffect(() => {
    const load = async () => {
      setDashboardError('');
      try {
        if (isAdmin) {
          const [petsRes, usersRes] = await Promise.all([
            getAdminPets({ page: 0, pageSize: 100 }),
            getAdminUsers({ page: 0, pageSize: 100 }),
          ]);
          const pets = petsRes.data?.content || [];

          setTotalListings(petsRes.data?.pageInfo?.totalElements || pets.length);
          setTotalUsers(usersRes.data?.pageInfo?.totalElements || (usersRes.data?.content || []).length);
          setTotalRevenue(pets.reduce((sum, pet) => sum + Number(pet.price || 0), 0));
          setPendingTrades(0);
          setMyPetsCount(0);
          return;
        }

        const [petsRes, myPetsRes, tradesRes] = await Promise.all([
          getPets(),
          getMyPets(),
          getTradeOffers(),
        ]);
        setTotalListings(petsRes.data?.pageInfo?.totalElements || (petsRes.data?.content || []).length);
        setMyPetsCount(myPetsRes.data?.pageInfo?.totalElements || (myPetsRes.data?.content || []).length);
        setPendingTrades((tradesRes.data || []).filter((trade) => trade.status === 'PENDING').length);
      } catch (error) {
        setTotalListings(0);
        setMyPetsCount(0);
        setPendingTrades(0);
        setTotalUsers(0);
        setTotalRevenue(0);
        setDashboardError(error?.response?.data?.error || error?.response?.data?.message || 'Unable to load dashboard data.');
      }
    };

    load();
  }, [isAdmin]);

  const actions = useMemo(() => {
    if (isAdmin) {
      return [
        { title: 'Manage Listings', subtitle: 'Review and moderate marketplace pets', to: '/admin', icon: Store },
        { title: 'Manage Users', subtitle: 'View members and suspend accounts', to: '/admin', icon: Users },
        { title: 'Browse Pets', subtitle: 'Inspect the public marketplace', to: '/browse', icon: Search },
        { title: 'Profile', subtitle: 'Update your admin account details', to: '/profile', icon: Shield },
      ];
    }

    return [
      { title: 'Browse Pets', subtitle: 'Search pets available for sale or trade', to: '/browse', icon: Search },
      { title: 'Create Listing', subtitle: 'List your pet on the marketplace', to: '/pets/new', icon: Plus },
      { title: 'Trade Offers', subtitle: 'Review and respond to trade requests', to: '/trades', icon: ArrowLeftRight },
      { title: 'My Pets', subtitle: 'Manage your active listings', to: '/my-pets', icon: Heart },
    ];
  }, [isAdmin]);

  return (
    <AppLayout>
      <section className="market-page">
        <div className="market-header">
          <h1>{isAdmin ? 'Admin Dashboard' : 'Dashboard'}</h1>
          <p>{isAdmin ? 'Overview of PetMarket platform activity' : 'Overview of your PetMarket activity'}</p>
        </div>

        {dashboardError && (
          <div className="panel-card" style={{ padding: 12, marginBottom: 12, borderColor: '#fecaca', color: '#b91c1c' }}>
            {dashboardError}
          </div>
        )}

        <div className="stat-row" style={{ marginBottom: 16 }}>
          <div className="panel-card stat-box">
            <div>
              <div className="stat-value">{totalListings}</div>
              <div className="stat-label">{isAdmin ? 'Total Listings' : 'Available Pets'}</div>
            </div>
            {isAdmin ? <Store size={18} color="#2563eb" /> : <Search size={18} color="#2563eb" />}
          </div>
          <div className="panel-card stat-box">
            <div>
              <div className="stat-value">{isAdmin ? totalUsers : pendingTrades}</div>
              <div className="stat-label">{isAdmin ? 'Total Users' : 'Pending Trades'}</div>
            </div>
            {isAdmin ? <Users size={18} color="#2563eb" /> : <ArrowLeftRight size={18} color="#2563eb" />}
          </div>
          <div className="panel-card stat-box">
            <div>
              <div className="stat-value">{isAdmin ? `$${totalRevenue.toFixed(0)}` : myPetsCount}</div>
              <div className="stat-label">{isAdmin ? 'Listed Value' : 'My Pets'}</div>
            </div>
            {isAdmin ? <Shield size={18} color="#2563eb" /> : <Heart size={18} color="#2563eb" />}
          </div>
        </div>

        <h2 style={{ margin: '8px 0 10px', fontSize: 22 }}>{isAdmin ? 'Admin Actions' : 'Quick Actions'}</h2>
        <div className="pet-grid" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                to={action.to}
                key={action.title}
                className="panel-card"
                style={{
                  textDecoration: 'none',
                  color: 'inherit',
                  padding: 14,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <h3 style={{ margin: 0, fontSize: 20 }}>{action.title}</h3>
                  <p style={{ margin: '6px 0 0', color: '#6b7280', fontSize: 13 }}>{action.subtitle}</p>
                </div>
                <Icon size={18} color="#2563eb" />
              </Link>
            );
          })}
        </div>
      </section>
    </AppLayout>
  );
}

export default Dashboard;
