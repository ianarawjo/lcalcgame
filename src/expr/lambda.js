/**
 * Lambda calculus versions of Expression objects.
 * The LambdaHoleExpr performs substitution on LambdaVar subexpressions in its parent expression context.
 * -----------------------------------------------
 * */
class LambdaHoleExpr extends MissingExpression {
    get openImage() { return this.name === 'x' ? 'lambda-hole' : 'lambda-hole-red'; }
    get closedImage() { return this.name === 'x' ? 'lambda-hole-closed' : 'lambda-hole-red-closed'; }
    get openingAnimation() {
        var anim = new mag.Animation();
        anim.addFrame('lambda-hole-opening0', 50);
        anim.addFrame('lambda-hole-opening1', 50);
        anim.addFrame('lambda-hole',          50);
        return anim;
    }
    get closingAnimation() {
        var anim = new mag.Animation();
        anim.addFrame('lambda-hole-opening1', 50);
        anim.addFrame('lambda-hole-opening0', 50);
        anim.addFrame('lambda-hole-closed',   50);
        return anim;
    }

    constructor(varname) {
        super(null);
        this._name = varname;
        this.color = this.colorForVarName();
        this.image = this.openImage;
        this.isOpen = true;
    }
    get name() { return this._name; }
    set name(n) { this._name = n; }

    static colorForVarName(v) {

        if (v === 'x') return 'lightgray';
        else           return 'white'; //'IndianRed';

        // return {
        //
        //     'x':'orange',
        //     'y':'IndianRed',
        //     'z':'green',
        //     'w':'blue'
        //
        // }[v];
    }
    colorForVarName() { return LambdaHoleExpr.colorForVarName(this.name); }

    // Draw special circle representing a hole.
    drawInternal(ctx, pos, boundingSize) {
        var rad = boundingSize.w / 2.0;
        setStrokeStyle(ctx, this.stroke);
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(pos.x+rad,pos.y+rad,rad,0,2*Math.PI);
        ctx.drawImage(Resource.getImage(this.image), pos.x, pos.y, boundingSize.w, boundingSize.h);
        if(this.stroke) ctx.stroke();
    }

    // Accessibility
    open() {
        if (!this.isOpen) {
            if (this.stage) {
                if (this._runningAnim) this._runningAnim.cancel();
                this._runningAnim = Animate.play(this.openingAnimation, this, () => {
                    this.image = this.openImage;
                    if (this.stage) this.stage.draw();
                });
            } else this.image = this.openImage;
            this.isOpen = true;
        }
    }
    close() {
        if (this.isOpen) {
            if (this.stage) {
                if (this._runningAnim) this._runningAnim.cancel();
                this._runningAnim = Animate.play(this.closingAnimation, this, () => {
                    this.image = this.closedImage;
                    if (this.stage) this.stage.draw();
                });
            } else this.image = this.closedImage;
            this.isOpen = false;
        }
    }
    hits(pos, options=undefined) {
        if (this.isOpen) {
            if (this.parent && this.parent.parent) return null;
            return super.hits(pos, options);
        }
        else {
            return null;
        }
    }

    applyExpr(node) {
        if (!this.parent) {
            console.error('@ LambdaHoleExpr.applyExpr: No parent LambdaExpr.');
            return false;
        }

        var parent = this.parent;
        var subvarexprs = mag.Stage.getNodesWithClass(LambdaVarExpr, [], true, [parent]);
        subvarexprs.forEach((expr) => {
            if (expr.name === this.name) {
                let c = node.clone();
                //c.bindSubexpressions();
                c.stage = null;
                expr.parent.swap(expr, c); // Swap the expression for a clone of the dropped node.
                c.parent.bindSubexpressions();

                // TODO: Move this somewhere more stable.
                // Top-level if statements should unlock
                // reducable boolean expressions.
                if (c.parent instanceof IfStatement && c.parent.cond instanceof CompareExpr) {
                    c.parent.cond.unlock();
                }
            }
        });

        // Now remove this hole from its parent expression.
        parent.removeArg(this);

        // GAME DESIGN CHOICE: Automatically break apart parenthesized values.
        // * If we don't do this, the player can stick everything into one expression and destroy that expression
        // * to destroy as many expressions as they like with a single destruction piece. And that kind of breaks gameplay.
        return parent.performReduction();
    }

    // Events
    onmousedrag(pos) {
        if (this.parent) {
            pos = addPos(pos, fromTo(this.absolutePos, this.parent.absolutePos));
            this.parent.onmousedrag(pos);
        }
    }
    ondropenter(node, pos) {
        if (node instanceof LambdaHoleExpr) node = node.parent;
        super.ondropenter(node, pos);

        // Special case: Funnel representation of 'map' hovered over hole.
        // if (node instanceof FunnelMapFunc) {
        //     node.onmouseenter();
        //     return;
        // }

        node.opacity = 0.4;

        if (this.parent) {
            var subvarexprs = mag.Stage.getNodesWithClass(LambdaVarExpr, [], true, [this.parent]);
            subvarexprs.forEach((e) => {
                if (e.name === this.name) {
                    let preview_node = node.clone();
                    preview_node.opacity = 1.0;
                    preview_node.bindSubexpressions();
                    e.open(preview_node);
                }
            });
            this.opened_subexprs = subvarexprs;
            this.close_opened_subexprs = () => {
                if (!this.opened_subexprs) return;
                this.opened_subexprs.forEach((e) => {
                    e.close();
                });
                this.opened_subexprs = null;

                if (this.parent.environmentDisplay && wasClosed) {
                    this.parent.environmentDisplay.closeDrawer({ force: true, speed: 50 });
                }
            };
        }
    }
    ondropexit(node, pos) {
        if (node instanceof LambdaHoleExpr) node = node.parent;

        super.ondropexit(node, pos);

        // if (node instanceof FunnelMapFunc) {
        //     return;
        // }

        if (node) node.opacity = 1.0;
        this.close_opened_subexprs();
    }
    ondropped(node, pos) {
        if (node instanceof LambdaHoleExpr) node = node.parent;
        // Disallow interaction with nested lambda
        if (this.parent && this.parent.parent instanceof LambdaExpr) {
            return null;
        }

        if (node.dragging) { // Make sure node is being dragged by the user.

            // Special case: Funnel dropped over hole.
            // if (node instanceof FunnelMapFunc) {
            //     node.func = this.parent;
            //     this.parent.parent = null;
            //     this.parent.stage.remove(this.parent);
            //     this.onmouseleave();
            //     this.parent.onmouseenter();
            //     node.update();
            //     return;
            // }

            var afterDrop = () => {
                // Cleanup
                node.opacity = 1.0;
                this.close_opened_subexprs();

                // User dropped an expression into the lambda hole.
                Resource.play('pop');

                // Clone the dropped expression.
                var dropped_expr = node.clone();

                // Save the current state of the board.
                var stage = node.stage;
                stage.saveState();

                Logger.log('state-save', stage.toString());

                // Remove the original expression from its stage.
                stage.remove(node);

                // If this hole is part of a larger expression tree (it should be!),
                // attempt recursive substitution on any found LambdaVarExpressions.
                if (this.parent) {
                    var parent = this.parent;
                    let orig_exp_str = this.parent.toString();
                    let dropped_exp_str = node.toString();

                    this.applyExpr(node);

                    // Log the reduction.
                    Logger.log('reduction-lambda', { 'before':orig_exp_str, 'applied':dropped_exp_str, 'after':parent.toString() });
                    Logger.log('state-save', stage.toString());

                    if (parent.children.length === 0) {

                        // This hole expression is a destructor token.
                        // (a) Play nifty 'POOF' animation.
                        Animate.poof(parent);

                        // (b) Remove expression from the parent stage.
                        (parent.parent || parent.stage).remove(parent);

                    } else
                        stage.dumpState();

                } else {
                    console.warn('ERROR: Cannot perform lambda-substitution: Hole has no parent.');

                    // Hole is singular; acts as abyss. Remove it after one drop.
                    this.stage.remove(this);
                }

                stage.update();
            };

            if (level_idx < 1) {
                Animate.tween(node, { opacity:0 }, 400, (elapsed) => Math.pow(elapsed, 0.5)).after(afterDrop);
            } else
                afterDrop();
        }
    }

    toString() { return 'λ' + this.name; }
}

class LambdaVarExpr extends ImageExpr {
    constructor(varname) {
        super(0, 0, 54*1.2, 70*1.2, 'lambda-pipe');
        this.graphicNode.offset = { x:0, y:-8 };
        this.name = varname ? varname.replace('_', '') : undefined;
        this.ignoreEvents = true;
        this.handleOffset = -8;

        // Graphic animation.
        this.stateGraph.enter('closed');
    }
    get size() {
        let sz = super.size;
        sz.h = 54;
        return sz;
    }

    get openImage() { return this.name === 'x' ? 'lambda-pipe-open' : 'lambda-pipe-red-open'; }
    get closedImage() { return this.name === 'x' ? 'lambda-pipe' : 'lambda-pipe-red'; }
    get openingAnimation() {
        var anim = new mag.Animation();
        anim.addFrame('lambda-pipe-opening0', 50);
        anim.addFrame('lambda-pipe-opening1', 50);
        anim.addFrame('lambda-pipe-open',     50);
        return anim;
    }
    get closingAnimation() {
        var anim = new mag.Animation();
        anim.addFrame('lambda-pipe-opening1', 50);
        anim.addFrame('lambda-pipe-opening0', 50);
        anim.addFrame('lambda-pipe',          50);
        return anim;
    }

    get stateGraph() {
        if (!this._stateGraph) {
            var g = new mag.StateGraph();
            g.addState('closed', () => {
                this.image = this.closedImage; });
                if(this.stage) this.stage.draw();
            g.addState('opening', () => {
                var anim = this.openingAnimation;
                Animate.play(anim, this, () => {
                    if (g.currentState === 'opening')
                        g.enter('open');
                });
            });
            g.addState('open', () => {
                this.image = this.openImage; });
                if(this.stage) this.stage.draw();
            g.addState('closing', () => {
                var anim = this.closingAnimation;
                Animate.play(anim, this, () => {
                    if (g.currentState === 'closing')
                        g.enter('closed');
                });
            });
            this._stateGraph = g;
        }
        return this._stateGraph;
    }
    clone() {
        var c = super.clone();
        c._stateGraph = null;
        c.stateGraph.enter('closed');
        return c;
    }

    open(preview_expr=null) {
        if (this.stateGraph.currentState !== 'open') {
            this.stateGraph.enter('opening');

            let _this = this;
            let stage = this.stage;

            if(preview_expr) {
                let stateGraph = this.stateGraph;
                Animate.wait(140).after(() => {
                    if (stateGraph.currentState === 'opening' || stateGraph.currentState === 'open') {
                        let scale = this.graphicNode.size.w / preview_expr.size.w * 0.8;
                        preview_expr.pos = { x:this.children[0].size.w/2.0, y:-10 };
                        preview_expr.scale = { x:scale, y:scale };
                        preview_expr.anchor = { x:0.5, y:0 };
                        preview_expr.stroke = null;
                        _this.graphicNode.addChild(preview_expr);
                        stage.draw();
                    }
                });
            }
        }
    }
    close() {
        if (this.stateGraph.currentState !== 'closed') {
            let stage = this.stage;
            this.stateGraph.enter('closing');
            this.graphicNode.children = [];
            stage.draw();
        }
    }

    //onmousedrag() {}
    drawInternal(ctx, pos, boundingSize) {
        super.drawInternal(ctx, pos, boundingSize);
        if (ctx && !this.parent) {
            this.scale = { x:0.8, y:0.8 };
            drawCircle(ctx, pos.x, pos.y+this.handleOffset+this.shadowOffset, boundingSize.w / 2.0, 'black', this.graphicNode.stroke);
            drawCircle(ctx, pos.x, pos.y+this.handleOffset, boundingSize.w / 2.0, 'lightgray', this.graphicNode.stroke);
        }
    }

    value() { return undefined; }
    toString() { return '#' + (this.ignoreEvents ? '' : '_') + this.name; }
}

class LambdaExpr extends Expression {
    constructor(exprs) {
        super(exprs);

        /*let txt = new TextExpr('→');
        txt.color = 'gray'
        this.addArg(txt);*/
    }
    applyExpr(node) {
        if (this.takesArgument) {
            return this.holes[0].applyExpr(node);
        } else return this;
    }
    numOfNestedLambdas() {
        if (!this.takesArgument || !this.fullyDefined) return 0;
        else if (this.holes.length < 2) return 1;
        else {
            return 1 + (this.holes[1] instanceof LambdaExpr ? this.holes[1].numOfNestedLambdas() : 0);
        }
    }
    addChild(c) {
        super.addChild(c);

        // Color all subvarexpr's of child consistently with their names.
        if (this.takesArgument) {
            this.updateHole();

            var hole = this.holes[0];
            var lvars = mag.Stage.getNodesWithClass(LambdaVarExpr, [], true, [this]);
            lvars.forEach((v) => {
                if (v.name === hole.name) {
                    v.color = hole.colorForVarName();
                }
            });
        }
    }
    get isParentheses() { return this.holes.length > 0 && !(this.takesArgument); }
    get takesArgument() { return this.holes.length > 0 && this.holes[0] instanceof LambdaHoleExpr; }
    get fullyDefined() {
        // If one arg is MissingExpression, this will be false.
        if (this.holes.length < 2) return true;
        return this.holes.slice(1).reduce(((prev,arg) => (prev && !(arg instanceof MissingExpression))), true);
    }
    get isConstantFunction() {
        return this.takesArgument && mag.Stage.getNodesWithClass(LambdaVarExpr, [], true, [this]).length === 0;
    }
    get body() { return this.takesArgument ? this.holes[1] : null; }
    updateHole() {
        // Determine whether this LambdaExpr has any MissingExpressions:
        if (this.holes[0].name !== 'x')
            this.color = this.holes[0].color;
        let missing = !this.fullyDefined;
        if (missing || (this.parent && ((this.parent instanceof FuncExpr && !this.parent.isAnimating)))) // ||
            //this.parent instanceof LambdaExpr && this.parent.takesArgument)))
                     this.holes[0].close();
        else         this.holes[0].open();
    }

    // Close lambda holes appropriately.
    swap(node, otherNode) {
        super.swap(node, otherNode);
        if (this.takesArgument) {
            if (otherNode instanceof MissingExpression) { // if expression was removed...
                this.holes[0].close(); // close the hole, undoubtedly
            } else if (node instanceof MissingExpression) { // if expression was placed...
                this.updateHole();
            }
        }
    }

    onmouseclick(pos) {
        this.performReduction();
    }
    hitsChild(pos) {
        if (this.isParentheses) return null;
        return super.hitsChild(pos);
    }
    reduce() {
        // Remove 'parentheses':
        if (this.isParentheses) {
            return this.holes;
        } else return super.reduce();
    }
    performReduction() {

        var reduced_expr = this.reduce();
        if (reduced_expr && reduced_expr != this) { // Only swap if reduction returns something > null.

            if (this.stage) this.stage.saveState();

            var parent;
            if (Array.isArray(reduced_expr)) {
                if (reduced_expr.length === 1) { reduced_expr = reduced_expr[0]; } // reduce to single argument
                else if (this.parent) return; // cannot reduce a parenthetical expression with > 1 subexpression.
                else {
                    parent = this.stage;
                    reduced_expr.forEach((e) => {
                        if (this.locked) e.lock();
                        else             e.unlock();
                    });
                    parent.swap(this, reduced_expr); // swap 'this' (on the board) with an array of its reduced expressions
                    return reduced_expr;
                }
            }

            parent = this.parent ? this.parent : this.stage;
            if (this.locked) reduced_expr.lock(); // the new expression should inherit whatever this expression was capable of as input
            else             reduced_expr.unlock();
            //console.warn(this, reduced_expr);
            if (parent) parent.swap(this, reduced_expr);

            if (reduced_expr.parent) {
                var try_reduce = reduced_expr.parent.reduceCompletely();
                if (try_reduce != reduced_expr.parent && try_reduce !== null) {
                    Animate.blink(reduced_expr.parent, 400, [0,1,0]);
                }
            }

            return reduced_expr;
        }
    }

    reduceCompletely() { // Try to reduce this expression and its subexpressions as completely as possible.

        // If the inner expression reduces to null when it takes an argument, this lambda expression itself should disappear.
        if (this.takesArgument &&
            this.fullyDefined &&
            this.holes.length === 2 &&
            this.holes[1].reduceCompletely() === null) {

            console.error('HELLO');
            return null;
        }
        else return super.reduceCompletely();
    }

    toString() {
        if (this.holes.length === 1 && this.holes[0] instanceof LambdaHoleExpr)
            return '(' + super.toString() + ')';
        else
            return super.toString();
    }
}


class EnvironmentLambdaExpr extends LambdaExpr {
    constructor(exprs) {
        super(exprs);
        this.environmentDisplay = new InlineEnvironmentDisplay(this);
        this.environmentDisplay.scale = { x: 0.85, y: 0.85 };
    }

    removeArg(arg) {
        // Don't let holes remove themselves - we want to keep the
        // parameter visible while we are reducing
        if (arg instanceof LambdaHoleExpr) {
            arg.isOpen = false;
            return;
        }
        super.removeArg(arg);
    }

    get takesArgument() {
        // Since the hole isn't removed by our override of removeArg,
        // account for that when deciding whether the lambda is
        // reducible
        return this.holes.length > 0 && this.holes[0] instanceof LambdaHoleExpr && this.holes[0].isOpen;
    }

    hits(pos, options=undefined) {
        if (this.parent) return super.hits(pos, options);

        let result = super.hits(pos, options) || this.environmentDisplay.hits(pos, options);
        if (result == this.environmentDisplay) {
            return this;
        }
        return result;
    }

    onmousedown(pos) {
        if (this.parent) super.onmousedown(pos);

        if (super.hits(pos)) {
            this._eventTarget = this;
            super.onmousedown(pos);
        }
        else {
            this._eventTarget = this.environmentDisplay;
            this.environmentDisplay.onmousedown(pos);
        }
    }

    onmousedrag(pos) {
        if (this.parent) super.onmousedrag(pos);

        if (!this._eventTarget) return;
        if (this._eventTarget == this) {
            super.onmousedrag(pos);
        }
        else {
            this._eventTarget.onmousedrag(pos);
        }
    }

    onmouseup(pos) {
        if (this.parent) super.onmouseup(pos);

        if (!this._eventTarget) return;
        if (this._eventTarget == this) {
            super.onmouseup(pos);
        }
        else {
            this._eventTarget.onmouseup(pos);
        }
        this._eventTarget = null;
    }

    update() {
        super.update();
        this.environmentDisplay.update();
    }

    draw(ctx) {
        if (!this.parent) {
            this.environmentDisplay.parent = this;
            this.environmentDisplay.draw(ctx);
        }
        super.draw(ctx);
    }

    onmouseclick() {
        if (!this._animating) {
            this.performReduction();
        }
    }

    performReduction() {
        // If we don't have all our arguments, refuse to evaluate.
        if (this.takesArgument) {
            return this;
        }

        return new Promise((resolve, _reject) => {
            this._animating = true;
            this.environmentDisplay.openDrawer({ force: true, speed: 100 });

            // Perform substitution, but stop at the 'boundary' of another lambda.
            let varExprs = findNoncapturingVarExpr(this, null, true, true);
            let environment = this.getEnvironment();

            for (let v of varExprs) {
                if (!v.canReduce()) {
                    // Play the animation
                    v.performReduction();
                    _reject();
                    return;
                }
            }

            let stepReduction = () => {
                return new Promise((innerresolve, innerreject) => {
                    if (varExprs.length === 0) {
                        innerresolve();
                    }
                    else {
                        let expr = varExprs.pop();
                        let result;
                        if (expr instanceof LabeledVarExpr) {
                            result = expr.animateReduction(this.environmentDisplay.bindings[expr.name]);
                        }
                        else {
                            result = expr.performReduction();
                        }

                        if (result instanceof Promise) {
                            result.then(() => {
                                stepReduction().then(() => innerresolve());
                            }, () => {
                                innerreject();
                                _reject();
                                this._animating = false;
                            });
                        }
                        else {
                            return stepReduction();
                        }
                    }
                });
            };
            stepReduction().then(() => {
                window.setTimeout(() => {
                    // Get rid of the parameter
                    super.removeArg(this.holes[0]);

                    Animate.poof(this);
                    super.performReduction();
                    resolve();
                }, 600);
            });
        });
    }
}


class InlineEnvironmentDisplay extends SpreadsheetEnvironmentDisplay {
    constructor(lambda) {
        super([]);
        this.lambda = lambda;
        this.parent = lambda;
        this.padding = { left: 0, right: 10, inner: 10 };

        this._state = 'open';
        this._height = 1.0;
        this._animation = null;
    }

    openDrawer(options={}) {
        let force = options.force || false;
        let speed = options.speed || 300;
        if (this._state === 'closed' || force) {
            if (this._animation) this._animation.cancelWithoutFiringCallbacks();
            this._state = 'opening';
            this._animation = Animate.tween(this, { _height: 1.0 }, speed).after(() => {
                this._state = 'open';
                this._animation = null;
            });
        }
    }

    closeDrawer(options={}) {
        let force = options.force || false;
        let speed = options.speed || 300;
        if (this._state === 'open' || force) {
            if (this._animation) this._animation.cancelWithoutFiringCallbacks();
            this._state = 'closing';
            this._animation = Animate.tween(this, { _height: 0.0 }, speed).after(() => {
                this._state = 'closed';
                this._animation = null;
            });
        }
    }

    onmouseup() {
        if (this._state === 'open') {
            this.closeDrawer();
        }
        else if (this._state === 'closed') {
            this.openDrawer();
        }
    }

    onmousedrag(pos) {}

    getEnvironment() {
        return this.lambda.getEnvironment();
    }

    get pos() {
        return { x: 5, y: this.lambda.size.h - 5 };
    }

    set pos(p) {
        this._pos = p;
    }

    get size() {
        let size = super._origSize;
        size.w += this.padding.left + this.padding.right;
        return size;
    }

    get absoluteSize() {
        var size = super.absoluteSize;
        size.h = Math.max(25, this._height * size.h);
        return size;
    }

    draw(ctx) {
        if (!ctx) return;
        ctx.save();
        this.opacity = this.lambda.opacity;
        if (this.opacity !== undefined && this.opacity < 1.0) {
            ctx.globalAlpha = this.opacity;
        }
        var boundingSize = this.absoluteSize;
        var upperLeftPos = this.upperLeftPos(this.absolutePos, boundingSize);
        this.drawInternal(ctx, upperLeftPos, boundingSize);
        if (this._state === 'open') {
            this.children.forEach((child) => {
                child.parent = this;
                child.draw(ctx);
            });
        }
        ctx.restore();
    }

    drawInternal(ctx, pos, boundingSize) {
        this.drawBackground(ctx, pos, boundingSize);
        if (this._state === "open") {
            this.drawGrid(ctx);
        }
    }
}


/** Faded lambda variants. */
class FadedLambdaHoleExpr extends LambdaHoleExpr {
    get openImage() { return this.name === 'x' ? 'lambda-hole-x' : 'lambda-hole-y'; }
    get closedImage() { return this.name === 'x' ? 'lambda-hole-x-closed' : 'lambda-hole-y-closed'; }
}
class HalfFadedLambdaHoleExpr extends LambdaHoleExpr {
    get openImage() { return this.name === 'x' ? 'lambda-hole-xside' : 'lambda-hole-y'; }
    get closedImage() { return this.name === 'x' ? 'lambda-hole-xside-closed' : 'lambda-hole-y-closed'; }
}
class FadedPythonLambdaHoleExpr extends LambdaHoleExpr {
    get openImage() { return this.name === 'x' ? 'lambda-hole-x-python' : 'lambda-hole-y'; }
    get closedImage() { return this.name === 'x' ? 'lambda-hole-x-closed-python' : 'lambda-hole-y-closed'; }
    get size() {
        let sz = super.size;
        sz.w = 120;
        return sz;
    }

    // Draw special round rect around term.
    drawInternal(ctx, pos, boundingSize) {
        setStrokeStyle(ctx, this.stroke);
        ctx.fillStyle = this.color;
        ctx.drawImage(Resource.getImage(this.image), pos.x, pos.y, boundingSize.w, boundingSize.h);
        if(this.stroke) {
            roundRect(ctx, pos.x, pos.y, boundingSize.w, boundingSize.h, 6, false, true, this.stroke.opacity);
        }
    }
}
class FadedES6LambdaHoleExpr extends FadedPythonLambdaHoleExpr {
    get openImage() { return this.name === 'x' ? 'lambda-hole-x-es6' : 'lambda-hole-y'; }
    get closedImage() { return this.name === 'x' ? 'lambda-hole-x-closed-es6' : 'lambda-hole-y-closed'; }

    // Events
    hits(pos, options) {
        if (this.ignoreEvents) return null; // All children are ignored as well.
        else if (!this.isOpen) return null;

        if (typeof options !== 'undefined' && options.hasOwnProperty('exclude')) {
            for(let e of options.exclude) {
                if (e == this) return null;
            }
        }

        var hitChild = this.hitsChild(pos, options);
        if (hitChild) return hitChild;

        // Hasn't hit any children, so test if the point lies on this node.
        var boundingSize = this.absoluteSize;
        boundingSize.w /= 2.0;
        var upperLeftPos = this.upperLeftPos(this.absolutePos, boundingSize);
        if (pointInRect(pos, rectFromPosAndSize(upperLeftPos, boundingSize) )) return this;
        else return null;
    }

    // Draw special round rect around just x term.
    drawInternal(ctx, pos, boundingSize) {
        setStrokeStyle(ctx, this.stroke);
        ctx.fillStyle = this.color;
        ctx.drawImage(Resource.getImage(this.image), pos.x, pos.y, boundingSize.w, boundingSize.h);
        if(this.stroke) {
            roundRect(ctx, pos.x, pos.y, boundingSize.w / 2.0, boundingSize.h, 6, false, true, this.stroke.opacity);
        }
    }
}

class HalfFadedLambdaVarExpr extends LambdaVarExpr {
    get openImage() { return 'lambda-pipe-open'; }
    get closedImage() { return this.name === 'x' ? 'lambda-pipe-xside-closed' : 'lambda-pipe-xside-closed'; }
}

class FadedLambdaVarExpr extends LambdaVarExpr {
    constructor(varname) {
        super(varname);
        this.graphicNode.size = this.name === 'x' ? { w:24, h:24 } : { w:24, h:30 };
        this.graphicNode.offset = this.name === 'x' ? { x:0, y:0 } : { x:0, y:2 };
        this.handleOffset = 2;
    }
    get openImage() { return 'lambda-pipe-x-open'; }
    get closedImage() { return this.name === 'x' ? 'lambda-pipe-x' : 'lambda-pipe-x'; }
    get openingAnimation() {
        var anim = new mag.Animation();
        anim.addFrame('lambda-pipe-x-opening0', 50);
        anim.addFrame('lambda-pipe-x-opening1', 50);
        anim.addFrame(this.openImage,           50);
        return anim;
    }
    get closingAnimation() {
        var anim = new mag.Animation();
        anim.addFrame('lambda-pipe-x-opening1', 50);
        anim.addFrame('lambda-pipe-x-opening0', 50);
        anim.addFrame(this.closedImage,         50);
        return anim;
    }

    open(preview_expr=null) {
        if (this.stateGraph.currentState !== 'open') {
            this.stateGraph.enter('opening');

            if(preview_expr) {
                let scale = this.graphicNode.size.w / preview_expr.size.w * 2.0;
                preview_expr.pos = { x:this.graphicNode.size.w / 2.0, y:0 };
                preview_expr.scale = { x:scale, y:scale };
                preview_expr.anchor = { x:0.5, y:0.3 };
                preview_expr.stroke = null;
                this.graphicNode.addChild(preview_expr);
                this.stage.draw();
            }
        }
    }
}
