



class BooleanPrimitive extends Expression {
    constructor(name) {
        super();
        var text = new TextExpr(name);
        text.pos = { x:0, y:0 };
        text.anchor = { x:-0.1, y:1.5 }; // TODO: Fix this bug.
        this.color = "HotPink";
        this.addArg(text);
    }
    reduce() { return this; }
    reduceCompletely() { return this; }

    isValue() { return true; }

    drawInternal(ctx, pos, boundingSize) {
        ctx.fillStyle = 'black';
        setStrokeStyle(ctx, this.stroke);
        if (this.shadowOffset !== 0) {
            hexaRect(ctx,
                      pos.x, pos.y+this.shadowOffset,
                      boundingSize.w, boundingSize.h,
                      true, this.stroke ? true : false,
                      this.stroke ? this.stroke.opacity : null);
        }
        ctx.fillStyle = this.color;
        hexaRect(ctx,
                  pos.x, pos.y,
                  boundingSize.w, boundingSize.h,
                  true, this.stroke ? true : false,
                  this.stroke ? this.stroke.opacity : null);
    }
}
class TrueExpr extends BooleanPrimitive {
    constructor() {
        super('true');
    }
    value() { return true; }
    toString() { return 'true'; }
}
class FalseExpr extends BooleanPrimitive {
    constructor() {
        super('false');
    }
    value() { return false; }
    toString() { return 'false'; }
}

/** Faded bool variants. */
class KeyTrueExpr extends TrueExpr {
    constructor() {
        super();
        this.holes = [];
        this.children = [];

        var key = new ImageExpr(0, 0, 56, 28, 'key-icon');
        key.lock();
        this.addArg(key);
        this.graphicNode = key;
    }
    onmouseclick(pos) {

        // Clicking on the key in a lock (if statement) will act as if they clicked the if statement.
        if (this.parent && this.parent instanceof IfStatement && this.parent.cond == this)
            this.parent.onmouseclick(pos);
        else
            super.onmouseclick(pos);
    }
}
class KeyFalseExpr extends FalseExpr {
    constructor() {
        super();
        this.holes = [];
        this.children = [];

        var key = new ImageExpr(0, 0, 56, 34, 'broken-key-icon');
        key.lock();
        this.addArg(key);
        this.graphicNode = key;
    }
    onmouseclick(pos) {

        // Clicking on the key in a lock (if statement) will act as if they clicked the if statement.
        if (this.parent && this.parent instanceof IfStatement && this.parent.cond == this)
            this.parent.onmouseclick(pos);
        else
            super.onmouseclick(pos);
    }
}
