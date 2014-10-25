(function() {
    var app = angular.module('ToDo', []);

    app.controller('SigninController', ['$window', '$rootScope', '$http',
                   function($window, $rootScope, $http) {

        var signinCtrl = this;
        signinCtrl.loginCheck = false;
        signinCtrl.loggedIn = false;
        signinCtrl.hasToken = false;

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
                        signinCtrl.hasToken = true;

                        // sorry :-(
                        $rootScope.hacketyhack.refreshTodos();
                     })
                     .error(function() {
                         alert('Error getting login info from Google.');
                     });
            }
            else {
                var error = authResult['error'];
                signinCtrl.loggedIn = false;
                if (error === 'user_signed_out') {
                    // user is signed out
                }
                else if (error === 'access_denied') {
                    // used revoked access to our todo app
                }
                else if (error === 'immediate_failed') {
                    // could not automatically login the user
                }
            }
            $rootScope.$apply();
        };
    }]);
    app.controller('TodoController', ['$http', '$rootScope',
                   function($http, $rootScope) {
        var todoCtrl = this;
        todoCtrl.search = {done: false};
        todoCtrl.todos = [];

        todoCtrl.refreshTodos = function() {
            $http.get('/api/tasks', {headers: {
                'Google-Id-Token': $rootScope.fullToken
            }}).success(function(tasks) {
                todoCtrl.todos = tasks;
            })
            .error(function() {
                alert('Uh oh -- /api/tasks broke.');
            });
        };

        // sorry :-(
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

        todoCtrl.addTodo = function() {
            // POST /api/tasks
            $http.post('/api/tasks',
                {
                    text: todoCtrl.todoText,
                    done: false,
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
