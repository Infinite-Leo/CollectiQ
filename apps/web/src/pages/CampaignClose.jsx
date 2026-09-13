import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ShieldCheck,
    CheckCircle,
    AlertTriangle,
    Printer,
    Download,
    TrendingUp,
    Wallet,
    TrendingDown,
    ArrowRight,
    Lock,
    RefreshCw,
} from 'lucide-react';
import { formatIndianCurrency } from '../utils/indianNumberFormat';

export default function CampaignClose() {
    const navigate = useNavigate();
    const [isSettled, setIsSettled] = useState(false);
    const [rolledOver, setRolledOver] = useState(false);

    // Financial settlement figures for current festival
    const campaignSummary = {
        name: 'Durga Puja 2026',
        target_amount: 700000,
        total_collected: 624500,
        total_expenses: 527000,
        net_surplus: 97500,
        cash_vaulted: 345000,
        bank_upi_vaulted: 279500,
        total_donors: 265,
        pending_dues: 18500,
        collector_handovers_settled: true,
    };

    const handlePrintSettlement = () => {
        window.print();
    };

    const handleRollover = () => {
        setRolledOver(true);
        setTimeout(() => {
            alert('✓ 12 outstanding pledge accounts rolled over as expected contributions for Kali Puja 2026.');
        }, 300);
    };

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto', paddingBottom: '50px' }}>
            <style>
                {`
                @media print {
                    nav, header, aside, .no-print, button, .app-sidebar {
                        display: none !important;
                    }
                    body {
                        background: #FFFFFF !important;
                        color: #000000 !important;
                    }
                    .print-only {
                        display: block !important;
                    }
                    .settlement-card {
                        box-shadow: none !important;
                        border: none !important;
                    }
                }
                .print-only {
                    display: none;
                }
                `}
            </style>

            {/* Print Header */}
            <div className="print-only" style={{ marginBottom: '24px', borderBottom: '2px solid #000', paddingBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>DURGA PUJA SAMITY 2026</h1>
                        <p style={{ margin: '2px 0', fontSize: '0.875rem' }}>OFFICIAL CAMPAIGN AUDIT & FINANCIAL SETTLEMENT STATEMENT</p>
                    </div>
                    <div style={{ textAlign: 'right', fontSize: '0.8125rem' }}>
                        <div>Date: {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                        <div>Certified by CollectiQ Core</div>
                    </div>
                </div>
            </div>

            {/* Screen Header */}
            <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1B5E20', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <ShieldCheck size={26} color="#1B5E20" />
                        Campaign Settlement & Audit Close
                    </h1>
                    <p style={{ fontSize: '0.875rem', color: '#616161', marginTop: '4px' }}>
                        Final post-festival balance verification, expense reconciliation, and treasury settlement
                    </p>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                        type="button"
                        onClick={handlePrintSettlement}
                        style={{
                            padding: '10px 16px',
                            minHeight: '44px',
                            backgroundColor: '#FFFFFF',
                            border: '1px solid #BDBDBD',
                            color: '#212121',
                            fontWeight: 700,
                            fontSize: '0.8125rem',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                        }}
                    >
                        <Printer size={16} />
                        <span>Print Settlement Statement</span>
                    </button>
                </div>
            </div>

            {/* Settlement Status Banner */}
            <div
                style={{
                    backgroundColor: '#E8F5E9',
                    border: '1px solid #A5D6A7',
                    borderLeft: '5px solid #2E7D32',
                    borderRadius: '8px',
                    padding: '16px 20px',
                    marginBottom: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '12px',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <CheckCircle size={24} color="#2E7D32" />
                    <div>
                        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#1B5E20' }}>
                            All Collector Handovers Balanced & Accounted
                        </h3>
                        <p style={{ margin: '2px 0 0', fontSize: '0.8125rem', color: '#2E7D32' }}>
                            No unresolved cash discrepancies detected across 14 field collectors.
                        </p>
                    </div>
                </div>

                <span style={{ fontSize: '0.75rem', fontWeight: 800, backgroundColor: '#2E7D32', color: '#FFFFFF', padding: '4px 10px', borderRadius: '4px' }}>
                    READY FOR FINAL CLOSE
                </span>
            </div>

            {/* Financial Reconciliation Ledger Card */}
            <div
                className="settlement-card"
                style={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E0E0E0',
                    borderRadius: '8px',
                    padding: '24px',
                    marginBottom: '24px',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                }}
            >
                <h3 style={{ margin: '0 0 16px', fontSize: '1.125rem', fontWeight: 800, color: '#1B5E20' }}>
                    Durga Puja 2026 — Final Financial Statement
                </h3>

                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: '14px',
                        marginBottom: '24px',
                    }}
                >
                    <div style={{ padding: '14px', backgroundColor: '#F9F9FB', borderRadius: '6px', border: '1px solid #E0E0E0' }}>
                        <span style={{ fontSize: '0.75rem', color: '#616161', textTransform: 'uppercase', fontWeight: 700 }}>Total Collected</span>
                        <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1B5E20', marginTop: '4px' }}>
                            {formatIndianCurrency(campaignSummary.total_collected)}
                        </div>
                        <span style={{ fontSize: '0.75rem', color: '#2E7D32' }}>89.2% of target reached</span>
                    </div>

                    <div style={{ padding: '14px', backgroundColor: '#F9F9FB', borderRadius: '6px', border: '1px solid #E0E0E0' }}>
                        <span style={{ fontSize: '0.75rem', color: '#616161', textTransform: 'uppercase', fontWeight: 700 }}>Total Expenses Paid</span>
                        <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#C62828', marginTop: '4px' }}>
                            {formatIndianCurrency(campaignSummary.total_expenses)}
                        </div>
                        <span style={{ fontSize: '0.75rem', color: '#616161' }}>6 budget categories</span>
                    </div>

                    <div style={{ padding: '14px', backgroundColor: '#E8F5E9', borderRadius: '6px', border: '1px solid #A5D6A7' }}>
                        <span style={{ fontSize: '0.75rem', color: '#1B5E20', textTransform: 'uppercase', fontWeight: 800 }}>Net Treasury Surplus</span>
                        <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1B5E20', marginTop: '4px' }}>
                            {formatIndianCurrency(campaignSummary.net_surplus)}
                        </div>
                        <span style={{ fontSize: '0.75rem', color: '#2E7D32', fontWeight: 700 }}>✓ Bank vault balance</span>
                    </div>

                    <div style={{ padding: '14px', backgroundColor: '#FFF3E0', borderRadius: '6px', border: '1px solid #FFE0B2' }}>
                        <span style={{ fontSize: '0.75rem', color: '#E65100', textTransform: 'uppercase', fontWeight: 700 }}>Unpaid Pledges</span>
                        <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#E65100', marginTop: '4px' }}>
                            {formatIndianCurrency(campaignSummary.pending_dues)}
                        </div>
                        <span style={{ fontSize: '0.75rem', color: '#616161' }}>12 accounts pending</span>
                    </div>
                </div>

                {/* Rollover Section */}
                <div
                    className="no-print"
                    style={{
                        padding: '16px',
                        backgroundColor: '#F9F9FB',
                        borderRadius: '6px',
                        border: '1px solid #E0E0E0',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '12px',
                    }}
                >
                    <div>
                        <h4 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 800, color: '#212121' }}>
                            Rollover Outstanding Pledges
                        </h4>
                        <p style={{ margin: '2px 0 0', fontSize: '0.8125rem', color: '#616161' }}>
                            Transfer the remaining ₹18,500 in pending balances as expected pledges for Kali Puja 2026.
                        </p>
                    </div>

                    <button
                        type="button"
                        disabled={rolledOver}
                        onClick={handleRollover}
                        style={{
                            minHeight: '44px',
                            padding: '8px 16px',
                            backgroundColor: rolledOver ? '#E0E0E0' : '#E65100',
                            color: rolledOver ? '#757575' : '#FFFFFF',
                            border: 'none',
                            borderRadius: '6px',
                            fontWeight: 800,
                            fontSize: '0.8125rem',
                            cursor: rolledOver ? 'default' : 'pointer',
                        }}
                    >
                        {rolledOver ? '✓ Rolled Over to Kali Puja' : 'Roll Over Unpaid Accounts'}
                    </button>
                </div>

                {/* Committee Signature Blocks for Print */}
                <div className="print-only" style={{ marginTop: '70px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '30px', textAlign: 'center' }}>
                    <div style={{ borderTop: '1px solid #000', paddingTop: '8px' }}>
                        <div style={{ fontWeight: 800 }}>Dr. A. K. Sen</div>
                        <div style={{ fontSize: '0.75rem' }}>President, Samity</div>
                    </div>
                    <div style={{ borderTop: '1px solid #000', paddingTop: '8px' }}>
                        <div style={{ fontWeight: 800 }}>Mr. Alok Mukherjee</div>
                        <div style={{ fontSize: '0.75rem' }}>General Secretary</div>
                    </div>
                    <div style={{ borderTop: '1px solid #000', paddingTop: '8px' }}>
                        <div style={{ fontWeight: 800 }}>Mr. B. K. Roy</div>
                        <div style={{ fontSize: '0.75rem' }}>Treasurer & Cashier</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
