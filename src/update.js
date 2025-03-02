import { GAME_CONSTANTS } from './constants.js';

export function update() {
    if (this.gamePaused) return;



    if (this.time.now > this.lastFireRateUpdate + GAME_CONSTANTS.FIRE_RATE.UPDATE_INTERVAL) {
        this.currentFireRate = Math.max(
            this.currentFireRate - GAME_CONSTANTS.FIRE_RATE.DECREASE,
            GAME_CONSTANTS.FIRE_RATE.MIN_LIMIT
        );
        this.lastFireRateUpdate = this.time.now;
    }

    if (this.player && this.player.body && this.time.now > this.lastAutoShot + this.currentFireRate) {
        const bullet = this.bullets.create(
            this.player.x,
            this.player.y - this.player.height / 2,
            'bullet'
        );
        bullet.setVelocityY(-400);
        this.fireSound.play();
        bullet.checkWorldBounds = true;
        bullet.outOfBoundsKill = true;
        this.lastAutoShot = this.time.now;
    }

    if (this.player && this.player.body) {
        const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, this.targetX, this.targetY);
        const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.targetX, this.targetY);

        if (distance > 5) {
            const velocityX = Math.cos(angle) * GAME_CONSTANTS.PLAYER.SPEED;
            const velocityY = Math.sin(angle) * GAME_CONSTANTS.PLAYER.SPEED;
            this.player.body.setVelocity(velocityX, velocityY);
        } else {
            this.player.body.setVelocity(0, 0);
        }
    }

    if (this.time.now > this.lastEnemySpawn + 1000) {
        const margin = 50;
        const x = Phaser.Math.Between(margin, this.scale.width - margin);
        const enemy = this.enemies.create(x, -20, 'asteroid');
        const speed = Phaser.Math.Between(150, 250);
        enemy.setVelocityY(speed);
        enemy.checkWorldBounds = true;
        enemy.outOfBoundsKill = true;
        this.lastEnemySpawn = this.time.now;
    }
}
