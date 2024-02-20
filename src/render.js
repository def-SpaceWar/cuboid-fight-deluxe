// Effects --------------------------------------------------------------------
const TransformEffect = {
    a: 1,
    b: 0,
    c: 0,
    d: 1,
    e: 0,
    f: 0,
};

TransformEffect.apply = function(ctx) {
    ctx.transform(this.a, this.b, this.c, this.d, this.e, this.f);
};

export const TransformEffect$new = (params = {}) =>
    Object.setPrototypeOf(params, TransformEffect);

const FilterEffect = {
    // Defaults!
    // url: "",
    // blur: 0,
    // brightness: 100,
    // contrast: 100,
    // dropShadows: [{
    //     offsetX: 0,
    //     offsetY: 0,
    //     blurRadius: 0,
    //     color: "transparent",
    // }],
    // grayscale: 0,
    // hueRotate: 0,
    // invert: 0,
    // opacity: 100,
    // saturate: 100,
    // sepia: 0,
};

FilterEffect.apply = function(ctx) {
    ctx.filter +=
        (this.url ? `url(${this.url}) ` : "") +
        (this.blur ? `blur(${this.blur}px) ` : "") +
        (this.brightness ? `brightness(${this.brightness}%) ` : "") +
        (this.contrast ? `contrast(${this.contrast}%) ` : "") +
        (this.dropShadows.map(d => `drop-shadow(${d.offsetX || 0}px ${d.offsetY || 0}px ${d.blurRadius || 0}px ${d.color || "black"}) `).join("")) +
        (this.grayscale ? `grayscale(${this.grayscale}%) ` : "") +
        (this.hueRotate ? `hue-rotate(${this.hueRotate}deg) ` : "") +
        (this.invert ? `invert(${this.invert}%) ` : "") +
        (this.opacity ? `opacity(${this.opacity}%) ` : "") +
        (this.saturate ? `saturate(${this.saturate}%) ` : "") +
        (this.sepia ? `sepia(${this.sepia}%) ` : "");
};

export const FilterEffect$new = (params = {}) =>
    Object.setPrototypeOf(params, FilterEffect);

// Renders --------------------------------------------------------------------
const Rectangle2D = {
    x: 0,
    y: 0,
    w: 20,
    h: 20,
    rotation: 0,
    color: "red",
    effects: [],
};

Rectangle2D.render = function(ctx) {
    ctx.save();
    for (const effect of this.effects) effect.apply(ctx);
    ctx.fillStyle = this.color;
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);
    ctx.fillRect(-this.w / 2, -this.h / 2, this.w, this.h);
    ctx.restore();
};

export const Rectangle2D$new = (params = {}) =>
    Object.setPrototypeOf(params, Rectangle2D);

const Ellipse2D = {
    x: 0,
    y: 0,
    w: 20,
    h: 20,
    rotation: 0,
    color: "red",
    effects: [],
};

Ellipse2D.render = function(ctx) {
    ctx.save();
    for (const effect of this.effects) effect.apply(ctx);
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.ellipse(
        this.x,
        this.y,
        this.w / 2,
        this.h / 2,
        this.rotation,
        0,
        Math.PI * 2,
    );
    ctx.fill();
    ctx.restore();
};

export const Ellipse2D$new = (params = {}) =>
    Object.setPrototypeOf(params, Ellipse2D);
