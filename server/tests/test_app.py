from factories import UserFactory, AssignmentFactory


def set_session(client, user_id):
    with client.session_transaction() as sess:
        sess['user_id'] = user_id


def test_me_unauthorized(client):
    resp = client.get('/@me')
    assert resp.status_code == 401
    assert resp.get_json()['error'] == 'Unauthorized'


def test_me_returns_user(client):
    UserFactory().create()

    set_session(client, 'u1')

    resp = client.get('/@me')

    assert resp.status_code == 200
    data = resp.get_json()
    assert data['id'] == 'u1'
    assert data['email'] == 'a@b.com'
    assert data['name'] == 'Alice'


def test_assignment_unauthorized(client):
    resp = client.get('/@assignment')
    assert resp.status_code == 401


def test_assignment_admin_can_view_other_email(client):
    UserFactory(id='admin', email='test@gmail.com', name='Admin').create()
    UserFactory(assignments=[AssignmentFactory().create()]).create()

    set_session(client, 'admin')

    resp = client.get('/@assignment?email=a@b.com')
    assert resp.status_code == 200
    data = resp.get_json()
    assert len(data['assignments']) == 1
    assert data['assignments'][0]['subject'] == 'Math'
    assert data['assignments'][0]['rect'] == 1


def test_all_email_denied_for_non_admin(client):
    UserFactory(id='u1', email='notadmin@gmail.com').create()

    set_session(client, 'u1')

    resp = client.get('/@all_email')
    assert resp.status_code == 403
    assert resp.get_json()['error'] == 'Access denied!'


def test_register_conflict_when_email_exists(client):
    UserFactory(email='x@y.com').create()

    resp = client.post(
        '/register',
        json={
            'email': 'x@y.com',
            'password': 'pw',
            'firstName': 'A',
            'lastName': 'B',
            'degree': 'CS',
        },
    )

    assert resp.status_code == 409
    assert resp.get_json()['error'] == 'Email is already used'


def test_login_unauthorized_when_user_missing(client):
    resp = client.post('/login', json={'email': 'nonexistant_user@nowhere.com', 'password': 'pw'})
    assert resp.status_code == 401


def test_add_answer_invalid_json(client):
    resp = client.post('/add_answer', json={'rectId': 1})
    assert resp.status_code == 400
    assert resp.get_json()['error'] == 'Invalid JSON data'


def test_add_answer_unauthorized(client):
    resp = client.post('/add_answer', json={'rectId': 1, 'answer': 'hi'})
    assert resp.status_code == 401


def test_logout_clears_session(client):
    set_session(client, 'u1')
    resp = client.post('/logout')
    assert resp.data.decode('utf-8') == '200'

    with client.session_transaction() as sess:
        assert sess.get('user_id') is None


def test_analyze_input_with_assignments(client, monkeypatch):
    import api
    from factories import UserFactory, AssignmentFactory

    assignment = AssignmentFactory(
        subject='Math',
        difficulty='hard',
        answer='done',
        grade=5,
        comment='Nice job'
    ).create()
    UserFactory(id='u1', email='a@b.com', assignments=[assignment]).create()
    set_session(client, 'u1')

    fake_completion_calls = []
    def fake_create(**kwargs):
        fake_completion_calls.append(kwargs)
        if "Extract the main topic" in kwargs.get("messages", [{}])[0].get("content", ""):
            return {"choices": [{"text": "Math topic"}]}
        else:
            return {"choices": [{"text": "This is a great study answer."}]}
    monkeypatch.setattr(api.openai.Completion, "create", fake_create)

    def fake_get(url, headers=None, params=None):
        mock_resp = api.requests.Response()
        mock_resp.status_code = 200
        mock_resp._content = b'{"webPages": {"value": [{"url": "http://mock-url.com"}]}}'
        return mock_resp
    monkeypatch.setattr(api.requests, "get", fake_get)

    resp = client.post(
        '/analyze_input',
        json={
            'message': 'Hello, help me with Math please!'
        }
    )

    assert resp.status_code == 200
    data = resp.get_json()
    assert data['answer'] == "This is a great study answer."
    assert data['material'] == ["http://mock-url.com"]

    assert len(fake_completion_calls) > 0
    chat_prompt = fake_completion_calls[0]["messages"][0]["content"]
    assert "Student's Schedule and Progress Context:" in chat_prompt
    assert "Subject: Math" in chat_prompt
    assert "Grade: 5/5" in chat_prompt

