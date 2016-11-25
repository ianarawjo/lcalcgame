const SCALE_FACTOR = 0.33;

class RepeatLoopExpr extends Expression {
    constructor(times, body) {
        super([times, body]);
        this.rotationAngle = 0;
    }

    // draw(ctx) {
    // }

    get timesExpr() {
        return this.holes[0];
    }

    get bodyExpr() {
        return this.holes[1];
    }

    get size() {
        let subSize = this.timesExpr.size;
        return {
            w: subSize.w * 2.25,
            h: subSize.h * 2,
        };
    }

    update() {
        super.update();
        let centerX = this.size.w / 2;
        let centerY = this.size.h / 2;
        let innerR = 0.1 * this.size.h / 2;
        if (this.timesExpr) {
            this.timesExpr.pos = {
                x: centerX - this.timesExpr.size.w - innerR,
                y: centerY,
            };
        }
        if (this.bodyExpr) {
            this.bodyExpr.pos = {
                x: centerX + 2 * innerR,
                y: centerY,
            };
        }
    }

    drawInternal(ctx, pos, boundingSize) {
        super.drawInternal(ctx, pos, boundingSize);

        let centerX = pos.x + boundingSize.w / 2;
        let centerY = pos.y + boundingSize.h / 2;
        let outerR = 0.9 * boundingSize.h / 2;
        let innerR = 0.1 * boundingSize.h / 2;

        ctx.lineWidth = 1.0;
        ctx.beginPath();
        if (this.timesExpr && this.timesExpr.number && this.timesExpr.number > 0) {
            ctx.strokeStyle = 'blue';
            this.timesExpr.stroke = {
                color: 'blue',
                width: 2,
            };
        }
        else {
            ctx.strokeStyle = 'black';
        }
        ctx.arc(centerX, centerY, outerR, 0, Math.PI * 2);
        ctx.closePath();
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(centerX, centerY, innerR, 0, Math.PI * 2);
        ctx.stroke();

        let spokes = 24;
        for (let i = 0; i < spokes; i++) {
            let theta = i * 2 * Math.PI / spokes + this.rotationAngle;
            ctx.moveTo(centerX + innerR * Math.cos(theta), centerY + innerR * Math.sin(theta));
            ctx.lineTo(centerX + outerR * Math.cos(theta), centerY + outerR * Math.sin(theta));
            ctx.stroke();
        }
    }

    performReduction() {
        this._animating = true;

        let working = false;
        let stopped = false;
        let rotate = () => {
            if (working) this.rotationAngle += Math.PI / 2 / 60.0;
            this.stage.draw();
            if (!stopped) window.requestAnimationFrame(rotate);
        };
        rotate();

        return this.performSubReduction(this.timesExpr).then((num) => {
            if (!(num instanceof NumberExpr) || !this.bodyExpr || this.bodyExpr instanceof MissingExpression) {
                stopped = true;
                this._animating = false;
                return Promise.reject("RepeatLoopExpr incomplete!");
            }
            let body = this.bodyExpr.clone();
            let times = this.timesExpr.number;

            let nextStep = () => {
                if (times > 0) {
                    working = true;
                    return this.performSubReduction(this.bodyExpr).then(() => {
                        working = false;

                        this.swap(this.timesExpr, new NumberExpr(--times));
                        this.timesExpr.lock();

                        this.holes[1] = body.clone();
                        this.holes[1].parent = this;
                        this.holes[1].stage = this.stage;
                        this.update();

                        return new Promise((resolve, reject) => {
                            window.setTimeout(() => {
                                let r = nextStep();
                                if (r instanceof Promise) r.then(resolve, reject);
                                else resolve(r);
                            }, 500);
                        });
                    });
                }
                else {
                    stopped = true;
                    Animate.poof(this);
                    (this.parent || this.stage).swap(this, null);
                    return null;
                }
            };
            return nextStep();
        });
    }

    onmouseclick() {
        if (!this._animating) {
            this.performReduction();
        }
    }
}