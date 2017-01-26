'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var LogAnalyzer = function () {

    var __LOG_STORAGE_PATH = 'log_analyzer/logs';
    var pub = {};
    var users = {};

    var User = function () {
        function User(name) {
            _classCallCheck(this, User);

            this.name = name;
            this.sessions = [];
        }

        _createClass(User, [{
            key: 'addSession',
            value: function addSession(session) {
                this.sessions.push(session);
            }
        }, {
            key: 'getAllTasks',
            value: function getAllTasks() {
                return this.sessions.reduce(function (tasks, session) {
                    return tasks.concat(session.tasks);
                }, []);
            }
        }, {
            key: 'getTasksNamed',
            value: function getTasksNamed(taskName) {
                return this.sessions.reduce(function (tasks, session) {
                    return tasks.concat(session.getTasksNamed(taskName));
                }, []);
            }

            // Gets the user for the log, if any.

        }], [{
            key: 'for',
            value: function _for(logs) {
                var sessionStart = getFirstTask('startSession', logs);
                if (!sessionStart) console.error('@ User: startSession is ', sessionStart);
                return sessionStart[1]['user_id'];
            }
        }]);

        return User;
    }();

    var Session = function () {
        function Session(name, logs) {
            _classCallCheck(this, Session);

            this.name = name;
            this.logs = logs;
            this.tasks = Task.tasksFor(logs);
            console.log(' >>> session ' + name + ' has ' + this.tasks.length + ' tasks.');
        }

        _createClass(Session, [{
            key: 'getTasksNamed',
            value: function getTasksNamed(taskName) {
                //console.log('getting tasks named ' + taskName, this);
                return this.tasks.filter(function (task) {
                    return task.name === taskName;
                });
            }

            // Gets the session for the log, if any.

        }], [{
            key: 'for',
            value: function _for(logs) {
                var sessionStart = getFirstTask('startSession', logs);
                if (!sessionStart) console.error('@ User: startSession is ', sessionStart);
                return sessionStart[1]['session_id'];
            }
        }]);

        return Session;
    }();

    var stringsToShapes = function stringsToShapes(s) {
        return s.replace(/diamond/g, '■').replace(/rect/g, '■').replace(/star/g, '★').replace(/triangle/g, '▲').replace(/tri/g, '▲').replace(/dot/g, '●').replace(/circle/g, '●');
    };

    var StateRepr = function () {
        function StateRepr(str) {
            _classCallCheck(this, StateRepr);

            if (!str) return;

            var exprs = argsForExprString(str);

            // Convert lambda expressions to an invariant representation.
            this.exprs = exprs.map(function (e) {

                e = stringsToShapes(e);

                if (isLambdaExpr(e)) return deBruijn(e);else return e;
            });
        }

        _createClass(StateRepr, [{
            key: 'equals',
            value: function equals(otherExprSet) {

                // Compares the expression arrays like sets,
                // using the expression comparison function above.
                return setCompare(this.exprs, otherExprSet.exprs, StateRepr.areExpressionsEqual);
            }
        }, {
            key: 'toString',
            value: function toString() {
                var s = '';
                this.exprs.forEach(function (e) {
                    s += e + ' ';
                });
                return s.trim();
            }
        }], [{
            key: 'areExpressionsEqual',
            value: function areExpressionsEqual(e1, e2) {

                e1 = stripParen(e1);
                e2 = stripParen(e2);
                if (e1 === e2) return true; // true even for lambdas now...

                // Finer equivalence for expressions invariant to order-of-operations.
                if (isComparisonExpr(e1) && isComparisonExpr(e2)) {
                    var a1 = argsForExprString(e1);
                    var a2 = argsForExprString(e2);
                    if (a1[0] === a2[0]) {
                        // if same operation, then check other args...
                        return setCompare(a1.slice(1), a2.slice(1), StateRepr.areExpressionsEqual); // blah, magic
                    }
                }

                return false;
            }
        }]);

        return StateRepr;
    }();

    var StateReprSet = function () {
        function StateReprSet() {
            _classCallCheck(this, StateReprSet);

            this.states = [];
        }

        _createClass(StateReprSet, [{
            key: 'get',
            value: function get(equivStateRepr) {
                var len = this.states.length;
                for (var i = 0; i < len; i++) {
                    if (equivStateRepr.equals(this.states[i])) return this.states[i]; // This state is already in the set.
                }
                return null;
            }
        }, {
            key: 'map',
            value: function map(mapfunc) {
                return this.states.map(mapfunc);
            }
        }, {
            key: 'slice',
            value: function slice() {
                var srs = new StateReprSet();
                srs.states = this.states.slice();
                return srs;
            }
        }, {
            key: 'forEach',
            value: function forEach(fefunc) {
                this.states.forEach(fefunc);
            }
        }, {
            key: 'update',
            value: function update(stateRepr) {
                var node = this.get(stateRepr);
                if (node) {
                    if (stateRepr.final) node.final = true;else if (stateRepr.initial) node.initial = true;
                    return node;
                } else {
                    this.states.push(stateRepr);
                    return stateRepr;
                }
            }
        }, {
            key: 'last',
            value: function last() {
                return this.states[this.states.length - 1];
            }
        }]);

        return StateReprSet;
    }();

    var Task = function () {
        function Task(task_logs) {
            _classCallCheck(this, Task);

            this.logs = task_logs;
            this.name = task_logs[0][1]['quest_id'];
        }

        _createClass(Task, [{
            key: 'getStateGraph',


            // Casts task to reduction state graph.
            value: function getStateGraph() {
                var nodes = new StateReprSet();
                var edges = [];
                var actions = this.actions;
                var prev_node = null;
                var next_edge_detail = null;

                // Recursive rule creator:
                var createRule = function createRule(name, args) {
                    if (!Array.isArray(args)) args = [args];
                    var s = name + '(';
                    args.forEach(function (a, i) {
                        s += ruleFor(a);
                        if (i < args.length - 1) s += ', ';
                    });
                    return s + ')';
                };
                var ruleFor = function ruleFor(expr) {
                    if (stripParen(expr).trim() === '') return '()';
                    var s = new StateRepr(stripParen(expr));
                    var op = s.exprs[0];
                    if (op === 'if') return createRule('Cond', [s.exprs[1], s.exprs[2], 'null']);else if (op === '==') return createRule('Equal', s.exprs.slice(1));else if (op === 'map') return createRule('Map', s.exprs.slice(1));else if (op === 'bag') return createRule('Collection', s.exprs.slice(1));else if (stripParen(expr) === 'λ #0') return createRule('Lambda', 'x');else if (stripParen(expr) === 'λ #0 #0') return createRule('Lambda', 'xx');else if (stripParen(expr) === 'λ #0 #0 #0') return createRule('Lambda', 'xxx');else if (op === 'λ') return createRule('Lambda', s.exprs.slice(1).map(function (s) {
                        return s.replace(/#(0|1|2|3|4|5|6|7)/g, 'x');
                    }));

                    if (s.exprs.length === 1) return expr; // base case
                    else return s.exprs.map(function (e) {
                            return ruleFor(e);
                        }).reduce(function (p, c) {
                            return p + c + ' ';
                        }, '').trim();
                };

                // Basic diff to determine what substring was changed in two strings.
                var relRangeOfChangedSubstring = function relRangeOfChangedSubstring(s, t) {
                    var a = s.length >= t.length ? t : s; // make sure 'a'
                    var b = s.length >= t.length ? s : t; // is shorter than 'b'
                    var start_idx = -1;
                    var end_idx = -1;
                    for (var i = 0; i < a.length; i++) {
                        if (start_idx < 0 && a[i] !== b[i]) start_idx = i;
                        if (end_idx < 0 && a[a.length - i - 1] !== b[b.length - i - 1]) end_idx = i;
                        if (start_idx >= 0 && end_idx >= 0) break;
                    }
                    return {
                        fromStart: start_idx,
                        fromEnd: end_idx
                    };
                };
                var substringFromRelRange = function substringFromRelRange(s, rel) {
                    return s.substring(rel.fromStart, s.length - rel.fromEnd);
                };

                // Add initial state.
                nodes.update(this.initialState);
                prev_node = nodes.last();

                actions.forEach(function (action, i) {
                    var name = action['action_id'];

                    if (name === 'moved' || name === 'condition') return; // skip

                    var data = action['action_detail'];

                    // Clean up any redundant slashes:
                    data = data.replace(/\\\\\\\\/g, '\\').replace(/\\\\/g, '\\');

                    var victory = name === 'victory';
                    if (victory) {
                        var final_state = void 0;
                        try {
                            final_state = JSON.parse(data)['final_state'];
                        } catch (e) {
                            data = data.replace(/\\\\/g, '\\'); // replace double backslashes with single ones...
                            final_state = JSON.parse(data)['final_state'];
                            //console.error(typeof data, data, e);
                        }
                        data = final_state;
                    }

                    var addState = function addState(prev_node, node) {

                        // Make an edge from the previous state to this one.
                        if (prev_node && !prev_node.equals(node)) {
                            var e = { from: prev_node, to: node, reduce: 1, undo: 0 };
                            if (next_edge_detail) {
                                e.reduction = next_edge_detail;
                                next_edge_detail = null;
                            }
                            edges.push(e);
                        }
                    };
                    var logPatch = function logPatch(prev_node, new_node) {
                        var arrWithoutElems = function arrWithoutElems(a, elems) {
                            console.log('arrWithoutElems', a, elems);
                            for (var _i = 0; _i < a.length; _i++) {
                                for (var k = 0; k < elems.length; k++) {
                                    if (a[_i] === elems[k]) {
                                        a.splice(_i, 1);
                                        elems.splice(k, 1);
                                        _i--;
                                        break;
                                    }
                                }
                            }
                            return a;
                        };
                        if (prev_node.toString().indexOf('map') > -1 && new_node.toString().indexOf('map') === -1) {
                            // we lost a map reduction here...
                            for (var _i2 = 0; _i2 < prev_node.exprs.length; _i2++) {
                                if (prev_node.exprs[_i2].indexOf('map') > -1) {

                                    // Patch in the map reduce state:
                                    var prev_exprs = prev_node.exprs.slice();
                                    prev_exprs.splice(_i2, 1);
                                    next_edge_detail = ruleFor(prev_node.exprs[_i2]) + ' → ' + createRule('Collection', arrWithoutElems(new_node.exprs.slice(), prev_exprs));

                                    break;
                                }
                            }
                        }
                    };

                    if (name === 'state-save' || victory) {

                        data = JSON.parse(data).board;

                        var state = new StateRepr(data);
                        //console.log(' >> state-save', data, state);
                        if (victory) state.final = true;

                        // Since 'map' reductions were not logged, unfortunately...
                        if (!next_edge_detail) logPatch(prev_node, state);

                        // Add a node for this state (does nothing if node already exists).
                        var node = nodes.update(state);
                        addState(prev_node, node);

                        prev_node = node;
                    } else if (name === 'state-restore') {

                        data = JSON.parse(data).board;

                        var _state = new StateRepr(data);

                        // This state should already be a node. Get it.
                        var _node = nodes.get(_state);
                        if (!_node) {
                            console.error('Error @ getStateGraph: Restored state was never reached in the first place!');
                            return;
                        }

                        // Make an edge from the current state (prev_node) to the previous state (node).
                        if (prev_node && !prev_node.equals(_node)) {
                            edges.push({ from: prev_node, to: _node, reduce: 0, undo: 1 });
                        }

                        prev_node = _node;
                    } else if (name.substring(0, 9) === 'reduction') {

                        data = JSON.parse(data);
                        var after = new StateRepr(data.after);

                        if ('applied' in data) {
                            var before = new StateRepr(data.before).toString();
                            data.before = 'Apply(' + ruleFor(before) + ', ' + ruleFor(data.applied) + ')';
                        } else {
                            data.before = ruleFor(data.before);
                        }

                        // Add a node for this state (does nothing if node already exists).
                        next_edge_detail = data.before + ' → ' + ruleFor(after.toString());
                    } else if (name === 'toolbox-remove') {
                        next_edge_detail = "ToolboxPlace(" + ruleFor(new StateRepr(data).toString()) + ")";
                    } else if (name === 'placed-expr' || name === 'detached-expr') {

                        var ruleName = name === 'placed-expr' ? 'Place' : 'Detach';

                        // Recover what was placed:
                        data = JSON.parse(data);
                        var _before = new StateRepr(JSON.parse(data.before).board);
                        var _after = new StateRepr(JSON.parse(data.after).board);

                        // TODO: Check toolbox-dragout!!

                        if (next_edge_detail) {
                            var _node2 = nodes.update(_before);
                            addState(prev_node, _node2);
                            prev_node = _node2;
                        }

                        for (var _i3 = 0; _i3 < _before.exprs.length; _i3++) {
                            if (_before.exprs[_i3] !== _after.exprs[_i3]) {
                                if (_before.exprs[_i3].indexOf('_') > -1) {

                                    var relRange = relRangeOfChangedSubstring(_before.exprs[_i3], _after.exprs[_i3]);
                                    var missingExpr = substringFromRelRange(_before.exprs[_i3], relRange);
                                    var placedExpr = substringFromRelRange(_after.exprs[_i3], relRange);

                                    next_edge_detail = ruleName + '(' + ruleFor(_before.exprs[_i3]) + ', ' + missingExpr + ', ' + ruleFor(placedExpr) + ') → ' + ruleFor(_after.exprs[_i3]);
                                } else next_edge_detail = _before.exprs[_i3] + ' → ' + _after.exprs[_i3];
                                break;
                            }
                        }
                    } else if (name === 'bag-spill') {
                        data = JSON.parse(data);
                        var bag = new StateRepr(data.item);
                        var exprs = new StateRepr(stripParen(data.item));
                        next_edge_detail = 'Spill(' + bag.toString() + ') → ' + exprs.exprs.slice(1).reduce(function (p, c) {
                            return p + ruleFor(c) + ' ';
                        }, '').trim();
                    } else if (name === 'bag-add') {
                        // TODO: Fix this.
                        data = JSON.parse(data);
                        var _bag = new StateRepr(data.before);
                        var item = new StateRepr(data.item);
                        var _after2 = new StateRepr(data.after);
                        next_edge_detail = 'BagAdd(' + ruleFor(_bag.toString()) + ', ' + ruleFor(item.toString()) + ') → ' + ruleFor(_after2.toString());
                    }
                });

                if (!this.playerWon) {
                    // No victory was reached in this action path...
                    var reset_node = nodes.update(new StateRepr('reset'));
                    edges.push({ from: prev_node, to: reset_node, reduce: 1, undo: 0 });
                }

                return { nodes: nodes, edges: edges };
            }
        }, {
            key: 'playTime',
            get: function get() {
                if (this.logs.length === 0) return 0;

                var startTask = this.logs[0][1];
                var vic = this.victoryAction;
                if (vic) return vic.client_timestamp - startTask.client_timestamp;else return this.logs[this.logs.length - 1][1].client_timestamp - startTask.client_timestamp;
            }
        }, {
            key: 'actions',
            get: function get() {
                return this.logs.filter(function (log) {
                    return log[0] === 'action';
                }).map(function (action) {
                    return action[1];
                });
            }
        }, {
            key: 'logIntervals',
            get: function get() {
                var len = this.logs.length;
                var intervalTimesMS = [];
                for (var i = 0; i < len - 1; i++) {
                    intervalTimesMS.push(this.logs[i + 1][1]['client_timestamp'] - this.logs[i][1]['client_timestamp']);
                }
                return intervalTimesMS;
            }
        }, {
            key: 'moves',
            get: function get() {
                //let v = this.victoryAction;
                var moveActionIDs = ['reduction-lambda', 'toolbox-remove', 'bag-spill', 'reduction', 'detach-commit', 'detached-expr', 'placed-expr']; // bag-add...
                return this.actions.filter(function (act, idx, arr) {

                    // this patches map level logs in the late-game...
                    var bagspillCheck = function bagspillCheck() {
                        var isMapReductPair = function isMapReductPair(i) {
                            if (i < 0) return false;
                            var a = arr[i];
                            return a.action_id === 'reduction' && a.action_detail.indexOf('map') > -1 && i < arr.length - 2 && arr[i + 2].action_id === 'bag-spill';
                        };

                        // Skip BOTH elements of the pair.
                        if (isMapReductPair(idx) || isMapReductPair(idx - 2)) return false;

                        return true;
                    };

                    return moveActionIDs.indexOf(act.action_id) > -1 && bagspillCheck();
                    //if (act.action_id === 'state-save' && (!v || v.client_timestamp > act.client_timestamp)) return true;
                    //else if (act.action_id === 'bag-add') return true;
                    //return false;
                });
            }
        }, {
            key: 'initialState',
            get: function get() {
                var state = new StateRepr(JSON.parse(this.logs.filter(function (log) {
                    return log[0] === 'startTask';
                })[0][1]['quest_detail']).board);
                state.initial = true;
                return state;
            }
        }, {
            key: 'victoryAction',
            get: function get() {
                var actions = this.actions;
                var _iteratorNormalCompletion = true;
                var _didIteratorError = false;
                var _iteratorError = undefined;

                try {
                    for (var _iterator = actions[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                        var a = _step.value;

                        if (a.action_id === 'victory') return a;
                    }
                } catch (err) {
                    _didIteratorError = true;
                    _iteratorError = err;
                } finally {
                    try {
                        if (!_iteratorNormalCompletion && _iterator.return) {
                            _iterator.return();
                        }
                    } finally {
                        if (_didIteratorError) {
                            throw _iteratorError;
                        }
                    }
                }

                return null;
            }
        }, {
            key: 'playerWon',
            get: function get() {
                return this.victoryAction !== null;
            }
        }], [{
            key: 'tasksFor',
            value: function tasksFor(logs) {
                var tasks = [];
                var len = logs.length;
                var start_idx = -1;
                for (var i = 0; i < len; i++) {
                    var log = logs[i];
                    if (log[0] === 'startTask') start_idx = i;else if (log[0] === 'endTask') {
                        if (i === start_idx + 1) continue; // skip tasks with no inner actions (skip overs)
                        tasks.push(new Task(logs.slice(start_idx, i + 1)));
                    }
                }
                tasks.push(new Task(logs.slice(start_idx, logs.length)));
                return tasks;
            }
        }]);

        return Task;
    }();

    /** USER INTERFACE */


    var userSelElem, sessionSelElem, taskSelElem, createStateGraph;
    pub.setUserSelect = function (selectElem) {
        userSelElem = selectElem;
        userSelElem.onchange = function () {
            refreshSessionList();
            sessionSelElem.selectedIndex = -1;
            refreshTaskVis();
            refreshTimeCompletionBar();
        };
    };
    pub.setSessionSelect = function (selectElem) {
        sessionSelElem = selectElem;
    };
    pub.setTaskSelect = function (selectElem) {
        selectElem.onchange = refreshTaskVis;
        taskSelElem = selectElem;
        removeAllOptions(taskSelElem);
        for (var i = 0; i < 72; i++) {
            var opt = document.createElement("option");
            opt.text = i.toString();
            opt.value = i.toString();
            taskSelElem.add(opt);
        }
    };
    pub.setStateGraphCallback = function (cb) {
        createStateGraph = cb;
    };
    var removeAllOptions = function removeAllOptions(selectElem) {
        $(selectElem).empty();
        //var opts = selectElem.options;
        //for (let i = 0; i < opts.length; i++)
        //    selectElem.remove(opts[i]);
    };
    var getSelectedOptions = function getSelectedOptions(selectElem) {
        var opts = selectElem.options;
        var sel_opts = [];
        for (var i = 0; i < opts.length; i++) {
            if (opts[i].selected) sel_opts.push(opts[i]);
        }
        return sel_opts;
    };
    var getSelectedUsers = function getSelectedUsers() {
        var sel_opts = getSelectedOptions(userSelElem);
        return sel_opts.map(function (opt) {
            return users[opt.text];
        });
    };
    pub.getSelectedUsers = getSelectedUsers;
    var getSelectedTask = function getSelectedTask() {
        return parseInt(taskSelElem.options[taskSelElem.selectedIndex].value);
    };
    pub.getSelectedTask = getSelectedTask;
    var refreshUserList = function refreshUserList() {
        removeAllOptions(userSelElem);
        for (var user in users) {
            if (users.hasOwnProperty(user)) {
                var opt = document.createElement("option");
                opt.text = user;
                opt.value = user;
                userSelElem.add(opt);
            }
        }
    };
    var refreshSessionList = function refreshSessionList() {
        removeAllOptions(sessionSelElem);
        var sel_users = getSelectedUsers();
        sel_users.forEach(function (user) {
            user.sessions.forEach(function (session) {
                var opt = document.createElement("option");
                opt.text = session.name;
                opt.value = session.name;
                sessionSelElem.add(opt);
            });
        });
    };
    var refreshTimeCompletionBar = function refreshTimeCompletionBar() {

        if (parseInt(userSelElem.selectedIndex) === -1) return;
        if (parseInt(sessionSelElem.selectedIndex) === -1) {
            // No sessions selected. Go off user selection.
            var sel_users = getSelectedUsers();

            var users_with_tasks = {};
            var avg_time_by_name = {};
            var avg_resets = {};
            var skip_overs = {};
            var total_moves = {};

            var action_times = {};
            var single_user = sel_users.length === 1;

            sel_users.forEach(function (user) {

                // Get all tasks for this user.
                var all_tasks = user.getAllTasks();

                // For each task, compile the average playtime, and sort by task #.
                var tasks_by_name = {};
                all_tasks.forEach(function (task) {
                    //if (!task.playerWon) {} // skip tasks the player skipped.
                    if (task.name in tasks_by_name) tasks_by_name[task.name].push(task);else {
                        tasks_by_name[task.name] = [task];
                        if (task.name in users_with_tasks) users_with_tasks[task.name]++;else users_with_tasks[task.name] = 1;
                    }
                });

                for (var name in tasks_by_name) {
                    var ts = tasks_by_name[name];
                    var cumu_playtime = ts.reduce(function (acc, t) {
                        return acc + t.playTime;
                    }, 0);
                    var skipped = ts.reduce(function (acc, t) {
                        return acc || t.playerWon;
                    }, false) ? 0 : 1;
                    var num_resets = ts.length - 1;
                    //let min_move = Math.min.apply(null, ts.filter((t) => t.victoryAction !== null)
                    //                                      .map((t) => t.moves.length));
                    //min_moves[name] = min_move;

                    if (single_user) {
                        action_times[name] = ts.map(function (t) {
                            return t.logIntervals.map(function (a) {
                                return a / 1000.0;
                            });
                        });
                        total_moves[name] = ts.map(function (t) {
                            return t.moves.length;
                        }).reduce(function (a, b) {
                            return a + b;
                        }, 0);
                    }

                    if (name in avg_time_by_name) avg_time_by_name[name] += cumu_playtime;else avg_time_by_name[name] = cumu_playtime;

                    if (name in avg_resets) avg_resets[name] += num_resets;else avg_resets[name] = num_resets;

                    if (name in skip_overs) skip_overs[name] += skipped;else skip_overs[name] = skipped;
                }
            });

            for (var name in users_with_tasks) {
                avg_time_by_name[name] /= users_with_tasks[name];
                avg_resets[name] /= users_with_tasks[name];
                skip_overs[name] /= users_with_tasks[name];
            }

            var parts = [];
            var names = Object.keys(avg_time_by_name);
            names.sort(function (a, b) {
                return a - b;
            });
            for (var i = 0; i < names.length; i++) {
                var _name = names[i];
                parts.push({
                    name: _name,
                    value: 1.0 / names.length,
                    time: avg_time_by_name[_name],
                    resets: avg_resets[_name],
                    skips: skip_overs[_name],
                    actionTimes: _name in action_times ? action_times[_name] : undefined,
                    moves: _name in total_moves ? Math.max(total_moves[_name], 1) : undefined // cannot have zero moves!
                    //optimalMoves: min_moves[name]
                });
            }

            // Get data on all tasks that the selected users have played.
            //var all_tasks = sel_users.reduce((tasks, user) => tasks.concat(user.getAllTasks()), []);

            console.log('selected users: ', sel_users);
            loadPartitionBar('levelTimeBarContainer', parts);
        } else loadPartitionBar('levelTimeBarContainer', []);
    };

    var mergeStateGraphs = function mergeStateGraphs(state_graphs) {

        // (a) Merge the nodes.
        var all_nodes = new StateReprSet();
        var raw_nodesets = state_graphs.reduce(function (nodes, graph) {
            return nodes.concat(graph.nodes.slice());
        }, []);
        raw_nodesets.forEach(function (nodeset) {
            nodeset.forEach(function (node) {
                all_nodes.update(node); // Add node to merged set.
            });
        });
        // (b) Recalculate the edges with respect to the kept nodes.
        var raw_edges = state_graphs.reduce(function (edges, graph) {
            return edges.concat(graph.edges.slice());
        }, []);
        raw_edges = raw_edges.map(function (edge) {
            var e = { from: all_nodes.get(edge.from),
                to: all_nodes.get(edge.to),
                reduce: edge.reduce,
                undo: edge.undo };
            if (edge.reduction) e.reduction = edge.reduction;
            return e;
        });
        // (c) Merge identical edges.
        for (var i = 0; i < raw_edges.length - 1; i++) {
            var e1 = raw_edges[i];
            for (var j = i + 1; j < raw_edges.length; j++) {
                var e2 = raw_edges[j];
                if (e1.from.equals(e2.from) && e1.to.equals(e2.to)) {

                    // Edges are equal. Merge and remove.
                    e1.reduce += e2.reduce; // since there is no undo in the released version, this is equal to the # of times this edge was passed (across tasks + users).
                    e1.undo += e2.undo; // tally any properties...
                    raw_edges.splice(j, 1);
                    j--;
                }
            }
        }

        return { nodes: all_nodes, edges: raw_edges };
    };

    var generateActionGraphs = function generateActionGraphs(users, taskRange) {
        if (!taskRange) taskRange = [0, 71];
        var graphs = {};
        for (var i = taskRange[0]; i < taskRange[1] - taskRange[0]; i++) {
            graphs[i.toString()] = generateActionGraph(users, i + taskRange[0]);
        }return graphs;
    };

    var generateActionGraph = function generateActionGraph(sel_users, task) {
        console.log(sel_users);

        // Get all data on level taskName that the selected users have played.
        var sel_tasks = sel_users.reduce(function (tasks, user) {
            return tasks.concat(user.getTasksNamed(task));
        }, []);

        // Convert these tasks into state graphs.
        var state_graphs = sel_tasks.map(function (task) {
            return task.getStateGraph();
        });

        // Merge all playthroughs of this level into a single state graph.
        var merged_graph = mergeStateGraphs(state_graphs);

        // Return the merged graph.
        // Edges and nodes should now be unique.
        return merged_graph;
    };

    var toNetworkVisFormat = function toNetworkVisFormat(raw_graph) {

        // Turn this graph inside-out.
        // let dual = (visgraph) => {
        //     let action_nodes = {};
        //     let action_edges = {};
        //     let nodes = visgraph.nodes;
        //     let edges = visgraph.edges;
        //     edges.forEach((e) => {
        //         if (e.reduction) {
        //             if (e.reduction in actions)
        //                 action_nodes[e.reduction].count += parseInt(e.label);
        //             else
        //                 action_nodes[e.reduction] = { id:e.reduction, label:e.reduction, shape:'box', count:parseInt(e.label) };
        //
        //             if (!(e.from in action_edges)) {
        //                 action_edges[e.from] = { from:e.reduction, to: }
        //             }
        //         }
        //     });
        // };

        // Make nodes reached by a lot of players more visible,
        // and nodes reached by less players less visible.
        var flowSaturate = function flowSaturate(visgraph) {
            var nodes = visgraph.nodes;
            var edges = visgraph.edges;
            nodes.forEach(function (n) {
                var flow = 0;
                edges.forEach(function (e) {
                    if (e.from === n.label || n.final && e.to === n.label) flow += parseInt(e.label);
                });
                if (flow < 100) n.color = {
                    background: colorFrom255(255 - flow / 2),
                    border: colorFrom255(255 - flow / 2 - 40),
                    highlight: {
                        background: '#aaa',
                        border: '#666'
                    }
                };
            });
            return visgraph;
        };

        return flowSaturate({ nodes: raw_graph.nodes.map(function (state) {
                var s = state.toString();
                var node = { id: s, label: s, shape: 'box' };
                if (state.initial) {
                    node.color = {
                        background: 'LightGreen',
                        border: 'green',
                        highlight: {
                            background: 'Aquamarine',
                            border: 'LightSeaGreen'
                        }
                    };
                    node.initial = true;
                } else if (state.final) {
                    node.color = {
                        background: 'Gold',
                        border: 'Orange',
                        highlight: {
                            background: 'Yellow',
                            border: 'OrangeRed'
                        }
                    };
                    node.final = true;
                } else if (s === 'reset') {
                    node.color = {
                        background: '#BDAEC6',
                        border: '#732C7B',
                        highlight: {
                            background: '#BDAEC6',
                            border: 'Indigo'
                        }
                    };
                    node.reset = true;
                }
                return node;
            }), //.filter((n) => !n.reset),
            edges: raw_graph.edges.map(function (edge) {
                var e = { from: edge.from.toString(), to: edge.to.toString() };
                if (edge.undo > 0) e.color = 'red';
                if (edge.reduce) {
                    // Edge becomes more visible proportional to player count.
                    e.label = edge.reduce + '';
                    e.width = edge.reduce / 200.0;
                    if (e.width < 0.5) {
                        e.color = colorFrom255(200);
                        if (e.width < 0.1) e.physics = false;
                    } else {
                        e.label = edge.reduce + ' : ' + edge.reduction;
                        e.reduction = edge.reduction;
                    }
                }
                //if (edge.reduction) e.label = edge.reduce + ' : ' + edge.reduction;
                //else if (edge.reduce) e.label = edge.reduce + '';
                return e;
            }) }); //.filter((e) => e.to !== 'reset')};
    };

    var refreshTaskVis = function refreshTaskVis() {
        var task = getSelectedTask();

        if (parseInt(userSelElem.selectedIndex) === -1) return;
        if (parseInt(sessionSelElem.selectedIndex) === -1) {
            // No sessions selected. Go off user selection.
            var sel_users = getSelectedUsers();

            var visG = toNetworkVisFormat(generateActionGraph(sel_users, task));
            createStateGraph(visG.nodes, visG.edges);
        } else {
            // ... TBI ...
            console.error('Not yet implemented.');
        }
    };
    pub.refreshTaskVis = refreshTaskVis;

    /** DATA */
    var getTasks = function getTasks(taskName, logs) {
        return logs.filter(function (log) {
            return log[0] === taskName;
        });
    };
    var getFirstTask = function getFirstTask(taskName, logs) {
        for (var i = 0; i < logs.length; i++) {
            if (logs[i][0] === taskName) return logs[i];
        }
        return null;
    };

    var parseLog = function parseLog(json) {

        // Convert format of NodeJS data logs...
        var logs;
        if (json[0] === '{') {
            var lines = json.match(/[^\r\n]+/g);
            logs = lines.map(function (line) {
                var logobj = JSON.parse(line);
                return [logobj["0"], logobj["1"]];
            });
        } else logs = JSON.parse(json);

        // We can assume these logs are for one user...
        var username = User.for(logs);
        var new_user = false;
        if (!(username in users)) {
            console.log(' > Added user ' + username + '.');
            users[username] = new User(username);
            refreshUserList();
            new_user = true;
        }

        // ... but not one session.
        var sessionStartIndices = [];
        for (var i = 0; i < logs.length; i++) {
            if (logs[i][0] === 'startSession') sessionStartIndices.push(i);
        }
        // Generate sessions
        for (var _i4 = 0; _i4 < sessionStartIndices.length; _i4++) {
            var idx = sessionStartIndices[_i4];
            var sessionLogs = _i4 < sessionStartIndices.length - 1 ? logs.slice(idx, sessionStartIndices[_i4 + 1]) : logs.slice(idx);
            console.log(sessionLogs);
            var sessionID = Session.for(sessionLogs);
            users[username].addSession(new Session(sessionID, logs));
            console.log(' > For user: ' + username + '\n >> added session ' + sessionID + '.');
        }

        if (new_user) {
            refreshSessionList();

            // Optional: Generate and export all
            // action graphs of this user to a single JSON file.
            var actionGraphs = generateActionGraphs([users[username]]);
            var file = new File([JSON.stringify(actionGraphs)], username + ".json", { type: "text/plain;charset=utf-8" });
            saveAs(file, username + ".actiongraphs"); // Save JSON file to disk (with FileSaver.js).
        }
    };

    pub.handleFiles = function (files) {

        var userGraphs = [];
        var toStateRepr = function toStateRepr(jsonNode) {
            var r = new StateRepr();
            r.exprs = jsonNode.exprs;
            if (jsonNode.initial) r.initial = jsonNode.initial;
            if (jsonNode.final) r.final = jsonNode.final;
            return r;
        };
        var toStateGraph = function toStateGraph(jsonRep) {

            // Cast nodes as StateRepr objects.
            if (!Array.isArray(jsonRep.nodes)) {
                var nodeset = new StateReprSet();
                nodeset.states = jsonRep.nodes.states.map(function (jsonStateRep) {
                    return toStateRepr(jsonStateRep);
                });
                jsonRep.nodes = nodeset;
            }
            jsonRep.edges.forEach(function (edge) {
                if (edge.from && !(edge.from instanceof StateRepr)) edge.from = toStateRepr(edge.from);
                if (edge.to && !(edge.to instanceof StateRepr)) edge.to = toStateRepr(edge.to);
            });

            return jsonRep;
        };
        var onAllFilesLoaded = function onAllFilesLoaded() {
            if (userGraphs.length === 0) return;

            // Get array of graphs for each task from 0 to 70:
            var graphsPerTask = {};

            var _loop = function _loop(i) {
                var task = i.toString();
                userGraphs.forEach(function (G) {
                    if (task in G) {
                        var sg = toStateGraph(G[task]);
                        if (!(task in graphsPerTask)) graphsPerTask[task] = [sg];else graphsPerTask[task].push(sg);
                    }
                });
            };

            for (var i = 0; i < 71; i++) {
                _loop(i);
            }

            // For each task, merge all loaded graphs into a single state graph.
            for (var _i5 = 0; _i5 < 71; _i5++) {
                var _task = _i5.toString();
                if (_task in graphsPerTask) {
                    graphsPerTask[_task] = mergeStateGraphs(graphsPerTask[_task]);
                }
            }

            // Export the merged graphs to a single file.
            var file = new File([JSON.stringify(graphsPerTask)], "merged.json", { type: "text/plain;charset=utf-8" });
            saveAs(file, "merged.mergedgraph"); // Save JSON file to disk (with FileSaver.js).
        };

        var commonConceptsFromEdges = function commonConceptsFromEdges(edges) {
            var concepts = {};
            edges.forEach(function (e) {
                if (e.reduction && !(e.reduction in concepts)) concepts[e.reduction] = true;
            });
            return Object.keys(concepts);
        };

        var cleanXs = function cleanXs(s) {
            return s.replace(/\#(0|1|2|3|4|5|6|7|x)/g, 'x');
        };

        /**
         * Takes a concept in parametrized form
         * and an abstraction hierarchy and compares the two.
         * Adds the concept to the hierarchy if !exist and
         * returns both new hierarchy and information about
         * the 'novelty' of the concept.
         *
         * 	Novelty takes 3 forms:
         * 		> Global novelty
         * 			- Whether a concept, regardless of its embeddedness,
         * 			has been used at all before.
         * 		> Local novelty
         * 			- Whether a concept has been used as an argument to its'
         * 			parent concept before, in that parameter position. For
         * 			instance, whether in Apply(Lambda(xx), Lambda(x)), the
         * 			concept Apply has seen a Lambda in its 2nd parameter before.
         * 		> Contextual novelty
         * 			- Whether the entire instantiation has been seen before.
         * 			For instance, Apply(Lambda(x), star) will be seen a lot
         * 			(this is identity applied to star). The difference between
         * 			this and local is that contextual takes into account
         * 			the other parameter(s).
         *
         * Novelty of the entire expression is tallied according to these 3 forms.
         */
        var __TEST_conceptApply = function __TEST_conceptApply() {
            var knowledge = {};

            var nov = applyConceptToKnowledgeHierarchy('Apply(Lambda(x), star) → star', knowledge);
            console.log('Knowledge: ', knowledge);
            console.log('Novelty: ', nov); // 4, 3, 0 bc x to Lambda, star to Apply, Lambda to Apply

            nov = applyConceptToKnowledgeHierarchy('Apply(Lambda(xx), star) → star', knowledge);
            console.log('Knowledge: ', knowledge);
            console.log('Novelty: ', nov); // 1, 1, 0 bc xx to Lambda

            nov = applyConceptToKnowledgeHierarchy('Apply(Lambda(Equal(x, x)), star) → Equal(star, star)', knowledge);
            console.log('Knowledge: ', knowledge);
            console.log('Novelty: ', nov); // 1, 3, 0 bc Equal to Lambda, x twice to Equal
        };
        var stripConceptName = function stripConceptName(e) {
            if (e.indexOf('(') > -1) return e.substring(0, e.indexOf('('));else return e;
        };
        var getConceptParams = function getConceptParams(e) {
            e = e.trim();
            if (e.indexOf('→') > -1) e = e.substring(0, e.indexOf('→')).trim();
            if (e.indexOf('(') > -1) e = e.substring(e.indexOf('(') + 1);else return [];
            if (e.lastIndexOf(')') > -1) e = e.substring(0, e.lastIndexOf(')'));
            e = e.replace(',', ' ');
            return argsForExprString(e);
        };
        var mergeNovelty = function mergeNovelty(n1, n2) {
            return {
                global: n1.global + n2.global,
                local: n1.local + n2.local,
                contextual: n1.contextual + n2.contextual
            };
        };
        var zeroNovelty = function zeroNovelty() {
            return {
                global: 0,
                local: 0,
                contextual: 0
            };
        };
        var applyConceptToKnowledgeHierarchy = function applyConceptToKnowledgeHierarchy(concept, hierarchy, global_hierarchy) {
            var localized = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;

            if (!global_hierarchy) global_hierarchy = hierarchy;
            var conceptName = stripConceptName(concept);
            if (conceptName === 'Place' || conceptName === 'Detach') return zeroNovelty();
            var conceptParams = getConceptParams(concept);
            var novelty = zeroNovelty();
            var createEmptyObjArray = function createEmptyObjArray(len) {
                return Array.apply(null, Array(len)).map(function () {
                    return {};
                });
            };
            var paramArrayForLength = function paramArrayForLength(conceptNode, len, name) {
                if (!('versions' in conceptNode)) conceptNode.versions = {};
                if (!(len.toString() in conceptNode.versions)) {
                    if (len === 0) conceptNode.versions[len.toString()] = name;else conceptNode.versions[len.toString()] = createEmptyObjArray(len);
                }
                return conceptNode.versions[len.toString()];
            };

            if (conceptName in hierarchy) {
                (function () {
                    // This alters hierarchy[conceptName][i] in-position, returning novelty.
                    var hierarchyParams = paramArrayForLength(hierarchy[conceptName], conceptParams.length, conceptName);
                    if (Array.isArray(hierarchyParams)) {
                        // Recurse if array.
                        var innerComparisons = conceptParams.map(function (param, i) {
                            return applyConceptToKnowledgeHierarchy(param, hierarchyParams[i], global_hierarchy, localized);
                        });
                        novelty = innerComparisons.reduce(function (p, c) {
                            return mergeNovelty(p, c);
                        }, novelty); // merge inner novelty scores
                    }
                })();
            } else if (hierarchy != global_hierarchy) {
                    (function () {

                        //Concept is 'new' at a local level.
                        if (!localized) {
                            novelty.local += 1;
                            //console.log(' >> new local concept: ', conceptName, 'in hier', hierarchy);
                        }

                        hierarchy[conceptName] = {};
                        var a = paramArrayForLength(hierarchy[conceptName], conceptParams.length, conceptName);
                        if (Array.isArray(a)) {
                            var innerComparisons = a.map(function (obj, i) {
                                return applyConceptToKnowledgeHierarchy(conceptParams[i], a[i], global_hierarchy, true);
                            });
                            novelty = innerComparisons.reduce(function (p, c) {
                                return mergeNovelty(p, c);
                            }, novelty); // merge inner novelty scores
                        } else {
                                //console.log('>>>', conceptName, hierarchy[conceptName], a);
                            }
                    })();
                }

            if (!(conceptName in global_hierarchy)) {
                (function () {
                    // New global concept.
                    novelty.global += 1;
                    global_hierarchy[conceptName] = {};
                    var a = paramArrayForLength(global_hierarchy[conceptName], conceptParams.length, conceptName);
                    if (Array.isArray(a)) {
                        var innerComparisons = a.map(function (obj, i) {
                            return applyConceptToKnowledgeHierarchy(conceptParams[i], a[i], global_hierarchy, localized);
                        });
                        novelty = innerComparisons.reduce(function (p, c) {
                            return mergeNovelty(p, c);
                        }, novelty); // merge inner novelty scores
                    }
                })();
            } else if (hierarchy != global_hierarchy) {
                    (function () {
                        var a = paramArrayForLength(global_hierarchy[conceptName], conceptParams.length, conceptName);
                        if (Array.isArray(a)) {
                            var innerComparisons = a.map(function (obj, i) {
                                return applyConceptToKnowledgeHierarchy(conceptParams[i], a[i], global_hierarchy, true);
                            });
                            novelty = innerComparisons.reduce(function (p, c) {
                                return mergeNovelty(p, c);
                            }, novelty); // merge inner novelty scores
                        }
                    })();
                }

            return novelty;
        };

        var displayStateGraphFromJSON = function displayStateGraphFromJSON(json) {

            // DEBUG
            //__TEST_conceptApply();

            var knowledge = {};

            var commonConcepts = '';
            var graphs = JSON.parse(json);

            for (var i = 0; i < 71; i++) {
                var k = i.toString();

                var G = toStateGraph(graphs[k]);
                var visG = toNetworkVisFormat(G);

                var concepts = cleanXs(stringsToShapes(commonConceptsFromEdges(visG.edges).reduce(function (p, c) {
                    return p + c + '\n';
                }, '').trim()));
                if (i === 21 || i === 25) {
                    concepts += '\nCond(false, ★, null) → ★';
                }
                if (i < 61) {
                    (function () {
                        var novelty = zeroNovelty();
                        concepts.split('\n').forEach(function (c) {
                            novelty = mergeNovelty(applyConceptToKnowledgeHierarchy(c, knowledge), novelty);
                        });
                        console.log('Level ' + i + ' novelty: ', novelty);
                    })();
                }

                commonConcepts += k + '\n' + concepts + '\n\n';

                if (k === '60') createStateGraph(visG.nodes, visG.edges);
            }

            console.warn(knowledge);

            // List concepts used.
            $('#conceptsTextarea').text(commonConcepts);
        };

        var filesLoaded = 0;
        var numFiles = files.length;

        var _loop2 = function _loop2(i) {
            var file = files[i];
            var filename = file.name;

            var reader = new FileReader();
            reader.onload = function (e) {

                var contents = e.target.result;
                console.log('Read file "' + filename + '"...');

                if (filename.indexOf('.actiongraphs') > -1) userGraphs.push(JSON.parse(contents));else if (filename.indexOf('.mergedgraph') > -1) displayStateGraphFromJSON(contents);else parseLog(contents);

                filesLoaded++;
                if (filesLoaded === numFiles) onAllFilesLoaded();
            };

            reader.readAsText(file);
        };

        for (var i = 0; i < numFiles; i++) {
            _loop2(i);
        }
    };

    return pub;
}();