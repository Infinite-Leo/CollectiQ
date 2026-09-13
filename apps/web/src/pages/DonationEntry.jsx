import React, { useState } from 'react';
import {
    ArrowLeft,
    ArrowRight,
    Check,
    Search,
    IndianRupee,
    CreditCard,
    Clock,
    User,
    Phone,
    Share2,
    Printer,
    Plus,
    CheckCircle2
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppData } from '../context/AppDataContext';
import { useAuth } from '../context/AuthContext';
import ReceiptModal from '../components/ReceiptModal';
import DuplicateDetectModal from '../components/DuplicateDetectModal';
import FriendlyError from '../components/FriendlyError';
import { apiFetch } from '../utils/api';

const PRESETS = [500, 1000, 2000, 5000, 10000];

export default function DonationEntry() {
    const navigate = useNavigate();
    const { addDonation, addDonor } = useAppData();
    const { user } = useAuth();

    const [step, setStep] = useState(1);
    const [donorName, setDonorName] = useState('');
    const [donorPhone, setDonorPhone] = useState('');
    const [donorId, setDonorId] = useState(null);
    const [amount, setAmount] = useState('1000');
    const [paymentMode, setPaymentMode] = useState('CASH');
    const [paymentStatus, setPaymentStatus] = useState('PAID');
    const [notes, setNotes] = useState('');

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState(null);
    const [savedReceipt, setSavedReceipt] = useState(null);
    const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

    // Duplicate detection modal state
    const [potentialDuplicate, setPotentialDuplicate] = useState(null);
    const [isDuplicateModalOpen, setIsDuplicateModalOpen] = useState(false);

    // Check for duplicates when user finishes Step 1
    const checkDuplicate = async () => {
        if (!donorPhone && donorName.length < 3) return false;
        try {
            const res = await apiFetch(`/api/v1/donor-profiles/duplicates?name=${encodeURIComponent(donorName)}&phone=${encodeURIComponent(donorPhone)}`);
            const dups = res?.data?.duplicates || [];
            if (dups.length > 0) {
                setPotentialDuplicate(dups[0]);
                setIsDuplicateModalOpen(true);
                return true;
            }
        } catch (err) {
            console.warn('Duplicate check skipped:', err.message);
        }
        return false;
    };

    const handleStep1Next = async () => {
        if (!donorName.trim()) {
            setErrorMsg('Please enter the donor’s name before proceeding.');
            return;
        }
        setErrorMsg(null);
        const hasDup = await checkDuplicate();
        if (!hasDup) {
            setStep(2);
        }
    };

    const handleUseExistingDonor = (existing) => {
        setDonorId(existing.id);
        setDonorName(existing.full_name);
        if (existing.phone) setDonorPhone(existing.phone);
        setIsDuplicateModalOpen(false);
        setStep(2);
    };

    const handleCreateNewDonor = () => {
        setDonorId(null);
        setIsDuplicateModalOpen(false);
        setStep(2);
    };

    const handleFinalSubmit = async () => {
        setIsSubmitting(true);
        setErrorMsg(null);

        try {
            let activeDonorId = donorId;

            // If donor not yet registered, register now
            if (!activeDonorId && donorName) {
                const newDonor = await addDonor({
                    full_name: donorName.trim(),
                    phone: donorPhone.trim() || null,
                });
                if (newDonor) activeDonorId = newDonor.id;
            }

            const result = await addDonation({
                donor: donorName.trim(),
                donor_id: activeDonorId,
                amount: amount,
                mode: paymentMode.toLowerCase(),
                status: paymentStatus.toLowerCase(),
                notes: notes,
            });

            const recNum = result?.receipt_number || result?.receipt || `DP26-${Math.floor(100000 + Math.random() * 900000)}`;
            setSavedReceipt(recNum);
            setStep(6); // Success Step!
        } catch (err) {
            console.error('Failed to save collection:', err);
            setErrorMsg(err.message || 'Unable to record collection. Please verify details and try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleStartNew = () => {
        setStep(1);
        setDonorName('');
        setDonorPhone('');
        setDonorId(null);
        setAmount('1000');
        setPaymentMode('CASH');
        setPaymentStatus('PAID');
        setNotes('');
        setSavedReceipt(null);
        setErrorMsg(null);
    };

    return (
        <div style={{ maxWidth: '640px', margin: '0 auto', padding: '16px 16px 60px' }}>
            <ReceiptModal
                isOpen={isReceiptModalOpen}
                onClose={() => setIsReceiptModalOpen(false)}
                receiptNumber={savedReceipt || 'DP26-000184'}
                donorName={donorName}
                donorPhone={donorPhone}
                amount={amount}
                paymentMode={paymentMode}
                paymentStatus={paymentStatus}
                collectorName={user?.user_metadata?.full_name || 'Collector Desk'}
            />

            <DuplicateDetectModal
                isOpen={isDuplicateModalOpen}
                onClose={() => setIsDuplicateModalOpen(false)}
                existingDonor={potentialDuplicate}
                onSelectExisting={handleUseExistingDonor}
                onCreateNew={handleCreateNewDonor}
            />

            {/* Back button & Title */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                <button
                    onClick={() => (step > 1 && step < 6 ? setStep(step - 1) : navigate('/dashboard'))}
                    type="button"
                    style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '10px',
                        backgroundColor: 'rgba(255, 255, 255, 0.06)',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        color: '#FFFFFF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                    }}
                >
                    <ArrowLeft size={18} />
                </button>
                <div>
                    <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary, #FDFBF7)' }}>
                        Record Collection
                    </h1>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted, #9CA3AF)' }}>
                        Step {Math.min(step, 5)} of 5 • Durga Puja 2026 Register
                    </span>
                </div>
            </div>

            {/* Step Progress Bar */}
            {step <= 5 && (
                <div style={{ display: 'flex', gap: '6px', marginBottom: '28px' }}>
                    {[1, 2, 3, 4, 5].map((s) => (
                        <div
                            key={s}
                            style={{
                                flex: 1,
                                height: '6px',
                                borderRadius: '999px',
                                backgroundColor: s <= step ? '#D4AF37' : 'rgba(255, 255, 255, 0.1)',
                                transition: 'background-color 0.3s',
                            }}
                        />
                    ))}
                </div>
            )}

            {errorMsg && (
                <FriendlyError
                    actionName="record this collection"
                    reason={errorMsg}
                    onRetry={() => setErrorMsg(null)}
                />
            )}

            {/* STEP 1: WHO GAVE THE DONATION? */}
            {step === 1 && (
                <div
                    style={{
                        backgroundColor: 'var(--bg-surface, #1E1B18)',
                        border: '1px solid var(--border-default, rgba(255,255,255,0.08))',
                        borderRadius: '16px',
                        padding: '28px',
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                        <User size={22} color="#D4AF37" />
                        <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary, #FDFBF7)' }}>
                            1. Who gave the donation?
                        </h2>
                    </div>
                    <p style={{ margin: '0 0 24px', fontSize: '0.9rem', color: 'var(--text-muted, #9CA3AF)' }}>
                        Enter the donor or household representative's name and mobile number.
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '28px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#D1D5DB', marginBottom: '8px' }}>
                                Full Name *
                            </label>
                            <input
                                type="text"
                                value={donorName}
                                onChange={(e) => setDonorName(e.target.value)}
                                placeholder="e.g. Rahul Sharma or Das Family"
                                autoFocus
                                style={{
                                    width: '100%',
                                    minHeight: '52px',
                                    backgroundColor: 'rgba(255,255,255,0.05)',
                                    border: '1px solid rgba(255,255,255,0.15)',
                                    borderRadius: '10px',
                                    padding: '0 16px',
                                    color: '#FFFFFF',
                                    fontSize: '1.05rem',
                                }}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#D1D5DB', marginBottom: '8px' }}>
                                Mobile Number (for WhatsApp Receipt)
                            </label>
                            <input
                                type="tel"
                                value={donorPhone}
                                onChange={(e) => setDonorPhone(e.target.value)}
                                placeholder="e.g. 9830112233"
                                style={{
                                    width: '100%',
                                    minHeight: '52px',
                                    backgroundColor: 'rgba(255,255,255,0.05)',
                                    border: '1px solid rgba(255,255,255,0.15)',
                                    borderRadius: '10px',
                                    padding: '0 16px',
                                    color: '#FFFFFF',
                                    fontSize: '1.05rem',
                                }}
                            />
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={handleStep1Next}
                        style={{
                            width: '100%',
                            minHeight: '52px',
                            backgroundColor: '#D4AF37',
                            border: 'none',
                            borderRadius: '12px',
                            color: '#111827',
                            fontSize: '1.05rem',
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            cursor: 'pointer',
                        }}
                    >
                        Continue to Amount <ArrowRight size={18} />
                    </button>
                </div>
            )}

            {/* STEP 2: HOW MUCH? */}
            {step === 2 && (
                <div
                    style={{
                        backgroundColor: 'var(--bg-surface, #1E1B18)',
                        border: '1px solid var(--border-default, rgba(255,255,255,0.08))',
                        borderRadius: '16px',
                        padding: '28px',
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                        <IndianRupee size={22} color="#D4AF37" />
                        <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary, #FDFBF7)' }}>
                            2. How much was contributed?
                        </h2>
                    </div>
                    <p style={{ margin: '0 0 20px', fontSize: '0.9rem', color: 'var(--text-muted, #9CA3AF)' }}>
                        Donor: <strong style={{ color: '#FDFBF7' }}>{donorName}</strong>
                    </p>

                    {/* Big Amount Input */}
                    <div
                        style={{
                            backgroundColor: 'rgba(255, 255, 255, 0.03)',
                            border: '2px solid #D4AF37',
                            borderRadius: '14px',
                            padding: '16px 20px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            marginBottom: '20px',
                        }}
                    >
                        <span style={{ fontSize: '2rem', fontWeight: 800, color: '#D4AF37' }}>₹</span>
                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            autoFocus
                            style={{
                                width: '100%',
                                backgroundColor: 'transparent',
                                border: 'none',
                                color: '#FFFFFF',
                                fontSize: '2.5rem',
                                fontWeight: 800,
                                outline: 'none',
                            }}
                        />
                    </div>

                    {/* Quick Preset Buttons */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '28px' }}>
                        {PRESETS.map((p) => (
                            <button
                                key={p}
                                type="button"
                                onClick={() => setAmount(String(p))}
                                style={{
                                    minHeight: '44px',
                                    padding: '6px 16px',
                                    borderRadius: '10px',
                                    backgroundColor: amount === String(p) ? 'rgba(212, 175, 55, 0.25)' : 'rgba(255,255,255,0.05)',
                                    border: `1px solid ${amount === String(p) ? '#D4AF37' : 'rgba(255,255,255,0.12)'}`,
                                    color: amount === String(p) ? '#D4AF37' : '#FFFFFF',
                                    fontSize: '0.95rem',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                }}
                            >
                                ₹{p.toLocaleString('en-IN')}
                            </button>
                        ))}
                    </div>

                    <button
                        type="button"
                        onClick={() => {
                            if (!amount || Number(amount) <= 0) {
                                setErrorMsg('Please enter a valid contribution amount.');
                                return;
                            }
                            setErrorMsg(null);
                            setStep(3);
                        }}
                        style={{
                            width: '100%',
                            minHeight: '52px',
                            backgroundColor: '#D4AF37',
                            border: 'none',
                            borderRadius: '12px',
                            color: '#111827',
                            fontSize: '1.05rem',
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            cursor: 'pointer',
                        }}
                    >
                        Continue to Payment Method <ArrowRight size={18} />
                    </button>
                </div>
            )}

            {/* STEP 3: HOW WAS IT PAID? */}
            {step === 3 && (
                <div
                    style={{
                        backgroundColor: 'var(--bg-surface, #1E1B18)',
                        border: '1px solid var(--border-default, rgba(255,255,255,0.08))',
                        borderRadius: '16px',
                        padding: '28px',
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                        <CreditCard size={22} color="#D4AF37" />
                        <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary, #FDFBF7)' }}>
                            3. How was it paid?
                        </h2>
                    </div>
                    <p style={{ margin: '0 0 24px', fontSize: '0.9rem', color: 'var(--text-muted, #9CA3AF)' }}>
                        Select the payment method used by the donor.
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '28px' }}>
                        {[
                            { id: 'CASH', label: 'CASH (Handover)', sub: 'Physical rupee notes collected directly', color: '#10B981' },
                            { id: 'UPI', label: 'UPI (GPay / PhonePe / QR)', sub: 'Direct bank transfer via digital scanner', color: '#3B82F6' },
                            { id: 'BANK_TRANSFER', label: 'Cheque / NetBanking', sub: 'Bank transfer or physical cheque', color: '#8B5CF6' },
                        ].map((m) => (
                            <button
                                key={m.id}
                                type="button"
                                onClick={() => setPaymentMode(m.id)}
                                style={{
                                    minHeight: '64px',
                                    padding: '14px 20px',
                                    borderRadius: '12px',
                                    backgroundColor: paymentMode === m.id ? 'rgba(212, 175, 55, 0.15)' : 'rgba(255,255,255,0.03)',
                                    border: `2px solid ${paymentMode === m.id ? '#D4AF37' : 'rgba(255,255,255,0.1)'}`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    cursor: 'pointer',
                                    textAlign: 'left',
                                }}
                            >
                                <div>
                                    <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#FFFFFF' }}>{m.label}</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted, #9CA3AF)', marginTop: '2px' }}>{m.sub}</div>
                                </div>
                                {paymentMode === m.id && (
                                    <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#D4AF37', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#111827' }}>
                                        <Check size={16} strokeWidth={3} />
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>

                    <button
                        type="button"
                        onClick={() => setStep(4)}
                        style={{
                            width: '100%',
                            minHeight: '52px',
                            backgroundColor: '#D4AF37',
                            border: 'none',
                            borderRadius: '12px',
                            color: '#111827',
                            fontSize: '1.05rem',
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            cursor: 'pointer',
                        }}
                    >
                        Continue to Status <ArrowRight size={18} />
                    </button>
                </div>
            )}

            {/* STEP 4: PAYMENT STATUS */}
            {step === 4 && (
                <div
                    style={{
                        backgroundColor: 'var(--bg-surface, #1E1B18)',
                        border: '1px solid var(--border-default, rgba(255,255,255,0.08))',
                        borderRadius: '16px',
                        padding: '28px',
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                        <Clock size={22} color="#D4AF37" />
                        <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary, #FDFBF7)' }}>
                            4. What is the payment status?
                        </h2>
                    </div>
                    <p style={{ margin: '0 0 24px', fontSize: '0.9rem', color: 'var(--text-muted, #9CA3AF)' }}>
                        Is the money fully cleared right now, or promised / pending?
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '28px' }}>
                        {[
                            { id: 'PAID', label: 'PAID (Full Amount Received)', sub: 'Complete payment made; ready for official receipt', color: '#10B981' },
                            { id: 'PENDING', label: 'PENDING / PROMISED', sub: 'Pledged amount to be collected during a follow-up visit', color: '#EF4444' },
                            { id: 'PARTIAL', label: 'PARTIAL / ADVANCE', sub: 'Part of the total amount received today', color: '#F59E0B' },
                        ].map((s) => (
                            <button
                                key={s.id}
                                type="button"
                                onClick={() => setPaymentStatus(s.id)}
                                style={{
                                    minHeight: '64px',
                                    padding: '14px 20px',
                                    borderRadius: '12px',
                                    backgroundColor: paymentStatus === s.id ? 'rgba(212, 175, 55, 0.15)' : 'rgba(255,255,255,0.03)',
                                    border: `2px solid ${paymentStatus === s.id ? '#D4AF37' : 'rgba(255,255,255,0.1)'}`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    cursor: 'pointer',
                                    textAlign: 'left',
                                }}
                            >
                                <div>
                                    <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#FFFFFF' }}>{s.label}</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted, #9CA3AF)', marginTop: '2px' }}>{s.sub}</div>
                                </div>
                                {paymentStatus === s.id && (
                                    <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#D4AF37', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#111827' }}>
                                        <Check size={16} strokeWidth={3} />
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>

                    <button
                        type="button"
                        onClick={() => setStep(5)}
                        style={{
                            width: '100%',
                            minHeight: '52px',
                            backgroundColor: '#D4AF37',
                            border: 'none',
                            borderRadius: '12px',
                            color: '#111827',
                            fontSize: '1.05rem',
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            cursor: 'pointer',
                        }}
                    >
                        Review & Confirm <ArrowRight size={18} />
                    </button>
                </div>
            )}

            {/* STEP 5: REVIEW & CONFIRM */}
            {step === 5 && (
                <div
                    style={{
                        backgroundColor: 'var(--bg-surface, #1E1B18)',
                        border: '1px solid var(--border-default, rgba(255,255,255,0.08))',
                        borderRadius: '16px',
                        padding: '28px',
                    }}
                >
                    <h2 style={{ margin: '0 0 8px', fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary, #FDFBF7)' }}>
                        5. Confirm & Record Collection
                    </h2>
                    <p style={{ margin: '0 0 20px', fontSize: '0.875rem', color: 'var(--text-muted, #9CA3AF)' }}>
                        Please review the details below before saving to the digital register.
                    </p>

                    {/* Amount Banner */}
                    <div
                        style={{
                            backgroundColor: 'rgba(212, 175, 55, 0.1)',
                            border: '1px solid rgba(212, 175, 55, 0.3)',
                            borderRadius: '14px',
                            padding: '20px',
                            textAlign: 'center',
                            marginBottom: '20px',
                        }}
                    >
                        <span style={{ fontSize: '0.8rem', color: '#D4AF37', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                            Contribution Amount
                        </span>
                        <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#D4AF37', marginTop: '2px' }}>
                            ₹ {Number(amount).toLocaleString('en-IN')}
                        </div>
                    </div>

                    {/* Summary Ledger */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.95rem', marginBottom: '24px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '8px' }}>
                            <span style={{ color: 'var(--text-muted, #9CA3AF)' }}>Donor Name:</span>
                            <strong style={{ color: '#FFFFFF' }}>{donorName}</strong>
                        </div>

                        {donorPhone && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '8px' }}>
                                <span style={{ color: 'var(--text-muted, #9CA3AF)' }}>Mobile:</span>
                                <span style={{ color: '#FFFFFF' }}>{donorPhone}</span>
                            </div>
                        )}

                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '8px' }}>
                            <span style={{ color: 'var(--text-muted, #9CA3AF)' }}>Payment Mode:</span>
                            <span style={{ fontWeight: 600, color: '#FFFFFF' }}>{paymentMode}</span>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '8px' }}>
                            <span style={{ color: 'var(--text-muted, #9CA3AF)' }}>Payment Status:</span>
                            <span style={{ fontWeight: 700, color: paymentStatus === 'PAID' ? '#34D399' : '#FBBF24' }}>
                                {paymentStatus}
                            </span>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={handleFinalSubmit}
                        disabled={isSubmitting}
                        style={{
                            width: '100%',
                            minHeight: '52px',
                            backgroundColor: '#D4AF37',
                            border: 'none',
                            borderRadius: '12px',
                            color: '#111827',
                            fontSize: '1.05rem',
                            fontWeight: 800,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            cursor: isSubmitting ? 'not-allowed' : 'pointer',
                            boxShadow: '0 4px 14px rgba(212, 175, 55, 0.3)',
                        }}
                    >
                        <Check size={20} /> {isSubmitting ? 'Recording in Register...' : 'Confirm & Save Collection'}
                    </button>
                </div>
            )}

            {/* STEP 6: SUCCESS & RECEIPT */}
            {step === 6 && (
                <div
                    style={{
                        backgroundColor: 'var(--bg-surface, #1E1B18)',
                        border: '1px solid rgba(16, 185, 129, 0.3)',
                        borderRadius: '16px',
                        padding: '36px 28px',
                        textAlign: 'center',
                    }}
                >
                    <div
                        style={{
                            width: '64px',
                            height: '64px',
                            borderRadius: '50%',
                            backgroundColor: 'rgba(16, 185, 129, 0.15)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#34D399',
                            margin: '0 auto 16px',
                        }}
                    >
                        <CheckCircle2 size={36} />
                    </div>

                    <h2 style={{ margin: '0 0 8px', fontSize: '1.6rem', fontWeight: 800, color: '#FFFFFF' }}>
                        Collection Recorded!
                    </h2>
                    <p style={{ margin: '0 0 20px', fontSize: '1rem', color: '#D1D5DB' }}>
                        ₹{Number(amount).toLocaleString('en-IN')} received from <strong>{donorName}</strong>
                    </p>

                    <div
                        style={{
                            backgroundColor: 'rgba(255, 255, 255, 0.04)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '12px',
                            padding: '16px',
                            marginBottom: '28px',
                            fontSize: '0.95rem',
                        }}
                    >
                        <span style={{ color: 'var(--text-muted, #9CA3AF)' }}>Official Digital Receipt Number: </span>
                        <strong style={{ color: '#D4AF37', fontFamily: 'monospace', fontSize: '1.1rem' }}>
                            {savedReceipt}
                        </strong>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button
                                type="button"
                                onClick={() => setIsReceiptModalOpen(true)}
                                style={{
                                    flex: 1,
                                    minHeight: '48px',
                                    backgroundColor: '#FFFFFF',
                                    color: '#111827',
                                    border: 'none',
                                    borderRadius: '10px',
                                    fontWeight: 700,
                                    fontSize: '0.95rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px',
                                    cursor: 'pointer',
                                }}
                            >
                                <Printer size={18} /> View / Print Receipt
                            </button>

                            <button
                                type="button"
                                onClick={() => {
                                    setIsReceiptModalOpen(true);
                                }}
                                style={{
                                    flex: 1,
                                    minHeight: '48px',
                                    backgroundColor: '#25D366',
                                    color: '#FFFFFF',
                                    border: 'none',
                                    borderRadius: '10px',
                                    fontWeight: 700,
                                    fontSize: '0.95rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px',
                                    cursor: 'pointer',
                                }}
                            >
                                <Share2 size={18} /> Share WhatsApp
                            </button>
                        </div>

                        <button
                            type="button"
                            onClick={handleStartNew}
                            style={{
                                minHeight: '48px',
                                backgroundColor: 'rgba(212, 175, 55, 0.2)',
                                border: '1px solid #D4AF37',
                                borderRadius: '10px',
                                color: '#D4AF37',
                                fontWeight: 700,
                                fontSize: '0.95rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                cursor: 'pointer',
                            }}
                        >
                            <Plus size={18} /> Record Another Collection
                        </button>
                    </div>

                    <Link
                        to="/dashboard"
                        style={{
                            fontSize: '0.9rem',
                            color: 'var(--text-muted, #9CA3AF)',
                            textDecoration: 'none',
                        }}
                    >
                        ← Return to Dashboard
                    </Link>
                </div>
            )}
        </div>
    );
}
