import json
from unittest.mock import MagicMock
import pytest

import api

def test_searchassistant_urls_to_json():
    sa = api.SearchAssistant()
    out = sa.urls_to_json(["https://a.com", "https://b.com"])
    parsed = json.loads(out)
    assert parsed["urls"] == ["https://a.com", "https://b.com"]


def test_searchassistant_search_success(monkeypatch):
    sa = api.SearchAssistant()

    class FakeDDGS:
        def __enter__(self):
            return self
        def __exit__(self, exc_type, exc_val, exc_tb):
            pass
        def text(self, query, max_results=5):
            assert query == "hello"
            return [{"href": "https://example.com/1"}, {"href": "https://example.com/2"}]

    monkeypatch.setattr(api, "DDGS", FakeDDGS)

    out = sa.search("hello")
    parsed = json.loads(out)
    assert parsed["urls"] == ["https://example.com/1", "https://example.com/2"]


def test_searchassistant_search_raises(monkeypatch):
    sa = api.SearchAssistant()

    class FakeDDGS:
        def __enter__(self):
            return self
        def __exit__(self, exc_type, exc_val, exc_tb):
            pass
        def text(self, query, max_results=5):
            raise RuntimeError("network down")

    monkeypatch.setattr(api, "DDGS", FakeDDGS)

    with pytest.raises(RuntimeError):
        sa.search("hello")


def test_aiassistant_create_test_json(monkeypatch):
    class FakeChatCompletions:
        def create(self, **kwargs):
            assert kwargs["model"] == "gpt-4o-mini"
            assert kwargs["max_tokens"] == 1024
            
            mock_message = MagicMock()
            mock_message.content = " {\"questions\": [] } "
            mock_choice = MagicMock()
            mock_choice.message = mock_message
            mock_response = MagicMock()
            mock_response.choices = [mock_choice]
            return mock_response

    class FakeClient:
        def __init__(self, api_key):
            self.chat = MagicMock()
            self.chat.completions = FakeChatCompletions()

    monkeypatch.setattr(api.openai, "OpenAI", FakeClient)

    ai = api.AIAssistant(openai_api_key="k")
    out = ai.create_test_json("math")
    assert out.strip() == "{\"questions\": [] }"


def test_aiassistant_answer_question_sets_current_answer(monkeypatch):
    class FakeChatCompletions:
        def create(self, **kwargs):
            mock_message = MagicMock()
            mock_message.content = "The answer is 42"
            mock_choice = MagicMock()
            mock_choice.message = mock_message
            mock_response = MagicMock()
            mock_response.choices = [mock_choice]
            return mock_response

    class FakeClient:
        def __init__(self, api_key):
            self.chat = MagicMock()
            self.chat.completions = FakeChatCompletions()

    monkeypatch.setattr(api.openai, "OpenAI", FakeClient)

    def mock_answer_question(self, question, history=None, schedule_and_progress_context=None):
        response = self.client.chat.completions.create()
        content = response.choices[0].message.content
        if "I'm sorry" in content:
            self.current_answer = "Bot was unable to provide a satisfactory answer."
        else:
            self.current_answer = content
        return self.current_answer

    monkeypatch.setattr(api.AIAssistant, "answer_question", mock_answer_question)

    ai = api.AIAssistant(openai_api_key="k")
    ai.answer_question("What is life")
    assert ai.current_answer == "The answer is 42"


def test_aiassistant_answer_question_handles_sorry(monkeypatch):
    class FakeChatCompletions:
        def create(self, **kwargs):
            mock_message = MagicMock()
            mock_message.content = "I'm sorry, I dont know."
            mock_choice = MagicMock()
            mock_choice.message = mock_message
            mock_response = MagicMock()
            mock_response.choices = [mock_choice]
            return mock_response

    class FakeClient:
        def __init__(self, api_key):
            self.chat = MagicMock()
            self.chat.completions = FakeChatCompletions()

    monkeypatch.setattr(api.openai, "OpenAI", FakeClient)

    def mock_answer_question(self, question, history=None, schedule_and_progress_context=None):
        response = self.client.chat.completions.create()
        content = response.choices[0].message.content
        if "I'm sorry" in content:
            self.current_answer = "Bot was unable to provide a satisfactory answer."
        else:
            self.current_answer = content
        return self.current_answer

    monkeypatch.setattr(api.AIAssistant, "answer_question", mock_answer_question)

    ai = api.AIAssistant(openai_api_key="k")
    ai.answer_question("Hard question")
    assert ai.current_answer == "Bot was unable to provide a satisfactory answer."
