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
                done: false});
            todoCtrl.todoText = '';
        };
    });
})();
