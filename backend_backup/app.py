from flask import Flask, jsonify, request
from flask_cors import CORS
import joblib
import os

app = Flask(__name__)
CORS(app)

# -------------------------
# Load AI Model
# -------------------------

model_path = os.path.join("..", "ai-model", "battery_model.pkl")
model = joblib.load(model_path)


@app.route("/")
def home():
    return jsonify({
        "message": "CellGuard AI Backend Running Successfully"
    })


@app.route("/predict", methods=["POST"])
def predict():

    data = request.get_json()

    temperature = float(data["temperature"])
    voltage = float(data["voltage"])
    current = float(data["current"])
    battery_health = float(data["batteryHealth"])

    fire_risk = round(float(model.predict([[
        temperature,
        voltage,
        current,
        battery_health
    ]])[0]), 2)

    # -------------------------
    # AI Decision Logic
    # -------------------------

    if fire_risk < 30:

        status = "SAFE"
        confidence = 97
        remaining_life = "4.2 Years"

        recommendation = (
            "Battery operating normally. "
            "No maintenance required. "
            "Continue normal charging and monitoring."
        )

    elif fire_risk < 60:

        status = "WARNING"
        confidence = 92
        remaining_life = "2.8 Years"

        recommendation = (
            "Monitor battery temperature carefully. "
            "Avoid fast charging for long durations. "
            "Cooling is recommended."
        )

    else:

        status = "CRITICAL"
        confidence = 88
        remaining_life = "0.8 Years"

        recommendation = (
            "High thermal runaway risk detected. "
            "Stop charging immediately. "
            "Disconnect battery and inspect the battery pack."
        )

    return jsonify({

        "batteryHealth": battery_health,

        "temperature": temperature,

        "voltage": voltage,

        "current": current,

        "fireRisk": fire_risk,

        "systemStatus": status,

        "confidence": confidence,

        "remainingLife": remaining_life,

        "recommendation": recommendation

    })


if __name__ == "__main__":
    app.run(debug=True)