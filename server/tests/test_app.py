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
