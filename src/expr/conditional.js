








// An if statement.
class IfStatement extends Expression {
    constructor(cond, branch) {

        var question_mark = new TextExpr('?');
        var else_text = new TextExpr(': null');
        question_mark.color = else_text.color = 'black';
        super([cond, question_mark, branch, else_text]);

        // OLD -- if ... then ...
        /*var if_text = new TextExpr('if');
        var then_text = new TextExpr('then');
        if_text.color = 'black';
        then_text.color = 'black';
        super([if_text, cond, then_text, branch]);*/
        this.color = 'LightBlue';
    }

    get cond() { return this.holes[0]; }
    get branch() { return this.holes[2]; }
    get emptyExpr() { return this.parent ? null : new FadedNullExpr(); }
    get constructorArgs() { return [this.cond.clone(), this.branch.clone()]; }

    onmouseclick(pos) {
        this.performReduction();
    }

    reduce() {
        if (!this.cond || !this.branch) return this; // irreducible
        var cond_val = this.cond.value();
        if (cond_val === true && this.branch instanceof MissingExpression) return this; // true can't reduce to nothing but false can.
        if (cond_val === true)          return this.branch; // return the inner branch
        else if (cond_val === false)    return this.emptyExpr; // disappear
        else                            return this; // something's not reducable...
    }

    playJimmyAnimation(onComplete) {
        Resource.play('key-jiggle');
        this.opacity = 1.0;
        Animate.tween(this, { 'opacity':0 }, 500).after(onComplete);
        //Animate.wait(Resource.getAudio('key-jiggle').duration * 1000).after(onComplete);
    }
    playUnlockAnimation(onComplete) {
        Resource.play('key-unlock');
        Animate.wait(150).after(onComplete);
    }

    canReduce() {
        return this.cond && (this.cond.canReduce() || this.cond.isValue()) &&
            this.branch && (this.branch.canReduce() || this.branch.isValue());
    }

    performReduction(animated=true) {
        if (this.cond && this.cond.canReduce()) {
            return this.performSubReduction(this.cond, animated).then(() => {
                return this.performReduction();
            });
        }
        else if (this.cond && !this.cond.isValue() && !this.cond.canReduce()) {
            // Try and play any animation anyways
            this.cond.performReduction();
            return null;
        }

        if (this.branch && this.branch.canReduce()) {
            return this.performSubReduction(this.branch, animated).then(() => {
                return this.performReduction();
            });
        }

        if (this.branch && (!this.branch.isValue())) {
            this.branch.performReduction();
            return Promise.reject("IfExpr: branch is not a value and not reducible");
        }

        return new Promise((resolve, reject) => {
            var reduction = this.reduce();
            if (reduction != this) {

                let stage = this.stage;
                let afterEffects = () => {
                    this.ignoreEvents = false;
                    let rtn = super.performReduction();
                    stage.update();
                    stage.draw();
                    if (rtn === null) {
                        rtn = new FadedNullExpr();
                    }
                    resolve(rtn);
                    return rtn;
                };

                if (reduction === null) {
                    this.playJimmyAnimation(afterEffects);
                }
                else if (reduction instanceof FadedNullExpr) {
                    let red = afterEffects();
                    red.ignoreEvents = true; // don't let them move a null.
                    Resource.play('pop');
                    Animate.blink(red, 1000, [1,1,1], 0.4).after(() => {
                        red.poof();
                    });
                    //this.playJimmyAnimation(afterEffects);
                }
                else {
                    this.playUnlockAnimation(afterEffects);
                }

                this.ignoreEvents = true;
                //var shatter = new ShatterExpressionEffect(this);
                //shatter.run(stage, (() => {
                //    super.performReduction();
                //}).bind(this));
            }
            else {
                reject();
            }
        });
    }

    value() {
        return undefined;
    }
    toString() {
        return '(if ' + this.cond.toString() + ' ' + this.branch.toString() + ')';
    }
}

// A simpler graphical form of if.
class ArrowIfStatement extends IfStatement {
    constructor(cond, branch) {
        super(cond, branch);
        var arrow = new TextExpr('→');
        arrow.color = 'black';
        this.holes = [ cond, arrow, branch ];
    }
    get emptyExpr() { return null; }
    get cond() { return this.holes[0]; }
    get branch() { return this.holes[2]; }
}

class IfElseStatement extends IfStatement {
    constructor(cond, branch, elseBranch) {
        super(cond, branch);
        var txt = new TextExpr('else');
        txt.color = 'black';
        this.addArg(txt);
        this.addArg(elseBranch);
    }
    get elseBranch() { return this.holes[4]; }
    get constructorArgs() { return [this.cond.clone(), this.branch.clone(), this.elseBranch.clone()]; }

    reduce() {
        if (!this.cond || !this.branch || !this.elseBranch) return this; // irreducible
        var cond_val = this.cond.value();
        console.log(this.cond, cond_val);
        if (cond_val === true)          return this.branch; // return the inner branch
        else if (cond_val === false)    return this.elseBranch; // disappear
        else                            return this; // something's not reducable...
    }

    toString() {
        return '(if ' + this.cond.toString() + ' ' + this.branch.toString() + ' ' + this.elseBranch.toString() + ')';
    }
}

// Lock and key metaphor for if.
class LockIfStatement extends IfStatement {
    constructor(cond, branch) {
        super(cond, branch);
        this.holes = [ cond, branch ];

        var bluebg = new mag.RoundedRect(0, 0, 25, 25);
        bluebg.color = "#2484f5";
        this._bg = bluebg;

        var top = new mag.ImageRect(0, 0, 112/2.0, 74/2.0, 'lock-top-locked');
        this._top = top;

        var shinewrap = new mag.PatternRect(0, 0, 24, 100, 'shinewrap');
        shinewrap.opacity = 0.8;
        this._shinewrap = shinewrap;
    }
    get emptyExpr() { return null; }
    get cond() { return this.holes[0]; }
    get branch() { return this.holes[1]; }

    playJimmyAnimation(onComplete) {
        Resource.play('key-jiggle');
        Animate.wait(Resource.getAudio('key-jiggle').duration * 1000).after(onComplete);
        if(this.stage) this.stage.draw();

        let pos = this.pos;
        Animate.tween(this, { 'pos':{x:pos.x+16, y:pos.y} }, 100 ).after(() => {
            Animate.tween(this, { 'pos':{x:pos.x-16, y:pos.y} }, 100 ).after(() => {
                Animate.tween(this, { 'pos':{x:pos.x, y:pos.y} }, 100 ).after(() => {
                    Animate.wait(300).after(() => {
                        this.opacity = 1.0;
                        this._shinewrap.opacity = 0;
                        Animate.tween(this, { 'opacity':0 }, 100 ).after(() => {
                            this.opacity = 0;
                            if (this.stage) {
                                let stage = this.stage;
                                stage.remove(this);
                                stage.draw();
                            }
                        });
                    });
                });
            });
        });
    }
    playUnlockAnimation(onComplete) {
        Resource.play('key-unlock');
        Animate.wait(600).after(onComplete);

        Animate.wait(200).after(() => {
            this._top.image = 'lock-top-unlocked';
            this._top.size = { w:this._top.size.w, h:128/2 };
            this._shinewrap.opacity = 0;
            if(this.stage) this.stage.draw();
        });
    }

    drawInternal(ctx, pos, boundingSize) {
        super.drawInternal(ctx, pos, boundingSize);

        let condsz = this.cond.absoluteSize;

        let bgsz = { w:condsz.w+14, h:condsz.h+16 };
        let bgpos = addPos(pos, {x:-(bgsz.w-condsz.w)/2.0+this.cond.pos.x, y:-(bgsz.h-condsz.h)/2.0+3});
        let topsz = this._top.size;
        let wrapsz = { w:boundingSize.w - condsz.w, h:boundingSize.h };
        let wrappos = { x:bgpos.x+bgsz.w, y:pos.y };

        this._shinewrap.size = wrapsz;
        this._shinewrap.pos = wrappos;

        this._bg.stroke = this.stroke;

        this._bg.drawInternal( ctx, bgpos, bgsz );
        this._top.drawInternal( ctx, addPos(bgpos, {x:bgsz.w / 2.0 - topsz.w/2.0, y:-topsz.h } ), topsz );
    }
    drawInternalAfterChildren(ctx, pos, boundingSize) {

        if ((!this.opacity || this.opacity > 0) && this._shinewrap.opacity > 0 && !(this.branch instanceof MissingExpression)) {
            ctx.save();
            roundRect(ctx,
                      pos.x, pos.y,
                      boundingSize.w, boundingSize.h,
                      this.radius*this.absoluteScale.x, false, false);
            ctx.clip();

            ctx.globalCompositeOperation = "screen";
            ctx.globalAlpha = this._shinewrap.opacity;
            this._shinewrap.drawInternal( ctx, this._shinewrap.pos, this._shinewrap.size );
            ctx.restore();
        }
    }
}
class InlineLockIfStatement extends IfStatement {
    constructor(cond, branch) {
        super(cond, branch);
        var lock = new ImageExpr(0, 0, 56, 56, 'lock-icon');
        lock.lock();
        this.holes = [ cond, lock, branch ];
    }

    get emptyExpr() { return null; }
    get cond() { return this.holes[0]; }
    get branch() { return this.holes[2]; }

    playJimmyAnimation(onComplete) {
        super.playJimmyAnimation(onComplete);

        this.opacity = 1.0;
        Animate.tween(this, { 'opacity':0 }, 100 ).after(() => {
            this.opacity = 0;
            if (this.stage) {
                let stage = this.stage;
                stage.remove(this);
                stage.draw();
            }
        });
    }
    playUnlockAnimation(onComplete) {
        this.holes[1].image = 'lock-icon-unlocked';
        super.playUnlockAnimation(onComplete);
    }
}
