import { AssetKeys } from '../constants/AssetKeys.js';
import { SceneKeys } from '../constants/SceneKeys.js';

export class InitialScene extends Phaser.Scene {
    constructor() {
        super({ key: SceneKeys.INITIAL_SCENE });
    }

    preload() {
        this.load.image(AssetKeys.START_IMAGE, 'assets/images/start.png');
    }

    create() {
        // Create a black background
        const graphics = this.add.graphics();
        graphics.fillStyle(0x000000, 1); // Black color
        graphics.fillRect(0, 0, this.scale.width, this.scale.height);

        // Add the start image centered and slightly elevated
        const logoImage = this.add.image(
            this.scale.width / 2,
            this.scale.height * 0.4, // Positioned at 40% of screen height
            AssetKeys.START_IMAGE
        ).setOrigin(0.5);

        // Scale the image to fit nicely on screen while maintaining aspect ratio
        const scaleRatio = Math.min(
            (this.scale.width * 0.8) / logoImage.width,
            (this.scale.height * 0.6) / logoImage.height
        );
        logoImage.setScale(scaleRatio);

        // Add high score text above the start text
        const highScore = localStorage.getItem('highScore') || '0';
        this.add.text(
            this.scale.width / 2,
            this.scale.height * 0.7,
            'High Score: ' + highScore,
            {
                fontFamily: 'Arial',
                fontSize: '36px',
                fill: '#ffd700',
            }
        ).setOrigin(0.5);

        // Add text at the bottom to indicate how to start
        const startText = this.add.text(
            this.scale.width / 2,
            this.scale.height * 0.8, // Positioned at 80% of screen height
            'Toque para começar',
            {
                fontFamily: 'Arial',
                fontSize: '48px',
                fill: '#fff',
            }
        ).setOrigin(0.5);

        // Add click/touch handler to start the game
        this.input.on('pointerdown', () => {
            this.scene.start(SceneKeys.GAME_SCENE);
        });
    }
}
