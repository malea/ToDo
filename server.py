import random
import json
import peewee
import requests
from flask import Flask, abort, make_response, request

app = Flask(__name__)
    
#next_tid = 4
#tasks = [
#    {
#        'id': 1, 
#        'userid': '118352708147713112407',
#        'text': u'Make a todo app',
#        'done': False
#    },
#    {
#        'id': 2,
#        'userid': '118352708147713112407',
#        'text': u'Buy groceries',
#        'done': False
#    },
#    {
#        'id': 3, 
#        'userid': '111111111111111',
#        'text': u'Add account functionality',
#        'done': False
#    }
#]

db = SqliteDatabase('tasks.db')

class Task(Model):
   tid = IntField()
   userid = TextField()
   text = TextField()
   done = BooleanField()

    class Meta:
        database = db

@app.route('/')
def index():
    return make_response(open('index.html').read())

def getGoogleID():
    google_idtoken = request.headers.get('Google-Id-Token')
    google_response = requests.get('https://www.googleapis.com/oauth2/v1/tokeninfo',
            params={'id_token': google_idtoken})
    if google_response.status_code != 200:
        abort(401)
    parsed_token = google_response.json()
    return parsed_token['user_id']

@app.route('/api/tasks', methods=['GET', 'POST'])
@app.route('/api/tasks/<taskid>', methods=['GET', 'PUT', 'DELETE'])
def taskAPI(taskid=None):
    if taskid is None and request.method == 'GET':
        return listTasks()
    elif request.method == 'GET':
        return getTask(taskid)
    elif request.method == 'POST':
        return createTask()
    elif request.method == 'PUT':
        return updateTask(taskid)
    elif request.method == 'DELETE':
        return deleteTask(taskid)

def listTasks():
    google_id = getGoogleID()
    query = Task.select().where(Task.userid == google_id)
    return json.dumps(query)

def getTask(taskid):
    """get a specific task (in json)"""
    google_id = getGoogleID()
    query = Task.get(Task.tid == taskid and Task.userid == google_id)
    if query == []:
        abort(404)
    return query

#need help on this one
def createTask():
    """add a new task"""
    google_id = getGoogleID()
    # get task from request
    task = request.get_json()

    if task['userid'] != google_id:
        abort(403) # forbidden

    # give it a new id
    global next_tid
    new_id = next_tid
    next_tid += 1
    task['id'] = new_id

    # add to our list
    tasks.append(task)

    # tell client it worked (200 OK)
    return make_response('{}', 200)

def updateTask(taskid):
    """update existing task"""
    google_id = getGoogleID()
    found = False
    for task in tasks:
        if int(task['id']) == int(taskid):
            if task['userid'] != google_id:
                abort(403) # forbidden
            task.update(request.get_json())
            found = True
    if not found:
        abort(404)
    else:
        return make_response('{}', 200)

def deleteTask(taskid):
    """delete existing task"""
    google_id = getGoogleID()
    task_tmp = None
    for task in tasks:
        if int(task['id']) == int(taskid):
            task_tmp = task
    if task_tmp is None:
        abort(404)
    else:
        if task_tmp['userid'] != google_id:
            abort(403) # forbidden
        tasks.remove(task_tmp)
        return make_response('{}', 204)

if __name__ == '__main__':
    db.create_tables([Task])
    app.run(debug=True)
