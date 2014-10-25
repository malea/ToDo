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
                $http.get('https://www.googleapis.com/oauth2/v1/tokeninfo',
                    {params: {id_token: idToken}})
                     .success(function(token) {
                        $rootScope.idToken = token;
                        signinCtrl.hasToken = true;
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
    app.controller('TodoController', ['$rootScope', function($rootScope) {
        var todoCtrl = this;
        todoCtrl.todos = [];
        todoCtrl.search = {done: false};

        todoCtrl.addTodo = function() {
            todoCtrl.todos.push({ text: todoCtrl.todoText,
                done: false,
                userid: $rootScope.idToken.user_id });
            todoCtrl.todoText = '';
        };
        
        todoCtrl.deleteArchiveAll = function() {
            for (var i = todoCtrl.todos.length - 1; i >= 0; i--) {
                if (todoCtrl.todos[i].done) {
                    todoCtrl.todos.splice(i,1);
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
            });
        }; 
    }]);
})();
