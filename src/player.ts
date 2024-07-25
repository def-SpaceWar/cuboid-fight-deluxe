import { Color, drawRect, loadImage, rectToGL } from "./render";
import defaultImg from "./assets/classes/default.png";
import { Vector2D } from "./math";
import { drawHitbox, Hitbox, makePhysicsBody, PhysicsBody, RectangleHitbox } from "./physics";
import { DEBUG_HITBOXES } from "./flags";
import { Platform } from "./platform";
import { isMousePressed, isPressed } from "./input";

type Keybind = { type: 'key', key: string };
type MouseButton = { type: 'button', button: number };
type Control
    = Keybind
    | MouseButton;

export const Binding = {
    key(key: string): Keybind {
        return { type: 'key', key };
    },

    button(button: number): MouseButton {
        return { type: 'button', button };
    },
};

export type Controls = {
    left: Control;
    up: Control;
    down: Control;
    right: Control;
    attack: Control;
    special: Control;
};

function isControlDown(c: Control) {
    switch (c.type) {
        case "key":
            return isPressed(c.key);
        case "button":
            return isMousePressed(c.button);
    }

    throw "invalid control";
}

export type Player = {
    hitbox: Hitbox;
    physicsBody: PhysicsBody;

    speed: number;
    airSpeed: number;
    isGrounded: boolean;
    jumpPower: number;
    isPhasing: boolean;

    render(): void;
    update(dt: number): void;
    onPlatformCollision(p: Platform): void;
    onPlayerCollision(p: Player): void;
};

const defaultTex = await loadImage(defaultImg),
    defaultTriangles = rectToGL([-25, -25, 25, 25]),
    defaultHitbox = {
        type: 'rect',
        offset: Vector2D.zero(),
        w: 50,
        h: 50,
    };
export class Default implements Player {
    texCoord = rectToGL([0, 0, 32, 32]);
    visualOffset = Vector2D.zero();
    visualDiminishConstant = Math.log(1e-4);
    triangles = defaultTriangles;

    hitbox: RectangleHitbox = defaultHitbox as RectangleHitbox;
    physicsBody;

    speed = 1_000;
    airSpeed = 1_000; // useless cuz airSpeed is same for Default

    isGrounded = false;
    jumpPower = 800;
    canJump = true;
    doubleJumpCount = 0;
    isPhasing = false;
    phaseTimeout = 0;

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
            xDrag: 0.2,
            yDrag: 0.2,
        });
    }

    render() {
        drawRect(
            defaultTex,
            this.texCoord,
            this.triangles,
            {
                tint: this.color,
                translation: this.physicsBody.pos
                    .clone()
                    .av(this.visualOffset),
            },
        );

        if (DEBUG_HITBOXES) drawHitbox(
            this.hitbox,
            this.physicsBody.pos,
            [0, 1, 0.5, 1],
        );
    }

    update(dt: number) {
        this.physicsBody.vel.y += 2_500 * dt;
        this.physicsBody.update(dt);
        this.visualOffset.Sn(Math.exp(dt * this.visualDiminishConstant));

        if (isControlDown(this.controls.left)) this.physicsBody.vel.x -= this.speed * dt;
        if (isControlDown(this.controls.right)) this.physicsBody.vel.x += this.speed * dt;
        if (isControlDown(this.controls.up)) this.jump();
        if (this.isGrounded && isControlDown(this.controls.down)) this.phase();
        this.isGrounded = false;
    }

    jump() {
        if (!this.canJump) return;
        this.stopPhasing();
        this.canJump = false;

        let jumpPower: number = this.jumpPower;
        if (this.isGrounded) {
            jumpPower *= 1.25;
        } else if (this.doubleJumpCount > 0) {
            this.doubleJumpCount--;
        }

        this.physicsBody.vel.y = -jumpPower;
        if (this.doubleJumpCount == 0) return;
        setTimeout(() => this.canJump = true, 200);
    }

    phase() {
        if (this.isPhasing) return;
        this.isPhasing = true;
        this.phaseTimeout =
            setTimeout(() => this.isPhasing = false, 500) as unknown as number;
    }

    stopPhasing() {
        clearTimeout(this.phaseTimeout);
        this.isPhasing = false;
    }

    onPlatformCollision(p: Platform) {
        if (this.isPhasing) {
            if (p.isPhaseable) return;
            this.stopPhasing();
        }

        const oldY = this.physicsBody.pos.y;
        this.physicsBody.pos.y = p.pos.y + p.hitbox.offset.y
            - p.hitbox.h / 2 - this.hitbox.h / 2;
        const diff = this.physicsBody.pos.y - oldY;
        if (Math.abs(diff) > 5) this.visualOffset.y -= diff;
        this.physicsBody.vel.y = 0;

        this.isGrounded = true;
        this.canJump = true;
        this.doubleJumpCount = 2;
    }

    onPlayerCollision(_: Player) {}
}
