import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Clock3, Inbox, Send, XCircle } from 'lucide-react';
import AppLayout from '../../components/AppLayout/AppLayout';
import { createTradeOffer, getMyPets, getPets, getTradeOffers, acceptTradeOffer, rejectTradeOffer } from '../../services/api';
import { getStoredUser } from '../../utils/auth';
import './Trades.css';

function Trades() {
  const [trades, setTrades] = useState([]);
  const [myPets, setMyPets] = useState([]);
  const [tradeablePets, setTradeablePets] = useState([]);
  const [offeredPetId, setOfferedPetId] = useState('');
  const [requestedPetId, setRequestedPetId] = useState('');
  const [loadError, setLoadError] = useState('');
  const [actionMessage, setActionMessage] = useState('');
  const [actingTradeId, setActingTradeId] = useState(null);
  const currentUser = getStoredUser();

  const load = useCallback(async () => {
    setLoadError('');
    try {
      const [tradesRes, myPetsRes, tradeableRes] = await Promise.all([
        getTradeOffers(),
        getMyPets(),
        getPets({ listingType: 'TRADE' }),
      ]);
      setTrades(tradesRes.data || []);
      setMyPets(myPetsRes.data?.content || []);
      setTradeablePets(tradeableRes.data?.content || []);
    } catch (error) {
      setTrades([]);
      setMyPets([]);
      setTradeablePets([]);
      setLoadError(error?.response?.data?.error || error?.response?.data?.message || 'Unable to load trade offers.');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Filter out own pets from tradeable pets list
  const otherUsersPets = useMemo(() => {
    if (!currentUser?.id) return tradeablePets;
    return tradeablePets.filter((pet) => pet.ownerId !== currentUser.id);
  }, [tradeablePets, currentUser]);

  const visibleTrades = useMemo(() => {
    if (!currentUser?.id) {
      return trades;
    }

    return trades.filter((trade) =>
      trade.offeringUserId === currentUser.id
      || trade.offeredPetOwnerId === currentUser.id
      || trade.requestedPetOwnerId === currentUser.id
    );
  }, [trades, currentUser?.id]);

  const pendingCount = useMemo(() => visibleTrades.filter((trade) => trade.status === 'PENDING').length, [visibleTrades]);
  const incomingCount = useMemo(() => visibleTrades.filter((trade) => trade.status === 'PENDING' && trade.requestedPetOwnerId === currentUser?.id).length, [visibleTrades, currentUser?.id]);

  const replaceTrade = (updatedTrade) => {
    setTrades((currentTrades) =>
      currentTrades.map((trade) => (trade.id === updatedTrade.id ? updatedTrade : trade))
    );
  };

  const onCreateTrade = async () => {
    if (!offeredPetId || !requestedPetId) {
      return;
    }

    setActionMessage('');
    try {
      await createTradeOffer({ offeredPetId: Number(offeredPetId), requestedPetId: Number(requestedPetId) });
      setOfferedPetId('');
      setRequestedPetId('');
      setActionMessage('Trade offer submitted.');
      load();
    } catch (error) {
      setActionMessage(error?.response?.data?.error || error?.response?.data?.message || 'Unable to submit trade offer.');
    }
  };

  const onAccept = async (tradeId) => {
    setActingTradeId(tradeId);
    setActionMessage('');
    try {
      const response = await acceptTradeOffer(tradeId);
      replaceTrade(response.data);
      setActionMessage('Trade accepted.');
    } catch (error) {
      setActionMessage(error?.response?.data?.error || error?.response?.data?.message || 'Unable to accept trade.');
    } finally {
      setActingTradeId(null);
    }
  };

  const onReject = async (tradeId) => {
    setActingTradeId(tradeId);
    setActionMessage('');
    try {
      const response = await rejectTradeOffer(tradeId);
      replaceTrade(response.data);
      setActionMessage('Trade rejected.');
    } catch (error) {
      setActionMessage(error?.response?.data?.error || error?.response?.data?.message || 'Unable to reject trade.');
    } finally {
      setActingTradeId(null);
    }
  };

  const getDirection = (trade) => {
    if (trade.offeringUserId === currentUser?.id) {
      return { label: 'Outgoing', icon: Send };
    }
    return { label: 'Incoming', icon: Inbox };
  };

  const getStatusMeta = (status) => {
    const normalized = String(status || '').toUpperCase();
    if (normalized === 'ACCEPTED') {
      return { label: 'Accepted', className: 'accepted', icon: CheckCircle2 };
    }
    if (normalized === 'REJECTED') {
      return { label: 'Rejected', className: 'rejected', icon: XCircle };
    }
    return { label: 'Pending', className: 'pending', icon: Clock3 };
  };

  const canRespond = (trade) => {
    return trade.status === 'PENDING' && trade.requestedPetOwnerId === currentUser?.id;
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

        {loadError && <div className="trade-alert error">{loadError}</div>}
        {actionMessage && <div className="trade-alert">{actionMessage}</div>}

        <div className="stat-row" style={{ marginBottom: 12, gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
          <div className="panel-card stat-box"><div><div className="stat-value">{visibleTrades.length}</div><div className="stat-label">Total Offers</div></div></div>
          <div className="panel-card stat-box"><div><div className="stat-value">{pendingCount}</div><div className="stat-label">Pending</div></div></div>
          <div className="panel-card stat-box"><div><div className="stat-value">{incomingCount}</div><div className="stat-label">Needs Response</div></div></div>
        </div>

        <div className="panel-card table-wrap">
          <table className="flat-table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Offered Pet</th>
                <th>Requested Pet</th>
                <th>Offer By</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {visibleTrades.map((trade) => {
                const DirectionIcon = getDirection(trade).icon;
                const statusMeta = getStatusMeta(trade.status);
                const StatusIcon = statusMeta.icon;
                const isActing = actingTradeId === trade.id;

                return (
                  <tr key={trade.id}>
                    <td>
                      <span className="trade-direction">
                        <DirectionIcon size={14} />
                        {getDirection(trade).label}
                      </span>
                    </td>
                    <td>
                      {trade.offeredPetName}
                      <div className="pet-meta">{trade.offeredPetOwnerName || trade.offeringUserName}</div>
                    </td>
                    <td>
                      {trade.requestedPetName}
                      <div className="pet-meta">{trade.requestedPetOwnerName || 'Requested owner'}</div>
                    </td>
                    <td>{trade.offeringUserName}</td>
                    <td>
                      <span className={`trade-status ${statusMeta.className}`}>
                        <StatusIcon size={14} />
                        {statusMeta.label}
                      </span>
                    </td>
                    <td>
                      {canRespond(trade) ? (
                        <div className="trade-actions">
                          <button className="btn-primary" disabled={isActing} onClick={() => onAccept(trade.id)}>Accept</button>
                          <button className="btn-secondary" disabled={isActing} onClick={() => onReject(trade.id)}>Reject</button>
                        </div>
                      ) : (
                        <span className="trade-note">
                          {trade.status === 'PENDING' ? 'Waiting for owner' : statusMeta.label}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {visibleTrades.length === 0 && (
                <tr>
                  <td colSpan="6" className="trade-empty">No trade offers yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </AppLayout>
  );
}

export default Trades;
