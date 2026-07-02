import requests
import json
import openai
from ddgs import DDGS


class SearchAssistant:
    def __init__(self):
        self.urls_json = None

    def search(self, query):
        try:
            with DDGS() as ddgs:
                results = list(ddgs.text(query, max_results=5))
            results_prompts = [result['href'] for result in results if 'href' in result]

            self.urls_to_json(results_prompts)

            return self.urls_json

        except Exception as ex:
            raise ex

    def urls_to_json(self, urls):
        url_data = {"urls": urls}
        self.urls_json = json.dumps(url_data, indent=4)
        return self.urls_json


class AIAssistant:
    def __init__(self, openai_api_key):
        self.client = openai.OpenAI(api_key=openai_api_key)
        self.current_answer = None

    def create_test_json(self, topic):
        system_instruction = (
            "You are a helpful study assistant. Create a theory test of 5 questions on the requested topic. "
            "The questions should not be repeated. Some questions should have several answers. "
            "You must respond ONLY with a valid JSON object matching this exact format:\n\n"
            "{\n"
            '  "questions": [\n'
            "    {\n"
            '      "question": "1. question?",\n'
            '      "options": [\n'
            '        "a) answer1",\n'
            '        "b) answer2",\n'
            '        "c) answer3",\n'
            '        "d) answer4"\n'
            "      ],\n"
            '      "correct_answers": ["correct answer"]\n'
            "    }, ...\n"
            "  ]\n"
            "}"
        )

        response = self.client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_instruction},
                {"role": "user", "content": f"Create a test about {topic}."}
            ],
            max_tokens=1024,
            temperature=0.7,
        )
        answer = response.choices[0].message.content.strip()
        return answer

    def extract_topic(self, question):
        system_instruction = (
            "You are a search query extractor. Analyze the user's input. "
            "If the input is a specific question or study topic that would benefit from a web search for educational resources (e.g., 'Newton's laws', 'how does photosynthesis work', 'calculus derivatives'), extract and return ONLY a concise search query (1-4 keywords) optimized for DuckDuckGo. "
            "If the input is too general, a greeting, casual conversation, off-topic, or doesn't make sense to search on the web (e.g., 'hi', 'thank you', 'ok', 'can you help me', 'what is my schedule'), respond with exactly 'NONE'."
        )

        response = self.client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_instruction},
                {"role": "user", "content": question}
            ],
            max_tokens=50,
            temperature=0.3,
        )
        answer = response.choices[0].message.content.strip()
        answer = answer.strip('\'"` ')
        return answer

    def answer_question(self, question, history=None, schedule_and_progress_context=None):
        assistant_prompt = (
            "You are StudyMate AI, an expert, encouraging, and highly professional study assistant and tutor. "
            "Your goal is to help students learn conveniently and efficiently.\n\n"
            "Strict Guidelines:\n"
            "1. Switch to study assistant mode and don't participate in non-study related conversations. "
            "If the question is not related to studies, politely redirect the student to focus on their course material.\n"
            "2. Answer as accurately, clearly, and helpful as possible. Use simple, structured explanations suitable for a student.\n"
            "3. If you can't answer, type I dont know answer on this question, I'm sorry."
        )

        if schedule_and_progress_context:
            assistant_prompt += (
                f"\n\nStudent's Schedule and Progress Context:\n{schedule_and_progress_context}\n"
                "4. Personalize your assistance and responses based on the student's schedule and progress context above. "
                "Acknowledge their active subjects, difficulty levels, and current progress (such as completed assignments or grades) "
                "where relevant, offering targeted study tips or positive reinforcement."
            )

        messages = [
            {"role": "system", "content": assistant_prompt}
        ]

        if history:
            for msg in history:
                role = "user" if msg.get("sender") == "user" else "assistant"
                messages.append({"role": role, "content": msg.get("text", "")})

        messages.append({"role": "user", "content": question})

        response = self.client.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages,
            max_tokens=1024,
            temperature=0.7,
        )

        answer = response.choices[0].message.content.strip()

        if "I'm sorry" in answer:
            self.current_answer = "Bot was unable to provide a satisfactory answer."
            return

        self.current_answer = answer

    def answer_question_stream(self, question, history=None, schedule_and_progress_context=None):
        assistant_prompt = (
            "You are StudyMate AI, an expert, encouraging, and highly professional study assistant and tutor. "
            "Your goal is to help students learn conveniently and efficiently.\n\n"
            "Strict Guidelines:\n"
            "1. Switch to study assistant mode and don't participate in non-study related conversations. "
            "If the question is not related to studies, politely redirect the student to focus on their course material.\n"
            "2. Answer as accurately, clearly, and helpful as possible. Use simple, structured explanations suitable for a student.\n"
            "3. If you can't answer, type I dont know answer on this question, I'm sorry."
        )

        if schedule_and_progress_context:
            assistant_prompt += (
                f"\n\nStudent's Schedule and Progress Context:\n{schedule_and_progress_context}\n"
                "4. Personalize your assistance and responses based on the student's schedule and progress context above. "
                "Acknowledge their active subjects, difficulty levels, and current progress (such as completed assignments or grades) "
                "where relevant, offering targeted study tips or positive reinforcement."
            )

        messages = [
            {"role": "system", "content": assistant_prompt}
        ]

        if history:
            for msg in history:
                role = "user" if msg.get("sender") == "user" else "assistant"
                messages.append({"role": role, "content": msg.get("text", "")})

        messages.append({"role": "user", "content": question})

        response = self.client.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages,
            max_tokens=1024,
            temperature=0.7,
            stream=True,
        )

        buffer = ""
        is_sorry = False

        for chunk in response:
            if chunk.choices and len(chunk.choices) > 0 and chunk.choices[0].delta.content:
                content = chunk.choices[0].delta.content
                if not is_sorry:
                    if len(buffer) < 50:
                        buffer += content
                        if len(buffer) >= 50:
                            if "I'm sorry" in buffer:
                                yield "Bot was unable to provide a satisfactory answer."
                                is_sorry = True
                            else:
                                yield buffer
                                buffer = ""
                    else:
                        yield content

        if not is_sorry and buffer:
            if "I'm sorry" in buffer:
                yield "Bot was unable to provide a satisfactory answer."
            else:
                yield buffer
