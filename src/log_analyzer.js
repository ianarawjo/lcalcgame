var LogAnalyzer = (function() {

    const __LOG_STORAGE_PATH = 'log_analyzer/logs';
    var pub = {};
    var users = {};

    class User {
        constructor(name) {
            this.name = name;
            this.sessions = [];
        }

        addSession(session) {
            this.sessions.push(session);
        }

        getAllTasks() {
            return this.sessions.reduce((tasks, session) => tasks.concat(session.tasks), []);
        }
        getTasksNamed(taskName) {
            return this.sessions.reduce((tasks, session) => tasks.concat(session.getTasksNamed(taskName)), []);
        }

        // Gets the user for the log, if any.
        static for(logs) {
            var sessionStart = getFirstTask('startSession', logs);
            if (!sessionStart)
                console.error('@ User: startSession is ', sessionStart);
            return sessionStart[1]['user_id'];
        }
    }
    class Session {
        constructor(name, logs) {
            this.name = name;
            this.logs = logs;
            this.tasks = Task.tasksFor(logs);
            console.log(' >>> session ' + name + ' has ' + this.tasks.length + ' tasks.');
        }

        getTasksNamed(taskName) {
            //console.log('getting tasks named ' + taskName, this);
            return this.tasks.filter((task) => (task.name === taskName));
        }

        // Gets the session for the log, if any.
        static for(logs) {
            var sessionStart = getFirstTask('startSession', logs);
            if (!sessionStart)
                console.error('@ User: startSession is ', sessionStart);
            return sessionStart[1]['session_id'];
        }
    }

    var stringsToShapes = (s) => {
        return s.replace(/diamond/g, '■')
                .replace(/rect/g, '■')
                .replace(/star/g, '★')
                .replace(/triangle/g, '▲')
                .replace(/tri/g, '▲')
                .replace(/dot/g, '●')
                .replace(/circle/g, '●');
    };

    class StateRepr {
        constructor(str) {
            if (!str) return;

            let exprs = argsForExprString(str);

            // Convert lambda expressions to an invariant representation.
            this.exprs = exprs.map((e) => {

                e = stringsToShapes(e);

                if (isLambdaExpr(e))
                    return deBruijn(e);
                else
                    return e;
            });
        }
        static areExpressionsEqual(e1, e2) {

            e1 = stripParen(e1);
            e2 = stripParen(e2);
            if (e1 === e2) return true; // true even for lambdas now...

            // Finer equivalence for expressions invariant to order-of-operations.
            if (isComparisonExpr(e1) && isComparisonExpr(e2)) {
                let a1 = argsForExprString(e1);
                let a2 = argsForExprString(e2);
                if (a1[0] === a2[0]) { // if same operation, then check other args...
                    return setCompare(a1.slice(1), a2.slice(1), StateRepr.areExpressionsEqual); // blah, magic
                }
            }

            return false;
        }
        equals(otherExprSet) {

            // Compares the expression arrays like sets,
            // using the expression comparison function above.
            return setCompare(this.exprs, otherExprSet.exprs,
                              StateRepr.areExpressionsEqual);

        }
        toString() {
            let s = '';
            this.exprs.forEach((e) => {
                s += e + ' ';
            });
            return s.trim();
        }
    }
    class StateReprSet {
        constructor() {
            this.states = [];
        }
        get(equivStateRepr) {
            let len = this.states.length;
            for (let i = 0; i < len; i++) {
                if (equivStateRepr.equals(this.states[i]))
                    return this.states[i]; // This state is already in the set.
            }
            return null;
        }
        map(mapfunc) {
            return this.states.map(mapfunc);
        }
        slice() {
            var srs = new StateReprSet();
            srs.states = this.states.slice();
            return srs;
        }
        forEach(fefunc) {
            this.states.forEach(fefunc);
        }
        update(stateRepr) {
            let node = this.get(stateRepr);
            if (node) {
                if (stateRepr.final) node.final = true;
                else if (stateRepr.initial) node.initial = true;
                return node;
            }
            else {
                this.states.push(stateRepr);
                return stateRepr;
            }
        }
        last() {
            return this.states[this.states.length-1];
        }
    }
    class Task {
        constructor(task_logs) {
            this.logs = task_logs;
            this.name = task_logs[0][1]['quest_id'];
        }

        get playTime() {
            if (this.logs.length === 0) return 0;

            let startTask = this.logs[0][1];
            let vic = this.victoryAction;
            if (vic)
                return vic.client_timestamp - startTask.client_timestamp;
            else
                return this.logs[this.logs.length-1][1].client_timestamp - startTask.client_timestamp;
        }

        get actions() {
            return this.logs.filter((log) => log[0] === 'action').map((action) => action[1]);
        }
        get logIntervals() {
            let len = this.logs.length;
            let intervalTimesMS = [];
            for (let i = 0; i < len - 1; i++) {
                intervalTimesMS.push( this.logs[i+1][1]['client_timestamp'] - this.logs[i][1]['client_timestamp'] );
            }
            return intervalTimesMS;
        }
        get moves() {
            //let v = this.victoryAction;
            const moveActionIDs = [ 'reduction-lambda', 'toolbox-remove', 'bag-spill', 'reduction', 'detach-commit', 'detached-expr', 'placed-expr' ]; // bag-add...
            return this.actions.filter((act, idx, arr) => {

                 // this patches map level logs in the late-game...
                let bagspillCheck = function() {
                    let isMapReductPair = function(i) {
                        if (i < 0) return false;
                        let a = arr[i];
                        return a.action_id === 'reduction' && a.action_detail.indexOf('map') > -1 &&
                            i < arr.length-2 && arr[i+2].action_id === 'bag-spill';
                    };

                    // Skip BOTH elements of the pair.
                    if (isMapReductPair(idx) || isMapReductPair(idx-2))
                        return false;

                    return true;
                };

                return moveActionIDs.indexOf(act.action_id) > -1 && bagspillCheck();
                //if (act.action_id === 'state-save' && (!v || v.client_timestamp > act.client_timestamp)) return true;
                //else if (act.action_id === 'bag-add') return true;
                //return false;
            });
        }

        get initialState() {
            var state = new StateRepr( JSON.parse( this.logs.filter((log) => log[0] === 'startTask')[0][1]['quest_detail'] ).board );
            state.initial = true;
            return state;
        }

        get victoryAction() {
            let actions = this.actions;
            for (let a of actions) {
                if (a.action_id === 'victory')
                    return a;
            }
            return null;
        }
        get playerWon() {
            return this.victoryAction !== null;
        }

        // Casts task to reduction state graph.
        getStateGraph() {
            var nodes = new StateReprSet();
            var edges = [];
            var actions = this.actions;
            var prev_node = null;
            var next_edge_detail = null;

            // Recursive rule creator:
            let createRule = (name, args) => {
                if (!Array.isArray(args)) args = [ args ];
                let s = name + '(';
                args.forEach((a, i) => {
                    s += ruleFor(a);
                    if (i < args.length-1) s += ', ';
                });
                return s + ')';
            };
            let ruleFor = (expr) => {
                if (stripParen(expr).trim() === '') return '()';
                let s = new StateRepr(stripParen(expr));
                let op = s.exprs[0];
                if (op === 'if')
                    return createRule('Cond', [s.exprs[1], s.exprs[2], 'null']);
                else if (op === '==')
                    return createRule('Equal', s.exprs.slice(1));
                else if (op === 'map')
                    return createRule('Map', s.exprs.slice(1));
                else if (op === 'bag')
                    return createRule('Collection', s.exprs.slice(1));
                else if (stripParen(expr) === 'λ #0')
                    return createRule('Lambda', 'x');
                else if (stripParen(expr) === 'λ #0 #0')
                    return createRule('Lambda', 'xx');
                else if (stripParen(expr) === 'λ #0 #0 #0')
                    return createRule('Lambda', 'xxx');
                else if (op === 'λ')
                    return createRule('Lambda', s.exprs.slice(1).map((s) => s.replace(/#(0|1|2|3|4|5|6|7)/g, 'x')));

                if (s.exprs.length === 1)
                    return expr; // base case
                else
                    return s.exprs.map((e) => ruleFor(e))
                                  .reduce((p, c) => p + c + ' ', '')
                                  .trim();
            };

            // Basic diff to determine what substring was changed in two strings.
            let relRangeOfChangedSubstring = (s, t) => {
                let a = s.length >= t.length ? t : s; // make sure 'a'
                let b = s.length >= t.length ? s : t; // is shorter than 'b'
                let start_idx = -1;
                let end_idx = -1;
                for (let i = 0; i < a.length; i++) {
                    if ( start_idx < 0 && a[i] !== b[i] )
                        start_idx = i;
                    if ( end_idx < 0 && a[a.length-i-1] !== b[b.length-i-1] )
                        end_idx = i;
                    if ( start_idx >= 0 && end_idx >= 0 )
                        break;
                }
                return {
                    fromStart:start_idx,
                    fromEnd:end_idx
                };
            };
            let substringFromRelRange = (s, rel) => {
                return s.substring(rel.fromStart, s.length-rel.fromEnd);
            };

            // Add initial state.
            nodes.update(this.initialState);
            prev_node = nodes.last();

            actions.forEach((action, i) => {
                let name = action['action_id'];

                if (name === 'moved' || name === 'condition')
                    return; // skip

                let data = action['action_detail'];

                // Clean up any redundant slashes:
                data = data.replace(/\\\\\\\\/g, '\\').replace(/\\\\/g, '\\');

                let victory = name === 'victory';
                if (victory) {
                    let final_state;
                    try {
                        final_state = JSON.parse(data)['final_state'];
                    } catch (e) {
                        data = data.replace(/\\\\/g, '\\'); // replace double backslashes with single ones...
                        final_state = JSON.parse(data)['final_state'];
                        //console.error(typeof data, data, e);
                    }
                    data = final_state;
                }

                let addState = (prev_node, node) => {

                    // Make an edge from the previous state to this one.
                    if (prev_node && !prev_node.equals(node)) {
                        let e = {from:prev_node, to:node, reduce:1, undo:0};
                        if (next_edge_detail) {
                            e.reduction = next_edge_detail;
                            next_edge_detail = null;
                        }
                        edges.push(e);
                    }
                };
                let logPatch = (prev_node, new_node) => {
                    let arrWithoutElems = (a, elems) => {
                        console.log('arrWithoutElems', a, elems);
                        for (let i = 0; i < a.length; i++) {
                            for (let k = 0; k < elems.length; k++) {
                                if (a[i] === elems[k]) {
                                    a.splice(i, 1);
                                    elems.splice(k, 1);
                                    i--;
                                    break;
                                }
                            }
                        }
                        return a;
                    };
                    if (prev_node.toString().indexOf('map') > -1 && new_node.toString().indexOf('map') === -1) { // we lost a map reduction here...
                        for (let i = 0; i < prev_node.exprs.length; i++) {
                            if (prev_node.exprs[i].indexOf('map') > -1) {

                                // Patch in the map reduce state:
                                let prev_exprs = prev_node.exprs.slice();
                                prev_exprs.splice(i, 1);
                                next_edge_detail = ruleFor(prev_node.exprs[i]) + ' → ' + createRule('Collection', arrWithoutElems(new_node.exprs.slice(), prev_exprs));

                                break;
                            }
                        }
                    }
                };

                if (name === 'state-save' || victory) {

                    data = JSON.parse(data).board;

                    let state = new StateRepr(data);
                    //console.log(' >> state-save', data, state);
                    if (victory) state.final = true;

                    // Since 'map' reductions were not logged, unfortunately...
                    if (!next_edge_detail)
                        logPatch(prev_node, state);

                    // Add a node for this state (does nothing if node already exists).
                    let node = nodes.update( state );
                    addState(prev_node, node);

                    prev_node = node;

                } else if (name === 'state-restore') {

                    data = JSON.parse(data).board;

                    let state = new StateRepr(data);

                    // This state should already be a node. Get it.
                    let node = nodes.get(state);
                    if (!node) {
                        console.error('Error @ getStateGraph: Restored state was never reached in the first place!');
                        return;
                    }

                    // Make an edge from the current state (prev_node) to the previous state (node).
                    if (prev_node && !prev_node.equals(node)) {
                        edges.push( {from:prev_node, to:node, reduce:0, undo:1} );
                    }

                    prev_node = node;
                } else if (name.substring(0, 9) === 'reduction') {

                    data = JSON.parse(data);
                    let after = new StateRepr(data.after);

                    if ('applied' in data) {
                        let before = new StateRepr(data.before).toString();
                        data.before = 'Apply(' + ruleFor(before) + ', ' + ruleFor(data.applied) + ')';
                    } else {
                        data.before = ruleFor(data.before);
                    }

                    // Add a node for this state (does nothing if node already exists).
                    next_edge_detail = data.before + ' → ' + ruleFor(after.toString());

                } else if (name === 'toolbox-remove') {
                    next_edge_detail = "ToolboxPlace(" + ruleFor((new StateRepr(data)).toString()) + ")";
                } else if (name === 'placed-expr' || name === 'detached-expr') {

                    let ruleName = name === 'placed-expr' ? 'Place' : 'Detach';

                    // Recover what was placed:
                    data = JSON.parse(data);
                    let before = new StateRepr(JSON.parse(data.before).board);
                    let after = new StateRepr(JSON.parse(data.after).board);

                    // TODO: Check toolbox-dragout!!

                    if (next_edge_detail) {
                        let node = nodes.update( before );
                        addState(prev_node, node);
                        prev_node = node;
                    }

                    for (let i = 0; i < before.exprs.length; i++) {
                        if (before.exprs[i] !== after.exprs[i]) {
                            if (before.exprs[i].indexOf('_') > -1) {

                                let relRange = relRangeOfChangedSubstring(before.exprs[i], after.exprs[i]);
                                let missingExpr = substringFromRelRange(before.exprs[i], relRange);
                                let placedExpr = substringFromRelRange(after.exprs[i], relRange);

                                next_edge_detail = ruleName + '(' + ruleFor(before.exprs[i]) + ', ' + missingExpr + ', ' + ruleFor(placedExpr) + ') → ' + ruleFor(after.exprs[i]);
                            }
                            else
                                next_edge_detail = before.exprs[i] + ' → ' + after.exprs[i];
                            break;
                        }
                    }
                } else if (name === 'bag-spill') {
                    data = JSON.parse(data);
                    let bag = new StateRepr(data.item);
                    let exprs = new StateRepr(stripParen(data.item));
                    next_edge_detail = 'Spill(' + bag.toString() + ') → ' + exprs.exprs.slice(1).reduce((p,c) => p + ruleFor(c) + ' ', '').trim();
                } else if (name === 'bag-add') { // TODO: Fix this.
                    data = JSON.parse(data);
                    let bag = new StateRepr(data.before);
                    let item = new StateRepr(data.item);
                    let after = new StateRepr(data.after);
                    next_edge_detail = 'BagAdd(' + ruleFor(bag.toString()) + ', ' + ruleFor(item.toString()) + ') → ' + ruleFor(after.toString());
                }
            });

            if (!this.playerWon) { // No victory was reached in this action path...
                let reset_node = nodes.update( new StateRepr('reset') );
                edges.push( {from:prev_node, to:reset_node, reduce:1, undo:0} );
            }

            return { nodes:nodes, edges:edges };
        }

        static tasksFor(logs) {
            var tasks = [];
            var len = logs.length;
            var start_idx = -1;
            for (let i = 0; i < len; i++) {
                let log = logs[i];
                if (log[0] === 'startTask')
                    start_idx = i;
                else if (log[0] === 'endTask') {
                    if (i === start_idx + 1) continue; // skip tasks with no inner actions (skip overs)
                    tasks.push( new Task(logs.slice(start_idx, i + 1)) );
                }
            }
            tasks.push( new Task(logs.slice(start_idx, logs.length)) );
            return tasks;
        }
    }

    /** USER INTERFACE */
    var userSelElem, sessionSelElem, taskSelElem, createStateGraph;
    pub.setUserSelect = (selectElem) => {
        userSelElem = selectElem;
        userSelElem.onchange = () => {
            refreshSessionList();
            sessionSelElem.selectedIndex = -1;
            refreshTaskVis();
            refreshTimeCompletionBar();
        };
    };
    pub.setSessionSelect = (selectElem) => {
        sessionSelElem = selectElem;
    };
    pub.setTaskSelect = (selectElem) => {
        selectElem.onchange = refreshTaskVis;
        taskSelElem = selectElem;
        removeAllOptions(taskSelElem);
        for (let i = 0; i < 72; i++) {
            var opt = document.createElement("option");
            opt.text = i.toString();
            opt.value = i.toString();
            taskSelElem.add(opt);
        }
    };
    pub.setStateGraphCallback = (cb) => {
        createStateGraph = cb;
    };
    var removeAllOptions = (selectElem) => {
        $(selectElem).empty();
        //var opts = selectElem.options;
        //for (let i = 0; i < opts.length; i++)
        //    selectElem.remove(opts[i]);
    };
    var getSelectedOptions = (selectElem) => {
        var opts = selectElem.options;
        var sel_opts = [];
        for (let i = 0; i < opts.length; i++) {
            if (opts[i].selected)
                sel_opts.push(opts[i]);
        }
        return sel_opts;
    };
    var getSelectedUsers = () => {
        var sel_opts = getSelectedOptions(userSelElem);
        return sel_opts.map((opt) => users[opt.text]);
    };
    pub.getSelectedUsers = getSelectedUsers;
    var getSelectedTask = () => {
        return parseInt(taskSelElem.options[taskSelElem.selectedIndex].value);
    };
    pub.getSelectedTask = getSelectedTask;
    var refreshUserList = () => {
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
    var refreshSessionList = () => {
        removeAllOptions(sessionSelElem);
        var sel_users = getSelectedUsers();
        sel_users.forEach((user) => {
            user.sessions.forEach((session) => {
                var opt = document.createElement("option");
                opt.text = session.name;
                opt.value = session.name;
                sessionSelElem.add(opt);
            });
        });
    };
    var refreshTimeCompletionBar = () => {

        if (parseInt(userSelElem.selectedIndex) === -1) return;
        if (parseInt(sessionSelElem.selectedIndex) === -1) { // No sessions selected. Go off user selection.
            var sel_users = getSelectedUsers();

            var users_with_tasks = {};
            var avg_time_by_name = {};
            var avg_resets = {};
            var skip_overs = {};
            var total_moves = {};

            var action_times = {};
            var single_user = sel_users.length === 1;

            sel_users.forEach((user) => {

                // Get all tasks for this user.
                var all_tasks = user.getAllTasks();

                // For each task, compile the average playtime, and sort by task #.
                var tasks_by_name = {};
                all_tasks.forEach((task) => {
                    //if (!task.playerWon) {} // skip tasks the player skipped.
                    if (task.name in tasks_by_name) tasks_by_name[task.name].push(task);
                    else {
                        tasks_by_name[task.name] = [ task ];
                        if (task.name in users_with_tasks) users_with_tasks[task.name]++;
                        else                               users_with_tasks[task.name] = 1;
                    }
                });

                for (let name in tasks_by_name) {
                    let ts = tasks_by_name[name];
                    let cumu_playtime = ts.reduce((acc, t) => acc + t.playTime, 0);
                    let skipped = ts.reduce((acc, t) => acc || t.playerWon, false) ? 0 : 1;
                    let num_resets = ts.length-1;
                    //let min_move = Math.min.apply(null, ts.filter((t) => t.victoryAction !== null)
                    //                                      .map((t) => t.moves.length));
                    //min_moves[name] = min_move;

                    if (single_user) {
                        action_times[name] = ts.map((t) => t.logIntervals.map((a) => a / 1000.0));
                        total_moves[name] = ts.map((t) => t.moves.length).reduce((a,b) => a + b, 0);
                    }

                    if (name in avg_time_by_name)
                        avg_time_by_name[name] += cumu_playtime;
                    else
                        avg_time_by_name[name] = cumu_playtime;

                    if (name in avg_resets)
                        avg_resets[name] += num_resets;
                    else
                        avg_resets[name] = num_resets;

                    if (name in skip_overs)
                        skip_overs[name] += skipped;
                    else
                        skip_overs[name] = skipped;

                }
            });

            for (let name in users_with_tasks) {
                avg_time_by_name[name] /= users_with_tasks[name];
                avg_resets[name] /= users_with_tasks[name];
                skip_overs[name] /= users_with_tasks[name];
            }

            var parts = [];
            var names = Object.keys(avg_time_by_name);
            names.sort((a, b) => a - b);
            for (let i = 0; i < names.length; i++) {
                let name = names[i];
                parts.push({
                    name:  name,
                    value: 1.0 / names.length,
                    time: avg_time_by_name[name],
                    resets: avg_resets[name],
                    skips: skip_overs[name],
                    actionTimes: (name in action_times) ? action_times[name] : undefined,
                    moves: (name in total_moves) ? Math.max(total_moves[name], 1) : undefined // cannot have zero moves!
                    //optimalMoves: min_moves[name]
                });
            }

            // Get data on all tasks that the selected users have played.
            //var all_tasks = sel_users.reduce((tasks, user) => tasks.concat(user.getAllTasks()), []);

            console.log('selected users: ', sel_users);
            loadPartitionBar('levelTimeBarContainer', parts);
        }
        else loadPartitionBar('levelTimeBarContainer', []);
    };

    var mergeStateGraphs = ( state_graphs ) => {

        // (a) Merge the nodes.
        var all_nodes = new StateReprSet();
        var raw_nodesets = state_graphs.reduce((nodes, graph) => nodes.concat( graph.nodes.slice() ), [] );
        raw_nodesets.forEach((nodeset) => {
            nodeset.forEach((node) => {
                all_nodes.update(node); // Add node to merged set.
            });
        });
        // (b) Recalculate the edges with respect to the kept nodes.
        var raw_edges = state_graphs.reduce((edges, graph) => edges.concat(graph.edges.slice()), []);
        raw_edges = raw_edges.map((edge) => {
            let e = { from:all_nodes.get(edge.from),
                     to:all_nodes.get(edge.to),
                     reduce:edge.reduce,
                     undo:edge.undo };
            if (edge.reduction) e.reduction = edge.reduction;
            return e;
        });
        // (c) Merge identical edges.
        for (let i = 0; i < raw_edges.length-1; i++) {
            let e1 = raw_edges[i];
            for (let j = i + 1; j < raw_edges.length; j++) {
                let e2 = raw_edges[j];
                if (e1.from.equals(e2.from) && e1.to.equals(e2.to)) {

                    // Edges are equal. Merge and remove.
                    e1.reduce += e2.reduce; // since there is no undo in the released version, this is equal to the # of times this edge was passed (across tasks + users).
                    e1.undo += e2.undo; // tally any properties...
                    raw_edges.splice(j, 1);
                    j--;

                }
            }
        }

        return { nodes:all_nodes, edges:raw_edges };
    };

    var generateActionGraphs = ( users, taskRange ) => {
        if (!taskRange) taskRange = [ 0, 71 ];
        var graphs = {};
        for (let i = taskRange[0]; i < taskRange[1] - taskRange[0]; i++)
            graphs[i.toString()] = generateActionGraph( users, i + taskRange[0] );
        return graphs;
    };

    var generateActionGraph = ( sel_users, task ) => {
        console.log(sel_users);

        // Get all data on level taskName that the selected users have played.
        var sel_tasks = sel_users.reduce((tasks, user) => tasks.concat(user.getTasksNamed(task)), []);

        // Convert these tasks into state graphs.
        var state_graphs = sel_tasks.map((task) => task.getStateGraph());

        // Merge all playthroughs of this level into a single state graph.
        var merged_graph = mergeStateGraphs(state_graphs);

        // Return the merged graph.
        // Edges and nodes should now be unique.
        return merged_graph;

    };

    var toNetworkVisFormat = ( raw_graph ) => {

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
        let flowSaturate = (visgraph) => {
            let nodes = visgraph.nodes;
            let edges = visgraph.edges;
            nodes.forEach((n) => {
                let flow = 0;
                edges.forEach((e) => {
                    if (e.from === n.label || (n.final && e.to === n.label))
                        flow += parseInt(e.label);
                });
                if (flow < 100)
                    n.color = {
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

        return flowSaturate( { nodes: raw_graph.nodes.map((state) => {
                                var s = state.toString();
                                var node = { id:s, label:s, shape:'box' };
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
                            }),//.filter((n) => !n.reset),
                 edges:raw_graph.edges.map((edge) => {
                                var e = { from:edge.from.toString(), to:edge.to.toString() };
                                if (edge.undo > 0) e.color = 'red';
                                if (edge.reduce) { // Edge becomes more visible proportional to player count.
                                    e.label = edge.reduce + '';
                                    e.width = edge.reduce / 200.0;
                                    if (e.width < 0.5) {
                                        e.color = colorFrom255(200);
                                        if (e.width < 0.1)
                                           e.physics = false;
                                    } else {
                                        e.label = edge.reduce + ' : ' + edge.reduction;
                                        e.reduction = edge.reduction;
                                    }
                                }
                                //if (edge.reduction) e.label = edge.reduce + ' : ' + edge.reduction;
                                //else if (edge.reduce) e.label = edge.reduce + '';
                                return e;
        })});//.filter((e) => e.to !== 'reset')};
    };

    var refreshTaskVis = () => {
        var task = getSelectedTask();

        if (parseInt(userSelElem.selectedIndex) === -1) return;
        if (parseInt(sessionSelElem.selectedIndex) === -1) { // No sessions selected. Go off user selection.
            var sel_users = getSelectedUsers();

            var visG = toNetworkVisFormat( generateActionGraph(sel_users, task) );
            createStateGraph( visG.nodes, visG.edges );

        } else {
            // ... TBI ...
            console.error('Not yet implemented.');
        }
    };
    pub.refreshTaskVis = refreshTaskVis;

    /** DATA */
    var getTasks = (taskName, logs) => {
        return logs.filter((log) => {
            return log[0] === taskName;
        });
    };
    var getFirstTask = (taskName, logs) => {
        for (let i = 0; i < logs.length; i++) {
            if (logs[i][0] === taskName) return logs[i]; }
        return null;
    };

    var parseLog = (json) => {

        // Convert format of NodeJS data logs...
        var logs;
        if (json[0] === '{') {
            let lines = json.match(/[^\r\n]+/g);
            logs = lines.map((line) => {
                let logobj = JSON.parse(line);
                return [
                    logobj["0"],
                    logobj["1"]
                ];
            });
        }
        else logs = JSON.parse(json);

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
        let sessionStartIndices = [];
        for (let i = 0; i < logs.length; i++) {
            if (logs[i][0] === 'startSession')
                sessionStartIndices.push(i);
        }
        // Generate sessions
        for (let i = 0; i < sessionStartIndices.length; i++) {
            let idx = sessionStartIndices[i];
            let sessionLogs = i < sessionStartIndices.length - 1 ?
                              logs.slice(idx, sessionStartIndices[i+1]) :
                              logs.slice(idx);
            console.log(sessionLogs);
            let sessionID = Session.for(sessionLogs);
            users[username].addSession(new Session(sessionID, logs));
            console.log(' > For user: ' + username + '\n >> added session ' + sessionID + '.');
        }

        if (new_user) {
            refreshSessionList();

            // Optional: Generate and export all
            // action graphs of this user to a single JSON file.
            var actionGraphs = generateActionGraphs( [users[username]] );
            var file = new File( [JSON.stringify(actionGraphs)],
                                 username + ".json",
                                { type: "text/plain;charset=utf-8" });
            saveAs(file, username + ".actiongraphs"); // Save JSON file to disk (with FileSaver.js).
        }
    };

    pub.handleFiles = (files) => {

        var userGraphs = [];
        var toStateRepr = (jsonNode) => {
            let r = new StateRepr();
            r.exprs = jsonNode.exprs;
            if (jsonNode.initial) r.initial = jsonNode.initial;
            if (jsonNode.final)     r.final = jsonNode.final;
            return r;
        };
        var toStateGraph = (jsonRep) => {

            // Cast nodes as StateRepr objects.
            if (!Array.isArray(jsonRep.nodes)) {
                let nodeset = new StateReprSet();
                nodeset.states = jsonRep.nodes.states.map((jsonStateRep) => {
                    return toStateRepr( jsonStateRep );
                });
                jsonRep.nodes = nodeset;
            }
            jsonRep.edges.forEach((edge) => {
                if (edge.from && !(edge.from instanceof StateRepr)) edge.from = toStateRepr(edge.from);
                if (edge.to && !(edge.to instanceof StateRepr))     edge.to   = toStateRepr(edge.to);
            });

            return jsonRep;
        };
        var onAllFilesLoaded = () => {
            if (userGraphs.length === 0) return;

            // Get array of graphs for each task from 0 to 70:
            let graphsPerTask = {};
            for (let i = 0; i < 71; i++) {
                let task = i.toString();
                userGraphs.forEach((G) => {
                    if (task in G) {
                        let sg = toStateGraph(G[task]);
                        if (!(task in graphsPerTask))
                            graphsPerTask[task] = [ sg ];
                        else
                            graphsPerTask[task].push( sg );
                    }
                });
            }

            // For each task, merge all loaded graphs into a single state graph.
            for (let i = 0; i < 71; i++) {
                let task = i.toString();
                if (task in graphsPerTask) {
                    graphsPerTask[task] = mergeStateGraphs( graphsPerTask[task] );
                }
            }

            // Export the merged graphs to a single file.
            var file = new File( [JSON.stringify(graphsPerTask)],
                                 "merged.json",
                                { type: "text/plain;charset=utf-8" });
            saveAs(file, "merged.mergedgraph"); // Save JSON file to disk (with FileSaver.js).
        };

        var commonConceptsFromEdges = (edges) => {
            let concepts = {};
            edges.forEach((e) => {
                if (e.reduction && !(e.reduction in concepts))
                    concepts[e.reduction] = true;
            });
            return Object.keys(concepts);
        };

        var cleanXs = (s) => {
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
        var __TEST_conceptApply = () => {
            let knowledge = {};

            let nov = applyConceptToKnowledgeHierarchy( 'Apply(Lambda(x), star) → star', knowledge );
            console.log('Knowledge: ', knowledge);
            console.log('Novelty: ', nov); // 4, 3, 0 bc x to Lambda, star to Apply, Lambda to Apply

            nov = applyConceptToKnowledgeHierarchy( 'Apply(Lambda(xx), star) → star', knowledge );
            console.log('Knowledge: ', knowledge);
            console.log('Novelty: ', nov); // 1, 1, 0 bc xx to Lambda

            nov = applyConceptToKnowledgeHierarchy( 'Apply(Lambda(Equal(x, x)), star) → Equal(star, star)', knowledge );
            console.log('Knowledge: ', knowledge);
            console.log('Novelty: ', nov); // 1, 3, 0 bc Equal to Lambda, x twice to Equal

        };
        var stripConceptName = (e) => {
            if (e.indexOf('(') > -1)
                return e.substring(0, e.indexOf('('));
            else
                return e;
        };
        var getConceptParams = (e) => {
            e = e.trim();
            if (e.indexOf('→') > -1) e = e.substring(0, e.indexOf('→')).trim();
            if (e.indexOf('(') > -1) e = e.substring(e.indexOf('(') + 1);
            else return [];
            if (e.lastIndexOf(')') > -1) e = e.substring(0, e.lastIndexOf(')'));
            e = e.replace(',', ' ');
            return argsForExprString(e);
        };
        var mergeNovelty = (n1, n2) => {
            return {
                global:n1.global+n2.global,
                local:n1.local+n2.local,
                contextual:n1.contextual+n2.contextual
            };
        };
        var zeroNovelty = () => {
            return {
                global:0,
                local:0,
                contextual:0
            };
        };
        var applyConceptToKnowledgeHierarchy = (concept, hierarchy, global_hierarchy, localized=false) => {
            if (!global_hierarchy) global_hierarchy = hierarchy;
            let conceptName = stripConceptName(concept);
            if (conceptName === 'Place' || conceptName === 'Detach') return zeroNovelty();
            let conceptParams = getConceptParams(concept);
            let novelty = zeroNovelty();
            let createEmptyObjArray = (len) => {
                return Array.apply(null, Array(len)).map(() => { return {}; });
            };
            let paramArrayForLength = (conceptNode, len, name) => {
                if (!('versions' in conceptNode))
                    conceptNode.versions = {};
                if (!(len.toString() in conceptNode.versions)) {
                    if (len === 0)
                        conceptNode.versions[len.toString()] = name;
                    else
                        conceptNode.versions[len.toString()] = createEmptyObjArray(len);
                }
                return conceptNode.versions[len.toString()];
            };

            if (conceptName in hierarchy) {
                // This alters hierarchy[conceptName][i] in-position, returning novelty.
                let hierarchyParams = paramArrayForLength(hierarchy[conceptName], conceptParams.length, conceptName);
                if (Array.isArray(hierarchyParams)) { // Recurse if array.
                    let innerComparisons = conceptParams.map((param, i) => applyConceptToKnowledgeHierarchy(param, hierarchyParams[i], global_hierarchy, localized));
                    novelty = innerComparisons.reduce((p, c) => mergeNovelty(p, c), novelty); // merge inner novelty scores
                }
            }
            else if(hierarchy != global_hierarchy) {

                //Concept is 'new' at a local level.
                if (!localized) {
                    novelty.local += 1;
                    //console.log(' >> new local concept: ', conceptName, 'in hier', hierarchy);
                }

                hierarchy[conceptName] = {};
                let a = paramArrayForLength(hierarchy[conceptName], conceptParams.length, conceptName);
                if (Array.isArray(a)) {
                    let innerComparisons = a.map((obj, i) => applyConceptToKnowledgeHierarchy(conceptParams[i], a[i], global_hierarchy, true));
                    novelty = innerComparisons.reduce((p, c) => mergeNovelty(p, c), novelty); // merge inner novelty scores
                } else {
                    //console.log('>>>', conceptName, hierarchy[conceptName], a);
                }
            }

            if (!(conceptName in global_hierarchy)) { // New global concept.
                novelty.global += 1;
                global_hierarchy[conceptName] = {};
                let a = paramArrayForLength(global_hierarchy[conceptName], conceptParams.length, conceptName);
                if (Array.isArray(a)) {
                    let innerComparisons = a.map((obj, i) => applyConceptToKnowledgeHierarchy(conceptParams[i], a[i], global_hierarchy, localized));
                    novelty = innerComparisons.reduce((p, c) => mergeNovelty(p, c), novelty); // merge inner novelty scores
                }
            } else if (hierarchy != global_hierarchy) {
                let a = paramArrayForLength(global_hierarchy[conceptName], conceptParams.length, conceptName);
                if (Array.isArray(a)) {
                    let innerComparisons = a.map((obj, i) => applyConceptToKnowledgeHierarchy(conceptParams[i], a[i], global_hierarchy, true));
                    novelty = innerComparisons.reduce((p, c) => mergeNovelty(p, c), novelty); // merge inner novelty scores
                }
            }

            return novelty;
        };

        var displayStateGraphFromJSON = (json) => {

            // DEBUG
            //__TEST_conceptApply();

            let knowledge = {};

            let commonConcepts = '';
            let graphs = JSON.parse(json);

            for (let i = 0; i < 71; i++) {
                let k = i.toString();

                let G = toStateGraph( graphs[k] );
                let visG = toNetworkVisFormat( G );

                let concepts = cleanXs(stringsToShapes(commonConceptsFromEdges(visG.edges).reduce((p, c) => p + c + '\n', '').trim()));
                if (i === 21 || i === 25) {
                    concepts += '\nCond(false, ★, null) → ★';
                }
                if (i < 61) {
                    let novelty = zeroNovelty();
                    concepts.split('\n').forEach((c) => {
                        novelty = mergeNovelty( applyConceptToKnowledgeHierarchy(c, knowledge), novelty );
                    });
                    console.log('Level ' + i + ' novelty: ', novelty);
                }

                commonConcepts += k + '\n' + concepts + '\n\n';

                if (k === '60')
                    createStateGraph( visG.nodes, visG.edges );
            }

            console.warn(knowledge);

            // List concepts used.
            $('#conceptsTextarea').text( commonConcepts );

        };

        var filesLoaded = 0;
        var numFiles = files.length;
        for (let i = 0; i < numFiles; i++) {
            let file = files[i];
            let filename = file.name;

            let reader = new FileReader();
            reader.onload = (e) => {

                var contents = e.target.result;
                console.log('Read file "' + filename + '"...');

                if (filename.indexOf('.actiongraphs') > -1)
                    userGraphs.push( JSON.parse(contents) );
                else if (filename.indexOf('.mergedgraph') > -1)
                    displayStateGraphFromJSON(contents);
                else
                    parseLog(contents);

                filesLoaded++;
                if (filesLoaded === numFiles)
                    onAllFilesLoaded();
            };

            reader.readAsText(file);
        }
    };

    return pub;
})();
