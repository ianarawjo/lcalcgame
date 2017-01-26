const SHRINK_DURATION = 800;
const EXPAND_DURATION = 400;

class _ChestImages {
    base(name) {
        if (name == "x") {
            return Resource.getImage("chest-wood-base");
        }
        return Resource.getImage("chest-metal-base");
    }

    lidClosed(name) {
        if (name == "x") {
            return Resource.getImage("chest-wood-lid-closed");
        }
        return Resource.getImage("chest-metal-lid-closed");
    }

    lidOpen(name) {
        if (name == "x") {
            return Resource.getImage("chest-wood-lid-open");
        }
        return Resource.getImage("chest-metal-lid-open");
    }
}

const ChestImages = new _ChestImages();

// parabolic lerp for y - makes it "arc" towards the final position
const arcLerp = (y0, y1, arc=120) => {
    let b = 4 * (Math.min(y0, y1) - arc) - y1 - 3 * y0;
    let c = y0;
    let a = y1 - b - c;
    let lerp = (src, tgt, elapsed, chain) => {
        if (chain.length == 2 && chain[0] == "pos" && chain[1] == "y") {
            return a*elapsed*elapsed + b*elapsed + c;
        }
        else {
            return (1.0 - elapsed) * src + elapsed * tgt;
        }
    };
    return lerp;
};

/// Variable nodes - separate from lambda variable expressions, for
/// now.
class VarExpr extends Expression {
    constructor(name) {
        super([]);
        this.name = name;
        // See MissingTypedExpression#constructor
        this.equivalentClasses = [VarExpr];
    }

    open(preview, animate=true) {
    }

    close() {
    }

    value() {
        if (this.canReduce()) {
            return this.getEnvironment().lookup(this.name).value();
        }
        return undefined;
    }

    canReduce() {
        return this.getEnvironment() && (this.parent || this.stage) && this.getEnvironment().lookup(this.name);
    }

    reduce() {
        let env = this.getEnvironment();
        if (!env) return this;

        let parent = this.parent ? this.parent : this.stage;
        if (!parent) return this;

        let value = env.lookup(this.name);
        if (!value) return this;

        return value;
    }

    onmouseclick() {
        this.performReduction();
    }
}

class LabeledVarExpr extends VarExpr {
    constructor(name) {
        super(name);
        this.label = new TextExpr(name);
        this.holes.push(this.label);
    }

    // Used by EnvironmentLambdaExpr
    // TODO: better name
    // TODO: tweak this animation (side arc?)
    animateReduction(display) {
        if (this.parent && this.parent instanceof AssignExpr && this.parent.variable == this) return null;

        return new Promise((resolve, reject) => {
            let value = this.reduce();
            if (this.reduce() != this) {
                let dummy = display.getExpr().clone();
                let stage = this.stage;
                stage.add(dummy);
                dummy.pos = display.getExpr().absolutePos;
                dummy.scale = display.getExpr().absoluteScale;

                Animate.tween(dummy, {
                    pos: this.absolutePos,
                    scale: { x: 1, y: 1 },
                }, 300).after(() => {
                    let clone = display.getExpr().clone();
                    (this.parent || this.stage).swap(this, clone);
                    if (this.locked) clone.lock();
                    stage.remove(dummy);
                    resolve();
                });
            }
            else {
                reject();
            }
        });
    }

    performReduction() {
        if (this.parent && this.parent instanceof AssignExpr && this.parent.variable == this) return null;

        let value = this.reduce();
        if (value != this) {
            value = value.clone();
            let parent = this.parent ? this.parent : this.stage;
            parent.swap(this, value);
            return value;
        }
        else {
            let wat = new TextExpr("?");
            this.stage.add(wat);
            wat.pos = this.label.absolutePos;
            Animate.tween(wat, {
                pos: {
                    x: wat.pos.x,
                    y: wat.pos.y - 50,
                },
            }, 250);
            window.setTimeout(() => {
                Animate.poof(wat);
                this.stage.remove(wat);
                this.stage.draw();
                this.stage.update();
            }, 500);
            return null;
        }
    }
}

class ChestVarExpr extends VarExpr {
    constructor(name) {
        super(name);
        // See MissingTypedExpression#constructor
        this.equivalentClasses = [ChestVarExpr];
        this._preview = null;
        this._animating = false;
    }

    get _superSize() {
        return super.size;
    }

    get size() {
        return { w:this._size.w, h:this._size.h };
    }

    open(preview, animate=true) {
        preview = preview.clone();
        preview.ignoreEvents = true;
        preview.scale = { x: 0.6, y: 0.6 };
        preview.anchor = { x: -0.1, y: 0.5 };
        this._preview = preview;
        if (this.holes.length > 0) {
            this.holes[0] = preview;
        }
        else {
            this.holes.push(preview);
        }
        this._opened = true;
    }

    close() {
        this._opened = false;
        this.removeChild(this.holes[0]);
        this._preview = null;
    }

    drawInternal(ctx, pos, boundingSize) {
        if (this._preview) {
            this._preview.pos = {
                x: 0,
                y: 5,
            };
        }

        if (this.parent && !this.ignoreEvents) {
            // Draw gray background analogous to other values
            ctx.fillStyle = "#777";
            roundRect(ctx,
                      pos.x, pos.y,
                      boundingSize.w, boundingSize.h,
                      6*this.absoluteScale.x, true, false, null);
        }

        let size = this._size;
        let scale = this.absoluteScale;
        let adjustedSize = this.absoluteSize;
        let offset = Math.max(2, (adjustedSize.w - size.w) / 2);
        ctx.drawImage(ChestImages.base(this.name), pos.x + offset, pos.y + offset, size.w * scale.x - 2 * offset, size.h * scale.y - 2 * offset);
        if (this._opened) {
            ctx.drawImage(ChestImages.lidOpen(this.name), pos.x + offset, pos.y + offset, size.w * scale.x - 2 * offset, size.h * scale.y - 2 * offset);
        }
        else {
            ctx.drawImage(ChestImages.lidClosed(this.name), pos.x + offset, pos.y + offset, size.w * scale.x - 2 * offset, size.h * scale.y - 2 * offset);
        }
        if (this.stroke) {
            ctx.save();
            ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
            ctx.globalCompositeOperation = 'screen';
            ctx.fillRect(pos.x, pos.y, boundingSize.w, boundingSize.h);
            ctx.restore();
        }
    }

    performReduction(animated=true) {
        if (this.parent && this.parent instanceof AssignExpr && this.parent.variable == this) return null;

        let value = this.reduce();
        if (value != this) {
            if (!animated) {
                let parent = this.parent ? this.parent : this.stage;
                parent.swap(this, value);
                return null;
            }
            this._animating = true;
            return this.animateReduction(value, true);
        }
        else if (animated) {
            this.animateReduction(new TextExpr("?"), false).then((wat) => {
                this._opened = false;
                window.setTimeout(() => {
                    Animate.poof(wat);
                    this.stage.remove(wat);
                    this.stage.draw();
                    this.stage.update();
                }, 500);
            });
            return null;
        }
        return null;
    }

    animateReduction(value, destroy) {
        let stage = this.stage;

        value = value.clone();
        stage.add(value);
        value.scale = { x: 0.1, y: 0.1 };
        value.update();
        value.pos = {
            x: this.absolutePos.x + 0.5 * this.size.w - 0.5 * value.absoluteSize.w,
            y: this.absolutePos.y + 30,
        };

        if (!this._opened) {
            Resource.play('chest-open');
            this._opened = true;
        }

        return new Promise((resolve, _reject) => {
            Resource.play('come-out');
            Animate.tween(value, {
                scale: { x: 1.0, y: 1.0 },
                pos: {
                    x: this.absolutePos.x + 0.5 * this.size.w - 0.5 * value.size.w,
                    y: this.absolutePos.y - value.size.h,
                },
            }, 500).after(() => {
                window.setTimeout(() => {
                    if (destroy) {
                        Animate.poof(this);
                        if (this.parent) {
                            stage.remove(value);
                            this.parent.swap(this, value);
                        }
                        else {
                            this.stage.remove(this);
                        }
                    }
                    stage.draw();
                    stage.update();
                    resolve(value);
                }, 200);
            });
        });
    }

    onmouseenter() {
        super.onmouseenter();
        document.querySelector('canvas').style.cursor = 'pointer';
    }

    onmouseleave() {
        super.onmouseleave();
        document.querySelector('canvas').style.cursor = 'auto';
    }

    onmouseclick() {
        if (!this._animating) {
            this.performReduction(true);
        }
    }
}

class JumpingChestVarExpr extends ChestVarExpr {
    performReduction(animated=true) {
        if (this.parent && this.parent instanceof AssignExpr && this.parent.variable == this) return null;

        if (!animated || !this.stage) {
            return super.performReduction(animated);
        }
        let chest = this.stage.environmentDisplay.getBinding(this.name);
        if (!chest) {
            return super.performReduction(animated);
        }

        Resource.play('chest-open');
        this._opened = true;
        this._animating = true;
        let value = chest.holes[0].clone();
        value.pos = chest.holes[0].absolutePos;
        this.stage.add(value);

        let target = {
            pos: this.absolutePos,
            scale: { x: 0.3, y: 0.3 },
        };
        let lerp = arcLerp(value.absolutePos.y, this.absolutePos.y);
        Resource.play('fall-to');
        return new Promise((resolve, _reject) => {
            Animate.tween(value, target, 600, (x) => x, true, lerp).after(() => {
                this.stage.remove(value);
                this.stage.draw();
                window.setTimeout(() => {
                    super.performReduction(true).then((value) => {
                        resolve(value);
                    });
                }, 100);
            });
        });
    }
}

class LabeledChestVarExpr extends ChestVarExpr {
    constructor(name) {
        super(name);
        // See MissingTypedExpression#constructor
        this.equivalentClasses = [LabeledChestVarExpr];
        this.label = new TextExpr(name);
        this.label.color = 'white';
        this.holes.push(this.label);
    }

    open(preview, animate=true) {
    }

    close() {
    }

    drawInternal(ctx, pos, boundingSize) {
        this.holes[0].pos = {
            x: this.size.w / 2 - this.holes[0].absoluteSize.w / 2,
            y: this.size.h / 2,
        };

        super.drawInternal(ctx, pos, boundingSize);
    }
}

class AssignExpr extends Expression {
    constructor(variable, value) {
        super([]);
        if (variable && !(variable instanceof MissingExpression)) {
            this.holes.push(variable);
        }
        else {
            let missing = new MissingChestExpression(new VarExpr("_"));
            missing.acceptedClasses = [VarExpr];
            this.holes.push(missing);
        }

        this.arrowLabel = new TextExpr("←");
        this.holes.push(this.arrowLabel);

        if (value) {
            this.holes.push(value);
        }
        else {
            this.holes.push(new MissingExpression(new Expression()));
        }

        this._animating = false;
    }

    get variable() {
        return this.holes[0] instanceof MissingExpression ? null : this.holes[0];
    }

    get value() {
        return this.holes[2] instanceof MissingExpression ? null : this.holes[2];
    }

    set value(expr) {
        this.holes[2] = expr;
    }

    canReduce() {
        return this.value && this.variable && (this.value.canReduce() || this.value.isValue()) && this.variable instanceof VarExpr;
    }

    reduce() {
        if (this.variable && this.value) {
            return this.value;
        }
        else {
            return this;
        }
    }

    animateJump() {
        return new Promise((resolve, reject) => {
            let target = {
                scale: { x: 0.3, y: 0.3 },
                pos: { x: this.variable.pos.x, y: this.variable.pos.y },
            };


            // quadratic lerp for pos.y - makes it "arc" towards the variable
            let lerp = arcLerp(this.value.pos.y, this.variable.pos.y);
            let parent = this.parent || this.stage;


            Animate.tween(this.value, target, 500, (x) => x, true, lerp).after(() => {
                Animate.poof(this);
                parent.swap(this, null);
                resolve();
            });
        });
    }

    setupAnimation() {
        this.variable._opened = true;

        // Prevent background on GraphicValueExpr from being drawn
        this.value.ignoreEvents = true;

        // Keep a copy of the original value before we start
        // messing with it, to update the environment afterwards
        this._actualValue = this.value.clone();
    }

    finishReduction() {
        this.getEnvironment().update(this.variable.name, this._actualValue);
        this.stage.environmentDisplay.update();
        let binding = this.stage.environmentDisplay.getBinding(this.variable.name);
        Animate.blink(binding.getExpr());
        this.stage.getNodesWithClass(EnvironmentLambdaExpr).forEach((lambda) => {
            lambda.update();
            lambda.environmentDisplay.highlight(this.variable.name);
        });
        this.stage.draw();
    }

    animateReduction() {
        this.setupAnimation();

        let environment = this.getEnvironment();
        let callback = null;
        if (environment == this.stage.environment && this.stage.environmentDisplay) {
            callback = this.stage.environmentDisplay.prepareAssign(this.variable.name);
        }

        let stage = this.stage;
        let afterAssign = new Promise((resolve, _reject) => {
            let finish = () => {
                // Need to save the stage sometimes - there's a race
                // condition where sometimes the expr is removed from
                // the stage before the assignment happens
                this.stage = stage;
                this.finishReduction();
                resolve();
            };

            if (callback) {
                callback.after(finish);
            }
            else {
                window.setTimeout(finish, 500);
            }
        });

        return Promise.all([afterAssign, this.animateJump()]);
    }

    performReduction(animated=true) {
        // The side-effect actually happens here. reduce() is called
        // multiple times as a 'canReduce', and we don't want any
        // update to happen multiple times.
        if (!this.canReduce()) {
            if (this.value && this.variable && !this.value.canReduce()) {
                // Try and play any animation anyways to hint at why
                // the value can't reduce.
                let result = this.value.performReduction();
                if (result instanceof Promise) {
                    return result.then(() => {
                        return Promise.reject("AssignExpr: RHS cannot reduce");
                    });
                }
                return Promise.reject("AssignExpr: RHS cannot reduce");
            }
            return Promise.reject("AssignExpr: incomplete");
        }

        if (!animated) {
            this.value.performReduction(false);
            let value = this.value.clone();
            this.getEnvironment().update(this.variable.name, value);
            this.stage.environmentDisplay.update();
            this.stage.draw();
            return null;
        }

        this._animating = true;

        return this.performSubReduction(this.value, true).then((value) => {
            this.value = value;
            this.update();
            return this.animateReduction();
        });
    }

    reduceCompletely() {
        if (this.value) {
            this.value.reduceCompletely();
        }

        if (this.variable && this.value) {
            // Return non-undefined non-this value so that when the
            // user drops everything in, MissingExpression#ondropped
            // will make this expr blink
            return null;
        }
        else {
            return this;
        }
    }

    onmouseclick() {
        if (!this._animating) {
            this.performReduction();
        }
    }
}

class JumpingAssignExpr extends AssignExpr {
    constructor(variable, value) {
        super(variable, value);
    }

    animateReduction() {
        this.setupAnimation();

        let environment = this.getEnvironment();
        return this.animateJump().then(() => {
            return new Promise((resolve, _reject) => {
                if (environment != this.stage.environment) {
                    Animate.poof(this);
                    this.finishReduction();
                    parent.swap(this, null);
                    resolve();
                    return;
                }

                let chest = this.stage.environmentDisplay.getBinding(this.variable.name);
                let value = null;
                let targetPos = null;
                if (chest) {
                    targetPos = chest.absolutePos;
                    value = this.value.clone();
                    this.stage.environmentDisplay
                        .prepareAssign(this.variable.name);
                }
                else {
                    if (Object.keys(this.stage.environmentDisplay.bindings).length === 0) {
                        targetPos = this.stage.environmentDisplay.absolutePos;
                    }
                    else {
                        let contents = this.stage.environmentDisplay.contents;
                        let last = contents[contents.length - 1];
                        targetPos = addPos(last.absolutePos, { x: 0, y: last.absoluteSize.h + this.stage.environmentDisplay.padding });
                    }

                    value = new (ExprManager.getClass('reference_display'))(this.variable.name, this.value.clone());
                }
                this.value.scale = { x: 0, y: 0 };
                this.stage.add(value);
                value.pos = this.variable.absolutePos;
                value.scale = { x: 0.3, y: 0.3 };
                let target = {
                    pos: targetPos,
                    scale: { x: 0.7, y: 0.7 },
                };

                let lerp = arcLerp(value.absolutePos.y, targetPos.y, -150);
                Resource.play('fly-to');
                Animate.tween(value, target, 600, (x) => x, true, lerp).after(() => {
                    this.stage.remove(value);
                    this.finishReduction();
                    this.stage.draw();
                });
            });
        });
    }
}

class EqualsAssignExpr extends AssignExpr {
    constructor(variable, value) {
        super(variable, value);
        this.arrowLabel.text = "=";
    }
}
