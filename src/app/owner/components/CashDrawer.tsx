'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
  Wallet,
  ArrowDownCircle,
  ArrowUpCircle,
  CheckCircle2,
  AlertCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  History,
  RefreshCw,
  Banknote,
  Calculator,
  ChevronDown,
  ChevronUp,
  CreditCard,
} from 'lucide-react';
import { CashDrawerRecord, CashDrawerStatus, CashDrawerHistory } from '@/types/cashDrawer';

interface CashDrawerProps {
  cafeId: string;
  isOwner: boolean; // true if logged in user is owner, false if staff
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatTime = (isoString: string | null) => {
  if (!isoString) return '-';
  return new Date(isoString).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
};

export default function CashDrawer({ cafeId, isOwner }: CashDrawerProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [drawerRecord, setDrawerRecord] = useState<CashDrawerRecord | null>(null);
  const [cashSalesToday, setCashSalesToday] = useState(0);
  const [onlineSalesToday, setOnlineSalesToday] = useState(0);
  const [totalBookingsToday, setTotalBookingsToday] = useState(0);
  const [cashSalesAfterCollection, setCashSalesAfterCollection] = useState(0);
  const [history, setHistory] = useState<CashDrawerHistory[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  // Form state for owner collection
  const [collectAmount, setCollectAmount] = useState('');
  const [changeAmount, setChangeAmount] = useState('');

  // Discrepancy state
  const [actualClosing, setActualClosing] = useState('');
  const [discrepancyNote, setDiscrepancyNote] = useState('');

  const today = new Date().toISOString().split('T')[0];

  // Fetch cash drawer data
  const fetchData = useCallback(async () => {
    // Guard against empty cafeId (can happen before cafes load)
    if (!cafeId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Get or create today's record
      let { data: record, error } = await supabase
        .from('cash_drawer')
        .select('*')
        .eq('cafe_id', cafeId)
        .eq('date', today)
        .maybeSingle();

      if (!record && !error) {
        // No record for today, get yesterday's closing as opening balance
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        const { data: yesterdayRecord } = await supabase
          .from('cash_drawer')
          .select('expected_closing, actual_closing')
          .eq('cafe_id', cafeId)
          .eq('date', yesterdayStr)
          .maybeSingle();

        const openingBalance = yesterdayRecord?.actual_closing ?? yesterdayRecord?.expected_closing ?? 0;

        // Create today's record
        const { data: newRecord, error: insertError } = await supabase
          .from('cash_drawer')
          .insert({
            cafe_id: cafeId,
            date: today,
            opening_balance: openingBalance,
          })
          .select()
          .maybeSingle();

        if (insertError) {
          // Warn instead of error for RLS issues (database policy pending)
          console.warn('Could not create cash drawer record (likely RLS policy):', insertError.message);
          // Continue without a record - show cash sales only
          record = null;
        } else {
          record = newRecord;
        }
      } else if (error) {
        console.warn('Error fetching cash drawer:', error.message);
        record = null;
      }

      setDrawerRecord(record);

      // Fetch today's bookings (filter cancelled in JS to avoid query issues)
      console.log('[CashDrawer] Fetching bookings for cafe:', cafeId, 'date:', today);

      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('id, total_amount, payment_mode, source, status, created_at')
        .eq('cafe_id', cafeId)
        .eq('booking_date', today);

      if (bookingsError) {
        console.error('[CashDrawer] Error fetching bookings:', bookingsError);
      }

      console.log('[CashDrawer] Raw bookings:', bookings);

      // Filter out cancelled bookings (matching Dashboard logic)
      const allBookings = (bookings || []).filter(b => b.status !== 'cancelled');
      setTotalBookingsToday(allBookings.length);

      // Filter for cash payments - match DashboardStats logic exactly
      const cashBookings = allBookings.filter(b => {
        const mode = (b.payment_mode || '').toLowerCase();
        return mode === 'cash';
      });

      // Online/UPI payments
      const onlineBookings = allBookings.filter(b => {
        const mode = (b.payment_mode || '').toLowerCase();
        return mode === 'upi' || mode === 'online';
      });

      const totalCashSales = cashBookings.reduce((sum, b) => sum + (b.total_amount || 0), 0);
      const totalOnlineSales = onlineBookings.reduce((sum, b) => sum + (b.total_amount || 0), 0);

      setCashSalesToday(totalCashSales);
      setOnlineSalesToday(totalOnlineSales);

      console.log('[CashDrawer] Bookings breakdown - Total:', allBookings.length, 'Cash:', cashBookings.length, 'Online:', onlineBookings.length);
      console.log('[CashDrawer] Payment modes found:', allBookings.map(b => ({ id: b.id, mode: b.payment_mode, status: b.status, amount: b.total_amount })));

      // If collection has been done, calculate cash sales after collection
      if (record?.collection_time) {
        const collectionTime = new Date(record.collection_time);
        const salesAfter = cashBookings
          .filter(b => new Date(b.created_at) > collectionTime)
          .reduce((sum, b) => sum + (b.total_amount || 0), 0);
        setCashSalesAfterCollection(salesAfter);
      } else {
        setCashSalesAfterCollection(0);
      }

      // Fetch history (last 30 days) - only for owner
      if (isOwner) {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const { data: historyData } = await supabase
          .from('cash_drawer')
          .select('*')
          .eq('cafe_id', cafeId)
          .gte('date', thirtyDaysAgo.toISOString().split('T')[0])
          .lt('date', today)
          .order('date', { ascending: false });

        if (historyData) {
          setHistory(historyData.map(h => ({
            id: h.id,
            date: h.date,
            openingBalance: h.opening_balance || 0,
            totalCashSales: 0, // Would need to calculate from bookings
            amountCollected: h.amount_collected || 0,
            changeLeft: h.change_left || 0,
            expectedClosing: h.expected_closing || 0,
            actualClosing: h.actual_closing,
            hasDiscrepancy: h.has_discrepancy || false,
            discrepancyAmount: h.discrepancy_amount,
            discrepancyNote: h.discrepancy_note,
          })));
        }
      }
    } catch (err) {
      console.error('Error fetching cash drawer data:', err);
    } finally {
      setLoading(false);
    }
  }, [cafeId, today, isOwner]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Calculate expected cash in drawer
  const status = useMemo<CashDrawerStatus>(() => {
    const openingBalance = drawerRecord?.opening_balance || 0;
    const hasCollected = !!drawerRecord?.collection_time;
    const changeLeft = drawerRecord?.change_left || 0;

    let expectedClosing = 0;
    if (hasCollected) {
      expectedClosing = changeLeft + cashSalesAfterCollection;
    } else {
      expectedClosing = openingBalance + cashSalesToday;
    }

    return {
      date: today,
      openingBalance,
      cashSalesToday,
      expectedInDrawer: openingBalance + cashSalesToday,
      hasCollected,
      amountCollected: drawerRecord?.amount_collected || null,
      changeLeft: hasCollected ? changeLeft : null,
      collectionTime: drawerRecord?.collection_time || null,
      staffVerifiedChange: drawerRecord?.staff_verified_change || false,
      cashSalesAfterCollection,
      expectedClosing,
      closingVerified: drawerRecord?.closing_verified || false,
      hasDiscrepancy: drawerRecord?.has_discrepancy || false,
      discrepancyAmount: drawerRecord?.discrepancy_amount || null,
    };
  }, [drawerRecord, cashSalesToday, cashSalesAfterCollection, today]);

  // Owner: Submit collection
  const handleCollection = async () => {
    if (!collectAmount || !changeAmount) return;
    setSaving(true);

    try {
      const collectionTime = new Date().toISOString();
      const { error } = await supabase
        .from('cash_drawer')
        .update({
          amount_collected: parseFloat(collectAmount),
          change_left: parseFloat(changeAmount),
          collection_time: collectionTime,
          staff_verified_change: false,
        })
        .eq('id', drawerRecord?.id);

      if (error) throw error;

      setCollectAmount('');
      setChangeAmount('');
      await fetchData();
    } catch (err) {
      console.error('Error saving collection:', err);
    } finally {
      setSaving(false);
    }
  };

  // Staff: Verify change amount
  const handleVerifyChange = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('cash_drawer')
        .update({
          staff_verified_change: true,
          staff_verified_at: new Date().toISOString(),
        })
        .eq('id', drawerRecord?.id);

      if (error) throw error;
      await fetchData();
    } catch (err) {
      console.error('Error verifying change:', err);
    } finally {
      setSaving(false);
    }
  };

  // Staff: Verify closing (matches expected)
  const handleVerifyClosing = async (hasDiscrepancy: boolean) => {
    setSaving(true);
    try {
      const updateData: Partial<CashDrawerRecord> = {
        closing_verified: true,
        closing_verified_at: new Date().toISOString(),
        expected_closing: status.expectedClosing,
        has_discrepancy: hasDiscrepancy,
      };

      if (hasDiscrepancy && actualClosing) {
        updateData.actual_closing = parseFloat(actualClosing);
        updateData.discrepancy_amount = parseFloat(actualClosing) - status.expectedClosing;
        updateData.discrepancy_note = discrepancyNote || null;
      } else {
        updateData.actual_closing = status.expectedClosing;
        updateData.discrepancy_amount = 0;
      }

      const { error } = await supabase
        .from('cash_drawer')
        .update(updateData)
        .eq('id', drawerRecord?.id);

      if (error) throw error;

      setActualClosing('');
      setDiscrepancyNote('');
      await fetchData();
    } catch (err) {
      console.error('Error verifying closing:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="w-8 h-8 animate-spin text-slate-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <Wallet className="w-7 h-7 text-green-500" />
            Cash Drawer
          </h2>
          <p className="text-slate-400 mt-1">{formatDate(today)}</p>
        </div>
        <button
          onClick={fetchData}
          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors"
        >
          <RefreshCw className="w-5 h-5 text-slate-400" />
        </button>
      </div>

      {/* Current Status Card */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl border border-slate-700/50 p-6">
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
          Current Status
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          {/* Opening Balance */}
          <div className="bg-slate-800/50 rounded-xl p-4">
            <div className="flex items-center gap-2 text-slate-400 text-xs mb-2">
              <ArrowUpCircle className="w-4 h-4" />
              Opening Balance
            </div>
            <p className="text-xl font-bold text-white">
              {formatCurrency(status.openingBalance)}
            </p>
          </div>

          {/* Cash Sales Today */}
          <div className="bg-slate-800/50 rounded-xl p-4">
            <div className="flex items-center gap-2 text-slate-400 text-xs mb-2">
              <Banknote className="w-4 h-4" />
              Cash Sales Today
            </div>
            <p className="text-xl font-bold text-green-400">
              +{formatCurrency(status.cashSalesToday)}
            </p>
          </div>

          {/* Expected in Drawer */}
          <div className="bg-slate-800/50 rounded-xl p-4">
            <div className="flex items-center gap-2 text-slate-400 text-xs mb-2">
              <Calculator className="w-4 h-4" />
              {status.hasCollected ? 'Expected at Closing' : 'Expected in Drawer'}
            </div>
            <p className="text-xl font-bold text-blue-400">
              {formatCurrency(status.hasCollected ? status.expectedClosing : status.expectedInDrawer)}
            </p>
          </div>

          {/* Status */}
          <div className="bg-slate-800/50 rounded-xl p-4">
            <div className="flex items-center gap-2 text-slate-400 text-xs mb-2">
              <Clock className="w-4 h-4" />
              Status
            </div>
            {status.closingVerified ? (
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                <span className="text-green-400 font-semibold">Day Closed</span>
              </div>
            ) : status.hasCollected ? (
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-blue-500" />
                <span className="text-blue-400 font-semibold">Collected</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-yellow-500" />
                <span className="text-yellow-400 font-semibold">Pending</span>
              </div>
            )}
          </div>
        </div>

        {/* Today's Sales Breakdown */}
        <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/50">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-slate-300">Today&apos;s Sales Breakdown</span>
            <span className="text-xs text-slate-500">{totalBookingsToday} booking{totalBookingsToday !== 1 ? 's' : ''}</span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
              <div className="flex items-center gap-2">
                <Banknote className="w-4 h-4 text-green-400" />
                <span className="text-sm text-slate-300">Cash</span>
              </div>
              <span className="text-lg font-bold text-green-400">{formatCurrency(cashSalesToday)}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-purple-400" />
                <span className="text-sm text-slate-300">Online/UPI</span>
              </div>
              <span className="text-lg font-bold text-purple-400">{formatCurrency(onlineSalesToday)}</span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-700/50 flex items-center justify-between">
            <span className="text-sm text-slate-400">Total Revenue</span>
            <span className="text-lg font-bold text-white">{formatCurrency(cashSalesToday + onlineSalesToday)}</span>
          </div>
        </div>
      </div>

      {/* Owner Collection Section */}
      {isOwner && !status.hasCollected && !status.closingVerified && (
        <div className="bg-gradient-to-br from-green-900/20 to-slate-900 rounded-2xl border border-green-500/30 p-6">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <ArrowDownCircle className="w-5 h-5 text-green-500" />
            Collect Cash
          </h3>

          {/* Expected amount display */}
          <div className="bg-slate-800/50 rounded-xl p-4 mb-4">
            <p className="text-sm text-slate-400 mb-1">Expected cash in drawer right now:</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-white">
                {formatCurrency(status.expectedInDrawer)}
              </span>
              <span className="text-sm text-slate-500">
                ({formatCurrency(status.openingBalance)} opening + {formatCurrency(status.cashSalesToday)} sales)
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm text-slate-400 mb-2">
                Amount Collecting
              </label>
              <input
                type="number"
                value={collectAmount}
                onChange={(e) => setCollectAmount(e.target.value)}
                placeholder="e.g., 4500"
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-green-500"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-2">
                Change Left in Drawer
              </label>
              <input
                type="number"
                value={changeAmount}
                onChange={(e) => setChangeAmount(e.target.value)}
                placeholder="e.g., 500"
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-green-500"
              />
            </div>
          </div>

          {collectAmount && changeAmount && (
            <div className="bg-slate-800/50 rounded-xl p-3 mb-4 text-sm">
              <span className="text-slate-400">Verification: </span>
              <span className="text-white">
                {formatCurrency(parseFloat(collectAmount))} + {formatCurrency(parseFloat(changeAmount))} = {formatCurrency(parseFloat(collectAmount) + parseFloat(changeAmount))}
              </span>
              {Math.abs((parseFloat(collectAmount) + parseFloat(changeAmount)) - status.expectedInDrawer) > 1 && (
                <span className="text-yellow-400 ml-2">
                  (Differs from expected by {formatCurrency(Math.abs((parseFloat(collectAmount) + parseFloat(changeAmount)) - status.expectedInDrawer))})
                </span>
              )}
            </div>
          )}

          <button
            onClick={handleCollection}
            disabled={saving || !collectAmount || !changeAmount}
            className="w-full md:w-auto px-6 py-3 bg-green-600 hover:bg-green-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-semibold rounded-xl transition-colors"
          >
            {saving ? 'Saving...' : 'Confirm Collection'}
          </button>
        </div>
      )}

      {/* Collection Summary (after owner collects) */}
      {status.hasCollected && (
        <div className="bg-gradient-to-br from-blue-900/20 to-slate-900 rounded-2xl border border-blue-500/30 p-6">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-blue-500" />
            Collection Summary
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="bg-slate-800/50 rounded-xl p-4">
              <p className="text-xs text-slate-400 mb-1">Collected at</p>
              <p className="text-lg font-semibold text-white">
                {formatTime(status.collectionTime)}
              </p>
            </div>
            <div className="bg-slate-800/50 rounded-xl p-4">
              <p className="text-xs text-slate-400 mb-1">Amount Collected</p>
              <p className="text-lg font-semibold text-green-400">
                {formatCurrency(status.amountCollected || 0)}
              </p>
            </div>
            <div className="bg-slate-800/50 rounded-xl p-4">
              <p className="text-xs text-slate-400 mb-1">Change Left</p>
              <p className="text-lg font-semibold text-blue-400">
                {formatCurrency(status.changeLeft || 0)}
              </p>
            </div>
            <div className="bg-slate-800/50 rounded-xl p-4">
              <p className="text-xs text-slate-400 mb-1">Staff Verified</p>
              {status.staffVerifiedChange ? (
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  <span className="text-green-400">Yes</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-yellow-500" />
                  <span className="text-yellow-400">Pending</span>
                </div>
              )}
            </div>
          </div>

          {/* Staff Verification Button */}
          {!status.staffVerifiedChange && !isOwner && (
            <button
              onClick={handleVerifyChange}
              disabled={saving}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-white font-semibold rounded-xl transition-colors"
            >
              {saving ? 'Verifying...' : `Verify ${formatCurrency(status.changeLeft || 0)} is in Drawer`}
            </button>
          )}
        </div>
      )}

      {/* Sales After Collection */}
      {status.hasCollected && status.cashSalesAfterCollection > 0 && (
        <div className="bg-slate-800/50 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Cash Sales After Collection</p>
              <p className="text-xl font-bold text-green-400">
                +{formatCurrency(status.cashSalesAfterCollection)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-400">Expected at Closing</p>
              <p className="text-xl font-bold text-white">
                {formatCurrency(status.expectedClosing)}
              </p>
              <p className="text-xs text-slate-500">
                ({formatCurrency(status.changeLeft || 0)} + {formatCurrency(status.cashSalesAfterCollection)})
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Closing Verification */}
      {status.hasCollected && status.staffVerifiedChange && !status.closingVerified && (
        <div className="bg-gradient-to-br from-purple-900/20 to-slate-900 rounded-2xl border border-purple-500/30 p-6">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Calculator className="w-5 h-5 text-purple-500" />
            End of Day Verification
          </h3>

          <div className="bg-slate-800/50 rounded-xl p-4 mb-4">
            <p className="text-sm text-slate-400 mb-1">Expected cash in drawer:</p>
            <p className="text-3xl font-bold text-white">
              {formatCurrency(status.expectedClosing)}
            </p>
            <p className="text-sm text-slate-500 mt-1">
              {formatCurrency(status.changeLeft || 0)} (change) + {formatCurrency(status.cashSalesAfterCollection)} (sales after collection)
            </p>
          </div>

          <div className="flex flex-col md:flex-row gap-4">
            <button
              onClick={() => handleVerifyClosing(false)}
              disabled={saving}
              className="flex-1 px-6 py-4 bg-green-600 hover:bg-green-500 disabled:bg-slate-700 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-5 h-5" />
              {saving ? 'Verifying...' : 'Matches - Close Day'}
            </button>
            <button
              onClick={() => setActualClosing(actualClosing ? '' : '0')}
              className="flex-1 px-6 py-4 bg-red-600/20 hover:bg-red-600/30 border border-red-500/50 text-red-400 font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <AlertCircle className="w-5 h-5" />
              Report Discrepancy
            </button>
          </div>

          {/* Discrepancy Form */}
          {actualClosing !== '' && (
            <div className="mt-4 p-4 bg-red-900/20 rounded-xl border border-red-500/30">
              <div className="mb-4">
                <label className="block text-sm text-slate-400 mb-2">
                  Actual Amount in Drawer
                </label>
                <input
                  type="number"
                  value={actualClosing}
                  onChange={(e) => setActualClosing(e.target.value)}
                  placeholder="Enter actual amount"
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
                />
              </div>
              {actualClosing && parseFloat(actualClosing) !== status.expectedClosing && (
                <div className="mb-4 p-3 bg-slate-800/50 rounded-lg">
                  <p className="text-sm text-slate-400">Discrepancy Amount:</p>
                  <p className={`text-xl font-bold ${parseFloat(actualClosing) > status.expectedClosing ? 'text-green-400' : 'text-red-400'}`}>
                    {parseFloat(actualClosing) > status.expectedClosing ? '+' : ''}{formatCurrency(parseFloat(actualClosing) - status.expectedClosing)}
                  </p>
                </div>
              )}
              <div className="mb-4">
                <label className="block text-sm text-slate-400 mb-2">
                  Note (optional)
                </label>
                <textarea
                  value={discrepancyNote}
                  onChange={(e) => setDiscrepancyNote(e.target.value)}
                  placeholder="Explain the discrepancy..."
                  rows={2}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-red-500 resize-none"
                />
              </div>
              <button
                onClick={() => handleVerifyClosing(true)}
                disabled={saving || !actualClosing}
                className="w-full px-6 py-3 bg-red-600 hover:bg-red-500 disabled:bg-slate-700 text-white font-semibold rounded-xl transition-colors"
              >
                {saving ? 'Saving...' : 'Confirm Discrepancy & Close Day'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Day Closed Summary */}
      {status.closingVerified && (
        <div className={`rounded-2xl border p-6 ${status.hasDiscrepancy ? 'bg-red-900/20 border-red-500/30' : 'bg-green-900/20 border-green-500/30'}`}>
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            {status.hasDiscrepancy ? (
              <>
                <AlertCircle className="w-5 h-5 text-red-500" />
                Day Closed with Discrepancy
              </>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                Day Closed Successfully
              </>
            )}
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-slate-800/50 rounded-xl p-4">
              <p className="text-xs text-slate-400 mb-1">Expected</p>
              <p className="text-lg font-semibold text-white">
                {formatCurrency(status.expectedClosing)}
              </p>
            </div>
            <div className="bg-slate-800/50 rounded-xl p-4">
              <p className="text-xs text-slate-400 mb-1">Actual</p>
              <p className="text-lg font-semibold text-white">
                {formatCurrency(drawerRecord?.actual_closing || status.expectedClosing)}
              </p>
            </div>
            {status.hasDiscrepancy && (
              <div className="bg-slate-800/50 rounded-xl p-4">
                <p className="text-xs text-slate-400 mb-1">Discrepancy</p>
                <p className={`text-lg font-semibold ${(status.discrepancyAmount || 0) > 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {(status.discrepancyAmount || 0) > 0 ? '+' : ''}{formatCurrency(status.discrepancyAmount || 0)}
                </p>
              </div>
            )}
          </div>

          {drawerRecord?.discrepancy_note && (
            <div className="mt-4 p-3 bg-slate-800/50 rounded-lg">
              <p className="text-xs text-slate-400 mb-1">Note:</p>
              <p className="text-sm text-white">{drawerRecord.discrepancy_note}</p>
            </div>
          )}
        </div>
      )}

      {/* History Section (Owner Only) */}
      {isOwner && (
        <div className="bg-slate-900/50 rounded-2xl border border-slate-700/50">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="w-full px-6 py-4 flex items-center justify-between text-left"
          >
            <div className="flex items-center gap-3">
              <History className="w-5 h-5 text-slate-400" />
              <span className="text-lg font-semibold text-white">History</span>
              <span className="text-sm text-slate-500">Last 30 days</span>
            </div>
            {showHistory ? (
              <ChevronUp className="w-5 h-5 text-slate-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-slate-400" />
            )}
          </button>

          {showHistory && (
            <div className="px-6 pb-6">
              {history.length === 0 ? (
                <p className="text-slate-500 text-center py-8">No history available</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-xs text-slate-500 uppercase">
                        <th className="pb-3">Date</th>
                        <th className="pb-3">Collected</th>
                        <th className="pb-3">Change Left</th>
                        <th className="pb-3">Closing</th>
                        <th className="pb-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm">
                      {history.map((h) => (
                        <tr key={h.id} className="border-t border-slate-800">
                          <td className="py-3 text-white">{formatDate(h.date)}</td>
                          <td className="py-3 text-green-400">{formatCurrency(h.amountCollected)}</td>
                          <td className="py-3 text-blue-400">{formatCurrency(h.changeLeft)}</td>
                          <td className="py-3 text-white">{formatCurrency(h.actualClosing || h.expectedClosing)}</td>
                          <td className="py-3">
                            {h.hasDiscrepancy ? (
                              <span className="px-2 py-1 text-xs rounded-full bg-red-500/20 text-red-400">
                                {h.discrepancyAmount && h.discrepancyAmount > 0 ? '+' : ''}{formatCurrency(h.discrepancyAmount || 0)}
                              </span>
                            ) : (
                              <span className="px-2 py-1 text-xs rounded-full bg-green-500/20 text-green-400">
                                OK
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
