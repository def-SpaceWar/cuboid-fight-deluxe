import { Color, drawRect, loadImage, rectToGL } from "./render";
import defaultImg from "./assets/classes/default.png";
import { Vector2D } from "./math";
import { drawHitbox, Hitbox, makePhysicsBody, PhysicsBody } from "./physics";
import { DEBUG_HITBOXES } from "./flags";

type Control = Keybind | MouseButton;

export class Keybind {
    constructor(public key: string) { }
}

export class MouseButton {
    constructor(public mouseButton: number) { }
}

export type Controls = {
    left: Control;
    up: Control;
    down: Control;
    right: Control;
    attack: Control;
    special: Control;
};

const defaultTex = await loadImage(defaultImg);
export class Default {
    texCoord = rectToGL([0, 0, 32, 32]);
    triangles = rectToGL([-25, -25, 25, 25]);
    hitbox: Hitbox = {
        type: 'rect',
        offset: Vector2D.zero(),
        w: 50,
        h: 50,
    };

    physicsBody: PhysicsBody;

    constructor(
        pos: Vector2D,
        public color: Color,
        public controls: Controls,
        public name: string = "Default",
        public playerNumber: number = 0,
        public teamNumber: number = 0,
    ) {
        this.physicsBody = makePhysicsBody({
            pos,
            vel: Vector2D.x(200),
        });
    }

    render() {
        drawRect(
            defaultTex,
            this.texCoord,
            this.triangles,
            { tint: this.color, translation: this.physicsBody.pos },
        );

        if (DEBUG_HITBOXES) drawHitbox(
            this.hitbox,
            this.physicsBody.pos,
            [0, 1, 0.5, 1],
        );
    }

    update(dt: number) {
        this.physicsBody.vel.y += 1_000 * dt;
        this.physicsBody.update(dt);
    }
}
