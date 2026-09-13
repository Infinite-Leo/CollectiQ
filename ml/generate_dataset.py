"""
CollectiQ Hyper-Local Donation Dataset Generator
Simulates realistic Indian community/para festival giving patterns across 3 consecutive years.
Models locality tiers, household premises types, YoY giving drift, consistency, and payment mode preferences.
"""

import csv
import random
import math

LOCALITY_PROFILES = {
    "TIER_1": {
        "name": "Ballygunge / Salt Lake",
        "median_donation": 2500,
        "std_dev": 1200,
        "min_donation": 1000,
        "max_donation": 25000,
        "upi_preference": 0.65,
    },
    "TIER_2": {
        "name": "Behala / Garia / Jadavpur",
        "median_donation": 1500,
        "std_dev": 700,
        "min_donation": 500,
        "max_donation": 12000,
        "upi_preference": 0.45,
    },
    "TIER_3": {
        "name": "Suburban / Outer Ward",
        "median_donation": 800,
        "std_dev": 400,
        "min_donation": 300,
        "max_donation": 5000,
        "upi_preference": 0.30,
    }
}

HOUSE_TYPE_MULTIPLIERS = {
    "INDEPENDENT_HOUSE": 1.35,
    "APARTMENT_FLAT": 1.00,
    "COMMERCIAL_SHOP": 1.75,
    "CLINIC_PROFESSIONAL": 1.50,
}

PAYMENT_MODES = ["CASH", "UPI", "CHEQUE"]

def generate_donation_history(locality_tier, house_type):
    profile = LOCALITY_PROFILES[locality_tier]
    mult = HOUSE_TYPE_MULTIPLIERS[house_type]
    
    # Base donation capacity using log-normal distribution to reflect real wealth distributions
    mu = math.log(profile["median_donation"] * mult)
    sigma = 0.45
    base_capacity = math.exp(random.gauss(mu, sigma))
    base_capacity = max(profile["min_donation"], min(profile["max_donation"], base_capacity))
    
    # Consistency factor (does this house donate every year or skip?)
    consistency = random.choices([1.0, 0.9, 0.7, 0.4], weights=[0.65, 0.20, 0.10, 0.05])[0]
    
    # 2023 donation
    if random.random() <= consistency:
        don_2023 = round(base_capacity * random.uniform(0.85, 1.05) / 50) * 50
    else:
        don_2023 = 0
        
    # 2024 donation (~7-10% inflation/growth if active)
    if random.random() <= consistency:
        ref = don_2023 if don_2023 > 0 else base_capacity
        don_2024 = round(ref * random.uniform(1.04, 1.14) / 50) * 50
    else:
        don_2024 = 0
        
    # 2025 donation
    if random.random() <= consistency:
        ref = don_2024 if don_2024 > 0 else (don_2023 if don_2023 > 0 else base_capacity)
        don_2025 = round(ref * random.uniform(1.05, 1.15) / 50) * 50
    else:
        don_2025 = 0

    # Payment Mode Preference
    if random.random() < profile["upi_preference"]:
        pref_mode = "UPI"
    elif random.random() < 0.12 and base_capacity > 5000:
        pref_mode = "CHEQUE"
    else:
        pref_mode = "CASH"

    # Ground truth Target for 2026
    # If consistently active, expected ~8-12% growth over 2025
    most_recent = don_2025 or don_2024 or don_2023 or base_capacity
    yoy_momentum = 1.09 if consistency >= 0.9 else (1.02 if consistency >= 0.7 else 0.85)
    noise = random.uniform(0.95, 1.05)
    target_2026 = round((most_recent * yoy_momentum * noise) / 50) * 50
    target_2026 = max(profile["min_donation"], target_2026)

    return {
        "locality_tier": locality_tier,
        "house_type": house_type,
        "donation_2023": int(don_2023),
        "donation_2024": int(don_2024),
        "donation_2025": int(don_2025),
        "consistency_score": round(consistency, 2),
        "preferred_mode": pref_mode,
        "earning_members": random.choice([1, 2, 2, 3, 4]),
        "target_2026": int(target_2026)
    }

def main(num_samples=3000, output_path="ml/donation_historical_dataset.csv"):
    random.seed(42)
    records = []
    
    tiers = ["TIER_1", "TIER_2", "TIER_3"]
    tier_weights = [0.35, 0.45, 0.20]
    
    house_types = ["INDEPENDENT_HOUSE", "APARTMENT_FLAT", "COMMERCIAL_SHOP", "CLINIC_PROFESSIONAL"]
    house_weights = [0.30, 0.50, 0.15, 0.05]
    
    for i in range(num_samples):
        t = random.choices(tiers, weights=tier_weights)[0]
        h = random.choices(house_types, weights=house_weights)[0]
        rec = generate_donation_history(t, h)
        rec["donor_id"] = f"DN-{10000 + i}"
        records.append(rec)
        
    fieldnames = [
        "donor_id", "locality_tier", "house_type", 
        "donation_2023", "donation_2024", "donation_2025", 
        "consistency_score", "preferred_mode", "earning_members", "target_2026"
    ]
    
    with open(output_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(records)
        
    print(f"Generated {num_samples} domain-grounded household records at: {output_path}")

if __name__ == "__main__":
    main()
