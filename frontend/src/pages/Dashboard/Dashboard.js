import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeftRight, Heart, Plus, Search } from 'lucide-react';
import AppLayout from '../../components/AppLayout/AppLayout';
import { getMyPets, getPets, getTrades } from '../../services/api';
import { hasRole } from '../../utils/auth';
import './Dashboard.css';

function Dashboard() {
  const [totalListings, setTotalListings] = useState(0);
  const [pendingTrades, setPendingTrades] = useState(0);
  const [myPetsCount, setMyPetsCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        const [petsRes, myPetsRes, tradesRes] = await Promise.all([getPets(), getMyPets(), getTrades()]);
        setTotalListings((petsRes.data || []).length);
        setMyPetsCount((myPetsRes.data || []).length);
        setPendingTrades((tradesRes.data || []).filter((trade) => trade.status === 'PENDING').length);
      } catch {
        setTotalListings(0);
        setMyPetsCount(0);
        setPendingTrades(0);
      }
    };

    load();
  }, []);

  const actions = useMemo(() => ([
    { title: 'Browse Pets', subtitle: 'Search pets available for sale or trade', to: '/browse', icon: Search },
    { title: 'Create Listing', subtitle: 'List your pet on the marketplace', to: '/pets/new', icon: Plus },
    { title: 'Trade Offers', subtitle: 'Review and respond to trade requests', to: '/trades', icon: ArrowLeftRight },
    { title: 'My Pets', subtitle: 'Manage your active listings', to: '/my-pets', icon: Heart },
  ]), []);

  useEffect(() => {
    if (hasRole('ADMIN')) {
      navigate('/admin', { replace: true });
    }
  }, [navigate]);

  return (
    <AppLayout>
      <section className="market-page">
        <div className="market-header">
          <h1>Dashboard</h1>
          <p>Overview of your PetMarket activity</p>
        </div>

        <div className="stat-row" style={{ marginBottom: 16 }}>
          <div className="panel-card stat-box">
            <div>
              <div className="stat-value">{totalListings}</div>
              <div className="stat-label">Available Pets</div>
            </div>
            <Search size={18} color="#2563eb" />
          </div>
          <div className="panel-card stat-box">
            <div>
              <div className="stat-value">{pendingTrades}</div>
              <div className="stat-label">Pending Trades</div>
            </div>
            <ArrowLeftRight size={18} color="#2563eb" />
          </div>
          <div className="panel-card stat-box">
            <div>
              <div className="stat-value">{myPetsCount}</div>
              <div className="stat-label">My Pets</div>
            </div>
            <Heart size={18} color="#2563eb" />
          </div>
        </div>

        <h2 style={{ margin: '8px 0 10px', fontSize: 22 }}>Quick Actions</h2>
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
