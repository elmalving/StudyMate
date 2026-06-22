import json
from unittest.mock import MagicMock
import pytest

import api

def test_searchassistant_urls_to_json():
    sa = api.SearchAssistant(bing_api_key="x")
    out = sa.urls_to_json(["https://a.com", "https://b.com"])
    parsed = json.loads(out)
    assert parsed["urls"] == ["https://a.com", "https://b.com"]


def test_searchassistant_search_success(monkeypatch):
    sa = api.SearchAssistant(bing_api_key="x")

    fake_response = MagicMock()
    fake_response.raise_for_status.return_value = None
    fake_response.json.return_value = {
        "webPages": {
            "value": [{"url": "https://example.com/1"}, {"url": "https://example.com/2"}]
        }
    }

    def fake_get(url, headers=None, params=None):
        assert "Ocp-Apim-Subscription-Key" in headers
        assert params["q"] == "hello"
        return fake_response

    monkeypatch.setattr(api.requests, "get", fake_get)

    out = sa.search("hello")
    parsed = json.loads(out)
    assert parsed["urls"] == ["https://example.com/1", "https://example.com/2"]


def test_searchassistant_search_raises(monkeypatch):
    sa = api.SearchAssistant(bing_api_key="x")

    def fake_get(*args, **kwargs):
        raise RuntimeError("network down")

    monkeypatch.setattr(api.requests, "get", fake_get)

    with pytest.raises(RuntimeError):
        sa.search("hello")


def test_aiassistant_create_test_json(monkeypatch):
    ai = api.AIAssistant(openai_api_key="k")

    fake = {"choices": [{"text": " {\"questions\": [] } "}]}

    def fake_create(**kwargs):
        assert kwargs["model"] == "gpt-4o-mini"
        assert kwargs["max_tokens"] == 1024
        return fake

    monkeypatch.setattr(api.openai.Completion, "create", fake_create)

    out = ai.create_test_json("math")
    assert out.strip() == "{\"questions\": [] }"


def test_aiassistant_answer_question_sets_current_answer(monkeypatch):
    ai = api.AIAssistant(openai_api_key="k")

    fake = {"choices": [{"text": "The answer is 42"}]}

    def fake_create(**kwargs):
        return fake

    monkeypatch.setattr(api.openai.Completion, "create", fake_create)

    ai.answer_question("What is life")
    assert ai.current_answer == "The answer is 42"


def test_aiassistant_answer_question_handles_sorry(monkeypatch):
    ai = api.AIAssistant(openai_api_key="k")

    fake = {"choices": [{"text": "I'm sorry, I dont know."}]}

    def fake_create(**kwargs):
        return fake

    monkeypatch.setattr(api.openai.Completion, "create", fake_create)

    ai.answer_question("Hard question")
    assert ai.current_answer == "Bot was unable to provide a satisfactory answer."
