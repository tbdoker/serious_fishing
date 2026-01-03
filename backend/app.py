from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
from bson import ObjectId
from datetime import datetime
import jwt
import hashlib
import secrets

# ----------------------------
# CONFIG
# ----------------------------
MONGO_URI = "mongodb://localhost:27017"
DB_NAME = "serious_fishing"
JWT_SECRET = "serious_fishing_secret_key_2024"  

app = Flask(__name__)
CORS(app, origins=["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"])

client = MongoClient(MONGO_URI)
db = client[DB_NAME]

users_col = db["users"]
settings_col = db["game_settings"]
sessions_col = db["sessions"]

# Default per-user game + hand tracking settings
DEFAULT_GAME_SETTINGS = {
    "speedMultiplier": 1.0,
    "minSpawnInterval": 3.0,
    "maxSpawnInterval": 6.0,
    "spawnFrom": "Right",
    "targetFishMode": "Random",
    "useHandTracking": True,
    "handIndexToUse": 0,
    "movementSensitivity": 1.5,
    "showHandSkeleton": True,
    "normalizeHandSize": True,
    "handSize": 5.0,
    "showGrabCursor": True,
    "cursorSize": 3.0,
    "grabThreshold": 0.6,
    "jointSize": 7.0
}

# ----------------------------
# HELPERS
# ----------------------------
def hash_password(password):
    """Simple password hashing"""
    return hashlib.sha256(password.encode()).hexdigest()

def generate_token(user_id, role):
    """Generate JWT token"""
    payload = {
        "userId": user_id,
        "role": role,
        "exp": datetime.utcnow().timestamp() + (24 * 60 * 60)  # 24 hours
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")

def verify_token(token):
    """Verify JWT token"""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        if payload["exp"] < datetime.utcnow().timestamp():
            return None
        return payload
    except:
        return None

def get_token_from_header():
    """Extract token from Authorization header"""
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        return auth_header[7:]
    return None

def require_therapist():
    """Decorator helper to verify therapist role"""
    token = get_token_from_header()
    if not token:
        return None, jsonify({"ok": False, "message": "No token provided"}), 401

    payload = verify_token(token)
    if not payload:
        return None, jsonify({"ok": False, "message": "Invalid or expired token"}), 401

    if payload.get("role") != "therapist":
        return None, jsonify({"ok": False, "message": "Therapist access required"}), 403

    return payload, None, None

# ----------------------------
# REGISTER
# ----------------------------
@app.route("/register", methods=["POST"])
def register():
    data = request.json

    if users_col.find_one({"username": data["username"]}):
        return jsonify({"ok": False, "message": "Username already exists"})

    # Determine role (default to "child" for Unity registrations)
    role = data.get("role", "child")
    therapist_id = data.get("therapistId", None)

    user = {
        "username": data["username"],
        "firstName": data["firstName"],
        "lastName": data["lastName"],
        "age": data.get("age", 0),
        "password": data["password"],  # Plain text for Unity compatibility
        "role": role,
        "therapistId": therapist_id,
        "createdAt": datetime.utcnow()
    }

    result = users_col.insert_one(user)
    user_id = str(result.inserted_id)

    # CREATE DEFAULT SETTINGS FOR CHILDREN ONLY
    if role == "child":
        settings_col.insert_one({
            "userId": user_id,
            "username": data["username"],
            **DEFAULT_GAME_SETTINGS
        })

    return jsonify({
        "ok": True,
        "message": "Registered",
        "userId": user_id,
        "username": user["username"],
        "firstName": user["firstName"],
        "lastName": user["lastName"],
        "role": role
    })

# ----------------------------
# LOGIN (for Unity - plain password)
# ----------------------------
@app.route("/login", methods=["POST"])
def login():
    data = request.json

    user = users_col.find_one({
        "username": data["username"],
        "password": data["password"]
    })

    if not user:
        return jsonify({"ok": False, "message": "Invalid credentials"})

    user_id = str(user["_id"])
    role = user.get("role", "child")

    # Ensure settings exist for this user (for users registered before settings feature)
    if role == "child":
        existing_settings = settings_col.find_one({"userId": user_id})
        if not existing_settings:
            settings_col.insert_one({
                "userId": user_id,
                "username": user["username"],
                **DEFAULT_GAME_SETTINGS
            })

    return jsonify({
        "ok": True,
        "message": "Login successful",
        "userId": user_id,
        "username": user["username"],
        "firstName": user["firstName"],
        "lastName": user["lastName"],
        "role": role
    })

# ----------------------------
# THERAPIST AUTH ENDPOINTS
# ----------------------------
@app.route("/api/auth/register", methods=["POST"])
def therapist_register():
    """Register a new therapist account"""
    data = request.json

    required = ["username", "password", "firstName", "lastName", "email"]
    for field in required:
        if not data.get(field):
            return jsonify({"ok": False, "message": f"{field} is required"}), 400

    if users_col.find_one({"username": data["username"]}):
        return jsonify({"ok": False, "message": "Username already exists"}), 400

    if users_col.find_one({"email": data["email"]}):
        return jsonify({"ok": False, "message": "Email already exists"}), 400

    user = {
        "username": data["username"],
        "password": data["password"],  # Plain text for consistency
        "firstName": data["firstName"],
        "lastName": data["lastName"],
        "email": data["email"],
        "role": "therapist",
        "createdAt": datetime.utcnow()
    }

    result = users_col.insert_one(user)
    user_id = str(result.inserted_id)

    token = generate_token(user_id, "therapist")

    return jsonify({
        "ok": True,
        "message": "Therapist registered successfully",
        "token": token,
        "user": {
            "id": user_id,
            "username": user["username"],
            "firstName": user["firstName"],
            "lastName": user["lastName"],
            "email": user["email"],
            "role": "therapist"
        }
    })

@app.route("/api/auth/login", methods=["POST"])
def therapist_login():
    """Therapist login with JWT token"""
    data = request.json

    user = users_col.find_one({
        "username": data.get("username"),
        "password": data.get("password")
    })

    if not user:
        return jsonify({"ok": False, "message": "Invalid credentials"}), 401

    if user.get("role") != "therapist":
        return jsonify({"ok": False, "message": "Access denied. Therapist account required."}), 403

    user_id = str(user["_id"])
    token = generate_token(user_id, "therapist")

    return jsonify({
        "ok": True,
        "token": token,
        "user": {
            "id": user_id,
            "username": user["username"],
            "firstName": user["firstName"],
            "lastName": user["lastName"],
            "email": user.get("email", ""),
            "role": "therapist"
        }
    })

@app.route("/api/auth/verify", methods=["GET"])
def verify_auth():
    """Verify JWT token and return user info"""
    token = get_token_from_header()
    if not token:
        return jsonify({"ok": False, "message": "No token provided"}), 401

    payload = verify_token(token)
    if not payload:
        return jsonify({"ok": False, "message": "Invalid or expired token"}), 401

    user = users_col.find_one({"_id": ObjectId(payload["userId"])})
    if not user:
        return jsonify({"ok": False, "message": "User not found"}), 404

    return jsonify({
        "ok": True,
        "user": {
            "id": str(user["_id"]),
            "username": user["username"],
            "firstName": user["firstName"],
            "lastName": user["lastName"],
            "email": user.get("email", ""),
            "role": user.get("role", "child")
        }
    })

# ----------------------------
# THERAPIST - CHILD MANAGEMENT
# ----------------------------
@app.route("/api/therapist/children", methods=["GET"])
def get_therapist_children():
    """Get all children assigned to the logged-in therapist"""
    payload, error, status = require_therapist()
    if error:
        return error, status

    therapist_id = payload["userId"]

    children = list(users_col.find({
        "therapistId": therapist_id,
        "role": "child"
    }))

    result = []
    for child in children:
        child_id = str(child["_id"])

        # Get latest session
        latest_session = sessions_col.find_one(
            {"userId": child_id},
            sort=[("sessionStartTime", -1)]
        )

        # Get session count
        session_count = sessions_col.count_documents({"userId": child_id})

        # Get settings
        settings = settings_col.find_one({"userId": child_id})

        result.append({
            "id": child_id,
            "username": child["username"],
            "firstName": child["firstName"],
            "lastName": child["lastName"],
            "fullName": f"{child['firstName']} {child['lastName']}",
            "age": child.get("age", 0),
            "createdAt": child.get("createdAt", "").isoformat() if child.get("createdAt") else None,
            "sessionCount": session_count,
            "lastSession": latest_session["sessionStartTime"] if latest_session else None,
            "lastAccuracy": latest_session.get("fishAccuracy", 0) if latest_session else None,
            "settings": {
                "speedMultiplier": settings.get("speedMultiplier", DEFAULT_GAME_SETTINGS["speedMultiplier"]) if settings else DEFAULT_GAME_SETTINGS["speedMultiplier"],
                "minSpawnInterval": settings.get("minSpawnInterval", DEFAULT_GAME_SETTINGS["minSpawnInterval"]) if settings else DEFAULT_GAME_SETTINGS["minSpawnInterval"],
                "maxSpawnInterval": settings.get("maxSpawnInterval", DEFAULT_GAME_SETTINGS["maxSpawnInterval"]) if settings else DEFAULT_GAME_SETTINGS["maxSpawnInterval"],
                "spawnFrom": settings.get("spawnFrom", DEFAULT_GAME_SETTINGS["spawnFrom"]) if settings else DEFAULT_GAME_SETTINGS["spawnFrom"],
                "targetFishMode": settings.get("targetFishMode", DEFAULT_GAME_SETTINGS["targetFishMode"]) if settings else DEFAULT_GAME_SETTINGS["targetFishMode"],
                "useHandTracking": settings.get("useHandTracking", DEFAULT_GAME_SETTINGS["useHandTracking"]) if settings else DEFAULT_GAME_SETTINGS["useHandTracking"],
                "handIndexToUse": settings.get("handIndexToUse", DEFAULT_GAME_SETTINGS["handIndexToUse"]) if settings else DEFAULT_GAME_SETTINGS["handIndexToUse"],
                "movementSensitivity": settings.get("movementSensitivity", DEFAULT_GAME_SETTINGS["movementSensitivity"]) if settings else DEFAULT_GAME_SETTINGS["movementSensitivity"],
                "showHandSkeleton": settings.get("showHandSkeleton", DEFAULT_GAME_SETTINGS["showHandSkeleton"]) if settings else DEFAULT_GAME_SETTINGS["showHandSkeleton"],
                "normalizeHandSize": settings.get("normalizeHandSize", DEFAULT_GAME_SETTINGS["normalizeHandSize"]) if settings else DEFAULT_GAME_SETTINGS["normalizeHandSize"],
                "handSize": settings.get("handSize", DEFAULT_GAME_SETTINGS["handSize"]) if settings else DEFAULT_GAME_SETTINGS["handSize"],
                "showGrabCursor": settings.get("showGrabCursor", DEFAULT_GAME_SETTINGS["showGrabCursor"]) if settings else DEFAULT_GAME_SETTINGS["showGrabCursor"],
                "cursorSize": settings.get("cursorSize", DEFAULT_GAME_SETTINGS["cursorSize"]) if settings else DEFAULT_GAME_SETTINGS["cursorSize"],
                "grabThreshold": settings.get("grabThreshold", DEFAULT_GAME_SETTINGS["grabThreshold"]) if settings else DEFAULT_GAME_SETTINGS["grabThreshold"],
                "jointSize": settings.get("jointSize", DEFAULT_GAME_SETTINGS["jointSize"]) if settings else DEFAULT_GAME_SETTINGS["jointSize"]
            }
        })

    return jsonify({"ok": True, "children": result})

@app.route("/api/therapist/children", methods=["POST"])
def add_child():
    """Register a new child under the therapist"""
    payload, error, status = require_therapist()
    if error:
        return error, status

    therapist_id = payload["userId"]
    data = request.json

    required = ["username", "password", "firstName", "lastName"]
    for field in required:
        if not data.get(field):
            return jsonify({"ok": False, "message": f"{field} is required"}), 400

    if users_col.find_one({"username": data["username"]}):
        return jsonify({"ok": False, "message": "Username already exists"}), 400

    child = {
        "username": data["username"],
        "password": data["password"],
        "firstName": data["firstName"],
        "lastName": data["lastName"],
        "age": data.get("age", 0),
        "birthDate": data.get("birthDate"),
        "notes": data.get("notes", ""),
        "role": "child",
        "therapistId": therapist_id,
        "createdAt": datetime.utcnow()
    }

    result = users_col.insert_one(child)
    child_id = str(result.inserted_id)

    # Create default settings
    settings_col.insert_one({
        "userId": child_id,
        "username": data["username"],
        **DEFAULT_GAME_SETTINGS
    })

    return jsonify({
        "ok": True,
        "message": "Child registered successfully",
        "child": {
            "id": child_id,
            "username": child["username"],
            "firstName": child["firstName"],
            "lastName": child["lastName"],
            "fullName": f"{child['firstName']} {child['lastName']}",
            "age": child.get("age", 0)
        }
    })

@app.route("/api/therapist/children/<child_id>", methods=["GET"])
def get_child_details(child_id):
    """Get detailed information about a specific child"""
    payload, error, status = require_therapist()
    if error:
        return error, status

    therapist_id = payload["userId"]

    child = users_col.find_one({
        "_id": ObjectId(child_id),
        "therapistId": therapist_id
    })

    if not child:
        return jsonify({"ok": False, "message": "Child not found"}), 404

    settings = settings_col.find_one({"userId": child_id})
    session_count = sessions_col.count_documents({"userId": child_id})

    print(f"[DEBUG] Child ID: {child_id}")
    print(f"[DEBUG] Settings from DB: {settings}")

    return jsonify({
        "ok": True,
        "child": {
            "id": child_id,
            "username": child["username"],
            "firstName": child["firstName"],
            "lastName": child["lastName"],
            "fullName": f"{child['firstName']} {child['lastName']}",
            "age": child.get("age", 0),
            "birthDate": child.get("birthDate"),
            "notes": child.get("notes", ""),
            "createdAt": child.get("createdAt", "").isoformat() if child.get("createdAt") else None,
            "sessionCount": session_count,
            "settings": {
                "speedMultiplier": settings.get("speedMultiplier", DEFAULT_GAME_SETTINGS["speedMultiplier"]) if settings else DEFAULT_GAME_SETTINGS["speedMultiplier"],
                "minSpawnInterval": settings.get("minSpawnInterval", DEFAULT_GAME_SETTINGS["minSpawnInterval"]) if settings else DEFAULT_GAME_SETTINGS["minSpawnInterval"],
                "maxSpawnInterval": settings.get("maxSpawnInterval", DEFAULT_GAME_SETTINGS["maxSpawnInterval"]) if settings else DEFAULT_GAME_SETTINGS["maxSpawnInterval"],
                "spawnFrom": settings.get("spawnFrom", DEFAULT_GAME_SETTINGS["spawnFrom"]) if settings else DEFAULT_GAME_SETTINGS["spawnFrom"],
                "targetFishMode": settings.get("targetFishMode", DEFAULT_GAME_SETTINGS["targetFishMode"]) if settings else DEFAULT_GAME_SETTINGS["targetFishMode"],
                "useHandTracking": settings.get("useHandTracking", DEFAULT_GAME_SETTINGS["useHandTracking"]) if settings else DEFAULT_GAME_SETTINGS["useHandTracking"],
                "handIndexToUse": settings.get("handIndexToUse", DEFAULT_GAME_SETTINGS["handIndexToUse"]) if settings else DEFAULT_GAME_SETTINGS["handIndexToUse"],
                "movementSensitivity": settings.get("movementSensitivity", DEFAULT_GAME_SETTINGS["movementSensitivity"]) if settings else DEFAULT_GAME_SETTINGS["movementSensitivity"],
                "showHandSkeleton": settings.get("showHandSkeleton", DEFAULT_GAME_SETTINGS["showHandSkeleton"]) if settings else DEFAULT_GAME_SETTINGS["showHandSkeleton"],
                "normalizeHandSize": settings.get("normalizeHandSize", DEFAULT_GAME_SETTINGS["normalizeHandSize"]) if settings else DEFAULT_GAME_SETTINGS["normalizeHandSize"],
                "handSize": settings.get("handSize", DEFAULT_GAME_SETTINGS["handSize"]) if settings else DEFAULT_GAME_SETTINGS["handSize"],
                "showGrabCursor": settings.get("showGrabCursor", DEFAULT_GAME_SETTINGS["showGrabCursor"]) if settings else DEFAULT_GAME_SETTINGS["showGrabCursor"],
                "cursorSize": settings.get("cursorSize", DEFAULT_GAME_SETTINGS["cursorSize"]) if settings else DEFAULT_GAME_SETTINGS["cursorSize"],
                "grabThreshold": settings.get("grabThreshold", DEFAULT_GAME_SETTINGS["grabThreshold"]) if settings else DEFAULT_GAME_SETTINGS["grabThreshold"],
                "jointSize": settings.get("jointSize", DEFAULT_GAME_SETTINGS["jointSize"]) if settings else DEFAULT_GAME_SETTINGS["jointSize"]
            }
        }
    })

@app.route("/api/therapist/children/<child_id>", methods=["PUT"])
def update_child(child_id):
    """Update child information"""
    payload, error, status = require_therapist()
    if error:
        return error, status

    therapist_id = payload["userId"]
    data = request.json

    child = users_col.find_one({
        "_id": ObjectId(child_id),
        "therapistId": therapist_id
    })

    if not child:
        return jsonify({"ok": False, "message": "Child not found"}), 404

    update_data = {}
    if "firstName" in data:
        update_data["firstName"] = data["firstName"]
    if "lastName" in data:
        update_data["lastName"] = data["lastName"]
    if "age" in data:
        update_data["age"] = data["age"]
    if "birthDate" in data:
        update_data["birthDate"] = data["birthDate"]
    if "notes" in data:
        update_data["notes"] = data["notes"]

    if update_data:
        users_col.update_one({"_id": ObjectId(child_id)}, {"$set": update_data})

    return jsonify({"ok": True, "message": "Child updated successfully"})

@app.route("/api/therapist/children/<child_id>", methods=["DELETE"])
def delete_child(child_id):
    """Delete a child and all their data"""
    payload, error, status = require_therapist()
    if error:
        return error, status

    therapist_id = payload["userId"]

    child = users_col.find_one({
        "_id": ObjectId(child_id),
        "therapistId": therapist_id
    })

    if not child:
        return jsonify({"ok": False, "message": "Child not found"}), 404

    # Delete child's sessions
    sessions_col.delete_many({"userId": child_id})

    # Delete child's settings
    settings_col.delete_one({"userId": child_id})

    # Delete child account
    users_col.delete_one({"_id": ObjectId(child_id)})

    return jsonify({"ok": True, "message": "Child deleted successfully"})

@app.route("/api/therapist/unassigned-children", methods=["GET"])
def get_unassigned_children():
    """Get all children not assigned to any therapist"""
    payload, error, status = require_therapist()
    if error:
        return error, status

    # Find children with no therapistId or null therapistId
    children = list(users_col.find({
        "role": "child",
        "$or": [
            {"therapistId": None},
            {"therapistId": {"$exists": False}}
        ]
    }))

    result = []
    for child in children:
        child_id = str(child["_id"])
        session_count = sessions_col.count_documents({"userId": child_id})

        result.append({
            "id": child_id,
            "username": child["username"],
            "firstName": child.get("firstName", ""),
            "lastName": child.get("lastName", ""),
            "fullName": f"{child.get('firstName', '')} {child.get('lastName', '')}".strip(),
            "age": child.get("age", 0),
            "sessionCount": session_count
        })

    return jsonify({"ok": True, "children": result})

@app.route("/api/therapist/assign-child", methods=["POST"])
def assign_child_to_therapist():
    """Assign an existing unassigned child to the logged-in therapist"""
    payload, error, status = require_therapist()
    if error:
        return error, status

    therapist_id = payload["userId"]
    data = request.json
    child_id = data.get("childId")

    if not child_id:
        return jsonify({"ok": False, "message": "childId is required"}), 400

    # Find the child
    child = users_col.find_one({"_id": ObjectId(child_id), "role": "child"})

    if not child:
        return jsonify({"ok": False, "message": "Child not found"}), 404

    # Check if already assigned to another therapist
    if child.get("therapistId") and child.get("therapistId") != therapist_id:
        return jsonify({"ok": False, "message": "Child is already assigned to another therapist"}), 400

    # Assign to therapist
    users_col.update_one(
        {"_id": ObjectId(child_id)},
        {"$set": {"therapistId": therapist_id}}
    )

    return jsonify({
        "ok": True,
        "message": "Child assigned successfully",
        "child": {
            "id": child_id,
            "username": child["username"],
            "firstName": child.get("firstName", ""),
            "lastName": child.get("lastName", ""),
            "fullName": f"{child.get('firstName', '')} {child.get('lastName', '')}".strip()
        }
    })

# ----------------------------
# THERAPIST - GAME SETTINGS
# ----------------------------
@app.route("/api/therapist/children/<child_id>/settings", methods=["GET"])
def get_child_settings(child_id):
    """Get game settings for a child"""
    payload, error, status = require_therapist()
    if error:
        return error, status

    settings = settings_col.find_one({"userId": child_id})

    if not settings:
        return jsonify({
            "ok": True,
            "settings": {
                **DEFAULT_GAME_SETTINGS
            }
        })

    return jsonify({
        "ok": True,
        "settings": {
            "speedMultiplier": settings.get("speedMultiplier", DEFAULT_GAME_SETTINGS["speedMultiplier"]),
            "minSpawnInterval": settings.get("minSpawnInterval", DEFAULT_GAME_SETTINGS["minSpawnInterval"]),
            "maxSpawnInterval": settings.get("maxSpawnInterval", DEFAULT_GAME_SETTINGS["maxSpawnInterval"]),
            "spawnFrom": settings.get("spawnFrom", DEFAULT_GAME_SETTINGS["spawnFrom"]),
            "targetFishMode": settings.get("targetFishMode", DEFAULT_GAME_SETTINGS["targetFishMode"]),
            "useHandTracking": settings.get("useHandTracking", DEFAULT_GAME_SETTINGS["useHandTracking"]),
            "handIndexToUse": settings.get("handIndexToUse", DEFAULT_GAME_SETTINGS["handIndexToUse"]),
            "movementSensitivity": settings.get("movementSensitivity", DEFAULT_GAME_SETTINGS["movementSensitivity"]),
            "showHandSkeleton": settings.get("showHandSkeleton", DEFAULT_GAME_SETTINGS["showHandSkeleton"]),
            "normalizeHandSize": settings.get("normalizeHandSize", DEFAULT_GAME_SETTINGS["normalizeHandSize"]),
            "handSize": settings.get("handSize", DEFAULT_GAME_SETTINGS["handSize"]),
            "showGrabCursor": settings.get("showGrabCursor", DEFAULT_GAME_SETTINGS["showGrabCursor"]),
            "cursorSize": settings.get("cursorSize", DEFAULT_GAME_SETTINGS["cursorSize"]),
            "grabThreshold": settings.get("grabThreshold", DEFAULT_GAME_SETTINGS["grabThreshold"]),
            "jointSize": settings.get("jointSize", DEFAULT_GAME_SETTINGS["jointSize"])
        }
    })

@app.route("/api/therapist/children/<child_id>/settings", methods=["PUT"])
def update_child_settings(child_id):
    """Update game settings for a child (real-time modification)"""
    payload, error, status = require_therapist()
    if error:
        return error, status

    data = request.json

    # Validate child belongs to therapist
    child = users_col.find_one({
        "_id": ObjectId(child_id),
        "therapistId": payload["userId"]
    })

    if not child:
        return jsonify({"ok": False, "message": "Child not found"}), 404

    update_data = {
        "userId": child_id,
        "username": child["username"]
    }

    if "speedMultiplier" in data:
        update_data["speedMultiplier"] = float(data["speedMultiplier"])
    if "minSpawnInterval" in data:
        update_data["minSpawnInterval"] = float(data["minSpawnInterval"])
    if "maxSpawnInterval" in data:
        update_data["maxSpawnInterval"] = float(data["maxSpawnInterval"])
    if "spawnFrom" in data:
        update_data["spawnFrom"] = data["spawnFrom"]
    if "targetFishMode" in data:
        update_data["targetFishMode"] = data["targetFishMode"]
    if "useHandTracking" in data:
        update_data["useHandTracking"] = bool(data["useHandTracking"])
    if "handIndexToUse" in data:
        update_data["handIndexToUse"] = int(data["handIndexToUse"])
    if "movementSensitivity" in data:
        update_data["movementSensitivity"] = float(data["movementSensitivity"])
    if "showHandSkeleton" in data:
        update_data["showHandSkeleton"] = bool(data["showHandSkeleton"])
    if "normalizeHandSize" in data:
        update_data["normalizeHandSize"] = bool(data["normalizeHandSize"])
    if "handSize" in data:
        update_data["handSize"] = float(data["handSize"])
    if "showGrabCursor" in data:
        update_data["showGrabCursor"] = bool(data["showGrabCursor"])
    if "cursorSize" in data:
        update_data["cursorSize"] = float(data["cursorSize"])
    if "grabThreshold" in data:
        update_data["grabThreshold"] = float(data["grabThreshold"])
    if "jointSize" in data:
        update_data["jointSize"] = float(data["jointSize"])

    update_data["updatedAt"] = datetime.utcnow()
    update_data["updatedBy"] = payload["userId"]

    if data.get("changeReason"):
        update_data["lastChangeReason"] = data["changeReason"]

    settings_col.update_one(
        {"userId": child_id},
        {"$set": update_data},
        upsert=True
    )

    return jsonify({"ok": True, "message": "Settings updated successfully"})

# ----------------------------
# THERAPIST - SESSIONS
# ----------------------------
@app.route("/api/therapist/children/<child_id>/sessions", methods=["GET"])
def get_child_sessions(child_id):
    """Get all sessions for a child with pagination"""
    payload, error, status = require_therapist()
    if error:
        return error, status

    # Validate child belongs to therapist
    child = users_col.find_one({
        "_id": ObjectId(child_id),
        "therapistId": payload["userId"]
    })

    if not child:
        return jsonify({"ok": False, "message": "Child not found"}), 404

    page = request.args.get("page", 1, type=int)
    limit = request.args.get("limit", 20, type=int)
    skip = (page - 1) * limit

    total = sessions_col.count_documents({"userId": child_id})
    sessions = list(sessions_col.find({"userId": child_id})
                    .sort("sessionStartTime", -1)
                    .skip(skip)
                    .limit(limit))

    for session in sessions:
        session["_id"] = str(session["_id"])
        # Convert accuracy from 0-1 to percentage
        acc = session.get("fishAccuracy", 0)
        session["fishAccuracy"] = round(acc * 100 if acc <= 1 else acc, 2)
        # Convert quadrant accuracy to percentages if present
        if session.get("quadrantAccuracy"):
            qa = session["quadrantAccuracy"]
            session["quadrantAccuracy"] = {
                "topLeft": round(qa.get("topLeft", 0) * 100 if qa.get("topLeft", 0) <= 1 else qa.get("topLeft", 0), 2),
                "topRight": round(qa.get("topRight", 0) * 100 if qa.get("topRight", 0) <= 1 else qa.get("topRight", 0), 2),
                "bottomLeft": round(qa.get("bottomLeft", 0) * 100 if qa.get("bottomLeft", 0) <= 1 else qa.get("bottomLeft", 0), 2),
                "bottomRight": round(qa.get("bottomRight", 0) * 100 if qa.get("bottomRight", 0) <= 1 else qa.get("bottomRight", 0), 2)
            }

    return jsonify({
        "ok": True,
        "sessions": sessions,
        "pagination": {
            "page": page,
            "limit": limit,
            "total": total,
            "pages": (total + limit - 1) // limit
        }
    })

@app.route("/api/therapist/sessions/<session_id>", methods=["GET"])
def get_session_details(session_id):
    """Get detailed session information"""
    payload, error, status = require_therapist()
    if error:
        return error, status

    session = sessions_col.find_one({"_id": ObjectId(session_id)})

    if not session:
        return jsonify({"ok": False, "message": "Session not found"}), 404

    # Verify child belongs to therapist
    child = users_col.find_one({
        "_id": ObjectId(session["userId"]),
        "therapistId": payload["userId"]
    })

    if not child:
        return jsonify({"ok": False, "message": "Access denied"}), 403

    session["_id"] = str(session["_id"])

    return jsonify({"ok": True, "session": session})

@app.route("/api/therapist/sessions/<session_id>", methods=["PUT"])
def update_session(session_id):
    """Update session data (for corrections)"""
    payload, error, status = require_therapist()
    if error:
        return error, status

    session = sessions_col.find_one({"_id": ObjectId(session_id)})

    if not session:
        return jsonify({"ok": False, "message": "Session not found"}), 404

    # Verify child belongs to therapist
    child = users_col.find_one({
        "_id": ObjectId(session["userId"]),
        "therapistId": payload["userId"]
    })

    if not child:
        return jsonify({"ok": False, "message": "Access denied"}), 403

    data = request.json
    update_data = {}

    editable_fields = ["fishAccuracy", "correctFish", "wrongFish", "maxStreak",
                       "averageReactionTime", "sessionDuration", "notes"]

    for field in editable_fields:
        if field in data:
            update_data[field] = data[field]

    update_data["editedAt"] = datetime.utcnow()
    update_data["editedBy"] = payload["userId"]

    sessions_col.update_one({"_id": ObjectId(session_id)}, {"$set": update_data})

    return jsonify({"ok": True, "message": "Session updated successfully"})

@app.route("/api/therapist/sessions/<session_id>", methods=["DELETE"])
def delete_session(session_id):
    """Delete a session"""
    payload, error, status = require_therapist()
    if error:
        return error, status

    session = sessions_col.find_one({"_id": ObjectId(session_id)})

    if not session:
        return jsonify({"ok": False, "message": "Session not found"}), 404

    # Verify child belongs to therapist
    child = users_col.find_one({
        "_id": ObjectId(session["userId"]),
        "therapistId": payload["userId"]
    })

    if not child:
        return jsonify({"ok": False, "message": "Access denied"}), 403

    sessions_col.delete_one({"_id": ObjectId(session_id)})

    return jsonify({"ok": True, "message": "Session deleted successfully"})

# ----------------------------
# THERAPIST - ANALYTICS & PROGRESS
# ----------------------------
@app.route("/api/therapist/children/<child_id>/progress", methods=["GET"])
def get_child_progress(child_id):
    """Get progress analytics for a child over time"""
    payload, error, status = require_therapist()
    if error:
        return error, status

    # Validate child belongs to therapist
    child = users_col.find_one({
        "_id": ObjectId(child_id),
        "therapistId": payload["userId"]
    })

    if not child:
        return jsonify({"ok": False, "message": "Child not found"}), 404

    # Get all sessions sorted by date
    sessions = list(sessions_col.find({"userId": child_id}).sort("sessionStartTime", 1))

    if not sessions:
        return jsonify({
            "ok": True,
            "progress": {
                "sessions": [],
                "summary": None
            }
        })

    # Format sessions for chart
    progress_data = []
    for session in sessions:
        # Accuracy is stored as 0-1, convert to percentage
        acc = session.get("fishAccuracy", 0)
        acc_percent = acc * 100 if acc <= 1 else acc  # Handle both old and new formats
        
        progress_data.append({
            "date": session.get("sessionStartTime", ""),
            "accuracy": round(acc_percent, 2),
            "reactionTime": session.get("averageReactionTime", 0),
            "score": session.get("correctFish", 0),
            "maxStreak": session.get("maxStreak", 0),
            "duration": session.get("sessionDuration", 0),
            "settings": session.get("gameSettings", {}),
            "speedMultiplier": session.get("gameSettings", {}).get("speedMultiplier", 1.0),
            "spawnFrom": session.get("gameSettings", {}).get("spawnFrom", "Right"),
            "quadrantAccuracy": session.get("quadrantAccuracy", None)
        })

    # Calculate summary stats
    total_sessions = len(sessions)
    
    # Convert accuracy from 0-1 to percentage for calculations
    def to_percent(val):
        return val * 100 if val <= 1 else val
    
    avg_accuracy = sum(to_percent(s.get("fishAccuracy", 0)) for s in sessions) / total_sessions if total_sessions > 0 else 0
    avg_reaction = sum(s.get("averageReactionTime", 0) for s in sessions) / total_sessions if total_sessions > 0 else 0
    best_accuracy = max(to_percent(s.get("fishAccuracy", 0)) for s in sessions) if sessions else 0
    best_streak = max(s.get("maxStreak", 0) for s in sessions) if sessions else 0
    total_correct = sum(s.get("correctFish", 0) for s in sessions)
    total_wrong = sum(s.get("wrongFish", 0) for s in sessions)
    total_time = sum(s.get("sessionDuration", 0) for s in sessions)

    # Calculate improvement (compare first 3 sessions vs last 3 sessions)
    if total_sessions >= 6:
        first_3_avg = sum(to_percent(s.get("fishAccuracy", 0)) for s in sessions[:3]) / 3
        last_3_avg = sum(to_percent(s.get("fishAccuracy", 0)) for s in sessions[-3:]) / 3
        improvement = last_3_avg - first_3_avg
    elif total_sessions >= 2:
        improvement = to_percent(sessions[-1].get("fishAccuracy", 0)) - to_percent(sessions[0].get("fishAccuracy", 0))
    else:
        improvement = 0

    return jsonify({
        "ok": True,
        "progress": {
            "sessions": progress_data,
            "summary": {
                "totalSessions": total_sessions,
                "avgAccuracy": round(avg_accuracy, 2),
                "avgReactionTime": round(avg_reaction, 2),
                "bestAccuracy": round(best_accuracy, 2),
                "bestStreak": best_streak,
                "totalCorrectFish": total_correct,
                "totalWrongFish": total_wrong,
                "totalPlayTime": total_time,
                "improvement": round(improvement, 2)
            }
        }
    })

@app.route("/api/therapist/children/<child_id>/heatmap", methods=["GET"])
def get_child_heatmap(child_id):
    """Get heatmap data for a child's click positions"""
    payload, error, status = require_therapist()
    if error:
        return error, status

    # Validate child belongs to therapist
    child = users_col.find_one({
        "_id": ObjectId(child_id),
        "therapistId": payload["userId"]
    })

    if not child:
        return jsonify({"ok": False, "message": "Child not found"}), 404

    session_id = request.args.get("sessionId")

    if session_id:
        # Get heatmap for specific session
        session = sessions_col.find_one({"_id": ObjectId(session_id), "userId": child_id})
        if not session:
            return jsonify({"ok": False, "message": "Session not found"}), 404

        clicks = session.get("clickPositions", [])
        qa = session.get("quadrantAccuracy", {})
        # Convert quadrant accuracy to percentages
        quadrant_acc = {
            "topLeft": round(qa.get("topLeft", 0) * 100 if qa.get("topLeft", 0) <= 1 else qa.get("topLeft", 0), 2),
            "topRight": round(qa.get("topRight", 0) * 100 if qa.get("topRight", 0) <= 1 else qa.get("topRight", 0), 2),
            "bottomLeft": round(qa.get("bottomLeft", 0) * 100 if qa.get("bottomLeft", 0) <= 1 else qa.get("bottomLeft", 0), 2),
            "bottomRight": round(qa.get("bottomRight", 0) * 100 if qa.get("bottomRight", 0) <= 1 else qa.get("bottomRight", 0), 2)
        } if qa else None
        
        # Only count clicks that have explicit correct field (old data doesn't have it)
        correct_clicks = [c for c in clicks if c.get("correct") is True]
        wrong_clicks = [c for c in clicks if c.get("correct") is False]
        
        return jsonify({
            "ok": True,
            "heatmap": {
                "type": "session",
                "sessionId": session_id,
                "clicks": clicks,
                "correctClicks": correct_clicks,
                "wrongClicks": wrong_clicks,
                "quadrantAccuracy": quadrant_acc
            }
        })
    else:
        # Get aggregated heatmap across all sessions
        sessions = list(sessions_col.find({"userId": child_id}))

        all_clicks = []
        # Aggregate quadrant stats
        quadrant_correct = {"topLeft": 0, "topRight": 0, "bottomLeft": 0, "bottomRight": 0}
        quadrant_wrong = {"topLeft": 0, "topRight": 0, "bottomLeft": 0, "bottomRight": 0}
        
        for session in sessions:
            clicks = session.get("clickPositions", [])
            for click in clicks:
                click["sessionId"] = str(session["_id"])
                # Aggregate quadrant data from clicks - only if correct field exists
                if click.get("x") is not None and click.get("y") is not None and "correct" in click:
                    # Determine quadrant based on world coordinates (0,0 is center)
                    is_right = click.get("x", 0) > 0
                    is_top = click.get("y", 0) > 0
                    if is_top and not is_right:
                        quadrant = "topLeft"
                    elif is_top and is_right:
                        quadrant = "topRight"
                    elif not is_top and not is_right:
                        quadrant = "bottomLeft"
                    else:
                        quadrant = "bottomRight"
                    
                    if click.get("correct") is True:
                        quadrant_correct[quadrant] += 1
                    elif click.get("correct") is False:
                        quadrant_wrong[quadrant] += 1
            all_clicks.extend(clicks)

        # Calculate quadrant accuracies
        def calc_accuracy(correct, wrong):
            total = correct + wrong
            return round((correct / total) * 100, 2) if total > 0 else 0
        
        quadrant_accuracy = {
            "topLeft": calc_accuracy(quadrant_correct["topLeft"], quadrant_wrong["topLeft"]),
            "topRight": calc_accuracy(quadrant_correct["topRight"], quadrant_wrong["topRight"]),
            "bottomLeft": calc_accuracy(quadrant_correct["bottomLeft"], quadrant_wrong["bottomLeft"]),
            "bottomRight": calc_accuracy(quadrant_correct["bottomRight"], quadrant_wrong["bottomRight"])
        }

        # Only count clicks that have explicit correct field (old data doesn't have it)
        correct_clicks = [c for c in all_clicks if c.get("correct") is True]
        wrong_clicks = [c for c in all_clicks if c.get("correct") is False]

        return jsonify({
            "ok": True,
            "heatmap": {
                "type": "aggregate",
                "totalSessions": len(sessions),
                "clicks": all_clicks,
                "correctClicks": correct_clicks,
                "wrongClicks": wrong_clicks,
                "quadrantAccuracy": quadrant_accuracy
            }
        })

# ----------------------------
# THERAPIST - DASHBOARD STATS
# ----------------------------
@app.route("/api/therapist/dashboard/stats", methods=["GET"])
def get_dashboard_stats():
    """Get overview stats for therapist dashboard"""
    payload, error, status = require_therapist()
    if error:
        return error, status

    therapist_id = payload["userId"]

    # Count children
    children_count = users_col.count_documents({
        "therapistId": therapist_id,
        "role": "child"
    })

    # Get all children IDs
    children = list(users_col.find({
        "therapistId": therapist_id,
        "role": "child"
    }, {"_id": 1}))

    child_ids = [str(c["_id"]) for c in children]

    # Count total sessions
    total_sessions = sessions_col.count_documents({"userId": {"$in": child_ids}})

    # Get sessions from today
    today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    today_sessions = sessions_col.count_documents({
        "userId": {"$in": child_ids},
        "savedAt": {"$gte": today}
    })

    # Get sessions from this week
    from datetime import timedelta
    week_ago = datetime.utcnow() - timedelta(days=7)
    week_sessions = sessions_col.count_documents({
        "userId": {"$in": child_ids},
        "savedAt": {"$gte": week_ago}
    })

    # Calculate average accuracy across all children
    pipeline = [
        {"$match": {"userId": {"$in": child_ids}}},
        {"$group": {
            "_id": None,
            "avgAccuracy": {"$avg": "$fishAccuracy"},
            "avgReaction": {"$avg": "$averageReactionTime"},
            "totalPlayTime": {"$sum": "$sessionDuration"}
        }}
    ]

    stats = list(sessions_col.aggregate(pipeline))

    return jsonify({
        "ok": True,
        "stats": {
            "childrenCount": children_count,
            "totalSessions": total_sessions,
            "todaySessions": today_sessions,
            "weekSessions": week_sessions,
            "avgAccuracy": round(stats[0]["avgAccuracy"], 2) if stats else 0,
            "avgReactionTime": round(stats[0]["avgReaction"], 2) if stats else 0,
            "totalPlayTime": stats[0]["totalPlayTime"] if stats else 0
        }
    })

# ----------------------------
# GAME SETTINGS (PER USER - for Unity)
# ----------------------------
@app.route("/game-settings", methods=["GET", "POST"])
def game_settings():
    user_id = request.args.get("userId")

    if not user_id:
        return jsonify({"ok": False, "message": "userId required"}), 400

    print(f"[DEBUG] /game-settings called with userId={user_id}, method={request.method}")

    # UPDATE SETTINGS
    if request.method == "POST":
        data = request.json
        username = request.args.get("username", "")

        print(f"[DEBUG] Saving settings for userId={user_id}, username={username}")
        print(f"[DEBUG] Received data: {data}")

        update_data = {
            "userId": user_id,
            "speedMultiplier": data.get("speedMultiplier", DEFAULT_GAME_SETTINGS["speedMultiplier"]),
            "minSpawnInterval": data.get("minSpawnInterval", DEFAULT_GAME_SETTINGS["minSpawnInterval"]),
            "maxSpawnInterval": data.get("maxSpawnInterval", DEFAULT_GAME_SETTINGS["maxSpawnInterval"]),
            "spawnFrom": data.get("spawnFrom", DEFAULT_GAME_SETTINGS["spawnFrom"]),
            "targetFishMode": data.get("targetFishMode", DEFAULT_GAME_SETTINGS["targetFishMode"]),
            "useHandTracking": data.get("useHandTracking", DEFAULT_GAME_SETTINGS["useHandTracking"]),
            "handIndexToUse": data.get("handIndexToUse", DEFAULT_GAME_SETTINGS["handIndexToUse"]),
            "movementSensitivity": data.get("movementSensitivity", DEFAULT_GAME_SETTINGS["movementSensitivity"]),
            "showHandSkeleton": data.get("showHandSkeleton", DEFAULT_GAME_SETTINGS["showHandSkeleton"]),
            "normalizeHandSize": data.get("normalizeHandSize", DEFAULT_GAME_SETTINGS["normalizeHandSize"]),
            "handSize": data.get("handSize", DEFAULT_GAME_SETTINGS["handSize"]),
            "showGrabCursor": data.get("showGrabCursor", DEFAULT_GAME_SETTINGS["showGrabCursor"]),
            "cursorSize": data.get("cursorSize", DEFAULT_GAME_SETTINGS["cursorSize"]),
            "grabThreshold": data.get("grabThreshold", DEFAULT_GAME_SETTINGS["grabThreshold"]),
            "jointSize": data.get("jointSize", DEFAULT_GAME_SETTINGS["jointSize"])
        }

        if username:
            update_data["username"] = username

        result = settings_col.update_one(
            {"userId": user_id},
            {"$set": update_data},
            upsert=True
        )

        print(f"[DEBUG] Update result: matched={result.matched_count}, modified={result.modified_count}, upserted_id={result.upserted_id}")

        return jsonify({"ok": True})

    # GET SETTINGS
    print(f"[DEBUG] Fetching settings for userId={user_id}")
    settings = settings_col.find_one({"userId": user_id})
    print(f"[DEBUG] Found settings: {settings}")

    if not settings:
        print(f"[DEBUG] No settings found, returning defaults")
        return jsonify({
            **DEFAULT_GAME_SETTINGS
        })

    response_data = {
        "speedMultiplier": settings.get("speedMultiplier", DEFAULT_GAME_SETTINGS["speedMultiplier"]),
        "minSpawnInterval": settings.get("minSpawnInterval", DEFAULT_GAME_SETTINGS["minSpawnInterval"]),
        "maxSpawnInterval": settings.get("maxSpawnInterval", DEFAULT_GAME_SETTINGS["maxSpawnInterval"]),
        "spawnFrom": settings.get("spawnFrom", DEFAULT_GAME_SETTINGS["spawnFrom"]),
        "targetFishMode": settings.get("targetFishMode", DEFAULT_GAME_SETTINGS["targetFishMode"]),
        "useHandTracking": settings.get("useHandTracking", DEFAULT_GAME_SETTINGS["useHandTracking"]),
        "handIndexToUse": settings.get("handIndexToUse", DEFAULT_GAME_SETTINGS["handIndexToUse"]),
        "movementSensitivity": settings.get("movementSensitivity", DEFAULT_GAME_SETTINGS["movementSensitivity"]),
        "showHandSkeleton": settings.get("showHandSkeleton", DEFAULT_GAME_SETTINGS["showHandSkeleton"]),
        "normalizeHandSize": settings.get("normalizeHandSize", DEFAULT_GAME_SETTINGS["normalizeHandSize"]),
        "handSize": settings.get("handSize", DEFAULT_GAME_SETTINGS["handSize"]),
        "showGrabCursor": settings.get("showGrabCursor", DEFAULT_GAME_SETTINGS["showGrabCursor"]),
        "cursorSize": settings.get("cursorSize", DEFAULT_GAME_SETTINGS["cursorSize"]),
        "grabThreshold": settings.get("grabThreshold", DEFAULT_GAME_SETTINGS["grabThreshold"]),
        "jointSize": settings.get("jointSize", DEFAULT_GAME_SETTINGS["jointSize"])
    }
    print(f"[DEBUG] Returning settings: {response_data}")
    return jsonify(response_data)

# ----------------------------
# GET ALL SETTINGS (for therapist dashboard)
# ----------------------------
@app.route("/all-settings", methods=["GET"])
def get_all_settings():
    all_settings = list(settings_col.find({}))
    for settings in all_settings:
        settings["_id"] = str(settings["_id"])
    return jsonify({"ok": True, "settings": all_settings})

# ----------------------------
# SAVE SESSION WITH DETAILED METRICS
# ----------------------------
@app.route("/save-session", methods=["POST"])
def save_session():
    data = request.json

    if not data.get("userId"):
        return jsonify({"ok": False, "message": "userId required"}), 400

    data["savedAt"] = datetime.utcnow()
    sessions_col.insert_one(data)
    return jsonify({"ok": True, "message": "Session saved successfully"})

# ----------------------------
# GET USER SESSIONS (for therapist analytics)
# ----------------------------
@app.route("/sessions", methods=["GET"])
def get_sessions():
    user_id = request.args.get("userId")
    limit = request.args.get("limit", 50, type=int)

    if not user_id:
        return jsonify({"ok": False, "message": "userId required"}), 400

    sessions = list(sessions_col.find({"userId": user_id}).sort("sessionStartTime", -1).limit(limit))

    for session in sessions:
        session["_id"] = str(session["_id"])

    return jsonify({"ok": True, "sessions": sessions})

# ----------------------------
# GET SESSION STATISTICS (aggregate)
# ----------------------------
@app.route("/sessions/stats", methods=["GET"])
def get_session_stats():
    user_id = request.args.get("userId")

    if not user_id:
        return jsonify({"ok": False, "message": "userId required"}), 400

    pipeline = [
        {"$match": {"userId": user_id}},
        {"$group": {
            "_id": "$userId",
            "totalSessions": {"$sum": 1},
            "totalDuration": {"$sum": "$sessionDuration"},
            "avgFishAccuracy": {"$avg": "$fishAccuracy"},
            "avgClickEffectiveness": {"$avg": "$clickEffectiveness"},
            "avgReactionTime": {"$avg": "$averageReactionTime"},
            "bestAccuracy": {"$max": "$fishAccuracy"},
            "fastestReaction": {"$min": "$averageReactionTime"},
            "totalCorrectFish": {"$sum": "$correctFish"},
            "totalWrongFish": {"$sum": "$wrongFish"},
            "bestStreak": {"$max": "$maxStreak"}
        }}
    ]

    stats = list(sessions_col.aggregate(pipeline))

    if not stats:
        return jsonify({"ok": True, "stats": None})

    return jsonify({"ok": True, "stats": stats[0]})

# ----------------------------
# RUN
# ----------------------------
if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5001, debug=True)
