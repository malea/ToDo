import random
import json
import os
import sys
import peewee as pw
import requests
from flask import Flask, abort, make_response, request
from playhouse import db_url

app = Flask(__name__)

if not os.environ.get('NO_DEBUG'):
    app.config['DEBUG'] = True

# Use tasks.db if DATABASE_URL isn't set
# (postgres on heroku sets this automatically)
db = db_url.connect(os.environ.get('DATABASE_URL', 'sqlite:///tasks.db'))

class Task(pw.Model):
   # tid = pw.IntegerField()
   userid = pw.TextField()
   text = pw.TextField()
   done = pw.BooleanField()

   class Meta:
       database = db

if not Task.table_exists():
    Task.create_table()

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
    results = list(query.dicts())
    return json.dumps(results)

def getTask(taskid):
    """get a specific task (in json)"""
    google_id = getGoogleID()
    query = Task.get(Task.id == taskid and Task.userid == google_id)
    if query == []:
        abort(404)
    return query

def createTask():
    """add a new task"""
    google_id = getGoogleID()
    # get task from request
    task = request.get_json()

    if task['userid'] != google_id:
        abort(403) # forbidden
    
    # add to database 
    new_task = Task.create(userid=google_id, text=task['text'],
                           done=False)

    # tell client it worked (200 OK)
    return make_response('{}', 200)

def updateTask(taskid):
    """update existing task"""
    google_id = getGoogleID()
    to_update = Task.get(Task.id == taskid)
    if to_update == []:
        abort(404) # not found
    elif to_update.userid != google_id:
        abort(403) # forbidden
    else:
        to_update.done = request.get_json()['done']
        to_update.text = request.get_json()['text']
        to_update.save()
        return make_response('{}', 200)

def deleteTask(taskid):
    """delete existing task"""
    google_id = getGoogleID()
    to_delete = Task.get(Task.id == taskid)
    if to_delete == []:
        abort(404) # not found
    elif to_delete.userid != google_id:
        abort(403) # forbidden
    else:
        to_delete.delete_instance()
        return make_response('{}', 204)

if __name__ == '__main__':
    app.run(debug=True)
