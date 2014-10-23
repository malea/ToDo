(function() {
    var app = angular.module('ToDo', []);

    app.controller('TodoController', function() {
        var todoCtrl = this;
        todoCtrl.todos = [
            { text: 'stupidmalea', done: true },
            { text: 'maleaissmart', done: false }];
        todoCtrl.search = {done: false};

        todoCtrl.addTodo = function() {
            todoCtrl.todos.push({ text: todoCtrl.todoText,
                done: false });
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
    });
})();
