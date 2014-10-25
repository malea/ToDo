import random
from flask import Flask, make_response

app = Flask(__name__)
    
tasks = [
    {
        'id': 1, 
        'userid': 1,
        'content': u'Make a todo app',
        'done': False
    },
    {
        'id': 2,
        'userid': 1,
        'content': u'Buy groceries',
        'done': False
    },
    {
        'id': 3, 
        'userid': 2,
        'content': u'Add account functionality',
        'done': False
    }
]

@app.route('/')
def index():
    return make_response(open('index.html').read())

if __name__ == '__main__':
    app.run()
