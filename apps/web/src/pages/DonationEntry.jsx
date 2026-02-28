import { useState } from 'react';
import { ArrowLeft, MapPin, User, Phone, Receipt, CheckCircle, Loader2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppData } from '../context/AppDataContext';

const C = {
    saffron: '#C97B2A',
    saffronLight: '#E8963A',
    gold: '#D4AF37',
    warmText: '#2C1A0E',
    mutedText: '#7A5A3A',
    forest: '#1E5C3A',
    forestLight: '#2D8A58',
    crimson: '#8B1A1A',
    cardBg: '#FFFBF3',
    border: 'rgba(201,123,42,0.15)',
};

const fmt = (n) => '₹' + Number(n).toLocaleString('en-IN');

export default function DonationEntry() {
    const navigate = useNavigate();
    const { addDonation, addDonor } = useAppData();

    const [form, setForm] = useState({
        donor_name: '',
        phone: '',
        amount: '500',
        payment_mode: 'cash',
        payment_status: 'paid',
        notes: '',
    });

    const [status, setStatus] = useState('idle');
    const [receipt, setReceipt] = useState(null);
    const presets = [500, 1000, 1500, 2500, 5000, 11000];

    function handleChange(e) {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setStatus('submitting');

        try {
            await new Promise(resolve => setTimeout(resolve, 800));

            const result = addDonation({
                donor: form.donor_name,
                amount: form.amount,
                mode: form.payment_mode,
                status: form.payment_status,
            });

            if (form.donor_name) {
                addDonor({
                    full_name: form.donor_name,
                    phone: form.phone
                });
            }

            setReceipt(result.receipt);
            setStatus('success');
        } catch (error) {
            console.error(error);
            setStatus('idle');
        }
    }

    const resetForm = () => {
        setForm({ donor_name: '', phone: '', amount: '500', payment_mode: 'cash', payment_status: 'paid', notes: '' });
        setStatus('idle');
        setReceipt(null);
    };

    // Success state
    if (status === 'success') {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 16 }}>
                <div style={{ fontSize: 72, marginBottom: 8 }}>🎊</div>
                <h2 style={{ fontFamily: 'Playfair Display', fontSize: 28, color: C.warmText, margin: 0 }}>Donation Recorded!</h2>
                <p style={{ fontFamily: 'Sora', fontSize: 14, color: C.mutedText, margin: 0 }}>
                    {form.donor_name || 'Donor'} · {fmt(parseInt(form.amount) || 0)} · {form.payment_mode === 'cash' ? 'Cash' : 'Online'}
                </p>
                <p style={{ fontFamily: 'Sora', fontSize: 13, color: C.mutedText, margin: '0 0 8px' }}>
                    Receipt: <strong>{receipt}</strong> · 📱 SMS receipt will be sent
                </p>
                <div style={{ display: 'flex', gap: 12 }}>
                    <button onClick={resetForm} className="btn btn-primary" style={{ fontSize: '0.875rem' }}>
                        + Record Another Donation
                    </button>
                    <Link to="/donations" className="btn btn-secondary" style={{ fontSize: '0.875rem', textDecoration: 'none' }}>
                        View All Donations
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <>
            {/* Back Link */}
            <Link to="/donations" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '24px', fontSize: '0.875rem', color: C.mutedText, textDecoration: 'none' }}>
                <ArrowLeft size={16} />
                Back to Donations
            </Link>

            <div style={{ maxWidth: '640px' }}>
                <h2 style={{ fontFamily: 'Playfair Display', fontSize: '1.375rem', fontWeight: 700, marginBottom: '4px', color: C.warmText }}>
                    Enter Donation Details
                </h2>
                <p style={{ fontFamily: 'Sora', fontSize: '0.875rem', color: C.mutedText, marginBottom: '26px' }}>
                    Record a new donation from door-to-door collection
                </p>

                <form onSubmit={handleSubmit} style={{ opacity: status === 'submitting' ? 0.7 : 1, pointerEvents: status === 'submitting' ? 'none' : 'auto' }}>
                    {/* Donor Details Card */}
                    <div className="card" style={{ marginBottom: '20px' }}>
                        <div className="card-header">
                            <h3>Donor Details</h3>
                        </div>
                        <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div className="form-group">
                                <label className="form-label">Donor Name *</label>
                                <div style={{ position: 'relative' }}>
                                    <User size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: C.mutedText }} />
                                    <input
                                        type="text"
                                        name="donor_name"
                                        value={form.donor_name}
                                        onChange={handleChange}
                                        placeholder="Enter donor's full name"
                                        className="form-input"
                                        style={{ width: '100%', paddingLeft: '40px' }}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Phone Number <span style={{ color: C.mutedText, textTransform: 'none', letterSpacing: 0, fontWeight: 400 }}>(Optional)</span></label>
                                <div style={{ position: 'relative' }}>
                                    <Phone size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: C.mutedText }} />
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={form.phone}
                                        onChange={handleChange}
                                        placeholder="+91 Enter mobile number"
                                        className="form-input"
                                        style={{ width: '100%', paddingLeft: '40px' }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Payment Details Card */}
                    <div className="card" style={{ marginBottom: '20px' }}>
                        <div className="card-header">
                            <h3>Payment Details</h3>
                        </div>
                        <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {/* Amount presets */}
                            <div className="form-group">
                                <label className="form-label">Donation Amount</label>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
                                    {presets.map((p) => (
                                        <button
                                            key={p}
                                            type="button"
                                            onClick={() => setForm(f => ({ ...f, amount: String(p) }))}
                                            style={{
                                                padding: '8px 15px', borderRadius: 10,
                                                border: `1.5px solid ${form.amount === String(p) ? C.saffron : C.border}`,
                                                background: form.amount === String(p) ? `${C.saffron}15` : C.cardBg,
                                                fontFamily: 'Sora', fontSize: 12, fontWeight: 600,
                                                color: form.amount === String(p) ? C.saffron : C.warmText, cursor: 'pointer',
                                                transition: 'all 150ms ease',
                                            }}
                                        >₹{Number(p).toLocaleString('en-IN')}</button>
                                    ))}
                                </div>
                                <div style={{ position: 'relative', width: '100%', maxWidth: '300px' }}>
                                    <span style={{
                                        position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)',
                                        fontFamily: 'Sora', fontSize: '1.125rem', fontWeight: 800, color: C.saffron,
                                    }}>₹</span>
                                    <input
                                        type="number"
                                        name="amount"
                                        value={form.amount}
                                        onChange={handleChange}
                                        placeholder="Custom amount"
                                        className="form-input form-input-lg"
                                        style={{ width: '100%', paddingLeft: '38px', textAlign: 'left' }}
                                        min="1"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Payment Mode & Status Row */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
                                <div className="form-group">
                                    <label className="form-label">Payment Mode</label>
                                    <div className="toggle-group">
                                        {[
                                            { value: 'cash', label: '💵 Cash' },
                                            { value: 'upi', label: '📱 Online' },
                                            { value: 'cheque', label: '🏦 Cheque' },
                                        ].map((mode) => (
                                            <button
                                                key={mode.value}
                                                type="button"
                                                className={`toggle-option ${form.payment_mode === mode.value ? 'active' : ''}`}
                                                onClick={() => setForm((p) => ({ ...p, payment_mode: mode.value }))}
                                            >
                                                {mode.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Payment Status</label>
                                    <div className="toggle-group">
                                        {[
                                            { value: 'paid', label: '✅ Paid' },
                                            { value: 'due', label: '⏳ Due' },
                                        ].map((s) => (
                                            <button
                                                key={s.value}
                                                type="button"
                                                className={`toggle-option ${form.payment_status === s.value ? 'active' : ''}`}
                                                onClick={() => setForm((p) => ({ ...p, payment_status: s.value }))}
                                                style={{
                                                    borderColor: form.payment_status === s.value
                                                        ? (s.value === 'paid' ? C.forest : C.crimson)
                                                        : undefined,
                                                    color: form.payment_status === s.value
                                                        ? (s.value === 'paid' ? C.forest : C.crimson)
                                                        : undefined,
                                                    background: form.payment_status === s.value
                                                        ? (s.value === 'paid' ? `${C.forest}12` : `${C.crimson}12`)
                                                        : undefined,
                                                }}
                                            >
                                                {s.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Notes */}
                            <div className="form-group">
                                <label className="form-label">Notes (optional)</label>
                                <textarea
                                    name="notes"
                                    value={form.notes}
                                    onChange={handleChange}
                                    placeholder="Any additional notes..."
                                    className="form-input"
                                    style={{ height: '80px', padding: '12px 16px', resize: 'vertical' }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Location Card */}
                    <div className="card" style={{ marginBottom: '24px' }}>
                        <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div className="kpi-icon green" style={{ width: '36px', height: '36px' }}>
                                <MapPin size={18} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontFamily: 'Sora', fontSize: '0.875rem', fontWeight: 600, color: C.warmText }}>GPS Location Captured</div>
                                <div style={{ fontFamily: 'Sora', fontSize: '0.75rem', color: C.mutedText }}>Lat: 22.5184, Long: 88.3756 · Location recorded</div>
                            </div>
                            <span className="badge badge-active">✓ GPS Active</span>
                        </div>
                    </div>

                    {/* Submit Buttons */}
                    <div style={{ display: 'flex', gap: 12 }}>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            style={{
                                flex: 2,
                                height: '52px',
                                fontSize: '0.9375rem',
                                fontWeight: 700,
                                justifyContent: 'center',
                                borderRadius: '13px',
                                letterSpacing: '0.04em',
                            }}
                            disabled={status === 'submitting'}
                        >
                            {status === 'submitting' ? <Loader2 size={20} className="animate-spin" /> : <Receipt size={18} />}
                            {status === 'submitting' ? 'Recording...' : 'CONFIRM DONATION'}
                        </button>
                        <button
                            type="button"
                            className="btn btn-secondary"
                            style={{
                                flex: 1,
                                height: '52px',
                                fontSize: '0.8125rem',
                                fontWeight: 600,
                                justifyContent: 'center',
                                borderRadius: '13px',
                            }}
                            onClick={handleSubmit}
                            disabled={status === 'submitting'}
                        >
                            Save & New →
                        </button>
                    </div>
                    <p style={{ fontFamily: 'Sora', fontSize: 11, color: C.mutedText, textAlign: 'center', marginTop: 12 }}>
                        * SMS receipt will be sent to the donor's mobile number
                    </p>
                </form>
            </div>
        </>
    );
}
