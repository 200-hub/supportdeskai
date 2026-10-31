import pytest


@pytest.fixture
def auth_user(db_client):
    db_client.post(
        "/api/v1/auth/register",
        json={
            "email": "agent.test@company.com",
            "name": "Test Agent",
            "password": "Password123!",
            "role": "agent",
            "tenant_slug": "kb-test-tenant",
        },
    )
    login_resp = db_client.post(
        "/api/v1/auth/login",
        json={"email": "agent.test@company.com", "password": "Password123!", "tenant_slug": "kb-test-tenant"},
    )
    return login_resp.json()["access_token"]


def test_knowledge_topics(db_client):
    res = db_client.get("/api/v1/knowledge/topics")
    assert res.status_code == 200
    topics = res.json()
    assert len(topics) >= 4
    assert any(t["title"] == "API & Webhooks" for t in topics)


def test_knowledge_articles_and_search(db_client, auth_user):
    headers = {"Authorization": f"Bearer {auth_user}"}

    # 1. Fetch articles
    res = db_client.get("/api/v1/knowledge/articles", headers=headers)
    assert res.status_code == 200
    articles = res.json()
    assert len(articles) >= 4

    # 2. Search for 'Webhook'
    search_res = db_client.get("/api/v1/knowledge/articles?search=Webhook", headers=headers)
    assert search_res.status_code == 200
    search_data = search_res.json()
    assert len(search_data) >= 1
    assert "Webhook" in search_data[0]["title"]

    # 3. View single article and vote
    art_id = search_data[0]["id"]
    get_res = db_client.get(f"/api/v1/knowledge/articles/{art_id}", headers=headers)
    assert get_res.status_code == 200
    initial_reads = get_res.json()["reads_count"]

    vote_res = db_client.post(f"/api/v1/knowledge/articles/{art_id}/vote", json={"helpful": True}, headers=headers)
    assert vote_res.status_code == 200
    assert vote_res.json()["helpful_yes"] >= 1


def test_ai_chat_and_copilot(db_client, auth_user):
    headers = {"Authorization": f"Bearer {auth_user}"}

    # AI Chat query
    chat_res = db_client.post(
        "/api/v1/ai/chat",
        json={"query": "How do I verify webhook signatures?", "conversation_id": "test-c1"},
        headers=headers,
    )
    assert chat_res.status_code == 200
    chat_data = chat_res.json()
    assert "response" in chat_data
    assert len(chat_data["response"]) > 10
    assert chat_data["conversation_id"] == "test-c1"
    assert "provider" in chat_data

    # AI Copilot query
    copilot_res = db_client.post(
        "/api/v1/ai/copilot",
        json={"ticket_id": "SD-1042", "customer_query": "Need help with SAML SSO setup."},
        headers=headers,
    )
    assert copilot_res.status_code == 200
    copilot_data = copilot_res.json()
    assert "suggested_reply" in copilot_data
    assert "suggested_action" in copilot_data


def test_analytics_metrics(db_client, auth_user):
    headers = {"Authorization": f"Bearer {auth_user}"}

    res = db_client.get("/api/v1/analytics/metrics", headers=headers)
    assert res.status_code == 200
    metrics = res.json()
    assert "avgFirstResponseTime" in metrics
    assert "slaComplianceRate" in metrics
    assert "avgResolutionTime" in metrics
    assert "csatScore" in metrics
    assert "channelBreakdown" in metrics
    assert len(metrics["channelBreakdown"]) > 0

