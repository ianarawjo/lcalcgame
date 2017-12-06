/**
 *  A parser converting a set of ES6 programs
 *  into a Reduct expression set.
 *
 *  Takes programs as a string,
 *  where each program is separated by a | (if multiple).
 */

var __MACROS = null;
var __TYPING_OPTIONS = {};

class ES6Parser {

    static lockFilter(n) {
        if (n.__remain_unlocked) {
            n.__remain_unlocked = undefined;
            return false;
        } else return true;
    }
    static makePrimitive(prim) {
        const primitiveArgs = {
            'triangle':[0,0,44,44],
            'rect':[0,0,44,44],
            'star':[0,0,25,5],
            'circle':[0,0,22],
            'diamond':[0,0,44,44]
        };
        return new (ExprManager.getClass(prim))(...primitiveArgs[prim]);
    }

    static parse(program, macros=null, typing_options={}) {
        if (!esprima) {
            console.error('Cannot parse ES6 program: Esprima.js not found. \
            See http://esprima.readthedocs.io/en/latest/getting-started.html \
            for adding Esprima to your page.');
            return null;
        }

        if (program.trim().length === 0)
            return null;
        // * if we reach here, we can assume single program...

        // Special game-only cases.
        if (program === 'x => x x x')
            program = 'x => xxx';
        else if (program === 'x => x x')
            program = 'x => xx';

        // Parse into AST using Esprima.js.
        let AST;
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
        let statements = AST.body;
        if (statements.length === 1) {
            let expr = this.parseNode(statements[0]);
            if (!expr) return null;
            else if (expr instanceof TypeInTextExpr) {
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
                let expr = new InfiniteExpression(this.parseNode(statements[1]));
                if (!expr) return null;
                expr.graphicNode.__remain_unlocked = true;
                expr.lockSubexpressions(this.lockFilter);
                expr.unlock();
                __MACROS = null;
                __TYPING_OPTIONS = {};
                return expr;
            } else if (statements[0].expression.name === '__verbatim') {
                let expr = this.parseNode(statements[1]);
                if (!expr) return null;
                if (__ACTIVE_LEVEL_VARIANT === "verbatim_variant") {
                    expr.forceTypingOnFill = true;
                    expr.stroke = { color:'magenta', lineWidth:4 };
                }
                expr.lockSubexpressions(this.lockFilter);
                expr.unlock();
                __MACROS = null;
                __TYPING_OPTIONS = {};
                return expr;
            }
        } else {
            let exprs = statements.map((n) => this.parseNode(n));
            let seq = new (ExprManager.getClass('sequence'))(...exprs);
            seq.lockSubexpressions(this.lockFilter);
            __MACROS = null;
            __TYPING_OPTIONS = {};
            return seq;
        }
    }

    // Parse an AST node into Reduct expressions.
    static parseNode(ASTNode) {

        // To see all available types:
        // http://esprima.readthedocs.io/en/latest/syntax-tree-format.html
        const typeSwitcher = {

            /* A base-level token like 'x' */
            'Identifier': (node) => {

                // First, check for any chapter-level macros
                // (like 'a'=>'star') and swap if needed:
                if (__MACROS && node.name in __MACROS) {
                    const m = __MACROS[node.name];
                    if (m.indexOf("'") > -1) // Strings...
                        return this.parseNode( {type:'Literal', raw:m, value:m.replace(/'/g, "")} );
                    else
                        node.name = __MACROS[node.name];
                }

                // Check if node is a Reduct reserved identifier (MissingExpression)
                const valid_missing_exprs = [ '_', '_b', '__', '_n', '_v', '_l' ];
                if (valid_missing_exprs.indexOf(node.name) > -1) {
                    let missing = new (ExprManager.getClass(node.name))();
                    missing.__remain_unlocked = true;
                    return missing;
                }
                else if (node.name.substring(0, 2) === '_t')
                    return TypeInTextExpr.fromExprCode(node.name);
                else if (node.name === '_notch')
                    return new (ExprManager.getClass('notch'))(1);
                else if (ExprManager.isPrimitive(node.name)) // If this is the name of a Reduct primitive (like 'star')...
                    return this.makePrimitive(node.name);
                else if (node.name.indexOf('__') === 0 && ExprManager.isPrimitive(node.name.substring(2))) // e.g. __star
                    return this.makePrimitive(node.name.substring(2));
                else if (node.name.indexOf('__') === 0 && node.name.substring(2, 9) === "variant") { // dynamic variant types
                    const description = node.name.substring(10).split("_");
                    if (description.length !== 2) {
                        console.error("Invalid dynamic variant description", node.name);
                        console.debug(description);
                        return null;
                    }
                    const variantClass = description[0];
                    const variantValue = description[1];
                    return new (ExprManager.getClass('dynamic_variant'))(variantClass, variantValue);
                }

                // Otherwise, treat this as a variable name...
                return new (ExprManager.getClass('var'))(node.name);
            },

            /* A primitive that's part of the language. Has 'value':
                boolean | number | string | RegExp | null
               and a corresponding 'raw' version, which is just the value-as-a-string.
            */
            'Literal': (node) => {
                if (node.value instanceof RegExp) {
                    console.error('Regular expressions are currently undefined.');
                    return null;
                } else if (typeof node.value === 'string' || node.value instanceof String) {
                    if (ExprManager.isPrimitive(node.value)) { // If this is the name of a Reduct primitive (like 'star')...
                        return this.makePrimitive(node.value);
                    }
                    else { // Otherwise this stands for a "string" value.
                        return new (ExprManager.getClass('string'))(node.value);
                    }
                } else if (Number.isNumber(node.value)) {
                    return new (ExprManager.getClass('number'))(node.value);
                } else if (node.value === null) {
                    return new NullExpr(0,0,64,64);
                } else { // Booleans should be left.
                    return new (ExprManager.getClass(node.raw))();
                }
            },

            /* e.g. [2, true, x] */
            'ArrayExpression': (node) => {
                let arr = new (ExprManager.getClass('array'))(0,0,54,54,[]);
                node.elements.forEach((e) => arr.addItem(this.parseNode(e)));
                return arr;
            },

            /* A single statement like (x == x); or (x) => x; */
            'ExpressionStatement': (node) => {
                return this.parseNode(node.expression);
            },

            /* A function call of the form f(x) */
            'CallExpression': (node) => {
                if (node.callee.type === 'Identifier' && node.callee.name === '$') {
                    if (node.arguments.length === 0 || node.arguments.length > 1) {
                        console.error('Malformed unlock expression $ with ' + node.arguments.length + ' arguments.');
                        return null;
                    } else {
                        let unlocked_expr = this.parseNode(node.arguments[0]);
                        unlocked_expr.unlock();
                        unlocked_expr.__remain_unlocked = true; // When all inner expressions are locked in parse(), this won't be.
                        return unlocked_expr;
                    }
                } else if (node.callee.type === 'Identifier' && node.callee.name === '__unlimited') { // Special case: infinite resources (meant to be used in toolbox).
                    let e = new InfiniteExpression(this.parseNode(node.arguments[0]));
                    e.unlock();
                    e.graphicNode.unlock();
                    e.__remain_unlocked = true;
                    e.graphicNode.__remain_unlocked = true;
                    return e;
                } else if (node.callee.type === 'Identifier' && node.callee.name === '_op') { // Special case: Operators like +, =, !=, ==, etc...
                    return new OpLiteral(node.arguments[0].value);
                } else if (node.callee.type === 'Identifier' && node.callee.name === 'give') {
                    return new (ExprManager.getClass('give'))(this.parseNode(node.arguments[0]), this.parseNode(node.arguments[1]));
                } else if (node.callee.type === 'MemberExpression' && node.callee.property.name === 'map') {
                    return new (ExprManager.getClass('map'))(this.parseNode(node.arguments[0]), this.parseNode(node.callee.object));
                } else if (node.callee.type === 'Identifier') {

                    if (node.callee.name.substring(0, 2) === '_t') {
                        let type_expr = TypeInTextExpr.fromExprCode(node.callee.name);
                        if (node.arguments.length === 1 && node.arguments[0].type === 'Literal')
                            type_expr.typeBox.text = node.arguments[0].value;
                        return type_expr;
                    }
                    else if (node.callee.name === "_") {
                        // ApplyExpr with placeholder
                        if (node.arguments.length === 0) {
                            console.error("Zero-argument call expressions are currently undefined.");
                            return;
                        }

                        let base = new MissingExpression();
                        for (let arg of node.arguments) {
                            base = new (ExprManager.getClass('apply'))(this.parseNode(arg), base);
                        }
                        return base;
                    }

                    // Special case 'foo(_t_params)': Call parameters (including paretheses) will be entered by player.
                    if (node.arguments.length === 1 && node.arguments[0].type === 'Identifier' && node.arguments[0].name === '_t_params')
                        return new NamedFuncExpr(node.callee.name, '_t_params');
                    else // All other cases, including special case _t_varname(...) specifying that call name will be entered by player.
                        return new NamedFuncExpr(node.callee.name, null, ...node.arguments.map((a) => this.parseNode(a)));
                } else {
                    if (node.arguments.length != 1) {
                        console.error("Multi-argument call expressions are currently undefined.");
                        return;
                    }
                    return new (ExprManager.getClass('apply'))(this.parseNode(node.arguments[0]),
                                                               this.parseNode(node.callee));
                }
            },

            /* Anonymous functions of the form (x) => x */
            'ArrowFunctionExpression': (node) => {
                if (node.params.length === 1 && node.params[0].type === 'Identifier') {
                    // Return new Lambda expression (anonymous function) at current stage of concreteness.
                    let lambda = new (ExprManager.getClass('lambda_abstraction'))([ new (ExprManager.getClass('hole'))(node.params[0].name) ]);
                    if (node.body.type === 'Identifier' && node.body.name === 'xx') {
                        lambda.addArg(this.parseNode( {type:'Identifier',name:'x'} ));
                        lambda.addArg(this.parseNode( {type:'Identifier',name:'x'} ));
                    }
                    else if (node.body.type === 'Identifier' && node.body.name === 'xxx') {
                        lambda.addArg(this.parseNode( {type:'Identifier',name:'x'} ));
                        lambda.addArg(this.parseNode( {type:'Identifier',name:'x'} ));
                        lambda.addArg(this.parseNode( {type:'Identifier',name:'x'} ));
                    }
                    else {
                        let body = this.parseNode(node.body);
                        lambda.addArg(body);
                    }
                    lambda.hole.__remain_unlocked = true;
                    return lambda;
                } else {
                    console.warn('Lambda expessions with more than one input are currently undefined.');
                    return null;
                }
            },

            'AssignmentExpression': (node) => {
                if (node.left.name === '__return') // Return statement conversion. Hacked because esprima won't parse 'return x' at top-level.
                    return new (ExprManager.getClass('return'))(this.parseNode(node.right));

                let result = new (ExprManager.getClass('assign'))(this.parseNode(node.left), this.parseNode(node.right));
                mag.Stage.getNodesWithClass(MissingExpression, [], true, [result]).forEach((n) => {
                    n.__remain_unlocked = true;
                });
                return result;
            },

            /*  BinaryExpression includes the operators:
                'instanceof' | 'in' | '+' | '-' | '*' | '/' | '%' | '**' | '|' | '^' |
                '&' | '==' | '!=' | '===' | '!==' | '<' | '>' | '<=' | '<<' | '>>' | '>>>'
            */
            'BinaryExpression': (node) => {
                if (node.operator === '>>>') { // Special typing-operators expression:
                    let comp = new (ExprManager.getClass('=='))(this.parseNode(node.left), this.parseNode(node.right), '>>>');
                    if ('>>>' in __TYPING_OPTIONS) {
                        const valid_operators = __TYPING_OPTIONS['>>>'].slice();
                        const hint_text = valid_operators.join(' or ');
                        const validator = (txt) => (valid_operators.indexOf(txt) > -1);
                        comp.holes[1] = new TypeInTextExpr(validator, (finalText) => {
                            const locked = comp.locked;
                            comp.funcName = finalText;
                            if (finalText === '+') { // If this is concat, we have to swap the CompareExpr for an AddExpr...
                                const addExpr = new AddExpr(comp.leftExpr.clone(), comp.rightExpr.clone());
                                const parent = (comp.parent || comp.stage);
                                parent.swap(comp, addExpr);
                                if (locked) addExpr.lock();
                                if (__AUTO_REDUCE_ON_TYPING_COMMIT &&
                                    !addExpr.parent && !addExpr.hasPlaceholderChildren())
                                    addExpr.performUserReduction();
                            }
                            else if (finalText === '==') { // If this is concat, we have to swap the CompareExpr for an AddExpr...
                                const cmpExpr = new FadedCompareExpr(comp.leftExpr.clone(), comp.rightExpr.clone(), '==');
                                const parent = (comp.parent || comp.stage);
                                parent.swap(comp, cmpExpr);
                                if (locked) cmpExpr.lock();
                                if (__AUTO_REDUCE_ON_TYPING_COMMIT &&
                                    !cmpExpr.parent && !cmpExpr.hasPlaceholderChildren())
                                    cmpExpr.performUserReduction();
                            }
                            else if (finalText === '=') { // If assignment, swap for AssignmentExpression.
                                const assignExpr = new EqualsAssignExpr(comp.leftExpr.clone(), comp.rightExpr.clone());
                                const parent = (comp.parent || comp.stage);
                                parent.swap(comp, assignExpr);
                                if (locked) assignExpr.lock();
                            }
                        });
                        comp.holes[1].onTextChanged = function (txt, validated) {
                            txt = txt.trim();
                            comp.baseShape = 'rounded';
                            if (!validated)
                                comp.color = 'lightgray';
                            else if (txt === '==') {
                                comp.color = 'DeepPink';
                                comp.baseShape = 'hexa';
                            } else if (txt === '+')
                                comp.color = '#ffcc00';
                        };
                        comp.holes[1].typeBox.onFocus = function () {
                            if (!this.hasHint())
                                showHintText(hint_text);
                        };
                        comp.holes[1].typeBox.onBlur = function () {
                            hideHintText();
                        };
                    }
                    else {
                        comp.holes[1] = TypeInTextExpr.fromExprCode('_t_equiv', (finalText) => {
                            comp.funcName = finalText;
                        }); // give it a nonexistent funcName
                    }
                    comp.holes[1].typeBox.color = "#eee";
                    comp.children[1] = comp.holes[1];
                    comp.children[1].parent = comp; // patch child...
                    return comp;
                }
                else if (node.operator === '>>') {
                    let comp = new (ExprManager.getClass('=='))(this.parseNode(node.left), this.parseNode(node.right), '>>');
                    let me = new MissingOpExpression();
                    me.parent = comp;
                    me.__remain_unlocked = true;
                    comp.holes[1] = comp.children[1] = me;
                    return comp;
                }
                else if (node.operator === '%') { // Modulo only works on integer dividends at the moment...
                    let ModuloClass = ExprManager.getClass(node.operator);
                    if (node.right.type === 'Literal' && Number.isNumber(node.value))
                        return new ModuloClass(this.parseNode(node.left), node.right.value);
                    else
                        return new ModuloClass(this.parseNode(node.left), this.parseNode(node.right));
                }
                else if (ExprManager.hasClass(node.operator)) {
                    let BinaryExprClass = ExprManager.getClass(node.operator);
                    if (node.operator in CompareExpr.operatorMap())
                        return new BinaryExprClass(this.parseNode(node.left), this.parseNode(node.right), node.operator);
                    else
                        return new BinaryExprClass(this.parseNode(node.left), this.parseNode(node.right));
                }
            },

            /*  LogicalExpression includes && and || */
            'LogicalExpression': (node) => {
                const map = { '&&':'and', '||':'or' };
                const op = map[node.operator];
                return new (ExprManager.getClass(op))(this.parseNode(node.left), this.parseNode(node.right), op);
            },

            'UnaryExpression': (node) => {
                if (node.operator === '!') {
                    return new (ExprManager.getClass('not'))(this.parseNode(node.argument), 'not');
                } else {
                    console.warn('Unknown unary expression ' + node.operator + ' not supported at this time.');
                    return null;
                }
            },

            /*  Ternary expression ?:  */
            'ConditionalExpression': (node) => {
                return new (ExprManager.getClass('ifelse'))(this.parseNode(node.test), this.parseNode(node.consequent), this.parseNode(node.alternate));
            },

            /* A JS ES6 Class.
               In Reduct, an Object container.
               * TODO: Methods with the name _ should define unfilled 'notches' on the side of the object. *
            */
            'ClassDeclaration': (node) => {
                let obj = new PlayPenExpr(node.id.name);
                let funcs = node.body.body.map((e) => this.parseNode(e));
                obj.setMethods(funcs);
                // TODO: Predefined methods, notches, floating exprs, etc.
                return obj;
            },
            'MethodDefinition': (node) => { // This wraps a FunctionExpression for classes:
                if (node.key.name === '_notch') // extra notches inside objects
                    return this.parseNode(node.key);
                node.value.id = node.key.name; // So that the FunctionExpression node parser knows the name of the function...
                return this.parseNode(node.value);
            },
            'FunctionExpression': (node) => {
                return new (ExprManager.getClass('define'))(this.parseNode(node.body), node.id ? node.id : '???', node.params.map((id) => id.name));
            },
            'FunctionDeclaration': (node) => {
                let body = this.parseNode(node.body);
                if (node.params.length > 0) {
                    node.params.reverse().forEach((param) => {
                        let newBody = new (ExprManager.getClass('lambda_abstraction'))([
                            new (ExprManager.getClass('hole'))(param.name),
                        ]);
                        newBody.addArg(body);
                        body = newBody;
                    });
                }
                return new (ExprManager.getClass('define'))(body, node.id ? node.id.name : '???', node.params.map((id) => id.name));
            },
            'BlockStatement': (node) => {
                if (node.body.length === 1) {
                    if (node.body[0].type === 'ReturnStatement') {
                        if (ExprManager.getFadeLevel('define') === 0)
                            return this.parseNode(node.body[0].argument);
                        else
                            return new (ExprManager.getClass('return'))(this.parseNode(node.body[0].argument));
                    } else {
                        return this.parseNode(node.body[0]);
                    }
                } else {
                    console.error('Block expressions longer than a single statement are not yet supported.', node.body);
                    return null;
                }
            },
            'IfStatement': (node) => {
                return new (ExprManager.getClass('ifelseblock'))(this.parseNode(node.test), this.parseNode(node.consequent), this.parseNode(node.alternate));
            },
            'ReturnStatement': (node) => {
                return new (ExprManager.getClass('return'))(this.parseNode(node.argument));
            },
            'VariableDeclaration': (node) => {
                if (node.kind !== "let") {
                    console.error("Only let-statements are supported.");
                    return;
                }
                if (node.declarations.length !== 1) {
                    console.error("Only one definition per let expression is supported.");
                    return null;
                }
                return new (ExprManager.getClass('define'))(
                    this.parseNode(node.declarations[0].init),
                    node.declarations[0].id.name, []);
            },
        }

        // Apply!
        if (ASTNode.type in typeSwitcher)
            return typeSwitcher[ASTNode.type](ASTNode);
        else {
            console.log(ASTNode);
            console.error('@ ES6Parser.parseNode: No converter specified for AST Node of type ' + ASTNode.type);
            return null;
        }
    }
}
