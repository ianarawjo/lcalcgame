'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

/** Logging singleton.
 * Logs to internal JSON, local server (if run from localhost),
 * and online GDIAC server (if run online).
 * @module logger
 */

var Logger = function () {

    var __GAME_ID = 7017017;
    var __VERSION_ID = 0.54;
    var __OFFLINE_NAME_PROMPT = false;
    var __RUNNING_LOCALLY = location.hostname === "localhost" || location.hostname === "127.0.0.1";
    var __LOCAL_LOGGING = false && __RUNNING_LOCALLY;
    var __LOCAL_LOGGER_PORT = 3333;
    var __GDIAC_BASEURL = 'http://gdiac.cs.cornell.edu/research_games/';
    var __PAGE_LOAD_URL = __GDIAC_BASEURL + 'page_load.php';
    var __TASK_BEGIN_URL = __GDIAC_BASEURL + 'player_quest.php';
    var __TASK_END_URL = __GDIAC_BASEURL + 'player_quest_end.php';
    var __RECORD_ACTION_URL = __GDIAC_BASEURL + 'player_action.php';

    var pub = {};
    var currentUserID = null;
    var currentSessionID = null;
    var taskSequenceID = 0;
    var currentTaskID = null;
    var dynamicTaskID = null;

    var __IS_LOGGING = true;
    pub.toggleLogging = function (shouldLog) {
        __IS_LOGGING = shouldLog;
        isOfflineSession = !shouldLog;
    };
    pub.isLogging = function () {
        return __IS_LOGGING;
    };

    var __ACTION_ID_MAP = {
        'state-save': 1,
        'state-restore': 2,
        'victory': 3,
        'bag-spill': 4,
        'clicked-to-continue': 5,
        'reduction-lambda': 6,
        'reduction': 7,
        'faded-expr': 8,
        'detached-expr': 9,
        'detach-commit': 10,
        'toolbox-dragout': 11,
        'toolbox-remove': 12,
        'moved': 13,
        'placed-expr': 14,
        'bag-add': 15,
        'toolbox-reject': 16,
        'toolbox-addback': 17,
        'game-complete': 18
    };

    pub.playerId = null;

    // Static logging. (as backup)
    var isOfflineSession = false;
    var static_log = [];
    var logStatic = function logStatic(funcname, data, uploaded) {
        if (!uploaded) data['error_message'] = 'This log failed to upload to the server.';
        static_log.push([funcname, data]);
        //console.log('Log static: ', funcname, data);

        if (__LOCAL_LOGGING) {
            var xhr = new XMLHttpRequest();
            xhr.open("POST", 'http://localhost:' + __LOCAL_LOGGER_PORT, true);
            xhr.setRequestHeader('Content-Type', 'application/json');
            xhr.send(JSON.stringify([funcname, data], null, 2));
        }
    };

    /** Thanks to aroth @ SO:
        http://stackoverflow.com/a/6566471 */
    var SERIALIZE = function SERIALIZE(paramobj) {
        var str = "";
        for (var key in paramobj) {
            if (str !== "") str += "&";
            str += key + "=" + encodeURIComponent(paramobj[key]);
        }
        return str;
    };
    var HTTP_GET = function HTTP_GET(url, paramobj, onSuccess, onFail) {
        if (isOfflineSession) {
            onFail(); // Fail immediately if session is offline.
            return;
        }

        $.ajax({
            type: "GET",
            url: url,
            data: paramobj,
            async: true,
            dataType: 'jsonp', //you may use jsonp for cross origin request
            crossDomain: true,
            success: function success(data, status, xhr) {
                //console.log(data);
                onSuccess(JSON.stringify(data));
            },
            error: function error(xhr, status, err) {
                //console.error('@ HTTP_GET: Response status: ' + xhr.status);
            }
        });

        /*var req = new XMLHttpRequest();
        req.onreadystatechange = function() {
            if (req.readyState == 4 && req.status == 200) onSuccess(req.responseText);
            else if (req.readyState == 4) {
                console.error('@ HTTP_GET: Response status: ' + req.status);
                onFail();
            }
        }
        req.open("GET", url + '?' + SERIALIZE(paramobj), true); // true for asynchronous
        req.send(null);*/
    };
    var BASE_PARAMS = function BASE_PARAMS() {
        return { 'game_id': __GAME_ID, 'client_timestamp': Date.now() };
    };
    var SESSION_BASE_PARAMS = function SESSION_BASE_PARAMS() {
        var o = BASE_PARAMS();
        o['version_id'] = __VERSION_ID;
        o['user_id'] = currentUserID;
        o['session_id'] = currentSessionID;
        return o;
    };
    var ACTION_SEQ_ID = 0;
    var ACTION_BASE_PARAMS = function ACTION_BASE_PARAMS() {
        var o = SESSION_BASE_PARAMS();
        o['quest_id'] = currentTaskID;
        o['session_seq_id'] = taskSequenceID;
        o['quest_seq_id'] = ACTION_SEQ_ID; // not sure what this is for, but it must be set.
        o['dynamic_quest_id'] = dynamicTaskID;
        return o;
    };

    var getFromCookie = function getFromCookie(cookieName) {
        var cval = getCookie(cookieName);
        if (!cval || cval.trim().length === 0) return null;else return cval;
    };
    var storeCookie = function storeCookie(cname, cval) {
        setCookie(cname, cval);
    };
    var sessionBegan = function sessionBegan() {
        return currentUserID !== null && currentSessionID !== null;
    };
    pub.sessionBegan = sessionBegan;
    pub.startSession = function () {
        return new Promise(function (resolve, reject) {

            var userID = getFromCookie('user_id');
            var cond = getFromCookie('cond');
            var params = BASE_PARAMS();
            if (userID) params['user_id'] = userID;

            // Get session ID from GET request:
            // * (also generates user ID if necessary)
            HTTP_GET(__PAGE_LOAD_URL, params, function (response) {

                var json = JSON.parse(response);
                var sessionID = json['session_id'];

                if (!userID) {
                    // Gets generated user ID + stores as cookie in client's browser.
                    userID = json['user_id'];
                    //cond = (Math.random() < 0.5 ? 'A' : 'B');
                    cond = 'A'; // fading ON
                    storeCookie('user_id', userID);
                    storeCookie('cond', cond);
                }

                currentUserID = userID;
                currentSessionID = sessionID;
                console.log('@ Logger: Began session with UN ' + userID + ' and SID ' + sessionID + '.');
                logStatic('startSession', json, true);
                resolve({ 'user_id': userID, 'session_id': sessionID, 'cond': cond });
            }, function () {

                // Rejected response. Create dummy ID and session ID to let user play game.
                if (__OFFLINE_NAME_PROMPT) currentUserID = window.prompt('Welcome! Please enter your name.', 'unknown');else if (pub.playerId) currentUserID = pub.playerId;else currentUserID = Date.now();
                currentSessionID = Date.now();

                if (!cond) {
                    cond = Math.random() < 0.5 ? 'A' : 'B';
                    storeCookie('cond', cond);
                }

                isOfflineSession = true;
                logStatic('startSession', { 'user_id': currentUserID, 'session_id': currentSessionID, 'message': 'static_session' }, false);
                console.warn('Could not start online session. Starting with unlogged UN and SID.');
                resolve({ 'user_id': currentUserID, 'session_id': currentSessionID, 'cond': cond }); // ugh
            });
        });
    };

    var taskBegan = function taskBegan() {
        return dynamicTaskID !== null && currentTaskID !== null;
    };
    pub.startTask = function (taskID) {
        var data = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;

        return new Promise(function (resolve, reject) {

            if (!sessionBegan()) {
                console.warn('@ startTask: Warning: Unknown user ID and/or session ID!');
                reject();
            } else if (taskBegan()) {
                console.warn('@ startTask: Warning: Task ' + currentTaskID + ' already running!');
                reject();
            }

            //console.log('@ Logger: Started task ' + taskID);

            var params = SESSION_BASE_PARAMS();
            params['quest_id'] = taskID;
            params['session_seq_id'] = taskSequenceID;
            if (data) params['quest_detail'] = data;

            HTTP_GET(__TASK_BEGIN_URL, params, function (response) {
                //console.log('LOGGER: posted task ' + taskID + ' with response: ', response);
                var json = JSON.parse(response);
                currentTaskID = taskID;
                dynamicTaskID = json['dynamic_quest_id'];
                params['dynamic_quest_id'] = dynamicTaskID;
                logStatic('startTask', params, true);
                resolve();
            }, function () {
                currentTaskID = taskID;
                dynamicTaskID = Date.now(); // for lack of a better idea.
                logStatic('startTask', params, false);
                reject('Failed to tell server that task ' + taskID + ' has started.');
            });
        });
    };
    pub.endTask = function (taskID) {
        return new Promise(function (resolve, reject) {

            if (!taskBegan()) {
                console.warn('@ endTask: Warning: No task was begun.');
                reject();
            }

            var params = SESSION_BASE_PARAMS();
            params['quest_id'] = taskID;
            params['session_seq_id'] = taskSequenceID;
            params['dynamic_quest_id'] = dynamicTaskID;

            //console.log('@ Logger: Ended task ' + taskID);

            currentTaskID = null;
            dynamicTaskID = null;
            taskSequenceID++;

            HTTP_GET(__TASK_END_URL, params, function (response) {
                logStatic('endTask', params, true);
                resolve();
            }, function () {
                logStatic('endTask', params, false);
                reject('Failed to tell server that task ' + taskID + ' has ended.');
            });
        });
    };
    pub.transitionToTask = function (taskID) {
        var data = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;

        if (taskBegan()) {
            var startNextTask = function startNextTask() {
                return pub.startTask(taskID, data);
            };
            return pub.endTask(currentTaskID).then(startNextTask, startNextTask); // start next task on both rejection and resolution
        } else {
            return pub.startTask(taskID, data);
        }
    };

    pub.log = function (actionID, data) {
        return pub.recordAction(actionID, data).catch(function (err) {
            //console.error('@ Logger.log: ' + err);
        });
    };
    pub.recordAction = function (actionID, data) {
        return new Promise(function (resolve, reject) {

            // For now...
            //console.log('@ Logger.log: ', actionID, data);

            if (data && (typeof data === 'undefined' ? 'undefined' : _typeof(data)) === 'object') data = JSON.stringify(data);

            var int_actionID = actionID;
            if (typeof actionID === 'string') {
                if (actionID in __ACTION_ID_MAP) int_actionID = __ACTION_ID_MAP[actionID];else int_actionID = 10000; // this is an unknown action; but still log it.
            }

            var srv_params = ACTION_BASE_PARAMS();
            var loc_params = ACTION_BASE_PARAMS();
            loc_params['action_id'] = actionID;
            srv_params['action_id'] = int_actionID;
            if (data) {
                loc_params['action_detail'] = data;
                srv_params['action_detail'] = data;
            }
            ACTION_SEQ_ID++;

            //console.log('@ Logger.log: ', actionID, srv_params);

            if (!taskBegan()) {
                logStatic('action', loc_params, false);
                reject('No current task.');
                return;
            }

            HTTP_GET(__RECORD_ACTION_URL, srv_params, function (response) {
                //console.log('LOGGER: recorded action ' + actionID + ' with response: ', response);
                logStatic('action', loc_params, true);
                resolve();
            }, function () {
                logStatic('action', loc_params, false);
                reject('Failed to upload action "' + actionID + '" to server.');
            });
        });
    };

    pub.download = function () {

        // create blob of data
        var blob = new Blob([JSON.stringify(static_log, null, 2)], { type: "text/plain;charset=utf-8" });

        // download as txt file json
        saveAs(blob, 'log_' + new Date().getTime().toString() + '.json');
    };

    return pub;
}();