from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import os
import numpy as np

app = Flask(__name__)
CORS(app)

# ==========================
# Load AI Model (Render Compatible)
# ==========================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

MODEL_PATH = os.path.join(
    BASE_DIR,
    "..",
    "ai-model",
    "battery_model.pkl"
)

model = joblib.load(MODEL_PATH)


# ==========================
# Home Route
# ==========================

@app.route("/")
def home():
    return jsonify({
        "message": "CellGuard AI Backend Running Successfully 🚀"
    })


# ==========================
# Prediction Route
# ==========================

@app.route("/predict", methods=["POST"])
def predict():

    try:

        data = request.json

        temperature = float(data["temperature"])
        voltage = float(data["voltage"])
        current = float(data["current"])

        input_data = np.array([
            [
                temperature,
                voltage,
                current
            ]
        ])

        prediction = model.predict(input_data)[0]

        battery_health = max(
            0,
            min(
                100,
                round(100 - (temperature * 0.5))
            )
        )

        fire_risk = round(
            min(
                100,
                temperature * 0.6 + current * 1.6
            ),
            2
        )

        if fire_risk < 30:
            status = "SAFE"
            recommendation = "Battery is operating normally."
        elif fire_risk < 60:
            status = "WARNING"
            recommendation = "Monitor battery temperature carefully. Avoid fast charging."
        else:
            status = "DANGER"
            recommendation = "Immediate inspection required. Disconnect battery if temperature keeps increasing."

        response = {
            "prediction": int(prediction),
            "batteryHealth": battery_health,
            "fireRisk": fire_risk,
            "systemStatus": status,
            "recommendation": recommendation,
            "confidence": 92,
            "remainingLife": "2.8 Years"
        }

        return jsonify(response)

    except Exception as e:

        return jsonify({
            "error": str(e)
        })


# ==========================
# Run
# ==========================

if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=5000,
        debug=True
    )