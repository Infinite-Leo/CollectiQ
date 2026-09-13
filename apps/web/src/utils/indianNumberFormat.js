/**
 * Indian Number Formatting Utilities
 * Standard Indian financial numbering framework (e.g. ₹5,42,500 or ₹8.4L)
 */

export function formatIndianCurrency(amount, includeSymbol = true) {
    const num = Number(amount) || 0;
    const formatted = num.toLocaleString('en-IN', {
        maximumFractionDigits: 2,
        minimumFractionDigits: 0,
    });
    return includeSymbol ? `₹${formatted}` : formatted;
}

export function formatIndianCompact(amount, includeSymbol = true) {
    const num = Math.abs(Number(amount) || 0);
    const sign = (Number(amount) || 0) < 0 ? '-' : '';
    const prefix = includeSymbol ? '₹' : '';

    if (num >= 10000000) {
        // Crores
        const cr = (num / 10000000).toFixed(1).replace(/\.0$/, '');
        return `${sign}${prefix}${cr}Cr`;
    }
    if (num >= 100000) {
        // Lakhs
        const lk = (num / 100000).toFixed(1).replace(/\.0$/, '');
        return `${sign}${prefix}${lk}L`;
    }
    if (num >= 1000) {
        // Thousands
        const k = (num / 1000).toFixed(1).replace(/\.0$/, '');
        return `${sign}${prefix}${k}K`;
    }

    return `${sign}${prefix}${num.toLocaleString('en-IN')}`;
}
