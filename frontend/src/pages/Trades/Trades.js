import React, { useEffect, useMemo, useState } from 'react';
import AppLayout from '../../components/AppLayout/AppLayout';
import { createTrade, getMyPets, getPets, getTrades, acceptTrade, rejectTrade } from '../../services/api';
import { getStoredUser } from '../../utils/auth';
import './Trades.css';

function Trades() {
  const [trades, setTrades] = useState([]);
  const [myPets, setMyPets] = useState([]);
  const [tradeablePets, setTradeablePets] = useState([]);
  const [offeredPetId, setOfferedPetId] = useState('');
  const [requestedPetId, setRequestedPetId] = useState('');
  const currentUser = getStoredUser();

  const load = async () => {
    try {
      const [tradesRes, myPetsRes, tradeableRes] = await Promise.all([
        getTrades(),
        getMyPets(),
        getPets({ listingType: 'TRADE' }),
      ]);
      setTrades(tradesRes.data || []);
      setMyPets(myPetsRes.data || []);
      setTradeablePets(tradeableRes.data || []);
    } catch {
      setTrades([]);
      setMyPets([]);
      setTradeablePets([]);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const pendingCount = useMemo(() => trades.filter((trade) => trade.status === 'PENDING').length, [trades]);

  // Filter out own pets from tradeable pets list
  const otherUsersPets = useMemo(() => {
    if (!currentUser?.id) return tradeablePets;
    return tradeablePets.filter((pet) => pet.ownerId !== currentUser.id);
  }, [tradeablePets, currentUser]);

  const onCreateTrade = async () => {
    if (!offeredPetId || !requestedPetId) {
      return;
    }

    try {
      await createTrade({ offeredPetId: Number(offeredPetId), requestedPetId: Number(requestedPetId) });
      setOfferedPetId('');
      setRequestedPetId('');
      load();
    } catch {
      // noop
    }
  };

  const onAccept = async (tradeId) => {
    try {
      await acceptTrade(tradeId);
      load();
    } catch {
      // noop
    }
  };

  const onReject = async (tradeId) => {
    try {
      await rejectTrade(tradeId);
      load();
    } catch {
      // noop
    }
  };

  return (
    <AppLayout>
      <section className="market-page">
        <div className="market-header">
          <h1>Trade Offers</h1>
          <p>Create and manage trade offers</p>
        </div>

        <div className="panel-card" style={{ padding: 12, marginBottom: 12 }}>
          <h2 style={{ margin: '0 0 8px', fontSize: 20 }}>Create Trade Offer</h2>
          <div className="search-row">
            <select value={offeredPetId} onChange={(event) => setOfferedPetId(event.target.value)}>
              <option value="">Select your offered pet</option>
              {myPets.map((pet) => <option key={pet.id} value={pet.id}>{pet.name}</option>)}
            </select>
            <select value={requestedPetId} onChange={(event) => setRequestedPetId(event.target.value)}>
              <option value="">Select requested pet</option>
              {otherUsersPets.map((pet) => <option key={pet.id} value={pet.id}>{pet.name} ({pet.ownerName})</option>)}
            </select>
            <button className="btn-primary" onClick={onCreateTrade}>Submit Offer</button>
          </div>
        </div>

        <div className="stat-row" style={{ marginBottom: 12, gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
          <div className="panel-card stat-box"><div><div className="stat-value">{trades.length}</div><div className="stat-label">Total Offers</div></div></div>
          <div className="panel-card stat-box"><div><div className="stat-value">{pendingCount}</div><div className="stat-label">Pending</div></div></div>
        </div>

        <div className="panel-card table-wrap">
          <table className="flat-table">
            <thead>
              <tr>
                <th>Offered Pet</th>
                <th>Requested Pet</th>
                <th>Offer By</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {trades.map((trade) => (
                <tr key={trade.id}>
                  <td>{trade.offeredPetName}</td>
                  <td>{trade.requestedPetName}</td>
                  <td>{trade.offeringUserName}</td>
                  <td>{trade.status}</td>
                  <td style={{ display: 'flex', gap: 6 }}>
                    <button className="btn-primary" onClick={() => onAccept(trade.id)}>Accept</button>
                    <button className="btn-secondary" onClick={() => onReject(trade.id)}>Reject</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </AppLayout>
  );
}

export default Trades;
