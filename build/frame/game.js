'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * A Level is a complete description of a single scenario in this programming game.
 * Given a set of "expressions", a player must manipulate those expressions to
 * reach a "goal" state, with optional support from a "toolbox" of primitive expressions.
 * (*This may change in time.*) */

var Level = function () {
    function Level(expressions, goal) {
        var toolbox = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;
        var globals = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : null;

        _classCallCheck(this, Level);

        this.exprs = expressions;
        this.goal = goal;
        this.toolbox = toolbox;
        this.globals = globals;
    }

    _createClass(Level, [{
        key: 'serialize',


        // For saving state.
        // * Returns a (stringifiable) JSON object
        // * representing the level, in a similar format to that found
        // * in chapter JSON files.
        value: function serialize() {
            var toString = function toString(e) {
                return e.toJavaScript();
            };
            var e = {
                board: this.exprs.map(toString), // Board is now a list of javascript code snippets...
                goal: this.goal.serialize() // Goal is the same as it was when loaded from the JSON file.
            };
            if (this.toolbox) e.toolbox = this.toolbox.map(toString); // Toolbox is a list of javascript code snippets, like board.
            if (this.globals) e.globals = this.globals.serialize(); // Environment -> key-value dict for variable bindings.
            return e;
        }

        // Builds a single Stage from the level description,
        // and returns it.
        // FUTURE: (Should take a state graph to persist the state logs across resets to a level.)
        // * The layout should be generated automatically, and consistently.
        // * That way a higher function can 'parse' a text file description of levels --
        // * written in code, for instance -- and generate the entire game on-the-fly.

    }, {
        key: 'build',
        value: function build(canvas) {
            var priorStateGraph = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;


            var stage = new ReductStage(canvas);

            // Seed the random number generator so that while randomly generated,
            // levels appear the same each time you play.
            Math.seed = 12045;

            var canvas_screen = stage.boundingSize;

            var assignNodesOnBoard = mag.Stage.getNodesWithClass(AssignExpr, [], true, this.exprs);
            var assignNodesInToolbox = mag.Stage.getNodesWithClass(AssignExpr, [], true, this.toolbox);
            var showEnvironment = this.globals && (Object.keys(this.globals.bindings).length > 0 || assignNodesOnBoard && assignNodesOnBoard.length > 0 || assignNodesInToolbox && assignNodesInToolbox.length > 0);
            var envDisplayWidth = showEnvironment ? 0.10 * canvas_screen.w : 0;

            GLOBAL_DEFAULT_SCREENSIZE = stage.boundingSize;

            var screen = {
                height: canvas_screen.h / 1.4,
                width: (canvas_screen.w - envDisplayWidth) / 1.4,
                y: canvas_screen.h * (1 - 1 / 1.4) / 2.0,
                x: canvas_screen.w * (1 - 1 / 1.4) / 2.0
            };
            var board_packing = this.findFastPacking(this.exprs, screen);
            stage.addAll(board_packing); // add expressions to the stage

            // TODO: Offload this onto second stage?
            var goal_node = this.goal.nodeRepresentation;
            goal_node[1].ignoreGetClassInstance = true;
            var lastChild = goal_node[1].children[goal_node[1].children.length - 1];
            stage.add(goal_node[0]);
            stage.add(goal_node[1]);

            stage._storedGoal = this.goal;

            //goal_node[1].children.forEach((c) => c.update());

            //var toolbox_vis = this.generateToolboxVisual(toolbox_vis);
            //stage.addAll(toolbox_vis);

            stage.uiGoalNodes = [goal_node[0], goal_node[1]];
            stage.goalNodes = goal_node[1].children;

            // UI Buttons
            stage.buildUI(showEnvironment, envDisplayWidth);
            // Toolbox
            if (this.toolbox) {
                this.toolbox.forEach(function (item) {
                    stage.add(item);
                    stage.toolbox.addExpression(item, false);
                });
                stage.toolbox.resizeToFitItems();
            }
            // Environment
            if (this.globals) {
                var _iteratorNormalCompletion = true;
                var _didIteratorError = false;
                var _iteratorError = undefined;

                try {
                    for (var _iterator = this.globals.names()[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                        var name = _step.value;

                        stage.environment.update(name, this.globals.lookup(name).clone());
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
            }

            // Checks if the player has completed the level.
            var goal = this.goal;
            stage.expressionNodes = function () {
                // TODO: Offshore the goal nodes onto some other stage.
                var nodes = [];
                var expr;
                var _iteratorNormalCompletion2 = true;
                var _didIteratorError2 = false;
                var _iteratorError2 = undefined;

                try {
                    for (var _iterator2 = this.nodes[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                        var n = _step2.value;

                        if (this.uiNodes.indexOf(n) > -1 || n.constructor.name === 'Rect' || n.constructor.name === 'ImageRect' || n.constructor.name === 'MirrorShatterEffect' || !(n instanceof Expression) || n.fadingOut || n.toolbox || n.isSnapped()) continue;else if (n instanceof NotchHangerExpr) continue;
                        nodes.push(n);
                    }
                } catch (err) {
                    _didIteratorError2 = true;
                    _iteratorError2 = err;
                } finally {
                    try {
                        if (!_iteratorNormalCompletion2 && _iterator2.return) {
                            _iterator2.return();
                        }
                    } finally {
                        if (_didIteratorError2) {
                            throw _iteratorError2;
                        }
                    }
                }

                return nodes;
            }.bind(stage);
            stage.notchHangers = function () {
                var hangers = [];
                var _iteratorNormalCompletion3 = true;
                var _didIteratorError3 = false;
                var _iteratorError3 = undefined;

                try {
                    for (var _iterator3 = this.nodes[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
                        var n = _step3.value;

                        if (n instanceof NotchHangerExpr) {
                            n.pos = { x: 0, y: 80 + 160 * hangers.length };
                            n.anchor = { x: 0, y: 0 };
                            hangers.push(n);
                        }
                    }
                } catch (err) {
                    _didIteratorError3 = true;
                    _iteratorError3 = err;
                } finally {
                    try {
                        if (!_iteratorNormalCompletion3 && _iterator3.return) {
                            _iterator3.return();
                        }
                    } finally {
                        if (_didIteratorError3) {
                            throw _iteratorError3;
                        }
                    }
                }

                return hangers;
            }.bind(stage)();
            stage.toolboxNodes = function () {
                return this.nodes.filter(function (n) {
                    return n.toolbox && n.toolbox instanceof Toolbox && !n.fadingOut;
                });
            }.bind(stage);

            stage.testBoard = function (exprs) {
                var _this2 = this;

                var checkUnpaired = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;

                var matching = goal.test(exprs.map(function (n) {
                    return n.clone();
                }), this.environmentDisplay);
                if (matching && matching.unpaired) {
                    if (checkUnpaired && !stage.mightBeCompleted()) {
                        Animate.wait(500).after(function () {
                            var _iteratorNormalCompletion4 = true;
                            var _didIteratorError4 = false;
                            var _iteratorError4 = undefined;

                            try {
                                var _loop = function _loop() {
                                    var idx = _step4.value;

                                    var blink = function blink(e) {
                                        return Animate.blink(e, 2500, [1, 0, 0], 5).after(function () {
                                            blink(e);
                                        });
                                    };
                                    blink(exprs[idx]);
                                };

                                for (var _iterator4 = matching.unpaired[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
                                    _loop();
                                }
                            } catch (err) {
                                _didIteratorError4 = true;
                                _iteratorError4 = err;
                            } finally {
                                try {
                                    if (!_iteratorNormalCompletion4 && _iterator4.return) {
                                        _iterator4.return();
                                    }
                                } finally {
                                    if (_didIteratorError4) {
                                        throw _iteratorError4;
                                    }
                                }
                            }
                        });
                    }
                } else if (matching) {
                    // Pair nodes so that goal nodes reference the actual nodes on-screen (they aren't clones).
                    // goal.test returns an array of indexes, referring to the indexes of the expressions passed into the test,
                    // ordered by the order of the goal nodes displayed on screen. So the info needed to pair an expression to a goal node.
                    // With this we can reconstruct the actual pairing for the nodes on-screen (not clones).
                    if (exprs.length === 0 && matching.length === 1) {
                        // Memory state match; glow the environment value instead...
                        var e = this.environmentDisplay.getBinding(matching[0]).getExpr();
                        var pairs = [[e, this.goalNodes[0].getValue()]];
                        return pairs;
                    } else {
                        var _pairs = matching.map(function (j, i) {
                            return [exprs[j], _this2.goalNodes[i]];
                        });
                        return _pairs;
                    }
                }
                return false;
            }.bind(stage);
            stage.isCompleted = function () {
                return this.testBoard(this.expressionNodes());
            }.bind(stage);

            // Default animation on expression creation:
            stage.expressionNodes().forEach(function (n) {
                n.scale = { x: 0.5, y: 0.5 };
                n.anchor = { x: 0.5, y: 0.5 };
                // Adjust positions to account for the new anchor
                n.pos = { x: n.pos.x + 0.5 * n.size.w, y: n.pos.y + 0.5 * n.size.h };
                Animate.tween(n, { scale: { x: 1, y: 1 } }, 500, function (elapsed) {
                    return Math.pow(elapsed, 0.3);
                });
            });
            stage.goalNodes.forEach(function (n) {
                n.pos = addPos(n.pos, { x: n.size.w / 2.0, y: n.size.h / 2.0 });
                n.anchor = { x: 0.5, y: 0.5 };
                n.scale = { x: 0.5, y: 0.5 };
                Animate.tween(n, { scale: { x: 1, y: 1 } }, 500, function (elapsed) {
                    return Math.pow(elapsed, 0.3);
                });
            });
            var toolboxNodes = stage.toolboxNodes();
            var numToolboxNodes = toolboxNodes.length;
            toolboxNodes.forEach(function (n, i) {
                var final_pos = n.pos;
                var scale = n.scale.x;
                var delay = numToolboxNodes <= 8 ? function (i) {
                    return 500 + i * 100;
                } : function (i) {
                    return 300 + i * 50;
                };
                n.pos = addPos(n.pos, { x: 400, y: 0 });
                n.scale = { x: 0.8, y: 0.8 };
                Animate.tween(n, { pos: final_pos, scale: { x: scale, y: scale } }, delay(i), function (elapsed) {
                    return Math.pow(elapsed, 0.3);
                });
            });

            // Do final setup inside the nodes. This
            // could be necessary for expressions that need information
            // from the stage itself to finish constructing,
            // like ReductStageExpr.
            stage.finishLoading();

            return stage;
        }

        // Parse a shorthand description of a level
        // * In Scheme-esque format, with _ for holes:
        // * '(if _ triangle star) (== triangle _) (rect)'
        // NOTE: This does not do error checking! Make sure your desc is correct.

    }, {
        key: 'findFastPacking',


        // Unreachable....


        // David's rather terrible packing algorithm. Used if there are a
        // large amount of expressions to pack. It greedily splits the
        // expressions into rows, then lays out the rows with some random
        // deviation to hide that fact.
        value: function findFastPacking(exprs, screen) {
            var y = screen.y;
            var dy = 0;
            var x = screen.x;
            var rows = [];
            var row = [];
            // Greedily distribute the expressions into rows.
            var _iteratorNormalCompletion5 = true;
            var _didIteratorError5 = false;
            var _iteratorError5 = undefined;

            try {
                for (var _iterator5 = exprs[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
                    var e = _step5.value;

                    var size = e.size;
                    if (x + size.w < screen.width) {
                        dy = Math.max(size.h, dy);
                    } else {
                        y += dy;
                        dy = size.h;
                        x = screen.x;
                        rows.push(row);
                        row = [];
                    }
                    e.pos = { x: x, y: y };
                    x += size.w;
                    row.push(e);
                }
            } catch (err) {
                _didIteratorError5 = true;
                _iteratorError5 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion5 && _iterator5.return) {
                        _iterator5.return();
                    }
                } finally {
                    if (_didIteratorError5) {
                        throw _iteratorError5;
                    }
                }
            }

            if (row.length) rows.push(row);
            var result = [];

            // Lay out the rows evenly, with randomness to hide the
            // grid-based nature of the algorithm.
            var hPadding = (screen.height - y) / (rows.length + 1);
            y = screen.y + hPadding;
            var _iteratorNormalCompletion6 = true;
            var _didIteratorError6 = false;
            var _iteratorError6 = undefined;

            try {
                for (var _iterator6 = rows[Symbol.iterator](), _step6; !(_iteratorNormalCompletion6 = (_step6 = _iterator6.next()).done); _iteratorNormalCompletion6 = true) {
                    var _row = _step6.value;

                    var _dy = 0;
                    var width = 0;
                    var _iteratorNormalCompletion7 = true;
                    var _didIteratorError7 = false;
                    var _iteratorError7 = undefined;

                    try {
                        for (var _iterator7 = _row[Symbol.iterator](), _step7; !(_iteratorNormalCompletion7 = (_step7 = _iterator7.next()).done); _iteratorNormalCompletion7 = true) {
                            var _e = _step7.value;

                            width += _e.size.w;
                        }
                    } catch (err) {
                        _didIteratorError7 = true;
                        _iteratorError7 = err;
                    } finally {
                        try {
                            if (!_iteratorNormalCompletion7 && _iterator7.return) {
                                _iterator7.return();
                            }
                        } finally {
                            if (_didIteratorError7) {
                                throw _iteratorError7;
                            }
                        }
                    }

                    var wPadding = (screen.width - width) / (_row.length + 1);

                    var _x5 = screen.x + wPadding;
                    var _iteratorNormalCompletion8 = true;
                    var _didIteratorError8 = false;
                    var _iteratorError8 = undefined;

                    try {
                        for (var _iterator8 = _row[Symbol.iterator](), _step8; !(_iteratorNormalCompletion8 = (_step8 = _iterator8.next()).done); _iteratorNormalCompletion8 = true) {
                            var _e2 = _step8.value;

                            var _size = _e2.size;
                            // random() call allows the x and y-position to vary
                            // by up to +/- 0.4 of the between-row/between-expr
                            // padding. This helps make it look a little less
                            // grid-based.
                            _e2.pos = {
                                x: _x5 + (Math.seededRandom() - 0.5) * 0.8 * wPadding,
                                y: y + (Math.seededRandom() - 0.5) * 0.8 * hPadding
                            };
                            result.push(_e2);

                            _x5 += wPadding + _size.w;
                            _dy = Math.max(_dy, _size.h);
                        }
                    } catch (err) {
                        _didIteratorError8 = true;
                        _iteratorError8 = err;
                    } finally {
                        try {
                            if (!_iteratorNormalCompletion8 && _iterator8.return) {
                                _iterator8.return();
                            }
                        } finally {
                            if (_didIteratorError8) {
                                throw _iteratorError8;
                            }
                        }
                    }

                    y += hPadding + _dy;
                }
            } catch (err) {
                _didIteratorError6 = true;
                _iteratorError6 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion6 && _iterator6.return) {
                        _iterator6.return();
                    }
                } finally {
                    if (_didIteratorError6) {
                        throw _iteratorError6;
                    }
                }
            }

            return result;
        }

        // Ian's really inefficient packing algorithm:
        // * 1. Put the expressions in random places.
        // * 2. Check if they overlap.
        // * --> If so, try again.
        // * --> Otherwise, add to a list.
        // * 3. When the list of candidates reaches a threshold #, quit.
        // * 4. Select the candidate with the greatest pairwise distance between expressions.

    }, {
        key: 'findBestPacking',
        value: function findBestPacking(exprs, screen) {

            var es = exprs; // clones of the initial expressions to place on the board
            var _this = this;
            if (!Array.isArray(es)) es = [es];

            // Bounds cache seems to greatly destroy performance
            var sizeCache = {};
            var getSize = function getSize(e) {
                // TODO: a lot of time spent in toString
                if (!sizeCache[e]) sizeCache[e] = e.absoluteSize;
                return sizeCache[e];
            };

            var candidates = [];
            var CANDIDATE_THRESHOLD = 10;
            var iterations = 0;
            while (candidates.length < CANDIDATE_THRESHOLD && iterations < 10000) {
                iterations++;

                // 1. Put the expressions in random places.
                var _iteratorNormalCompletion9 = true;
                var _didIteratorError9 = false;
                var _iteratorError9 = undefined;

                try {
                    for (var _iterator9 = es[Symbol.iterator](), _step9; !(_iteratorNormalCompletion9 = (_step9 = _iterator9.next()).done); _iteratorNormalCompletion9 = true) {
                        var e = _step9.value;

                        var size = getSize(e);

                        var y = 0;
                        while (y < 50) {
                            y = Math.seededRandom() * (screen.height - size.h) + screen.y;
                        }

                        var x = Math.max(Math.seededRandom() * (screen.width - size.w) + screen.x, screen.x);

                        e.pos = { x: x,
                            y: y };
                    }

                    // 2. Check if they overlap.
                } catch (err) {
                    _didIteratorError9 = true;
                    _iteratorError9 = err;
                } finally {
                    try {
                        if (!_iteratorNormalCompletion9 && _iterator9.return) {
                            _iterator9.return();
                        }
                    } finally {
                        if (_didIteratorError9) {
                            throw _iteratorError9;
                        }
                    }
                }

                var overlap = false;
                var _iteratorNormalCompletion10 = true;
                var _didIteratorError10 = false;
                var _iteratorError10 = undefined;

                try {
                    for (var _iterator10 = es[Symbol.iterator](), _step10; !(_iteratorNormalCompletion10 = (_step10 = _iterator10.next()).done); _iteratorNormalCompletion10 = true) {
                        var _e3 = _step10.value;
                        var _iteratorNormalCompletion11 = true;
                        var _didIteratorError11 = false;
                        var _iteratorError11 = undefined;

                        try {
                            for (var _iterator11 = es[Symbol.iterator](), _step11; !(_iteratorNormalCompletion11 = (_step11 = _iterator11.next()).done); _iteratorNormalCompletion11 = true) {
                                var f = _step11.value;

                                if (_e3 == f) continue;
                                if (intersects(_e3.absoluteBounds, f.absoluteBounds)) {
                                    overlap = true;
                                    break;
                                }
                            }
                        } catch (err) {
                            _didIteratorError11 = true;
                            _iteratorError11 = err;
                        } finally {
                            try {
                                if (!_iteratorNormalCompletion11 && _iterator11.return) {
                                    _iterator11.return();
                                }
                            } finally {
                                if (_didIteratorError11) {
                                    throw _iteratorError11;
                                }
                            }
                        }

                        if (overlap === true) break;
                    }

                    // --> Otherwise, add to the list of candidates.
                } catch (err) {
                    _didIteratorError10 = true;
                    _iteratorError10 = err;
                } finally {
                    try {
                        if (!_iteratorNormalCompletion10 && _iterator10.return) {
                            _iterator10.return();
                        }
                    } finally {
                        if (_didIteratorError10) {
                            throw _iteratorError10;
                        }
                    }
                }

                if (!overlap) {
                    candidates.push(es);
                }
            }
            // 3. When the list of candidates reaches a threshold #, quit.

            // 4. Select the candidate with the greatest pairwise distance between expressions.
            var len = candidates.length;
            var pairwise_calcs = [];
            var pairwise_keys = [];
            var pairwise_totals = [];
            var keyfor = function keyfor(i, j) {
                if (i < j) return i.toString() + " " + j.toString();else return j.toString() + " " + i.toString();
            };
            var computePairwiseDist = function computePairwiseDist(a, b) {
                var sum = 0;
                var _iteratorNormalCompletion12 = true;
                var _didIteratorError12 = false;
                var _iteratorError12 = undefined;

                try {
                    for (var _iterator12 = a[Symbol.iterator](), _step12; !(_iteratorNormalCompletion12 = (_step12 = _iterator12.next()).done); _iteratorNormalCompletion12 = true) {
                        var _e4 = _step12.value;
                        // f is an expression.
                        var _iteratorNormalCompletion13 = true;
                        var _didIteratorError13 = false;
                        var _iteratorError13 = undefined;

                        try {
                            for (var _iterator13 = b[Symbol.iterator](), _step13; !(_iteratorNormalCompletion13 = (_step13 = _iterator13.next()).done); _iteratorNormalCompletion13 = true) {
                                var _f = _step13.value;
                                // e is an expression.
                                sum += Math.sqrt(Math.pow(_e4.pos.x - _f.pos.x, 2) + Math.pow(_e4.pos.y - _f.pos.y, 2));
                            }
                        } catch (err) {
                            _didIteratorError13 = true;
                            _iteratorError13 = err;
                        } finally {
                            try {
                                if (!_iteratorNormalCompletion13 && _iterator13.return) {
                                    _iterator13.return();
                                }
                            } finally {
                                if (_didIteratorError13) {
                                    throw _iteratorError13;
                                }
                            }
                        }
                    }
                } catch (err) {
                    _didIteratorError12 = true;
                    _iteratorError12 = err;
                } finally {
                    try {
                        if (!_iteratorNormalCompletion12 && _iterator12.return) {
                            _iterator12.return();
                        }
                    } finally {
                        if (_didIteratorError12) {
                            throw _iteratorError12;
                        }
                    }
                }

                return sum;
            };
            for (var i = 0; i < len; i++) {
                pairwise_totals[i] = 0;
                for (var j = 0; j < len; j++) {
                    var key = keyfor(i, j);
                    if (i === j) continue;else if (key in pairwise_calcs) {
                        pairwise_totals[i] += pairwise_calcs[key];
                    } else {
                        pairwise_calcs[key] = computePairwiseDist(candidates[i], candidates[j]);
                        pairwise_totals[i] += pairwise_calcs[key];
                        pairwise_keys.push(key);
                    }
                }
            }

            var max = 0;
            var max_idx = -1;
            for (var _i = 0; _i < len; _i++) {
                if (pairwise_totals[_i] > max) {
                    max = pairwise_totals[_i];
                    max_idx = _i;
                }
            }

            var rtn = candidates[max_idx];
            if (!rtn) {
                rtn = exprs;
            }
            return rtn;
        }
    }], [{
        key: 'getStage',
        value: function getStage() {
            return stage;
        }
    }, {
        key: 'make',
        value: function make(desc) {
            var expr_descs = desc.board;
            var goal_descs = desc.goal;
            var toolbox_descs = desc.toolbox;
            var globals_descs = desc.globals;
            var resources = desc.resources;
            var language = desc.language;
            var macros = desc.macros;
            var typing_options = desc.typing_options;
            var typing_hints = desc.typing_hints;
            var typing_help = desc.typing_help;
            var help_text = desc.help_text;
            var syntax_unlock = desc.syntax_unlock;


            var setupVariant = function setupVariant(variant) {
                if ('board' in variant) expr_descs = variant.board;
                if ('toolbox' in variant) toolbox_descs = variant.toolbox;
                if ('goal' in variant) goal_descs = variant.goal;
                if ('globals' in variant) globals_descs = variant.globals;
                if ('typing_hints' in variant) typing_hints = variant.typing_hints;
                if ('help_text' in variant) help_text = variant.help_text;
            };

            var variant = __ACTIVE_LEVEL_VARIANT == "verbatim_variant" ? "block_variant" : __ACTIVE_LEVEL_VARIANT;
            if (variant && variant in desc) setupVariant(desc[variant]);

            if (help_text && help_text.length > 0) showHelpText(help_text);

            var lvl = new Level(Level.parse(expr_descs, language, macros, typing_options), new Goal(new ExpressionPattern(Level.parse(goal_descs, language, macros, typing_options)), goal_descs, resources.aliens), toolbox_descs ? Level.parse(toolbox_descs, language, macros, typing_options) : null, Environment.parse(globals_descs));

            if (typing_hints) {
                var typing_exprs = mag.Stage.getNodesWithClass(TypeInTextExpr, [], true, lvl.exprs);
                for (var i = 0; i < typing_exprs.length && i < typing_hints.length; i++) {

                    var hint = typing_hints[i];
                    if ((typeof hint === 'undefined' ? 'undefined' : _typeof(hint)) === "object") {
                        typing_exprs[i].enforceHint(hint.hint);
                        if ("syntax_unlock" in hint) {
                            (function () {
                                var syntax_key = hint.syntax_unlock;
                                typing_exprs[i].runOnCommit(function () {
                                    var stage = this.stage;
                                    if (!stage) console.error('Cannot unlock syntax: Expression is not part of stage', this);
                                    stage.unlockSyntax(syntax_key, this);
                                    return Promise.resolve();
                                });
                            })();
                        }
                    } else {
                        typing_exprs[i].enforceHint(hint);
                    }

                    typing_exprs[i].typeBox.update();
                }
            }
            if (typing_help) {
                (function () {
                    var hint_text = typing_help;
                    var onFocus = function onFocus() {
                        showHintText(hint_text);
                    };
                    var onBlur = function onBlur() {
                        hideHintText();
                    };
                    var typing_exprs = mag.Stage.getNodesWithClass(TypeInTextExpr, [], true, lvl.exprs);
                    typing_exprs.forEach(function (e) {
                        e.typeBox.onFocus = onFocus;
                        e.typeBox.onBlur = onBlur;
                    });
                })();
            }

            return lvl;
        }
    }, {
        key: 'splitParen',
        value: function splitParen(s) {
            s = s.trim();
            var depth = 0;
            var paren_idx = 0;
            var expr_descs = [];
            for (var i = 0; i < s.length; i++) {
                if (s[i] === '(') {
                    if (depth === 0) paren_idx = i + 1;
                    depth++;
                } else if (s[i] === ')') {
                    depth--;
                    if (depth === 0) expr_descs.push(s.substring(paren_idx, i));
                }
            }
            if (expr_descs.length === 0) expr_descs.push(s);
            return expr_descs;
        }
    }, {
        key: 'parse',
        value: function parse(desc) {
            var language = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : "reduct-scheme";

            var _this3 = this;

            var macros = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;
            var typing_options = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : null;

            if (desc.length === 0) return [];else if (!Array.isArray(desc) && desc === Object(desc)) {
                // If desc is an object, then it's a globals specifier...
                // TODO: Expand to multiple globals.
                // console.log('Parsing variable goal...', desc);
                var keys = Object.keys(desc);
                return new (ExprManager.getClass('vargoal'))(keys[0], Level.parse(desc[keys[0]], language, macros)[0]);
            }

            if (language === "JavaScript") {
                // Use ES6 parser
                if (Array.isArray(desc)) return desc.map(function (d) {
                    return ES6Parser.parse(d, macros, typing_options);
                });else return [ES6Parser.parse(desc, macros, typing_options)];
            } else if (language === "reduct-scheme" || !language) {
                var descs;

                var _ret4 = function () {

                    // Split string by top-level parentheses.
                    descs = _this3.splitParen(desc);
                    //console.log('descs', descs);

                    // Parse expressions recursively.

                    var es = descs.map(function (expr_desc) {
                        return Level.parseExpr(expr_desc, macros);
                    });
                    var LambdaClass = ExprManager.getClass('lambda_abstraction');
                    es = es.map(function (e) {
                        return e instanceof LambdaHoleExpr ? new LambdaClass([e]) : e;
                    });
                    //console.log('exprs', es);
                    return {
                        v: es
                    };
                }();

                if ((typeof _ret4 === 'undefined' ? 'undefined' : _typeof(_ret4)) === "object") return _ret4.v;
            }
        }
    }, {
        key: 'parseExpr',
        value: function parseExpr(desc) {
            var macros = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;


            var LOCK_MARKER = '/';
            var lock = function lock(e) {
                var locked = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;

                if (locked) e.lock();else e.unlock();
                return e;
            };

            //console.log('parse called with arg: ', desc);
            //if (desc === 10) debugger;
            var toplevel_lock = desc[0] === LOCK_MARKER;
            if (toplevel_lock) desc = desc.substring(1);
            desc = stripParen(desc);

            function splitArgs(s) {
                //console.log('arg is: ', s);
                s = s.trim().replace(/\s+/g, ' '); // clean up the string; replace all whitespace by single space.
                if (s.indexOf(' ') === -1 && s.indexOf('(') === -1) return [s]; // there is nothing to parse
                var depth = 0;
                var expr_idx = 0;
                var paren_locked = false;
                var args = [];
                for (var i = 0; i < s.length; i++) {
                    if (s[i] === '(') {
                        if (depth === 0) {
                            expr_idx = i;
                            paren_locked = i > 0 && s[i - 1] === LOCK_MARKER;
                        }
                        depth++;
                    } else if (s[i] === ')') {
                        depth--;
                    } else if (depth === 0 && s[i] === ' ') {
                        var _desc = s.substring(expr_idx, i);
                        if (paren_locked) _desc = LOCK_MARKER + _desc;
                        args.push(_desc);
                        expr_idx = i + 1;
                        paren_locked = false;
                    }
                }
                if (expr_idx < s.length) {
                    var _desc2 = s.substring(expr_idx);
                    if (paren_locked) _desc2 = LOCK_MARKER + _desc2;
                    args.push(_desc2);
                }
                return args;
            }

            // Parse a single (top-level) expression.
            var args = splitArgs(desc);

            // If there are multiple arguments, parse them recursively, then compress into single expression.
            if (args.length > 1) {

                //console.log('parsing expr with multiple args', args, toplevel_lock);

                var exprs = args.map(function (arg) {
                    return Level.parseExpr(arg, macros);
                });
                //console.log(' >> inner exprs', exprs);
                if (Array.isArray(exprs[0])) {
                    // array of expressions
                    return lock(new Expression(exprs), toplevel_lock);
                } else {
                    // Class name. Invoke the instantiator.
                    var op_class = exprs[0];
                    if (!(op_class instanceof LambdaHoleExpr) && !(op_class instanceof Sequence) && !(op_class instanceof BagExpr) && !(op_class instanceof ArrayObjectExpr) && op_class.length !== exprs.length - 1) {// missing an argument, or there's an extra argument:
                        //console.warn('Operator-argument mismatch with exprs: ', exprs);
                        //console.warn('Continuing...');
                    }
                    for (var i = 1; i < exprs.length; i++) {
                        // Cast the other arguments into expressions.
                        if (Array.isArray(exprs[i])) exprs[i] = new Expression(exprs[i]); // wrap in paren
                        else if (isClass(exprs[i])) {
                                //if (exprs[i].length > 0)
                                //    console.warn('Instantiating expression class ', exprs[i], ' with 0 arguments when it expects ' + exprs[i].length + '.');
                                exprs[i] = constructClassInstance(exprs[i], null);
                            } else if (isInstanceOfClass(exprs[i], Expression)) {} // Nothing to fix.
                            else {
                                    //console.error("Expression ", exprs[i], ' not of known type.');
                                }
                    }
                    if (op_class instanceof LambdaHoleExpr) {
                        var LambdaClass = ExprManager.getClass('lambda_abstraction');
                        var lexp = new LambdaClass([op_class]);
                        for (var _i2 = 1; _i2 < exprs.length; _i2++) {
                            lexp.addArg(exprs[_i2]);
                        }
                        return lock(lexp, toplevel_lock);
                    } else if (op_class instanceof NotchHangerExpr) {
                        op_class.pos = { x: 0, y: 80 };
                        return op_class;
                    } else if (op_class instanceof BagExpr) {
                        var _ret5 = function () {
                            var bag = op_class;
                            var sz = bag.graphicNode.size;
                            var topsz = bag.graphicNode.topSize ? bag.graphicNode.topSize(sz.w / 2.0) : { w: 0, h: 0 };

                            for (var _i3 = 1; _i3 < exprs.length; _i3++) {
                                bag.addItem(exprs[_i3]);
                            } // Set start positions of bag items. If from 1 to 6, arrange like dice dots.
                            if (!(op_class instanceof BracketArrayExpr)) {
                                var dotpos = DiceNumber.drawPositionsFor(exprs.length - 1);
                                if (dotpos.length > 0) {
                                    // Arrange items according to dot positions.
                                    bag.arrangeNicely();
                                } else {
                                    // Arrange items randomly in bag.
                                    exprs.slice(1).forEach(function (e) {
                                        e.pos = { x: (Math.random() + 0.4) * sz.w / 2.0, y: (Math.random() + 0.7) * sz.h / 2.0 };
                                    });
                                }
                            }

                            return {
                                v: lock(bag, toplevel_lock)
                            };
                        }();

                        if ((typeof _ret5 === 'undefined' ? 'undefined' : _typeof(_ret5)) === "object") return _ret5.v;
                    } else if (args[0] in CompareExpr.operatorMap()) {
                        // op name is supported comparison operation like ==, !=, etc
                        //console.log('constructing comparator ' + args[0] + ' with exprs ', exprs.slice(1));
                        var es = exprs.slice(1);es.push(args[0]);
                        return lock(constructClassInstance(op_class, es), toplevel_lock); // pass the operator name to the comparator
                    } else {
                            // console.log(exprs);
                            return lock(constructClassInstance(op_class, exprs.slice(1)), toplevel_lock); // (this is really generic, man)
                        }
                }
            }

            // Handle single arguments
            var arg = args[0];
            var locked = arg.indexOf(LOCK_MARKER) > -1 || toplevel_lock;
            arg = arg.replace(LOCK_MARKER, '');
            var e;
            //console.log('Handling single arg: ', arg);

            // Why can we do this? Because JS allows us to do .length on class names to check # of arguments.
            var op_mappings = {
                'if': ExprManager.getClass('if'),
                'ifelse': ExprManager.getClass('ifelse'),
                'triangle': new (ExprManager.getClass('triangle'))(0, 0, 44, 44),
                'rect': new (ExprManager.getClass('rect'))(0, 0, 44, 44),
                'star': new (ExprManager.getClass('star'))(0, 0, 25, 5),
                'circle': new (ExprManager.getClass('circle'))(0, 0, 22),
                'diamond': new (ExprManager.getClass('diamond'))(0, 0, 44, 44), // for now
                '_': ExprManager.getClass('_'),
                '__': ExprManager.getClass('__'),
                '_b': ExprManager.getClass('_b'),
                '_v': ExprManager.getClass('_v'),
                'true': new (ExprManager.getClass('true'))(),
                'false': new (ExprManager.getClass('false'))(),
                'cmp': ExprManager.getClass('cmp'),
                '==': ExprManager.getClass('=='),
                '!=': ExprManager.getClass('!='),
                '+': ExprManager.getClass('+'),
                'bag': new (ExprManager.getClass('bag'))(0, 0, 54, 54, []),
                'count': new (ExprManager.getClass('count'))(),
                'map': ExprManager.getClass('map'),
                'reduce': ExprManager.getClass('reduce'),
                'put': ExprManager.getClass('put'),
                'pop': ExprManager.getClass('pop'),
                'define': ExprManager.getClass('define'),
                'null': new NullExpr(0, 0, 64, 64),
                'assign': ExprManager.getClass('assign'),
                'sequence': ExprManager.getClass('sequence'),
                'repeat': ExprManager.getClass('repeat'),
                'choice': ExprManager.getClass('choice'),
                'snappable': ExprManager.getClass('snappable'),
                'level': ExprManager.getClass('level'),
                'arrayobj': ExprManager.getClass('arrayobj'),
                'infinite': ExprManager.getClass('infinite'),
                'notch': new (ExprManager.getClass('notch'))(1),
                '-': ExprManager.getClass('-'),
                '*': ExprManager.getClass('*'),
                '--': ExprManager.getClass('--'),
                '++': ExprManager.getClass('++'),
                'stringobj': ExprManager.getClass('stringobj'),
                'namedfunc': ExprManager.getClass('namedfunc'),
                'vargoal': ExprManager.getClass('vargoal'),
                'dot': function () {
                    var circ = new CircleExpr(0, 0, 18);
                    circ.color = 'gold';
                    return circ;
                }(),
                'give': ExprManager.getClass('give')
            };

            // Macro swap:
            if (macros && arg in macros) {
                arg = macros[arg]; // e.g. arg = macros['a'] = 'star', if arg 'a' => 'star'.
            }

            if (Number.isNumber(arg)) {
                var numexpr = new (ExprManager.getClass('number'))(parseInt(arg));
                lock(numexpr, locked);
                return numexpr;
            } else if (arg in op_mappings) {
                if (isInstanceOfClass(op_mappings[arg], Expression)) {
                    e = op_mappings[arg].clone();
                    lock(e, locked);
                } else e = op_mappings[arg];
                return e;
            } else if (arg.indexOf('`') > -1) {
                // treat as string
                return arg.replace('`', '');
            } else if (arg.indexOf('λ') > -1) {
                var varname = arg.replace('λ', '');
                return new (ExprManager.getClass('hole'))(varname);
            } else if (arg.indexOf('#') > -1) {
                var _varname = arg.replace('#', '');
                var lambdavar = void 0;
                lambdavar = new (ExprManager.getClass('var'))(_varname);
                if (_varname.indexOf('_') > -1) {
                    // Vars like #/x are draggable.
                    _varname = _varname.replace('_', '');
                    lambdavar.ignoreEvents = false; // makes draggable
                    lambdavar.name = _varname;
                }
                return lambdavar;
            } else if (arg.indexOf('$') > -1) {
                var _varname2 = arg.replace('$', '').replace('_', '');
                // Lock unless there is an underscore in the name
                locked = !(arg.indexOf('_') > -1);
                return lock(new (ExprManager.getClass('var'))(_varname2), locked);
            } else if (true) {
                var string = new (ExprManager.getClass('string'))(arg);
                return string;
            } else {
                console.error('Unknown argument: ', arg);
                return lock(new FadedValueExpr(arg), locked);
            }
        }
    }]);

    return Level;
}();

/** A Goal describes the conditions
    under which a level can be counted as complete.
    For instance, that the expression should reduce to a Star.
    The input of the comparator function includes both
    the final expression and the entire reduction stack (TODO).
    Simple goals, in the beginning, may only need the final expression.
    However, later on it may be necessary to analyze the reduction stack.
    To do this, extend Goal and create your own test() function.
*/


var Goal = function () {
    function Goal(accepted_patterns, desc) {
        var alien_images = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : ['alien-function-1'];

        _classCallCheck(this, Goal);

        if (!Array.isArray(accepted_patterns)) accepted_patterns = [accepted_patterns];
        this.patterns = accepted_patterns;
        this.desc = desc; // as backup
        // Choose a random alien to serve as our "goal person"
        this.alien_image = alien_images[Math.floor(Math.random() * alien_images.length)];
    }

    _createClass(Goal, [{
        key: 'serialize',
        value: function serialize() {
            if (typeof this.desc === 'string') return [this.desc];else return this.desc;
        }
    }, {
        key: 'test',
        value: function test(exprs, env) {
            var reduction_stack = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;
            var _iteratorNormalCompletion14 = true;
            var _didIteratorError14 = false;
            var _iteratorError14 = undefined;

            try {

                for (var _iterator14 = this.patterns[Symbol.iterator](), _step14; !(_iteratorNormalCompletion14 = (_step14 = _iterator14.next()).done); _iteratorNormalCompletion14 = true) {
                    var pattern = _step14.value;

                    var paired_matching = pattern.test(exprs, env);
                    if (paired_matching) return paired_matching;
                }
            } catch (err) {
                _didIteratorError14 = true;
                _iteratorError14 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion14 && _iterator14.return) {
                        _iterator14.return();
                    }
                } finally {
                    if (_didIteratorError14) {
                        throw _iteratorError14;
                    }
                }
            }

            return false;
        }
    }, {
        key: 'nodeRepresentation',
        get: function get() {
            var md = new MobileDetect(window.navigator.userAgent);
            var BUBBLE_HEIGHT = __IS_MOBILE && md.phone() ? 70 : 80;
            var ALIEN_HEIGHT = __IS_MOBILE && md.phone() ? 50 : 70;

            var exprs = flatten(this.patterns.map(function (p) {
                return p.exprs;
            })).map(function (expr) {
                return expr.clone();
            });
            var bg_accent = new mag.Circle(0, 0, 10);
            bg_accent.color = "#cccccc"; //"#CD853F"; <-- light brown
            bg_accent.shadowOffset = 0;
            bg_accent.anchor = { x: 0.5, y: 0.5 };
            var bg = new mag.Circle(0, 0, 10);
            bg.color = "#2b1d0e";
            bg.shadowOffset = 0;
            bg.anchor = { x: 0.5, y: 0.5 };
            var node = new mag.Rect(0, 0, 100, 50);
            node.color = null;
            node.ignoreEvents = true;

            var bubbleLeftImage = Resource.getImage('caption-long-left');
            var bubbleRightImage = Resource.getImage('caption-long-right');
            var bubbleMidImage = Resource.getImage('caption-long-mid');
            var bubbleLeftWidth = BUBBLE_HEIGHT / bubbleLeftImage.naturalHeight * bubbleLeftImage.naturalWidth;
            var bubbleRightWidth = BUBBLE_HEIGHT / bubbleRightImage.naturalHeight * bubbleRightImage.naturalWidth;
            var bubbleMidWidth = BUBBLE_HEIGHT / bubbleMidImage.naturalHeight * bubbleMidImage.naturalWidth;
            var bubbleLeft = new mag.ImageRect(0, 0, bubbleLeftWidth, BUBBLE_HEIGHT, 'caption-long-left');
            var bubbleRight = new mag.ImageRect(0, 0, bubbleRightWidth, BUBBLE_HEIGHT, 'caption-long-right');

            var exprs_node = new mag.Rect(0, 0, 0, 0);
            exprs_node.addAll(exprs);

            exprs[0].pos = { x: bubbleLeft.size.w / 4, y: 0 };

            // TODO: Fix the need for this hack.
            if (exprs[0] instanceof BagExpr) {
                //exprs[0].pos = { x:70, y:50 };
                exprs[0].anchor = { x: 0, y: 0 };
            }

            exprs[0].ignoreEvents = true;
            for (var i = 1; i < exprs.length; i++) {
                exprs[i].pos = addPos({ x: exprs[i - 1].size.w, y: 0 }, exprs[i - 1].pos);
                exprs[i].ignoreEvents = true;
            }

            var image = Resource.getImage(this.alien_image);
            var width = ALIEN_HEIGHT / image.naturalHeight * image.naturalWidth;
            var offsetX = 0,
                offsetY = 0;
            if (width > ALIEN_HEIGHT) {
                offsetY = 0.25 * (width - ALIEN_HEIGHT);
            } else {
                offsetX = 0.25 * (ALIEN_HEIGHT - width);
            }
            var alien = new mag.ImageRect(offsetX, offsetY, width, ALIEN_HEIGHT, this.alien_image);

            node.addAll([bg_accent, bg, alien]);

            var lastExpr = exprs[exprs.length - 1];
            var firstExpr = exprs[0];
            var exprsWidth = lastExpr.absolutePos.x + lastExpr.absoluteSize.w - firstExpr.absolutePos.x;

            exprsWidth -= 0.6 * (bubbleLeftWidth + bubbleRightWidth);
            var bubble = [bubbleLeft];

            while (exprsWidth > 0) {
                exprsWidth -= bubbleMidWidth - 1;
                bubble.push(new mag.ImageRect(0, 0, bubbleMidWidth, BUBBLE_HEIGHT, 'caption-long-mid'));
            }

            bubble.push(bubbleRight);

            var x = alien.pos.x + alien.size.w - 10;
            var _iteratorNormalCompletion15 = true;
            var _didIteratorError15 = false;
            var _iteratorError15 = undefined;

            try {
                for (var _iterator15 = bubble[Symbol.iterator](), _step15; !(_iteratorNormalCompletion15 = (_step15 = _iterator15.next()).done); _iteratorNormalCompletion15 = true) {
                    var b = _step15.value;

                    b.pos = { x: x, y: -5 };
                    x += b.size.w - 1;
                }
            } catch (err) {
                _didIteratorError15 = true;
                _iteratorError15 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion15 && _iterator15.return) {
                        _iterator15.return();
                    }
                } finally {
                    if (_didIteratorError15) {
                        throw _iteratorError15;
                    }
                }
            }

            node.addAll(bubble);

            node.pos = { x: 5, y: 5 };
            var maxExprHeight = 0;
            var _iteratorNormalCompletion16 = true;
            var _didIteratorError16 = false;
            var _iteratorError16 = undefined;

            try {
                for (var _iterator16 = exprs[Symbol.iterator](), _step16; !(_iteratorNormalCompletion16 = (_step16 = _iterator16.next()).done); _iteratorNormalCompletion16 = true) {
                    var expr = _step16.value;

                    maxExprHeight = Math.max(maxExprHeight, expr.size.h);
                }
            } catch (err) {
                _didIteratorError16 = true;
                _iteratorError16 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion16 && _iterator16.return) {
                        _iterator16.return();
                    }
                } finally {
                    if (_didIteratorError16) {
                        throw _iteratorError16;
                    }
                }
            }

            exprs_node.pos = {
                x: bubble[0].absolutePos.x + 0.3 * bubble[0].absoluteSize.w,
                y: bubble[0].absolutePos.y + bubble[0].absoluteSize.h / 2 - maxExprHeight / 2
            };
            bg.radius = Math.max(alien.absolutePos.x + alien.absoluteSize.w, ALIEN_HEIGHT);
            bg.radius = Math.max(alien.absolutePos.y + alien.absoluteSize.h, bg.radius);
            bg.radius += 20;
            bg_accent.radius = bg.radius + 10;

            window.test = alien;

            return [node, exprs_node];
        }
    }]);

    return Goal;
}();

/** An ExpressionPattern is like a regex over programming expressions.
 *	(It's really incomplete. I'm to blame for that. But TODO!)
 *	For right now, this just takes a single Expression and provides a
 *	comparison function with another expression.
 */


var ExpressionPattern = function () {
    function ExpressionPattern(exprs) {
        _classCallCheck(this, ExpressionPattern);

        if (!Array.isArray(exprs)) exprs = [exprs];
        this.exprs = exprs;
    }

    _createClass(ExpressionPattern, [{
        key: 'test',
        value: function test(exprs, envdisplay) {
            var lvl_exprs = exprs;
            var es = this.exprs.map(function (e) {
                return e;
            }); // shallow clone
            var es_idxs = this.exprs.map(function (e, i) {
                return i;
            });
            var paired_matching = [];

            var compare = function compare(e, f) {

                var isarr = false;

                if (e instanceof StringObjectExpr || f instanceof StringObjectExpr) {
                    e = e.value();
                    f = f.value();
                    return e === f;
                }

                if (e instanceof ArrayObjectExpr && e.holes.length === 1) {
                    e = e.holes[0]; // compare only the underlying array.
                }
                if (f instanceof ArrayObjectExpr && f.holes.length === 1) {
                    f = f.holes[0]; // compare only the underlying array.
                    isarr = true;
                }

                //console.log(' comparing ', e, ' to ', f);
                var valuesMatch = true;
                // If both are values, check that their reported values
                // match. This is for things like number expressions,
                // which are otherwise structurally equal. The check here
                // is recursive, for cases like bags, where the value can
                // itself contain expressions.
                if (e instanceof Expression && f instanceof Expression && e.isValue() && f.isValue()) {
                    var ev = e.value();
                    var fv = f.value();

                    if (!ev && fv || ev && !fv) {
                        valuesMatch = false;
                    } else if (Array.isArray(ev) && Array.isArray(fv)) {
                        if (ev.length != fv.length) {
                            valuesMatch = false;
                        } else {
                            for (var i = 0; i < ev.length; i++) {
                                if (!compare(ev[i], fv[i])) {
                                    valuesMatch = false;
                                    break;
                                }
                            }
                        }
                    } else {
                        valuesMatch = ev === fv && e.isValue() && f.isValue();
                    }
                } else {
                    valuesMatch = true;
                }

                // Compares two expressions.
                // Right now this just checks if their class tree is the same.
                if (e.constructor.name !== f.constructor.name) {
                    //console.log(' > Constructors don\'t match.');
                    return false; // expressions don't match
                } else if (e instanceof Expression && f instanceof Expression && (e.isValue() != f.isValue() || !valuesMatch)) {
                        return false;
                    } else {
                        // Check whether the expressions at this level have the same # of children. If so, do one-to-one comparison.
                        var e_children = e.children;
                        var f_children = f.children;
                        if (e_children.length !== f_children.length) {
                            //console.log(' > Length of child array doesn\'t match.');
                            return false;
                        } else {
                            for (var _i4 = 0; _i4 < e_children.length; _i4++) {
                                if (!compare(e_children[_i4], f_children[_i4])) {
                                    //console.log(' > Children don\'t match.');
                                    return false;
                                }
                            }
                        }
                    }

                //console.log(' > Expressions are equal.');
                return true;
            };

            // Special case: Variable goals.
            if (es.length === 1 && es[0] instanceof VariableGoalDisplay) {
                if (!envdisplay.stage || lvl_exprs.length > 0) return false;
                var v = envdisplay.getEnvironment().lookup(es[0].name);
                if (v) {
                    if (compare(v, es[0].getValue())) {
                        return [es[0].name]; // paired match... return the name for the binding instead.
                    }
                }
                return false;
            }

            // If sets of expressions have different length, they can't be equal.
            // Still try to make a matching so we can blink the extraneous expressions.
            if (lvl_exprs.length !== es.length) {
                var _es = this.exprs.map(function (e) {
                    return e;
                });
                var _es_idxs = this.exprs.map(function (e, i) {
                    return i;
                });
                var unpaired = [];

                var idx = 0;
                var _iteratorNormalCompletion17 = true;
                var _didIteratorError17 = false;
                var _iteratorError17 = undefined;

                try {
                    for (var _iterator17 = lvl_exprs[Symbol.iterator](), _step17; !(_iteratorNormalCompletion17 = (_step17 = _iterator17.next()).done); _iteratorNormalCompletion17 = true) {
                        var lvl_e = _step17.value;

                        var _valid = -1;
                        for (var i = 0; i < _es.length; i++) {
                            if (compare(_es[i], lvl_e)) {
                                _valid = i;
                                break;
                            }
                        }
                        if (_valid > -1) {
                            //console.log(' > array was ', es);
                            //console.log(' > removing element ', es[valid]);
                            _es.splice(_valid, 1);
                            _es_idxs.splice(_valid, 1);
                            //console.log(' > array is now ', es);
                        } else {
                                unpaired.push(idx);
                            }
                        idx++;
                    }
                } catch (err) {
                    _didIteratorError17 = true;
                    _iteratorError17 = err;
                } finally {
                    try {
                        if (!_iteratorNormalCompletion17 && _iterator17.return) {
                            _iterator17.return();
                        }
                    } finally {
                        if (_didIteratorError17) {
                            throw _iteratorError17;
                        }
                    }
                }

                if (_es.length === 0) {
                    return {
                        "unpaired": unpaired
                    };
                }
                return false;
            }

            var _iteratorNormalCompletion18 = true;
            var _didIteratorError18 = false;
            var _iteratorError18 = undefined;

            try {
                for (var _iterator18 = lvl_exprs[Symbol.iterator](), _step18; !(_iteratorNormalCompletion18 = (_step18 = _iterator18.next()).done); _iteratorNormalCompletion18 = true) {
                    var _lvl_e = _step18.value;

                    var valid = -1;
                    for (var _i5 = 0; _i5 < es.length; _i5++) {
                        if (compare(es[_i5], _lvl_e)) {
                            valid = _i5;
                            paired_matching.push(es_idxs[_i5]);
                            break;
                        }
                    }
                    if (valid > -1) {
                        //console.log(' > array was ', es);
                        //console.log(' > removing element ', es[valid]);
                        es.splice(valid, 1);
                        es_idxs.splice(valid, 1);
                        //console.log(' > array is now ', es);
                    } else return false;
                }
            } catch (err) {
                _didIteratorError18 = true;
                _iteratorError18 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion18 && _iterator18.return) {
                        _iterator18.return();
                    }
                } finally {
                    if (_didIteratorError18) {
                        throw _iteratorError18;
                    }
                }
            }

            return paired_matching;
        }
    }]);

    return ExpressionPattern;
}();