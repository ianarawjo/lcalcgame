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

    // Builds a single Stage from the level description,
    // and returns it.
    // * The layout should be generated automatically, and consistently.
    // * That way a higher function can 'parse' a text file description of levels --
    // * written in code, for instance -- and generate the entire game on-the-fly.
    build(canvas) {

        var stage = new ReductStage(canvas);

        // Scaling for mobile devices:
        if (__IS_MOBILE) {
            var md = new MobileDetect(window.navigator.userAgent);
            if (md.phone())
                stage.scale = 2.4;
            else if (md.tablet())
                stage.scale = 1.8;
            else if (md.mobile())
                stage.scale = 2.0;
            else
                stage.scale = 1.0;
        }

        // Seed the random number generator so that while randomly generated,
        // levels appear the same each time you play.
        Math.seed = 12045;

        var canvas_screen = stage.boundingSize;

        const envDisplayWidth = 0.20 * canvas_screen.w;

        GLOBAL_DEFAULT_SCREENSIZE = stage.boundingSize;
        const usableWidth = canvas_screen.w - envDisplayWidth;
        const screenOffsetX = usableWidth * (1 - 1/1.4) / 2.0;
        var screen = {
            height: canvas_screen.h/1.4 - 90,
            width: usableWidth - 2*screenOffsetX,
            y: canvas_screen.h*(1-1/1.4) / 2.0,
            x: screenOffsetX,
        };
        var board_packing = this.findBestPacking(this.exprs, screen);
        stage.addAll(board_packing); // add expressions to the stage

        // TODO: Offload this onto second stage?
        var goal_node = this.goal.nodeRepresentation;
        goal_node[0].pos = { x:20, y:10 };
        goal_node[1].pos = { x:110, y:10 };
        goal_node[1].ignoreGetClassInstance = true;
        var lastChild = goal_node[1].children[goal_node[1].children.length-1];
        goal_node[0].children[0].size = { w:110+lastChild.pos.x+lastChild.size.w, h:70 };
        stage.add(goal_node[0]);
        stage.add(goal_node[1]);

        //goal_node[1].children.forEach((c) => c.update());

        //var toolbox_vis = this.generateToolboxVisual(toolbox_vis);
        //stage.addAll(toolbox_vis);

        stage.uiGoalNodes = [goal_node[0], goal_node[1]];
        stage.goalNodes = goal_node[1].children;

        // UI Buttons
        var ui_padding = 10;
        var btn_back = new mag.Button(canvas_screen.w - 64*4 - ui_padding, ui_padding, 64, 64,
            { default:'btn-back-default', hover:'btn-back-hover', down:'btn-back-down' },
            () => {
            returnToMenu();
            //prev(); // go back to previous level; see index.html.
        });

        let mute_images = { default:'btn-mute-default', hover:'btn-mute-hover', down:'btn-mute-down' };
        let unmute_images = { default:'btn-unmute-default', hover:'btn-unmute-hover', down:'btn-unmute-down' };
        var btn_mute = new mag.Button(btn_back.pos.x + btn_back.size.w, ui_padding, 64, 64,
            Resource.isMuted() ? unmute_images : mute_images,
            function() {
                if (this.muted) {
                    Resource.unmute();
                    this.muted = false;
                    this.images = mute_images;
                }
                else {
                    Resource.mute();
                    this.muted = true;
                    this.images = unmute_images;
                }
                this.onmouseenter();
        });
        btn_mute.muted = Resource.isMuted();
        var btn_reset = new mag.Button(btn_mute.pos.x + btn_mute.size.w, ui_padding, 64, 64,
            { default:'btn-reset-default', hover:'btn-reset-hover', down:'btn-reset-down' },
            () => {
            initBoard(); // reset board state; see index.html.
        });
        var btn_next = new mag.Button(btn_reset.pos.x + btn_reset.size.w, ui_padding, 64, 64,
            { default:'btn-next-default', hover:'btn-next-hover', down:'btn-next-down' },
            () => {
            next(); // go back to previous level; see index.html.
        });
        btn_back.pos = btn_reset.pos;
        btn_reset.pos = btn_next.pos;
        stage.add(btn_back);
        stage.add(btn_reset);
        stage.add(btn_next);

        // Toolbox
        const TOOLBOX_HEIGHT = 90;
        var toolbox = new Toolbox(0, canvas_screen.h - TOOLBOX_HEIGHT, canvas_screen.w, TOOLBOX_HEIGHT);
        stage.add(toolbox);
        if (this.toolbox) {
            this.toolbox.forEach((item) => {
                stage.add(item);
                toolbox.addExpression(item, false);
            });
        }
        stage.toolbox = toolbox;

        // Environment
        let yOffset = goal_node[0].absoluteSize.h + goal_node[0].absolutePos.y + 20;
        var env = new (ExprManager.getClass('environment_display'))(canvas_screen.w - envDisplayWidth, yOffset, envDisplayWidth, canvas_screen.h - TOOLBOX_HEIGHT - yOffset);
        stage.add(env);
        stage.environmentDisplay = env;
        if (this.globals) {
            for (let name of this.globals.names()) {
                stage.environment.update(name, this.globals.lookup(name).clone());
            }
        }

        stage.uiNodes = [ btn_back, btn_reset, btn_next, env, toolbox ];

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
                    !(n instanceof Expression) ||
                    n.fadingOut ||
                    n.toolbox) continue;
                nodes.push(n);
            }
            return nodes;
        }.bind(stage);
        stage.toolboxNodes = function() {
            return this.nodes.filter((n) => n.toolbox && n.toolbox instanceof Toolbox && !n.fadingOut);
        }.bind(stage);
        stage.isCompleted = function() {
            let exprs = this.expressionNodes();
            let matching = goal.test(exprs.map((n) => n.clone()));
            if (matching) { // Pair nodes so that goal nodes reference the actual nodes on-screen (they aren't clones).
                // goal.test returns an array of indexes, referring to the indexes of the expressions passed into the test,
                // ordered by the order of the goal nodes displayed on screen. So the info needed to pair an expression to a goal node.
                // With this we can reconstruct the actual pairing for the nodes on-screen (not clones).
                let pairs = matching.map((j, i) => [ exprs[j], this.goalNodes[i] ] );
                return pairs;
            }
            return false;
        }.bind(stage);

        // Default animation on expression creation:
        stage.expressionNodes().forEach((n) => {
            n.scale = { x:0.5, y:0.5 };
            n.anchor = { x:0.5, y:0.5 };
            Animate.tween(n, { scale:{x:1,y:1} }, 500, (elapsed) => Math.pow(elapsed, 0.3));
        });
        stage.goalNodes.forEach((n) => {
            n.pos = addPos(n.pos, { x:n.size.w/2.0, y:n.size.h/2.0 });
            n.anchor = { x:0.5, y:0.5 };
            n.scale = { x:0.5, y:0.5 };
            Animate.tween(n, { scale:{x:1,y:1} }, 500, (elapsed) => Math.pow(elapsed, 0.3));
        });
        stage.toolboxNodes().forEach((n, i) => {
            let final_pos = n.pos;
            n.pos = addPos(n.pos, { x:400, y:0 });
            n.scale = { x:0.8, y:0.8 };
            Animate.tween(n, { pos:final_pos, scale:{x:1,y:1} }, 500 + i * 100, (elapsed) => Math.pow(elapsed, 0.3));
        });

        return stage;
    }

    // Parse a shorthand description of a level
    // * In Scheme-esque format, with _ for holes:
    // * '(if _ triangle star) (== triangle _) (rect)'
    // NOTE: This does not do error checking! Make sure your desc is correct.
    static make(expr_descs, goal_descs, toolbox_descs, globals_descs) {
        var lvl = new Level(Level.parse(expr_descs), new Goal(new ExpressionPattern(Level.parse(goal_descs))),
            toolbox_descs ? Level.parse(toolbox_descs) : null, Environment.parse(globals_descs));
        return lvl;
    }
    static parse(desc) {
        if (desc.length === 0) return [];

        function splitParen(s) {
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

        // Split string by top-level parentheses.
        var descs = splitParen(desc);
        //console.log('descs', descs);

        // Parse expressions recursively.
        let es = descs.map((expr_desc) => Level.parseExpr(expr_desc));
        let LambdaClass = ExprManager.getClass('lambda_abstraction');
        es = es.map((e) => e instanceof LambdaHoleExpr ? new LambdaClass([e]) : e);
        //console.log('exprs', es);
        return es;
    }
    static parseExpr(desc) {

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

            var exprs = args.map((arg) => Level.parseExpr(arg));
            //console.log(' >> inner exprs', exprs);
            if (Array.isArray(exprs[0])) { // array of expressions
                return lock(new Expression(exprs), toplevel_lock);
            } else { // Class name. Invoke the instantiator.
                var op_class = exprs[0];
                if (!(op_class instanceof LambdaHoleExpr) &&
                    !(op_class instanceof Sequence) &&
                    !(op_class instanceof BagExpr) && op_class.length !== exprs.length-1) { // missing an argument, or there's an extra argument:
                    console.warn('Operator-argument mismatch with exprs: ', exprs);
                    console.warn('Continuing...');
                }
                for (let i = 1; i < exprs.length; i++) { // Cast the other arguments into expressions.
                    if (Array.isArray(exprs[i])) exprs[i] = new Expression(exprs[i]); // wrap in paren
                    else if (isClass(exprs[i])) {
                        if (exprs[i].length > 0)
                            console.warn('Instantiating expression class ', exprs[i], ' with 0 arguments when it expects ' + exprs[i].length + '.');
                        exprs[i] = constructClassInstance(exprs[i], null);
                    }
                    else if (isInstanceOfClass(exprs[i], Expression)) { } // Nothing to fix.
                    else {
                        console.error("Expression ", exprs[i], ' not of known type.');
                    }
                }
                if (op_class instanceof LambdaHoleExpr) {
                    let LambdaClass = ExprManager.getClass('lambda_abstraction');
                    var lexp = new LambdaClass([op_class]);
                    for (let i = 1; i < exprs.length; i++) { lexp.addArg(exprs[i]); }
                    return lock(lexp, toplevel_lock);
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
                    //console.log(exprs);
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
            'dot':(() => {
                let circ = new CircleExpr(0,0,18);
                circ.color = 'gold';
                return circ;
            })()
        };

        if (Number.isNumber(arg)) {
            let numexpr = new NumberExpr(parseInt(arg));
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
            return lock(new (ExprManager.getClass('reference'))(varname), locked);
        } else {
            console.error('Unknown argument: ', arg);
            return new FadedValueExpr(arg);
            //return new Expression();
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

        if (es.length >= 5) {
            return this.findFastPacking(es, screen);
        }

        // Bounds cache seems to greatly destroy performance
        var sizeCache = {};
        var getSize = function(e) {
            // TODO: a lot of time spent in toString
            if (!sizeCache[e]) sizeCache[e] = e.absoluteSize;
            return sizeCache[e];
        };

        var candidates = [];
        var CANDIDATE_THRESHOLD = 10;
        while (candidates.length < CANDIDATE_THRESHOLD) {

            // 1. Put the expressions in random places.
            for (let e of es) {
                let size = getSize(e);

                let y = 0;
                while (y < 50) {
                    y = Math.seededRandom() * (screen.height - size.h) + screen.y;
                }

                e.pos = { x:Math.seededRandom() * (screen.width - size.w) + screen.x,
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

    constructor(accepted_patterns) {
        if (!Array.isArray(accepted_patterns)) accepted_patterns = [accepted_patterns];
        this.patterns = accepted_patterns;
    }

    get nodeRepresentation() {
        var exprs = flatten(this.patterns.map((p) => p.exprs)).map((expr) => expr.clone());
        var bg = new mag.Rect(-20,-10,200,80);
        bg.color = "#444";
        bg.shadowOffset = 0;
        var txt = new TextExpr('Goal: ', 'Georgia');
        var node = new mag.Rect(0,0,100,50);
        node.color = null;
        node.ignoreEvents = true;
        txt.pos = { x:0, y:node.size.h/2 };
        txt.anchor = { x:0, y:0.5 };
        txt.color = "#EEE";

        var exprs_node = new mag.Rect(0,0,0,0);
        exprs_node.addAll(exprs);

        exprs[0].pos = { x:0, y:0 };

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

        node.addAll([bg, txt]);
        return [node, exprs_node];
    }

    // MAYBE? TODO: Use reduction stack.
    test(exprs, reduction_stack=null) {

        for(let pattern of this.patterns) {
            let paired_matching = pattern.test(exprs);
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
    test(exprs) {
        var lvl_exprs = exprs;
        var es = this.exprs.map((e) => e); // shallow clone
        var es_idxs = this.exprs.map((e, i) => i);
        var paired_matching = [];

        // If sets of expressions have different length, they can't be equal.
        if (lvl_exprs.length !== es.length) return false;

        var compare = (e, f) => {

            //console.log(' comparing ', e, ' to ', f);

            // Compares two expressions.
            // Right now this just checks if their class tree is the same.
            if (e.constructor.name !== f.constructor.name) {
                //console.log(' > Constructors don\'t match.');
                return false; // expressions don't match
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
