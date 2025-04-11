import Phaser from "phaser";

export default class Card extends Phaser.GameObjects.Image {
    suit: string;
    number: number;
    color: string;
    column: number;
    row: number;
    lastInColumn: boolean;

    constructor(
        scene: Phaser.Scene,
        x: number,
        y: number,
        texture: string,
        name: string,
        position: { column: number; row: number; lastInColumn: boolean }
    ) {
        super(scene, x, y, texture);
        this.scene.add.existing(this);

        this.suit = name.match(/(Hearts|Diamonds|Clubs|Spades)/)?.[0] || "";
        this.number = parseInt(name.match(/\d+/)?.[0] || "");
        this.color = this.extractColorFromCard(this.suit);

        this.column = position.column;
        this.row = position.row;
        this.lastInColumn = position.lastInColumn;
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

    print() {
        console.log(
            `Card: ${this.suit} ${this.number}, Color: ${this.color}, Position: ${this.column}, ${this.row}, Last in column: ${this.lastInColumn}`
        );
    }
}