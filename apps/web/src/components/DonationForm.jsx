import { useState, useEffect } from 'react';
import { Search, User, IndianRupee, CreditCard, Banknote, Landmark, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useAppData } from '../context/AppDataContext';

export default function DonationForm({ onSuccess }) {
    const { donors, addDonor, addDonation } = useAppData();
    const [step, setStep] = useState('input'); // input -> success
    const [formData, setFormData] = useState({
        donor_id: null,
        donor_name: '',
        phone: '',
        amount: '',
        mode: 'cash',
        status: 'paid',
    });
    const [filteredDonors, setFilteredDonors] = useState([]);
    const [searching, setSearching] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Search donors from context
    useEffect(() => {
        if (formData.donor_name.length < 2) {
            setFilteredDonors([]);
            return;
        }

        const timeoutId = setTimeout(() => {
            setSearching(true);
            const q = formData.donor_name.toLowerCase();
            const results = donors.filter(d =>
                d.full_name.toLowerCase().includes(q) ||
                (d.phone && d.phone.includes(q))
            ).slice(0, 5);

            setFilteredDonors(results);
            setSearching(false);
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [formData.donor_name, donors]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // Simulate network delay for better UX
            await new Promise(resolve => setTimeout(resolve, 600));

            // 1. Create or get donor
            let donorId = formData.donor_id;
            if (!donorId && formData.donor_name) {
                const newDonor = addDonor({
                    full_name: formData.donor_name,
                    phone: formData.phone,
                });
                donorId = newDonor.id;
            }

            // 2. Create donation
            const result = addDonation({
                donor: formData.donor_name,
                donor_id: donorId,
                amount: formData.amount,
                mode: formData.mode,
                status: formData.status,
            });

            setStep('success');
            if (onSuccess) onSuccess({
                ...result,
                date: new Date().toLocaleString(),
            });
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (step === 'success') {
        return (
            <div className="success-view">
                <div className="success-icon">
                    <CheckCircle size={48} />
                </div>
                <h3>Donation Recorded!</h3>
                <p>Receipt sent to {formData.donor_name}</p>
                <div className="actions">
                    <button
                        className="btn btn-secondary"
                        onClick={() => {
                            setStep('input');
                            setFormData({ donor_id: null, donor_name: '', phone: '', amount: '', mode: 'cash', status: 'paid' });
                        }}
                    >
                        New Donation
                    </button>
                    <button className="btn btn-primary" onClick={() => window.location.reload()}>
                        Done
                    </button>
                </div>
                <style>{`
                    .success-view { text-align: center; padding: var(--space-8) 0; animation: fadeIn 0.3s ease; }
                    .success-icon { 
                        width: 80px; height: 80px; border-radius: 50%; background: var(--brand-green-light); 
                        color: var(--brand-green); display: flex; alignItems: center; justifyContent: center; margin: 0 auto var(--space-4);
                    }
                    .success-view h3 { font-size: 1.5rem; margin-bottom: var(--space-2); color: var(--text-primary); }
                    .success-view p { color: var(--text-secondary); margin-bottom: var(--space-6); }
                    .actions { display: flex; justify-content: center; gap: var(--space-4); }
                `}</style>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="donation-form">
            {/* Donor Search */}
            <div className="form-group relative">
                <label className="form-label">Donor Name</label>
                <div className="input-wrapper">
                    <User size={18} className="input-icon" />
                    <input
                        type="text"
                        className="form-input"
                        placeholder="Search or enter name"
                        value={formData.donor_name}
                        onChange={(e) => setFormData({ ...formData, donor_name: e.target.value, donor_id: null })}
                        required
                        style={{ paddingLeft: '40px' }}
                    />
                    {searching && <Loader2 size={16} className="input-spinner" />}
                </div>

                {/* Search Results */}
                {filteredDonors.length > 0 && formData.donor_id === null && (
                    <div className="dropdown">
                        {filteredDonors.map(d => (
                            <div
                                key={d.id}
                                className="dropdown-item"
                                onClick={() => {
                                    setFormData({ ...formData, donor_name: d.full_name, donor_id: d.id, phone: d.phone || '' });
                                    setFilteredDonors([]);
                                }}
                            >
                                <div className="name">{d.full_name}</div>
                                {d.zone && <div className="meta">{d.zone} • {d.phone}</div>}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Phone (New Donor) */}
            {!formData.donor_id && formData.donor_name.length > 0 && (
                <div className="form-group slide-down">
                    <label className="form-label">Phone Number (Optional)</label>
                    <input
                        type="tel"
                        className="form-input"
                        placeholder="For SMS receipt"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                </div>
            )}

            {/* Amount */}
            <div className="form-group">
                <label className="form-label">Amount</label>
                <div className="input-wrapper">
                    <span className="currency-symbol">₹</span>
                    <input
                        type="number"
                        className="form-input-lg"
                        placeholder="0"
                        value={formData.amount}
                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                        required
                        min="1"
                        style={{ paddingLeft: '30px' }}
                    />
                </div>
            </div>

            {/* Payment Mode Grid */}
            <div className="form-group">
                <label className="form-label">Payment Mode</label>
                <div className="mode-grid">
                    {[
                        { id: 'cash', label: 'Cash', icon: Banknote },
                        { id: 'upi', label: 'UPI', icon: CreditCard },
                        { id: 'bank_transfer', label: 'Bank', icon: Landmark },
                    ].map(m => (
                        <button
                            key={m.id}
                            type="button"
                            className={`mode-btn ${formData.mode === m.id ? 'active' : ''}`}
                            onClick={() => setFormData({ ...formData, mode: m.id })}
                        >
                            <m.icon size={20} />
                            <span>{m.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Status Toggle */}
            <div className="form-group">
                <label className="form-label">Payment Status</label>
                <div className="toggle-group status-toggle">
                    <button
                        type="button"
                        className={`toggle-option ${formData.status === 'paid' ? 'active paid' : ''}`}
                        onClick={() => setFormData({ ...formData, status: 'paid' })}
                    >
                        Paid
                    </button>
                    <button
                        type="button"
                        className={`toggle-option ${formData.status === 'due' ? 'active due' : ''}`}
                        onClick={() => setFormData({ ...formData, status: 'due' })}
                    >
                        Due
                    </button>
                </div>
            </div>

            {error && (
                <div className="error-msg">
                    <AlertCircle size={16} />
                    {error}
                </div>
            )}

            <button type="submit" className="btn btn-primary submit-btn" disabled={loading}>
                {loading ? <Loader2 size={20} className="animate-spin" /> : 'Confirm Donation'}
            </button>

            <style>{`
                .donation-form { display: flex; flex-direction: column; gap: var(--space-5); }
                .relative { position: relative; }
                .input-wrapper { position: relative; }
                .input-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--text-muted); }
                .input-spinner { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); color: var(--text-muted); animation: spin 1s linear infinite; }
                .form-input-lg { width: 100%; text-align: left; padding-left: 40px; }
                .currency-symbol { position: absolute; left: 16px; top: 50%; transform: translateY(-50%); font-size: 1.25rem; color: var(--text-muted); font-weight: 600; }
                
                .dropdown {
                    position: absolute; top: 100%; left: 0; right: 0;
                    background: var(--bg-surface); border: 1px solid var(--border-default);
                    border-radius: var(--radius-md); box-shadow: var(--shadow-lg);
                    z-index: 10; max-height: 200px; overflow-y: auto; margin-top: 4px;
                }
                .dropdown-item { padding: 8px 12px; cursor: pointer; transition: background 0.1s; }
                .dropdown-item:hover { background: var(--bg-surface-hover); }
                .dropdown-item .name { font-weight: 500; color: var(--text-primary); }
                .dropdown-item .meta { font-size: 0.75rem; color: var(--text-muted); }

                .mode-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--space-3); }
                .mode-btn {
                    display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px;
                    padding: 12px; border: 1px solid var(--border-default); border-radius: var(--radius-md);
                    background: var(--bg-surface); cursor: pointer; transition: all 0.2s;
                    color: var(--text-secondary);
                }
                .mode-btn:hover { background: var(--bg-surface-hover); }
                .mode-btn.active {
                    border-color: var(--brand-saffron); background: var(--brand-saffron-50);
                    color: var(--brand-saffron-dark); box-shadow: 0 0 0 1px var(--brand-saffron);
                }

                .status-toggle .active.paid { background: var(--brand-green-light); color: var(--brand-green-dark); }
                .status-toggle .active.due { background: var(--color-error-light); color: var(--color-error); }

                .error-msg { 
                    background: var(--color-error-light); color: var(--color-error); 
                    padding: 10px; border-radius: var(--radius-md); font-size: 0.875rem; 
                    display: flex; align-items: center; gap: 8px; 
                }
                .submit-btn { width: 100%; justify-content: center; height: 48px; font-size: 1rem; }
                .slide-down { animation: slideDown 0.2s ease; }
                @keyframes slideDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes spin { from { transform: translateY(-50%) rotate(0deg); } to { transform: translateY(-50%) rotate(360deg); } }
            `}</style>
        </form>
    );
}
