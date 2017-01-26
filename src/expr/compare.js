



//



// A boolean compare function like ==, !=, >, >=, <=, <.
class CompareExpr extends Expression {
    static operatorMap() {
        return { '==':'is', '!=':'is not' };
    }
    static textForFuncName(fname) {
        var map = CompareExpr.operatorMap();
        if (fname in map) return map[fname];
        else              return fname;
    }
    constructor(b1, b2, compareFuncName='==') {
        var compare_text = new TextExpr(CompareExpr.textForFuncName(compareFuncName));
        compare_text.color = 'black';
        super([b1, compare_text, b2]);
        this.funcName = compareFuncName;
        this.color = "HotPink";
        this.padding = { left:20, inner:10, right:30 };
    }
    get constructorArgs() { return [this.holes[0].clone(), this.holes[2].clone(), this.funcName]; }
    get leftExpr() { return this.holes[0]; }
    get rightExpr() { return this.holes[2]; }
    onmouseclick(pos) {
        console.log('Expressions are equal: ', this.compare());
        if (!this._animating) {
            this.performReduction();
        }
    }
    reduce() {
        var cmp = this.compare();
        if (cmp === true)       return new (ExprManager.getClass('true'))();
        else if (cmp === false) return new (ExprManager.getClass('false'))();
        else                    return this;
    }

    canReduce() {
        return this.leftExpr && this.rightExpr &&
            (this.leftExpr.canReduce() || this.leftExpr.isValue()) &&
            (this.rightExpr.canReduce() || this.rightExpr.isValue());
    }

    performReduction(animated=true) {
        if (this.leftExpr && this.rightExpr && this.leftExpr instanceof VarExpr && !this._animating) {
            let before = this.leftExpr;
            this._animating = true;
            return this.performSubReduction(this.leftExpr, true).then(() => {
                this._animating = false;
                if (this.leftExpr != before) {
                    return this.performReduction();
                }
            });
        }

        if (this.leftExpr && this.rightExpr && this.rightExpr instanceof VarExpr && !this._animating) {
            this._animating = true;
            let before = this.rightExpr;
            return this.performSubReduction(this.rightExpr, true).then(() => {
                this._animating = false;
                if (this.rightExpr != before) {
                    return this.performReduction();
                }
            });
        }

        if (this.reduce() != this) {
            if (animated) {
                return new Promise((resolve, _reject) => {
                    var shatter = new ShatterExpressionEffect(this);
                    shatter.run(stage, (() => {
                        this.ignoreEvents = false;
                        resolve(super.performReduction());
                    }).bind(this));
                    this.ignoreEvents = true;
                });
            }
            else super.performReduction();
        }
        return null;
    }
    compare() {
        if (this.funcName === '==') {
            if (!this.rightExpr || !this.leftExpr) return undefined;

            var lval = this.leftExpr.value();
            var rval = this.rightExpr.value();

            // Variables that are equal reduce to TRUE, regardless of whether they are bound!!
            if (!lval && !rval && this.leftExpr instanceof LambdaVarExpr && this.rightExpr instanceof LambdaVarExpr)
                return this.leftExpr.name === this.rightExpr.name;

            //console.log('leftexpr', this.leftExpr.constructor.name, this.leftExpr instanceof LambdaVarExpr, lval);
            //console.log('rightexpr', this.rightExpr.constructor.name, rval);

            if (lval === undefined || rval === undefined)
                return undefined;
            else if (Array.isArray(lval) && Array.isArray(rval))
                return setCompare(lval, rval, (e, f) => (e.toString() === f.toString()));
            else
                return lval === rval;
        } else if (this.funcName === '!=') {
            return this.leftExpr.value() !== this.rightExpr.value();
        } else {
            console.warn('Compare function "' + this.funcName + '" not implemented.');
            return false;
        }
    }

    drawInternal(ctx, pos, boundingSize) {
        ctx.fillStyle = 'black';
        setStrokeStyle(ctx, this.stroke);
        if (this.shadowOffset !== 0) {
            hexaRect( ctx,
                      pos.x, pos.y+this.shadowOffset,
                      boundingSize.w, boundingSize.h,
                      true, this.stroke ? true : false,
                      this.stroke ? this.stroke.opacity : null);
        }
        ctx.fillStyle = this.color;
        hexaRect( ctx,
                  pos.x, pos.y,
                  boundingSize.w, boundingSize.h,
                  true, this.stroke ? true : false,
                  this.stroke ? this.stroke.opacity : null);
    }

    toString() {
        return '(' + this.funcName + ' ' + this.leftExpr.toString() + ' ' + this.rightExpr.toString() + ')';
    }
}

/** Faded compare variants. */
class FadedCompareExpr extends CompareExpr {
    constructor(b1, b2, compareFuncName='==') {
        super(b1, b2, compareFuncName);
        this.holes[1].text = compareFuncName;
    }
}

class MirrorCompareExpr extends CompareExpr {
    constructor(b1, b2, compareFuncName='==') {
        super(b1, b2, compareFuncName);

        this.children = [];
        this.holes = [];
        this.padding = { left:20, inner:0, right:40 };

        this.addArg(b1);

        // Mirror graphic
        var mirror = new MirrorExpr(0, 0, 86, 86);
        mirror.exprInMirror = b2.clone();
        this.addArg(mirror);

        this.addArg(b2);
    }
    get constructorArgs() { return [this.holes[0].clone(), this.holes[2].clone(), this.funcName]; }
    get leftExpr() { return this.holes[0]; }
    get mirror() { return this.holes[1]; }
    get rightExpr() { return this.holes[2]; }
    expressionToMirror() {
        let isMirrorable = (expr) => (!(!expr || expr instanceof LambdaVarExpr || expr instanceof MissingExpression));
        if (isMirrorable(this.leftExpr))
            return this.leftExpr.clone();
        else if (isMirrorable(this.rightExpr))
            return this.rightExpr.clone();
        else
            return null;
    }
    update() {
        super.update();
        if (this.reduce() != this) {
            this.mirror.exprInMirror = new (ExprManager.getClass('true'))().graphicNode;
            this.mirror.broken = !this.compare();
        } else {
            this.mirror.exprInMirror = this.expressionToMirror();
            this.mirror.broken = false;
        }
    }

    // Animation effects
    performReduction() {
        if (!this.isReducing && this.reduce() != this) {
            var stage = this.stage;
            var shatter = new MirrorShatterEffect(this.mirror);
            shatter.run(stage, (() => {
                this.ignoreEvents = false;
                super.performReduction(false);
            }).bind(this));
            this.ignoreEvents = true;
            this.isReducing = true;
        }
    }
}
