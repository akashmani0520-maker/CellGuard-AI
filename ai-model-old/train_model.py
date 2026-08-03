import pandas as pd
from sklearn.ensemble import RandomForestRegressor
import joblib

# Load Dataset
data = pd.read_csv("battery_dataset.csv")

# Features
X = data[["temperature", "voltage", "current", "batteryHealth"]]

# Target
y = data["fireRisk"]

# Train Model
model = RandomForestRegressor(
    n_estimators=100,
    random_state=42
)

model.fit(X, y)

# Save Model
joblib.dump(model, "battery_model.pkl")

print("====================================")
print("✅ AI Model Trained Successfully!")
print("Model Saved As battery_model.pkl")
print("====================================")