from documents import User, Assignment

class UserFactory:
    def __init__(self, id='u1', email='a@b.com', password='x', name='Alice', surname='S', degree='CS', assignments=[]):
        self.data = {
            'id': id,
            'email': email,
            'password': password,
            'name': name,
            'surname': surname,
            'degree': degree,
            'assignments': assignments,
        }

    def build(self):
        return User(**self.data)

    def create(self):
        user = self.build()
        user.save()

        return user


class AssignmentFactory:
    def __init__(self, id='a1', subject='Math', difficulty='Easy', text='Task', url='http://t',
                 assigned_date='2020-01-01', rect=1, answer=None, comment=None, grade=None):
        self.data = {   
            'id': id,
            'subject': subject,
            'difficulty': difficulty,
            'text': text,
            'url': url,
            'assigned_date': assigned_date,
            'rect': rect,
            'answer': answer,
            'comment': comment,
            'grade': grade,
        }

    def build(self):
        return Assignment(**self.data)

    def create(self):
        assignment = self.build()
        assignment.save()

        return assignment
