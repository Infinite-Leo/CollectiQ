import { useState } from 'react';
import { ArrowLeft, MapPin, User, Phone, Receipt, CheckCircle, Loader2 } from 'lucide-react'; // Removing IndianRupee as it is unused
import { Link, useNavigate } from 'react-router-dom';
import { useAppData } from '../context/AppDataContext';

export default function DonationEntry() {
    const navigate = useNavigate();
    const { addDonation, addDonor } = useAppData();

    const [form, setForm] = useState({
        donor_name: '',
        phone: '',
        amount: '',
        payment_mode: 'cash',
        payment_status: 'paid',
        notes: '',
    });

    const [status, setStatus] = useState('idle'); // idle, submitting, success
    const [receipt, setReceipt] = useState(null);

    function handleChange(e) {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setStatus('submitting');

        try {
            // Simulate network delay
            await new Promise(resolve => setTimeout(resolve, 800));

            // 1. Add donor implicitly if needed (simplified for quick entry)
            // In a real app we might check if phone exists, but here we just create a donor entry
            // or link to an existing one if we implemented search here.
            // For now, we'll just handle the donation.

            // 2. Add donation
            const result = addDonation({
                donor: form.donor_name,
                amount: form.amount,
                mode: form.payment_mode,
                status: form.payment_status,
                // We could add phone to donor here if we wanted to normalize
            });

            // If phone is provided, ensure we have a donor record updated/created
            if (form.donor_name) {
                addDonor({
                    full_name: form.donor_name,
                    phone: form.phone
                });
            }

            setReceipt(result.receipt);
            setStatus('success');

            // Reset form after delay or leave it success? 
            // Usually data entry needs to be quick, so "New Entry" button is better.
        } catch (error) {
            console.error(error);
            setStatus('idle');
        }
    }

    const resetForm = () => {
        setForm({ donor_name: '', phone: '', amount: '', payment_mode: 'cash', payment_status: 'paid', notes: '' });
        setStatus('idle');
        setReceipt(null);
    };

    return (
        <>
            {/* Back Link */}
            <Link to="/donations" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '24px', fontSize: '0.875rem', color: 'var(--text-secondary)', textDecoration: 'none' }}>
                <ArrowLeft size={16} />
                Back to Donations
            </Link>

            <div style={{ maxWidth: '640px' }}>
                <h2 style={{ fontSize: '1.375rem', fontWeight: 700, marginBottom: '4px' }}>
                    Record Donation
                </h2>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '24px' }}>
                    Enter donation details. The receipt will be generated automatically.
                </p>

                {/* Success Message */}
                {status === 'success' && (
                    <div className="success-banner">
                        <div className="icon-wrapper">
                            <CheckCircle size={22} color="var(--brand-green)" />
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600, color: 'var(--brand-green-dark)' }}>Donation recorded!</div>
                            <div style={{ fontSize: '0.8125rem', color: 'var(--brand-green-dark)', opacity: 0.8 }}>
                                Receipt <strong>{receipt}</strong> generated for ₹{parseFloat(form.amount || 0).toLocaleString('en-IN')}
                            </div>
                        </div>
                        <button className="btn btn-sm btn-secondary" onClick={resetForm}>
                            New Entry
                        </button>
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ opacity: status === 'submitting' ? 0.7 : 1, pointerEvents: status === 'submitting' ? 'none' : 'auto' }}>
                    <div className="card" style={{ marginBottom: '20px' }}>
                        <div className="card-header">
                            <h3>Donor Details</h3>
                        </div>
                        <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div className="form-group">
                                <label className="form-label">Donor Name *</label>
                                <div style={{ position: 'relative' }}>
                                    <User size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
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
                                <label className="form-label">Phone Number</label>
                                <div style={{ position: 'relative' }}>
                                    <Phone size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={form.phone}
                                        onChange={handleChange}
                                        placeholder="+91 98765 43210"
                                        className="form-input"
                                        style={{ width: '100%', paddingLeft: '40px' }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="card" style={{ marginBottom: '20px' }}>
                        <div className="card-header">
                            <h3>Payment Details</h3>
                        </div>
                        <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {/* Amount — Large Input */}
                            <div className="form-group" style={{ alignItems: 'center' }}>
                                <label className="form-label">Amount *</label>
                                <div style={{ position: 'relative', width: '100%', maxWidth: '300px' }}>
                                    <span style={{
                                        position: 'absolute',
                                        left: '16px',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        fontSize: '1.25rem',
                                        color: 'var(--text-muted)',
                                        fontWeight: 500,
                                    }}>₹</span>
                                    <input
                                        type="number"
                                        name="amount"
                                        value={form.amount}
                                        onChange={handleChange}
                                        placeholder="0"
                                        className="form-input form-input-lg"
                                        style={{ width: '100%', paddingLeft: '40px' }}
                                        min="1"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Payment Mode */}
                            <div className="form-group">
                                <label className="form-label">Payment Mode</label>
                                <div className="toggle-group">
                                    {[
                                        { value: 'cash', label: '💵 Cash' },
                                        { value: 'upi', label: '📱 UPI' },
                                        { value: 'bank_transfer', label: '🏦 Bank' },
                                        { value: 'cheque', label: '📝 Cheque' },
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

                            {/* Payment Status */}
                            <div className="form-group">
                                <label className="form-label">Status</label>
                                <div className="toggle-group" style={{ maxWidth: '240px' }}>
                                    {[
                                        { value: 'paid', label: '✅ Paid' },
                                        { value: 'due', label: '⏳ Due' },
                                    ].map((s) => (
                                        <button
                                            key={s.value}
                                            type="button"
                                            className={`toggle-option ${form.payment_status === s.value ? 'active' : ''}`}
                                            onClick={() => setForm((p) => ({ ...p, payment_status: s.value }))}
                                        >
                                            {s.label}
                                        </button>
                                    ))}
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
                                <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>GPS Location Captured</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>22.5726° N, 88.3639° E</div>
                            </div>
                            <span className="badge badge-active">Auto</span>
                        </div>
                    </div>

                    {/* Submit */}
                    <button
                        type="submit"
                        className="btn btn-primary"
                        style={{
                            width: '100%',
                            height: '52px',
                            fontSize: '1rem',
                            fontWeight: 600,
                            justifyContent: 'center',
                            borderRadius: 'var(--radius-lg)',
                        }}
                        disabled={status === 'submitting'}
                    >
                        {status === 'submitting' ? <Loader2 size={20} className="animate-spin" /> : <Receipt size={20} />}
                        {status === 'submitting' ? 'Recording...' : 'Record Donation & Generate Receipt'}
                    </button>
                </form>
            </div>

            <style>{`
                .success-banner {
                    background: var(--brand-green-light);
                    border: 1px solid var(--brand-green);
                    border-radius: var(--radius-lg);
                    padding: 16px 20px;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    margin-bottom: 24px;
                    animation: slideIn 0.3s ease;
                }
                .icon-wrapper {
                    width: 32px; height: 32px; 
                    background: rgba(255,255,255,0.2); 
                    border-radius: 50%; 
                    display: flex; align-items: center; justify-content: center;
                }
                @keyframes slideIn {
                    from { opacity: 0; transform: translateY(-8px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </>
    );
}
