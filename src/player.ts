import { Color, drawRect, loadImage, rectToGL } from "./render";
import defaultImg from "./assets/classes/default.png";
import { Vector2D } from "./math";
import { drawHitbox, Hitbox, makePhysicsBody, PhysicsBody, RectangleHitbox } from "./physics";
import { DEBUG_HITBOXES } from "./flags";
import { Platform } from "./platform";
import { isMousePressed, isPressed } from "./input";

type Keybind = { key: string };
type MouseButton = { button: number };
type Control
    = Keybind
    | MouseButton;

export const Binding = {
    key(key: string): Keybind { return { key }; },
    button(button: number): MouseButton { return { button }; },
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
    // @ts-ignore
    if (c.key) return isPressed(c.key);
    // @ts-ignore
    return isMousePressed(c.button);
}

export type Player = {
    hitbox: Hitbox;
    physicsBody: PhysicsBody;

    speed: number;
    airSpeed: number;
    isGrounded: boolean;
    jumpPower: number;
    isPhasing: boolean;

    health: number;
    maxHealth: number;
    isDead: boolean;

    kbMultiplier: number;
    damageMultiplier: number;
    healMultiplier: number;

    render(): void;
    update(dt: number): void;
    onPlatformCollision(p: Platform): void;
    onPlayerCollision(p: Player): void;

    takeKb(kb: Vector2D): void;
    takeDamage(damage: number): void;
    takeHealing(health: number): void;
};

const defaultTex = await loadImage(defaultImg),
    defaultTexCoord = rectToGL([0, 0, 16, 16]),
    defaultDeadTexCoord = rectToGL([16, 0, 32, 16]),
    defaultTriangles = rectToGL([-25, -25, 25, 25]),
    defaultHitbox = {
        type: 'rect',
        offset: Vector2D.zero(),
        w: 50,
        h: 50,
    };
export class Default implements Player {
    visualOffset = Vector2D.zero();
    visualDiminishConstant = -20;

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

    canAttack = true;
    attackCooldown = 2;
    attackTimer = 0;
    attackRange = 100;
    attackPower = 4;
    damage = 4;
    combo = 0;
    comboCooldown = 0.25;
    isGroundPounding = false;

    specialTimer = 0;
    specialCooldown = this.attackCooldown * 2;
    isSpecialCooldown = false;

    health = 100;
    maxHealth = 100;
    isDead = false;

    kbMultiplier = 1;
    damageMultiplier = 1;
    healMultiplier = 1;

    constructor(
        pos: Vector2D,
        public color: Color,
        public controls: Controls,
        public playerNumber: number,
        public allPlayers: Player[],
    ) {
        this.physicsBody = makePhysicsBody({
            pos,
            vel: Vector2D.x(200),
            xDrag: 0.04,
            yDrag: 0.2,
        });
    }

    render() {
        if (this.isDead) {
            drawRect(
                defaultTex,
                defaultDeadTexCoord,
                defaultTriangles,
                {
                    tint: this.color,
                    translation: this.physicsBody.pos
                        .clone()
                        .av(this.visualOffset),
                },
            );
        } else {
            drawRect(
                defaultTex,
                defaultTexCoord,
                defaultTriangles,
                {
                    tint: this.color,
                    translation: this.physicsBody.pos
                        .clone()
                        .av(this.visualOffset),
                },
            );
        }

        if (DEBUG_HITBOXES) drawHitbox(
            this.hitbox,
            this.physicsBody.pos,
            [0, 1, 0.5, 1],
        );
    }

    update(dt: number) {
        this.physicsBody.vel.y += 2_500 * dt;
        if (this.isGroundPounding) this.physicsBody.vel.y += 5_000 * dt;
        this.physicsBody.update(dt);
        this.visualOffset.Sn(Math.exp(dt * this.visualDiminishConstant));

        this.attackTimer -= dt;
        this.specialTimer -= dt;
        if (!this.isSpecialCooldown) {
            if (this.attackTimer <= 0) this.canAttack = true;
        } else if (this.specialTimer <= 0) {
            this.canAttack = true;
            this.isSpecialCooldown = false;
        }

        if (this.isDead) return;
        if (isControlDown(this.controls.left)) this.physicsBody.vel.x -= this.speed * dt;
        if (isControlDown(this.controls.right)) this.physicsBody.vel.x += this.speed * dt;
        if (isControlDown(this.controls.up)) this.jump();
        if (isControlDown(this.controls.down)) {
            if (this.isGrounded) this.phase();
            else this.groundPound();
        }
        if (isControlDown(this.controls.attack)) this.attack();
        if (isControlDown(this.controls.special)) this.special();
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

        if (this.isGroundPounding) {
            this.isGroundPounding = false;
            this.attack(true);
        }

        const oldY = this.physicsBody.pos.y;
        this.physicsBody.pos.y = p.pos.y + p.hitbox.offset.y
            - p.hitbox.h / 2 - this.hitbox.h / 2;
        const diff = this.physicsBody.pos.y - oldY;
        if (Math.abs(diff) > 4) this.visualOffset.y -= diff;
        this.physicsBody.vel.y = 0;

        this.isGrounded = true;
        this.canJump = true;
        this.doubleJumpCount = 2;
    }

    onPlayerCollision(_: Player) { }

    attack(isGroundPound = false) {
        if (!this.canAttack) return;
        let hasHit = false;

        for (let i = 0; i < this.allPlayers.length; i++) {
            const other = this.allPlayers[i];
            if (other == this || other.isDead) continue;
            let squaredDistance = Vector2D.squaredDistance(
                this.physicsBody.pos,
                other.physicsBody.pos,
            );
            if (isGroundPound) squaredDistance /= 2;
            if (squaredDistance > this.attackRange ** 2) continue;
            let damage =
                Math.min(
                    Math.max(
                        this.attackRange / Math.sqrt(squaredDistance),
                        this.damage ** 1.5,
                    ),
                    this.damage ** 2.5,
                );
            const kb = Vector2D
                .subtract(other.physicsBody.pos, this.physicsBody.pos)
                .Sn(
                    this.attackPower *
                    (other.maxHealth / other.health) ** 2
                )

            if (!isGroundPound) damage *= (1 + .5 * this.combo)
            else {
                kb.Sn(this.jumpPower / 1000);
                damage /= 4;
            }

            other.takeDamage(damage);
            other.takeKb(kb);

            if (!isGroundPound) {
                hasHit = true;
                this.combo++;
            }
        }

        if (!hasHit) this.combo = 0;
        if (isGroundPound) return;
        this.canAttack = false;
        this.attackTimer = this.attackCooldown - (this.combo * this.comboCooldown);
    }

    groundPound() {
        if (this.isPhasing) return;
        this.isGroundPounding = true;
    }

    special() {
        if (this.attackTimer > 0) return;
        if (this.specialTimer > 0) return;
        if (!this.canAttack) return;

        for (let i = 0; i < 5; i++) setTimeout(
            () => this.takeHealing(4),
            i * 1000,
        );

        this.isSpecialCooldown = true;
        this.specialTimer = this.specialCooldown;
        this.canAttack = false;
    }

    takeKb(kb: Vector2D) {
        this.physicsBody.vel.av(kb.clone().Sn(this.kbMultiplier));
    }

    takeDamage(damage: number) {
        this.health -= damage * this.damageMultiplier;
        if (this.health > 0) return;
        this.health = 0;
        this.isDead = true;
    }

    takeHealing(health: number) {
        this.health += health * this.healMultiplier;
    }
}
