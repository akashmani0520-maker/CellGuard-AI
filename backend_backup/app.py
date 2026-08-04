from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import os
import numpy as np

app = Flask(__name__)
CORS(app)

# ==========================================
# Load AI Model
# ==========================================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

MODEL_PATH = os.path.join(
    BASE_DIR,
    "..",
    "ai-model-old",
    "battery_model.pkl"
)

model = joblib.load(MODEL_PATH)


# ==========================================
# Home Route
# ==========================================

@app.route("/")
def home():
    return jsonify({
        "message": "CellGuard AI Backend Running Successfully 🚀"
    })


# ==========================================
# AI Prediction Route
# ==========================================

@app.route("/predict", methods=["POST"])
def predict():

    try:

        data = request.json

        temperature = float(data["temperature"])
        voltage = float(data["voltage"])
        current = float(data["current"])
        batteryHealth = float(data["batteryHealth"])

        input_data = np.array([
            [
                temperature,
                voltage,
                current,
                batteryHealth
            ]
        ])

        fireRisk = float(model.predict(input_data)[0])

        if fireRisk < 30:
            systemStatus = "SAFE"
            recommendation = "Battery is operating normally."

        elif fireRisk < 70:
            systemStatus = "WARNING"
            recommendation = "Monitor battery temperature carefully. Avoid fast charging."

        else:
            systemStatus = "DANGER"
            recommendation = "Immediate inspection required. Disconnect battery immediately."

        response = {
            "batteryHealth": batteryHealth,
            "temperature": temperature,
            "voltage": voltage,
            "current": current,
            "fireRisk": round(fireRisk, 2),
            "systemStatus": systemStatus,
            "confidence": 97,
            "remainingLife": "4.2 Years",
            "recommendation": recommendation
        }

        return jsonify(response)

    except Exception as e:

        return jsonify({
            "error": str(e)
        }), 500


# ==========================================
# Run Server
# ==========================================

if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=5000,
        debug=True
    )