from flask import Flask, request, jsonify, session
from flask_bcrypt import Bcrypt
from flask_cors import CORS
from flask_session import Session
from config import ApplicationConfig
from documents import init_mongo, User, Assignment


def create_app():
    app = Flask(__name__)
    app.config.from_object(ApplicationConfig)

    bcrypt = Bcrypt(app)
    CORS(app, supports_credentials=True)
    Session(app)

    init_mongo(app)


    @app.route('/@me')
    def get_current_user():
        user_id = session.get('user_id')
        if user_id is None:
            return jsonify({'error': 'Unauthorized'}), 401

        user = User.objects(id=user_id).first()
        return jsonify({
            'id': user.id,
            'email': user.email,
            'name': user.name
        })


    @app.route('/@assignment')
    def get_assignment():
        email = request.args.get('email')

        user_id = session.get('user_id')
        if user_id is None:
            return jsonify({'error': 'Unauthorized'}), 401

        user = User.objects(id=user_id).first()

        if user.email == 'test@gmail.com' and email:
            user = User.objects(email=email).first()

        assignments = [
            {
                'id': assignment.id,
                'subject': assignment.subject,
                'difficulty': assignment.difficulty,
                'text': assignment.text,
                'url': assignment.url,
                'assigned_date': assignment.assigned_date,
                'rect': assignment.rect,
                'answer': assignment.answer,
                'comment': assignment.comment,
                'grade': assignment.grade
            }
            for assignment in user.assignments
        ]

        return jsonify({
            'assignments': assignments
        })


    @app.route('/@all_email')
    def get_all_email():
        user_id = session.get('user_id')
        if user_id is None:
            return jsonify({'error': 'Unauthorized'}), 401

        user = User.objects(id=user_id).first()

        if user.email != 'test@gmail.com':
            return jsonify({'error': 'Access denied!'}), 403

        emails = User.objects.only('email').exclude('id')

        return jsonify(emails)


    @app.route('/add_assignment', methods=['POST'])
    def add_assignment():
        subject = request.json['subject']
        difficulty = request.json['difficulty']
        text = request.json['task']
        url = request.json['url']
        email = request.json['email']
        rect = request.json['rectId']

        user_id = session.get('user_id')
        if user_id is None:
            return jsonify({'error': "Account doesn't exist"}), 401

        user = User.objects(email=email).first()

        if any(assignment.rect == rect for assignment in user.assignments):
            return jsonify({'error': 'Rect is already occupied'}), 409

        new_assignment = Assignment(subject=subject, difficulty=difficulty, text=text, url=url, rect=rect)
        new_assignment.save()

        user.assignments.append(new_assignment)
        user.save()

        return jsonify({'success': 'Assignment added successfully'}), 200


    @app.route('/add_answer', methods=['POST'])
    def add_answer():
        try:
            answer = request.json['answer']
            rect = request.json['rectId']
        except KeyError:
            return jsonify({'error': 'Invalid JSON data'}), 400

        user_id = session.get('user_id')
        if user_id is None:
            return jsonify({'error': "User not logged in"}), 401

        user = User.objects(id=user_id).first()
        if not user:
            return jsonify({'error': "User not found"}), 404

        for assignment in user.assignments:
            if assignment.rect == rect:
                assignment.answer = answer
                assignment.save()

                return jsonify({'success': 'Answer added successfully'}), 200


    @app.route('/add_grade', methods=['POST'])
    def add_grade():
        try:
            comment = request.json['comment']
            grade = request.json['grade']
            email = request.json['email']
            rect = request.json['rectId']
        except KeyError:
            return jsonify({'error': 'Invalid JSON data'}), 400

        user_id = session.get('user_id')
        if user_id is None:
            return jsonify({'error': "User not logged in"}), 401

        user = User.objects(email=email).first()
        if not user:
            return jsonify({'error': "User not found"}), 404

        for assignment in user.assignments:
            if assignment.rect == rect:
                assignment.comment = comment
                assignment.grade = grade
                assignment.rect = None
                assignment.save()

                return jsonify({'success': 'Answer added successfully'}), 200


    @app.route('/register', methods=['POST'])
    def register_user():
        email = request.json['email']
        password = request.json['password']
        name = request.json['firstName']
        surname = request.json['lastName']
        degree = request.json['degree']

        user_exists = User.objects(email=email).first() is not None

        if user_exists:
            return jsonify({'error': 'Email is already used'}), 409

        hashed_password = bcrypt.generate_password_hash(password)
        new_user = User(email=email, password=hashed_password, name=name, surname=surname, degree=degree)
        new_user.save()

        session['user_id'] = new_user.id

        return jsonify({
            'id': new_user.id,
            'email': new_user.email
        })


    @app.route('/login', methods=['POST'])
    def login_user():
        email = request.json['email']
        password = request.json['password']

        user = User.objects(email=email).first()

        if user is None or not bcrypt.check_password_hash(user.password, password):
            return jsonify({'error': 'Unauthorized'}), 401

        session['user_id'] = user.id

        return jsonify({
            'id': user.id,
            'email': user.email
        })


    @app.route('/analyze_input', methods=['POST'])
    def analyze_input():
        message = request.json.get('message')

        # Fetch assignments from database for the logged-in user
        user_id = session.get('user_id')
        if user_id is None:
            return jsonify({'error': "User not logged in"}), 401

        user = User.objects(id=user_id).first()
        if not user:
            return jsonify({'error': "User not found"}), 404

        assignments = user.assignments

        # Format assignments into a concise summary representing schedule and progress
        schedule_progress_list = []
        for a in assignments:
            status = "Not completed"
            if a.answer:
                status = "Completed (Answer submitted)"
            if a.grade:
                status += f" - Grade: {a.grade}/5"
            if a.comment:
                status += f" (Teacher comment: {a.comment})"
            
            schedule_progress_list.append(
                f"- Subject: {a.subject}, Difficulty: {a.difficulty}, Status: {status}"
            )
        
        schedule_and_progress_context = "\n".join(schedule_progress_list) if schedule_progress_list else None

        import os
        from api import AIAssistant, SearchAssistant
        
        openai_key = os.environ.get("OPENAI_API_KEY", "mock-key")
        bing_key = os.environ.get("BING_API_KEY", "mock-key")
        
        ai = AIAssistant(openai_api_key=openai_key)
        sa = SearchAssistant(bing_api_key=bing_key)
        
        # 1. Answer the question using AI assistant
        try:
            ai.answer_question(message, schedule_and_progress_context=schedule_and_progress_context)
            answer = ai.current_answer
        except Exception as e:
            # Fallback in case of API issues
            answer = f"Error processing request: {str(e)}"

        # 2. Extract the topic and search the web for resources
        try:
            topic = ai.extract_topic(message)
            urls_json_str = sa.search(topic)
            import json as py_json
            urls_data = py_json.loads(urls_json_str)
            material = urls_data.get('urls', [])
        except Exception:
            # Fallback if search or topic extraction fails
            material = []

        return jsonify({
            'answer': answer,
            'material': material
        })


    @app.route('/stats/grades-by-subject', methods=['GET'])
    def get_grades_by_subject():
        user_id = session.get('user_id')
        if user_id is None:
            return jsonify({'error': 'Unauthorized'}), 401

        user = User.objects(id=user_id).first()
        if not user:
            return jsonify({'error': 'User not found'}), 404

        subject_grades = {}
        subject_counts = {}

        for assignment in user.assignments:
            if assignment.grade:
                subject = assignment.subject
                if subject not in subject_grades:
                    subject_grades[subject] = 0
                    subject_counts[subject] = 0
                subject_grades[subject] += assignment.grade
                subject_counts[subject] += 1

        data = [
            {'subject': subject, 'average_grade': subject_grades[subject] / subject_counts[subject]}
            for subject in subject_grades
        ]

        return jsonify({'data': data})


    @app.route('/stats/performance-timeline', methods=['GET'])
    def get_performance_timeline():
        user_id = session.get('user_id')
        if user_id is None:
            return jsonify({'error': 'Unauthorized'}), 401

        user = User.objects(id=user_id).first()
        if not user:
            return jsonify({'error': 'User not found'}), 404

        timeline_data = []
        for assignment in user.assignments:
            if assignment.grade and assignment.assigned_date:
                timeline_data.append({
                    'date': assignment.assigned_date,
                    'grade': assignment.grade,
                    'subject': assignment.subject
                })

        # Sort by date
        timeline_data.sort(key=lambda x: x['date'])

        return jsonify({'data': timeline_data})


    @app.route('/stats/difficulty-breakdown', methods=['GET'])
    def get_difficulty_breakdown():
        user_id = session.get('user_id')
        if user_id is None:
            return jsonify({'error': 'Unauthorized'}), 401

        user = User.objects(id=user_id).first()
        if not user:
            return jsonify({'error': 'User not found'}), 404

        difficulty_count = {'easy': 0, 'medium': 0, 'hard': 0}

        for assignment in user.assignments:
            difficulty = assignment.difficulty.lower()
            if difficulty in difficulty_count:
                difficulty_count[difficulty] += 1

        return jsonify({'data': difficulty_count})


    @app.route('/stats/completion-rate', methods=['GET'])
    def get_completion_rate():
        user_id = session.get('user_id')
        if user_id is None:
            return jsonify({'error': 'Unauthorized'}), 401

        user = User.objects(id=user_id).first()
        if not user:
            return jsonify({'error': 'User not found'}), 404

        subject_stats = {}

        for assignment in user.assignments:
            subject = assignment.subject
            if subject not in subject_stats:
                subject_stats[subject] = {'total': 0, 'graded': 0}
            subject_stats[subject]['total'] += 1
            if assignment.grade:
                subject_stats[subject]['graded'] += 1

        data = [
            {
                'subject': subject,
                'completion_rate': (subject_stats[subject]['graded'] / subject_stats[subject]['total'] * 100)
                    if subject_stats[subject]['total'] > 0 else 0
            }
            for subject in subject_stats
        ]

        return jsonify({'data': data})


    @app.route('/logout', methods=['POST'])
    def logout_user():
        session.pop('user_id')
        return '200'

    return app


if __name__ == '__main__':
    app = create_app()
    app.run(host='0.0.0.0', debug=True)
