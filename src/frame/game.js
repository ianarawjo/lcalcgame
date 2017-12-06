/**
 * A Level is a complete description of a single scenario in this programming game.
 * Given a set of "expressions", a player must manipulate those expressions to
 * reach a "goal" state, with optional support from a "toolbox" of primitive expressions.
 * (*This may change in time.*) */
class Level {

    constructor(expressions, goal, toolbox=null, globals=null) {
        this.exprs = expressions;
        this.goal = goal;
        this.toolbox = toolbox;
        this.globals = globals;
    }

    static getStage() {
        return stage;
    }

    // For saving state.
    // * Returns a (stringifiable) JSON object
    // * representing the level, in a similar format to that found
    // * in chapter JSON files.
    serialize() {
        const toString = e => e.toJavaScript();
        let e = {
            board: this.exprs.map(toString),  // Board is now a list of javascript code snippets...
            goal:  this.goal.serialize()      // Goal is the same as it was when loaded from the JSON file.
        };
        if (this.toolbox) e.toolbox = this.toolbox.map(toString); // Toolbox is a list of javascript code snippets, like board.
        if (this.globals) e.globals = this.globals.serialize();   // Environment -> key-value dict for variable bindings.
        return e;
    }

    // Builds a single Stage from the level description,
    // and returns it.
    // FUTURE: (Should take a state graph to persist the state logs across resets to a level.)
    // * The layout should be generated automatically, and consistently.
    // * That way a higher function can 'parse' a text file description of levels --
    // * written in code, for instance -- and generate the entire game on-the-fly.
    build(canvas, priorStateGraph=null) {

        var stage = new ReductStage(canvas);

        // Seed the random number generator so that while randomly generated,
        // levels appear the same each time you play.
        Math.seed = 12045;

        var canvas_screen = stage.boundingSize;

        const assignNodesOnBoard = mag.Stage.getNodesWithClass(AssignExpr, [], true, this.exprs);
        const assignNodesInToolbox = mag.Stage.getNodesWithClass(AssignExpr, [], true, this.toolbox);
        const showEnvironment = this.globals &&
              (Object.keys(this.globals.bindings).length > 0
               || (assignNodesOnBoard && assignNodesOnBoard.length > 0)
               || (assignNodesInToolbox && assignNodesInToolbox.length > 0));
        const envDisplayWidth = showEnvironment ? 0.10 * canvas_screen.w : 0;

        GLOBAL_DEFAULT_SCREENSIZE = stage.boundingSize;

        var screen = {
            height:canvas_screen.h/1.4,
            width:(canvas_screen.w - envDisplayWidth)/1.4,
            y:canvas_screen.h*(1-1/1.4) / 2.0,
            x:(canvas_screen.w*(1-1/1.4) / 2.0)
        };
        var board_packing = this.findFastPacking(this.exprs, screen);
        stage.addAll(board_packing); // add expressions to the stage

        // TODO: Offload this onto second stage?
        var goal_node = this.goal.nodeRepresentation;
        goal_node[1].ignoreGetClassInstance = true;
        var lastChild = goal_node[1].children[goal_node[1].children.length-1];
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
            this.toolbox.forEach((item) => {
                stage.add(item);
                stage.toolbox.addExpression(item, false);
            });
            stage.toolbox.resizeToFitItems();
        }
        // Environment
        if (this.globals) {
            for (let name of this.globals.names()) {
                stage.environment.update(name, this.globals.lookup(name).clone());
            }
        }

        // Checks if the player has completed the level.
        var goal = this.goal;
        stage.expressionNodes = function() {
            // TODO: Offshore the goal nodes onto some other stage.
            var nodes = [];
            var expr;
            for (let n of this.nodes) {
                if (this.uiNodes.indexOf(n) > -1 ||
                    n.constructor.name === 'Rect' ||
                    n.constructor.name === 'ImageRect' ||
                    n.constructor.name === 'MirrorShatterEffect' ||
                    !(n instanceof Expression) ||
                    n.fadingOut ||
                    n.toolbox || n.isSnapped()) continue;
                else if (n instanceof NotchHangerExpr)
                    continue;
                nodes.push(n);
            }
            return nodes;
        }.bind(stage);
        stage.notchHangers = (function() {
            let hangers = [];
            for (let n of this.nodes) {
                if (n instanceof NotchHangerExpr) {
                    n.pos = { x:0, y:80 + 160*hangers.length };
                    n.anchor = {x:0, y:0};
                    hangers.push(n);
                }
            }
            return hangers;
        }.bind(stage))();
        stage.toolboxNodes = function() {
            return this.nodes.filter((n) => n.toolbox && n.toolbox instanceof Toolbox && !n.fadingOut);
        }.bind(stage);
        stage.snappedNodes = function() {
            return this.nodes.filter((n) => n.isSnapped && n.isSnapped());
        };

        stage.testBoard = function(exprs, checkUnpaired=true) {
            let matching = goal.test(exprs.map((n) => n.clone()), this.environmentDisplay);
            if (matching && matching.unpaired) {
                if (checkUnpaired && !stage.mightBeCompleted()) {
                    Animate.wait(500).after(() => {
                        for (let idx of matching.unpaired) {
                            const blink = (e) => Animate.blink(e, 2500, [1, 0, 0], 5).after(() => {
                                blink(e);
                            });
                            blink(exprs[idx]);
                        }
                    });
                }
            }
            else if (matching) { // Pair nodes so that goal nodes reference the actual nodes on-screen (they aren't clones).
                // goal.test returns an array of indexes, referring to the indexes of the expressions passed into the test,
                // ordered by the order of the goal nodes displayed on screen. So the info needed to pair an expression to a goal node.
                // With this we can reconstruct the actual pairing for the nodes on-screen (not clones).
                if (exprs.length === 0 && matching.length === 1) { // Memory state match; glow the environment value instead...
                    let e = this.environmentDisplay.getBinding(matching[0]).getExpr();
                    let pairs = [[e, this.goalNodes[0].getValue()]];
                    return pairs;
                } else {
                    let pairs = matching.map((j, i) => [ exprs[j], this.goalNodes[i] ] );
                    return pairs;
                }
            }
            return false;
        }.bind(stage);
        stage.isCompleted = function() {
            return this.testBoard(this.expressionNodes());
        }.bind(stage);

        // Default animation on expression creation:
        stage.expressionNodes().forEach((n) => {
            n.scale = { x:0.5, y:0.5 };
            n.anchor = { x:0.5, y:0.5 };
            // Adjust positions to account for the new anchor
            n.pos = { x: n.pos.x + 0.5 * n.size.w, y: n.pos.y + 0.5 * n.size.h };
            Animate.tween(n, { scale:{x:1,y:1} }, 500, (elapsed) => Math.pow(elapsed, 0.3));
        });
        stage.goalNodes.forEach((n) => {
            n.pos = addPos(n.pos, { x:n.size.w/2.0, y:n.size.h/2.0 });
            n.anchor = { x:0.5, y:0.5 };
            n.scale = { x:0.5, y:0.5 };
            Animate.tween(n, { scale:{x:1,y:1} }, 500, (elapsed) => Math.pow(elapsed, 0.3));
        });
        const toolboxNodes = stage.toolboxNodes();
        const numToolboxNodes = toolboxNodes.length;
        toolboxNodes.forEach((n, i) => {
            let final_pos = n.pos;
            const scale = n.scale.x;
            const delay = numToolboxNodes <= 8 ? ((i) => 500 + i * 100) : ((i) => 300 + i * 50);
            n.pos = addPos(n.pos, { x:400, y:0 });
            n.scale = { x:0.8, y:0.8 };
            Animate.tween(n, { pos:final_pos, scale:{x:scale,y:scale} }, delay(i), (elapsed) => Math.pow(elapsed, 0.3));
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
    static make(desc) {
        let {
            board: expr_descs,
            goal: goal_descs,
            toolbox: toolbox_descs,
            globals: globals_descs,
            resources: resources,
            language: language,
            macros: macros,
            typing_options: typing_options,
            typing_hints: typing_hints,
            typing_help: typing_help,
            help_text: help_text,
            syntax_unlock: syntax_unlock
        } = desc;

        const setupVariant = (variant) => {
            if ('board' in variant) expr_descs = variant.board;
            if ('toolbox' in variant) toolbox_descs = variant.toolbox;
            if ('goal' in variant) goal_descs = variant.goal;
            if ('globals' in variant) globals_descs = variant.globals;
            if ('typing_hints' in variant) typing_hints = variant.typing_hints;
            if ('help_text' in variant) help_text = variant.help_text;
        };

        const variant = __ACTIVE_LEVEL_VARIANT == "verbatim_variant" ? "block_variant" : __ACTIVE_LEVEL_VARIANT;
        if (variant && variant in desc)
            setupVariant(desc[variant]);

        if (help_text && help_text.length > 0)
            showHelpText(help_text);

        const exprs = Level.parse(expr_descs, language, macros, typing_options);
        for (let expr of exprs) {
            if (expr === null || expr === undefined) {
                console.warning("Undefined or null expression when constructing level");
                console.info(expr_descs);
            }
            else if (expr instanceof ExprManager.getClass('define')) {
                // Auto-insert notches for definitions
                exprs.push(new (ExprManager.getClass('notch'))(1));
            }
        }

        var lvl = new Level(
            exprs,
            new Goal(new ExpressionPattern(Level.parse(goal_descs, language, macros, typing_options)), goal_descs, resources.aliens),
            toolbox_descs ? Level.parse(toolbox_descs, language, macros, typing_options) : null,
            Environment.parse(globals_descs)
        );

        if (typing_hints) {
            let typing_exprs = mag.Stage.getNodesWithClass(TypeInTextExpr, [], true, lvl.exprs);
            for (let i = 0; i < typing_exprs.length && i < typing_hints.length; i++) {

                const hint = typing_hints[i];
                if (typeof hint === "object") {
                    typing_exprs[i].enforceHint(hint.hint);
                    if ("syntax_unlock" in hint) {
                        const syntax_key = hint.syntax_unlock;
                        typing_exprs[i].runOnCommit(function () {
                            const stage = this.stage;
                            if (!stage) console.error('Cannot unlock syntax: Expression is not part of stage', this);
                            return stage.unlockSyntax(syntax_key, this).then(Promise.reject);
                        });
                    }
                } else {
                    typing_exprs[i].enforceHint(hint);
                }

                typing_exprs[i].typeBox.update();
            }
        }
        if (typing_help) {
            const hint_text = typing_help;
            const onFocus = function() {
                showHintText(hint_text);
            };
            const onBlur = function() {
                hideHintText();
            };
            let typing_exprs = mag.Stage.getNodesWithClass(TypeInTextExpr, [], true, lvl.exprs);
            typing_exprs.forEach((e) => {
                e.typeBox.onFocus = onFocus;
                e.typeBox.onBlur  = onBlur;
            });
        }

        return lvl;
    }
    static splitParen(s) {
        s = s.trim();
        var depth = 0;
        var paren_idx = 0;
        var expr_descs = [];
        for (let i = 0; i < s.length; i++) {
            if (s[i] === '(') {
                if (depth === 0) paren_idx = i + 1;
                depth++;
            }
            else if (s[i] === ')') {
                depth--;
                if (depth === 0) expr_descs.push(s.substring(paren_idx, i));
            }
        }
        if (expr_descs.length === 0) expr_descs.push(s);
        return expr_descs;
    }
    static parse(desc, language="reduct-scheme", macros=null, typing_options=null) {
        if (desc.length === 0) return [];
        else if (!Array.isArray(desc) && desc === Object(desc)) { // If desc is an object, then it's a globals specifier...
            // TODO: Expand to multiple globals.
            // console.log('Parsing variable goal...', desc);
            let keys = Object.keys(desc);
            return new (ExprManager.getClass('vargoal'))(keys[0], Level.parse(desc[keys[0]], language, macros)[0]);
        }

        if (language === "JavaScript") {
            // Use ES6 parser
            if (Array.isArray(desc)) return desc.map((d) => ES6Parser.parse(d, macros, typing_options));
            else                     return [ES6Parser.parse(desc, macros, typing_options)];
        }
        else if (language === "reduct-scheme" || !language) {

            // Split string by top-level parentheses.
            var descs = this.splitParen(desc);
            //console.log('descs', descs);

            // Parse expressions recursively.
            let es = descs.map((expr_desc) => Level.parseExpr(expr_desc, macros));
            let LambdaClass = ExprManager.getClass('lambda_abstraction');
            es = es.map((e) => e instanceof LambdaHoleExpr ? new LambdaClass([e]) : e);
            //console.log('exprs', es);
            return es;
        }
    }
    static parseExpr(desc, macros=null) {

        const LOCK_MARKER = '/';
        const lock = (e, locked=true) => {
            if (locked) e.lock();
            else        e.unlock();
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
            for (let i = 0; i < s.length; i++) {
                if (s[i] === '(') {
                    if (depth === 0) {
                        expr_idx = i;
                        paren_locked = i > 0 && s[i-1] === LOCK_MARKER;
                    }
                    depth++;
                } else if (s[i] === ')') {
                    depth--;
                } else if (depth === 0 && s[i] === ' ') {
                    let desc = s.substring(expr_idx, i);
                    if (paren_locked) desc = LOCK_MARKER + desc;
                    args.push( desc );
                    expr_idx = i + 1;
                    paren_locked = false;
                }
            }
            if (expr_idx < s.length) {
                let desc = s.substring(expr_idx);
                if (paren_locked) desc = LOCK_MARKER + desc;
                args.push( desc );
            }
            return args;
        }

        // Parse a single (top-level) expression.
        var args = splitArgs(desc);

        // If there are multiple arguments, parse them recursively, then compress into single expression.
        if (args.length > 1) {

            //console.log('parsing expr with multiple args', args, toplevel_lock);

            var exprs = args.map((arg) => Level.parseExpr(arg, macros));
            //console.log(' >> inner exprs', exprs);
            if (Array.isArray(exprs[0])) { // array of expressions
                return lock(new Expression(exprs), toplevel_lock);
            } else { // Class name. Invoke the instantiator.
                var op_class = exprs[0];
                if (!(op_class instanceof LambdaHoleExpr) &&
                    !(op_class instanceof Sequence) &&
                    !(op_class instanceof BagExpr) &&
                    !(op_class instanceof ArrayObjectExpr) &&
                    op_class.length !== exprs.length-1) { // missing an argument, or there's an extra argument:
                    //console.warn('Operator-argument mismatch with exprs: ', exprs);
                    //console.warn('Continuing...');
                }
                for (let i = 1; i < exprs.length; i++) { // Cast the other arguments into expressions.
                    if (Array.isArray(exprs[i])) exprs[i] = new Expression(exprs[i]); // wrap in paren
                    else if (isClass(exprs[i])) {
                        //if (exprs[i].length > 0)
                        //    console.warn('Instantiating expression class ', exprs[i], ' with 0 arguments when it expects ' + exprs[i].length + '.');
                        exprs[i] = constructClassInstance(exprs[i], null);
                    }
                    else if (isInstanceOfClass(exprs[i], Expression)) { } // Nothing to fix.
                    else {
                        //console.error("Expression ", exprs[i], ' not of known type.');
                    }
                }
                if (op_class instanceof LambdaHoleExpr) {
                    let LambdaClass = ExprManager.getClass('lambda_abstraction');
                    var lexp = new LambdaClass([op_class]);
                    for (let i = 1; i < exprs.length; i++) { lexp.addArg(exprs[i]); }
                    return lock(lexp, toplevel_lock);
                }
                else if (op_class instanceof NotchHangerExpr) {
                    op_class.pos = {x:0, y:80};
                    return op_class;
                }
                else if (op_class instanceof BagExpr) {
                    let bag = op_class;
                    let sz = bag.graphicNode.size;
                    let topsz = bag.graphicNode.topSize ? bag.graphicNode.topSize(sz.w / 2.0) : { w:0, h:0 };

                    for (let i = 1; i < exprs.length; i++)
                        bag.addItem(exprs[i]);

                    // Set start positions of bag items. If from 1 to 6, arrange like dice dots.
                    if (!(op_class instanceof BracketArrayExpr)) {
                        let dotpos = DiceNumber.drawPositionsFor(exprs.length-1);
                        if (dotpos.length > 0) { // Arrange items according to dot positions.
                            bag.arrangeNicely();
                        } else { // Arrange items randomly in bag.
                            exprs.slice(1).forEach((e) => {
                                e.pos = { x:(Math.random() + 0.4) * sz.w / 2.0, y:(Math.random() + 0.7) * sz.h / 2.0 };
                            });
                        }
                    }

                    return lock(bag, toplevel_lock);
                }
                else if (args[0] in CompareExpr.operatorMap()) { // op name is supported comparison operation like ==, !=, etc
                    //console.log('constructing comparator ' + args[0] + ' with exprs ', exprs.slice(1));
                    var es = exprs.slice(1); es.push(args[0]);
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
            'triangle':new (ExprManager.getClass('triangle'))(0,0,44,44),
            'rect':new (ExprManager.getClass('rect'))(0,0,44,44),
            'star':new (ExprManager.getClass('star'))(0,0,25,5),
            'circle':new (ExprManager.getClass('circle'))(0,0,22),
            'diamond':new (ExprManager.getClass('diamond'))(0,0,44,44), // for now
            '_':ExprManager.getClass('_'),
            '__':ExprManager.getClass('__'),
            '_b':ExprManager.getClass('_b'),
            '_v':ExprManager.getClass('_v'),
            'true':new (ExprManager.getClass('true'))(),
            'false':new (ExprManager.getClass('false'))(),
            'cmp':ExprManager.getClass('cmp'),
            '==':ExprManager.getClass('=='),
            '!=':ExprManager.getClass('!='),
            '+':ExprManager.getClass('+'),
            'bag':new (ExprManager.getClass('bag'))(0,0,54,54,[]),
            'count':new (ExprManager.getClass('count'))(),
            'map':ExprManager.getClass('map'),
            'reduce':ExprManager.getClass('reduce'),
            'put':ExprManager.getClass('put'),
            'pop':ExprManager.getClass('pop'),
            'define':ExprManager.getClass('define'),
            'null':new NullExpr(0,0,64,64),
            'assign':ExprManager.getClass('assign'),
            'sequence':ExprManager.getClass('sequence'),
            'repeat':ExprManager.getClass('repeat'),
            'choice':ExprManager.getClass('choice'),
            'snappable':ExprManager.getClass('snappable'),
            'level':ExprManager.getClass('level'),
            'arrayobj':ExprManager.getClass('arrayobj'),
            'infinite':ExprManager.getClass('infinite'),
            'notch':new (ExprManager.getClass('notch'))(1),
            '-':ExprManager.getClass('-'),
            '*':ExprManager.getClass('*'),
            '--':ExprManager.getClass('--'),
            '++': ExprManager.getClass('++'),
            'stringobj':ExprManager.getClass('stringobj'),
            'namedfunc':ExprManager.getClass('namedfunc'),
            'vargoal':ExprManager.getClass('vargoal'),
            'dot':(() => {
                let circ = new CircleExpr(0,0,18);
                circ.color = 'gold';
                return circ;
            })(),
            'give':ExprManager.getClass('give')
        };

        // Macro swap:
        if (macros && arg in macros) {
            arg = macros[arg]; // e.g. arg = macros['a'] = 'star', if arg 'a' => 'star'.
        }

        if (Number.isNumber(arg)) {
            let numexpr = new (ExprManager.getClass('number'))(parseInt(arg));
            lock(numexpr, locked);
            return numexpr;
        }
        else if (arg in op_mappings) {
            if (isInstanceOfClass(op_mappings[arg], Expression)) {
                e = op_mappings[arg].clone();
                lock(e, locked);
            }
            else
                e = op_mappings[arg];
            return e;
        } else if (arg.indexOf('`') > -1) { // treat as string
            return arg.replace('`', '');
        } else if (arg.indexOf('λ') > -1) {
            let varname = arg.replace('λ', '');
            return new (ExprManager.getClass('hole'))(varname);
        } else if (arg.indexOf('#') > -1) {
            let varname = arg.replace('#', '');
            let lambdavar;
            lambdavar = new (ExprManager.getClass('var'))(varname);
            if (varname.indexOf('_') > -1) { // Vars like #/x are draggable.
                varname = varname.replace('_', '');
                lambdavar.ignoreEvents = false; // makes draggable
                lambdavar.name = varname;
            }
            return lambdavar;
        } else if (arg.indexOf('$') > -1) {
            let varname = arg.replace('$', '').replace('_', '');
            // Lock unless there is an underscore in the name
            locked = !(arg.indexOf('_') > -1);
            return lock(new (ExprManager.getClass('var'))(varname), locked);
        } else if (true) {
            let string = new (ExprManager.getClass('string'))(arg);
            return string;
        }
        else {
            console.error('Unknown argument: ', arg);
            return lock(new FadedValueExpr(arg), locked);
        }

        // Unreachable....
    }

    // David's rather terrible packing algorithm. Used if there are a
    // large amount of expressions to pack. It greedily splits the
    // expressions into rows, then lays out the rows with some random
    // deviation to hide that fact.
    findFastPacking(exprs, screen) {
        let y = screen.y;
        let dy = 0;
        let x = screen.x;
        let rows = [];
        let row = [];
        // Greedily distribute the expressions into rows.
        for (let e of exprs) {
            let size = e.size;
            if (x + size.w < screen.width) {
                dy = Math.max(size.h, dy);
            }
            else {
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
        if (row.length) rows.push(row);
        let result = [];

        // Lay out the rows evenly, with randomness to hide the
        // grid-based nature of the algorithm.
        let hPadding = (screen.height - y) / (rows.length + 1);
        y = screen.y + hPadding;
        for (let row of rows) {
            let dy = 0;
            let width = 0;
            for (let e of row) {
                width += e.size.w;
            }
            let wPadding = (screen.width - width) / (row.length + 1);

            let x = screen.x + wPadding;
            for (let e of row) {
                let size = e.size;
                // random() call allows the x and y-position to vary
                // by up to +/- 0.4 of the between-row/between-expr
                // padding. This helps make it look a little less
                // grid-based.
                e.pos = {
                    x: x + ((Math.seededRandom() - 0.5) * 0.8 * wPadding),
                    y: y + ((Math.seededRandom() - 0.5) * 0.8 * hPadding),
                };
                result.push(e);

                x += wPadding + size.w;
                dy = Math.max(dy, size.h);
            }
            y += hPadding + dy;
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
    findBestPacking(exprs, screen) {

        var es = exprs; // clones of the initial expressions to place on the board
        var _this = this;
        if (!Array.isArray(es))
            es = [es];

        // Bounds cache seems to greatly destroy performance
        var sizeCache = {};
        var getSize = function(e) {
            // TODO: a lot of time spent in toString
            if (!sizeCache[e]) sizeCache[e] = e.absoluteSize;
            return sizeCache[e];
        };

        var candidates = [];
        var CANDIDATE_THRESHOLD = 10;
        let iterations = 0;
        while (candidates.length < CANDIDATE_THRESHOLD && iterations < 10000) {
            iterations++;

            // 1. Put the expressions in random places.
            for (let e of es) {
                let size = getSize(e);

                let y = 0;
                while (y < 50) {
                    y = Math.seededRandom() * (screen.height - size.h) + screen.y;
                }

                let x = Math.max(Math.seededRandom() * (screen.width - size.w) + screen.x, screen.x);

                e.pos = { x:x,
                          y:y };
            }

            // 2. Check if they overlap.
            let overlap = false;
            for (let e of es) {
                for(let f of es) {
                    if (e == f) continue;
                    if (intersects(e.absoluteBounds, f.absoluteBounds)) {
                        overlap = true;
                        break;
                    }
                }
                if (overlap === true) break;
            }

            // --> Otherwise, add to the list of candidates.
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
        var keyfor = (i, j) => {
            if (i < j) return (i.toString() + " " + j.toString());
            else       return (j.toString() + " " + i.toString());
        };
        var computePairwiseDist = (a, b) => {
            var sum = 0;
            for (let e of a) { // f is an expression.
                for (let f of b) { // e is an expression.
                    sum += Math.sqrt(Math.pow(e.pos.x - f.pos.x,2) + Math.pow(e.pos.y - f.pos.y,2));
                }
            }
            return sum;
        };
        for (let i = 0; i < len; i++) {
            pairwise_totals[i] = 0;
            for (let j = 0; j < len; j++) {
                var key = keyfor(i, j);
                if (i === j) continue;
                else if (key in pairwise_calcs) {
                    pairwise_totals[i] += pairwise_calcs[key];
                }
                else {
                    pairwise_calcs[key] = computePairwiseDist(candidates[i], candidates[j]);
                    pairwise_totals[i] += pairwise_calcs[key];
                    pairwise_keys.push(key);
                }
            }
        }

        var max = 0;
        var max_idx = -1;
        for (let i = 0; i < len; i++) {
            if (pairwise_totals[i] > max) {
                max = pairwise_totals[i];
                max_idx = i;
            }
        }

        var rtn = candidates[max_idx];
        if (!rtn) {
            rtn = exprs;
        }
        return rtn;
    }
}

/** A Goal describes the conditions
    under which a level can be counted as complete.
    For instance, that the expression should reduce to a Star.
    The input of the comparator function includes both
    the final expression and the entire reduction stack (TODO).
    Simple goals, in the beginning, may only need the final expression.
    However, later on it may be necessary to analyze the reduction stack.
    To do this, extend Goal and create your own test() function.
*/
class Goal {

    constructor(accepted_patterns, desc, alien_images=['alien-function-1']) {
        if (!Array.isArray(accepted_patterns)) accepted_patterns = [accepted_patterns];
        this.patterns = accepted_patterns;
        this.desc = desc; // as backup
        // Choose a random alien to serve as our "goal person"
        this.alien_image = alien_images[Math.floor(Math.random() * alien_images.length)];
    }
    serialize() {
        if (typeof this.desc === 'string') return [this.desc];
        else return this.desc;
    }

    get nodeRepresentation() {
        const md = new MobileDetect(window.navigator.userAgent);
        const BUBBLE_HEIGHT = (__IS_MOBILE && md.phone()) ? 70 : 80;
        const ALIEN_HEIGHT = (__IS_MOBILE && md.phone()) ? 50 : 70;

        var exprs = flatten(this.patterns.map((p) => p.exprs)).map((expr) => expr.clone());
        var bg_accent = new mag.Circle(0, 0, 10);
        bg_accent.color = "#cccccc"; //"#CD853F"; <-- light brown
        bg_accent.shadowOffset = 0;
        bg_accent.anchor = { x: 0.5, y: 0.5 };
        var bg = new mag.Circle(0, 0, 10);
        bg.color = "#2b1d0e";
        bg.shadowOffset = 0;
        bg.anchor = { x: 0.5, y: 0.5 };
        var node = new mag.Rect(0,0,100,50);
        node.color = null;
        node.ignoreEvents = true;

        let bubbleLeftImage = Resource.getImage('caption-long-left');
        let bubbleRightImage = Resource.getImage('caption-long-right');
        let bubbleMidImage = Resource.getImage('caption-long-mid');
        let bubbleLeftWidth = (BUBBLE_HEIGHT / bubbleLeftImage.naturalHeight) * bubbleLeftImage.naturalWidth;
        let bubbleRightWidth = (BUBBLE_HEIGHT / bubbleRightImage.naturalHeight) * bubbleRightImage.naturalWidth;
        let bubbleMidWidth = (BUBBLE_HEIGHT / bubbleMidImage.naturalHeight) * bubbleMidImage.naturalWidth;
        let bubbleLeft = new mag.ImageRect(0, 0, bubbleLeftWidth, BUBBLE_HEIGHT, 'caption-long-left');
        let bubbleRight = new mag.ImageRect(0, 0, bubbleRightWidth, BUBBLE_HEIGHT, 'caption-long-right');

        var exprs_node = new mag.Rect(0,0,0,0);
        exprs_node.addAll(exprs);

        if (exprs.length > 0) {
            exprs[0].pos = { x:bubbleLeft.size.w / 4, y:0 };

            // TODO: Fix the need for this hack.
            if (exprs[0] instanceof BagExpr) {
                //exprs[0].pos = { x:70, y:50 };
                exprs[0].anchor = { x:0, y:0 };
            }

            exprs[0].ignoreEvents = true;
            for(let i = 1; i < exprs.length; i++) {
                exprs[i].pos = addPos({ x:exprs[i-1].size.w, y:0 }, exprs[i-1].pos);
                exprs[i].ignoreEvents = true;
            }
        }

        let image = Resource.getImage(this.alien_image);
        let width = (ALIEN_HEIGHT / image.naturalHeight) * image.naturalWidth;
        let offsetX = 0, offsetY = 0;
        if (width > ALIEN_HEIGHT) {
            offsetY = 0.25 * (width - ALIEN_HEIGHT);
        }
        else {
            offsetX = 0.25 * (ALIEN_HEIGHT - width);
        }
        let alien = new mag.ImageRect(offsetX, offsetY, width, ALIEN_HEIGHT, this.alien_image);

        node.addAll([bg_accent, bg, alien]);

        let bubble = [bubbleLeft];
        if (exprs.length > 0) {
            let lastExpr = exprs[exprs.length - 1];
            let firstExpr = exprs[0];
            let exprsWidth = lastExpr.absolutePos.x + lastExpr.absoluteSize.w - firstExpr.absolutePos.x;

            exprsWidth -= 0.6 * (bubbleLeftWidth + bubbleRightWidth);

            while (exprsWidth > 0) {
                exprsWidth -= bubbleMidWidth - 1;
                bubble.push(new mag.ImageRect(0, 0, bubbleMidWidth, BUBBLE_HEIGHT, 'caption-long-mid'));
            }
        }

        bubble.push(bubbleRight);

        let x = alien.pos.x + alien.size.w - 10;
        for (let b of bubble) {
            b.pos = { x: x, y: -5 };
            x += b.size.w - 1;
        }

        node.addAll(bubble);

        node.pos = { x: 5, y: 5 };
        let maxExprHeight = 0;
        for (let expr of exprs) {
            maxExprHeight = Math.max(maxExprHeight, expr.size.h);
        }
        exprs_node.pos = {
            x: bubble[0].absolutePos.x + 0.3 * bubble[0].absoluteSize.w,
            y: bubble[0].absolutePos.y + bubble[0].absoluteSize.h / 2 - maxExprHeight / 2,
        };
        bg.radius = Math.max(alien.absolutePos.x + alien.absoluteSize.w, ALIEN_HEIGHT);
        bg.radius = Math.max(alien.absolutePos.y + alien.absoluteSize.h, bg.radius);
        bg.radius += 20;
        bg_accent.radius = bg.radius + 10;

        window.test = alien;

        return [node, exprs_node];
    }

    test(exprs, env, reduction_stack=null) {

        for(let pattern of this.patterns) {
            let paired_matching = pattern.test(exprs, env);
            if (paired_matching) return paired_matching;
        }

        return false;
    }

}

/** An ExpressionPattern is like a regex over programming expressions.
 *	(It's really incomplete. I'm to blame for that. But TODO!)
 *	For right now, this just takes a single Expression and provides a
 *	comparison function with another expression.
 */
class ExpressionPattern {
    constructor(exprs) {
        if (!Array.isArray(exprs)) exprs = [exprs];
        this.exprs = exprs;
    }
    test(exprs, envdisplay) {
        var lvl_exprs = exprs;
        var es = this.exprs.map((e) => e); // shallow clone
        var es_idxs = this.exprs.map((e, i) => i);
        var paired_matching = [];

        var compare = (e, f) => {

            let isarr = false;

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
            let valuesMatch = true;
            // If both are values, check that their reported values
            // match. This is for things like number expressions,
            // which are otherwise structurally equal. The check here
            // is recursive, for cases like bags, where the value can
            // itself contain expressions.
            if (e instanceof Expression && f instanceof Expression && e.isValue() && f.isValue()) {
                let ev = e.value();
                let fv = f.value();

                if ((!ev && fv) || (ev && !fv)) {
                    valuesMatch = false;
                }
                else if (Array.isArray(ev) && Array.isArray(fv)) {
                    if (ev.length != fv.length) {
                        valuesMatch = false;
                    }
                    else {
                        for (let i = 0; i < ev.length; i++) {
                            if (!compare(ev[i], fv[i])) {
                                valuesMatch = false;
                                break;
                            }
                        }
                    }
                }
                else {
                    valuesMatch = ev === fv && e.isValue() && f.isValue();
                }
            }
            else {
                valuesMatch = true;
            }

            // Compares two expressions.
            // Right now this just checks if their class tree is the same.
            if (e.constructor.name !== f.constructor.name) {
                //console.log(' > Constructors don\'t match.');
                return false; // expressions don't match
            }
            else if (e instanceof Expression && f instanceof Expression && (e.isValue() != f.isValue() || !valuesMatch)) {
                return false;
            }
            else { // Check whether the expressions at this level have the same # of children. If so, do one-to-one comparison.
                var e_children = e.children;
                var f_children = f.children;
                if (e_children.length !== f_children.length) {
                    //console.log(' > Length of child array doesn\'t match.');
                    return false;
                }
                else {
                    for (let i = 0; i < e_children.length; i++) {
                        if (!compare(e_children[i], f_children[i])) {
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
            let v = envdisplay.getEnvironment().lookup(es[0].name);
            if (v) {
                if (compare(v, es[0].getValue())) {
                    return [ es[0].name ]; // paired match... return the name for the binding instead.
                }
            }
            return false;
        }

        // If sets of expressions have different length, they can't be equal.
        // Still try to make a matching so we can blink the extraneous expressions.
        if (lvl_exprs.length !== es.length) {
            let es = this.exprs.map((e) => e);
            let es_idxs = this.exprs.map((e, i) => i);
            let unpaired = [];

            let idx = 0;
            for (let lvl_e of lvl_exprs) {
                let valid = -1;
                for (let i = 0; i < es.length; i++) {
                    if (compare(es[i], lvl_e)) {
                        valid = i;
                        break;
                    }
                }
                if (valid > -1) {
                    //console.log(' > array was ', es);
                    //console.log(' > removing element ', es[valid]);
                    es.splice(valid, 1);
                    es_idxs.splice(valid, 1);
                    //console.log(' > array is now ', es);
                }
                else {
                    unpaired.push(idx);
                }
                idx++;
            }
            if (es.length === 0) {
                return {
                    "unpaired": unpaired,
                };
            }
            return false;
        }

        for (let lvl_e of lvl_exprs) {
            var valid = -1;
            for (let i = 0; i < es.length; i++) {
                if (compare(es[i], lvl_e)) {
                    valid = i;
                    paired_matching.push(es_idxs[i]);
                    break;
                }
            }
            if (valid > -1) {
                //console.log(' > array was ', es);
                //console.log(' > removing element ', es[valid]);
                es.splice(valid, 1);
                es_idxs.splice(valid, 1);
                //console.log(' > array is now ', es);
            }
            else return false;
        }
        return paired_matching;
    }
}
