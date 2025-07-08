
from flask import Flask, request, jsonify
from models import db, User, Medication, Condition, Exercise, WorkoutPlan, WorkoutExercise, ActivityRecord
from flask_cors import CORS
import requests
from flask_migrate import Migrate
from flask_jwt_extended import create_access_token, JWTManager
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__)
migrate = Migrate(app, db)


CORS(app, resources={
    r"/*": {
        "origins": ["http://localhost:3000"],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"],
        "supports_credentials": False
    }

})

app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///health.db'
db.init_app(app)

app.config['JWT_SECRET_KEY'] = 'key'
jwt = JWTManager(app)



def _build_cors_preflight_response():
    response = jsonify()
    response.headers.add("Access-Control-Allow-Origin", "*")
    response.headers.add("Access-Control-Allow-Headers", "*")
    response.headers.add("Access-Control-Allow-Methods", "*")
    return response

@app.route('/login', methods=['POST'])
def login():
    if request.method == 'OPTIONS':
        return _build_cors_preflight_response()
    data = request.json
    user = User.query.filter_by(username=data['username']).first()
    if not user or not check_password_hash(user.password, data['password']):
       return jsonify({"error": "Invalid username or password"}), 401

    access_token = create_access_token(identity=user.user_id)
    return jsonify({
        "token": access_token,
        "user_id": user.user_id
    }), 200

@app.route('/register', methods=['POST'])
def register():
    if request.method == 'OPTIONS':
        return _build_cors_preflight_response()
    try:
        print("Register endpoint hit")
        data = request.json
        existing_user = User.query.filter_by(username=data['username']).first()
        if existing_user:
            return jsonify({"error": "Username already exists"}), 400

        if not data or 'username' not in data or 'password' not in data:
            return jsonify({"error": "Username and password are required"}), 400
        print("Received data:", data)

        if not data or 'username' not in data or 'password' not in data:
            return jsonify({"error": "Username and password are required"}), 400

        hashed_password = generate_password_hash(data['password'])
        new_user = User(
            username=data['username'],
            password=hashed_password,
            height=data.get('height'),
            weight=data.get('weight'),
            chronic_diseases=data.get('chronic_diseases')
        )
        db.session.add(new_user)
        db.session.commit()

        return jsonify({
            "message": "User created successfully",
            "user_id": new_user.user_id
        }), 201
    except Exception as e:
        print("Registration error:", str(e))
        return jsonify({"error": str(e)}), 500



@app.cli.command('init-db')
def init_db():
    db.create_all()


@app.route('/exercises', methods=['GET'])
def get_all_exercises():
    exercises = Exercise.query.all()
    return jsonify([{
        'exercise_id': ex.exercise_id,
        'name': ex.name,
        'muscle_group': ex.muscle_group,
        'description': ex.description,
        'image_url': ex.image_url
    } for ex in exercises])

@app.route('/api/medications', methods=['GET', 'POST'])
def handle_medications():
    try:
        if request.method == 'POST':
            data = request.get_json()
            if not data or 'user_id' not in data or 'name' not in data or 'dosage' not in data:
                return jsonify({"error": "Missing required fields"}), 400

            new_med = Medication(
                user_id=data['user_id'],
                name=data['name'],
                dosage=data['dosage'],
                notes=data.get('notes', '')
            )

            db.session.add(new_med)
            db.session.commit()

            return jsonify({
                "message": "Medication added successfully",
                "medication_id": new_med.id
            }), 201

        else:
            user_id = request.args.get('user_id')
            if not user_id:
                return jsonify({"error": "user_id parameter is required"}), 400

            meds = Medication.query.filter_by(user_id=user_id).all()

            return jsonify([{
                "id": med.id,
                "name": med.name,
                "dosage": med.dosage,
                "notes": med.notes,
                "created_at": med.created_at.isoformat() if med.created_at else None
            } for med in meds])

    except Exception as e:
        app.logger.error(f"Error in /api/medications: {str(e)}")
        return jsonify({
            "error": "Internal server error",
            "details": str(e)
        }), 500

@app.route('/conditions', methods=['GET', 'POST'])
def handle_conditions():
    try:
        if request.method == 'POST':
            data = request.get_json()
            if not data or 'user_id' not in data or 'rating' not in data:
                return jsonify({"error": "Missing required fields"}), 400

            new_condition = Condition(
                user_id=data['user_id'],
                rating=data['rating'],
                notes=data.get('notes', '')
            )

            db.session.add(new_condition)
            db.session.commit()

            return jsonify({
                "id": new_condition.id,
                "date": new_condition.date.isoformat(),
                "rating": new_condition.rating,
                "notes": new_condition.notes
            }), 201

        else:
            user_id = request.args.get('user_id')
            if not user_id:
                return jsonify({"error": "user_id parameter is required"}), 400

            conditions = Condition.query.filter_by(user_id=user_id)\
                              .order_by(Condition.date.desc())\
                              .limit(30)\
                              .all()

            return jsonify([{
                "id": cond.id,
                "date": cond.date.isoformat(),
                "rating": cond.rating,
                "notes": cond.notes
            } for cond in conditions])

    except Exception as e:
        app.logger.error(f"Error in /conditions: {str(e)}")
        return jsonify({
            "error": "Internal server error",
            "details": str(e)
        }), 500

@app.route('/api/test')
def test():
    return jsonify({"status": "Backend is working!"})


@app.route('/api/workout-plan', methods=['GET', 'OPTIONS'])
def get_workout_plan():
    if request.method == "OPTIONS":
        return _build_cors_preflight_response()

    try:
        user_id = request.args.get('user_id')
        muscle_group = request.args.get('muscle_group')

        if not user_id:
            return jsonify({"error": "user_id is required"}), 400

        # Получаем упражнения из плана пользователя
        workout_exercises = db.session.query(
            WorkoutExercise,
            Exercise
        ).join(
            Exercise,
            WorkoutExercise.exercise_id == Exercise.exercise_id
        ).join(
            WorkoutPlan,
            WorkoutExercise.plan_id == WorkoutPlan.plan_id
        ).filter(
            WorkoutPlan.user_id == user_id
        )

        if muscle_group:
            workout_exercises = workout_exercises.filter(
                Exercise.muscle_group == muscle_group
            )

        result = []
        for we, ex in workout_exercises.all():
            result.append({
                "exercise_id": ex.exercise_id,
                "name": ex.name,
                "muscle_group": ex.muscle_group,
                "day": we.day,
                "sets": we.sets,
                "reps": we.reps,
                "image_url": ex.image_url,
                "description": ex.description
            })

        return jsonify(result)

    except Exception as e:
        app.logger.error(f"Error in /api/workout-plan: {str(e)}")
        return jsonify({"error": str(e)}), 500


@app.route('/api/summary', methods=['GET'])
def get_summary():
    return jsonify({
        "status": "under_development",
        "message": "This feature is currently under development",
        "expected_features": [
            "Health statistics summary",
            "Medication overview",
            "Activity progress",
            "Condition trends"
        ]
    }), 501


OLLAMA_API_URL = "http://localhost:3000/api/generate"

@app.route('/api/chat', methods=['POST'])
def chat():
    if request.method == 'OPTIONS':
        # Обработка предварительного OPTIONS запроса
        response = jsonify()
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type')
        response.headers.add('Access-Control-Allow-Methods', 'POST, OPTIONS')
        return response
    data = request.json
    prompt = data.get('prompt')
    model = data.get('model', 'deepseek-r1:1.5b')  # модель по умолчанию

    if not prompt:
        return jsonify({"error": "Prompt is required"}), 400

    try:
        # Отправляем запрос к Ollama API
        response = requests.post(
            "http://localhost:11434/api/generate",
            json={
                "model": model,
                "prompt": prompt,
                "stream": False
            },
            headers={'Content-Type': 'application/json'}
        )
        response.raise_for_status()
        return jsonify(response.json())
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/activity', methods=['GET', 'POST'])
def handle_activity():
    try:
        if request.method == 'POST':
            data = request.get_json()
            if not data or 'user_id' not in data or 'days' not in data:
                return jsonify({"error": "Missing required fields"}), 400

            user_id = data['user_id']
            days_data = data['days']

            # Удаляем старые записи для этого пользователя
            ActivityRecord.query.filter_by(user_id=user_id).delete()

            # Сохраняем новые записи
            for day in days_data:
                record = ActivityRecord(
                    user_id=user_id,
                    day_number=day['id'],
                    has_workout=day['checked'],
                    duration=day['duration'] if day['checked'] else None
                )
                db.session.add(record)

            db.session.commit()

            return jsonify({"message": "Activity data saved successfully"}), 201

        else:  # GET запрос
            user_id = request.args.get('user_id')
            if not user_id:
                return jsonify({"error": "user_id is required"}), 400

            records = ActivityRecord.query.filter_by(user_id=user_id).all()
            return jsonify([{
                "day_number": r.day_number,
                "has_workout": r.has_workout,
                "duration": r.duration
            } for r in records])

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)  # host='0'.