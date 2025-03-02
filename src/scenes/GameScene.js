import { GAME_CONSTANTS } from '../constants.js';
import { AssetKeys } from '../constants/AssetKeys.js';
import { SceneKeys } from '../constants/SceneKeys.js';
import { update } from '../update.js';

export class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: SceneKeys.GAME_SCENE });
    }

    preload() {
        this.load.image(AssetKeys.BACKGROUND, 'assets/images/bg.avif');
        this.load.image(AssetKeys.SHIP, 'assets/images/shuttle.png');
        this.load.image(AssetKeys.BULLET, 'assets/images/bullet.png');
        this.load.image(AssetKeys.ASTEROID, 'assets/images/asteroid.png');
        this.load.image(AssetKeys.START_IMAGE, 'assets/images/start.png');
        this.load.audio(AssetKeys.FIRE_SOUND, 'assets/sounds/fire.mp3');
        this.load.audio(AssetKeys.ASTEROID_EXPLOSION_SOUND, 'assets/sounds/asteroid-explosion.mp3');
        this.load.audio(AssetKeys.SHIP_EXPLOSION_SOUND, 'assets/sounds/ship-explosion.mp3');
        this.load.audio(AssetKeys.BACKGROUND_MUSIC, 'assets/bgm/1.mp3');
        this.load.spritesheet(AssetKeys.EXPLOSION, 'assets/images/explosion.png', {
            frameWidth: 64,
            frameHeight: 64
        });
    }

    create() {
        const width = this.scale.width;
        const height = this.scale.height;

        this.add.image(0, 0, 'background')
            .setOrigin(0, 0)
            .setDisplaySize(width, height);

        this.player = this.add.sprite(width / 2, height / 2, 'ship');
        this.physics.add.existing(this.player);
        this.player.body.setCollideWorldBounds(true);

        this.bullets = this.physics.add.group();
        this.enemies = this.physics.add.group();

        this.fireSound = this.sound.add(AssetKeys.FIRE_SOUND);
        this.fireSound.setVolume(GAME_CONSTANTS.SOUND.FIRE_VOLUME);

        this.asteroidExplosionSound = this.sound.add(AssetKeys.ASTEROID_EXPLOSION_SOUND);
        this.asteroidExplosionSound.setVolume(GAME_CONSTANTS.SOUND.ASTEROID_EXPLOSION_VOLUME);

        this.shipExplosionSound = this.sound.add(AssetKeys.SHIP_EXPLOSION_SOUND);
        this.shipExplosionSound.setVolume(GAME_CONSTANTS.SOUND.SHIP_EXPLOSION_VOLUME);

        this.bgMusic = this.sound.add(AssetKeys.BACKGROUND_MUSIC, { loop: true });
        this.bgMusic.setVolume(GAME_CONSTANTS.SOUND.BGM_VOLUME);
        this.bgMusic.play();

        this.anims.create({
            key: 'explode',
            frames: this.anims.generateFrameNumbers('explosion', { start: 0, end: 15 }),
            frameRate: 30,
            repeat: 0,
            hideOnComplete: true
        });

        this.scoreText = this.add.text(this.scale.width / 2, this.scale.height - 50, 'Score: 0', {
            fontSize: '32px',
            fill: '#fff'
        }).setOrigin(0.5);

        this.highScoreText = this.add.text(this.scale.width / 2, this.scale.height - 90, 'High Score: ' + (localStorage.getItem('highScore') || '0'), {
            fontSize: '32px',
            fill: '#ffd700'
        }).setOrigin(0.5);

        this.physics.add.collider(this.bullets, this.enemies, (bullet, enemy) => {
            const explosion = this.add.sprite(enemy.x, enemy.y, 'explosion');
            explosion.play('explode');
            bullet.destroy();
            enemy.destroy();
            this.asteroidExplosionSound.play();
            this.score += 10;
            this.scoreText.setText('Score: ' + this.score);
        });

        this.physics.add.collider(this.player, this.enemies, (player, enemy) => {
            this.bgMusic.stop();
            this.enemies.clear(true, true);
            this.bullets.clear(true, true);
            player.destroy();
            enemy.destroy();
            this.shipExplosionSound.play();

            // Handle high score
            const currentHighScore = localStorage.getItem('highScore');
            if (!currentHighScore || this.score > parseInt(currentHighScore)) {
                localStorage.setItem('highScore', this.score);
            }

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
                this.score = 0;
                this.scene.restart();
                this.bgMusic.play();
            });
        });

        this.input.on('pointermove', (pointer) => {
            this.targetX = pointer.x;
            this.targetY = pointer.y;
        });

        this.targetX = this.player.x;
        this.targetY = this.player.y;

        this.score = 0;
        this.gamePaused = false;
        
        // Initialize time-related variables
        this.lastEnemySpawn = 0;
        this.lastFireRateUpdate = 0;
        this.lastAutoShot = 0;
        this.currentFireRate = GAME_CONSTANTS.FIRE_RATE.INITIAL;
    }

    update() {
        update.call(this);
    }
}