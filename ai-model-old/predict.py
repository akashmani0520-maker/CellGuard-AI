import joblib

# Load trained model
model = joblib.load("battery_model.pkl")

# Example sensor values
temperature = 33.5
voltage = 12.4
current = 2.4
batteryHealth = 91

prediction = model.predict([[
    temperature,
    voltage,
    current,
    batteryHealth
]])

print("===================================")
print("🔥 Predicted Fire Risk:", round(prediction[0], 2), "%")
print("===================================")