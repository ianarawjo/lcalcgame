class MissingExpression extends Expression {
    constructor(expr_to_miss) {
        super([]);
        if (!expr_to_miss) expr_to_miss = new Expression();
        this.shadowOffset = -1; // inner
        this.color = '#555555';
        this._size = { w:expr_to_miss.size.w, h:expr_to_miss.size.h };
        this.ghost = expr_to_miss;
    }
    isPlaceholder() { return true; }
    getClass() { return MissingExpression; }
    accepts(expr) {
        // Never accept special exprs in normal holes. Subclass to accept these types of exprs...
        return !(expr instanceof OpLiteral || expr instanceof ChoiceExpr || expr instanceof Snappable);
    }
    onmousedrag(pos) {
        // disable drag
        // forward it to parent
        if (this.parent) {
            pos = addPos(pos, fromTo(this.absolutePos, this.parent.absolutePos));
            this.parent.onmousedrag(pos);
        }
    }
    onmouseup(pos) {
        if (this.parent && this.parent.dragging) {
            pos = addPos(pos, fromTo(this.absolutePos, this.parent.absolutePos));
            this.parent.onmouseup(pos);
        }
    }
    ondropenter(node, pos) {
        if (!this.accepts(node)) return;
        this.onmouseenter(pos);
    }
    ondropexit(node, pos) {
        if (!this.accepts(node)) return;
        this.onmouseleave(pos);
    }
    ondropped(node, pos) {
        // Forward drop events from dragged MissingExpression's to their root exprs.
        // (so you can still drag a parent by its hole...)
        if (node instanceof MissingExpression)
            node = node.rootParent;

        if (!this.accepts(node))
            return;

        if (node.dragging) { // Reattach node.

            // Should not be able to stick lambdas in MissingExpression holes (exception of Map and Define)
            // if (node instanceof LambdaExpr && !(this.parent instanceof MapFunc)
            //     && !(this.parent instanceof DefineExpr) && !(this.parent instanceof ObjectExtensionExpr))
            //     return;

            // Should not be able to use choice exprs or snappables, ever
            if (node instanceof ChoiceExpr || node instanceof Snappable) return;

            let stage = this.stage;
            let beforeNode = this.rootParent.toJavaScript();
            let droppedExp = node.toJavaScript();
            let parent = this.parent;

            // Unset toolbox flag even when dragging directly to a hole
            if (node.toolbox) {
                node.toolbox.removeExpression(node);
                node.toolbox = null;
            }

            Resource.play('pop');
            node.stage.remove(node);
            node.droppedInClass = this.getClass();
            node.shadowOffset = 2;
            parent.swap(this, node);

            ShapeExpandEffect.run(node, 300, (e) => Math.pow(e, 0.5), 'white', 1.5);

            const root = parent.rootParent || parent;
            if (__ACTIVE_LEVEL_VARIANT === "verbatim_variant" &&
                root.forceTypingOnFill) {

                let hasMissing = false;
                for (const placeholder of root.getPlaceholderChildren()) {
                    if (placeholder instanceof MissingExpression || placeholder instanceof TypeInTextExpr) {
                        hasMissing = true;
                        break;
                    }
                }

                if (!hasMissing) {
                    const challenge = new TypeInTextExpr();
                    let code = root.toJavaScript();
                    if (window.escodegen) {
                        code = window.escodegen.generate(window.esprima.parse(code, {
                            raw: true,
                            tokens: true,
                            range: true,
                        }), {
                            comment: false,
                            format: {
                                // Have it preserve spaces, but don't
                                // put things across multiple lines.
                                compact: false,
                                indent: {
                                    style: "",
                                },
                                newline: "",
                                // Remove trailing semicolon
                                semicolons: false,
                                quotes: "double",
                            },
                        });
                    }
                    if (code.indexOf('=>') > -1) { // Patch in parens for arrow functions...
                        const varname = code.split('=>')[0].trim();
                        code = `(${varname}) =>${code.split('=>')[1]}`;
                    }
                    challenge.enforceHint(code);
                    challenge.typeBox.update();
                    const wrapper = new Expression([challenge]);
                    const pos = root.pos;
                    const anchor = root.anchor;
                    wrapper.holes[0].emptyParent = true;

                    stage.saveState({name:"placed-expr", before:beforeNode, item:droppedExp, after: root.toJavaScript()});

                    root.stage.swap(root, wrapper);
                    wrapper.pos = pos;
                    wrapper.anchor = anchor;
                    //wrapper.color = 'magenta';

                    showHelpText("Press ENTER when finished typing.");

                    stage.saveState({name:"verbatim-prompt", text:code});
                    Logger.log('verbatim-prompt', {text: code});

                    ShapeExpandEffect.run(wrapper, 500, (e) => Math.pow(e, 0.5), __VERBATIM_COLOR, 1.5);

                    challenge.focus();
                    return;
                }
            }
            // Logger.log('placed-expr', {'before':beforeNode, 'after':afterState, 'item':droppedExp });

            stage.saveState({name:"placed-expr", before:beforeNode, item:droppedExp, after:parent.rootParent.toJavaScript()});

            // Blink red if total reduction is not possible with this config.
            /*var try_reduce = node.parent.reduceCompletely();
            if (try_reduce == node.parent || try_reduce === null) {
                Animate.blink(node.parent, 400, [1,0,0]);
            }*/

            // Blink blue if reduction is possible with this config.
            //var try_reduce = node.parent.reduceCompletely();
            /*if ((try_reduce != node.parent && try_reduce !== undefined) || node.parent.isComplete()) {
                Animate.blink(node.parent, 1000, [1,1,0], 1);
            }*/
        }
    }

    toString() { return '_'; }
    toJavaScript() { return this.toString(); }
}

class MissingTypedExpression extends MissingExpression {
    constructor(expr_to_miss) {
        super(expr_to_miss);
        this.acceptedClasses = [];
        if (expr_to_miss && expr_to_miss.equivalentClasses) {
            this.acceptedClasses = expr_to_miss.equivalentClasses;
        }
    }

    getClass() { return MissingTypedExpression; }

    // Returns TRUE if this hole accepts the given expression.
    accepts(expr) {
        for (let c of this.acceptedClasses) {
            if (expr instanceof c) return true; }
    }
    ondropenter(node, pos) {
        if (this.accepts(node))
            super.ondropenter(node, pos);
    }
    ondropexit(node, pos) {
        if (this.accepts(node))
            super.ondropexit(node, pos);
    }
    ondropped(node, pos) {
        if (this.accepts(node))
            super.ondropped(node, pos);
    }

    toString() { return '_'; }
    toJavaScript() { return this.toString(); }
}
class MissingOpExpression extends MissingTypedExpression {
    constructor(expr_to_miss) {
        super(expr_to_miss);
        this._size = { w:50, h:50 };
        this.acceptedClasses = [ OpLiteral ];
        this.radius = 26;
    }
    getClass() { return MissingOpExpression; }
    toString() { return '>>'; }
}

class MissingBagExpression extends MissingTypedExpression {
    constructor(expr_to_miss) {
        super(expr_to_miss);
        this._size = { w:50, h:50 };
        this.graphicNode = new Bag(0, 0, 22, false);
        this.acceptedClasses = [ BagExpr, PutExpr ];
    }
    getClass() { return MissingBagExpression; }

    toString() { return '__'; }
}
class MissingBracketExpression extends MissingBagExpression {
    constructor(expr_to_miss) {
        super(expr_to_miss);
        this.graphicNode = new mag.ImageRect(0, 0, 22, 22, 'missing-bracket');
    }
    getClass() { return MissingBracketExpression; }

    onmouseenter(pos) {
        super.onmouseenter(pos);
        this.graphicNode.image = 'missing-bracket-selected';
    }
    onmouseleave(pos) {
        super.onmouseleave(pos);
        this.graphicNode.image = 'missing-bracket';
    }
    ondropenter(node, pos) {
        if (this.accepts(node)) {
            this.graphicNode.image = 'missing-bracket-selected';
            super.ondropenter(node, pos);
        }
    }
    ondropexit(node, pos) {
        if (this.accepts(node)) {
            this.graphicNode.image = 'missing-bracket';
            super.ondropexit(node, pos);
        }
    }
    ondropped(node, pos) {
        if (this.accepts(node)) {
            this.graphicNode.image = 'missing-bracket';
            super.ondropped(node, pos);
        }
    }
    drawInternal(ctx, pos, boundingSize) {
        pos.x -= boundingSize.w / 1.1 - boundingSize.w;
        pos.y -= boundingSize.h / 1.05 - boundingSize.h;
        boundingSize.w /= 1.1;
        boundingSize.h /= 1.1;
        this.graphicNode.stroke = this.stroke;
        this.graphicNode.color = this.color;
        this.graphicNode.shadowOffset = this.shadowOffset;
        this.graphicNode.drawInternal(ctx, pos, boundingSize);
    }
}

class MissingBooleanExpression extends MissingTypedExpression {
    constructor(expr_to_miss) {
        super(expr_to_miss);
        this._size = { w:80, h:50 };
        this.color = "#0c2c52";

        this.graphicNode = new mag.HexaRect(0, 0, 44, 44);

        this.acceptedClasses = [ BooleanPrimitive, CompareExpr, UnaryOpExpr ];
    }
    getClass() { return MissingBooleanExpression; }

    drawInternal(ctx, pos, boundingSize) {
        this.graphicNode.stroke = this.stroke;
        this.graphicNode.color = this.color;
        this.graphicNode.shadowOffset = this.shadowOffset;
        this.graphicNode.drawInternal(ctx, pos, boundingSize);
    }

    toString() { return '_b'; }
}
class MissingKeyExpression extends MissingBooleanExpression {
    constructor(expr_to_miss) {
        super(expr_to_miss);

        var keyhole = new mag.ImageRect(0, 0, 26/2, 42/2, 'lock-keyhole');
        this.graphicNode.addChild(keyhole);

    }
    drawInternal(ctx, pos, boundingSize) {
        super.drawInternal(ctx, pos, boundingSize);

        // Draw keyhole.
        let sz = this.graphicNode.children[0].size;
        this.graphicNode.children[0].drawInternal( ctx, addPos(pos, { x:boundingSize.w/2.0-sz.w/2, y:boundingSize.h/2.0-sz.h/2 }), sz);
    }
}

class MissingChestExpression extends MissingTypedExpression {
    constructor(expr_to_miss) {
        super(expr_to_miss);
        this.initialize();
        this.acceptedClasses = [ VarExpr, VtableVarExpr ];
    }

    initialize() {
        this.image = new mag.ImageRect(0, 0, 48, 48, 'chest-silhouette');
        this.addArg(this.image);
    }

    hitsChild() {
        return null;
    }

    getClass() { return MissingChestExpression; }

    accepts(expr) {
        return (expr instanceof VarExpr) || (expr instanceof VtableVarExpr && !expr.subReduceMethod);
    }
}

class MissingVariableExpression extends MissingChestExpression {
    getClass() { return MissingVariableExpression; }

    initialize() {
        this.label = new TextExpr("xy");
        this.label.color = "#AAA";
        this.addArg(this.label);
    }
}

class MissingLambdaExpression extends MissingTypedExpression {
    getClass() { return MissingLambdaExpression; }
    hitsChild() { return null; }
    constructor(e) {
        super(e);
        this.acceptedClasses = [ LambdaExpr ];
        this.label = new TextExpr("=>");
        this.label.color = "#000";
        this.addArg(this.label);
    }
}

class MissingSequenceExpression extends MissingExpression {
    constructor() {
        super(new Expression());
    }

    getClass() { return MissingSequenceExpression; }

    ondropped(node, pos) {
        super.ondropped(node, pos);
        node.lockInteraction();
    }
}

class InvisibleMissingExpression extends MissingExpression {
    constructor() {
        super(new Expression());
    }

    getClass() { return InvisibleMissingExpression; }

    drawInternal(ctx, pos, boundingSize) {
        if (this.stroke) {
            ctx.fillStyle = this.stroke.color;
            ctx.globalAlpha = 0.5;
            ctx.fillRect(pos.x, pos.y, boundingSize.w, boundingSize.h);
        }
    }
}

class MissingNumberExpression extends MissingTypedExpression {
    constructor(expr_to_miss) {
        super(expr_to_miss);
        this.graphicNode = new mag.ImageRect(0, 0, 24, 32, (ExprManager.getFadeLevel('number') > 0 ? 'missing-number' : 'die'));

        this.acceptedClasses = [ VarExpr, NumberExpr, ObjectExtensionExpr , NamedExpr];
    }
    getClass() { return MissingNumberExpression; }

    drawInternal(ctx, pos, boundingSize) {
        super.drawInternal(ctx, pos, boundingSize);
        this.graphicNode.color = '#111';
        this.graphicNode.shadowOffset = this.shadowOffset;
        let subPos = {
            x: pos.x + 0.1 * boundingSize.w,
            y: pos.y + 0.1 * boundingSize.h,
        };
        let subSize = {
            w: 0.8 * boundingSize.w,
            h: 0.8 * boundingSize.h,
        };
        this.graphicNode.drawInternal(ctx, subPos, subSize);
    }
}
