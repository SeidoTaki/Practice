from app import app, db
from werkzeug.security import generate_password_hash
from models import User, Exercise, WorkoutPlan, WorkoutExercise, Medication, Condition, ActivityRecord
from datetime import datetime, timedelta

def init_db():
    with app.app_context():
        # Создаем все таблицы
        db.drop_all()  # Удаляем существующие таблицы
        db.create_all()

        # Добавляем тестового пользователя
        test_user = User(
            username='test',
            password=generate_password_hash('test'),
            height=175,
            weight=70,
            chronic_diseases='None'
        )
        db.session.add(test_user)
        db.session.commit()

        # + тестовые упражнения
        exercises = [
            Exercise(
                name="Push-ups",
                muscle_group="Chest",
                description="Basic chest exercise. Keep your body straight.",
                image_url="/images/pushups.jpg"
            ),
            Exercise(
                name="Pull-ups",
                muscle_group="Back",
                description="Basic back exercise. Pull your chin over the bar.",
                image_url="/images/pullups.jpg"
            ),
            Exercise(
                name="Squats",
                muscle_group="Legs",
                description="Basic leg exercise. Keep your back straight.",
                image_url="/images/squats.jpg"
            )
        ]
        db.session.add_all(exercises)
        db.session.commit()

        # + тестовый план тренировок
        workout_plan = WorkoutPlan(
            user_id=test_user.user_id,
            name="My First Plan",
            description="Beginner workout plan"
        )
        db.session.add(workout_plan)
        db.session.commit()

        # + упражнения в план
        workout_exercises = [
            WorkoutExercise(
                plan_id=workout_plan.plan_id,
                exercise_id=exercises[0].exercise_id,  # Push-ups
                day="Monday",
                sets=3,
                reps=10
            ),
            WorkoutExercise(
                plan_id=workout_plan.plan_id,
                exercise_id=exercises[1].exercise_id,  # Pull-ups
                day="Wednesday",
                sets=3,
                reps=8
            )
        ]
        db.session.add_all(workout_exercises)
        db.session.commit()

        #  тестовые лекарства
        medications = [
            Medication(
                user_id=test_user.user_id,
                name="Vitamin D",
                dosage="2000 IU",
                notes="Take with breakfast"
            )
        ]
        db.session.add_all(medications)
        db.session.commit()

        #  тестовые записи о состоянии
        conditions = []
        for i in range(7):  # Последние 7 дней
            conditions.append(Condition(
                user_id=test_user.user_id,
                rating=6 + i % 3,  # Чередуем 6,7,8
                notes=f"Day {i+1} note",
                date=(datetime.now() - timedelta(days=6-i)).date()
            ))
        db.session.add_all(conditions)
        db.session.commit()

        #  тестовые записи активности
        activity_records = []
        for i in range(1, 31):  # 30 дней
            has_workout = i % 3 != 0  # тренировка каждый 3 день
            activity_records.append(ActivityRecord(
                user_id=test_user.user_id,
                day_number=i,
                has_workout=has_workout,
                duration=30 + i % 20 if has_workout else None,
                date=(datetime.now() - timedelta(days=30-i)).date()
            ))
        db.session.add_all(activity_records)
        db.session.commit()


if __name__ == '__main__':
    init_db()
    print("Database initialized successfully with test data!")