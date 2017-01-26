/**
 * A core drawing 'layer'.
 * You can add Nodes to this layer to display them and update them.
 */
var mag = (function(_) {

    class Stage {
        constructor(canvas=null) {
            if (canvas) this.canvas = canvas;
            else        this.ctx = null;
            this.nodes = [];
            this.hoverNode = null;
            this._scale = 1;
            this.requested = false;
        }
        get scale() { return this._scale; }
        set scale(s) {
            if (s === 0) return;
            this._scale = s;
        }
        get boundingSize() {
            let r = this._canvas.getBoundingClientRect();
            return { w:r.width / this.scale, h:r.height / this.scale };
        }
        get canvas() { return this._canvas; }
        set canvas(c) {
            if (c) {
                delegateMouse(canvas, this);
                this.ctx = canvas.getContext('2d');
            } else {
                delegateMouse(canvas, null);
                this.ctx = null;
            }
            this._canvas = c;
        }
        clear() {
            this.ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
        has(node) {
            return node && node.stage == this && this.nodes.indexOf(node) > -1;
        }
        add(node) {
            if (this.has(node)) return;
            node.stage = this;
            if(node.locked) node.unlock();
            this.nodes.push(node);
        }
        addAll(nodes) {
            nodes.forEach((n) => this.add(n));
        }
        remove(node) {
            var i = this.nodes.indexOf(node);
            if (i > -1) {
                this.nodes[i].stage = null;
                this.nodes.splice(i, 1);
            }
        }
        swap(node, anotherNodeOrNodes) {
            var i = this.nodes.indexOf(node);
            if (i > -1) {

                // just delete the node...
                if (anotherNodeOrNodes === null) {
                    this.nodes.splice(i, 1);
                    return;
                }

                this.nodes[i].stage = null;
                var origpos = this.nodes[i].upperLeftPos(this.nodes[i].absolutePos, this.nodes[i].absoluteSize);
                var pos;
                var total_width = 0;
                var rightpos;
                var scale = this.nodes[i].scale;

                var anotherNode = anotherNodeOrNodes;
                if (!Array.isArray(anotherNode)) {
                    anotherNode = [anotherNode];
                    origpos = this.nodes[i].centerPos();
                }

                pos = clonePos(origpos);

                for (let j = 0; j < anotherNode.length; j++) {
                    var an = anotherNode[j];
                    an.unlock();
                    an.pos = pos;
                    an.parent = null;
                    an.stage = this;
                    an.scale = this.nodes[i].scale;
                    if (anotherNode.length === 1)
                        an.anchor = { x:0.5, y:0.5 };
                    an.onmouseleave();
                    pos = addPos({ x:an.size.w + 6, y:0 }, pos);
                    total_width += an.size.w + 6;
                    if (j === 0) this.nodes.splice(i, 1, an);
                    else this.nodes.splice(i+j, 0, an);
                }

                // Can't duplicate horizontally or we'll go off-screen.
                // So, duplicate vertically.
                if (total_width > GLOBAL_DEFAULT_SCREENSIZE.width) {
                    pos = clonePos(origpos);
                    anotherNode.forEach((n) => {
                        let p = n.pos;
                        n.pos = pos;
                        n.anchor = { x:0, y:0.5 };
                        pos = addPos({x:0, y:an.size.h + 6}, pos);
                    });
                }
                if (pos.x > GLOBAL_DEFAULT_SCREENSIZE.width) {
                    let offset = pos.x - GLOBAL_DEFAULT_SCREENSIZE.width;
                    anotherNode.forEach((n) => {
                        let p = n.pos;
                        n.pos = { x:p.x - offset, y:p.y };
                    });
                }
            }
        }
        bringToFront(node) {
            var i = this.nodes.indexOf(node);
            if (i > -1 && i < this.nodes.length-1) {
                console.error('fefef');
                var n = this.nodes[i];
                this.nodes.splice(i, 1);
                this.nodes.push(n);
                this.draw();
            }
        }

        /** Update all nodes on the stage. */
        update() {
            this.nodes.forEach((n) => n.update());
        }

        // Recursive functions that grab nodes on this stage with the specified class.
        getRootNodesThatIncludeClass(Class, excludedNodes=[]) {
            let ns = this.getNodesWithClass(Class, excludedNodes);
            let topns = ns.map((n) => n.rootParent);
            return topns.filter((n) => !n.parent && n._stage !== undefined);
        }
        getNodesWithClass(Class, excludedNodes=[], recursive=true, nodes=null) {
            if (!nodes) nodes = this.nodes;
            return mag.Stage.getNodesWithClass(Class, excludedNodes, recursive, nodes);
        }
        static getNodesWithClass(Class, excludedNodes=[], recursive=true, nodes=null) {
            if (!nodes) return null;
            var rt = [];
            nodes.forEach((n) => {
                var excluded = false;
                excludedNodes.forEach((excn) => {excluded |= n == excn || n.ignoreGetClassInstance;});
                if (excluded) return;
                else if (n instanceof Class) rt.push(n);
                if (recursive && n.children.length > 0) {
                    let childs = this.getNodesWithClass(Class, excludedNodes, true, n.children);
                    childs.forEach((c) => rt.push(c));
                }
            });
            return rt;
        }

        /** Invalidates this stage, so that it won't draw to canvas or receive events. */
        invalidate() {
            this.invalidated = true;
            delegateMouse(this._canvas, null);
        }
        validate() {
            this.invalidated = false;
            delegateMouse(this._canvas, this);
        }

        /** Draw this stage to the canvas. */
        draw() {
            // To avoid redundant draws, when someone calls draw, we
            // instead try to schedule an actual redraw. Another
            // redraw cannot be scheduled until the previous one
            // completes. The scheduling is done using
            // requestAnimationFrame so that the browser has control
            // over the framerate.
            if (!this.requested) {
                this.requested = true;
                window.requestAnimationFrame(() => {
                    this.drawImpl();
                    this.requested = false;
                });
            }
        }

        drawImpl() {
            if (this.invalidated) return; // don't draw invalidated stages.
            this.ctx.save();
            this.ctx.scale(this._scale, this._scale);
            this.clear();
            const len = this.nodes.length;
            for (let i = 0; i < len; i++) {
                this.nodes[i].draw(this.ctx);
            }
            //this.nodes.forEach((n) => n.draw(this.ctx));
            this.ctx.restore();
        }


        // Event handlers.
        getNodeUnder(node, pos) {
            var hit_nodes = this.getHitNodes(pos, {'exclude':[node]});
            var hit = null;
            if (hit_nodes.length > 0) {
                for(let i = hit_nodes.length-1; i > -1; i--) {
                    if (hit_nodes[i] != node)
                        hit = hit_nodes[i];
                }
            }
            return hit;
        }
        onmousedown(pos) { // Mouse clicked down.
            var hit_nodes = this.getHitNodes(pos);
            if (hit_nodes.length > 0) {
                hit_nodes[hit_nodes.length-1].onmousedown(pos); // only send to top-most node??
                this.heldNode = hit_nodes[hit_nodes.length-1];

                if (this.lastHeldNode != this.heldNode)
                    this.lastHeldNode = this.heldNode;
            }
            this.draw();
        }
        onmousedrag(pos) { // Mouse clicked + moving (drag).
            if (this.heldNode) { // Only send this event to the 'mousedown'd node.

                var nodepos = pos;
                if (this.heldNode.absoluteSize) {
                    if (!this.heldNodeOrigOffset)
                        this.heldNodeOrigOffset = fromTo(pos, this.heldNode.absolutePos);
                    nodepos = addPos(pos, this.heldNodeOrigOffset);
                }

                this.heldNode.onmousedrag(nodepos);

                // Check which node lies below the heldNode. If there is one,
                // let it know, and store it for the mouseup event.
                var underNode = this.getNodeUnder(this.heldNode, pos);
                if (this.underNode && this.underNode == underNode) { }
                else if (!this.underNode) {
                    if (underNode) underNode.ondropenter(this.heldNode, pos);
                    this.underNode = underNode;
                } else if (this.underNode != underNode) { // this.underNode != underNode
                    if (underNode) underNode.ondropenter(this.heldNode, pos);
                    this.underNode.ondropexit(this.heldNode, pos);
                    this.underNode = underNode;
                }

                this.draw();
            }
        }
        onmousehover(pos) { // Hovering without clicking.
            // .. safest to do nothing here for now .. //
            var hit_nodes = this.getHitNodes(pos);
            var hit = hit_nodes[hit_nodes.length-1];
            if (this.hoverNode) {
                if (hit === this.hoverNode) { // If hovering over this node and not its children...
                    this.hoverNode.onmousehover(pos);
                    //console.log('hovering over ', this.hoverNode.color);
                    this.draw();
                    return;
                }
                else {
                    this.hoverNode.onmouseleave(pos);
                    if (hit) {
                        hit.onmouseenter(pos);
                        this.hoverNode = hit;
                        this.draw();
                        return;
                    } else {
                        this.hoverNode = null;
                        this.draw();
                    }
                }
            }
            if (hit_nodes.length > 0) {
                hit_nodes[hit_nodes.length-1].onmouseenter(pos); // only send to top-most node??
                this.hoverNode = hit_nodes[hit_nodes.length-1];
                this.draw();
            }
        }
        onmouseclick(pos) {
            if (this.heldNode) {
                this.heldNode.onmouseclick(pos);
            }
        }
        onmouseup(pos) { // Mouse button unclicked.
            if (this.heldNode) { // Only send this event to the 'mousedown'd node.

                // Drag 'n' drop droppped event.
                if (this.underNode) {
                    this.underNode.ondropped(this.heldNode, pos);
                    this.underNode = null;
                }

                this.heldNode.onmouseup(pos);
                this.heldNode = null;
                this.heldNodeOrigOffset = null;

                this.update();
                this.draw();
            }
        }
        getHitNodes(pos, options={}) {
            var hits = [];
            var hitnode = null;
            this.nodes.forEach((n) => {
                hitnode = n.hits(pos, options);
                if (hitnode) hits.push(hitnode);
            });
            return hits;
        }

        toString() {
            return "[Stage toString method is undefined]";
        }
    }

    function delegateMouse(canvas, stage) {

        const RIGHT_BTN = 2;
        var mouseIsDown = false;
        var mouseDragged = false;
        var mouseDownTime = 0;
        var missedDragCalls = [];
        const CLICK_DEBOUNCE_TIME = 80; // in ms

        function getMousePos(evt) {
            var rect = canvas.getBoundingClientRect();
            return {
              x: (evt.clientX - rect.left) / stage._scale,
              y: (evt.clientY - rect.top) / stage._scale
            };
        }
        function getTouch(evt, idx=0) {
            if (evt.touches.length > 0)
                return evt.touches[idx];
            else
                return evt.changedTouches[idx];
        }

        if (stage) {

            // MOUSE EVENTS
            var onmousedown = function(pos){

                stage.onmousedown( pos );

                mouseIsDown = true;
                mouseDragged = false;
                mouseDownTime = Date.now();
                missedDragCalls = [];
            };
            var onmouseup = function(pos){

                if (!mouseDragged) stage.onmouseclick( pos );

                stage.onmouseup( pos );

                mouseIsDown = false;
                mouseDragged = false;
            };
            var onmousemove = function(pos){

                if(!mouseIsDown) {
                    stage.onmousehover( pos );
                } else if (mouseDragged || Date.now() - mouseDownTime > CLICK_DEBOUNCE_TIME) { // debounce clicks
                    if (missedDragCalls.length > 0) {
                        missedDragCalls.forEach((call) => call());
                        missedDragCalls = [];
                    }
                    stage.onmousedrag( pos );
                    mouseDragged = true;
                } else {
                    missedDragCalls.push(function() {
                        stage.onmousedrag( pos );
                    });
                }
                return false;
            };
            canvas.onmousedown = (e) => {
                if (e.button === RIGHT_BTN) return false;
                onmousedown( getMousePos(e) );
                return false;
            };
            canvas.onmousemove = (e) => {
                if (e.button === RIGHT_BTN) return false;
                onmousemove( getMousePos(e) );
                return false;
            };
            canvas.onmouseup   = (e) => {
                if (e.button === RIGHT_BTN) return false;
                onmouseup( getMousePos(e) );
                return false;
            };

            var ontouchstart = function(e) {

                var pos = getMousePos( getTouch(e) );

                stage.onmousehover(pos);
                onmousedown(pos);

                e.preventDefault();
            };
            var ontouchmove = function(e) {

                var pos = getMousePos( getTouch(e) );

                onmousemove(pos);

                e.preventDefault();
            };
            var ontouchend = function(e) {

                var pos = getMousePos( getTouch(e) );

                onmouseup(pos);
                stage.onmousehover( { x:-10000, y:-10000 } );

                e.preventDefault();
            };
            var ontouchcancel = function(e) {
                ontouchend(e);
                e.preventDefault();
            };

            // TOUCH EVENTS (MOBILE)
            canvas.addEventListener('touchstart', ontouchstart, false);
            canvas.addEventListener('touchmove', ontouchmove, false);
            canvas.addEventListener('touchend', ontouchend, false);
            canvas.addEventListener('touchcancel', ontouchcancel, false);

        } else {
            canvas.onmousedown = null;
            canvas.onmouseup = null;
            canvas.onmousemove = null;
            mouseIsDown = false;
            mouseDragged = false;
        }
    }

    // Exports
    _.Stage = Stage;
    return _;
}(mag || {}));
