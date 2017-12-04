/**
 * Lambda calculus versions of Expression objects.
 * The LambdaHoleExpr performs substitution on LambdaVar subexpressions in its parent expression context.
 * -----------------------------------------------
 * */
class LambdaHoleExpr extends MissingExpression {
    constructor(varname) {
        super(null);
        this._name = varname;
        this.color = this.colorForVarName();
        this.isOpen = true;
        this._openOffset = Math.PI / 2;
    }
    get name() { return this._name; }
    set name(n) { this._name = n; }

    static colorForVarName(v) {

        return 'lightgray';
        //if (v === 'x') return 'lightgray';
        //else           return 'white'; //'IndianRed';

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
        ctx.beginPath();
        ctx.arc(pos.x+rad,pos.y+rad,rad,0,2*Math.PI);
        var gradient = ctx.createLinearGradient(pos.x + rad, pos.y, pos.x + rad, pos.y + 2 * rad);
        gradient.addColorStop(0.0, "#AAAAAA");
        gradient.addColorStop(0.7, "#191919");
        gradient.addColorStop(1.0, "#191919");
        ctx.fillStyle = gradient;
        ctx.fill();

        if (this._openOffset < Math.PI / 2) {
            ctx.fillStyle = '#A4A4A4';
            setStrokeStyle(ctx, {
                color: '#C8C8C8',
                lineWidth: 1.5,
            });

            ctx.beginPath();
            ctx.arc(pos.x+rad, pos.y+rad, rad, -0.25*Math.PI + this._openOffset, 0.75*Math.PI - this._openOffset);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(pos.x+rad, pos.y+rad, rad, -0.25*Math.PI - this._openOffset, 0.75*Math.PI + this._openOffset, true);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        }

        ctx.beginPath();
        ctx.arc(pos.x+rad,pos.y+rad,rad,0,2*Math.PI);
        var gradient = ctx.createRadialGradient(pos.x + rad, pos.y + rad, 0.67 * rad, pos.x + rad, pos.y + rad, rad);
        gradient.addColorStop(0,"rgba(0, 0, 0, 0.0)");
        gradient.addColorStop(1,"rgba(0, 0, 0, 0.4)");
        ctx.fillStyle = gradient;
        ctx.fill();

        setStrokeStyle(ctx, this.stroke);
        if(this.stroke) ctx.stroke();
    }

    // Accessibility
    open() {
        if (!this.isOpen) {
            if (this.stage) {
                if (this._runningAnim) this._runningAnim.cancel();
                this._runningAnim = Animate.tween(this, { _openOffset: Math.PI / 2 }, 300).after(() => {
                    this._openOffset = Math.PI / 2;
                    this._runningAnim = null;
                });
            }
            else {
                this._openOffset = Math.PI / 2;
            }
            this.isOpen = true;
        }
    }
    close() {
        if (this.isOpen) {
            if (this.stage) {
                if (this._runningAnim) this._runningAnim.cancel();
                this._runningAnim = Animate.tween(this, { _openOffset: 0 }, 300).after(() => {
                    this._openOffset = 0;
                    this._runningAnim = null;
                });
            }
            else {
                this._openOffset = 0;
            }
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

    applyExpr(node, animated=false) {
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

        parent.getEnvironment().update(this.name, node);
        // Make sure the env display updates
        parent.update();

        let vars = findNoncapturingVarExpr(this.parent, null, true, true);
        let capturedVars = findNoncapturingVarExpr(this.parent, this.name, true, true);
        for (let variable of vars) {
            // If the variable can't be reduced, don't allow this to be reduced.
            let idx = capturedVars.indexOf(variable);
            // Make sure that if the variable can't reduce, it's
            // because it's the one bound by this argument.
            if (!variable.canReduce() && (idx == -1 || capturedVars[idx].name != this.name)) {
                // Play the animation
                variable.performReduction(animated);
                return null;
            }
        }

        // Now remove this hole from its parent expression.
        parent.removeArg(this);

        // GAME DESIGN CHOICE: Automatically break apart parenthesized values.
        // * If we don't do this, the player can stick everything into one expression and destroy that expression
        // * to destroy as many expressions as they like with a single destruction piece. And that kind of breaks gameplay.
        return parent.performReduction(animated);
    }

    // Events
    onmousedown(pos) {
        if (this.parent) {
            pos = addPos(pos, fromTo(this.absolutePos, this.parent.absolutePos));
            this.parent.onmousedown(pos);
        }
    }

    onmouseup(pos) {
        if (this.parent) {
            pos = addPos(pos, fromTo(this.absolutePos, this.parent.absolutePos));
            this.parent.onmouseup(pos);
        }
    }

    onmousedrag(pos) {
        if (this.parent) {
            pos = addPos(pos, fromTo(this.absolutePos, this.parent.absolutePos));
            this.parent.onmousedrag(pos);
        }
    }
    onmouseenter(pos) {
        super.onmouseenter(pos);
    }

    onmouseleave() {
        super.onmouseleave();
    }
    ondropenter(node, pos) {
        if (node instanceof LambdaHoleExpr) node = node.parent;
        // Variables must be reduced before application
        if (node instanceof VarExpr || node instanceof AssignExpr || node instanceof VtableVarExpr) return;
        // Disallow interaction with nested lambdas
        if (this.parent && this.parent.parent) return;
        super.ondropenter(node, pos);

        // Special case: Funnel representation of 'map' hovered over hole.
        // if (node instanceof FunnelMapFunc) {
        //     node.onmouseenter();
        //     return;
        // }

        node.opacity = 0.4;

        if (this.parent) {
            // Ignore variables that are shadowed when previewing
            let subvarexprs = findNoncapturingVarExpr(this.parent, this.name);

            let wasClosed = false;
            if (this.parent.environmentDisplay) {
                wasClosed = this.parent.environmentDisplay._state === 'closed' ||
                    this.parent.environmentDisplay._state === 'closing';
                this.parent.environmentDisplay.openDrawer({ force: true, speed: 50 });
            }

            let preview_nodes = [];
            let is_replication_expr = true;
            subvarexprs.forEach((e) => {
                if (e.parent != this.parent)
                    is_replication_expr = false;
                if (e.name === this.name) {
                    let preview_node = node.clone();
                    preview_node.opacity = 1.0;
                    preview_node.bindSubexpressions();
                    e.open(preview_node);
                    preview_nodes.push(preview_node);
                }
            });

            this.opened_subexprs = subvarexprs;
            this.preview_nodes = preview_nodes;
            this.is_replication_expr = is_replication_expr && this.preview_nodes.length > 0;
            this.close_opened_subexprs = () => {
                if (!this.opened_subexprs) return;
                this.preview_nodes = null;
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
        if (node instanceof VarExpr || node instanceof AssignExpr || node instanceof VtableVarExpr) return;
        if (this.parent && this.parent.parent instanceof LambdaExpr) return;

        super.ondropexit(node, pos);

        // if (node instanceof FunnelMapFunc) {
        //     return;
        // }

        if (node) node.opacity = 1.0;
        if (this.close_opened_subexprs) this.close_opened_subexprs();
    }
    ondropped(node, pos) {

        if (node instanceof LambdaHoleExpr) node = node.parent;

        // Disallow interaction with nested lambda
        if (this.parent && this.parent.parent) {
            return null;
        }

        // Disallow dropping non-values
        if (node instanceof VarExpr ||
            node instanceof AssignExpr ||
            node instanceof VtableVarExpr)
            return null;

        // Disallow dropping if lambda body has incomplete textbox.
        const lambdaExpr = this.parent;

        // Disallow dropping if lambda body has missing expression.

        if (__ALLOW_PARTIAL_REPLICATION === true) {
            if (node.hasTextbox()) {
                node.animatePlaceholderChildren();
                this.ondropexit(node, pos);
                return null;
            }
            if (lambdaExpr.hasTextbox()) {
                lambdaExpr.animatePlaceholderChildren();
                this.ondropexit(node, pos);
                return null;
            }
            if (lambdaExpr.hasPlaceholder()) {
                lambdaExpr.animatePlaceholderChildren();
                this.ondropexit(node, pos);
                return null;
            }
        } else {
            if (hasTextbox(node) || hasPlaceholder(node)) {
                node.animatePlaceholderChildren();
                this.ondropexit(node, pos);
                return null;
            }
            if (hasTextbox(lambdaExpr) || hasPlaceholder(lambdaExpr)) {
                lambdaExpr.animatePlaceholderChildren();
                this.ondropexit(node, pos);
                return null;
            }
        }

        if (node.dragging) { // Make sure node is being dragged by the user.

            var afterDrop = () => {

                var stage = node.stage;

                // Save the current state of the board.
                stage.saveState();

                let preview_nodes = this.preview_nodes;
                let is_replication_expr = this.is_replication_expr;
                if (this.close_opened_subexprs) {
                    if (is_replication_expr && preview_nodes.length > 0) {

                        let final_nodes = [];
                        preview_nodes.forEach((n) => {
                            let c = n.clone();
                            c.anchor = n.anchor;
                            c.pos = n.absolutePos;
                            c.scale = n.absoluteScale;
                            // Lock child nodes that are not placeholders
                            c.lockSubexpressions(
                                (e) => !(e.isPlaceholder() || e instanceof LambdaHoleExpr) ||
                                    e instanceof VarExpr);
                            let pos = addPos(c.pos, {x:0, y:-40});
                            final_nodes.push( c );
                        });

                        let overlap_layout = false;
                        let off_screen = false;
                        for (let i = 0; i < final_nodes.length - 1; i++) {
                            let a = final_nodes[i];
                            let b = final_nodes[i+1];
                            const right = a.pos.x - a.scale.x * a.size.w + a.size.w;
                            if (Math.abs(b.pos.x - a.pos.x) < a.size.w) { // If these two nodes will overlap...
                                console.log('overlap', a.pos, b.pos, a.size);
                                overlap_layout = true;
                            }
                            if (right > this.stage.boundingSize.w) {
                                off_screen = true;
                            }
                        }

                        const len = final_nodes.length;
                        const total_width = final_nodes.reduce((prev, n) => prev + n.size.w, 0);
                        const total_height = final_nodes.reduce((prev, n) => prev + n.size.h, 0);
                        const mid_xpos = final_nodes.reduce((prev, n) => prev + n.pos.x, 0) / len;

                        const layout_vertical = (overlap_layout && total_width > 420) || off_screen;
                        if (layout_vertical) {
                            // If goes off screen vertically, use the
                            // space below the lambda instead

                            let yPos = (c, i) => {
                                return c.pos.y - 60 - ((len - i - 1) / len * total_height) + i * 10;
                            };

                            for (let i = 0; i < final_nodes.length; i++) {
                                const c = final_nodes[i];
                                let y = yPos(c, i);
                                if (y - c.scale.y * c.size.h < 0) {
                                    yPos = (c, i) => {
                                        return c.pos.y + 60 - ((len - i - 1) / len * total_height) + i * 10;
                                    };
                                    break;
                                }
                            }

                            final_nodes.forEach((c, i) => {
                                let final_pos = { x:mid_xpos,
                                                  y:yPos(c, i) };
                                stage.add(c);
                                Animate.tween(c, {scale:{x:1, y:1}, pos:final_pos}, 300, (e) => Math.pow(e, 0.5)).after(() => {
                                    c.onmouseleave();
                                });
                            });
                        }
                        else {
                            final_nodes.forEach((c, i) => {
                                let final_pos;
                                if (overlap_layout)
                                    final_pos = { x:mid_xpos + (len - i - 1) / len * total_width - total_width / 4.0, y:c.pos.y - 40 };
                                else
                                    final_pos = { x:c.pos.x, y:c.pos.y - 40 };
                                stage.add(c);
                                Animate.tween(c, {scale:{x:1, y:1}, pos:final_pos}, 300, (e) => Math.pow(e, 0.5)).after(() => {
                                    c.onmouseleave();
                                });
                            });
                        }
                    }
                    else {
                        // There are variables without a value
                        mag.Stage.getAllNodes([lambdaExpr]).forEach((n) => {
                            if (n instanceof LambdaVarExpr) {
                                Animate.blink(n, 500, [1, 0, 0], 1);
                            }
                        });
                    }
                    this.close_opened_subexprs();
                }

                // Cleanup
                node.opacity = 1.0;

                // User dropped an expression into the lambda hole.
                Resource.play('pop');

                // Clone the dropped expression.
                var dropped_expr = node.clone();

                // Remove the original expression from its stage.
                stage.remove(node);

                // If this hole is part of a larger expression tree (it should be!),
                // attempt recursive substitution on any found LambdaVarExpressions.
                if (this.parent) {
                    var parent = this.parent;
                    let orig_exp_str = this.parent.toString();
                    let dropped_exp_str = node.toString();

                    // Animate this application
                    if (!is_replication_expr) {
                        let result = this.applyExpr(node, true);
                        if (result === null) {
                            // The application failed.
                            stage.add(node);
                            stage.update();
                            return;
                        }
                    } else {
                        parent.opacity = 1;
                        parent.ignoreEvents = true;
                        Animate.tween(parent, { opacity:0 }, 200, (elapsed) => Math.pow(elapsed, 0.5)).after(() => {
                            stage.remove(parent);
                            stage.update();
                            stage.saveState();
                        });
                    }

                    // Log the reduction.
                    Logger.log('reduction-lambda', { 'before':orig_exp_str, 'applied':dropped_exp_str, 'after':parent.toString() });

                    if (parent.children.length === 0) {

                        // This hole expression is a destructor token.
                        // (a) Play nifty 'POOF' animation.
                        Animate.poof(parent);

                        // (b) Remove expression from the parent stage.
                        (parent.parent || parent.stage).remove(parent);

                    }
                    // } else
                    //     stage.dumpState();

                    return null;

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
                return afterDrop();
        }
    }

    isPlaceholder() {
        return false;
    }

    toString() { return 'λ' + this.name; }
}

class DelayedLambdaHoleExpr extends LambdaHoleExpr {
    ondropped(node, pos) {
        if (node instanceof LambdaHoleExpr) node = node.parent;
        // Disallow interaction with nested lambda
        if (this.parent && this.parent.parent instanceof LambdaExpr) {
            return null;
        }
        // Disallow applying to non values
        if (node instanceof VarExpr || node instanceof AssignExpr || node instanceof VtableVarExpr) return null;
        let parent = this.parent;
        let stage = this.stage;
        node.opacity = 1;
        node.onmouseleave();
        if (this.close_opened_subexprs) this.close_opened_subexprs();
        let res = new ApplyExpr(node.clone(), this.parent.clone());
        stage.remove(node);
        (parent.parent || parent.stage).swap(parent, res);
        return res;
    }
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

    get openImage() { return this.name === 'x' ? 'lambda-pipe-open' : 'lambda-pipe-white-open'; }
    get closedImage() { return this.name === 'x' ? 'lambda-pipe' : 'lambda-pipe-white'; }
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

    onmouseclick(pos) {
        // TODO: DML enable reduction, but make sure we are not bound
        // by a lambda
        if (!this.parent) {
            this.performReduction(true);
        }
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
            if (stage) stage.draw();
        }
    }

    reduce() {
        let environment = this.getEnvironment();
        let value = environment.lookup(this.name);

        if (value) {
            let clone = value.clone();
            clone.stage = null;
            clone.bindSubexpressions();
            let parent = this.parent || this.stage;
            if (parent) {
                parent.swap(this, clone);
                if (this.parent) {
                    this.parent.bindSubexpressions();

                    if (this.parent instanceof IfStatement && this.parent.cond instanceof CompareExpr) {
                        this.parent.cond.unlock();
                    }
                }
            }
            return clone;
        }
        return this;
    }

    canReduce() {
        let environment = this.getEnvironment();
        return environment && environment.lookup(this.name);
    }

    isValue() {
        return false;
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
    toJavaScript() { return this.name; }
}

class LambdaExpr extends Expression {
    constructor(exprs) {
        super(exprs);
        this.environment = new Environment();
        if (this.takesArgument) {
            this.environment.bound[exprs[0].name] = true;
        }

        /*let txt = new TextExpr('→');
        txt.color = 'gray'
        this.addArg(txt);*/
    }
    isValue() {
        return false;
    }
    getEnvironment() {
        let env = super.getEnvironment();
        if (!env.parent && this.stage) {
            env.parent = this.stage.environment;
        }
        return env;
    }
    applyExpr(node, animated=false) {
        if (this.takesArgument) {
            return this.holes[0].applyExpr(node, animated);
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
            var lvars = mag.Stage.getNodesWithClass(VarExpr, [], true, [this]);
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
        return this.holes.slice(1).reduce(((prev,arg) => (prev && !(arg instanceof MissingExpression) && !(arg instanceof TypeInTextExpr))), true);
    }
    get isConstantFunction() {
        return this.takesArgument && mag.Stage.getNodesWithClass(VarExpr, [], true, [this]).length === 0;
    }
    get body() { return this.takesArgument ? this.holes[1] : null; }
    get hole() { return this.takesArgument ? this.holes[0] : null; }
    updateHole() {
        // Determine whether this LambdaExpr has any MissingExpressions:
        if (this.holes[0].name !== 'x')
            this.color = this.holes[0].color;
        let missing = !this.fullyDefined;
        if (missing || (this.parent && ((this.parent instanceof FuncExpr && !this.parent.isAnimating)))) { // ||
            //this.parent instanceof LambdaExpr && this.parent.takesArgument)))
            this.holes[0].close();
        }
        else {
            this.holes[0].open();
        }
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
        this.performReduction(true);
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
    performReduction(animated=false) {
        // TODO: need to convert performReductions here
        // If we don't have all our arguments, refuse to evaluate.
        if (this.takesArgument) {
            if (this.getPlaceholderChildren().length === 0) {
                Animate.blink(this.holes[0]);
            }
            return this;
        }

        // Perform substitution, but stop at the 'boundary' of another lambda.
        let varExprs = findNoncapturingVarExpr(this, null, true, true);
        let environment = this.getEnvironment();
        for (let expr of varExprs) {
            expr.performReduction(animated);
        }
        for (let child of this.holes) {
            if (child instanceof LambdaExpr) {
                // TODO: need to recurse down into children, but not children of lambdas
                child.environment.parent = this.environment;
            }
        }

        var reduced_expr = this.reduce();
        if (reduced_expr && reduced_expr != this) { // Only swap if reduction returns something > null.

            var stage = this.stage;
            var parent;

            if (Array.isArray(reduced_expr)) {
                if (reduced_expr.length === 1) { reduced_expr = reduced_expr[0]; } // reduce to single argument
                else if (this.parent) return; // cannot reduce a parenthetical expression with > 1 subexpression.
                else {
                    parent = this.stage;
                    reduced_expr.forEach((e) => {
                        if (this.locked) e.lock();
                        else             e.unlock();
                        e.lockSubexpressions(
                            (node) => !(node.isPlaceholder() ||
                                        node instanceof LambdaHoleExpr) ||
                                node instanceof VarExpr);
                    });
                    parent.swap(this, reduced_expr); // swap 'this' (on the board) with an array of its reduced expressions
                    parent.saveState();
                    return reduced_expr;
                }
            }

            parent = this.parent ? this.parent : this.stage;
            if (this.locked) reduced_expr.lock(); // the new expression should inherit whatever this expression was capable of as input
            else             reduced_expr.unlock();
            //console.warn(this, reduced_expr);
            reduced_expr.lockSubexpressions(
                (node) => !(node.isPlaceholder() ||
                            node instanceof LambdaHoleExpr) ||
                    node instanceof VarExpr);

            if (parent) parent.swap(this, reduced_expr);

            if (reduced_expr.parent) {
                var try_reduce = reduced_expr.parent.reduceCompletely();
                if (try_reduce != reduced_expr.parent && try_reduce !== null) {
                    Animate.blink(reduced_expr.parent, 400, [0,1,0]);
                }
            }

            if (stage) stage.saveState();

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

    drawInternal(ctx, pos, boundingSize) {
        super.drawInternal(ctx, pos, boundingSize);
        if (this.shadowOffset == 0 && this.parent) {
            setStrokeStyle(ctx, {
                color: 'gray',
                lineWidth: 1,
            });
            roundRect(ctx,
                      pos.x - 1, pos.y - 1,
                      boundingSize.w + 1, boundingSize.h + 1,
                      this.radius*this.absoluteScale.x, false, true, 0.5);
            setStrokeStyle(ctx, this.stroke);
        }
    }

    toString() {
        if (this.holes.length === 1 && this.holes[0] instanceof LambdaHoleExpr)
            return (this.locked ? '/' : '') + '(' + super.toString() + ')';
        else
            return (this.locked ? '/' : '') + super.toString();
    }
    toJavaScript() {
        let param_name = this.hole.name;
        let bodyJS = this.holes.length > 2 ? this.holes.slice(1).map((e) => e.toJavaScript()).join('') : this.body.toJavaScript();
        if (bodyJS.indexOf(' ') > -1) bodyJS = `(${bodyJS})`
        let funcJS = `${param_name} => ${bodyJS}`;
        return funcJS;
    }

    getPlaceholderChildren() {
        return mag.Stage.getAllNodes([this]).filter(
            (e) => e instanceof Expression &&
                e.isPlaceholder() &&
                e != this.hole &&
              !(e instanceof LambdaVarExpr ||
                e instanceof VtableVarExpr ||
                e instanceof LabeledVarExpr ||
                e instanceof VarExpr ||
                e instanceof LambdaHoleExpr)
        );
    }
}


class EnvironmentLambdaExpr extends LambdaExpr {
    constructor(exprs) {
        super(exprs);
        this.environmentDisplay = new InlineEnvironmentDisplay(this);
        this.environmentDisplay.scale = { x: 0.85, y: 0.85 };
        this._originalArg = null;
    }

    removeArg(arg) {
        // Save the hole for later - we want to keep the parameter
        // visible while we are reducing (if we are animating)
        if (arg instanceof LambdaHoleExpr) {
            arg.isOpen = false;
            this._originalArg = arg;
        }
        super.removeArg(arg);
    }

    get takesArgument() {
        // Since the hole isn't removed by our override of removeArg,
        // account for that when deciding whether the lambda is
        // reducible
        return this.holes.length > 0 && this.holes[0] instanceof LambdaHoleExpr && !this._originalArg;
        // We can't check isOpen because that confuses
        // LambdaExpr#hitsChild (which means that we can't do things
        // like drag expressions into holes!)
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
        // Don't let the player manually reduce (whatever that even means)
    }

    reduceCompletely() {
        // Do not allow reduction under the lambda!
        return this;
    }

    performReduction(animated=false) {
        // If we don't have all our arguments, refuse to evaluate.
        if (this.takesArgument) {
            return this;
        }

        if (!animated) {
            return super.performReduction(false);
        }

        // Add the parameter back, so it's visible while we reduce.
        if (this._originalArg) {
            this.addChildAt(0, this._originalArg);
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
    constructor(varname) {
        super(varname);
        this.padding.left = 5;
        this.addArg(new TextExpr("λ" + varname + "."));
        this.label.color = "#000";
    }

    get label() {
        return this.holes[0];
    }

    get size() {
        return {
            w: 50,
            h: 50,
        };
    }

    open() {
        if (!this.isOpen) {
            this.label.color = "#000";
            this.label.shadow = null;
        }
        super.open();
    }

    close() {
        if (this.isOpen) {
            this.label.color = "#565656";
            this.label.shadow = {
                color: "#777",
                x: 1,
                y: 0,
                blur: 0,
            };
        }
        super.close();
    }

    drawInternal(ctx, pos, boundingSize) {
        var rad = boundingSize.w / 2.0;
        ctx.beginPath();
        ctx.arc(pos.x+rad,pos.y+rad,rad,0,2*Math.PI);
        setStrokeStyle(ctx, this.stroke);
        if(this.stroke) ctx.stroke();
    }
}
class HalfFadedLambdaHoleExpr extends LambdaHoleExpr {
    constructor(varname) {
        super(varname);
        let txt = new TextExpr(varname);
        txt._xOffset = 6;
        txt.fontSize = 32;
        this.addArg(txt);
        this.label.color = "#FFF";
    }

    get label() {
        return this.holes[0];
    }

    open() {
        if (!this.isOpen) {
            this.label.color = "#FFF";
        }
        super.open();
    }

    close() {
        if (this.isOpen) {
            this.label.color = "#565656";
        }
        super.close();
    }

    get size() {
        return {
            w:50,
            h:50
        };
        // let size = super.size;
        // size.w = Math.max(size.w, size.h);
        // size.h = Math.max(size.w, size.h);
        // return size;
    }
}

class FadedES6LambdaHoleExpr extends LambdaHoleExpr {
    constructor(varname) {
        super(varname);
        this.padding.left = 5;
        this.addArg(new TextExpr("(" + varname + ")"));
        this.addArg(new TextExpr("=>"));

        this.label.color = "#000";
        this.arrow.color = "#000";
    }

    get label() {
        return this.holes[0];
    }

    get arrow() {
        return this.holes[1];
    }
    set arrow(a) {
        this.holes[1] = a;
    }

    // Events
    hits(pos, options) {
        if (this.ignoreEvents) return null; // All children are ignored as well.
        else if (!this.isOpen) return null;

        // if (this.arrow instanceof TypeInTextExpr)
        //     if (this.arrow.hits(pos, options)) return this.arrow;

        var boundingSize = this.label.absoluteSize;
        var upperLeftPos = this.label.upperLeftPos(this.absolutePos, boundingSize);
        if (pointInRect(pos, rectFromPosAndSize(upperLeftPos, boundingSize) )) return this;
        else return null;
    }

    update() {
        super.update();
        this.label.pos = {
            x: this.label.pos.x,
            y: 22,
        };
        this.arrow.pos = {
            x: this.arrow.pos.x,
            y: 22,
        };
    }

    // Draw special round rect around just x term.
    drawInternal(ctx, pos, boundingSize) {
        setStrokeStyle(ctx, this.stroke);
        ctx.fillStyle = this.color;
        if (this.stroke) {
            roundRect(ctx,
                      this.label.absolutePos.x,
                      this.label.absolutePos.y - this.label.anchor.y * this.label.absoluteSize.h,
                      this.label.absoluteSize.w,
                      this.label.absoluteSize.h,
                      6, false, true, this.stroke.opacity);
        }
    }
}

class DelayedFadedES6LambdaHoleExpr extends FadedES6LambdaHoleExpr {
    ondropped(node, pos) {
        if (node instanceof LambdaHoleExpr) node = node.parent;
        // Disallow interaction with nested lambda
        if (this.parent && this.parent.parent instanceof LambdaExpr) {
            return null;
        }
        // Disallow applying to non values
        if (node instanceof VarExpr || node instanceof AssignExpr || node instanceof VtableVarExpr) return null;
        let parent = this.parent;
        let stage = this.stage;
        node.opacity = 1;
        node.onmouseleave();

        if (this.close_opened_subexprs) this.close_opened_subexprs();
        let res = new ApplyExpr(node.clone(), this.parent.clone());
        stage.remove(node);
        (parent.parent || parent.stage).swap(parent, res);
        return res;
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


// This doesn't account for the case (lambda y. x) y, since we use
// call-by-value (variables have to be evaluated before you can use
// them)
function findNoncapturingVarExpr(lambda, name, skipLambda=false, skipLabel=false) {
    let subvarexprs = [];
    let queue = [lambda];
    while (queue.length > 0) {
        let node = queue.pop();
        let isVar = node instanceof VarExpr || node instanceof LambdaVarExpr || node instanceof VtableVarExpr || node instanceof HalfFadedLambdaVarExpr || node instanceof FadedLambdaVarExpr;
        if (isVar) {
            subvarexprs.push(node);
        }
        else if (!skipLabel && (node instanceof DisplayChest || node instanceof LabeledDisplay || node instanceof SpreadsheetDisplay)) {
            subvarexprs.push(node);
        }
        else if (node !== lambda &&
                 node instanceof LambdaExpr &&
                 ((node.takesArgument &&
                   node.holes[0].name === name) || skipLambda)) {
            // Capture-avoiding substitution
            continue;
        }

        if (node.children && !isVar) {
            queue = queue.concat(node.children);
        }

        if (node instanceof EnvironmentLambdaExpr) {
            let displays = findNoncapturingVarExpr(node.environmentDisplay, name, skipLambda);
            queue = queue.concat(displays);
        }
    }

    return subvarexprs;
}
