const GAME_CONSTANTS = {
    FIRE_RATE: {
        INITIAL: 800,
        DECREASE: 10,
        MIN_LIMIT: 200,
        UPDATE_INTERVAL: 10000
    },
    PLAYER: {
        SPEED: 300
    },
    SOUND: {
        BGM_VOLUME: 1,
        FIRE_VOLUME: 0.4,
        ASTEROID_EXPLOSION_VOLUME: 0.9,
        SHIP_EXPLOSION_VOLUME: 0.6
    }
};

let targetX;
let targetY;
let gamePaused = true;  // Add this line
let currentFireRate = GAME_CONSTANTS.FIRE_RATE.INITIAL;
let lastFireRateUpdate = 0;
let lastAutoShot = 0;
let lastEnemySpawn = 0;
let score = 0;
let scoreText;
let lastTimeBonus = 0;
let player;
let bullets;
let enemies;

const config = {
    type: Phaser.AUTO,
    scale: {
        mode: Phaser.Scale.RESIZE,
        parent: 'game',
        width: '100%',
        height: '100%',
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

const game = new Phaser.Game(config);

function preload() {
    this.load.image('background', 'assets/images/bg.avif');
    this.load.image('ship', 'assets/images/shuttle.png');
    this.load.image('bullet', 'assets/images/bullet.png');
    this.load.image('asteroid', 'assets/images/asteroid.png');
    this.load.audio('fireSound', 'assets/sounds/fire.mp3');
    this.load.audio('asteroidExplosion', 'assets/sounds/asteroid-explosion.mp3');
    this.load.audio('shipExplosion', 'assets/sounds/ship-explosion.mp3');
    this.load.audio('bgMusic', 'assets/bgm/1.mp3');
    this.load.spritesheet('explosion', 'assets/images/explosion.png', {
        frameWidth: 64,
        frameHeight: 64
    });
}

function create() {
    const width = this.scale.width;
    const height = this.scale.height;

    this.add.image(0, 0, 'background')
        .setOrigin(0, 0)
        .setDisplaySize(width, height);

    player = this.add.sprite(width / 2, height / 2, 'ship');
    this.physics.add.existing(player);
    player.body.setCollideWorldBounds(true);

    bullets = this.physics.add.group();
    enemies = this.physics.add.group();

    this.fireSound = this.sound.add('fireSound');
    this.fireSound.setVolume(GAME_CONSTANTS.SOUND.FIRE_VOLUME);

    this.asteroidExplosionSound = this.sound.add('asteroidExplosion');
    this.asteroidExplosionSound.setVolume(GAME_CONSTANTS.SOUND.ASTEROID_EXPLOSION_VOLUME);

    this.shipExplosionSound = this.sound.add('shipExplosion');
    this.shipExplosionSound.setVolume(GAME_CONSTANTS.SOUND.SHIP_EXPLOSION_VOLUME);

    this.bgMusic = this.sound.add('bgMusic', { loop: true });
    this.bgMusic.setVolume(GAME_CONSTANTS.SOUND.BGM_VOLUME);
    this.bgMusic.play();

    this.anims.create({
        key: 'explode',
        frames: this.anims.generateFrameNumbers('explosion', { start: 0, end: 15 }),
        frameRate: 30,
        repeat: 0,
        hideOnComplete: true
    });

    scoreText = this.add.text(this.scale.width / 2, this.scale.height - 50, 'Score: 0', {
        fontSize: '32px',
        fill: '#fff'
    }).setOrigin(0.5);

    this.physics.add.collider(bullets, enemies, (bullet, enemy) => {
        const explosion = this.add.sprite(enemy.x, enemy.y, 'explosion');
        explosion.play('explode');
        bullet.destroy();
        enemy.destroy();
        this.asteroidExplosionSound.play();
        score += 10;
        scoreText.setText('Score: ' + score);
    });

    this.physics.add.collider(player, enemies, (player, enemy) => {
        this.bgMusic.stop();  // This line already exists
        enemies.clear(true, true);
        bullets.clear(true, true);
        player.destroy();
        enemy.destroy();
        this.shipExplosionSound.play();

        const gameOverText = this.add.text(this.scale.width / 2, this.scale.height / 2, 'Game Over', {
            fontSize: '64px',
            fill: '#ff0000',
            fontStyle: 'bold',
            backgroundColor: '#000000',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5);

        this.physics.pause();

        this.time.delayedCall(8000, () => {
            this.physics.resume();
            score = 0;
            this.scene.restart();
            this.bgMusic.play();  // Restart BGM when game restarts
        });
    });

    this.input.on('pointermove', (pointer) => {
        targetX = pointer.x;
        targetY = pointer.y;
    });

    targetX = player.x;
    targetY = player.y;

    // After creating scoreText, add:
    const startText = this.add.text(this.scale.width / 2, this.scale.height / 2, 'Touch to Start', {
        fontSize: '48px',
        fill: '#fff',
        backgroundColor: '#000000',
        padding: { x: 20, y: 10 }
    }).setOrigin(0.5);

    this.input.on('pointerdown', () => {
        if (gamePaused) {
            gamePaused = false;
            startText.destroy();
            this.physics.resume();
            this.bgMusic.resume();  // Resume BGM when game starts/resumes
        }
    });

    this.input.on('pointerup', () => {
        if (!gamePaused) {
            gamePaused = true;
            this.add.text(this.scale.width / 2, this.scale.height / 2, 'Paused', {
                fontSize: '48px',
                fill: '#fff',
                backgroundColor: '#000000',
                padding: { x: 20, y: 10 }
            }).setOrigin(0.5);
            this.physics.pause();
            this.bgMusic.pause();  // Pause BGM when game pauses
        }
    });

    // At the end of create function
    this.physics.pause();  // Start the game paused
}

function update() {
    if (gamePaused) return;  // Add this line at the start of update

    if (this.time.now > lastTimeBonus + 10000) {
        score += 100;
        scoreText.setText('Score: ' + score);
        lastTimeBonus = this.time.now;
    }

    if (this.time.now > lastFireRateUpdate + GAME_CONSTANTS.FIRE_RATE.UPDATE_INTERVAL) {
        currentFireRate = Math.max(
            currentFireRate - GAME_CONSTANTS.FIRE_RATE.DECREASE,
            GAME_CONSTANTS.FIRE_RATE.MIN_LIMIT
        );
        lastFireRateUpdate = this.time.now;
    }

    if (player && player.body && this.time.now > lastAutoShot + currentFireRate) {
        const bullet = bullets.create(
            player.x,
            player.y - player.height / 2,
            'bullet'
        );
        bullet.setVelocityY(-400);
        this.fireSound.play();
        bullet.checkWorldBounds = true;
        bullet.outOfBoundsKill = true;
        lastAutoShot = this.time.now;
    }

    if (player && player.body) {
        const angle = Phaser.Math.Angle.Between(player.x, player.y, targetX, targetY);
        const distance = Phaser.Math.Distance.Between(player.x, player.y, targetX, targetY);

        if (distance > 5) {
            const velocityX = Math.cos(angle) * GAME_CONSTANTS.PLAYER.SPEED;
            const velocityY = Math.sin(angle) * GAME_CONSTANTS.PLAYER.SPEED;
            player.body.setVelocity(velocityX, velocityY);
        } else {
            player.body.setVelocity(0, 0);
        }
    }

    if (this.time.now > lastEnemySpawn + 1000) {
        const margin = 50;
        const x = Phaser.Math.Between(margin, this.scale.width - margin);
        const enemy = enemies.create(x, -20, 'asteroid');
        const speed = Phaser.Math.Between(150, 250);
        enemy.setVelocityY(speed);
        enemy.checkWorldBounds = true;
        enemy.outOfBoundsKill = true;
        lastEnemySpawn = this.time.now;
    }
}
