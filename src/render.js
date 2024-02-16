const Rectangle2D = {
    x: 0,
    y: 0,
    w: 100,
    h: 100,
    rotation: 0,
    color: "red",
};

Rectangle2D.render = function(ctx) {
    ctx.save();
    ctx.fillStyle = this.color;
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);
    ctx.fillRect(-this.w / 2, -this.h / 2, this.w, this.h);
    ctx.restore();
};

export const Rectangle2D$New = (params = {}) =>
    Object.setPrototypeOf(params, Rectangle2D);
