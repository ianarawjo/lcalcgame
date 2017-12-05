'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var UI_PADDING = __IS_MOBILE ? 2.5 : 10;

/** A subclass of Stage that assumes Nodes are Expressions
    and allows for saving state. */

var ReductStage = function (_mag$Stage) {
    _inherits(ReductStage, _mag$Stage);

    function ReductStage() {
        var canvas = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;

        _classCallCheck(this, ReductStage);

        var _this = _possibleConstructorReturn(this, (ReductStage.__proto__ || Object.getPrototypeOf(ReductStage)).call(this, canvas));

        _this.color = '#fff'; // should be eee, change to fff if taking photos of expressions
        _this.stateGraph = new mag.Network();
        _this.environment = new Environment();
        _this.functions = {};
        _this.md = new MobileDetect(window.navigator.userAgent);
        _this.onorientationchange();
        return _this;
    }

    _createClass(ReductStage, [{
        key: 'buildSyntaxJournalUI',
        value: function buildSyntaxJournalUI() {

            var CORNER_PAD = 12;
            var journal = new SyntaxJournal();
            var journal_btn = new SyntaxJournalButton(journal);
            journal_btn.pos = { x: GLOBAL_DEFAULT_SCREENSIZE.w - 32 - CORNER_PAD, y: GLOBAL_DEFAULT_SCREENSIZE.h - 32 - CORNER_PAD };
            journal_btn.anchor = { x: 0.5, y: 0.5 };
            this.add(journal_btn);

            journal.knowledge = ProgressManager.getKnowledge();
            this.syntaxJournalButton = journal_btn;

            // programmatically define getter so that
            // this.syntaxKnowledge returns a pointer to the one in journal button...
            // This way we don't have to worry about inconsistencies.
            Object.defineProperty(this, 'syntaxKnowledge', {
                get: function get() {
                    return this.syntaxJournalButton.journal.knowledge;
                }
            });
        }
    }, {
        key: 'buildUI',
        value: function buildUI(showEnvironment, envDisplayWidth) {
            var _this2 = this;

            var TOOLBOX_HEIGHT = Toolbox.defaultRowHeight;

            var canvas_screen = this.boundingSize;

            var btn_back = new mag.Button(canvas_screen.w - 64 * 4 - UI_PADDING, UI_PADDING, 64, 64, { default: 'btn-back-default', hover: 'btn-back-hover', down: 'btn-back-down' }, function () {
                //returnToMenu();
                prev(); // go back to previous level; see index.html.
            });

            var btn_menu = new mag.Button(canvas_screen.w - 64 * 3 - UI_PADDING, UI_PADDING, 64, 64, { default: 'btn-menu-default', hover: 'btn-menu-hover', down: 'btn-menu-down' }, function () {
                //returnToMenu();
                initChapterSelectMenu();
            });

            var btn_reset = new mag.Button(btn_back.pos.x + btn_back.size.w, UI_PADDING, 64, 64, { default: 'btn-reset-default', hover: 'btn-reset-hover', down: 'btn-reset-down' }, function () {

                // Push 'reset' state to log:
                _this2.saveResetState();

                initBoard(); // reset board state; see index.html.
            });

            var btn_next = new mag.Button(btn_reset.pos.x + btn_reset.size.w, UI_PADDING, 64, 64, { default: 'btn-next-default', hover: 'btn-next-hover', down: 'btn-next-down' }, function () {
                next(); // go back to previous level; see index.html.
            });

            var buttonsVisible = false;
            var background = new mag.Rect(0, 0, 0, 0);
            background.color = "white";
            background.ignoreEvents = true;

            var showButtons = function showButtons() {
                if (__IS_MOBILE) {
                    // Make sure hamburger button is visible
                    _this2.remove(btn_hamburger);
                    _this2.add(background);
                    _this2.add(btn_hamburger);
                }

                if (__SHOW_DEV_INFO) {
                    _this2.add(btn_back);
                    _this2.add(btn_next);
                }

                _this2.add(btn_reset);
                _this2.add(btn_menu);
            };
            var hideButtons = function hideButtons() {
                _this2.remove(background);
                _this2.remove(btn_back);
                _this2.remove(btn_next);
                _this2.remove(btn_reset);
                _this2.remove(btn_menu);
            };

            this.buttonBackground = background;

            var btn_hamburger = new mag.Button(btn_next.pos.x + btn_next.size.w, UI_PADDING, 64, 64, { default: 'btn-hamburger-default', hover: 'btn-hamburger-hover', down: 'btn-hamburger-down' }, function () {
                if (buttonsVisible) {
                    hideButtons();
                } else {
                    showButtons();
                }

                buttonsVisible = !buttonsVisible;
            });

            if (__IS_MOBILE) {
                this.add(btn_hamburger);
            } else {
                if (__SHOW_DEV_INFO) {
                    this.add(btn_back);

                    if (__ALLOW_SKIPPING || ProgressManager.isLevelComplete(level_idx)) this.add(btn_next);
                } else {
                    btn_menu.pos = btn_reset.pos;
                    btn_reset.pos = btn_next.pos;
                }
                if (__SHOW_MAINMENU_NAV) this.add(btn_menu);
                this.add(btn_reset);
            }

            // Toolbox
            var toolbox = new Toolbox(0, canvas_screen.h, canvas_screen.w, TOOLBOX_HEIGHT);
            toolbox.anchor = { x: 0, y: 1 };
            this.add(toolbox);
            this.toolbox = toolbox;

            // Environment
            var yOffset = btn_reset.absoluteSize.h + btn_reset.absolutePos.y + 20;
            var env = new (ExprManager.getClass('environment_display'))(canvas_screen.w - envDisplayWidth, yOffset, envDisplayWidth, canvas_screen.h - TOOLBOX_HEIGHT - yOffset);
            if (showEnvironment) {
                this.add(env);
            }
            this.environmentDisplay = env;

            this.uiNodes = [btn_back, btn_reset, btn_next, btn_hamburger, toolbox, env];

            this.layoutUI();

            this.buildSyntaxJournalUI();

            if (!Resource.isPlayingBackgroundMusic('bg1')) Resource.playBackgroundMusic('bg1');
        }
    }, {
        key: 'layoutUI',
        value: function layoutUI() {
            // layoutUI is called through onorientationchange in the
            // constructor, before we have any UI nodes
            if (!this.uiNodes) return;

            var canvas_screen = this.boundingSize;
            var toolboxHeight = Toolbox.defaultRowHeight;

            var btn_back = this.uiNodes[0];
            //let btn_menu = this.uiNodes[1];
            var btn_reset = this.uiNodes[1];
            var btn_next = this.uiNodes[2];
            var btn_hamburger = this.uiNodes[3];

            var NUM_BUTTONS = (__IS_MOBILE ? 3 : 2) + (__SHOW_DEV_INFO ? 2 : 0);
            if (!btn_next.stage) NUM_BUTTONS--;

            for (var i = 0; i < NUM_BUTTONS; i++) {
                this.uiNodes[i].pos = {
                    x: canvas_screen.w - 64 * (NUM_BUTTONS - i - 1) - UI_PADDING,
                    y: this.uiNodes[i].pos.y
                };
            }

            this.buttonBackground.size = {
                w: this.boundingSize.w,
                h: btn_back.size.h + 2 * UI_PADDING
            };

            this.toolbox.pos = {
                x: 0,
                y: canvas_screen.h
            };
            this.toolbox.anchor = {
                x: 0,
                y: 1
            };
            this.toolbox.size = {
                w: canvas_screen.w,
                h: toolboxHeight
            };

            var yOffset = btn_reset.absoluteSize.h + btn_reset.absolutePos.y + 20;
            this.environmentDisplay._pos = {
                x: canvas_screen.w - this.environmentDisplay.size.w,
                y: yOffset
            };
            this.environmentDisplay._size = {
                w: this.environmentDisplay.size.w,
                h: canvas_screen.h - toolboxHeight - yOffset
            };
        }
    }, {
        key: 'finishLoading',
        value: function finishLoading() {
            var innerStages = this.getNodesWithClass(ReductStageExpr);
            innerStages.forEach(function (stg) {
                stg.build();
            });
            this.focusFirstTypeBox();
            this.update();
        }

        // Determines whether the remaining expressions
        // can possibly solve the level. Has to iterate over
        // powerset of toolbox-board combos.
        // * ASSUMES LEVEL IS NOT COMPLETE (board != goal). *
        // > This is not perfect, hence why it's prefaced with 'might'.

    }, {
        key: 'mightBeCompleted',
        value: function mightBeCompleted() {
            var exprs = this.expressionNodes();
            var toolbox_exprs = this.toolboxNodes();
            var remaining_exprs = exprs.concat(toolbox_exprs);

            // If every expression is a value, nothing can be reduced,
            // so continue with check.
            var contains_reducable_expr = remaining_exprs.some(function (e) {
                return !e.isValue() || e instanceof CollectionExpr;
            });

            // Quit if there's an expression in the game
            // that can be reduced, like == or lambda.
            if (contains_reducable_expr) {

                // Secondary test:
                // * This is only valid in the CHI '18 version.
                // If the goal is an array, and no MapExprs remain,
                // then this level can't be completed no matter what is left.
                if (this.goalNodes.every(function (e) {
                    return e instanceof BracketArrayExpr;
                }) && !remaining_exprs.some(function (e) {
                    return e instanceof MapFunc || e instanceof SmallStepBagExpr || e instanceof BracketArrayExpr || e instanceof IfStatement;
                }) && this.getNodesWithClass(TypeInTextExpr).length === 0) {
                    return false;
                }

                return true;
            }

            // If there's nothing in the toolbox,
            // we can assume level is incomplete.
            if (toolbox_exprs.length === 0) return false;

            // If there's only one thing,
            // add it to board and test new board against the Goal.
            if (toolbox_exprs.length === 1) return this.testBoard(remaining_exprs, false);

            // Construct list of all possible board states
            // using powerset of toolbox exprs.
            var subsets = powerset(toolbox_exprs);
            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
                for (var _iterator = subsets[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    var s = _step.value;

                    if (s.length === 0) continue; // empty set falls under our assumption, so skip it.
                    if (this.testBoard(exprs.concat(s), false) !== false) return true; // if at least one possible board state works, this level can be solved.
                }

                // None of the possible board states could be solved.
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

            return false;
        }

        // Checks for level completion.

    }, {
        key: 'update',
        value: function update() {
            var _this3 = this;

            _get(ReductStage.prototype.__proto__ || Object.getPrototypeOf(ReductStage.prototype), 'update', this).call(this);

            if (!this.isCompleted || this.ranResetNotifier) return;

            var level_complete = this.isCompleted();

            if (!level_complete) {

                // Check if the level might be completed with the remaining exprs on board and in toolbox.
                // * If not, we've reached a leaf of the state graph, and we can prompt
                // * the player to reset.
                if (!this.mightBeCompleted()) {

                    // Goal state cannot be reached. Prompt player to reset.
                    this.saveSubstate('dead-end');
                    Logger.log('dead-end', { 'final_state': this.toString() });

                    this.showOverlay();
                    var btn_reset = this.uiNodes[1];
                    btn_reset.images.default = "btn-reset-force";
                    btn_reset.image = btn_reset.images.default;
                    this.remove(btn_reset);
                    this.add(btn_reset); // Put reset button over the overlay
                    this.draw();
                }
            } else {
                // Level is completed.

                // DEBUG TEST FLYTO ANIMATION.
                if (!this.ranCompletionAnim) {
                    (function () {

                        _this3.saveState();
                        Logger.log('victory', { 'final_state': _this3.toString(), 'num_of_moves': undefined });

                        // Update + save player progress.
                        ProgressManager.markLevelComplete(level_idx);

                        var you_win = function you_win() {

                            if (level_idx < 1) {
                                var cmp = new mag.ImageRect(GLOBAL_DEFAULT_SCREENSIZE.w / 2, GLOBAL_DEFAULT_SCREENSIZE.h / 2, 740 / 2, 146 / 2, 'victory');
                                cmp.anchor = { x: 0.5, y: 0.5 };
                                _this3.add(cmp);
                                _this3.draw();

                                Resource.play('victory');
                                Animate.wait(1080).after(function () {
                                    next();
                                });
                            } else {
                                // Skip victory jingle on every level after first.
                                // Resource.play('victory');
                                next();
                            }
                        };

                        var pairs = level_complete;
                        var num_exploded = 0;
                        var playedSplosionAudio = false;

                        pairs.forEach(function (pair, idx) {
                            var node = pair[0];
                            var goalNode = pair[1];
                            node.ignoreEvents = true;

                            Resource.play('matching-goal');

                            var blinkCount = level_idx === 0 ? 2 : 1;
                            Animate.blink([node, goalNode], 2500 / 2.0 * blinkCount, [0, 1, 1], blinkCount).after(function () {
                                //Resource.play('shootwee');

                                _this3.playerWon = true;

                                //Animate.flyToTarget(node, goalNode.absolutePos, 2500.0, { x:200, y:300 }, () => {
                                SplosionEffect.run(node);
                                SplosionEffect.run(goalNode);

                                if (!playedSplosionAudio) {
                                    // Play sFx.
                                    Resource.play('splosion');
                                    playedSplosionAudio = true;
                                }

                                if (node.parent instanceof SpreadsheetDisplay) node.parent.removeChild(node);

                                goalNode.parent.removeChild(goalNode);
                                num_exploded++;
                                if (num_exploded === pairs.length) {
                                    Animate.wait(500).after(you_win);
                                }
                                //});
                            });
                        });

                        _this3.ranCompletionAnim = true;
                    })();
                }
            }
        }
    }, {
        key: 'showOverlay',
        value: function showOverlay() {
            var opacity = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0.12;

            var r = new mag.Rect(0, 0, GLOBAL_DEFAULT_SCREENSIZE.w, GLOBAL_DEFAULT_SCREENSIZE.h);
            r.color = "black";
            r.opacity = 0.0;
            // Disable stroke on mouse enter
            r.onmouseenter = function () {};
            // Hack to prevent repel-on-drop from interacting with the
            // overlay
            Object.defineProperty(r, "pos", {
                get: function get() {
                    return { x: r._pos.x, y: r._pos.y };
                },
                set: function set() {}
            });

            this.add(r);
            this.ranResetNotifier = true;

            Animate.tween(r, { opacity: opacity }, 1000);

            return r;
        }

        // Visually 'unlocks' syntax given the syntax key.
        // This checks the textExpr's text and positions a new TextExpr
        // around it, isolating just the syntax unlocked, and that
        // new text "flies" into the player's syntax journal.

    }, {
        key: 'unlockSyntax',
        value: function unlockSyntax(syntax_key, textExpr) {

            // Unlock internally
            this.syntaxKnowledge.unlock(syntax_key);
            this.syntaxJournalButton.journal.renderKnowledge();

            // Animate unlock for player:
            var t = new TextExpr(syntax_key);
            var bounds = textExpr.getAbsoluteBoundsForSubstring(syntax_key);
            t.pos = bounds.pos;
            t.anchor = { x: 0, y: 0.5 };
            t.color = 'magenta';
            this.add(t);
            return this.syntaxJournalButton.flyIn(t);
        }
    }, {
        key: 'onmousedown',
        value: function onmousedown(pos) {
            _get(ReductStage.prototype.__proto__ || Object.getPrototypeOf(ReductStage.prototype), 'onmousedown', this).call(this, pos);
            if (this.heldNode && this.keyEventDelegate && this.heldNode != this.keyEventDelegate || !this.heldNode && this.keyEventDelegate) {
                this.keyEventDelegate.blur();
                this.keyEventDelegate = null;
            }
        }
    }, {
        key: 'onmouseclick',
        value: function onmouseclick(pos) {

            // Let player click to continue.
            if (!__IS_MOBILE && this.playerWon) {
                Logger.log('clicked-to-continue', '');
                next();
            }

            _get(ReductStage.prototype.__proto__ || Object.getPrototypeOf(ReductStage.prototype), 'onmouseclick', this).call(this, pos);
        }
    }, {
        key: 'onkeydown',
        value: function onkeydown(event) {
            if (this.keyEventDelegate) {
                var key = event.keyCode;
                if (key === 8) {
                    // BACKSPACE
                    this.keyEventDelegate.backspace();
                } else if (key === 46 || key === 127) {
                    // DELETE
                    this.keyEventDelegate.backspace(-1);
                } else if (key === 37) {
                    // LEFT ARROW
                    this.keyEventDelegate.leftArrow();
                } else if (key === 39) {
                    // RIGHT ARROW
                    this.keyEventDelegate.rightArrow();
                }
            }
        }
    }, {
        key: 'getTypeBoxes',
        value: function getTypeBoxes() {
            var isClose = function isClose(a, b) {
                return Math.abs(a - b) < 1.0;
            };
            var topDownSort = function topDownSort(e1, e2) {
                var p1 = e1.absolutePos;
                var p2 = e2.absolutePos;
                if (isClose(p1.y, p2.y)) return p1.x >= p2.x;else return p1.y >= p2.y;
            };
            return this.getNodesWithClass(TypeBox).sort(topDownSort);
        }
    }, {
        key: 'getReduceableExprs',
        value: function getReduceableExprs() {
            var es = this.expressionNodes().filter(function (e) {
                return 'isRootReducable' in e && e.isRootReducable() === true;
            });
            return es;
        }
    }, {
        key: 'focusFirstTypeBox',
        value: function focusFirstTypeBox() {
            this.focusFirstKeyDelegate();
        }
    }, {
        key: 'focusFirstKeyDelegate',
        value: function focusFirstKeyDelegate() {
            var available_delegates = this.getTypeBoxes().concat(this.getReduceableExprs());
            if (available_delegates.length > 0) {
                available_delegates[0].focus();
                this.keyEventDelegate = available_delegates[0];
            }
        }
    }, {
        key: 'onkeypress',
        value: function onkeypress(event) {

            // For jumping into a textbox if the user
            // starts typing off of it; for instance,
            // used if they are hovering the mouse over a TypeBox.
            if (this.keyEventCandidate) {
                if (this.keyEventDelegate) {
                    this.keyEventDelegate.blur();
                }
                this.keyEventCandidate.focus();
                this.keyEventCandidate = null;
            }

            if (this.keyEventDelegate) {
                if (event.keyCode === 13) {
                    this.keyEventDelegate.carriageReturn();
                } else if (!event.charCode || event.charCode === 127) {
                    // Special character, do nothing
                } else if (event.keyCode === 9) {
                        // Tab.
                        // Cycle to next possible keyEventDelegate...
                        var available_delegates = this.getTypeBoxes().concat(this.getReduceableExprs());
                        var cur_delegate = this.keyEventDelegate;
                        this.keyEventDelegate.blur();
                        var idx_delegate = available_delegates.indexOf(cur_delegate);
                        if (idx_delegate > -1) {
                            var next_delegate = available_delegates[(idx_delegate + 1) % available_delegates.length];
                            this.keyEventDelegate = next_delegate;
                            console.log('focusing delegate', idx_delegate);
                            next_delegate.focus();
                        } else {
                            console.error('@ onkeypress: That\'s odd -- key event delegate is not inside stage...');
                        }
                    } else {
                        var character = event.char;
                        this.keyEventDelegate.type(character);
                    }
            } else if (event.keyCode === 9) {
                // Tab with no text box focused.
                this.focusFirstKeyDelegate();
            }
        }

        // Converts current state of the board into a Level (data repr.).

    }, {
        key: 'toLevel',
        value: function toLevel() {
            var isNotEmpty = function isNotEmpty(e) {
                return e != null && !(e instanceof ExpressionEffect);
            };
            var clone = function clone(e) {
                return e.clone();
            };
            var board = this.expressionNodes().filter(isNotEmpty).map(clone); // these are Expressions
            var toolbox = this.toolboxNodes().filter(isNotEmpty).map(clone); // ''
            var goal = this._storedGoal; // this is a Goal object
            var globals = this.environment; // an Environment object
            return new Level(board, goal, toolbox, globals);
        }

        // Storing and saving Reduct stages.

    }, {
        key: 'toString',
        value: function toString() {
            return JSON.stringify(this.toLevel().serialize());
        }

        // Save state of game board and push onto undo stack.
        // * You can provide some extra data for the 'edge' going from
        // * the previous state (if any) to the new state.

    }, {
        key: 'saveState',
        value: function saveState() {
            var changeData = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;

            var stringify = function stringify(lvl) {
                return JSON.stringify(lvl);
            };
            var state = this.toLevel().serialize();
            var json = stringify(state);

            // Check if new 'state' is really new...
            // Only if something's changed should we push onto the stateStack
            // and save to the server.
            // if (this.stateGraph.length > 0) {
            // if (this.stateGraph.has({data: state})) // Nothing's changed. Abort the save.
            //     return;
            // else {
            // console.log('State diff: ', ReductStage.stateDiff(this.stateGraph.lastAddedNode.data, state));
            // }
            // } // If we reach here, then something has changed...

            // Push new state and save serialized version to logger.
            // * This will automatically check for duplicates...
            var changed = this.stateGraph.push(state, changeData);

            Logger.log('state-save', json);
            Logger.log('state-path-save', this.stateGraph.toString());

            // Debug --
            // Live display of state graph as game is played. (Only update if there's been a change!)
            if (__DEBUG_DISPLAY_STATEGRAPH && changed) __UPDATE_NETWORK_CB(this.stateGraph.toVisJSNetworkData());
        }

        // For pushing minor (intermediate) data _onto_ the current state, like typing before commits:
    }, {
        key: 'saveSubstate',
        value: function saveSubstate() {
            var changeData = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;

            if (this.stateGraph.length > 0) {
                var state = this.toLevel().serialize();
                this.stateGraph.pushAddendumToCurrentState({ state: state, data: changeData });
            }
        }

        // For marking a level 'reset'

    }, {
        key: 'saveResetState',
        value: function saveResetState() {
            this.stateGraph.push('reset');
            Logger.log('state-save', 'reset');
            Logger.log('state-path-save', this.stateGraph.toString());
            if (__DEBUG_DISPLAY_STATEGRAPH) __UPDATE_NETWORK_CB(this.stateGraph.toVisJSNetworkData());
        }

        // Determines what's changed between states a and b, (serialized Level objects)
        // where 'b' is assumed to come after 'a' (time-wise).

    }, {
        key: 'restoreState',


        // Restore previous state of game board.
        value: function restoreState() {
            var _this4 = this;

            if (this.stateStack.length > 0) {
                //this.nodes = this.stateStack.pop();

                this.expressionNodes().forEach(function (n) {
                    return _this4.remove(n);
                });
                this.toolboxNodes().forEach(function (n) {
                    return _this4.remove(n);
                });
                var restored_state = this.stateStack.pop(); // This is a Level object.
                restored_state.exprs.forEach(function (n) {
                    return _this4.add(n);
                });
                restored_state.toolbox.forEach(function (n) {
                    n.toolbox = _this4.toolbox;
                    _this4.add(n);
                });

                this.update();
                this.draw();

                Logger.log('state-restore', this.toString());
            }
        }
    }, {
        key: 'dumpState',
        value: function dumpState() {
            console.warn('no longer implemented');
            // if (this.stateStack.length > 0) {
            //     this.stateStack.pop();
            // }
        }
    }, {
        key: 'onorientationchange',
        value: function onorientationchange() {
            if (__IS_MOBILE) {
                if (this.md.phone()) {
                    this.scale = 1.0;
                } else if (this.md.tablet()) {
                    this.scale = 1.2;
                } else if (this.md.mobile()) {
                    this.scale = 2.0;
                } else {
                    this.scale = 1.0;
                }
            }
            this.layoutUI();

            if (this.expressionNodes) {
                var bs = this.boundingSize;
                if (this.environmentDisplay) bs.w -= this.environmentDisplay.size.w;
                if (this.toolbox) bs.h -= this.toolbox.size.h;
                var _iteratorNormalCompletion2 = true;
                var _didIteratorError2 = false;
                var _iteratorError2 = undefined;

                try {
                    for (var _iterator2 = this.expressionNodes()[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                        var node = _step2.value;

                        // Check if node offstage or obscured
                        var p = node.pos;
                        var s = node.size;
                        if (p.x > bs.w) {
                            p.x = bs.w - s.w;
                        }
                        if (p.y > bs.h) {
                            p.y = bs.h - s.h;
                        }
                        node.pos = p;
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
            }
        }
    }], [{
        key: 'stateDiff',
        value: function stateDiff(a, b) {
            var has = function has(str, arr) {
                return arr.indexOf(str) > -1;
            };
            var diff = {};
            var computeDiffArray = function computeDiffArray(a, b, key) {
                if (!(key in diff)) diff[key] = {
                    add: [],
                    remove: []
                };
                for (var i = 0; i < a[key].length; i++) {
                    var elem = a[key][i];
                    if (!has(elem, b[key])) // If a's expr doesn't exist in b, then it was removed.
                        diff[key].remove.push(elem);
                }
                for (var _i = 0; _i < b[key].length; _i++) {
                    var _elem = b[key][_i];
                    if (!has(_elem, a[key])) // If b's expr doesn't exist in a, then it was added.
                        diff[key].add.push(_elem);
                }
                // Cleanup.
                var nothingAdded = diff[key].add.length === 0;
                var nothingRemoved = diff[key].remove.length === 0;
                if (nothingAdded && nothingRemoved) delete diff[key];else if (nothingAdded) delete diff[key]['add'];else if (nothingRemoved) delete diff[key]['remove'];
            };
            var computeDiffObj = function computeDiffObj(a, b, key) {
                if (!(key in a || key in b) || Object.keys(a[key]).length === 0 && Object.keys(b[key]).length === 0) return; // Nothing to do... empty states.

                if (!(key in diff)) diff[key] = {
                    change: {},
                    set: {}
                };

                // So we don't get errors...
                if (!(key in a)) a[key] = {};else if (!(key in b)) b[key] = {};

                for (var varname in a[key]) {
                    if (varname in b[key]) {
                        if (b[key][varname] != a[key][varname]) // Variable has changed values.
                            diff[key].change[varname] = b[key][varname];
                    } else {
                        // Variable was (somehow!) removed. This shouldn't be reachable atm.
                        console.warn('Error!! Variable ', varname, ' found as removed. Weird. Skipping...');
                    }
                }
                for (var _varname in b[key]) {
                    if (!(_varname in a[key])) // New variable was declared and assigned a value.
                        diff[key].set[_varname] = b[key][_varname];
                }

                // Cleanup.
                var nothingChanged = Object.keys(diff[key].change).length === 0;
                var nothingSet = Object.keys(diff[key].set).length === 0;
                if (nothingChanged && nothingSet) delete diff[key];else if (nothingChanged) delete diff[key]['change'];else if (nothingSet) delete diff[key]['set'];
            };

            // Below is a generalized version of doing:
            //   computeDiffArray(a, b, 'board');
            //   computeDiffArray(a, b, 'toolbox');
            //   computeDiffObj(a, b, 'globals');
            for (var key in b) {
                if (Array.isArray(b[key])) computeDiffArray(a, b, key);else computeDiffObj(a, b, key);
            }

            return diff;
        }
    }]);

    return ReductStage;
}(mag.Stage);