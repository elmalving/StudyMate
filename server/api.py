import requests
import json
import openai


class SearchAssistant:
    bing_endpoint = "https://api.bing.microsoft.com/v7.0/search"

    def __init__(self, bing_api_key):
        self.bing_api_key = bing_api_key
        self.urls_json = None

    def search(self, query):
        mkt = 'en-US'
        params = {'q': query, 'mkt': mkt}
        headers = {'Ocp-Apim-Subscription-Key': self.bing_api_key}

        try:
            response = requests.get(self.bing_endpoint, headers=headers, params=params)
            response.raise_for_status()
            json_data = response.json()
            results_prompts = [f"{result['url']}" for result in json_data["webPages"]["value"]]

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
        self.openai_api_key = openai_api_key
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

        openai.api_key = self.openai_api_key
        response = openai.Completion.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_instruction},
                {"role": "user", "content": f"Create a test about {topic}."}
            ],
            max_tokens=1024,
            n=1,
            stop=None,
            temperature=0.7,
        )
        answer = response["choices"][0]["text"].strip()
        return answer

    def extract_topic(self, question):
        extract_prompt = "Extract the main topic of the question, to find the answer by myself.\n"
        prompt = f"{extract_prompt}\n\n{question}?"

        openai.api_key = self.openai_api_key
        response = openai.Completion.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "user", "content": prompt}
            ],
            max_tokens=1024,
            n=1,
            stop=None,
            temperature=0.7,
        )
        answer = response["choices"][0]["text"].strip()
        return answer

    def answer_question(self, question, schedule_and_progress_context=None):
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

        prompt = f"{assistant_prompt}\n\n{question}?"

        openai.api_key = self.openai_api_key
        response = openai.Completion.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "user", "content": prompt}
            ],
            max_tokens=1024,
            n=1,
            stop=None,
            temperature=0.7,
        )

        answer = response["choices"][0]["text"].strip()

        if "I'm sorry" in answer:
            self.current_answer = "Bot was unable to provide a satisfactory answer."
            return

        self.current_answer = answer
