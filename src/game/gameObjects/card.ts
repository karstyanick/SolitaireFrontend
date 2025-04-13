import Phaser from "phaser";

export default class Card extends Phaser.GameObjects.Image {
    suit: string;
    number: number;
    color: string;
    column: number;
    row: number;
    lastInColumn: boolean;
    name: string;
    graphics: Phaser.GameObjects.Graphics;
    text: Phaser.GameObjects.Text | undefined;

    constructor(
        scene: Phaser.Scene,
        x: number,
        y: number,
        texture: string,
        name: string,
        position: { column: number; row: number; lastInColumn: boolean },
        debug: boolean
    ) {
        super(scene, x, y, texture);
        this.scene.add.existing(this);

        this.suit = name.match(/(Hearts|Diamonds|Clubs|Spades)/)?.[0] || "";
        this.number = parseInt(name.match(/\d+/)?.[0] || "");
        this.color = this.extractColorFromCard(this.suit);
        this.name = `${this.number} of ${this.suit}`
        this.column = position.column;
        this.row = position.row;
        this.lastInColumn = position.lastInColumn;

        if (debug) {
            const textOptions: Phaser.Types.GameObjects.Text.TextStyle = {
                fontSize: 30,
                color: "black",
                backgroundColor: "white"
            }
            this.text = new Phaser.GameObjects.Text(scene, x - 60, y - 30, `col: ${this.column}\nrow: ${this.row}`, textOptions);
            this.text.setToTop()
            this.scene.add.existing(this.text);
        }
    }
    extractColorFromCard(suit: string) {
        let color = "";
        switch (suit) {
            case "Hearts":
            case "Diamonds":
                color = "red";
                break;
            case "Clubs":
            case "Spades":
                color = "black";
                break;
        }
        return color;
    }

    updatePosition(x: number, y: number, column: number, row: number) {
        this.x = x;
        this.y = y;
        this.row = row;
        this.column = column;
        this.setToTop();

        if (this.text) {
            this.text.setText(`col: ${this.column}\nrow: ${this.row}`);
            this.text.setX(x - 60);
            this.text.setY(y - 30);
            this.text.setToTop()
        }
    }

    print() {
        console.log(
            `Card: ${this.suit} ${this.number}, Color: ${this.color}, Position: ${this.column}, ${this.row}, Last in column: ${this.lastInColumn}`
        );
    }
}