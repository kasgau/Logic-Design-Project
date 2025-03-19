from flask import Flask, jsonify, request
import requests
from flask_cors import CORS
from pymongo import MongoClient
from datetime import datetime
from flask import Flask, jsonify, request
from flask_cors import CORS
from pymongo import MongoClient
from datetime import datetime
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error
import pandas as pd
import numpy as np
from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_socketio import SocketIO, emit
from pymongo import MongoClient
from datetime import datetime
import sqlite3
from flask import Flask, jsonify, request, session
from flask_cors import CORS
from flask_socketio import SocketIO, emit
from werkzeug.security import generate_password_hash, check_password_hash
from flask import Flask, jsonify, request, session, render_template, redirect, url_for
from werkzeug.security import generate_password_hash, check_password_hash
import sqlite3
from flask import Flask, render_template, request, redirect, url_for, session, flash
from werkzeug.security import generate_password_hash, check_password_hash
import sqlite3



app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# MongoDB setup
client = MongoClient("mongodb://127.0.0.1:27017/")  # Replace with your MongoDB URI
db = client["sensor_data"]  # Database name
collection = db["readings"]  # Collection name
app.secret_key = "12345"  # Needed for session management

socketio = SocketIO(app, cors_allowed_origins="*")

# ESP endpoints
ESP_IP = "http://192.168.83.204"
DHT_ENDPOINT = f"{ESP_IP}/dht-data"
MQ_ENDPOINT = f"{ESP_IP}/mq-data"

@app.route('/')
def home():from flask import Flask, jsonify, request
import requests
from flask_cors import CORS
from pymongo import MongoClient
from datetime import datetime
from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_socketio import SocketIO, emit
from pymongo import MongoClient
from datetime import datetime
import sqlite3
from flask import Flask, jsonify, request, session
from flask_cors import CORS
from flask_socketio import SocketIO, emit
from werkzeug.security import generate_password_hash, check_password_hash
from flask import Flask, jsonify, request, session, render_template, redirect, url_for
from werkzeug.security import generate_password_hash, check_password_hash
import sqlite3
from flask import Flask, render_template, request, redirect, url_for, session, flash
from werkzeug.security import generate_password_hash, check_password_hash
import sqlite3

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# MongoDB setup
client = MongoClient("mongodb://127.0.0.1:27017/")  # Replace with your MongoDB URI
db = client["sensor_data"]  # Database name
collection = db["readings"]  # Collection name
app.secret_key = "12345"  # Needed for session management

socketio = SocketIO(app, cors_allowed_origins="*")

# ESP endpoints
ESP_IP = "http://192.168.1.9"
DHT_ENDPOINT = f"{ESP_IP}/dht-data"
MQ_ENDPOINT = f"{ESP_IP}/mq-data"

@app.route('/')
def home():
    return "Welcome to the Flask API!", 200

@app.route('/fetch-and-store', methods=['GET'])
def fetch_and_store_data():
    try:
        # Fetch data from ESP
        dht_data = requests.get(DHT_ENDPOINT).json()
        mq_data = requests.get(MQ_ENDPOINT).json()
        print("Fetched DHT Data:", dht_data)  # Debug log
        print("Fetched MQ Data:", mq_data)  # Debug log

        # Combine data with a timestamp
        combined_data = {
            "dht": dht_data,
            "mq": mq_data,
            "timestamp": datetime.now()
        }
        print("Data to Insert:", combined_data)  # Debug log

        # Store the data in MongoDB
        result = collection.insert_one(combined_data)
        print("Inserted ID:", result.inserted_id)  # Debug log

        return jsonify({"message": "Data fetched and stored successfully"}), 200
    except Exception as e:
        return jsonify({"error": f"Failed to fetch or store data: {e}"}), 500



@app.route('/latest-data', methods=['GET'])
def get_latest_data():
    try:
        # Retrieve the most recent entry from MongoDB
        latest_data = collection.find().sort("timestamp", -1).limit(1)
        latest_data = list(latest_data)  # Convert to list

        if latest_data:
            # Convert ObjectId to string
            latest_data[0]["_id"] = str(latest_data[0]["_id"])
            return jsonify(latest_data[0]), 200
        else:
            return jsonify({"error": "No data found in the database"}), 404
    except Exception as e:
        print(f"Error in /latest-data: {e}")  # Debugging log
        return jsonify({"error": f"Failed to retrieve data: {e}"}), 500


@app.route('/temperature-alert', methods=['GET'])
def check_temperature_alert():
    try:
        # Retrieve the most recent entry from MongoDB
        latest_data = collection.find().sort("timestamp", -1).limit(1)
        latest_data = list(latest_data)  # Convert to list

        if latest_data:
            temperature = latest_data[0]["dht"]["temperatureC"]
            if temperature > 50:
                # Emit an alert to connected clients via Socket.IO
                socketio.emit("temperature-alert", {
                    "message": f"Warning: Temperature is too high ({temperature}°C)!",
                    "temperature": temperature
                })
                return jsonify({"alert": f"Warning: Temperature is too high ({temperature}°C)!"}), 200
            else:
                return jsonify({"message": "Temperature is within normal range."}), 200
        else:
            return jsonify({"error": "No data found in the database"}), 404
    except Exception as e:
        print(f"Error in /temperature-alert: {e}")  # Debugging log
        return jsonify({"error": f"Failed to retrieve temperature alert: {e}"}), 500



@app.route('/all-data', methods=['GET'])
def get_all_data():
    try:
        # Retrieve all data from MongoDB
        all_data = list(collection.find().sort("timestamp", -1))

        # Convert ObjectId to string for each document
        for doc in all_data:
            doc["_id"] = str(doc["_id"])

        return jsonify(all_data), 200
    except Exception as e:
        print(f"Error in /all-data: {e}")  # Debugging log
        return jsonify({"error": f"Failed to retrieve data: {e}"}), 500

def train_and_evaluate_models(data):
    X = data[["humidity"]].values  # Features (e.g., humidity)
    y = data["temperatureC"].values  # Target (e.g., temperature)

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    # Model 1: Linear Regression
    lr = LinearRegression()
    lr.fit(X_train, y_train)
    lr_predictions = lr.predict(X_test)
    lr_mae = mean_absolute_error(y_test, lr_predictions)

    # Model 2: Random Forest
    rf = RandomForestRegressor()
    rf.fit(X_train, y_train)
    rf_predictions = rf.predict(X_test)
    rf_mae = mean_absolute_error(y_test, rf_predictions)

    # Select the best model
    best_model = lr if lr_mae < rf_mae else rf
    best_model_name = "Linear Regression" if lr_mae < rf_mae else "Random Forest"

    return best_model, best_model_name

@app.route('/predict', methods=['POST'])
def predict_humidity_temperature():
    try:
        # Load historical data from MongoDB
        data = pd.DataFrame(list(collection.find()))
        if data.empty:
            return jsonify({"error": "Not enough data for prediction"}), 400

        # Preprocess data
        data["temperatureC"] = data["dht"].apply(lambda x: x.get("temperatureC"))
        data["humidity"] = data["dht"].apply(lambda x: x.get("humidity"))
        data["timestamp"] = pd.to_datetime(data["timestamp"])
        data = data.dropna(subset=["temperatureC", "humidity", "timestamp"])

        # Convert timestamps to numeric for regression
        data["timestamp_numeric"] = data["timestamp"].apply(lambda x: x.timestamp())

        # Train models for humidity and temperature
        X = data[["timestamp_numeric"]].values
        y_humidity = data["humidity"].values
        y_temperature = data["temperatureC"].values

        X_train, X_test, y_h_train, y_h_test = train_test_split(X, y_humidity, test_size=0.2, random_state=42)
        X_train_temp, X_test_temp, y_t_train, y_t_test = train_test_split(X, y_temperature, test_size=0.2, random_state=42)

        # Train models
        lr_humidity = LinearRegression()
        lr_temperature = LinearRegression()

        lr_humidity.fit(X_train, y_h_train)
        lr_temperature.fit(X_train_temp, y_t_train)

        # Parse input date
        input_data = request.get_json()
        prediction_date = input_data.get("date")
        if not prediction_date:
            return jsonify({"error": "Missing date input"}), 400

        date_timestamp = pd.to_datetime(prediction_date).timestamp()

        # Predict humidity and temperature
        predicted_humidity = lr_humidity.predict([[date_timestamp]])[0]
        predicted_temperature = lr_temperature.predict([[date_timestamp]])[0]

        return jsonify({
            "predicted_humidity": predicted_humidity,
            "predicted_temperature": predicted_temperature,
            "date": prediction_date
        }), 200

    except Exception as e:
        print(f"Error in /predict: {e}")
        return jsonify({"error": f"Failed to predict: {e}"}), 500


@socketio.on("gas-alert")
def handle_gas_alert(data):
    print(f"Gas Alert Broadcasted: {data}")
    emit("gas-alert", data, broadcast=True)
# SQLite Setup
def init_db():
    conn = sqlite3.connect("temp.db")
    cursor = conn.cursor()

    # Drop tables if they exist
    cursor.execute("DROP TABLE IF EXISTS users")
    cursor.execute("DROP TABLE IF EXISTS user_holes")

    # Create users table
    cursor.execute("""
        CREATE TABLE users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            is_admin INTEGER DEFAULT 0
        )
    """)

    # Create user_holes table
    cursor.execute("""
        CREATE TABLE user_holes (
            user_id INTEGER NOT NULL,
            hole1 TEXT,
            hole2 TEXT,
            hole3 TEXT,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    """)

    # Insert sample users
    cursor.execute("INSERT INTO users (username, password, is_admin) VALUES (?, ?, ?)",
                   ("admin", generate_password_hash("adminpassword"), 1))
    cursor.execute("INSERT INTO users (username, password, is_admin) VALUES (?, ?, ?)",
                   ("user1", generate_password_hash("password1"), 0))

    conn.commit()
    conn.close()





init_db()

@app.route("/login", methods=["POST"])
def login():
    try:
        data = request.get_json()
        username = data.get("username")
        password = data.get("password")
        print(f"Attempting login for user: {username}")  # Debug log

        # Connect to the SQLite database
        conn = sqlite3.connect("temp.db")
        cursor = conn.cursor()

        # Fetch the user by username
        cursor.execute("SELECT password FROM users WHERE username = ?", (username,))
        row = cursor.fetchone()

        print(f"Query result for username '{username}':", row)

        if row:
            stored_password = row[0]
            print(f"Stored password hash: {stored_password}")  # Debug log
            if check_password_hash(stored_password, password):
                session["user"] = username
                print("Login successful")  # Debug log
                conn.close()  # Close connection after all operations
                return jsonify({"message": "Login successful"}), 200
            else:
                print("Password mismatch")  # Debug log
                conn.close()  # Close connection after all operations
                return jsonify({"error": "Invalid username or password"}), 401
        else:
            print("Username not found")  # Debug log
            conn.close()  # Close connection after all operations
            return jsonify({"error": "Invalid username or password"}), 401
    except Exception as e:
        print(f"Error in /login: {e}")  # Debugging log
        return jsonify({"error": "An error occurred during login"}), 500


@app.route("/admin-login", methods=["POST"])
def admin_login():
    try:
        data = request.get_json()
        username = data.get("username")
        password = data.get("password")

        conn = sqlite3.connect("temp.db")
        cursor = conn.cursor()
        cursor.execute("SELECT password, is_admin FROM users WHERE username = ?", (username,))
        row = cursor.fetchone()
        conn.close()

        if row and row[1] == 1:  # Check if user is admin
            stored_password = row[0]
            if check_password_hash(stored_password, password):
                return jsonify({"message": "Admin login successful"}), 200
        return jsonify({"error": "Invalid admin credentials"}), 401
    except Exception as e:
        return jsonify({"error": f"An error occurred: {e}"}), 500
@app.route("/users", methods=["GET"])
def get_users():
    try:
        conn = sqlite3.connect("temp.db")
        cursor = conn.cursor()
        cursor.execute("SELECT id, username, is_admin FROM users")
        users = [{"id": row[0], "username": row[1], "is_admin": bool(row[2])} for row in cursor.fetchall()]
        conn.close()
        return jsonify(users), 200
    except Exception as e:
        return jsonify({"error": f"An error occurred: {e}"}), 500


@app.route("/users", methods=["POST"])
def create_user():
    try:
        data = request.get_json()
        username = data.get("username")
        password = data.get("password")
        is_admin = int(data.get("is_admin", 0))

        conn = sqlite3.connect("temp.db")
        cursor = conn.cursor()
        cursor.execute("INSERT INTO users (username, password, is_admin) VALUES (?, ?, ?)",
                       (username, generate_password_hash(password), is_admin))
        conn.commit()
        conn.close()
        return jsonify({"message": "User created successfully"}), 201
    except Exception as e:
        return jsonify({"error": f"An error occurred: {e}"}), 500
@app.route("/logout", methods=["POST"])
def logout():
    try:
        session.pop("user", None)  # Remove the user from session
        return jsonify({"message": "Logout successful"}), 200
    except Exception as e:
        return jsonify({"error": f"An error occurred during logout: {e}"}), 500
if __name__ == "__main__":
    socketio.run(app, host="0.0.0.0", port=5000, debug=True)