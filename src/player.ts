import iconsImg from "./assets/ui/icons.png";
import defaultImg from "./assets/classes/default.png";
import { GLColor, RGBAColor, drawGeometry, fillGeometry, loadImage, rectToGeometry, createTextTemporary, createTextRender, defaultRectColor } from "./render";
import { Vector2D } from "./math";
import { drawHitbox, Hitbox, makePhysicsBody, PhysicsBody, RectangleHitbox } from "./physics";
import { DAMAGE_COLOR, DEBUG_HITBOXES, HEAL_COLOR, KILL_CREDIT_TIME } from "./flags";
import { Platform } from "./platform";
import { isMousePressed, isPressed } from "./input";
import { clearTimer, timeout, Timer } from "./loop";
import { GameMap } from "./map";

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

const
    playerUiCoords = {
        1: Vector2D.xy(20, 20),
        2: Vector2D.xy(20, 105),
        3: Vector2D.xy(20, 190),
        4: Vector2D.xy(20, 275),
    },

    iconTex = await loadImage(iconsImg),
    killIcon = rectToGeometry([0, 0, 12, 12]),
    deathsIcon = rectToGeometry([12, 0, 24, 12]),
    livesIcon = rectToGeometry([24, 0, 36, 12]);
export type PlayerNumber = 1 | 2 | 3 | 4;
export type DamageReason
    = {
        type: 'player',
        player: Player,
        isCrit: boolean,
    }
    | {
        type: 'environment',
    };
export type HealReason
    = {
        type: 'player',
        player: Player,
    }
    | {
        type: 'environment',
    };
export interface Player {
    color: RGBAColor;
    controls: Controls;
    number: PlayerNumber;
    name: string;
    allPlayers: Player[];
    map: GameMap;

    hitbox: Hitbox;
    physicsBody: PhysicsBody;

    isGrounded: boolean;
    jumpPower: number;
    isPhasing: boolean;

    health: number;
    maxHealth: number;
    isDead: boolean;
    combo: number;

    kills: number;
    deaths: number;
    lives: number;

    lastHit?: Player;
    lastHitTimer?: Timer;

    speedMultiplier: number;
    jumpMultiplier: number;
    abilitySpeedMultiplier: number;
    attackMultiplier: number;
    attackRangeMultiplier: number;
    kbMultiplier: number;
    incomingKbMultiplier: number;
    damageMultiplier: number;
    healMultiplier: number;

    render(dt: number): void;
    renderUi(dt: number): void;
    update(dt: number): void;
    onPlatformCollision(p: Platform): void;
    onPlayerCollision(p: Player): void;

    takeKb(kb: Vector2D): void;
    takeDamage(damage: number, reason: DamageReason): void;
    takeHealing(health: number, reason: HealReason): void;

    onDestroy(): void;
};

export function getPlayers(map: GameMap): Player[] {
    const players: Player[] = [];
    players.push(
        new Default(
            new RGBAColor(1, .2, .3),
            {
                left: Binding.key('ArrowLeft'),
                up: Binding.key('ArrowUp'),
                down: Binding.key('ArrowDown'),
                right: Binding.key('ArrowRight'),
                attack: Binding.key('/'),
                special: Binding.key('.'),
            },
            1,
            "Mafia",
            players,
            map,
        ),
        new Default(
            new RGBAColor(0, .5, 1),
            {
                left: Binding.key('s'),
                up: Binding.key('e'),
                down: Binding.key('d'),
                right: Binding.key('f'),
                attack: Binding.key('w'),
                special: Binding.key('q'),
            },
            2,
            "Innocent",
            players,
            map,
        ),
        //new Default(
        //    new RGBAColor(.2, 1, .3),
        //    {
        //        left: Binding.key('aa'),
        //        up: Binding.key('aa'),
        //        down: Binding.key('aa'),
        //        right: Binding.key('aa'),
        //        attack: Binding.key('aa'),
        //        special: Binding.key('aa'),
        //    },
        //    3,
        //    "Villager",
        //    players,
        //    map,
        //),
        //new Default(
        //    new RGBAColor(1, .8, .3),
        //    {
        //        left: Binding.key('aa'),
        //        up: Binding.key('aa'),
        //        down: Binding.key('aa'),
        //        right: Binding.key('aa'),
        //        attack: Binding.key('aa'),
        //        special: Binding.key('aa'),
        //    },
        //    4,
        //    "Mayor",
        //    players,
        //    map,
        //),
    );
    return players;
}

const defaultTex = await loadImage(defaultImg),
    defaultTexCoord = rectToGeometry([0, 0, 16, 16]),
    defaultDeadTexCoord = rectToGeometry([16, 0, 32, 16]),
    defaultGeometry = rectToGeometry([-25, -25, 25, 25]),
    defaultHitbox = {
        type: 'rect',
        offset: Vector2D.zero(),
        w: 50,
        h: 50,
    },
    defaultUiBorder = rectToGeometry([0, 0, 447, 65]),
    defaultUiBorderColor: GLColor = [.3, .3, .3, 1],
    defaultUiAnimConstant = Math.log(1e-16),
    defaultHealthBarBg = rectToGeometry([257, 10, 437, 55]),
    defaultKillIcon = rectToGeometry([10, 10, 58, 58]),
    defaultKillBarBg = rectToGeometry([65, 10, 117, 55]),
    defaultDeathsOrLivesIcon = rectToGeometry([130, 10, 178, 58]),
    defaultDeathsOrLivesBarBg = rectToGeometry([185, 10, 237, 55]),
    defaultMaxKb = 3_000;
export class Default implements Player {
    visualOffset = Vector2D.zero();
    visualDiminishConstant = -20;
    comboColor: GLColor;
    specialColor: GLColor;

    hitbox: RectangleHitbox = defaultHitbox as RectangleHitbox;
    physicsBody;

    speed = 1_000;
    // airSpeed; for other classes
    isGrounded = false;
    jumpPower = 800;
    canJump = true;
    doubleJumpCount = 0;
    isPhasing = false;
    phaseTimeout?: Timer;

    canAttack = true;
    canPressAttackKey = true;
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

    animHealth = 100;
    health = 100;
    maxHealth = 100;
    isDead = false;
    healthText: Text;
    removeHealthText: () => void;

    kills = 0;
    killsText: Text;
    removeKillsText: () => void;

    deaths = 0;
    deathsText?: Text;
    removeDeathsText?: () => void;

    lives = 0;
    livesText?: Text;
    removeLivesText?: () => void;

    lastHit?: Player;
    lastHitTimer?: Timer;

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
        public color: RGBAColor,
        public controls: Controls,
        public number: 1 | 2 | 3 | 4,
        public name: string,
        public allPlayers: Player[],
        public map: GameMap,
    ) {
        const hsv = color.toHSVA();
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

        {
            const { elem, remove } = createTextRender(
                "",
                "player-ui",
                50,
                Vector2D.add(
                    playerUiCoords[this.number],
                    Vector2D.xy(262, 34),
                ),
                true,
            );
            this.healthText = elem.appendChild(
                document.createTextNode(this.health.toPrecision(3)),
            );
            this.removeHealthText = remove;
        }

        {
            const { elem, remove } = createTextRender(
                "",
                "player-ui",
                50,
                Vector2D.add(
                    playerUiCoords[this.number],
                    Vector2D.xy(70, 34),
                ),
                true,
            );
            this.killsText = elem.appendChild(
                document.createTextNode(this.kills.toFixed(0)),
            );
            this.removeKillsText = remove;
        }

        if (this.map.gamemode.secondDisplay == "deaths") {
            const { elem, remove } = createTextRender(
                "",
                "player-ui",
                50,
                Vector2D.add(
                    playerUiCoords[this.number],
                    Vector2D.xy(190, 34),
                ),
                true,
            );
            this.deathsText = elem.appendChild(
                document.createTextNode(this.kills.toFixed(0)),
            );
            this.removeDeathsText = remove;
        } else {
            this.lives = this.map.gamemode.lives;
            const { elem, remove } = createTextRender(
                "",
                "player-ui",
                50,
                Vector2D.add(
                    playerUiCoords[this.number],
                    Vector2D.xy(190, 34),
                ),
                true,
            );
            this.livesText = elem.appendChild(
                document.createTextNode(this.lives.toFixed(0)),
            );
            this.removeLivesText = remove;
        }
    }

    render() {
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
                        .av(this.visualOffset),
                },
            );
        } else {
            const translation = this.physicsBody.pos.clone()
                .av(this.visualOffset);

            drawGeometry(
                defaultTex,
                defaultTexCoord,
                defaultGeometry,
                defaultRectColor,
                { tint: this.color.glColor, translation },
            );

            if (this.combo > 0) fillGeometry(
                rectToGeometry([
                    -25 +
                    50 * (Math.max(0, 1 -
                        this.combo * this.comboCooldown /
                        this.attackCooldown)),
                    -30,
                    25,
                    -40,
                ]),
                defaultRectColor,
                { tint: this.comboColor, translation },
            );

            if (this.attackTimer > 0) fillGeometry(
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
            else if (this.specialTimer > 0) fillGeometry(
                rectToGeometry([
                    -25, -30,
                    25 -
                    50 * (1 - this.specialTimer / this.specialCooldown),
                    -40,
                ]),
                defaultRectColor,
                { tint: this.specialColor, translation },
            );
            else if (DEBUG_HITBOXES) drawHitbox({
                type: 'circle',
                offset: Vector2D.zero(),
                r: this.attackRange * this.attackRangeMultiplier,
            }, this.physicsBody.pos, [1, 0, 0, 1]);

            if (DEBUG_HITBOXES) drawHitbox({
                type: 'circle',
                offset: Vector2D.zero(),
                r: this.attackRange * this.attackRangeMultiplier * Math.SQRT2,
            }, this.physicsBody.pos, [1, 0, 0, 1]);
        }

        if (DEBUG_HITBOXES) drawHitbox(
            this.hitbox,
            this.physicsBody.pos,
            [0, 1, 0.5, 1],
        );
    }

    renderUi(dt: number) {
        const tint = this.color.glColor,
            translation = playerUiCoords[this.number],
            darkened = this.color.darken(1.5).glColor;

        this.animHealth += (this.health - this.animHealth) *
            Math.exp(dt * defaultUiAnimConstant);

        if (this.health > 0)
            if (this.health < 0.01)
                this.healthText.textContent = this.health.toExponential(2);
            else this.healthText.textContent = this.health.toPrecision(3);
        else this.healthText.textContent = "0";

        this.killsText.textContent = this.kills.toFixed(0);

        fillGeometry(
            defaultUiBorder,
            defaultRectColor,
            {
                tint: defaultUiBorderColor,
                translation,
            },
        );

        fillGeometry(
            defaultHealthBarBg,
            defaultRectColor,
            {
                tint: darkened,
                translation,
            },
        );

        fillGeometry(
            rectToGeometry([
                257,
                10,
                257 + 180 * (this.animHealth / this.maxHealth),
                55,
            ]),
                defaultRectColor,
            {
                tint,
                translation,
            },
        );

        drawGeometry(
            iconTex,
            killIcon,
            defaultKillIcon,
                defaultRectColor,
            {
                tint,
                translation,
            },
        );

        if (this.map.gamemode.secondDisplay == "deaths") {
            this.deathsText!.textContent = this.deaths.toFixed(0);

            fillGeometry(
                defaultKillBarBg,
                defaultRectColor,
                {
                    tint: darkened,
                    translation,
                },
            );

            fillGeometry(
                rectToGeometry([
                    65,
                    10,
                    65 + 52 * Math.min(this.kills / this.map.gamemode.kills, 1),
                    55,
                ]),
                defaultRectColor,
                {
                    tint,
                    translation,
                },
            );

            drawGeometry(
                iconTex,
                deathsIcon,
                defaultDeathsOrLivesIcon,
                defaultRectColor,
                {
                    tint,
                    translation,
                },
            );

            fillGeometry(
                defaultDeathsOrLivesBarBg,
                defaultRectColor,
                {
                    tint,
                    translation,
                },
            );
        } else {
            this.livesText!.textContent = this.lives.toFixed(0);

            fillGeometry(
                defaultKillBarBg,
                defaultRectColor,
                {
                    tint,
                    translation,
                },
            );

            drawGeometry(
                iconTex,
                livesIcon,
                defaultDeathsOrLivesIcon,
                defaultRectColor,
                {
                    tint,
                    translation,
                },
            );

            fillGeometry(
                defaultDeathsOrLivesBarBg,
                defaultRectColor,
                {
                    tint: darkened,
                    translation,
                },
            );

            fillGeometry(
                rectToGeometry([
                    185,
                    10,
                    185 + 52 * Math.min(this.lives / this.map.gamemode.lives, 1),
                    55,
                ]),
                defaultRectColor,
                {
                    tint,
                    translation,
                },
            );
        }
    }

    update(dt: number) {
        this.physicsBody.vel.y += 2_500 * dt;
        if (this.isGroundPounding) this.physicsBody.vel.y += 5_000 * dt;
        this.physicsBody.update(dt);
        this.visualOffset.Sn(Math.exp(dt * this.visualDiminishConstant));

        this.attackTimer -= dt * this.abilitySpeedMultiplier;
        this.specialTimer -= dt * this.abilitySpeedMultiplier;
        if (!this.isSpecialCooldown) {
            if (this.attackTimer <= 0) this.canAttack = true;
        } else if (this.specialTimer <= 0) {
            this.canAttack = true;
            this.isSpecialCooldown = false;
        }

        if (this.isDead) return;
        const sped = this.speed * this.speedMultiplier * dt;
        if (isControlDown(this.controls.left)) this.physicsBody.vel.x -= sped;
        if (isControlDown(this.controls.right)) this.physicsBody.vel.x += sped;
        if (isControlDown(this.controls.up)) this.jump();
        if (isControlDown(this.controls.down)) {
            if (this.isGrounded) this.phase();
            else this.groundPound();
        }
        if (this.canPressAttackKey && isControlDown(this.controls.attack))
            this.attack();
        if (isControlDown(this.controls.special)) this.special();
        this.isGrounded = false;
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
        if (this.doubleJumpCount == 0) return;
        timeout(() => this.canJump = true, .2);
    }

    phase() {
        if (this.isPhasing) return;
        this.isPhasing = true;
        this.phaseTimeout = timeout(() => this.isPhasing = false, .5);
    }

    stopPhasing() {
        clearTimer(this.phaseTimeout!);
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
        if (isGroundPound) this.combo = 0;
        else if (!this.canAttack) return;
        let hasHit = false;
        this.canPressAttackKey = false;
        timeout(() => this.canPressAttackKey = true, .15);

        for (let i = 0; i < this.allPlayers.length; i++) {
            const other = this.allPlayers[i];
            if (other == this || other.isDead) continue;
            let squaredDistance = Vector2D.squaredDistance(
                this.physicsBody.pos,
                other.physicsBody.pos,
            );
            if (isGroundPound) squaredDistance /= 2;
            if (squaredDistance > (
                this.attackRange * this.attackRangeMultiplier
            ) ** 2) continue;
            if (!isGroundPound) this.combo++;
            hasHit = true;

            let damage = Math.max(
                this.attackRange / Math.sqrt(squaredDistance) * this.damage,
                this.damage ** 1.5,
            ), isCrit = false;
            if (damage >= this.damage ** 2.5)
                isCrit = true, damage = this.damage ** 2.5;

            const kb = Vector2D
                .subtract(other.physicsBody.pos, this.physicsBody.pos)
                .Sn(this.attackPower);

            if (isGroundPound) {
                kb.Sn(this.jumpPower / 1000);
                damage /= 4;
            } else damage *= (1 + .5 * this.combo);

            other.combo = 0;
            other.takeKb(kb.Sn(this.kbMultiplier));
            other.takeDamage(
                damage * this.attackMultiplier,
                { type: 'player', player: this, isCrit },
            );
        }

        if (isGroundPound) return;
        if (!hasHit) this.combo = 0;
        this.canAttack = false;
        this.attackTimer = this.attackCooldown
            - (this.combo * this.comboCooldown);
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
        for (let i = 0; i < 5; i++) timeout(
            () => this.takeHealing(
                Math.min(this.maxHealth - this.health, 4),
                { type: 'player', player: this },
            ),
            i,
        );
    }

    respawn() {
        timeout(() => {
            const spawnPoint = this.map.getRespawnPoint(),
                diff = Vector2D.subtract(this.physicsBody.pos, spawnPoint);
            this.visualOffset.av(diff);
            this.isDead = false;
            this.health = this.maxHealth;
            this.physicsBody.pos.av(diff.Sn(-1));
        }, 2);
    }

    takeKb(kb: Vector2D) {
        kb.Sn((this.maxHealth / this.health) ** 2)
        const squaredMagnitude = Vector2D.squaredMagnitude(kb);
        if (squaredMagnitude > defaultMaxKb ** 2)
            kb.Sn(defaultMaxKb / Math.sqrt(squaredMagnitude));
        this.physicsBody.vel.av(kb.Sn(this.incomingKbMultiplier));
    }

    takeDamage(damage: number, reason: DamageReason) {
        this.health -= damage * this.damageMultiplier;
        this.color.pulseFromGL(DAMAGE_COLOR, .25);

        if (reason.type == 'player') {
            if (reason.isCrit) createTextTemporary(
                `${damage.toPrecision(3)}`,
                "critical-damage",
                ((damage / 4) + 75) | 0,
                this.physicsBody.pos,
                .5 + Math.log10(damage),
            );
            else createTextTemporary(
                `${damage.toPrecision(3)}`,
                "damage",
                ((damage / 4) + 50) | 0,
                this.physicsBody.pos,
                .2 + Math.log10(damage) / 2,
            );

            this.lastHit = reason.player;
            if (this.lastHitTimer) clearTimer(this.lastHitTimer);
            this.lastHitTimer = timeout(
                () => this.lastHit = undefined,
                KILL_CREDIT_TIME,
            );
        }

        if (this.health > 0) return;
        this.health = 0;
        if (this.lives > 0) this.lives -= 1;

        if (this.lastHit) {
            this.lastHit.kills += 1;
            this.lastHit = undefined;
        }
        if (this.lastHitTimer) clearTimer(this.lastHitTimer);

        this.deaths += 1;
        this.isDead = true;

        if (
            this.map.gamemode.secondDisplay == 'deaths' ||
            (this.map.gamemode.secondDisplay == 'lives' &&
                this.lives > 0)
        ) this.respawn();
    }

    takeHealing(health: number, reason: HealReason) {
        if (this.isDead) return;
        this.health += health * this.healMultiplier;
        this.color.pulseFromGL(HEAL_COLOR, .25);

        if (reason.type == "player") {
            createTextTemporary(
                `${health.toPrecision(3)}`,
                "heal",
                ((health / 4) + 50) | 0,
                this.physicsBody.pos,
                .2 + Math.log10(health) / 2,
            );
        }
    }

    onDestroy() {
        this.removeHealthText();
        this.removeKillsText();
        if (this.removeDeathsText) this.removeDeathsText();
        if (this.removeLivesText) this.removeLivesText();
        // @ts-ignore
        this.map = null;
        // @ts-ignore
        this.players = null;
    }
}
