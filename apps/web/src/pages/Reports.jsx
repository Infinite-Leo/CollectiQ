import { FileText, Download, TrendingUp, Users, MapPin, BarChart3 } from 'lucide-react';
import { useToast } from '../components/ui/Toast';

function generateFinancialCSV() {
    const rows = [
        ['Date', 'Total Collected', 'Cash', 'UPI', 'Bank Transfer', 'Dues'],
        ['2026-10-07', '48500', '23000', '15500', '10000', '8500'],
        ['2026-10-06', '42300', '19700', '13200', '9400', '5200'],
        ['2026-10-05', '51200', '28000', '14800', '8400', '3200'],
        ['2026-10-04', '38900', '17500', '12600', '8800', '6100'],
        ['2026-10-03', '45600', '22100', '15900', '7600', '4800'],
    ];
    return rows.map(r => r.join(',')).join('\n');
}

function generateCollectorCSV() {
    const rows = [
        ['Collector', 'Total Collected', 'Donation Count', 'Avg Amount', 'Zones', 'Dues'],
        ['Ravi Kumar', '48500', '32', '1516', 'Zone A, Zone D', '8500'],
        ['Priya Sen', '42300', '28', '1511', 'Zone B', '3200'],
        ['Manoj Ghosh', '38900', '25', '1556', 'Zone A', '5100'],
        ['Ankit Sharma', '35600', '22', '1618', 'Zone C', '4200'],
        ['Sneha Das', '31200', '20', '1560', 'Zone B', '2800'],
    ];
    return rows.map(r => r.join(',')).join('\n');
}

function generateZoneCSV() {
    const rows = [
        ['Zone', 'Total Houses', 'Collected', 'Pending', 'Amount Collected', 'Penetration %'],
        ['Zone A', '120', '95', '25', '185000', '79'],
        ['Zone B', '88', '62', '26', '124000', '70'],
        ['Zone C', '65', '48', '17', '86000', '74'],
        ['Zone D', '42', '28', '14', '52000', '67'],
    ];
    return rows.map(r => r.join(',')).join('\n');
}

function downloadCSV(content, filename) {
    const blob = new Blob([content], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

const reportCards = [
    {
        title: 'Financial Summary',
        description: 'Daily collection totals, breakdown by mode, and expenses.',
        icon: TrendingUp,
        color: 'saffron',
        bgColor: 'var(--brand-saffron-light)',
        iconColor: 'var(--brand-saffron-dark)',
        csvFn: () => generateFinancialCSV(),
        filename: 'financial_summary.csv',
    },
    {
        title: 'Collector Performance',
        description: 'Individual collection rankings, zones covered, and efficiency.',
        icon: Users,
        color: 'info',
        bgColor: 'var(--color-info-light)',
        iconColor: 'var(--color-info)',
        csvFn: () => generateCollectorCSV(),
        filename: 'collector_performance.csv',
    },
    {
        title: 'Zone Analysis',
        description: 'Collection penetration by zone/ward and pending houses.',
        icon: MapPin,
        color: 'green',
        bgColor: 'var(--brand-green-light)',
        iconColor: 'var(--brand-green-dark)',
        csvFn: () => generateZoneCSV(),
        filename: 'zone_analysis.csv',
    },
];

const generatedReports = [
    { name: 'End of Day - Oct 7', by: 'System', date: 'Oct 7, 11:59 PM', csvFn: () => generateFinancialCSV(), filename: 'eod_oct7.csv' },
    { name: 'Weekly Summary (Oct 1-7)', by: 'Arjun Das', date: 'Oct 8, 10:00 AM', csvFn: () => generateFinancialCSV(), filename: 'weekly_oct1_7.csv' },
];

export default function Reports() {
    const toast = useToast();

    const handleDownload = (csvFn, filename) => {
        downloadCSV(csvFn(), filename);
        toast.success(`${filename} downloaded`);
    };

    return (
        <div className="page-body">
            <div className="card-header" style={{ border: 'none', padding: '0 0 var(--space-6) 0', background: 'transparent' }}>
                <div>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)' }}>Reports & Analytics</h2>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                        Export data and view detailed performance metrics.
                    </p>
                </div>
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: 'var(--space-6)',
                marginBottom: 'var(--space-8)'
            }}>
                {reportCards.map((r) => {
                    const Icon = r.icon;
                    return (
                        <div key={r.title} className="card" style={{ padding: 'var(--space-6)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
                                <div style={{
                                    padding: '12px',
                                    borderRadius: 'var(--radius-md)',
                                    background: r.bgColor,
                                    color: r.iconColor,
                                }}>
                                    <Icon size={24} />
                                </div>
                                <button
                                    className="btn btn-secondary"
                                    style={{ fontSize: '0.75rem', height: '32px' }}
                                    onClick={() => handleDownload(r.csvFn, r.filename)}
                                >
                                    <Download size={14} /> CSV
                                </button>
                            </div>
                            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>{r.title}</h3>
                            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 'var(--space-4)' }}>
                                {r.description}
                            </p>
                            <div style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>Last updated: Just now</div>
                        </div>
                    );
                })}
            </div>

            <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 'var(--space-4)' }}>Generated Reports</h3>
                <div className="card">
                    <div className="table-wrapper">
                        <table>
                            <thead>
                                <tr>
                                    <th style={{ width: '40%' }}>Report Name</th>
                                    <th>Generated By</th>
                                    <th>Date</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {generatedReports.map((r, i) => (
                                    <tr key={i}>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontWeight: 500 }}>
                                                <FileText size={16} style={{ color: 'var(--text-muted)' }} />
                                                {r.name}
                                            </div>
                                        </td>
                                        <td>{r.by}</td>
                                        <td style={{ color: 'var(--text-secondary)' }}>{r.date}</td>
                                        <td>
                                            <button
                                                className="btn btn-ghost"
                                                style={{ color: 'var(--brand-saffron)', fontSize: '0.75rem', padding: '4px 8px', height: 'auto' }}
                                                onClick={() => handleDownload(r.csvFn, r.filename)}
                                            >
                                                <Download size={14} />
                                                Download
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
