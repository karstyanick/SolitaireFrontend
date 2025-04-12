import { Game } from "phaser";
import { SolitaireScene } from "./scenes/Game";

//  Find out more information about the Game Config at:
//  https://newdocs.phaser.io/docs/3.70.0/Phaser.Types.Core.GameConfig
const config = {
    type: Phaser.AUTO,
    scale: {
        mode: Phaser.Scale.FIT,
        width: window.innerWidth,
        height: window.innerHeight,
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