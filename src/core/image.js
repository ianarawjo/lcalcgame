var mag = (function(_) {

    class ImageRect extends _.Rect {
        constructor(x, y, w, h, resource_key) {

            // Just passing resource_key as first argument
            // should set w, h to the image's pixel width and height.
            if (arguments.length === 1 && typeof x === 'string') {
                let img = Resource.getImage(x);
                if (!img)
                    x = y = w = h = 0;
                else {
                    resource_key = x;
                    x = 0; y = 0;
                    w = img.naturalWidth;
                    h = img.naturalHeight;
                }
            }

            super(x,y,w,h);
            this.image = resource_key;
            this._offset = { x:0, y:0 };
        }
        get offset() { return { x:this._offset.x, y:this._offset.y }; }
        set offset(o) { this._offset = { x:o.x, y:o.y }; }
        drawInternal(ctx, pos, boundingSize) {
            if (!this.image) {
                //console.error('@ ImageRect: Cannot draw image ', this.image, ' in context ', ctx);
                ctx.fillStyle = 'pink';
                ctx.fillRect(pos.x, pos.y, boundingSize.w, boundingSize.h);
                return;
            }
            else if (!ctx) {
                console.error('@ ImageRect: Cannot draw image ', this.image, ' in context ', ctx);
                return;
            }
            let ri = Resource.getImage(this.image);
            if (!ri) {
                console.error('@ ImageRect: Cannot find resource image named ', this.image);
                return;
            }
            ctx.drawImage(ri, pos.x + this._offset.x, pos.y + this._offset.y, boundingSize.w, boundingSize.h);
        }
    }

    class RotatableImageRect extends ImageRect {
        constructor(x, y, w, h, resource_key) {
            if (typeof x === 'string') super(x);
            else super(x, y, w, h, resource_key);
            this.rotation = 0;
        }

        draw(ctx) {
            if (!ctx) return;
            ctx.save();
            if (this.opacity !== undefined && this.opacity < 1.0) {
                ctx.globalAlpha = this.opacity;
            }
            var boundingSize = this.absoluteSize;
            var upperLeftPos = this.upperLeftPos(this.absolutePos, boundingSize);

            ctx.translate(upperLeftPos.x + this._offset.x, upperLeftPos.y + this._offset.y);
            ctx.rotate(this.rotation);

            if (this._color || this.stroke) this.drawInternal(ctx, zeroPos(), boundingSize);

            this.children.forEach((child) => {
                let realpos = child.pos;
                let scale = this.absoluteScale;
                child.parent = this;
                child.pos = { x:(-upperLeftPos.x-this._offset.x)/scale.x+realpos.x, y:(-upperLeftPos.y-this._offset.y)/scale.y+realpos.y };
                child.draw(ctx);
                child.pos = realpos;
            });

            if (this._color || this.stroke) this.drawInternalAfterChildren(ctx, upperLeftPos, boundingSize);

            ctx.restore();
        }

        drawInternalAfterChildren(ctx, pos, boundingSize) {
            super.drawInternalAfterChildren(ctx, pos, boundingSize);
            ctx.restore();
        }
    }

    class PatternRect extends ImageRect {
        drawInternal(ctx, pos, boundingSize) {
            if (!ctx || !this.image) return;
            ctx.save();
            var ptrn = ctx.createPattern( Resource.getImage(this.image), 'repeat' );
            ctx.fillStyle = ptrn;
            ctx.fillRect(pos.x + this._offset.x, pos.y + this._offset.y, boundingSize.w, boundingSize.h);
            ctx.restore();
        }
    }

    class Button extends ImageRect {
        constructor(x, y, w, h, resource_map, onclick) {
            if (arguments.length === 2) {
                super(x.default);
                resource_map = x;
                onclick = y;
            } else super(x, y, w, h, resource_map.default);

            // where resource_map properties are:
            //  { default, hover (optional), down (opt.) }
            this.images = resource_map;
            this.clickFunc = onclick.bind(this);
        }
        onmouseenter(pos) {
            if ('hover' in this.images)
                this.image = this.images.hover;
        }
        onmouseleave(pos) {
            this.image = this.images.default;
        }
        onmousedown(pos) {
            if ('down' in this.images)
                this.image = this.images.down;
        }
        onmouseup(pos) {
            this.image = this.images.default;
            if (this.clickFunc) this.clickFunc();
        }
    }

    _.ImageRect = ImageRect;
    _.RotatableImageRect = RotatableImageRect;
    _.PatternRect = PatternRect;
    _.Button = Button;
    return _;
}(mag || {}));
