from datetime import datetime

import mongoengine as db
from mongoengine import connect, disconnect, ListField, ReferenceField
from uuid import uuid4

def get_uuid():
    return uuid4().hex

def init_mongo(app):
    connect(**app.config["MONGODB_SETTINGS"])

def close_mongo(app):
    disconnect(app.config["MONGODB_SETTINGS"]['db'])


class Assignment(db.Document):
    id = db.StringField(primary_key=True, default=get_uuid)
    subject = db.StringField(max_length=50, required=True)
    difficulty = db.StringField(max_length=30, required=True)
    text = db.StringField(max_length=400, required=True)
    url = db.StringField(max_length=100)
    assigned_date = db.DateTimeField(default=datetime.now)
    rect = db.IntField()
    answer = db.StringField(max_length=400)
    comment = db.StringField(max_length=400)
    grade = db.IntField(min_value=1, max_value=5)


class User(db.Document):
    id = db.StringField(primary_key=True, default=get_uuid)
    email = db.EmailField(max_length=345, unique=True)
    password = db.StringField(required=True)
    name = db.StringField(max_length=50, required=True)
    surname = db.StringField(max_length=50, required=True)
    degree = db.StringField(max_length=30, required=True)
    assignments = ListField(ReferenceField(Assignment))
