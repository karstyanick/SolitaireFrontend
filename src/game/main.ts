import { Game } from "phaser";
import { SolitaireScene } from "./scenes/Game";

const config = {
    fps: {
        limit: 30,
    },
    type: Phaser.CANVAS,
    scale: {
        mode: Phaser.Scale.EXPAND,
        width: 1920,
        height: 1080,
        autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    scene: SolitaireScene,
    backgroundColor: "#2d2d2d",
    input: {
        touch: true,
        mouse: true
    }
};

const StartGame = (parent: string) => {
    return new Game({ ...config, parent });
};

export default StartGame;
