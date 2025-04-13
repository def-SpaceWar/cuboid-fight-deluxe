// @ts-ignore:
import iconsImg from "./assets/ui/icons.png";
// @ts-ignore:
import defaultImg from "./assets/classes/default.png";
import {
    circleToGeometry,
    createHTMLRender,
    createHTMLTemporary,
    defaultCircleColor,
    defaultRectColor,
    drawGeometry,
    fillGeometry,
    GLColor,
    loadImage,
    rectToGeometry,
    RGBAColor,
} from "./render.ts";
import { Vector2D } from "./math.ts";
import {
    drawHitbox,
    Hitbox,
    makePhysicsBody,
    PhysicsBody,
    RectangleHitbox,
} from "./physics.ts";
import {
    DAMAGE_COLOR,
    DEBUG_HITBOXES,
    DEGENERATE_COLOR,
    DT,
    HEAL_COLOR,
    KILL_CREDIT_TIME,
    POISON_COLOR,
    REGENERATE_COLOR,
} from "./flags.ts";
import { Platform } from "./platform.ts";
import { isMousePressed, isPressed } from "./input.ts";
import { GameMap } from "./map.ts";
import { playerDatas } from "./networking.ts";
import { Particle } from "./particle.ts";

type Keybind = { key: string };
type MouseButton = { button: number };
type Control =
    | Keybind
    | MouseButton;

export const Binding = {
    key(key: string): Keybind {
        return { key };
    },
    button(button: number): MouseButton {
        return { button };
    },
};

type PlayerState = {
    lagX: number;
    lagY: number;
    posX: number;
    posY: number;
    effect: string;
};

export interface PlayerInput {
    left: boolean;
    up: boolean;
    down: boolean;
    right: boolean;
    attack: boolean;
    special: boolean;
}

function isControlDown(c: Control) {
    if ("key" in c) return isPressed(c.key);
    return isMousePressed(c.button);
}

export type RawPlayerInput = number;
export const PREDICTED = 1 << 6,
    LEFT = 1 << 5,
    UP = 1 << 4,
    DOWN = 1 << 3,
    RIGHT = 1 << 2,
    ATTACK = 1 << 1,
    SPECIAL = 1 << 0;
export function parseRawInput(raw: RawPlayerInput): Readonly<PlayerInput> {
    return Object.freeze({
        left: Boolean(raw & LEFT),
        up: Boolean(raw & UP),
        down: Boolean(raw & DOWN),
        right: Boolean(raw & RIGHT),
        attack: Boolean(raw & ATTACK),
        special: Boolean(raw & SPECIAL),
    });
}

export class Controls {
    buttons: {
        left: Control;
        up: Control;
        down: Control;
        right: Control;
        attack: Control;
        special: Control;
    };

    constructor(
        buttons: {
            left: Control;
            up: Control;
            down: Control;
            right: Control;
            attack: Control;
            special: Control;
        },
        public playerNumber: PlayerNumber,
    ) {
        this.buttons = buttons;
    }

    getInput(): RawPlayerInput {
        return Number(isControlDown(this.buttons.left)) * LEFT +
            Number(isControlDown(this.buttons.up)) * UP +
            Number(isControlDown(this.buttons.down)) * DOWN +
            Number(isControlDown(this.buttons.right)) * RIGHT +
            Number(isControlDown(this.buttons.attack)) * ATTACK +
            Number(isControlDown(this.buttons.special)) * SPECIAL;
    }
}

const playerUiCoords = {
    1: Vector2D.xy(20, 20),
    2: Vector2D.xy(20, 105),
    3: Vector2D.xy(20, 190),
    4: Vector2D.xy(20, 275),
};
export type PlayerNumber = 1 | 2 | 3 | 4;
export type DamageReason =
    | {
        type: "player";
        player: Player;
        isCrit: boolean;
    }
    | {
        type: "environment";
    }
    | {
        type: "degenerate";
    }
    | {
        type: "poison";
    };
export type HealReason =
    | {
        type: "player";
        player: Player;
    }
    | {
        type: "environment";
    }
    | {
        type: "regenerate";
    };
export interface Player {
    origColor: RGBAColor;
    color: RGBAColor;
    number: PlayerNumber;
    name: string;
    allPlayers: Player[];
    map: GameMap;

    hitbox: Hitbox;
    physicsBody: PhysicsBody;

    isGrounded: boolean;
    isOnWall: boolean;
    jumpPower: number;
    isPhasing: boolean;

    health: number;
    maxHealth: number;
    isDead: boolean;
    combo: number;

    kills: number;
    deaths: number;
    lives: number;

    lastHit?: PlayerNumber;
    lastHitTimer: number;

    effect: PlayerEffectManager;
    speedMultiplier: number;
    jumpMultiplier: number;
    abilitySpeedMultiplier: number;
    attackMultiplier: number;
    attackRangeMultiplier: number;
    kbMultiplier: number;
    incomingKbMultiplier: number;
    damageMultiplier: number;
    healMultiplier: number;

    renderZ: number;
    render(dt: number): void;
    renderUi(dt: number): void;
    update(input: PlayerInput): void;
    onPlatformCollision(p: Platform): void;
    onPlayerCollision(p: Player): void;

    takeKb(kb: Vector2D): void;
    takeDamage(damage: number, reason: DamageReason): number;
    takeHealing(health: number, reason: HealReason): number;
    killBuff(other: Player): void;

    onDestroy(): void;

    getState(): PlayerState;
    saveState(): string;
    restoreState(state: string): void;
    restoreState(state: string): void;
}

export type PlayerData = {
    name: string;
    color: [r: number, g: number, b: number];
};

export function getPlayers(map: GameMap): Player[] {
    const players: Player[] = [];
    for (let i = 0; i < playerDatas.length; i++) {
        players.push(
            new Default(
                new RGBAColor(...playerDatas[i].color),
                i + 1 as PlayerNumber,
                playerDatas[i].name,
                players,
                map,
            ),
        );
    }

    return players;
}

const defaultTex = await loadImage(defaultImg),
    defaultTexCoord = rectToGeometry([0, 0, 16, 16]),
    defaultDeadTexCoord = rectToGeometry([16, 0, 32, 16]),
    defaultGeometry = rectToGeometry([-25, -25, 25, 25]),
    defaultHitbox = {
        type: "rect",
        offset: Vector2D.zero(),
        w: 50,
        h: 50,
    } as RectangleHitbox,
    defaultMaxKb = 3_000;
export class Default implements Player {
    color: RGBAColor;
    renderZ = 0;
    visualOffset = Vector2D.zero();
    visualDiminishConstant = -20;
    lagOffset = Vector2D.zero();
    lagDiminishConstant = -40;
    comboColor: GLColor;
    specialColor: GLColor;

    hitbox: RectangleHitbox = defaultHitbox;
    physicsBody;

    speed = 1_000;
    // airSpeed; for other classes like heavyweight and other tanks
    isGrounded = false;
    isOnWall = false;
    wallDirection = 0;
    jumpPower = 800;
    jumpTimer = 0;
    canJump = true;
    doubleJumpCount = 0;
    isPhasing = false;
    phaseTimer = 0;

    canAttack = true;
    canPressAttackKey = true;
    canPressAttackKeyTimer = 0;
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
    healTimer = 0;
    healsLeft = 0;
    isSpecialCooldown = false;

    health = 100;
    maxHealth = 100;
    respawnTimer = 0;
    isDead = false;
    healthBar: HTMLDivElement;
    healthBarChild: HTMLDivElement;
    healthText: Text;
    removeHealthBar: () => void;
    removeHealthText: () => void;

    kills = 0;
    deaths = 0;
    lives = 0;
    uiBar1: HTMLDivElement;
    uiBar1Child: HTMLDivElement;
    uiIcon1: HTMLImageElement;
    text1: Text;
    uiBar2: HTMLDivElement;
    uiBar2Child: HTMLDivElement;
    uiIcon2: HTMLImageElement;
    text2: Text;
    removeUiBar1: () => void;
    removeIcon1: () => void;
    removeText1: () => void;
    removeUiBar2: () => void;
    removeIcon2: () => void;
    removeText2: () => void;

    uiBg: HTMLDivElement;
    removeUiBg: () => void;

    lastHit?: PlayerNumber;
    lastHitTimer = 0;

    effect: PlayerEffectManager;
    speedMultiplier = 1;
    jumpMultiplier = 1;
    abilitySpeedMultiplier = 1;
    attackMultiplier = 1;
    attackRangeMultiplier = 1;
    kbMultiplier = 1;
    incomingKbMultiplier = 1;
    damageMultiplier = 1;
    healMultiplier = 1;

    constructor(
        public origColor: RGBAColor,
        public number: PlayerNumber,
        public name: string,
        public allPlayers: Player[],
        public map: GameMap,
    ) {
        this.color = new RGBAColor(
            origColor.r,
            origColor.g,
            origColor.b,
            origColor.a,
        );
        const hsv = this.color.toHSVA();
        hsv.s = 1;

        hsv.h += 0.25;
        if (hsv.h > 1) hsv.h -= 1;
        this.comboColor = hsv.toRGBA().glColor;

        hsv.h += 0.5;
        if (hsv.h > 1) hsv.h -= 1;
        this.specialColor = hsv.toRGBA().glColor;

        this.physicsBody = makePhysicsBody({
            xDrag: 0.04,
            yDrag: 0.2,
        });

        const uiCoords = playerUiCoords[this.number];

        {
            const { elem, remove } = createHTMLRender(
                "",
                "player-ui-bg",
                0,
                uiCoords,
                true,
            );

            this.uiBg = elem;
            this.removeUiBg = remove;
        }

        {
            const { elem, remove } = createHTMLRender(
                "",
                "player-ui-rect",
                0,
                Vector2D.add(uiCoords, Vector2D.xy(10, 10)),
                true,
            );

            elem.style.width = "172px";
            elem.style.height = "37px";

            this.healthBar = elem;
            this.removeHealthBar = remove;

            this.healthBarChild = this.healthBar.appendChild(
                document.createElement("div"),
            );
            this.healthBarChild.style.width = "100%";
            this.healthBarChild.style.height = "100%";
        }

        {
            const { elem, remove } = createHTMLRender(
                "",
                "player-ui-text",
                50,
                Vector2D.add(uiCoords, Vector2D.xy(15, 34)),
                true,
            );
            this.healthText = elem.appendChild(
                document.createTextNode(this.health.toPrecision(3)),
            );
            this.removeHealthText = remove;
        }

        {
            const { elem, remove } = createHTMLRender(
                "",
                "player-ui-rect",
                0,
                Vector2D.add(uiCoords, Vector2D.xy(258, 10)),
                true,
            );

            elem.style.width = "44px";
            elem.style.height = "37px";

            this.uiBar1 = elem;
            this.removeUiBar1 = remove;

            this.uiBar1Child = this.uiBar1.appendChild(
                document.createElement("div"),
            );
            this.uiBar1Child.style.width = "100%";
            this.uiBar1Child.style.height = "100%";
        }

        {
            const { elem, remove } = createHTMLRender(
                "",
                "player-ui-img",
                0,
                Vector2D.add(uiCoords, Vector2D.xy(203, 10)),
                true,
            );

            const img = elem.appendChild(document.createElement("img"));
            img.src = iconsImg;
            img.style.margin = "0 0 0 0";

            this.uiIcon1 = img;
            this.removeIcon1 = remove;
        }

        {
            const { elem, remove } = createHTMLRender(
                "",
                "player-ui-text",
                50,
                Vector2D.add(uiCoords, Vector2D.xy(263, 34)),
                true,
            );
            this.text1 = elem.appendChild(
                document.createTextNode("0"),
            );
            this.removeText1 = remove;
        }

        {
            const { elem, remove } = createHTMLRender(
                "",
                "player-ui-rect",
                0,
                Vector2D.add(uiCoords, Vector2D.xy(378, 10)),
                true,
            );

            elem.style.width = "44px";
            elem.style.height = "37px";

            this.uiBar2 = elem;
            this.removeUiBar2 = remove;

            this.uiBar2Child = this.uiBar2.appendChild(
                document.createElement("div"),
            );
            this.uiBar2Child.style.width = "100%";
            this.uiBar2Child.style.height = "100%";
        }

        if (this.map.gamemode.secondDisplay == "deaths") {
            const { elem, remove } = createHTMLRender(
                "",
                "player-ui-img",
                0,
                Vector2D.add(uiCoords, Vector2D.xy(323, 10)),
                true,
            );

            const img = elem.appendChild(document.createElement("img"));
            img.src = iconsImg;
            img.style.margin = "0 0 0 -45px";

            this.uiIcon2 = img;
            this.removeIcon2 = remove;
        } else {
            this.lives = this.map.gamemode.lives;
            const { elem, remove } = createHTMLRender(
                "",
                "player-ui-img",
                0,
                Vector2D.add(uiCoords, Vector2D.xy(323, 10)),
                true,
            );

            const img = elem.appendChild(document.createElement("img"));
            img.src = iconsImg;
            img.style.margin = "0 0 0 -90px";

            this.uiIcon2 = img;
            this.removeIcon2 = remove;
        }

        {
            const { elem, remove } = createHTMLRender(
                "",
                "player-ui-text",
                50,
                Vector2D.add(uiCoords, Vector2D.xy(383, 34)),
                true,
            );
            this.text2 = elem.appendChild(
                document.createTextNode("0"),
            );
            this.removeText2 = remove;
        }

        this.effect = new PlayerEffectManager(this);
    }

    render() {
        this.renderZ = -1 * Number(this.isDead);
        if (this.isDead) {
            drawGeometry(
                defaultTex,
                defaultDeadTexCoord,
                defaultGeometry,
                defaultRectColor,
                {
                    tint: this.color.glColor,
                    translation: this.physicsBody.pos
                        .clone()
                        .av(this.visualOffset)
                        .av(this.lagOffset),
                },
            );
        } else {
            const translation = this.physicsBody.pos.clone()
                .av(this.visualOffset)
                .av(this.lagOffset);

            drawGeometry(
                defaultTex,
                defaultTexCoord,
                defaultGeometry,
                defaultRectColor,
                { tint: this.color.glColor, translation },
            );

            if (this.combo > 0) {
                fillGeometry(
                    rectToGeometry([
                        -25 +
                        50 * (Math.max(
                                0,
                                1 -
                                    this.combo * this.comboCooldown /
                                        this.attackCooldown,
                            )),
                        -30,
                        25,
                        -40,
                    ]),
                    defaultRectColor,
                    { tint: this.comboColor, translation },
                );
            }

            if (this.attackTimer > 0) {
                fillGeometry(
                    rectToGeometry([
                        -25,
                        -30,
                        25 -
                        50 * (1 -
                                this.attackTimer / this.attackCooldown),
                        -40,
                    ]),
                    defaultRectColor,
                    { tint: this.color.glColor, translation },
                );
            } else if (this.specialTimer > 0) {
                fillGeometry(
                    rectToGeometry([
                        -25,
                        -30,
                        25 -
                        50 * (1 - this.specialTimer / this.specialCooldown),
                        -40,
                    ]),
                    defaultRectColor,
                    { tint: this.specialColor, translation },
                );
            } else if (DEBUG_HITBOXES) {
                drawHitbox(
                    {
                        type: "circle",
                        offset: Vector2D.zero(),
                        r: this.attackRange * this.attackRangeMultiplier,
                    },
                    this.physicsBody.pos,
                    [1, 0, 0, 1],
                );
            }

            if (DEBUG_HITBOXES) {
                drawHitbox(
                    {
                        type: "circle",
                        offset: Vector2D.zero(),
                        r: this.attackRange * this.attackRangeMultiplier *
                            Math.SQRT2,
                    },
                    this.physicsBody.pos,
                    [1, 0, 0, 1],
                );
            }
        }

        if (DEBUG_HITBOXES) {
            drawHitbox(
                this.hitbox,
                this.physicsBody.pos,
                [0, 1, 0.5, 1],
            );
        }
    }

    renderUi() {
        const color = this.color.toCSS(),
            darkenedColor = this.color.darken(1.3).toCSS();

        if (this.health > 1000) {
            this.healthText.textContent = this.health.toPrecision(1) + "|" +
                this.maxHealth.toPrecision(3);
        } else if (this.health > this.maxHealth) {
            this.healthText.textContent = this.health.toPrecision(3) + "|" +
                this.maxHealth;
        } else if (this.health > 0) {
            if (this.health < 0.01) {
                this.healthText.textContent = this.health.toExponential(2);
            } else this.healthText.textContent = this.health.toPrecision(3);
        } else this.healthText.textContent = "0";

        this.healthBarChild.style.width =
            (this.health / this.maxHealth * 100).toFixed(0) + "%";

        this.text1.textContent = this.kills.toFixed(0);
        if (this.map.gamemode.secondDisplay == "deaths") {
            this.text2.textContent = this.deaths.toFixed(0);
            this.uiBar1Child.style.width =
                (this.kills / this.map.gamemode.kills * 100).toFixed(0) + "%";
        } else {
            this.text2.textContent = this.lives.toFixed(0);
            this.uiBar2Child.style.width =
                (this.lives / this.map.gamemode.lives * 100).toFixed(0) + "%";
        }

        this.uiBg.style.backgroundColor = color;

        this.healthBar.style.backgroundColor = darkenedColor;
        this.uiBar1.style.backgroundColor = darkenedColor;
        this.uiBar2.style.backgroundColor = darkenedColor;

        this.healthBarChild.style.backgroundColor = color;
        this.uiBar1Child.style.backgroundColor = color;
        this.uiBar2Child.style.backgroundColor = color;
    }

    update(input: Readonly<PlayerInput>) {
        if (!this.isDead) {
            this.physicsBody.vel.x += (
                Number(input.right) -
                Number(input.left)
            ) * this.speed * this.speedMultiplier * DT / 2;
        }
        this.physicsBody.vel.y += (
            2_500 + Number(this.isGroundPounding) * 5_000 -
            Number(this.isOnWall) * 1_500
        ) * DT / 2;

        this.physicsBody.update(DT);
        this.effect.update();

        if (!this.isDead) {
            this.physicsBody.vel.x += (
                Number(input.right) -
                Number(input.left)
            ) * this.speed * this.speedMultiplier * DT / 2;
        }
        this.physicsBody.vel.y += (
            2_500 + Number(this.isGroundPounding) * 5_000 -
            Number(this.isOnWall) * 1_500
        ) * DT / 2;

        this.visualOffset.Sn(Math.exp(DT * this.visualDiminishConstant));
        this.lagOffset.Sn(Math.exp(DT * this.lagDiminishConstant));

        this.attackTimer -= DT * this.abilitySpeedMultiplier;
        this.specialTimer -= DT * this.abilitySpeedMultiplier;
        if (!this.isSpecialCooldown) {
            if (this.attackTimer <= 0) this.canAttack = true;
        } else if (this.specialTimer <= 0) {
            this.canAttack = true;
            this.isSpecialCooldown = false;
        }

        if (
            this.map.gamemode.secondDisplay == "deaths" ||
            (this.map.gamemode.secondDisplay == "lives" &&
                    this.lives > 0) &&
                this.isDead && this.lives > 0
        ) {
            this.respawnTimer -= DT;
            if (this.respawnTimer <= 0) this.respawn();
            return;
        }
        if (input.up && !this.isDead) this.jump();
        if (input.down && !this.isDead) {
            if (this.isGrounded) this.phase();
            else this.groundPound();
        }
        if (input.attack && this.canPressAttackKey && !this.isDead) {
            this.attack();
        }
        if (input.special && !this.isDead) this.special();
        this.isOnWall = this.isGrounded = false;
        this.wallDirection = 0;
        if (this.isPhasing) {
            if ((this.phaseTimer -= DT) < 0) this.isPhasing = false;
        }
        if (this.lastHit) {
            if ((this.lastHitTimer -= DT) < 0) this.lastHit = undefined;
        }
        if (this.jumpTimer > 0) {
            this.jumpTimer -= DT;
            if (this.jumpTimer <= 0 && this.doubleJumpCount > 0) {
                this.canJump = true;
            }
        }
        if (!this.canPressAttackKey) {
            this.canPressAttackKeyTimer -= DT;
            if (this.canPressAttackKeyTimer <= 0) this.canPressAttackKey = true;
        }
        if (this.healsLeft > 0) {
            this.healTimer -= DT;
            if (this.healTimer <= 0) {
                this.healsLeft--;
                this.healTimer += 1;
                this.takeHealing(
                    Math.min(this.maxHealth - this.health, 4),
                    { type: "player", player: this },
                );
            }
        }
    }

    jump() {
        if (!this.canJump) return;
        this.stopPhasing();
        this.canJump = false;

        let jumpPower: number = this.jumpPower * this.jumpMultiplier;
        if (this.isGrounded) {
            jumpPower *= 1.25;
        } else if (this.doubleJumpCount > 0) {
            this.doubleJumpCount--;
        }

        this.physicsBody.vel.y = -jumpPower;
        if (this.isOnWall) {
            this.physicsBody.vel.x = this.wallDirection * jumpPower / 2;
        }
        this.jumpTimer = .2;
    }

    phase() {
        if (this.isPhasing) return;
        this.isPhasing = true;
        this.phaseTimer = .5;
    }

    stopPhasing() {
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

        if (
            !p.isWall ||
            p.pos.y + p.hitbox.offset.y - p.hitbox.h / 2 >
                this.physicsBody.pos.y
        ) {
            const oldY = this.physicsBody.pos.y;
            this.physicsBody.pos.y = p.pos.y + p.hitbox.offset.y -
                p.hitbox.h / 2 - this.hitbox.h / 2;
            const diff = this.physicsBody.pos.y - oldY;
            if (Math.abs(diff) > 4) this.visualOffset.y -= diff;
            this.physicsBody.vel.y = Math.min(0, this.physicsBody.vel.y);

            this.isGrounded = true;
            this.canJump = true;
            this.doubleJumpCount = 2;
            return;
        }

        if (
            p.pos.y + p.hitbox.offset.y + p.hitbox.h / 2 <
                this.physicsBody.pos.y
        ) {
            const oldY = this.physicsBody.pos.y;
            this.physicsBody.pos.y = p.pos.y + p.hitbox.offset.y +
                p.hitbox.h / 2 + this.hitbox.h / 2;
            const diff = this.physicsBody.pos.y - oldY;
            if (Math.abs(diff) > 4) this.visualOffset.y -= diff;
            this.physicsBody.vel.y = Math.max(0, this.physicsBody.vel.y);
            return;
        }

        if (
            p.pos.x + p.hitbox.offset.x - p.hitbox.w / 2 >
                this.physicsBody.pos.x
        ) {
            const oldX = this.physicsBody.pos.x;
            this.physicsBody.pos.x = p.pos.x + p.hitbox.offset.x -
                p.hitbox.w / 2 - this.hitbox.w / 2;
            const diff = this.physicsBody.pos.x - oldX;
            if (Math.abs(diff) > 4) this.visualOffset.x -= diff;
            this.physicsBody.vel.x = Math.min(0, this.physicsBody.vel.x);

            this.isOnWall = true;
            this.wallDirection = -1;
            this.canJump = true;
            this.doubleJumpCount = 2;
            return;
        }

        if (
            p.pos.x + p.hitbox.offset.x + p.hitbox.w / 2 <
                this.physicsBody.pos.x
        ) {
            const oldX = this.physicsBody.pos.x;
            this.physicsBody.pos.x = p.pos.x + p.hitbox.offset.x +
                p.hitbox.w / 2 + this.hitbox.w / 2;
            const diff = this.physicsBody.pos.x - oldX;
            if (Math.abs(diff) > 4) this.visualOffset.x -= diff;
            this.physicsBody.vel.x = Math.max(0, this.physicsBody.vel.x);

            this.isOnWall = true;
            this.wallDirection = 1;
            this.canJump = true;
            this.doubleJumpCount = 2;
            return;
        }
    }

    onPlayerCollision(_: Player) {}

    attack(isGroundPound = false) {
        if (isGroundPound) this.combo = 0;
        else if (!this.canAttack) return;
        let hasHit = false;
        this.canPressAttackKey = false;
        this.canPressAttackKeyTimer = .02;

        new DefaultAttackParticle(
            this.physicsBody.pos.clone(),
            this.attackRange * this.attackRangeMultiplier *
                (isGroundPound ? Math.sqrt(2) : 1),
            this.origColor.glColor,
        );

        for (let i = 0; i < this.allPlayers.length; i++) {
            const other = this.allPlayers[i];
            if (other == this || other.isDead) continue;
            let squaredDistance = Vector2D.squaredDistance(
                this.physicsBody.pos,
                other.physicsBody.pos,
            );
            if (isGroundPound) squaredDistance /= 2;
            if (
                squaredDistance > (
                            this.attackRange * this.attackRangeMultiplier
                        ) ** 2
            ) continue;
            if (!isGroundPound) this.combo++;
            hasHit = true;

            let damage = Math.max(
                    this.attackRange / Math.sqrt(squaredDistance) * this.damage,
                    this.damage ** 1.5,
                ),
                isCrit = false;
            if (damage >= this.damage ** 2.5) {
                isCrit = true, damage = this.damage ** 2.5;
            }

            const kb = Vector2D
                .subtract(other.physicsBody.pos, this.physicsBody.pos)
                .Sn(this.attackPower);

            if (isGroundPound) {
                kb.Sn(this.jumpPower / 1000);
                damage /= 4;
            } else damage *= 1 + .5 * this.combo;

            if (!isGroundPound) other.combo = 0;
            other.takeKb(kb.Sn(this.kbMultiplier));
            other.takeDamage(
                damage * this.attackMultiplier,
                { type: "player", player: this, isCrit },
            );
        }

        if (isGroundPound) return;
        if (!hasHit) this.combo = 0;
        this.canAttack = false;
        this.attackTimer = this.attackCooldown -
            (this.combo * this.comboCooldown);
    }

    groundPound() {
        if (this.isPhasing) return;
        this.isGroundPounding = true;
    }

    special() {
        if (this.attackTimer > 0) return;
        if (this.specialTimer > 0) return;
        if (!this.canAttack) return;

        this.isSpecialCooldown = true;
        this.specialTimer = this.specialCooldown;
        this.canAttack = false;

        if (this.health >= this.maxHealth) return;
        this.healTimer = 1;
        this.healsLeft = 5;
    }

    respawn() {
        const spawnPoint = this.map.getRespawnPoint(),
            diff = Vector2D.subtract(this.physicsBody.pos, spawnPoint);
        this.visualOffset.av(diff);
        this.isDead = false;
        this.health = this.maxHealth;
        this.physicsBody.pos.av(diff.Sn(-1));
    }

    takeKb(kb: Vector2D) {
        kb.Sn((this.maxHealth / this.health) ** 2);
        const squaredMagnitude = Vector2D.squaredMagnitude(kb);
        if (squaredMagnitude > defaultMaxKb ** 2) {
            kb.Sn(defaultMaxKb / Math.sqrt(squaredMagnitude));
        }
        this.physicsBody.vel.av(kb.Sn(this.incomingKbMultiplier));
    }

    takeDamage(damage: number, reason: DamageReason) {
        const origHealth = this.health;
        this.health -= damage * this.damageMultiplier;

        switch (reason.type) {
            case "player":
                if (reason.isCrit) {
                    createHTMLTemporary(
                        `${damage.toPrecision(3)}`,
                        "critical-damage",
                        ((damage / 4) + 75) | 0,
                        this.physicsBody.pos,
                        .5 + Math.log10(damage),
                    );
                } else {
                    createHTMLTemporary(
                        `${damage.toPrecision(3)}`,
                        "damage",
                        ((damage / 4) + 50) | 0,
                        this.physicsBody.pos,
                        .2 + Math.log10(damage) / 2,
                    );
                }

                this.lastHit = reason.player.number;
                this.lastHitTimer = KILL_CREDIT_TIME;
                this.color.pulseFromGL(DAMAGE_COLOR, .25);
                break;
            case "environment":
                this.color.pulseFromGL(DAMAGE_COLOR, .25);
                break;
            case "degenerate":
                createHTMLTemporary(
                    `${damage.toPrecision(3)}`,
                    "damage degenerate",
                    ((damage / 4) + 50) | 0,
                    this.physicsBody.pos,
                    .2 + Math.log10(damage) / 2,
                );
                this.color.pulseFromGL(DEGENERATE_COLOR, .25);
                break;
            case "poison":
                createHTMLTemporary(
                    `${damage.toPrecision(3)}`,
                    "damage poison",
                    ((damage / 4) + 50) | 0,
                    this.physicsBody.pos,
                    .2 + Math.log10(damage) / 2,
                );
                this.color.pulseFromGL(POISON_COLOR, .25);
                break;
        }

        if (this.health > 0) return origHealth - this.health;
        this.health = 0;
        if (this.lives > 0) this.lives -= 1;

        if (this.lastHit) {
            const playerLastHitBy = this.allPlayers.filter(
                (p) => p.number == this.lastHit,
            )[0];
            playerLastHitBy.kills += 1;
            playerLastHitBy.killBuff(this);
            this.lastHit = undefined;
        }

        this.deaths += 1;
        this.isDead = true;

        if (
            this.map.gamemode.secondDisplay == "deaths" ||
            (this.map.gamemode.secondDisplay == "lives" &&
                this.lives > 0)
        ) {
            this.respawnTimer = 2;
        }
        return origHealth;
    }

    takeHealing(health: number, reason: HealReason) {
        if (this.isDead) return 0;

        const origHealth = this.health;
        this.health += health * this.healMultiplier;

        switch (reason.type) {
            case "player":
                createHTMLTemporary(
                    `${health.toPrecision(3)}`,
                    "heal",
                    ((health / 4) + 50) | 0,
                    this.physicsBody.pos,
                    .2 + Math.log10(health) / 2,
                );
                this.color.pulseFromGL(HEAL_COLOR, .25);
                break;
            case "environment":
                this.color.pulseFromGL(HEAL_COLOR, .25);
                break;
            case "regenerate":
                createHTMLTemporary(
                    `${health.toPrecision(3)}`,
                    "heal regenerate",
                    ((health / 4) + 50) | 0,
                    this.physicsBody.pos,
                    .2 + Math.log10(health) / 2,
                );
                this.color.pulseFromGL(REGENERATE_COLOR, .25);
                break;
        }
        return this.health - origHealth;
    }

    killBuff(_other: Player) {
        this.effect.regenerate(1, 5, 5);
        this.damage *= 1.1;
        this.speed *= 1.1;
        this.incomingKbMultiplier *= 1.1;
    }

    onDestroy() {
        this.removeUiBg();
        this.removeHealthBar();
        this.removeHealthText();
        this.removeUiBar1();
        this.removeIcon1();
        this.removeText1();
        this.removeUiBar2();
        this.removeIcon2();
        this.removeText2();
        // @ts-ignore:
        this.map = null;
        // @ts-ignore:
        this.allPlayers = null;
    }

    getState() {
        return {
            lagX: this.lagOffset.x,
            lagY: this.lagOffset.y,
            posX: this.physicsBody.pos.x,
            posY: this.physicsBody.pos.y,
            velX: this.physicsBody.vel.x,
            velY: this.physicsBody.vel.y,
            speed: this.speed,
            isGrounded: this.isGrounded,
            isOnWall: this.isOnWall,
            wallDirection: this.wallDirection,
            jumpTimer: this.jumpTimer,
            canJump: this.canJump,
            doubleJumpCount: this.doubleJumpCount,
            isPhasing: this.isPhasing,
            phaseTimer: this.phaseTimer,
            canAttack: this.canAttack,
            canPressAttackKey: this.canPressAttackKey,
            canPressAttackKeyTimer: this.canPressAttackKeyTimer,
            attackTimer: this.attackTimer,
            damage: this.damage,
            combo: this.combo,
            isGroundPounding: this.isGroundPounding,
            specialTimer: this.specialTimer,
            healsLeft: this.healsLeft,
            healTimer: this.healTimer,
            isSpecialCooldown: this.isSpecialCooldown,
            health: this.health,
            respawnTimer: this.respawnTimer,
            isDead: this.isDead,
            kills: this.kills,
            deaths: this.deaths,
            lives: this.lives,
            lastHit: this.lastHit,
            lastHitTimer: this.lastHitTimer,
            effect: this.effect.saveState(),
            speedMultiplier: this.speedMultiplier,
            jumpMultiplier: this.jumpMultiplier,
            abilitySpeedMultiplier: this.abilitySpeedMultiplier,
            attackMultiplier: this.attackMultiplier,
            kbMultiplier: this.kbMultiplier,
            incomingKbMultiplier: this.incomingKbMultiplier,
            damageMultiplier: this.damageMultiplier,
            healMultiplier: this.healMultiplier,
        };
    }

    saveState() {
        return JSON.stringify(this.getState());
    }

    restoreState(state: string) {
        const values = JSON.parse(state) as ReturnType<Default["getState"]>;
        this.lagOffset.x = values.lagX;
        this.lagOffset.y = values.lagY;
        this.physicsBody.pos.x = values.posX;
        this.physicsBody.pos.y = values.posY;
        this.physicsBody.vel.x = values.velX;
        this.physicsBody.vel.y = values.velY;
        this.speed = values.speed;
        this.isGrounded = values.isGrounded;
        this.isOnWall = values.isOnWall;
        this.wallDirection = values.wallDirection;
        this.jumpTimer = values.jumpTimer;
        this.canJump = values.canJump;
        this.doubleJumpCount = values.doubleJumpCount;
        this.isPhasing = values.isPhasing;
        this.phaseTimer = values.phaseTimer;
        this.canAttack = values.canAttack;
        this.canPressAttackKey = values.canPressAttackKey;
        this.canPressAttackKeyTimer = values.canPressAttackKeyTimer;
        this.attackTimer = values.attackTimer;
        this.damage = values.damage;
        this.combo = values.combo;
        this.isGroundPounding = values.isGroundPounding;
        this.specialTimer = values.specialTimer;
        this.healTimer = values.healTimer;
        this.healsLeft = values.healsLeft;
        this.isSpecialCooldown = values.isSpecialCooldown;
        this.health = values.health;
        this.respawnTimer = values.respawnTimer;
        this.isDead = values.isDead;
        this.kills = values.kills;
        this.deaths = values.deaths;
        this.lives = values.lives;
        this.lastHit = values.lastHit;
        this.lastHitTimer = values.lastHitTimer;
        this.effect.restoreState(values.effect);
        this.speedMultiplier = values.speedMultiplier;
        this.jumpMultiplier = values.jumpMultiplier;
        this.abilitySpeedMultiplier = values.abilitySpeedMultiplier;
        this.attackMultiplier = values.attackMultiplier;
        this.kbMultiplier = values.kbMultiplier;
        this.incomingKbMultiplier = values.incomingKbMultiplier;
        this.damageMultiplier = values.damageMultiplier;
        this.healMultiplier = values.healMultiplier;
    }
}
const defaultAttackParticleGeometry = circleToGeometry(Vector2D.zero(), 1);
class DefaultAttackParticle extends Particle {
    renderZ = -0.5;
    lifespan = 0.5;
    scale: Vector2D;

    constructor(
        public pos: Vector2D,
        radius: number,
        public color: GLColor,
    ) {
        super();
        this.scale = Vector2D.xy(radius, radius);
    }

    render() {
        fillGeometry(
            defaultAttackParticleGeometry,
            defaultCircleColor,
            {
                tint: [
                    this.color[0],
                    this.color[1],
                    this.color[2],
                    this.lifespan ** 2,
                ],
                scale: this.scale,
                translation: this.pos,
            },
        );
    }
}

type Regenerate = {
    duration: number;
    times: number;
    amount: number;
    timer: number;
};
type Degenerate = Regenerate;
type Poison = {
    duration: number;
    times: number;
    ratio: number;
    timer: number;
};
export class PlayerEffectManager {
    regenerations: Regenerate[] = [];
    degenerations: Degenerate[] = [];
    poisons: Poison[] = [];

    constructor(public player: Player) {}

    update() {
        for (const effect of this.regenerations) {
            effect.timer -= DT;
            if (effect.timer <= 0) {
                this.player.takeHealing(effect.amount, { type: "regenerate" });
                effect.times--;
                effect.timer += effect.duration;
                if (effect.times <= 0) {
                    this.regenerations = this.regenerations.filter((e) =>
                        e != effect
                    );
                }
            }
        }

        for (const effect of this.degenerations) {
            effect.timer -= DT;
            if (effect.timer <= 0) {
                this.player.takeDamage(effect.amount, { type: "degenerate" });
                effect.times--;
                effect.timer += effect.duration;
                if (effect.times <= 0) {
                    this.degenerations = this.degenerations.filter((e) =>
                        e != effect
                    );
                }
            }
        }

        for (const effect of this.poisons) {
            effect.timer -= DT;
            if (effect.timer <= 0) {
                this.player.takeDamage(
                    this.player.health * effect.ratio,
                    { type: "poison" },
                );
                effect.times--;
                effect.timer += effect.duration;
                if (effect.times <= 0) {
                    this.poisons = this.poisons.filter((e) => e != effect);
                }
            }
        }
    }

    regenerate(
        duration: number,
        times: number,
        amount: number,
        timer: number = 0,
    ) {
        this.regenerations.push({ duration, times, amount, timer });
    }

    degenerate(
        duration: number,
        times: number,
        amount: number,
        timer: number = 0,
    ) {
        this.degenerations.push({ duration, times, amount, timer });
    }

    poison(duration: number, times: number, ratio: number, timer: number = 0) {
        this.poisons.push({ duration, times, ratio, timer });
    }

    getState() {
        return {
            regenerations: this.regenerations,
            degenerations: this.degenerations,
            poisons: this.poisons,
        };
    }

    saveState(): string {
        return JSON.stringify(this.getState());
    }

    restoreState(state: string) {
        const data = JSON.parse(state) as ReturnType<
            PlayerEffectManager["getState"]
        >;
        this.regenerations = data.regenerations;
        this.degenerations = data.degenerations;
        this.poisons = data.poisons;
    }
}
