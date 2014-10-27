(function() {
    var app = angular.module('ToDo', []);

    app.controller('SigninController', ['$window', '$rootScope', '$http',
                   function($window, $rootScope, $http) {

        var signinCtrl = this;

        // flag that is set true only after login attempted.
        // It takes some time for google's api to check whether
        // user is logged in already. Originally, the google
        // callback just set loggedIn to true, but that caused a
        // flicker where sign in dialog was displayed for a few
        // seconds until google callback fired. To fix this, the
        // layout doesnt show anything until loginCheck is true.
        // Needs better flow.
        signinCtrl.loginCheck = false;

        // simple flag to tell whether user is logged in or not
        signinCtrl.loggedIn = false;
       
        // put this callback on window, because give it as a callback
        // to google sign in button, and it doesn't know angular's
        // scope.  
        $window.globalGoogleSigninCallback = function(authResult) {
            signinCtrl.loginCheck = true;
            if (authResult['status']['signed_in']) {
                // sign in succeeded
                signinCtrl.loggedIn = true;
                var idToken = authResult['id_token'];
                $rootScope.fullToken = idToken;
                $http.get('https://www.googleapis.com/oauth2/v1/tokeninfo',
                    {params: {id_token: idToken}})
                     .success(function(token) {
                        $rootScope.idToken = token;

                        // it is used elsewhere when changes to todos are
                        // made, but after a user logs in, I needed a way
                        // to initially populate the todo list. I can't do
                        // this until I have the user's log in token, so this
                        // is the first possible place to populate todos. 
                        // needs refactoring... I added log in functionality
                        // after getting the basic functionality working.
                        $rootScope.hacketyhack.refreshTodos();
                     })
                     .error(function() {
                         alert('Error getting login info from Google.');
                     });
            }
            else {
                // user sign in fails
                var error = authResult['error'];
                signinCtrl.loggedIn = false;
            }
            // required to make angular update everything
            $rootScope.$apply();
        };
    }]);
    app.controller('TodoController', ['$http', '$rootScope',
                   function($http, $rootScope) {
        var todoCtrl = this;
        todoCtrl.search = {done: false};
        todoCtrl.todos = [];
        
        todoCtrl.refreshTodos = function() {
            // Server needs token for user authentication (it makes
            // request to google to verify that this user is who they
            // say there are / a real google user.) In order to be RESTful,
            // each request needs to contain all authentication info (for
            // statelessness). But, I did not want to put this as a get param,
            // because it would show up in the url, and that would be insecure.
            $http.get('/api/tasks', {headers: {
                'Google-Id-Token': $rootScope.fullToken
            }}).success(function(tasks) {
                todoCtrl.todos = tasks;
            })
            .error(function() {
                alert('Uh oh -- /api/tasks broke.');
            });
        };

        // This corresponds to the hack above, which allows the 
        // initial population of tasks following sign in. 
        // In order for this function to be visible outside of the
        // todocontroller scope, I had to dump it on the root scope.
        // Bad Malea. 
        $rootScope.hacketyhack = {}
        $rootScope.hacketyhack.refreshTodos = todoCtrl.refreshTodos;

        todoCtrl.updateTask = function(task) {
            // PUT /api/tasks/:id
            $http.put('/api/tasks/'+task.id, task, {
                headers: { 
                    'Google-Id-Token': $rootScope.fullToken
                }
            })
        }

        todoCtrl.check = function(task) {
            // As explained in html, here is where I set this timeout to
            // make the todos not disappear as fast when marked as done.
            setTimeout(function() {
                task.done = !task.done;
                todoCtrl.updateTask(task);
            }, 500);
        }
        
        todoCtrl.addTodo = function() {
            // POST /api/tasks
            $http.post('/api/tasks',
                {
                    text: todoCtrl.todoText,
                    done: false,
                    // grab this from the global google sign in callback 
                    userid: $rootScope.idToken.user_id
                },
                {
                    headers: {
                        'Google-Id-Token': $rootScope.fullToken
                    }
                })


            todoCtrl.todoText = '';
            // now refresh to get the new ID for the task
            // from server
            todoCtrl.refreshTodos();
        };
        
        todoCtrl.deleteArchiveAll = function() {
            for (var i = todoCtrl.todos.length - 1; i >= 0; i--) {
                var task = todoCtrl.todos[i];
                if (todoCtrl.todos[i].done) {
                    todoCtrl.todos.splice(i,1);
                    // DELETE /api/tasks/:id
                    $http.delete('/api/tasks/'+task.id, {
                        headers: {
                            'Google-Id-Token': $rootScope.fullToken
                        }
                    })
                }
            }
        }; 

        todoCtrl.getRemainingCount = function() {
            var remaining = 0;
            todoCtrl.todos.forEach( function(todo) {
                if (!todo.done) {
                    remaining++;
                }
            });
            return remaining;
        };
        
        todoCtrl.markAllDone = function() {
            todoCtrl.todos.forEach( function(todo) {
               todo.done = true;
               // also on server
               todoCtrl.updateTask(todo);
            });
        }; 
    }]);
})();
