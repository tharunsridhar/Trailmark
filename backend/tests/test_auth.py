NEW_USER = {"email": "asha@example.com", "name": "Asha", "password": "correct-horse"}


def test_register_signs_user_in(client):
    response = client.post("/auth/register", json=NEW_USER)
    assert response.status_code == 201
    assert response.json()["email"] == "asha@example.com"
    assert "password" not in response.json()

    me = client.get("/auth/me")
    assert me.status_code == 200
    assert me.json()["name"] == "Asha"


def test_register_rejects_duplicate_email(client):
    client.post("/auth/register", json=NEW_USER)
    again = client.post("/auth/register", json={**NEW_USER, "email": "ASHA@example.com"})
    assert again.status_code == 409


def test_register_rejects_short_password(client):
    response = client.post("/auth/register", json={**NEW_USER, "password": "short"})
    assert response.status_code == 422


def test_login_and_logout(client):
    client.post("/auth/register", json=NEW_USER)
    client.post("/auth/logout")
    assert client.get("/auth/me").status_code == 401

    login = client.post("/auth/login", json={"email": NEW_USER["email"], "password": NEW_USER["password"]})
    assert login.status_code == 200
    assert client.get("/auth/me").status_code == 200


def test_login_wrong_password(client):
    client.post("/auth/register", json=NEW_USER)
    client.post("/auth/logout")
    response = client.post("/auth/login", json={"email": NEW_USER["email"], "password": "wrong-password"})
    assert response.status_code == 401


def test_login_unknown_email(client):
    response = client.post("/auth/login", json={"email": "nobody@example.com", "password": "whatever123"})
    assert response.status_code == 401


def test_me_without_cookie_is_401(client):
    assert client.get("/auth/me").status_code == 401


def test_me_with_garbage_token_is_401(client):
    client.cookies.set("access_token", "not-a-real-token")
    assert client.get("/auth/me").status_code == 401
