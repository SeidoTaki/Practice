
from flask import Flask, request, jsonify
from models import db, User, Medication, Condition, Exercise, WorkoutPlan, WorkoutExercise, ActivityRecord, ChatSession, ChatMessage
from flask_cors import CORS
import requests
from flask_migrate import Migrate
from flask_jwt_extended import create_access_token, JWTManager
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timedelta, timezone

app = Flask(__name__)
migrate = Migrate(app, db)
CORS(app, resources={
    r"/*": {
        "origins": ["*"],
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


@app.route('/login', methods=['POST', 'OPTIONS'])
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
            "user_id": new_user.user_id,
            "token": create_access_token(identity=new_user.user_id)
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
                "medication": {
                    "id": new_med.med_id,  # Исправлено с new_med.id на new_med.med_id
                    "name": new_med.name,
                    "dosage": new_med.dosage,
                    "notes": new_med.notes,
                    "created_at": new_med.created_at.isoformat() if new_med.created_at else None
                }
            }), 201

        else:  # GET запрос
            user_id = request.args.get('user_id')
            if not user_id:
                return jsonify({"error": "user_id parameter is required"}), 400

            meds = Medication.query.filter_by(user_id=user_id).all()

            return jsonify([{
                "id": med.med_id,  # Исправлено с med.id на med.med_id
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


@app.route('/api/conditions', methods=['GET', 'POST', 'OPTIONS'])  # Добавим /api для согласованности
def handle_conditions():
    if request.method == 'OPTIONS':
        return _build_cors_preflight_response()

    try:
        if request.method == 'POST':
            data = request.get_json()
            if not data or 'user_id' not in data or 'rating' not in data:
                return jsonify({"error": "Missing required fields"}), 400

            new_condition = Condition(
                user_id=data['user_id'],
                rating=data['rating'],
                notes=data.get('notes', ''),
                date=datetime.now(timezone.utc).date()
            )

            db.session.add(new_condition)
            db.session.commit()

            return jsonify({
                "id": new_condition.condition_id,
                "date": new_condition.date.isoformat(),
                "rating": new_condition.rating,
                "notes": new_condition.notes
            }), 201

        else:  # GET запрос
            user_id = request.args.get('user_id')
            if not user_id:
                return jsonify({"error": "user_id parameter is required"}), 400

            conditions = Condition.query.filter_by(user_id=user_id) \
                .order_by(Condition.date.desc()) \
                .limit(30) \
                .all()

            return jsonify([{
                "id": cond.condition_id,
                "date": cond.date.isoformat(),
                "rating": cond.rating,
                "notes": cond.notes
            } for cond in conditions])

    except Exception as e:
        app.logger.error(f"Error in /api/conditions: {str(e)}")
        return jsonify({
            "error": "Internal server error",
            "details": str(e)
        }), 500


@app.route('/api/workout-plan', methods=['GET', 'POST', 'OPTIONS'])
def handle_workout_plan():
    if request.method == 'OPTIONS':
        return _build_cors_preflight_response()


    # GET запрос - получение плана тренировок
    if request.method == 'GET':
        try:
            user_id = request.args.get('user_id')
            if not user_id:
                return jsonify({"error": "Требуется user_id"}), 400

            try:
                user_id = int(user_id)  # Преобразуем в число
            except ValueError:
                return jsonify({"error": "user_id должен быть числом"}), 400

            # Фильтры из query-параметров
            muscle_group = request.args.get('muscle_group')
            day = request.args.get('day')

            # Строим запрос к БД
            query = db.session.query(WorkoutExercise, Exercise) \
                .join(Exercise, WorkoutExercise.exercise_id == Exercise.exercise_id) \
                .join(WorkoutPlan, WorkoutExercise.plan_id == WorkoutPlan.plan_id) \
                .filter(WorkoutPlan.user_id == user_id)

            # Применяем фильтры
            if muscle_group:
                query = query.filter(Exercise.muscle_group == muscle_group)
            if day:
                query = query.filter(WorkoutExercise.day == day)

            results = query.all()

            # Формируем ответ
            exercises = []
            for we, ex in results:
                exercises.append({
                    "id": we.id,
                    "exercise_id": ex.exercise_id,
                    "name": ex.name,
                    "muscle_group": ex.muscle_group,
                    "day": we.day,
                    "sets": we.sets,
                    "reps": we.reps,
                    "description": ex.description
                })

            return jsonify(exercises)

        except Exception as e:
            app.logger.error(f"Ошибка при GET запросе: {str(e)}")
            return jsonify({"error": "Внутренняя ошибка сервера"}), 500

    # POST запрос - добавление упражнения в план
    elif request.method == 'POST':
        print("[SERVER] Получен запрос с данными:", request.json)

        try:
            data = request.get_json()
            if not data:
                print("[SERVER] Ошибка: нет данных")
                return jsonify({"error": "Требуются данные"}), 400

            # Проверка обязательных полей
            required = ['user_id', 'exercise_id']
            missing = [field for field in required if field not in data]
            if missing:
                print(f"[SERVER] Отсутствуют поля: {missing}")
                return jsonify({"error": f"Отсутствуют: {missing}"}), 400

            # Проверка и преобразование ID
            try:
                user_id = int(data['user_id'])
                exercise_id = int(data['exercise_id'])
            except (ValueError, TypeError):
                return jsonify({"error": "user_id и exercise_id должны быть числами"}), 400

            # Проверка подходов и повторений
            sets = data.get('sets', 3)
            reps = data.get('reps', 10)

            try:
                sets = int(sets)
                reps = int(reps)
                if sets <= 0 or reps <= 0:
                    return jsonify({"error": "Подходы и повторения должны быть положительными числами"}), 400
            except (ValueError, TypeError):
                return jsonify({"error": "Подходы и повторения должны быть числами"}), 400

            # Находим или создаем план тренировки
            workout_plan = WorkoutPlan.query.filter_by(user_id=user_id).first()
            if not workout_plan:
                workout_plan = WorkoutPlan(
                    user_id=user_id,
                    name="Мой план тренировок",
                    description="Персональный план тренировок"
                )
                db.session.add(workout_plan)
                db.session.commit()

            # Создаем новую запись об упражнении
            new_exercise = WorkoutExercise(
                plan_id=workout_plan.plan_id,
                exercise_id=exercise_id,
                day=data.get('day', 'Monday'),
                sets=sets,
                reps=reps
            )

            db.session.add(new_exercise)
            db.session.commit()

            return jsonify({
                "message": "Упражнение добавлено в план тренировок",
                "exercise_id": new_exercise.id,
                "id": new_exercise.id
            }), 201


        except Exception as e:

            print("[SERVER] Ошибка:", str(e))
            return jsonify({"error": "Серверная ошибка"}), 500

    # Если метод не GET/POST/OPTIONS
    return jsonify({"error": "Метод не поддерживается"}), 405


@app.route('/api/workout-plan/<int:exercise_id>', methods=['DELETE'])
def delete_workout_exercise(exercise_id):
    try:
        exercise = WorkoutExercise.query.get(exercise_id)
        if not exercise:
            return jsonify({"error": "Exercise not found"}), 404

        db.session.delete(exercise)
        db.session.commit()

        return jsonify({"message": "Exercise removed from workout plan"}), 200
    except Exception as e:
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


@app.route('/api/chat/session', methods=['POST', 'GET', 'OPTIONS'])
def handle_chat_session():
    if request.method == 'OPTIONS':
        return _build_cors_preflight_response()

    if request.method == 'POST':
        data = request.json
        user_id = data.get('user_id')
        if not user_id:
            return jsonify({"error": "user_id is required"}), 400

        # Создаем новую сессию
        new_session = ChatSession(user_id=user_id)
        db.session.add(new_session)
        db.session.commit()

        return jsonify({
            "session_id": new_session.session_id,
            "message": "New chat session created"
        }), 201

    elif request.method == 'GET':
        user_id = request.args.get('user_id')
        if not user_id:
            return jsonify({"error": "user_id is required"}), 400

        # Получаем последнюю активную сессию пользователя
        session = ChatSession.query.filter_by(user_id=user_id) \
            .order_by(ChatSession.updated_at.desc()) \
            .first()

        if not session:
            return jsonify({"error": "No sessions found"}), 404

        # Получаем сообщения сессии
        messages = ChatMessage.query.filter_by(session_id=session.session_id) \
            .order_by(ChatMessage.created_at.asc()) \
            .all()

        return jsonify({
            "session_id": session.session_id,
            "messages": [{
                "sender": msg.sender,
                "text": msg.text,
                "created_at": msg.created_at.isoformat()
            } for msg in messages]
        }), 200
    return jsonify({"error": "Метод не поддерживается"}), 405


@app.route('/api/chat', methods=['POST', 'OPTIONS'])
def chat():
    if request.method == 'OPTIONS':
        return _build_cors_preflight_response()

    data = request.json
    prompt = data.get('prompt')
    model = data.get('model', 'llama3.2:3b')
    session_id = data.get('session_id')
    user_id = data.get('user_id')

    if not prompt:
        return jsonify({"error": "Prompt is required"}), 400

    # Если нет session_id, создаем новую сессию
    if not session_id:
        if not user_id:
            return jsonify({"error": "user_id is required when creating new session"}), 400

        new_session = ChatSession(user_id=user_id)
        db.session.add(new_session)
        db.session.commit()
        session_id = new_session.session_id

    try:
        # Получаем список лекарств пользователя
        meds = Medication.query.filter_by(user_id=user_id).all()
        meds_text = "Лекарства пользователя:\n"
        for med in meds:
            meds_text += f"- {med.name}, дозировка: {med.dosage}\n"

        # Получаем историю сообщений сессии
        messages = ChatMessage.query.filter_by(session_id=session_id).order_by(ChatMessage.created_at.asc()).all()

        # Формируем промпт
        if len(messages) == 0:  # Первое сообщение в сессии
            instructions = (
                " Отвечай как опытный врач и фитнес тренер. Отвечай только на вопросы про здоровый образ жизни, медицина, медикаменты, питание и упражнения. "
                "Если вопрос не по теме, вежливо откажись отвечать. Отвечай на русском языке.\n\n"
            )
            full_prompt = f"{instructions}{meds_text}\nВопрос: {prompt}"
        else:
            # Собираем историю диалога
            chat_history = ""
            for msg in messages:
                if msg.sender == 'user':
                    chat_history += f"Пользователь: {msg.text}\n"
                else:
                    chat_history += f"Ассистент: {msg.text}\n"

            full_prompt = f"{meds_text}\n{chat_history}Пользователь: {prompt}"

        # Сохраняем сообщение пользователя в БД
        user_message = ChatMessage(
            session_id=session_id,
            sender='user',
            text=prompt
        )
        db.session.add(user_message)

        # Отправляем запрос к Ollama API
        response = requests.post(
            "http://localhost:11434/api/generate",
            json={
                "model": model,
                "prompt": full_prompt,
                "stream": False,
                "options": {
                    "temperature": 0.7,
                    "top_p": 0.9
                }
            },
            headers={'Content-Type': 'application/json'}
        )
        response.raise_for_status()

        bot_response = response.json().get('response')

        # Сохраняем ответ бота в БД
        bot_message = ChatMessage(
            session_id=session_id,
            sender='bot',
            text=bot_response
        )
        db.session.add(bot_message)

        # Обновляем время сессии
        session = ChatSession.query.get(session_id)
        if session:
            session.updated_at = datetime.now(timezone.utc)

        db.session.commit()

        return jsonify({
            "response": bot_response,
            "session_id": session_id
        })

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@app.route('/api/activity', methods=['GET', 'POST', 'OPTIONS'])
def handle_activity():
    if request.method == 'OPTIONS':
        return _build_cors_preflight_response()

    try:
        if request.method == 'GET':
            # Проверяем обязательные параметры
            user_id = request.args.get('user_id')
            if not user_id:
                return jsonify({"error": "Missing user_id parameter"}), 400

            
            try:
                user_id = int(user_id)
                year = request.args.get('year')
                month = request.args.get('month')

                if year and month:
                    year = int(year)
                    month = int(month)
                    if month < 1 or month > 12:
                        return jsonify({"error": "Invalid month value"}), 400

            except ValueError:
                return jsonify({"error": "Invalid parameter format"}), 400

            # Формируем запрос
            query = ActivityRecord.query.filter_by(user_id=user_id)

            if year and month:
                start_date = datetime(year, month, 1).date()
                end_date = datetime(year, month + 1, 1).date() - timedelta(days=1)
                query = query.filter(ActivityRecord.date >= start_date,
                                     ActivityRecord.date <= end_date)

            # Получаем данные
            records = query.order_by(ActivityRecord.date).all()

            # Форматируем ответ
            result = [{
                "date": record.date.isoformat(),
                "has_workout": record.has_workout,
                "duration": record.duration if record.has_workout else 0
            } for record in records]

            return jsonify(result)

        elif request.method == 'POST':
            # Обработка сохранения данных
            data = request.get_json()
            if not data:
                return jsonify({"error": "No data provided"}), 400

            
            required_fields = ['user_id', 'days']
            if not all(field in data for field in required_fields):
                return jsonify({"error": f"Missing required fields: {required_fields}"}), 400

            try:
                user_id = int(data['user_id'])
                days_data = data['days']
            except (ValueError, TypeError):
                return jsonify({"error": "Invalid data format"}), 400

            # Обрабатываем каждый день
            saved_days = []
            for day in days_data:
                try:
                    date_obj = datetime.strptime(day['date'], '%Y-%m-%d').date()
                    has_workout = bool(day.get('has_workout', False))
                    duration = int(day.get('duration', 0)) if has_workout else 0

                    # Ищем существующую запись
                    record = ActivityRecord.query.filter_by(
                        user_id=user_id,
                        date=date_obj
                    ).first()

                    if record:
                        # Обновляем существующую запись
                        record.has_workout = has_workout
                        record.duration = duration
                        action = 'updated'
                    else:
                        # Создаем новую запись
                        record = ActivityRecord(
                            user_id=user_id,
                            date=date_obj,
                            has_workout=has_workout,
                            duration=duration
                        )
                        db.session.add(record)
                        action = 'created'

                    saved_days.append({
                        "date": day['date'],
                        "action": action,
                        "success": True
                    })

                except Exception as e:
                    db.session.rollback()
                    saved_days.append({
                        "date": day.get('date', 'unknown'),
                        "action": "failed",
                        "error": str(e),
                        "success": False
                    })
                    continue

            db.session.commit()
            return jsonify({
                "message": "Activity data processed",
                "results": saved_days
            }), 200


    except Exception as e:
        db.session.rollback()
        app.logger.error(f"Activity error: {str(e)}")
        return jsonify({
            "error": "Internal server error",
            "details": str(e)
        }), 500
    return jsonify({"error": "Метод не поддерживается"}), 405

if __name__ == '__main__':
    app.run(port=5000, debug=True)