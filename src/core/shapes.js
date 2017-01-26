/** Basic shapes as node objects.
 *	Rect, RoundedRect, HexaRect, Star, Triangle, Circle, Pipe.
 * @module shapes
 */
 var mag = (function(_) {

     class Rect extends _.Node {
         constructor(x, y, w, h) {
             super(x, y);
             this._size = { w:w, h:h };
             this._anchor = { x:0, y:0 };
             this._scale = { x:1, y:1 };
             this._color = "lightgray";
             this._highlightColor = 'yellow';
             this.stroke = null;
             this.shadowOffset = 2;
             this.shadowColor = 'black';
         }
         get highlightColor() { return this._highlightColor; }
         set highlightColor(clr) { this._highlightColor = clr; }
         get absolutePos() {
             var pos = this.pos;
             if (this.parent) {
                 let abs_scale = this.parent.absoluteScale;

                 return addPos( {x:pos.x*abs_scale.x,
                                 y:pos.y*abs_scale.y},
                                 this.parent.upperLeftPos( this.parent.absolutePos , this.parent.absoluteSize ));
             }
             else return pos;
         }
         get absoluteScale() {
             if (this.parent) return multiplyPos( this.scale, this.parent.absoluteScale );
             else             return this.scale;
         }
         get absoluteSize() {
             var size = this.size;
             var scale = this.absoluteScale;
             return { w:size.w*scale.x, h:size.h*scale.y };
         }
         get absoluteBounds() {
             var pos = this.absolutePos;
             var size = this.absoluteSize;
             return { x:pos.x, y:pos.y, w:size.w, h:size.h };
         }
         get color() { return this._color; }
         get size() { return { w:this._size.w, h:this._size.h }; }
         get anchor() { return { x:this._anchor.x, y:this._anchor.y }; }
         get scale() { return { x:this._scale.x, y:this._scale.y }; }
         set size(sz) { this._size = sz; }
         set anchor(anch) { this._anchor = anch; }
         set scale(sc) { this._scale = sc; }
         set color(clr) { this._color = clr; }
         upperLeftPos(pos, boundingSize) {
             return { x:pos.x - this.anchor.x*boundingSize.w, y:pos.y - this.anchor.y*boundingSize.h };
         }
         centerPos() {
             let sz = this.absoluteSize;
             let pt = this.absolutePos;
             let left = this.upperLeftPos( pt, sz );
             return { x:left.x + sz.w * 0.5, y:left.y + sz.h * 0.5 };
         }
         posOnRectAt(unitPos) { // Given unit pos like 0, 1, returns position relative to Rect's this.pos and this.anchor properties.
             let sz = { w:this._size.w * this._scale.x, h:this._size.h * this._scale.y };
             let pt = this.upperLeftPos( this._pos, sz );
             let offset = { x:unitPos.x * sz.w, y:unitPos.y * sz.h };
             return addPos(pt, offset);
         }
         draw(ctx) {
             if (!ctx) return;
             ctx.save();
             if (this.opacity !== undefined && this.opacity < 1.0) {
                 ctx.globalAlpha = this.opacity;
             }
             var boundingSize = this.absoluteSize;
             var upperLeftPos = this.upperLeftPos(this.absolutePos, boundingSize);
             if (this._color || this.stroke) this.drawInternal(ctx, upperLeftPos, boundingSize);
             this.children.forEach((child) => {
                 child.parent = this;
                 child.draw(ctx);
             });
             if (this._color || this.stroke) this.drawInternalAfterChildren(ctx, upperLeftPos, boundingSize);
             ctx.restore();
         }
         strokeRect(ctx, x, y, w, h) {
             if(this.stroke) {
                 if (this.stroke.opacity && this.stroke.opacity < 1.0) {
                     ctx.save();
                     ctx.globalAlpha *= this.stroke.opacity;
                     ctx.strokeRect(x, y, w, h);
                     ctx.restore();
                 }
                 else ctx.strokeRect(x, y, w, h);
             }
         }
         drawInternal(ctx, pos, boundingSize) {
             setStrokeStyle(ctx, this.stroke);
             ctx.fillStyle = this.shadowColor;
             ctx.fillRect(pos.x, pos.y, boundingSize.w, boundingSize.h+this.shadowOffset);
             this.strokeRect(ctx, pos.x, pos.y, boundingSize.w, boundingSize.h+this.shadowOffset);
             ctx.fillStyle = this.color;
             ctx.fillRect(pos.x, pos.y, boundingSize.w, boundingSize.h);
             this.strokeRect(ctx, pos.x, pos.y, boundingSize.w, boundingSize.h)
         }
         drawInternalAfterChildren(ctx, pos, boundingSize) { }

         // Events
         hits(pos, options) {
             if (this.ignoreEvents) return null; // All children are ignored as well.

             if (typeof options !== 'undefined' && options.hasOwnProperty('exclude')) {
                 for(let e of options.exclude) {
                     if (e == this) return null;
                 }
             }

             var hitChild = this.hitsChild(pos, options);
             if (hitChild) return hitChild;

             // Hasn't hit any children, so test if the point lies on this node.
             return this.hitsWithin(pos);
         }
         hitsWithin(pos) {
             var boundingSize = this.absoluteSize;
             var upperLeftPos = this.upperLeftPos(this.absolutePos, boundingSize);
             if (pointInRect(pos, rectFromPosAndSize(upperLeftPos, boundingSize) )) return this;
             else return null;
         }
         hitsChild(pos, options) {
             // Depth-first hit test.
             if (this.children && this.children.length > 0) {
                 var hitChild = null;
                 for (let child of this.children) {
                     hitChild = child.hits(pos, options);
                     if (hitChild) break;
                 }
                 if (hitChild) return hitChild;
             }
             return null;
         }
         onmousedown(pos) { }
         onmousedrag(pos) {
             //this.pos = pos;
         }
         onmouseenter(pos) {
             this.stroke = { color:this.highlightColor, lineWidth:2 };
         }
         onmouseleave(pos) {
             this.stroke = null;
         }
         onmouseup(pos) { }
     }

     class RoundedRect extends Rect {
         constructor(x, y, w, h, rad=6) {
             super(x, y, w, h);
             this.radius = rad;
         }
         drawInternal(ctx, pos, boundingSize) {
             ctx.fillStyle = this.shadowColor;
             setStrokeStyle(ctx, this.stroke);
             if (this.shadowOffset !== 0) {
                 roundRect(ctx,
                           pos.x, pos.y+this.shadowOffset,
                           boundingSize.w, boundingSize.h,
                           this.radius*this.absoluteScale.x, true, this.stroke ? true : false,
                           this.stroke ? this.stroke.opacity : null); // just fill for now
             }
             if (this.color) ctx.fillStyle = this.color;
             roundRect(ctx,
                       pos.x, pos.y,
                       boundingSize.w, boundingSize.h,
                       this.radius*this.absoluteScale.x, this.color !== null, this.stroke ? true : false,
                       this.stroke ? this.stroke.opacity : null); // just fill for now
         }
     }

     class HexaRect extends Rect {
         constructor(x, y, w, h) {
             super(x, y, w, h);
         }
         drawInternal(ctx, pos, boundingSize) {
             ctx.fillStyle = 'black';
             setStrokeStyle(ctx, this.stroke);
             if (this.shadowOffset !== 0) {
                 hexaRect(ctx,
                           pos.x, pos.y+this.shadowOffset,
                           boundingSize.w, boundingSize.h,
                           true, this.stroke ? true : false); // just fill for now
             }
             ctx.fillStyle = this.color;
             hexaRect(ctx,
                       pos.x, pos.y,
                       boundingSize.w, boundingSize.h,
                       true, this.stroke ? true : false); // just fill for now
         }
     }

     class Star extends Rect {
         constructor(x, y, rad, points=5) {
             super(x, y, rad*2, rad*2);
             this.starPoints = points;
         }
         drawInternal(ctx, pos, boundingSize) {
             drawStar(ctx, pos.x+boundingSize.w/2, pos.y+boundingSize.h/2+this.shadowOffset,
                      this.starPoints, boundingSize.w / 2, boundingSize.w / 4,
                      this.stroke, 'black');
             drawStar(ctx, pos.x+boundingSize.w/2, pos.y+boundingSize.h/2,
                      this.starPoints, boundingSize.w / 2, boundingSize.w / 4,
                      this.stroke, this.color);
         }
     }

     class Triangle extends Rect {
         drawInternal(ctx, pos, boundingSize) {
             setStrokeStyle(ctx, this.stroke);
             ctx.fillStyle = 'black';
             ctx.beginPath();
             ctx.moveTo(pos.x,pos.y+boundingSize.h+this.shadowOffset);
             ctx.lineTo(pos.x+boundingSize.w,pos.y+boundingSize.h+this.shadowOffset);
             ctx.lineTo(pos.x+boundingSize.w/2.0,pos.y+this.shadowOffset);
             ctx.closePath();
             ctx.fill();
             if (this.stroke) ctx.stroke();
             ctx.fillStyle = this.color;
             ctx.beginPath();
             ctx.moveTo(pos.x,pos.y+boundingSize.h);
             ctx.lineTo(pos.x+boundingSize.w,pos.y+boundingSize.h);
             ctx.lineTo(pos.x+boundingSize.w/2.0,pos.y);
             ctx.closePath();
             ctx.fill();
             if (this.stroke) strokeWithOpacity(ctx, this.stroke.opacity);
         }
     }

     class Circle extends Rect {
         constructor(x, y, rad) {
             super(x, y, rad*2, rad*2);
             this._radius = rad;
             this.clipChildren = false;
         }
         get size() { return super.size; }
         set size(sz) {
             super.size = sz;
             this._radius = (sz.w + sz.h) / 4.0;
         }
         get radius() { return this._radius; }
         set radius(r) {
             this._radius = r;
             this._size = { w:r*2, h:r*2 };
         }
         drawInternalAfterChildren(ctx, pos, boundingSize) {
             if (this.clipChildren) {
                 ctx.restore();

                 var rad = boundingSize.w / 2.0;
                 drawCircle(ctx, pos.x, pos.y, rad, null, {color:'black', lineWidth:1});
             }
         }
         drawInternal(ctx, pos, boundingSize) {
             var rad = boundingSize.w / 2.0;
             if (this.shadowOffset !== 0)
                 drawCircle(ctx, pos.x, pos.y + this.shadowOffset, rad, 'black',    this.stroke);
             drawCircle(ctx, pos.x, pos.y,                     rad, this.color, this.stroke);
             if (this.clipChildren) {
                 ctx.save();
                 ctx.beginPath();
                 ctx.arc(pos.x+rad, pos.y+rad, rad, 0, 2*Math.PI);
                 ctx.clip();

                 if (this.clipBackground) {
                     ctx.drawImage(Resource.getImage(this.clipBackground),
                         pos.x, pos.y);
                 }
             }
         }
     }

     class Pipe extends Rect {
         constructor(x, y, w, h, topColor='green', sideColor='ForestGreen') {
             super(x, y, w, h);
             this.topColor = topColor;
             this.sideColor = sideColor;
             this.cylStroke = { color:'blue', lineWidth:1 };
         }
         drawInternal(ctx, pos, boundingSize) {
             var l = boundingSize.h / 4;
             var w = boundingSize.w / 2;
             var yoffset = -20;
             setStrokeStyle(ctx, this.cylStroke);

             // Draw side and bottom.
             ctx.fillStyle = this.sideColor;
             ctx.beginPath();
             ctx.ellipse(pos.x+w, pos.y+boundingSize.h+10+yoffset, w, l, 0, 0, Math.PI); // half ellipse
             ctx.lineTo(pos.x-w+w, pos.y+yoffset);
             ctx.lineTo(pos.x+w+w, pos.y+yoffset);
             ctx.closePath();
             ctx.fill();
             if(this.cylStroke) ctx.stroke();

             // Draw top circle.
             ctx.fillStyle = this.topColor;
             ctx.beginPath();
             ctx.ellipse(pos.x+w, pos.y+yoffset, w, l, 0, 0, 2 * Math.PI);
             ctx.fill();
             if(this.cylStroke) ctx.stroke();
         }
     }

     // Exports
     _.Rect = Rect;
     _.RoundedRect = RoundedRect;
     _.HexaRect = HexaRect;
     _.Star = Star;
     _.Triangle = Triangle;
     _.Circle = Circle;
     _.Pipe = Pipe;
     return _;
 }(mag || {}));
