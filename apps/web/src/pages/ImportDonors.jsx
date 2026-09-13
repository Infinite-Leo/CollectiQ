import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Upload,
    FileSpreadsheet,
    CheckCircle,
    AlertTriangle,
    ArrowRight,
    ArrowLeft,
    Download,
    Users,
    Check,
    X,
    Loader2,
} from 'lucide-react';
import { apiFetch } from '../utils/api';
import { formatIndianCurrency } from '../utils/indianNumberFormat';

const EXPECTED_FIELDS = [
    { key: 'full_name', label: 'Donor Full Name *', required: true, aliases: ['name', 'donor', 'donor_name', 'full_name'] },
    { key: 'phone', label: 'Phone Number', required: false, aliases: ['phone', 'mobile', 'contact', 'phone_number'] },
    { key: 'address', label: 'Address / Flat *', required: true, aliases: ['address', 'flat', 'house', 'building', 'address_line'] },
    { key: 'last_year_amount', label: 'Previous Year Amount (₹)', required: false, aliases: ['last_year', 'lastyear', 'amount', 'expected', 'prev_amount'] },
    { key: 'zone', label: 'Zone / Ward', required: false, aliases: ['zone', 'ward', 'sector', 'locality'] },
];

const SAMPLE_CSV = `full_name,phone,address,last_year_amount,zone
Subhashis Paul,+91 98301 23456,12/A Southern Avenue,2500,Zone A
Mita Sengupta,+91 98310 98765,Flat 4B Lake Gardens,5000,Zone A
Animesh Roy,+91 91234 56789,88 Rashbehari Avenue,1500,Zone B
Debasis Ghosh,+91 94330 11223,Block C Salt Lake,3000,Zone C`;

export default function ImportDonors() {
    const navigate = useNavigate();
    const fileInputRef = useRef(null);

    const [currentStep, setCurrentStep] = useState(1); // 1: Upload, 2: Map, 3: Preview & Submit
    const [rawHeaders, setRawHeaders] = useState([]);
    const [parsedRows, setParsedRows] = useState([]);
    const [columnMap, setColumnMap] = useState({});
    const [fileName, setFileName] = useState('');
    const [duplicateStrategy, setDuplicateStrategy] = useState('SKIP'); // 'SKIP' | 'UPDATE'
    const [submitting, setSubmitting] = useState(false);
    const [importResult, setImportResult] = useState(null);

    // Download sample template CSV
    const handleDownloadSample = () => {
        const blob = new Blob([SAMPLE_CSV], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'collectiq_donors_sample.csv';
        a.click();
        URL.revokeObjectURL(url);
    };

    // Parse uploaded CSV file
    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setFileName(file.name);
        const reader = new FileReader();

        reader.onload = (ev) => {
            const text = ev.target.result;
            const lines = text
                .split('\n')
                .map((l) => l.trim())
                .filter(Boolean);

            if (lines.length < 2) {
                alert('The uploaded CSV file is empty or missing a header row.');
                return;
            }

            const headers = lines[0].split(',').map((h) => h.trim().replace(/^["']|["']$/g, ''));
            setRawHeaders(headers);

            // Auto-guess mapping based on header aliases
            const initialMap = {};
            EXPECTED_FIELDS.forEach((f) => {
                const matchedHeader = headers.find((h) =>
                    f.aliases.some((alias) => h.toLowerCase().replace(/[^a-z0-9]/g, '') === alias.replace(/[^a-z0-9]/g, ''))
                );
                if (matchedHeader) {
                    initialMap[f.key] = matchedHeader;
                }
            });
            setColumnMap(initialMap);

            // Parse data rows
            const rows = lines.slice(1).map((line) => {
                // Basic CSV split respecting quotes
                const values = line.split(',').map((v) => v.trim().replace(/^["']|["']$/g, ''));
                const obj = {};
                headers.forEach((h, i) => {
                    obj[h] = values[i] || '';
                });
                return obj;
            });

            setParsedRows(rows);
            setCurrentStep(2);
        };

        reader.readAsText(file);
    };

    // Transform parsed rows into mapped donor objects
    const getMappedDonors = () => {
        return parsedRows.map((row) => ({
            full_name: row[columnMap.full_name] || '',
            phone: row[columnMap.phone] || null,
            address: row[columnMap.address] || '',
            last_year_amount: Number(row[columnMap.last_year_amount]) || 0,
            zone: row[columnMap.zone] || 'Zone A',
        }));
    };

    const handleSubmitImport = async () => {
        const donorsToImport = getMappedDonors().filter((d) => d.full_name && d.address);

        if (donorsToImport.length === 0) {
            alert('No valid rows found to import. Make sure Full Name and Address are mapped.');
            return;
        }

        setSubmitting(true);
        try {
            const res = await apiFetch('/api/v1/import/donors', {
                method: 'POST',
                body: JSON.stringify({
                    donors: donorsToImport,
                    duplicate_strategy: duplicateStrategy,
                }),
            });

            setImportResult(res.data || {
                total_processed: donorsToImport.length,
                inserted: donorsToImport.length,
                duplicates_skipped: 0,
                updated: 0,
            });
            setCurrentStep(4); // Success step
        } catch (err) {
            alert('Import failed: ' + err.message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div style={{ maxWidth: '960px', margin: '0 auto', paddingBottom: '40px' }}>
            {/* Header */}
            <div style={{ marginBottom: '24px' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1B5E20', margin: 0 }}>
                    Import Donors & Households from Excel / CSV
                </h1>
                <p style={{ fontSize: '0.875rem', color: '#616161', marginTop: '4px' }}>
                    Quickly bring your existing community register, notebook spreadsheet, or last year's donor list into CollectiQ
                </p>
            </div>

            {/* Stepper Wizard Bar */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E0E0E0',
                    borderRadius: '8px',
                    padding: '16px 24px',
                    marginBottom: '24px',
                }}
            >
                {[
                    { step: 1, label: '1. Select File' },
                    { step: 2, label: '2. Match Columns' },
                    { step: 3, label: '3. Preview & Confirm' },
                ].map((s) => (
                    <div
                        key={s.step}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            fontWeight: 800,
                            fontSize: '0.875rem',
                            color: currentStep >= s.step ? '#1B5E20' : '#9E9E9E',
                        }}
                    >
                        <div
                            style={{
                                width: '28px',
                                height: '28px',
                                borderRadius: '50%',
                                backgroundColor: currentStep >= s.step ? '#1B5E20' : '#E0E0E0',
                                color: currentStep >= s.step ? '#FFFFFF' : '#757575',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.75rem',
                            }}
                        >
                            {currentStep > s.step ? '✓' : s.step}
                        </div>
                        <span>{s.label}</span>
                    </div>
                ))}
            </div>

            {/* STEP 1: FILE UPLOAD */}
            {currentStep === 1 && (
                <div
                    style={{
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #E0E0E0',
                        borderRadius: '8px',
                        padding: '32px 24px',
                        textAlign: 'center',
                    }}
                >
                    <input
                        type="file"
                        ref={fileInputRef}
                        accept=".csv"
                        style={{ display: 'none' }}
                        onChange={handleFileUpload}
                    />

                    <div
                        onClick={() => fileInputRef.current?.click()}
                        style={{
                            border: '2px dashed #1B5E20',
                            borderRadius: '10px',
                            padding: '40px 20px',
                            backgroundColor: '#F9FBF9',
                            cursor: 'pointer',
                            marginBottom: '20px',
                        }}
                    >
                        <FileSpreadsheet size={48} color="#1B5E20" style={{ margin: '0 auto 12px' }} />
                        <h3 style={{ margin: '0 0 6px', fontSize: '1.125rem', fontWeight: 800, color: '#1B5E20' }}>
                            Click to Select CSV or Spreadsheet File
                        </h3>
                        <p style={{ margin: 0, fontSize: '0.8125rem', color: '#616161' }}>
                            Supports files exported from Microsoft Excel, Google Sheets, or Apple Numbers (.csv)
                        </p>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontSize: '0.8125rem', color: '#616161' }}>Need a formatted template to start?</span>
                        <button
                            type="button"
                            onClick={handleDownloadSample}
                            style={{
                                padding: '8px 14px',
                                minHeight: '40px',
                                backgroundColor: '#E8F5E9',
                                border: '1px solid #2E7D32',
                                color: '#1B5E20',
                                fontWeight: 700,
                                fontSize: '0.8125rem',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                            }}
                        >
                            <Download size={15} />
                            <span>Download Sample CSV Template</span>
                        </button>
                    </div>
                </div>
            )}

            {/* STEP 2: COLUMN MAPPING */}
            {currentStep === 2 && (
                <div
                    style={{
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #E0E0E0',
                        borderRadius: '8px',
                        padding: '24px',
                    }}
                >
                    <div style={{ marginBottom: '16px' }}>
                        <h3 style={{ margin: 0, fontSize: '1.0625rem', fontWeight: 800, color: '#1B5E20' }}>
                            Match Columns from "{fileName}"
                        </h3>
                        <p style={{ margin: '4px 0 0', fontSize: '0.8125rem', color: '#616161' }}>
                            Verify that your spreadsheet columns map to the correct CollectiQ donor attributes.
                        </p>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                        {EXPECTED_FIELDS.map((field) => (
                            <div
                                key={field.key}
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: '220px 1fr',
                                    alignItems: 'center',
                                    gap: '16px',
                                    padding: '12px 14px',
                                    backgroundColor: '#F9F9FB',
                                    borderRadius: '6px',
                                    border: '1px solid #E0E0E0',
                                }}
                            >
                                <span style={{ fontWeight: 700, fontSize: '0.875rem', color: field.required ? '#1B5E20' : '#424242' }}>
                                    {field.label}
                                </span>
                                <select
                                    value={columnMap[field.key] || ''}
                                    onChange={(e) => setColumnMap({ ...columnMap, [field.key]: e.target.value })}
                                    style={{
                                        width: '100%',
                                        minHeight: '44px',
                                        padding: '8px 12px',
                                        borderRadius: '6px',
                                        border: columnMap[field.key] ? '2px solid #2E7D32' : '1px solid #BDBDBD',
                                        fontSize: '0.875rem',
                                        fontWeight: 600,
                                    }}
                                >
                                    <option value="">— Select matching column —</option>
                                    {rawHeaders.map((h) => (
                                        <option key={h} value={h}>
                                            {h} (Example: "{parsedRows[0]?.[h] || '—'}")
                                        </option>
                                    ))}
                                </select>
                            </div>
                        ))}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <button
                            type="button"
                            onClick={() => setCurrentStep(1)}
                            style={{
                                minHeight: '44px',
                                padding: '8px 16px',
                                backgroundColor: '#FFFFFF',
                                border: '1px solid #9E9E9E',
                                borderRadius: '6px',
                                fontWeight: 700,
                                fontSize: '0.8125rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                            }}
                        >
                            <ArrowLeft size={16} />
                            <span>Change File</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => {
                                if (!columnMap.full_name || !columnMap.address) {
                                    alert('Please map both "Donor Full Name" and "Address" columns to proceed.');
                                    return;
                                }
                                setCurrentStep(3);
                            }}
                            style={{
                                minHeight: '48px',
                                padding: '10px 20px',
                                backgroundColor: '#1B5E20',
                                color: '#FFFFFF',
                                border: 'none',
                                borderRadius: '6px',
                                fontWeight: 800,
                                fontSize: '0.875rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                            }}
                        >
                            <span>Continue to Preview ({parsedRows.length} rows)</span>
                            <ArrowRight size={16} />
                        </button>
                    </div>
                </div>
            )}

            {/* STEP 3: PREVIEW & DUPLICATE CONFIGURATION */}
            {currentStep === 3 && (
                <div
                    style={{
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #E0E0E0',
                        borderRadius: '8px',
                        padding: '24px',
                    }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '1.0625rem', fontWeight: 800, color: '#1B5E20' }}>
                                Preview Mapped Records ({parsedRows.length} Donors)
                            </h3>
                            <p style={{ margin: '4px 0 0', fontSize: '0.8125rem', color: '#616161' }}>
                                Review the data before committing to the database.
                            </p>
                        </div>

                        {/* Duplicate Strategy Toggle */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#F9F9FB', padding: '6px 12px', borderRadius: '6px', border: '1px solid #E0E0E0' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#424242' }}>If phone/name already exists:</span>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', cursor: 'pointer' }}>
                                <input
                                    type="radio"
                                    name="dup"
                                    checked={duplicateStrategy === 'SKIP'}
                                    onChange={() => setDuplicateStrategy('SKIP')}
                                />
                                <span>Skip duplicate</span>
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', cursor: 'pointer' }}>
                                <input
                                    type="radio"
                                    name="dup"
                                    checked={duplicateStrategy === 'UPDATE'}
                                    onChange={() => setDuplicateStrategy('UPDATE')}
                                />
                                <span>Update record</span>
                            </label>
                        </div>
                    </div>

                    <div className="table-wrapper" style={{ maxHeight: '320px', overflowY: 'auto', border: '1px solid #E0E0E0', borderRadius: '6px', marginBottom: '24px' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                            <thead>
                                <tr style={{ backgroundColor: '#F5F5F5', borderBottom: '2px solid #E0E0E0', textAlign: 'left' }}>
                                    <th style={{ padding: '8px 12px', fontWeight: 800 }}>#</th>
                                    <th style={{ padding: '8px 12px', fontWeight: 800 }}>Donor Full Name</th>
                                    <th style={{ padding: '8px 12px', fontWeight: 800 }}>Phone</th>
                                    <th style={{ padding: '8px 12px', fontWeight: 800 }}>Address / Flat</th>
                                    <th style={{ padding: '8px 12px', fontWeight: 800, textAlign: 'right' }}>Prev Amount</th>
                                    <th style={{ padding: '8px 12px', fontWeight: 800 }}>Zone</th>
                                </tr>
                            </thead>
                            <tbody>
                                {getMappedDonors().slice(0, 10).map((d, i) => (
                                    <tr key={i} style={{ borderBottom: '1px solid #E0E0E0' }}>
                                        <td style={{ padding: '8px 12px', color: '#757575' }}>{i + 1}</td>
                                        <td style={{ padding: '8px 12px', fontWeight: 700, color: '#1B5E20' }}>{d.full_name}</td>
                                        <td style={{ padding: '8px 12px', color: '#424242' }}>{d.phone || '—'}</td>
                                        <td style={{ padding: '8px 12px' }}>{d.address}</td>
                                        <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700 }}>
                                            {formatIndianCurrency(d.last_year_amount)}
                                        </td>
                                        <td style={{ padding: '8px 12px' }}>{d.zone}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <button
                            type="button"
                            onClick={() => setCurrentStep(2)}
                            style={{
                                minHeight: '44px',
                                padding: '8px 16px',
                                backgroundColor: '#FFFFFF',
                                border: '1px solid #9E9E9E',
                                borderRadius: '6px',
                                fontWeight: 700,
                                fontSize: '0.8125rem',
                                cursor: 'pointer',
                            }}
                        >
                            Back to Mapping
                        </button>

                        <button
                            type="button"
                            disabled={submitting}
                            onClick={handleSubmitImport}
                            style={{
                                minHeight: '48px',
                                padding: '10px 24px',
                                backgroundColor: '#1B5E20',
                                color: '#FFFFFF',
                                border: 'none',
                                borderRadius: '6px',
                                fontWeight: 800,
                                fontSize: '0.9375rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                            }}
                        >
                            {submitting ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle size={18} />}
                            <span>{submitting ? 'Importing Records...' : `Commit ${parsedRows.length} Donors to Database`}</span>
                        </button>
                    </div>
                </div>
            )}

            {/* STEP 4: SUCCESS SUMMARY */}
            {currentStep === 4 && importResult && (
                <div
                    style={{
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #E0E0E0',
                        borderRadius: '8px',
                        padding: '32px 24px',
                        textAlign: 'center',
                    }}
                >
                    <div
                        style={{
                            width: '56px',
                            height: '56px',
                            borderRadius: '50%',
                            backgroundColor: '#E8F5E9',
                            color: '#1B5E20',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 16px',
                        }}
                    >
                        <CheckCircle size={36} />
                    </div>

                    <h2 style={{ fontSize: '1.375rem', fontWeight: 800, color: '#1B5E20', margin: '0 0 8px' }}>
                        Import Successfully Completed!
                    </h2>
                    <p style={{ fontSize: '0.875rem', color: '#616161', margin: '0 0 24px' }}>
                        Your donor records and mapped households have been added to CollectiQ.
                    </p>

                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                            gap: '12px',
                            maxWidth: '500px',
                            margin: '0 auto 28px',
                        }}
                    >
                        <div style={{ padding: '14px', backgroundColor: '#F9F9FB', borderRadius: '6px', border: '1px solid #E0E0E0' }}>
                            <span style={{ fontSize: '0.75rem', color: '#757575', textTransform: 'uppercase' }}>Processed</span>
                            <div style={{ fontSize: '1.375rem', fontWeight: 800, color: '#212121', marginTop: '2px' }}>
                                {importResult.total_processed}
                            </div>
                        </div>
                        <div style={{ padding: '14px', backgroundColor: '#E8F5E9', borderRadius: '6px', border: '1px solid #A5D6A7' }}>
                            <span style={{ fontSize: '0.75rem', color: '#1B5E20', textTransform: 'uppercase' }}>Newly Added</span>
                            <div style={{ fontSize: '1.375rem', fontWeight: 800, color: '#1B5E20', marginTop: '2px' }}>
                                {importResult.inserted}
                            </div>
                        </div>
                        <div style={{ padding: '14px', backgroundColor: '#FFF3E0', borderRadius: '6px', border: '1px solid #FFE0B2' }}>
                            <span style={{ fontSize: '0.75rem', color: '#E65100', textTransform: 'uppercase' }}>Duplicates Handled</span>
                            <div style={{ fontSize: '1.375rem', fontWeight: 800, color: '#E65100', marginTop: '2px' }}>
                                {importResult.duplicates_skipped || importResult.updated || 0}
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                        <button
                            type="button"
                            onClick={() => navigate('/donors')}
                            style={{
                                minHeight: '44px',
                                padding: '10px 20px',
                                backgroundColor: '#1B5E20',
                                color: '#FFFFFF',
                                border: 'none',
                                borderRadius: '6px',
                                fontWeight: 800,
                                fontSize: '0.875rem',
                                cursor: 'pointer',
                            }}
                        >
                            View All Donors
                        </button>
                        <button
                            type="button"
                            onClick={() => navigate('/houses')}
                            style={{
                                minHeight: '44px',
                                padding: '10px 20px',
                                backgroundColor: '#FFFFFF',
                                border: '1px solid #1B5E20',
                                color: '#1B5E20',
                                borderRadius: '6px',
                                fontWeight: 700,
                                fontSize: '0.875rem',
                                cursor: 'pointer',
                            }}
                        >
                            View Mapped Households
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
