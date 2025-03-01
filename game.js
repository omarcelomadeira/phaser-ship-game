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

let player;
let cursors;
let bullets;
let lastShot = 0;
// Add after the existing variables
let lastEnemySpawn = 0;
let enemies;

function preload() {
    this.load.image('background', 'assets/images/bg.avif');
    this.load.image('ship', 'assets/images/shuttle.png');
    this.load.image('bullet', 'assets/images/bullet.png');
    this.load.image('asteroid', 'assets/images/asteroid.png');
    this.load.audio('fireSound', 'assets/sounds/fire.mp3');
    this.load.audio('asteroidExplosion', 'assets/sounds/asteroid-explosion.mp3');
    this.load.audio('shipExplosion', 'assets/sounds/ship-explosion.mp3');
    this.load.spritesheet('explosion', 'assets/images/explosion.png', {
        frameWidth: 64,
        frameHeight: 64
    });
}

// Add after other global variables
let score = 0;
let scoreText;
let lastTimeBonus = 0;

function create() {
    // Get current game size
    const width = this.scale.width;
    const height = this.scale.height;

    // Add background
    this.add.image(0, 0, 'background')
        .setOrigin(0, 0)
        .setDisplaySize(width, height);

    // Create player as a sprite
    player = this.add.sprite(
        width / 2,
        height / 2,
        'ship'
    );

    // Enable physics on the player
    this.physics.add.existing(player);

    // Set player properties
    player.body.setCollideWorldBounds(true);

    // Create bullet group
    bullets = this.physics.add.group();

    // Create enemies group
    enemies = this.physics.add.group();

    // Setup WASD keys and spacebar
    cursors = this.input.keyboard.addKeys({
        up: Phaser.Input.Keyboard.KeyCodes.W,
        down: Phaser.Input.Keyboard.KeyCodes.S,
        left: Phaser.Input.Keyboard.KeyCodes.A,
        right: Phaser.Input.Keyboard.KeyCodes.D,
        shoot: Phaser.Input.Keyboard.KeyCodes.SPACE
    });

    // Add sound
    this.fireSound = this.sound.add('fireSound');
    this.asteroidExplosionSound = this.sound.add('asteroidExplosion');
    this.shipExplosionSound = this.sound.add('shipExplosion');

    // Add collision between bullets and enemies
    // Create explosion animation
    this.anims.create({
        key: 'explode',
        frames: this.anims.generateFrameNumbers('explosion', { start: 0, end: 15 }),
        frameRate: 30,
        repeat: 0,
        hideOnComplete: true
    });

    // Add score text at the bottom center
    scoreText = this.add.text(this.scale.width / 2, this.scale.height - 50, 'Score: 0', {
        fontSize: '32px',
        fill: '#fff'
    }).setOrigin(0.5);

    // Update collision handler to include score
    this.physics.add.collider(bullets, enemies, (bullet, enemy) => {
        const explosion = this.add.sprite(enemy.x, enemy.y, 'explosion');
        explosion.play('explode');
        bullet.destroy();
        enemy.destroy();
        this.asteroidExplosionSound.play();

        // Increment and update score
        score += 10;
        scoreText.setText('Score: ' + score);
    });

    // Update player collision to reset score
    this.physics.add.collider(player, enemies, (player, enemy) => {
        player.destroy();
        enemy.destroy();
        this.shipExplosionSound.play();
        score = 0;  // Reset score
        this.scene.restart();
    });
}

function update() {
    const speed = 300;

    // Reset velocity
    player.body.setVelocity(0);

    // Horizontal movement
    if (cursors.left.isDown) {
        player.body.setVelocityX(-speed);
    } else if (cursors.right.isDown) {
        player.body.setVelocityX(speed);
    }

    // Vertical movement
    if (cursors.up.isDown) {
        player.body.setVelocityY(-speed);
    } else if (cursors.down.isDown) {
        player.body.setVelocityY(speed);
    }

    // Normalize diagonal movement
    if (player.body.velocity.x !== 0 && player.body.velocity.y !== 0) {
        player.body.setVelocity(
            player.body.velocity.x * 0.707,
            player.body.velocity.y * 0.707
        );
    }

    // Shooting logic
    if (cursors.shoot.isDown && this.time.now > lastShot + 250) {
        const bullet = bullets.create(
            player.x,
            player.y - player.height / 2,
            'bullet'
        );
        bullet.setVelocityY(-400);

        // Play sound effect
        this.fireSound.play();

        // Destroy bullet when it goes off screen
        bullet.checkWorldBounds = true;
        bullet.outOfBoundsKill = true;

        lastShot = this.time.now;
    }

    // Enemy spawn logic
    if (this.time.now > lastEnemySpawn + 1000) {
        const margin = 50;
        const x = Phaser.Math.Between(margin, this.scale.width - margin);
        const enemy = enemies.create(x, -20, 'asteroid');

        // Random speed between 150 and 250
        const speed = Phaser.Math.Between(150, 250);
        enemy.setVelocityY(speed);

        // Destroy enemy when it goes off screen
        enemy.checkWorldBounds = true;
        enemy.outOfBoundsKill = true;

        lastEnemySpawn = this.time.now;
    }

    // Initialize time bonus
    lastTimeBonus = this.time.now;
}

function update() {
    // Add at the beginning of update function
    // Check for time bonus (every 10 seconds)
    if (this.time.now > lastTimeBonus + 10000) {
        score += 100;
        scoreText.setText('Score: ' + score);
        lastTimeBonus = this.time.now;
    }

    const speed = 300;

    // Reset velocity
    player.body.setVelocity(0);

    // Horizontal movement
    if (cursors.left.isDown) {
        player.body.setVelocityX(-speed);
    } else if (cursors.right.isDown) {
        player.body.setVelocityX(speed);
    }

    // Vertical movement
    if (cursors.up.isDown) {
        player.body.setVelocityY(-speed);
    } else if (cursors.down.isDown) {
        player.body.setVelocityY(speed);
    }

    // Normalize diagonal movement
    if (player.body.velocity.x !== 0 && player.body.velocity.y !== 0) {
        player.body.setVelocity(
            player.body.velocity.x * 0.707,
            player.body.velocity.y * 0.707
        );
    }

    // Shooting logic
    if (cursors.shoot.isDown && this.time.now > lastShot + 250) {
        const bullet = bullets.create(
            player.x,
            player.y - player.height / 2,
            'bullet'
        );
        bullet.setVelocityY(-400);

        // Play sound effect
        this.fireSound.play();

        // Destroy bullet when it goes off screen
        bullet.checkWorldBounds = true;
        bullet.outOfBoundsKill = true;

        lastShot = this.time.now;
    }

    // Enemy spawn logic
    if (this.time.now > lastEnemySpawn + 1000) {
        const margin = 50;
        const x = Phaser.Math.Between(margin, this.scale.width - margin);
        const enemy = enemies.create(x, -20, 'asteroid');

        // Random speed between 150 and 250
        const speed = Phaser.Math.Between(150, 250);
        enemy.setVelocityY(speed);

        // Destroy enemy when it goes off screen
        enemy.checkWorldBounds = true;
        enemy.outOfBoundsKill = true;

        lastEnemySpawn = this.time.now;
    }
}
