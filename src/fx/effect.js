// Node disappears and is replaced by a firework-like particle explosion.
class SplosionEffect {
    static run(node) {

        if (!node.stage) {
            console.warn('@ SmashsplodeEffect: Node is not member of stage.');
            return;
        }

        // Store stage context.
        var stage = node.stage;
        var parts = [];

        // Remove node from stage.
        stage.remove(node);

        // Store node center pos.
        var center = node.centerPos();

        // Create particles at center.
        const PARTICLE_COUNT = 20;
        const PARTICLE_MIN_RAD = 2;
        const PARTICLE_MAX_RAD = 12;
        const EXPLOSION_RAD = 100;
        for (let i = 0; i < PARTICLE_COUNT; i++) {

            // Create individual particle + add each to the stage.
            let part = new mag.Circle(center.x, center.y,
                Math.floor(PARTICLE_MIN_RAD + (PARTICLE_MAX_RAD - PARTICLE_MIN_RAD) * Math.random()));
            part.color = 'gold';
            part.shadowOffset = 0;
            parts.push(part);
            stage.add(part);

            // 'Explode' outward (move particle to outer edge of explosion radius).
            let theta = Math.random() * Math.PI * 2;
            let rad = EXPLOSION_RAD * (Math.random() / 2.0 + 0.5);
            let targetPos = addPos(part.pos, { x:rad*Math.cos(theta), y:rad*Math.sin(theta) } );
            Animate.tween(part, { 'pos':targetPos, 'scale':{x:0.0001, y:0.0001} }, 400, (elapsed) => Math.pow(elapsed, 0.5), false).after(() => {
                stage.remove(part); // self-delete for cleanup
                stage.draw();
            });
        }

        Animate.wait(400).after(() => {
            parts.forEach((p) => stage.remove(p));
            parts = null;
            stage.draw();
        });

        Animate.drawUntil(stage, () => {
            return parts === null;
        });
    }
}

class SparkleTrigger {
    static run(node, onTrigger) {

        if (!node.stage) {
            console.warn('@ SparkleTrigger: Node is not member of stage.');
            return;
        }

        // Store stage context.
        var stage = node.stage;
        node.update();

        // Store node center pos.
        var center = node.centerPos();
        var size = node.absoluteSize;
        if (size.w === 0) size = { w:50, h:50 };
        var triggered = false;
        var parts = [];
        var activeparts = 0;
        var cancelRenderLoop = false;

        // Create a bunch of floaty particles.
        const PARTICLE_COUNT = Math.min(100, 30 * (size.w / 50.0));
        const PARTICLE_MIN_RAD = 2;
        const PARTICLE_MAX_RAD = 8;
        for (let i = 0; i < PARTICLE_COUNT; i++) {

            let part = new mag.Star(center.x, center.y,
                                Math.floor(PARTICLE_MIN_RAD + (PARTICLE_MAX_RAD - PARTICLE_MIN_RAD) * Math.random()));
            parts.push(part);
            //part.ignoreEvents = true;

            let ghostySparkle = () => {
                if (triggered) return;

                size = node.absoluteSize;
                if (size.w === 0) size = { w:50, h:50 };
                
                let vec = { x:(Math.random() - 0.5) * size.w * 1.2,
                            y:(Math.random() - 0.5) * size.h * 1.2 - part.size.h / 2.0 };

                //part.pos = addPos(center, vec);
                part.pos = addPos(node.centerPos(), vec);
                part.color = "#0F0";
                part.shadowOffset = 0;
                part.opacity = 1.0;
                part.onmouseenter = (pos) => {
                    if (!triggered) {
                        onTrigger();
                        triggered = true;
                    }
                };
                stage.add(part);
                activeparts++;
                part.anim = Animate.tween(part, { opacity:0.0 }, Math.max(3000 * Math.random(), 800), (elapsed)=>elapsed, false).after(() => {
                    stage.remove(part);
                    activeparts--;
                    if(!triggered) ghostySparkle();
                    else if (activeparts === 0) cancelRenderLoop = true;
                });
            };
            ghostySparkle();

            // Whooosh!
            /*let flyFromCenter = () => {
                part.pos = clonePos(center);
                part.color = "blue";
                part.shadowOffset = 0;
                part.opacity = 1.0;
                stage.add(part);
                Animate.tween(part, { pos:addPos(center, rescalePos(vec, 200)), opacity:0.0 }, 400).after(() => {
                    stage.remove(part);
                    flyFromCenter();
                });
            };
            flyFromCenter();*/
        }

        Animate.drawUntil(stage, () => {
            return cancelRenderLoop;
        });

    }
}

class ExpressionEffect extends mag.RoundedRect {}
class ShatterExpressionEffect extends ExpressionEffect {
    constructor(roundRectToShatter) {
        let size = roundRectToShatter.absoluteSize;
        let pos = roundRectToShatter.upperLeftPos(roundRectToShatter.absolutePos, size);
        //size.w -= 75;
        super(pos.x + size.w/2.0, pos.y + size.h/2.0, size.w, size.h, roundRectToShatter.radius);
        this.size = size;

        this.opacity = 0.0;
        this.stroke = { color:'white', lineWidth:3 };
        this.color = 'white';
        this._effectParent = roundRectToShatter;

        var _this = this;
        this.run = (stage, afterFadeCb, afterShatterCb) => {
            _this.anchor = { x:0.5, y:0.5 };
            _this.fadeCb = afterFadeCb;
            _this.shatterCb = afterShatterCb;
            stage.add(_this);
            _this.fadeIn()
                .then(_this.shatter.bind(this))
                .then(() => {

                    // Removes self after completion.
                    let stage = (_this.parent || _this.stage);
                    stage.remove(_this);
                    stage.update();
                    stage.draw();

            });
        };
    }
    get constructorArgs() { return [this._effectParent.clone()]; }

    fadeIn() {
        var _this = this;
        this.opacity = 0.0;
        return new Promise(function(resolve, reject) {
            Animate.tween(_this, { 'opacity':1.0 }, 400, (elapsed) => Math.pow(elapsed, 0.4)).after(() => {
                if (_this.fadeCb) _this.fadeCb();
                resolve();
            });
            Resource.play('heatup');
        });
    }
    shatter() {
        var _this = this;
        _this.stroke = { color:'white', lineWidth:3 };
        return new Promise(function(resolve, reject) {
            Animate.tween(_this, { 'opacity':0.0, 'scale':{x:1.2, y:1.4} }, 300, (elapsed) => Math.pow(elapsed, 0.4)).after(() => {
                if (_this.shatterCb) _this.shatterCb();
                resolve();
            });
            Resource.play('shatter');
        });
    }

    toString() {
        return '';
    }
}

class MirrorShatterEffect extends ImageExpr {
    constructor(mirrorToShatter) {
        let shouldBreak = mirrorToShatter.broken;
        let size = { w:86, h:86 };
        let pos = mirrorToShatter.upperLeftPos(mirrorToShatter.absolutePos, size);
        pos = addPos(pos, { x:size.w/2.0-4, y:size.h/2.0-11 });
        super(pos.x, pos.y, size.w, size.h,
             (shouldBreak ? 'mirror-icon-fade-false' : 'mirror-icon-fade-true'));

        //this.size = size;
        this.pos = pos;
        this.scale = mirrorToShatter.absoluteScale;
        this.opacity = 0.0;
        this.stroke = { color:'white', lineWidth:3 };
        this.color = 'white';
        this._effectParent = mirrorToShatter;

        var _this = this;
        this.run = (stage, afterFadeCb, afterShatterCb) => {
            _this.anchor = { x:0.5, y:0.5 };
            _this.fadeCb = afterFadeCb;
            _this.shatterCb = afterShatterCb;
            stage.add(_this);

            this.lock();

            _this.fadeIn()
                .then(_this.shatter.bind(this))
                .then(() => {

                    // .. //
                    stage.update();

            });
        };
    }
    get constructorArgs() { return [this._effectParent.clone()]; }
    onmousedrag(pos) {
        debugger;
    }

    fadeIn() {
        var _this = this;
        this.opacity = 0.0;
        return new Promise(function(resolve, reject) {
            Animate.tween(_this, { 'opacity':1.0 }, 400, (elapsed) => Math.pow(elapsed, 0.4)).after(() => {
                if (_this.fadeCb) _this.fadeCb();
                resolve();
            });
            Resource.play('heatup');
        });
    }
    shatter() {
        var _this = this;
        var stage = (_this.parent || _this.stage);
        _this.stroke = { color:'white', lineWidth:3 };
        _this.ignoreEvents = true;

        if (this._effectParent.broken) {

            var lefthalf  = _this.clone();
            var righthalf = _this.clone();
            lefthalf.graphicNode.image = 'mirror-icon-fade-false-lefthalf';
            righthalf.graphicNode.image = 'mirror-icon-fade-false-righthalf';
            lefthalf.ignoreEvents = true;
            righthalf.ignoreEvents = true;
            stage.add(lefthalf);
            stage.add(righthalf);

            Animate.tween(lefthalf, { pos:addPos(lefthalf.pos, { x:-50, y:0 }), opacity:0 }, 300, (elapsed) => Math.pow(elapsed, 0.4)).after(() => {
                stage.remove(lefthalf);
            });

            // Removes self after completion.
            stage.remove(_this);
            stage.update();
            stage.draw();

            return new Promise(function(resolve, reject) {
                Animate.tween(righthalf, { pos:addPos(righthalf.pos, { x:50, y:0 }), opacity:0 }, 300, (elapsed) => Math.pow(elapsed, 0.4)).after(() => {
                    if (_this.shatterCb) _this.shatterCb();
                    stage.remove(righthalf);
                    resolve();
                });
                Resource.play('mirror-shatter');
            });
        }
        else return new Promise(function(resolve, reject) {
            Animate.tween(_this, { 'opacity':0.0, 'scale':{x:1.2, y:1.4} }, 300, (elapsed) => Math.pow(elapsed, 0.2)).after(() => {
                if (_this.shatterCb) _this.shatterCb();

                // Removes self after completion.
                stage.remove(_this);
                stage.update();
                stage.draw();

                resolve();
            });
            Resource.play('shatter');
        });
    }

    toString() {
        return '';
    }
}
