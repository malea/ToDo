ToDo
====

## Demo

There is a demo running at <https://maleastodos.herokuapp.com>.

## Run 

Clone the repository, and navigate to the repo directory.
Run these commands to get dependencies:

    virtualenv venv
    venv/bin/pip install -r requirements.txt

To start the server, run:

    venv/bin/python server.py

Now the dev server should be running on http://localhost:5000

## Design Overview

Functionality: 

-   User signs in through their Google account
-   User can add todo
-   User can edit todo
-   User can archive todo
-   User can delete archived todos

For the frontend, I used [AngularJS](https://angularjs.org/), because
I had heard it was cool, and the two-way data binding between the 
model and the view appealed to me. This was my first project using
javascript, and while I made mistakes, I think AngularJS helped me
get things working quickly.

For styling, I used Bootstrap, mainly to save time.

For the backend, I used Flask with the [peewee](https://github.com/coleifer/peewee)
ORM. This was my first time using an ORM, and I loved it! I used SQLite for
development, and postgres for deployment to heroku.

 



