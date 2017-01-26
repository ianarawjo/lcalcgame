const SCALE_FACTOR = 0.33;

class RepeatLoopExpr extends Expression {
    constructor(times, body) {
        super([]);
        if (times instanceof MissingExpression) {
            times = new MissingNumberExpression();
        }
        if (body instanceof MissingExpression) {
            body = new InvisibleMissingExpression();
        }
        this.holes.push(times);
        this.holes.push(body);
        this.padding.right = 0;
        this.color = "orange";
    }

    get timesExpr() {
        return this.holes[0];
    }

    set timesExpr(expr) {
        this.holes[0] = expr;
    }

    get bodyExpr() {
        return this.holes[1];
    }

    set bodyExpr(expr) {
        this.holes[1] = expr;
    }

    get size() {
        var padding = this.padding;
        var width = 0;
        var height = 50;
        var sizes = this.getHoleSizes();
        var scale_x = this.scale.x;

        sizes.forEach((s) => {
            height = Math.max(height, s.h);
            width += s.w + padding.inner;
        });
        width += padding.right;
        height += padding.inner;
        return { w:width, h: height };
    }

    update() {
        super.update();
    }

    drawInternal(ctx, pos, boundingSize) {
        let leftWidth = this.timesExpr.absolutePos.x + this.timesExpr.absoluteSize.w + this.padding.inner / 2 - pos.x;
        let rightWidth = boundingSize.w - leftWidth + 1;
        let rightX = pos.x + leftWidth - 1;
        let bracketHeight = (boundingSize.h - this.bodyExpr.absoluteSize.h) / 2;
        let radius = this.radius*this.absoluteScale.x;
        let bracketRadius = bracketHeight;

        let offsetLineTo = (offset, x, y) => ctx.lineTo(x, y + offset);
        let offsetQuadraticCurveTo = (offset, cx, cy, x, y) => ctx.quadraticCurveTo(cx, cy + offset, x, y + offset);

        let draw = (offset) => {
            ctx.beginPath();
            ctx.moveTo(pos.x + radius + offset, pos.y + offset);
            offsetLineTo(offset, pos.x + boundingSize.w - bracketRadius, pos.y);
            offsetQuadraticCurveTo(offset, pos.x + boundingSize.w, pos.y,
                                 pos.x + boundingSize.w, pos.y + bracketRadius);
            offsetLineTo(offset, pos.x + leftWidth, pos.y + bracketRadius);
            offsetLineTo(offset, pos.x + leftWidth, pos.y + boundingSize.h - bracketRadius);
            offsetLineTo(offset, pos.x + boundingSize.w, pos.y + boundingSize.h - bracketRadius);
            offsetQuadraticCurveTo(offset, pos.x + boundingSize.w, pos.y + boundingSize.h,
                                 pos.x + boundingSize.w - bracketRadius, pos.y + boundingSize.h);
            offsetLineTo(offset, pos.x + radius, pos.y + boundingSize.h);
            offsetQuadraticCurveTo(offset, pos.x, pos.y + boundingSize.h,
                                 pos.x, pos.y + boundingSize.h - radius);
            offsetLineTo(offset, pos.x, pos.y + radius);
            offsetQuadraticCurveTo(offset, pos.x, pos.y,
                                 pos.x + radius, pos.y);
            ctx.closePath();
            if (this.stroke) {
                strokeWithOpacity(ctx, this.stroke.opacity);
            }
            ctx.fill();
        };

        setStrokeStyle(ctx, this.stroke);
        if (this.shadowOffset !== 0) {
            ctx.fillStyle = 'black';
            draw(this.shadowOffset);
        }
        ctx.fillStyle = this.color;
        draw(0);
    }

    performReduction() {
        if (!this.bodyExpr.isComplete()) {
            Animate.blink(this.bodyExpr, 1000, [1.0, 0.0, 0.0]);
            return Promise.reject("RepeatLoopExpr: missing body!");
        }

        this._cachedSize = this.size;
        this._animating = true;

        return this.performSubReduction(this.timesExpr).then((num) => {
            if (!(num instanceof NumberExpr) || !this.bodyExpr || this.bodyExpr instanceof MissingExpression) {
                Animate.blink(this.timesExpr, 1000, [1.0, 0.0, 0.0]);
                this._animating = false;
                return Promise.reject("RepeatLoopExpr incomplete!");
            }

            if (num.number <= 0) {
                Animate.poof(this);
                (this.parent || this.stage).swap(this, null);
                return null;
            }

            let seqClass = ExprManager.getClass('sequence');
            let body = [];
            for (let i = 0; i < num.number; i++) {
                body.push(this.bodyExpr.clone());
            }
            let result = new seqClass(...body);
            result.lockSubexpressions();
            result.update();
            (this.parent || this.stage).swap(this, result);
            return result;
        });
    }

    onmouseclick() {
        if (!this._animating) {
            this.performReduction();
        }
    }
}

function drawPointsAround(ctx, centerX, centerY, points, rotation) {
    ctx.beginPath();
    let first = true;
    for (let [x, y] of points) {
        let tx = centerX + x * Math.cos(rotation) - y * Math.sin(rotation);
        let ty = centerY + x * Math.sin(rotation) + y * Math.cos(rotation);
        if (first) {
            ctx.moveTo(tx, ty);
            first = false;
        }
        else {
            ctx.lineTo(tx, ty);
        }
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
}
