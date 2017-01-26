









class MissingExpression extends Expression {
    constructor(expr_to_miss) {
        super([]);
        if (!expr_to_miss) expr_to_miss = new Expression();
        this.shadowOffset = -1; // inner
        this.color = '#555555';
        this._size = { w:expr_to_miss.size.w, h:expr_to_miss.size.h };
        this.ghost = expr_to_miss;
    }
    isComplete() { return false; }
    getClass() { return MissingExpression; }
    onmousedrag(pos) { } // disable drag
    ondropenter(node, pos) {
        this.onmouseenter(pos);
    }
    ondropexit(node, pos) {
        this.onmouseleave(pos);
    }
    ondropped(node, pos) {
        super.ondropped(node, pos);
        if (node.dragging) { // Reattach node.

            // Should not be able to stick lambdas in MissingExpression holes (exception of Map)
            if (node instanceof LambdaExpr && !(this.parent instanceof MapFunc))
                return;

            let stage = this.stage;
            let beforeState = stage.toString();
            let droppedExp = node.toString();

            Resource.play('pop');
            node.stage.remove(node);
            node.droppedInClass = this.getClass();
            this.parent.swap(this, node); // put it back

            let afterState = stage.toString();
            Logger.log('placed-expr', {'before':beforeState, 'after':afterState, 'item':droppedExp });

            stage.saveState();
            Logger.log('state-save', afterState);

            // Blink red if total reduction is not possible with this config.
            /*var try_reduce = node.parent.reduceCompletely();
            if (try_reduce == node.parent || try_reduce === null) {
                Animate.blink(node.parent, 400, [1,0,0]);
            }*/

            // Blink blue if reduction is possible with this config.
            var try_reduce = node.parent.reduceCompletely();
            if (try_reduce != node.parent && try_reduce !== undefined) {
                Animate.blink(node.parent, 1000, [1,1,0], 1);
            }
        }
    }

    toString() { return '_'; }
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

    // graphicNode is undefined, don't use this
    // drawInternal(ctx, pos, boundingSize) {
    //     pos.x -= boundingSize.w / 1.2 - boundingSize.w;
    //     pos.y -= boundingSize.h / 1.14 - boundingSize.h; // aesthetic resizing
    //     boundingSize.w /= 1.2;
    //     this.graphicNode.stroke = this.stroke;
    //     this.graphicNode.color = this.color;
    //     this.graphicNode.shadowOffset = this.shadowOffset;
    //     this.graphicNode.drawInternal(ctx, pos, boundingSize);
    // }

    toString() { return '_'; }
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

        this.acceptedClasses = [ BooleanPrimitive, CompareExpr ];
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
        this.label = new TextExpr("xy");
        this.holes.push(this.label);
    }
    getClass() { return MissingChestExpression; }
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
        this.graphicNode = new DiceNumber(3);

        this.acceptedClasses = [ VarExpr, NumberExpr ];
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
