'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 *  A parser converting a set of ES6 programs
 *  into a Reduct expression set.
 *
 *  Takes programs as a string,
 *  where each program is separated by a | (if multiple).
 */

var __MACROS = null;
var __TYPING_OPTIONS = {};

var ES6Parser = function () {
    function ES6Parser() {
        _classCallCheck(this, ES6Parser);
    }

    _createClass(ES6Parser, null, [{
        key: 'lockFilter',
        value: function lockFilter(n) {
            if (n.__remain_unlocked) {
                n.__remain_unlocked = undefined;
                return false;
            } else return true;
        }
    }, {
        key: 'makePrimitive',
        value: function makePrimitive(prim) {
            var primitiveArgs = {
                'triangle': [0, 0, 44, 44],
                'rect': [0, 0, 44, 44],
                'star': [0, 0, 25, 5],
                'circle': [0, 0, 22],
                'diamond': [0, 0, 44, 44]
            };
            return new (Function.prototype.bind.apply(ExprManager.getClass(prim), [null].concat(_toConsumableArray(primitiveArgs[prim]))))();
        }
    }, {
        key: 'parse',
        value: function parse(program) {
            var _this = this;

            var macros = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
            var typing_options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

            if (!esprima) {
                console.error('Cannot parse ES6 program: Esprima.js not found. \
            See http://esprima.readthedocs.io/en/latest/getting-started.html \
            for adding Esprima to your page.');
                return null;
            }

            if (program.trim().length === 0) return null;
            // * if we reach here, we can assume single program...

            // Special game-only cases.
            if (program === 'x => x x x') program = 'x => xxx';else if (program === 'x => x x') program = 'x => xx';

            // Parse into AST using Esprima.js.
            var AST = void 0;
            try {
                AST = esprima.parse(program);
            } catch (e) {
                return null;
            }

            // Doing this as a temp. global variable so
            // we avoid passing macros in recursive calls.
            __MACROS = macros;
            __TYPING_OPTIONS = typing_options ? typing_options : {};

            // If program has only one statement (;-separated code)
            // just parse and return that Expression.
            // Otherwise, parse all the statements into Expressions separately and
            // return a Sequence Expression (representing a multi-line program).
            var statements = AST.body;
            if (statements.length === 1) {
                var expr = this.parseNode(statements[0]);
                if (!expr) return null;else if (expr instanceof TypeInTextExpr) {
                    expr = new Expression([expr]);
                    expr.holes[0].emptyParent = true;
                }
                expr.lockSubexpressions(this.lockFilter);
                expr.unlock();
                __MACROS = null;
                __TYPING_OPTIONS = {};
                return expr;
            } else if (statements.length === 2 && statements[0].type === "ExpressionStatement") {
                if (statements[0].expression.name === '__unlimited') {
                    var _expr = new InfiniteExpression(this.parseNode(statements[1]));
                    if (!_expr) return null;
                    _expr.graphicNode.__remain_unlocked = true;
                    _expr.lockSubexpressions(this.lockFilter);
                    _expr.unlock();
                    __MACROS = null;
                    __TYPING_OPTIONS = {};
                    return _expr;
                } else if (statements[0].expression.name === '__verbatim') {
                    var _expr2 = this.parseNode(statements[1]);
                    if (!_expr2) return null;
                    if (__ACTIVE_LEVEL_VARIANT === "verbatim_variant") {
                        _expr2.forceTypingOnFill = true;
                        _expr2.stroke = { color: __VERBATIM_COLOR, lineWidth: 4 };
                        console.log('reached');
                    }
                    _expr2.lockSubexpressions(this.lockFilter);
                    _expr2.unlock();
                    __MACROS = null;
                    __TYPING_OPTIONS = {};
                    return _expr2;
                }
            } else {
                var exprs = statements.map(function (n) {
                    return _this.parseNode(n);
                });
                var seq = new (Function.prototype.bind.apply(ExprManager.getClass('sequence'), [null].concat(_toConsumableArray(exprs))))();
                seq.lockSubexpressions(this.lockFilter);
                __MACROS = null;
                __TYPING_OPTIONS = {};
                return seq;
            }
        }

        // Parse an AST node into Reduct expressions.

    }, {
        key: 'parseNode',
        value: function parseNode(ASTNode) {
            var _this2 = this;

            // To see all available types:
            // http://esprima.readthedocs.io/en/latest/syntax-tree-format.html
            var typeSwitcher = {

                /* A base-level token like 'x' */
                'Identifier': function Identifier(node) {

                    // First, check for any chapter-level macros
                    // (like 'a'=>'star') and swap if needed:
                    if (__MACROS && node.name in __MACROS) {
                        var m = __MACROS[node.name];
                        if (m.indexOf("'") > -1) // Strings...
                            return _this2.parseNode({ type: 'Literal', raw: m, value: m.replace(/'/g, "") });else node.name = __MACROS[node.name];
                    }

                    // Check if node is a Reduct reserved identifier (MissingExpression)
                    var valid_missing_exprs = ['_', '_b', '__', '_n', '_v', '_l'];
                    if (valid_missing_exprs.indexOf(node.name) > -1) {
                        var missing = new (ExprManager.getClass(node.name))();
                        missing.__remain_unlocked = true;
                        return missing;
                    } else if (node.name.substring(0, 2) === '_t') return TypeInTextExpr.fromExprCode(node.name);else if (node.name === '_notch') return new (ExprManager.getClass('notch'))(1);else if (ExprManager.isPrimitive(node.name)) // If this is the name of a Reduct primitive (like 'star')...
                        return _this2.makePrimitive(node.name);else if (node.name.indexOf('__') === 0 && ExprManager.isPrimitive(node.name.substring(2))) // e.g. __star
                        return _this2.makePrimitive(node.name.substring(2));

                    // Otherwise, treat this as a variable name...
                    return new (ExprManager.getClass('var'))(node.name);
                },

                /* A primitive that's part of the language. Has 'value':
                    boolean | number | string | RegExp | null
                   and a corresponding 'raw' version, which is just the value-as-a-string.
                */
                'Literal': function Literal(node) {
                    if (node.value instanceof RegExp) {
                        console.error('Regular expressions are currently undefined.');
                        return null;
                    } else if (typeof node.value === 'string' || node.value instanceof String) {
                        if (ExprManager.isPrimitive(node.value)) {
                            // If this is the name of a Reduct primitive (like 'star')...
                            return _this2.makePrimitive(node.value);
                        } else {
                            // Otherwise this stands for a "string" value.
                            return new (ExprManager.getClass('string'))(node.value);
                        }
                    } else if (Number.isNumber(node.value)) {
                        return new (ExprManager.getClass('number'))(node.value);
                    } else if (node.value === null) {
                        return new NullExpr(0, 0, 64, 64);
                    } else {
                        // Booleans should be left.
                        return new (ExprManager.getClass(node.raw))();
                    }
                },

                /* e.g. [2, true, x] */
                'ArrayExpression': function ArrayExpression(node) {
                    var arr = new (ExprManager.getClass('array'))(0, 0, 54, 54, []);
                    node.elements.forEach(function (e) {
                        return arr.addItem(_this2.parseNode(e));
                    });
                    return arr;
                },

                /* A single statement like (x == x); or (x) => x; */
                'ExpressionStatement': function ExpressionStatement(node) {
                    return _this2.parseNode(node.expression);
                },

                /* A function call of the form f(x) */
                'CallExpression': function CallExpression(node) {
                    if (node.callee.type === 'Identifier' && node.callee.name === '$') {
                        if (node.arguments.length === 0 || node.arguments.length > 1) {
                            console.error('Malformed unlock expression $ with ' + node.arguments.length + ' arguments.');
                            return null;
                        } else {
                            var unlocked_expr = _this2.parseNode(node.arguments[0]);
                            unlocked_expr.unlock();
                            unlocked_expr.__remain_unlocked = true; // When all inner expressions are locked in parse(), this won't be.
                            return unlocked_expr;
                        }
                    } else if (node.callee.type === 'Identifier' && node.callee.name === '__unlimited') {
                        // Special case: infinite resources (meant to be used in toolbox).
                        var e = new InfiniteExpression(_this2.parseNode(node.arguments[0]));
                        e.unlock();
                        e.graphicNode.unlock();
                        e.__remain_unlocked = true;
                        e.graphicNode.__remain_unlocked = true;
                        return e;
                    } else if (node.callee.type === 'Identifier' && node.callee.name === '_op') {
                        // Special case: Operators like +, =, !=, ==, etc...
                        return new OpLiteral(node.arguments[0].value);
                    } else if (node.callee.type === 'Identifier' && node.callee.name === 'give') {
                        return new (ExprManager.getClass('give'))(_this2.parseNode(node.arguments[0]), _this2.parseNode(node.arguments[1]));
                    } else if (node.callee.type === 'MemberExpression' && node.callee.property.name === 'map') {
                        return new (ExprManager.getClass('map'))(_this2.parseNode(node.arguments[0]), _this2.parseNode(node.callee.object));
                    } else if (node.callee.type === 'Identifier') {

                        if (node.callee.name.substring(0, 2) === '_t') {

                            var type_expr = void 0;
                            if (node.callee.name === '_t_arrow') type_expr = new (ExprManager.getClass('typing_arrow'))(_this2.parseNode(node.arguments[0]));else {
                                type_expr = TypeInTextExpr.fromExprCode(node.callee.name);
                                if (node.arguments.length === 1 && node.arguments[0].type === 'Literal') type_expr.typeBox.text = node.arguments[0].value;
                            }
                            return type_expr;
                        }

                        // Special case 'foo(_t_params)': Call parameters (including paretheses) will be entered by player.
                        if (node.arguments.length === 1 && node.arguments[0].type === 'Identifier' && node.arguments[0].name === '_t_params') return new NamedFuncExpr(node.callee.name, '_t_params');else // All other cases, including special case _t_varname(...) specifying that call name will be entered by player.
                            return new (Function.prototype.bind.apply(NamedFuncExpr, [null].concat([node.callee.name, null], _toConsumableArray(node.arguments.map(function (a) {
                                return _this2.parseNode(a);
                            })))))();
                    } else {
                        console.error('Call expressions involving callee name resolution are currently undefined.');
                        return null;
                    }
                },

                /* Anonymous functions of the form (x) => x */
                'ArrowFunctionExpression': function ArrowFunctionExpression(node) {
                    if (node.params.length === 1 && node.params[0].type === 'Identifier') {
                        // Return new Lambda expression (anonymous function) at current stage of concreteness.
                        var lambda = new (ExprManager.getClass('lambda_abstraction'))([new (ExprManager.getClass('hole'))(node.params[0].name)]);
                        if (node.body.type === 'Identifier' && node.body.name === 'xx') {
                            lambda.addArg(_this2.parseNode({ type: 'Identifier', name: 'x' }));
                            lambda.addArg(_this2.parseNode({ type: 'Identifier', name: 'x' }));
                        } else if (node.body.type === 'Identifier' && node.body.name === 'xxx') {
                            lambda.addArg(_this2.parseNode({ type: 'Identifier', name: 'x' }));
                            lambda.addArg(_this2.parseNode({ type: 'Identifier', name: 'x' }));
                            lambda.addArg(_this2.parseNode({ type: 'Identifier', name: 'x' }));
                        } else {
                            var body = _this2.parseNode(node.body);
                            lambda.addArg(body);
                        }
                        lambda.hole.__remain_unlocked = true;
                        return lambda;
                    } else {
                        console.warn('Lambda expessions with more than one input are currently undefined.');
                        return null;
                    }
                },

                'AssignmentExpression': function AssignmentExpression(node) {
                    if (node.left.name === '__return') // Return statement conversion. Hacked because esprima won't parse 'return x' at top-level.
                        return new (ExprManager.getClass('return'))(_this2.parseNode(node.right));

                    var result = new (ExprManager.getClass('assign'))(_this2.parseNode(node.left), _this2.parseNode(node.right));
                    mag.Stage.getNodesWithClass(MissingExpression, [], true, [result]).forEach(function (n) {
                        n.__remain_unlocked = true;
                    });
                    return result;
                },

                /*  BinaryExpression includes the operators:
                    'instanceof' | 'in' | '+' | '-' | '*' | '/' | '%' | '**' | '|' | '^' |
                    '&' | '==' | '!=' | '===' | '!==' | '<' | '>' | '<=' | '<<' | '>>' | '>>>'
                */
                'BinaryExpression': function BinaryExpression(node) {
                    if (node.operator === '>>>') {
                        var _ret = function () {
                            // Special typing-operators expression:
                            var comp = new (ExprManager.getClass('=='))(_this2.parseNode(node.left), _this2.parseNode(node.right), '>>>');
                            if ('>>>' in __TYPING_OPTIONS) {
                                (function () {
                                    var valid_operators = __TYPING_OPTIONS['>>>'].slice();
                                    var hint_text = valid_operators.join(' or ');
                                    var validator = function validator(txt) {
                                        return valid_operators.indexOf(txt) > -1;
                                    };
                                    comp.holes[1] = new TypeInTextExpr(validator, function (finalText) {
                                        var locked = comp.locked;
                                        comp.funcName = finalText;
                                        if (finalText === '+') {
                                            // If this is concat, we have to swap the CompareExpr for an AddExpr...
                                            var addExpr = new AddExpr(comp.leftExpr.clone(), comp.rightExpr.clone());
                                            var parent = comp.parent || comp.stage;
                                            parent.swap(comp, addExpr);
                                            if (locked) addExpr.lock();
                                            if (__AUTO_REDUCE_ON_TYPING_COMMIT && !addExpr.parent && !addExpr.hasPlaceholderChildren()) addExpr.performUserReduction();
                                        } else if (finalText === '==') {
                                            // If this is concat, we have to swap the CompareExpr for an AddExpr...
                                            var cmpExpr = new FadedCompareExpr(comp.leftExpr.clone(), comp.rightExpr.clone(), '==');
                                            var _parent = comp.parent || comp.stage;
                                            _parent.swap(comp, cmpExpr);
                                            if (locked) cmpExpr.lock();
                                            if (__AUTO_REDUCE_ON_TYPING_COMMIT && !cmpExpr.parent && !cmpExpr.hasPlaceholderChildren()) cmpExpr.performUserReduction();
                                        } else if (finalText === '=') {
                                            // If assignment, swap for AssignmentExpression.
                                            var assignExpr = new EqualsAssignExpr(comp.leftExpr.clone(), comp.rightExpr.clone());
                                            var _parent2 = comp.parent || comp.stage;
                                            _parent2.swap(comp, assignExpr);
                                            if (locked) assignExpr.lock();
                                        }
                                    });
                                    comp.holes[1].onTextChanged = function (txt, validated) {
                                        txt = txt.trim();
                                        comp.baseShape = 'rounded';
                                        if (!validated) comp.color = 'lightgray';else if (txt === '==') {
                                            comp.color = 'DeepPink';
                                            comp.baseShape = 'hexa';
                                        } else if (txt === '+') comp.color = '#ffcc00';
                                    };
                                    comp.holes[1].typeBox.onFocus = function () {
                                        if (!this.hasHint()) showHintText(hint_text);
                                    };
                                    comp.holes[1].typeBox.onBlur = function () {
                                        hideHintText();
                                    };
                                })();
                            } else {
                                comp.holes[1] = TypeInTextExpr.fromExprCode('_t_equiv', function (finalText) {
                                    comp.funcName = finalText;
                                }); // give it a nonexistent funcName
                            }
                            comp.holes[1].typeBox.color = "#eee";
                            comp.children[1] = comp.holes[1];
                            comp.children[1].parent = comp; // patch child...
                            return {
                                v: comp
                            };
                        }();

                        if ((typeof _ret === 'undefined' ? 'undefined' : _typeof(_ret)) === "object") return _ret.v;
                    } else if (node.operator === '>>') {
                        var _comp = new (ExprManager.getClass('=='))(_this2.parseNode(node.left), _this2.parseNode(node.right), '>>');
                        var me = new MissingOpExpression();
                        me.parent = _comp;
                        me.__remain_unlocked = true;
                        _comp.holes[1] = _comp.children[1] = me;
                        return _comp;
                    } else if (node.operator === '%') {
                        // Modulo only works on integer dividends at the moment...
                        var ModuloClass = ExprManager.getClass(node.operator);
                        if (node.right.type === 'Literal' && Number.isNumber(node.value)) return new ModuloClass(_this2.parseNode(node.left), node.right.value);else return new ModuloClass(_this2.parseNode(node.left), _this2.parseNode(node.right));
                    } else if (ExprManager.hasClass(node.operator)) {
                        var BinaryExprClass = ExprManager.getClass(node.operator);
                        if (node.operator in CompareExpr.operatorMap()) return new BinaryExprClass(_this2.parseNode(node.left), _this2.parseNode(node.right), node.operator);else return new BinaryExprClass(_this2.parseNode(node.left), _this2.parseNode(node.right));
                    }
                },

                /*  LogicalExpression includes && and || */
                'LogicalExpression': function LogicalExpression(node) {
                    var map = { '&&': 'and', '||': 'or' };
                    var op = map[node.operator];
                    return new (ExprManager.getClass(op))(_this2.parseNode(node.left), _this2.parseNode(node.right), op);
                },

                'UnaryExpression': function UnaryExpression(node) {
                    if (node.operator === '!') {
                        return new (ExprManager.getClass('not'))(_this2.parseNode(node.argument), 'not');
                    } else {
                        console.warn('Unknown unary expression ' + node.operator + ' not supported at this time.');
                        return null;
                    }
                },

                /*  Ternary expression ?:  */
                'ConditionalExpression': function ConditionalExpression(node) {
                    return new (ExprManager.getClass('ifelse'))(_this2.parseNode(node.test), _this2.parseNode(node.consequent), _this2.parseNode(node.alternate));
                },

                /* A JS ES6 Class.
                   In Reduct, an Object container.
                   * TODO: Methods with the name _ should define unfilled 'notches' on the side of the object. *
                */
                'ClassDeclaration': function ClassDeclaration(node) {
                    var obj = new PlayPenExpr(node.id.name);
                    var funcs = node.body.body.map(function (e) {
                        return _this2.parseNode(e);
                    });
                    obj.setMethods(funcs);
                    // TODO: Predefined methods, notches, floating exprs, etc.
                    return obj;
                },
                'MethodDefinition': function MethodDefinition(node) {
                    // This wraps a FunctionExpression for classes:
                    if (node.key.name === '_notch') // extra notches inside objects
                        return _this2.parseNode(node.key);
                    node.value.id = node.key.name; // So that the FunctionExpression node parser knows the name of the function...
                    return _this2.parseNode(node.value);
                },
                'FunctionExpression': function FunctionExpression(node) {
                    return new (ExprManager.getClass('define'))(_this2.parseNode(node.body), node.id ? node.id : '???', node.params.map(function (id) {
                        return id.name;
                    }));
                },
                'FunctionDeclaration': function FunctionDeclaration(node) {
                    return new (ExprManager.getClass('define'))(_this2.parseNode(node.body), node.id ? node.id.name : '???', node.params.map(function (id) {
                        return id.name;
                    }));
                },
                'BlockStatement': function BlockStatement(node) {
                    if (node.body.length === 1) {
                        if (node.body[0].type === 'ReturnStatement') {
                            if (ExprManager.getFadeLevel('define') === 0) return _this2.parseNode(node.body[0].argument);else return new (ExprManager.getClass('return'))(_this2.parseNode(node.body[0].argument));
                        } else {
                            return _this2.parseNode(node.body[0]);
                        }
                    } else {
                        console.error('Block expressions longer than a single statement are not yet supported.', node.body);
                        return null;
                    }
                },
                'IfStatement': function IfStatement(node) {
                    return new (ExprManager.getClass('ifelseblock'))(_this2.parseNode(node.test), _this2.parseNode(node.consequent), _this2.parseNode(node.alternate));
                },
                'ReturnStatement': function ReturnStatement(node) {
                    return new (ExprManager.getClass('return'))(_this2.parseNode(node.argument));
                }
            };

            // Apply!
            if (ASTNode.type in typeSwitcher) return typeSwitcher[ASTNode.type](ASTNode);else {
                console.log(ASTNode);
                console.error('@ ES6Parser.parseNode: No converter specified for AST Node of type ' + ASTNode.type);
                return null;
            }
        }
    }]);

    return ES6Parser;
}();