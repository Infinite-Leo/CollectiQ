/**
 * Centralized error handler — catches all errors from middleware & routes.
 */
export function errorHandler(err, _req, res, _next) {
    console.error('❌ Error:', err.message);

    // Zod validation errors
    if (err.name === 'ZodError') {
        return res.status(400).json({
            error: 'Validation error',
            details: err.issues.map((i) => ({
                field: i.path.join('.'),
                message: i.message,
            })),
        });
    }

    // PostgreSQL unique constraint violation
    if (err.code === '23505') {
        return res.status(409).json({
            error: 'Duplicate entry',
            detail: err.detail,
        });
    }

    // PostgreSQL foreign key violation
    if (err.code === '23503') {
        return res.status(400).json({
            error: 'Invalid reference',
            detail: err.detail,
        });
    }

    // Default
    const status = err.statusCode || 500;
    res.status(status).json({
        error: err.message || 'Internal server error',
        ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
    });
}
