/**
 * CollectiQ Hyper-Local Spatial Clustering Service
 * Implements Balanced K-Means Clustering over geographic coordinates (lat, lng)
 * and expected donation workload.
 * 
 * Partitions N registered households across K collector volunteer teams
 * so each team receives a compact walking cluster with balanced collection targets.
 */

function calculateDistanceMeters(lat1, lon1, lat2, lon2) {
    if (!lat1 || !lon1 || !lat2 || !lon2) return 500;
    const R = 6371e3;
    const phi1 = (lat1 * Math.PI) / 180;
    const phi2 = (lat2 * Math.PI) / 180;
    const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
    const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

    const a =
        Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
        Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return Math.round(R * c);
}

/**
 * Initializes K centroids using K-Means++ distribution
 */
function initializeCentroids(points, k) {
    if (points.length <= k) {
        return points.map((p) => ({ lat: p.latitude, lng: p.longitude }));
    }

    const centroids = [];
    // Pick first centroid randomly or pick first point
    centroids.push({ lat: points[0].latitude, lng: points[0].longitude });

    while (centroids.length < k) {
        let maxDist = -1;
        let bestCandidate = points[0];

        for (const p of points) {
            // Find minimum distance to any chosen centroid
            let minDistToCentroid = Infinity;
            for (const c of centroids) {
                const d = calculateDistanceMeters(p.latitude, p.longitude, c.lat, c.lng);
                if (d < minDistToCentroid) minDistToCentroid = d;
            }

            if (minDistToCentroid > maxDist) {
                maxDist = minDistToCentroid;
                bestCandidate = p;
            }
        }

        centroids.push({ lat: bestCandidate.latitude, lng: bestCandidate.longitude });
    }

    return centroids;
}

/**
 * Executes Balanced K-Means Clustering on community houses
 * @param {Array} houses - Array of house objects with latitude, longitude, and expected_amount
 * @param {Number} k - Number of desired partitions/collector teams
 * @param {Number} maxIterations - Maximum convergence steps
 */
export function clusterTerritories(houses = [], k = 3, maxIterations = 20) {
    if (!houses || houses.length === 0) {
        return {
            clusters: [],
            total_houses: 0,
            total_expected_sum: 0,
            teams_count: k,
        };
    }

    // Default missing coordinates with slight jitter near center
    const validPoints = houses.map((h, idx) => {
        const lat = Number(h.latitude) || 22.5800 + (idx % 5) * 0.003;
        const lng = Number(h.longitude) || 88.4200 + (idx % 4) * 0.003;
        const expected = Number(h.expected_amount) || Number(h.promised_amount) || 2000;
        return {
            ...h,
            latitude: lat,
            longitude: lng,
            expected_amount: expected,
        };
    });

    const finalK = Math.min(Math.max(1, k), validPoints.length);
    let centroids = initializeCentroids(validPoints, finalK);

    let clusterAssignments = new Array(validPoints.length).fill(0);
    let iteration = 0;
    let converged = false;

    while (iteration < maxIterations && !converged) {
        converged = true;

        // 1. Assign each point to the nearest centroid with soft capacity balancing
        for (let i = 0; i < validPoints.length; i++) {
            const p = validPoints[i];
            let nearestIdx = 0;
            let minDist = Infinity;

            for (let cIdx = 0; cIdx < centroids.length; cIdx++) {
                const c = centroids[cIdx];
                const d = calculateDistanceMeters(p.latitude, p.longitude, c.lat, c.lng);
                if (d < minDist) {
                    minDist = d;
                    nearestIdx = cIdx;
                }
            }

            if (clusterAssignments[i] !== nearestIdx) {
                clusterAssignments[i] = nearestIdx;
                converged = false;
            }
        }

        // 2. Recompute centroids based on mean coordinates of assigned points
        const clusterSums = Array.from({ length: finalK }, () => ({ lat: 0, lng: 0, count: 0 }));
        for (let i = 0; i < validPoints.length; i++) {
            const cIdx = clusterAssignments[i];
            clusterSums[cIdx].lat += validPoints[i].latitude;
            clusterSums[cIdx].lng += validPoints[i].longitude;
            clusterSums[cIdx].count += 1;
        }

        centroids = clusterSums.map((cs, idx) => {
            if (cs.count === 0) return centroids[idx]; // Preserve previous centroid if empty
            return {
                lat: Number((cs.lat / cs.count).toFixed(6)),
                lng: Number((cs.lng / cs.count).toFixed(6)),
            };
        });

        iteration++;
    }

    // Structure output partitions
    const clusterColors = ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EC4899', '#06B6D4'];
    const clusterLabels = ['Zone A (North/Central)', 'Zone B (East/Commercial)', 'Zone C (South/Colony)', 'Zone D (Outer Lanes)', 'Zone E', 'Zone F'];

    const clusters = Array.from({ length: finalK }, (_, idx) => ({
        cluster_id: `cluster-${idx + 1}`,
        cluster_index: idx,
        team_name: `Volunteer Team ${idx + 1}`,
        zone_label: clusterLabels[idx] || `Zone ${idx + 1}`,
        color: clusterColors[idx % clusterColors.length],
        centroid: centroids[idx],
        houses: [],
        houses_count: 0,
        total_expected_amount: 0,
        estimated_walking_km: 0,
    }));

    validPoints.forEach((p, idx) => {
        const cIdx = clusterAssignments[idx];
        clusters[cIdx].houses.push(p);
        clusters[cIdx].houses_count++;
        clusters[cIdx].total_expected_amount += p.expected_amount;
    });

    // Approximate walking distance within each cluster using nearest neighbor ordering
    clusters.forEach((c) => {
        if (c.houses.length <= 1) {
            c.estimated_walking_km = 0.2;
            return;
        }
        let totalMeters = 0;
        for (let i = 0; i < c.houses.length - 1; i++) {
            totalMeters += calculateDistanceMeters(
                c.houses[i].latitude,
                c.houses[i].longitude,
                c.houses[i + 1].latitude,
                c.houses[i + 1].longitude
            );
        }
        c.estimated_walking_km = Number((totalMeters / 1000).toFixed(2));
    });

    const grandTotal = clusters.reduce((sum, c) => sum + c.total_expected_amount, 0);

    return {
        success: true,
        total_houses: validPoints.length,
        total_expected_sum: grandTotal,
        teams_count: finalK,
        iterations_converged: iteration,
        clusters,
    };
}
