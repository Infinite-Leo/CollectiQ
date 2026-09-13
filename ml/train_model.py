"""
CollectiQ Expected Donation Model Training & Evaluation Pipeline
Trains Linear Regression, Decision Tree, and Random Forest Regressors on historical donation features.
Computes evaluation metrics (R2, MAE, RMSE) and exports model parameters to model_weights.json for production deployment.
"""

import json
import os
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.linear_model import Ridge
from sklearn.tree import DecisionTreeRegressor
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import r2_score, mean_absolute_error, mean_squared_error

def main():
    dataset_path = "ml/donation_historical_dataset.csv"
    if not os.path.exists(dataset_path):
        print("Dataset not found. Generating fresh dataset...")
        from generate_dataset import main as gen_main
        gen_main(3000, dataset_path)

    print(f"Loading dataset from {dataset_path}...")
    df = pd.read_csv(dataset_path)

    # Derived feature engineering
    df["prior_active_sum"] = df["donation_2023"] + df["donation_2024"] + df["donation_2025"]
    df["has_donated_2025"] = (df["donation_2025"] > 0).astype(int)
    
    # Growth rate between 2024 and 2025 where both non-zero
    def calc_growth(row):
        if row["donation_2024"] > 0 and row["donation_2025"] > 0:
            return (row["donation_2025"] - row["donation_2024"]) / row["donation_2024"]
        return 0.08  # Default average para growth

    df["yoy_growth_rate"] = df.apply(calc_growth, axis=1)

    # Feature matrix encoding
    locality_map = {"TIER_1": 3, "TIER_2": 2, "TIER_3": 1}
    house_type_map = {
        "INDEPENDENT_HOUSE": 4,
        "COMMERCIAL_SHOP": 3,
        "CLINIC_PROFESSIONAL": 2,
        "APARTMENT_FLAT": 1
    }
    mode_map = {"UPI": 3, "CHEQUE": 2, "CASH": 1}

    df["locality_enc"] = df["locality_tier"].map(locality_map)
    df["house_type_enc"] = df["house_type"].map(house_type_map)
    df["mode_enc"] = df["preferred_mode"].map(mode_map)

    feature_cols = [
        "donation_2023",
        "donation_2024",
        "donation_2025",
        "consistency_score",
        "earning_members",
        "prior_active_sum",
        "has_donated_2025",
        "yoy_growth_rate",
        "locality_enc",
        "house_type_enc",
        "mode_enc"
    ]

    X = df[feature_cols]
    y = df["target_2026"]

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.20, random_state=42)

    print("\n=======================================================")
    print("      COLLECTIQ MODEL BENCHMARKING & EVALUATION        ")
    print("=======================================================")

    models = {
        "Ridge Linear Regression": Ridge(alpha=1.0),
        "Decision Tree Regressor": DecisionTreeRegressor(max_depth=6, random_state=42),
        "Random Forest Regressor": RandomForestRegressor(n_estimators=100, max_depth=8, random_state=42)
    }

    results = {}
    fitted_models = {}

    for name, model in models.items():
        model.fit(X_train, y_train)
        preds = model.predict(X_test)
        
        r2 = r2_score(y_test, preds)
        mae = mean_absolute_error(y_test, preds)
        rmse = np.sqrt(mean_squared_error(y_test, preds))
        
        results[name] = {"R2": round(r2, 4), "MAE": round(mae, 2), "RMSE": round(rmse, 2)}
        fitted_models[name] = model
        print(f"\nModel: {name}")
        print(f"  R2 Score : {r2:.4f}")
        print(f"  MAE      : Rs. {mae:.2f}")
        print(f"  RMSE     : Rs. {rmse:.2f}")

    # Feature Importance from Random Forest
    rf_model = fitted_models["Random Forest Regressor"]
    importances = dict(zip(feature_cols, rf_model.feature_importances_))
    sorted_importances = sorted(importances.items(), key=lambda x: x[1], reverse=True)

    print("\n-------------------------------------------------------")
    print("     RANDOM FOREST FEATURE IMPORTANCE RANKING          ")
    print("-------------------------------------------------------")
    for feat, imp in sorted_importances:
        print(f"  {feat:20s}: {imp * 100:.2f}%")

    # Linear Model Coefficients for embedded runtime reference
    ridge_model = fitted_models["Ridge Linear Regression"]
    coef_dict = dict(zip(feature_cols, ridge_model.coef_))

    # Export configuration weights for embedded production deployment in Node.js
    model_metadata = {
        "model_version": "1.0.0",
        "training_date": "2026-09-11",
        "sample_size": len(df),
        "features": feature_cols,
        "evaluation_metrics": results,
        "top_features": [k for k, _ in sorted_importances[:5]],
        "feature_importances": {k: round(v, 4) for k, v in sorted_importances},
        "linear_intercept": float(round(ridge_model.intercept_, 2)),
        "linear_coefficients": {k: float(round(v, 4)) for k, v in coef_dict.items()},
        "locality_coefficients": {
            "TIER_1": 1.25,
            "TIER_2": 1.00,
            "TIER_3": 0.80
        },
        "house_type_multipliers": {
            "INDEPENDENT_HOUSE": 1.30,
            "APARTMENT_FLAT": 1.00,
            "COMMERCIAL_SHOP": 1.60,
            "CLINIC_PROFESSIONAL": 1.45
        }
    }

    out_file = "ml/model_weights.json"
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(model_metadata, f, indent=2)

    print(f"\nExported production model metadata & weights to: {out_file}")
    print("Deployment readiness: Zero Python cloud runtime needed. Fully embeddable in Node.js API.")

if __name__ == "__main__":
    main()
