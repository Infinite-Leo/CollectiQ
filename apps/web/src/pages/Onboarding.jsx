import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
    Sparkles,
    CheckCircle,
    ArrowRight,
    ArrowLeft,
    Building2,
    Calendar,
    Target,
    Upload,
    Check,
} from 'lucide-react';
import { apiFetch } from '../utils/api';
import { formatIndianCurrency } from '../utils/indianNumberFormat';

export default function Onboarding() {
    const navigate = useNavigate();
    const [step, setStep] = useState(1); // 1: Org, 2: Campaign, 3: Import or Blank

    // Org details
    const [orgName, setOrgName] = useState('Ballygunge Cultural Association');
    const [city, setCity] = useState('Kolkata, West Bengal');
    const [establishedYear, setEstablishedYear] = useState('1972');

    // Campaign details
    const [campaignName, setCampaignName] = useState('Durga Puja 2026');
    const [targetAmount, setTargetAmount] = useState('700000');
    const [startDate, setStartDate] = useState('2026-09-01');
    const [endDate, setEndDate] = useState('2026-10-25');

    const handleFinish = () => {
        // Save initial preferences to localStorage
        localStorage.setItem('collectiq_org_name', orgName);
        localStorage.setItem('collectiq_active_campaign', campaignName);
        localStorage.setItem('collectiq_target_amount', targetAmount);
        navigate('/dashboard');
    };

    return (
        <div style={{ maxWidth: '720px', margin: '40px auto', padding: '0 20px', paddingBottom: '60px' }}>
            {/* Header / Brand */}
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                <div
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '56px',
                        height: '56px',
                        borderRadius: '12px',
                        backgroundColor: '#1B5E20',
                        color: '#FFFFFF',
                        marginBottom: '12px',
                    }}
                >
                    <Sparkles size={28} />
                </div>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#1B5E20', margin: '0 0 6px' }}>
                    Welcome to CollectiQ
                </h1>
                <p style={{ fontSize: '0.9375rem', color: '#616161', margin: 0 }}>
                    Let’s get your puja committee and festival campaign set up in 2 minutes
                </p>
            </div>

            {/* Step Indicator */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '16px',
                    marginBottom: '28px',
                }}
            >
                {[
                    { s: 1, label: 'Committee' },
                    { s: 2, label: 'Festival Campaign' },
                    { s: 3, label: 'Get Started' },
                ].map((item) => (
                    <div
                        key={item.s}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontWeight: 700,
                            fontSize: '0.8125rem',
                            color: step >= item.s ? '#1B5E20' : '#9E9E9E',
                        }}
                    >
                        <div
                            style={{
                                width: '26px',
                                height: '26px',
                                borderRadius: '50%',
                                backgroundColor: step >= item.s ? '#1B5E20' : '#E0E0E0',
                                color: step >= item.s ? '#FFFFFF' : '#757575',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.75rem',
                            }}
                        >
                            {step > item.s ? '✓' : item.s}
                        </div>
                        <span>{item.label}</span>
                    </div>
                ))}
            </div>

            {/* STEP 1: ORGANIZATION / COMMITTEE */}
            {step === 1 && (
                <div
                    style={{
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #E0E0E0',
                        borderTop: '4px solid #1B5E20',
                        borderRadius: '8px',
                        padding: '28px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                    }}
                >
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#212121', margin: '0 0 4px' }}>
                        Step 1: Committee / Club Details
                    </h2>
                    <p style={{ fontSize: '0.8125rem', color: '#616161', margin: '0 0 20px' }}>
                        This will appear on digital donation receipts, WhatsApp messages, and official reports.
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, marginBottom: '6px' }}>
                                Club / Puja Samity Full Name *
                            </label>
                            <input
                                type="text"
                                required
                                value={orgName}
                                onChange={(e) => setOrgName(e.target.value)}
                                placeholder="e.g. Ballygunge Cultural Association"
                                style={{
                                    width: '100%',
                                    minHeight: '48px',
                                    padding: '10px 14px',
                                    fontSize: '0.9375rem',
                                    borderRadius: '6px',
                                    border: '1px solid #BDBDBD',
                                }}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, marginBottom: '6px' }}>
                                Locality / City *
                            </label>
                            <input
                                type="text"
                                required
                                value={city}
                                onChange={(e) => setCity(e.target.value)}
                                placeholder="e.g. Ballygunge, Kolkata"
                                style={{
                                    width: '100%',
                                    minHeight: '48px',
                                    padding: '10px 14px',
                                    fontSize: '0.9375rem',
                                    borderRadius: '6px',
                                    border: '1px solid #BDBDBD',
                                }}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, marginBottom: '6px' }}>
                                Established Year (Optional)
                            </label>
                            <input
                                type="text"
                                value={establishedYear}
                                onChange={(e) => setEstablishedYear(e.target.value)}
                                placeholder="e.g. 1972"
                                style={{
                                    width: '100%',
                                    minHeight: '48px',
                                    padding: '10px 14px',
                                    fontSize: '0.9375rem',
                                    borderRadius: '6px',
                                    border: '1px solid #BDBDBD',
                                }}
                            />
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
                            <button
                                type="button"
                                onClick={() => {
                                    if (!orgName.trim()) {
                                        alert('Please enter your club / samity name');
                                        return;
                                    }
                                    setStep(2);
                                }}
                                style={{
                                    minHeight: '48px',
                                    padding: '12px 24px',
                                    backgroundColor: '#1B5E20',
                                    color: '#FFFFFF',
                                    border: 'none',
                                    borderRadius: '6px',
                                    fontWeight: 800,
                                    fontSize: '0.9375rem',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                }}
                            >
                                <span>Next: Setup Campaign</span>
                                <ArrowRight size={16} />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* STEP 2: FESTIVAL CAMPAIGN */}
            {step === 2 && (
                <div
                    style={{
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #E0E0E0',
                        borderTop: '4px solid #1B5E20',
                        borderRadius: '8px',
                        padding: '28px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                    }}
                >
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#212121', margin: '0 0 4px' }}>
                        Step 2: Create First Festival Campaign
                    </h2>
                    <p style={{ fontSize: '0.8125rem', color: '#616161', margin: '0 0 20px' }}>
                        Define target collection goals for your upcoming festival event.
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, marginBottom: '6px' }}>
                                Campaign Name *
                            </label>
                            <input
                                type="text"
                                required
                                value={campaignName}
                                onChange={(e) => setCampaignName(e.target.value)}
                                placeholder="e.g. Durga Puja 2026"
                                style={{
                                    width: '100%',
                                    minHeight: '48px',
                                    padding: '10px 14px',
                                    fontSize: '0.9375rem',
                                    borderRadius: '6px',
                                    border: '1px solid #BDBDBD',
                                }}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, marginBottom: '6px' }}>
                                Target Collection Goal (₹) *
                            </label>
                            <input
                                type="number"
                                required
                                min="1000"
                                step="1000"
                                value={targetAmount}
                                onChange={(e) => setTargetAmount(e.target.value)}
                                placeholder="e.g. 700000"
                                style={{
                                    width: '100%',
                                    minHeight: '48px',
                                    padding: '10px 14px',
                                    fontSize: '0.9375rem',
                                    fontWeight: 700,
                                    borderRadius: '6px',
                                    border: '1px solid #BDBDBD',
                                }}
                            />
                            <span style={{ fontSize: '0.75rem', color: '#1B5E20', fontWeight: 700, marginTop: '4px', display: 'block' }}>
                                Target: {formatIndianCurrency(Number(targetAmount) || 0)}
                            </span>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, marginBottom: '6px' }}>
                                    Start Date
                                </label>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    style={{
                                        width: '100%',
                                        minHeight: '48px',
                                        padding: '10px 12px',
                                        borderRadius: '6px',
                                        border: '1px solid #BDBDBD',
                                    }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, marginBottom: '6px' }}>
                                    End Date
                                </label>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    style={{
                                        width: '100%',
                                        minHeight: '48px',
                                        padding: '10px 12px',
                                        borderRadius: '6px',
                                        border: '1px solid #BDBDBD',
                                    }}
                                />
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
                            <button
                                type="button"
                                onClick={() => setStep(1)}
                                style={{
                                    minHeight: '48px',
                                    padding: '8px 16px',
                                    backgroundColor: '#FFFFFF',
                                    border: '1px solid #9E9E9E',
                                    borderRadius: '6px',
                                    fontWeight: 700,
                                    fontSize: '0.875rem',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                }}
                            >
                                <ArrowLeft size={16} />
                                <span>Back</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setStep(3)}
                                style={{
                                    minHeight: '48px',
                                    padding: '12px 24px',
                                    backgroundColor: '#1B5E20',
                                    color: '#FFFFFF',
                                    border: 'none',
                                    borderRadius: '6px',
                                    fontWeight: 800,
                                    fontSize: '0.9375rem',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                }}
                            >
                                <span>Next: Choose Starting Method</span>
                                <ArrowRight size={16} />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* STEP 3: INITIAL DATA INGESTION */}
            {step === 3 && (
                <div
                    style={{
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #E0E0E0',
                        borderTop: '4px solid #1B5E20',
                        borderRadius: '8px',
                        padding: '28px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                    }}
                >
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#212121', margin: '0 0 4px' }}>
                        Step 3: How would you like to start?
                    </h2>
                    <p style={{ fontSize: '0.8125rem', color: '#616161', margin: '0 0 24px' }}>
                        You can import your previous donor records right now or start with an empty ledger.
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '28px' }}>
                        {/* Option 1: Import Excel */}
                        <Link
                            to="/import"
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '16px',
                                padding: '18px 20px',
                                border: '2px solid #1B5E20',
                                borderRadius: '8px',
                                backgroundColor: '#E8F5E9',
                                textDecoration: 'none',
                                color: 'inherit',
                                transition: 'transform 0.15s ease',
                            }}
                        >
                            <div
                                style={{
                                    width: '44px',
                                    height: '44px',
                                    borderRadius: '8px',
                                    backgroundColor: '#1B5E20',
                                    color: '#FFFFFF',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0,
                                }}
                            >
                                <Upload size={22} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <h3 style={{ margin: '0 0 2px', fontSize: '1rem', fontWeight: 800, color: '#1B5E20' }}>
                                    Import Last Year’s Excel / CSV Register
                                </h3>
                                <p style={{ margin: 0, fontSize: '0.8125rem', color: '#424242' }}>
                                    Upload previous year’s member list with contact numbers and addresses in seconds.
                                </p>
                            </div>
                            <ArrowRight size={20} color="#1B5E20" />
                        </Link>

                        {/* Option 2: Fresh Start */}
                        <div
                            onClick={handleFinish}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '16px',
                                padding: '18px 20px',
                                border: '1px solid #BDBDBD',
                                borderRadius: '8px',
                                backgroundColor: '#FAFAFA',
                                cursor: 'pointer',
                            }}
                        >
                            <div
                                style={{
                                    width: '44px',
                                    height: '44px',
                                    borderRadius: '8px',
                                    backgroundColor: '#757575',
                                    color: '#FFFFFF',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0,
                                }}
                            >
                                <CheckCircle size={22} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <h3 style={{ margin: '0 0 2px', fontSize: '1rem', fontWeight: 800, color: '#212121' }}>
                                    Start Fresh (Blank Register)
                                </h3>
                                <p style={{ margin: 0, fontSize: '0.8125rem', color: '#616161' }}>
                                    Enter donors manually as collectors visit households or field registrations begin.
                                </p>
                            </div>
                            <ArrowRight size={20} color="#757575" />
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <button
                            type="button"
                            onClick={() => setStep(2)}
                            style={{
                                minHeight: '44px',
                                padding: '8px 16px',
                                backgroundColor: '#FFFFFF',
                                border: '1px solid #9E9E9E',
                                borderRadius: '6px',
                                fontWeight: 700,
                                fontSize: '0.875rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                            }}
                        >
                            <ArrowLeft size={16} />
                            <span>Back</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
