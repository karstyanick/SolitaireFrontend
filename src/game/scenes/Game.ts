import Card from "../gameObjects/card";

export class SolitaireScene extends Phaser.Scene {
    constructor() {
        super({ key: "SolitaireScene" });
    }

    color(i: number) {
        switch (i) {
            case 0:
                return "Hearts";
            case 1:
                return "Diamonds";
            case 2:
                return "Clubs";
            case 3:
                return "Spades";
        }
    }

    preload() {
        // Load a card image. Replace with your actual asset URL.
        for (let i = 0; i < 4; i++) {
            for (let j = 1; j <= 13; j++) {
                this.load.image(
                    `${this.color(i)}${j}`,
                    `./assets/cards/card${this.color(i)}${j}.png`
                );
            }
        }
    }

    extractColorFromCard(card: string) {
        const suit = card.match(/(Hearts|Diamonds|Clubs|Spades)/)?.[0];
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

    extractNumberFromCard(card: string) {
        return parseInt(card.match(/\d+/)?.[0] || "");
    }

    create() {
        const allCards: string[] = [
            "Hearts1",
            "Hearts2",
            "Hearts3",
            "Hearts4",
            "Hearts5",
            "Hearts6",
            "Hearts7",
            "Hearts8",
            "Hearts9",
            "Hearts10",
            "Hearts11",
            "Hearts12",
            "Hearts13",
            "Diamonds1",
            "Diamonds2",
            "Diamonds3",
            "Diamonds4",
            "Diamonds5",
            "Diamonds6",
            "Diamonds7",
            "Diamonds8",
            "Diamonds9",
            "Diamonds10",
            "Diamonds11",
            "Diamonds12",
            "Diamonds13",
            "Clubs1",
            "Clubs2",
            "Clubs3",
            "Clubs4",
            "Clubs5",
            "Clubs6",
            "Clubs7",
            "Clubs8",
            "Clubs9",
            "Clubs10",
            "Clubs11",
            "Clubs12",
            "Clubs13",
            "Spades1",
            "Spades2",
            "Spades3",
            "Spades4",
            "Spades5",
            "Spades6",
            "Spades7",
            "Spades8",
            "Spades9",
            "Spades10",
            "Spades11",
            "Spades12",
            "Spades13",
        ];

        const dropZones: {
            [col: string]: Phaser.GameObjects.Zone;
        } = {};

        const cardElements: Card[] = [];

        let cardsPerRow = 8;
        const rows = 7;
        const spacingX = 180;
        const spacingY = 40;
        const offsetX = 600;
        const offsetY = 500;

        let totalcount = 0;

        const zone = this.add
            .zone(1500, 200, 300, 300)
            .setRectangleDropZone(300, 300)
            .setName("OuterDropZone");
        if (!zone.input) {
            return;
        }
        const graphics = this.add.graphics();
        graphics.lineStyle(2, 0xffff00);
        graphics.strokeRect(
            zone.x - zone.input.hitArea.width / 2,
            zone.y - zone.input.hitArea.height / 2,
            zone.input.hitArea.width,
            zone.input.hitArea.height
        );

        for (let row = 0; row < rows; row++) {
            if (row === 6) {
                cardsPerRow = 4;
            }
            for (let col = 0; col < cardsPerRow; col++) {
                let x = offsetX + col * spacingX;
                let y = offsetY + row * spacingY;

                const randomIndex = Phaser.Math.RND.between(0, allCards.length - 1);
                const randomCard = allCards.splice(randomIndex, 1)[0];

                const card: Card = new Card(this, x, y, randomCard, randomCard, {
                    column: col,
                    row: row,
                    lastInColumn: (row === 6 && col < 4) || (row === 5 && col >= 4),
                }).setInteractive({ draggable: true });

                card.on("pointerdown", () => {
                    card.print();
                });

                cardElements.push(card);

                if (row === 5 && col > 3) {
                    const dropZone = this.add
                        .zone(x, offsetY + (row + 1) * spacingY, card.width, card.height)
                        .setRectangleDropZone(card.width, card.height)
                        .setBelow(card)
                        .setName(`${col}`);

                    dropZones[col] = dropZone;

                    if (!dropZone.input) {
                        return;
                    }
                } else if (row === 6 && col <= 3) {
                    const dropZone = this.add
                        .zone(x, offsetY + (row + 1) * spacingY, card.width, card.height)
                        .setRectangleDropZone(card.width, card.height)
                        .setBelow(card)
                        .setName(`${col}`);

                    dropZones[col] = dropZone;

                    if (!dropZone.input) {
                        return;
                    }
                }

                card.on(
                    "dragstart",
                    function(pointer: Phaser.Input.Pointer) {
                        card.setInteractive({ dropZone: false });
                    },
                    card
                );

                card
                    .on("drag", (pointer: any, dragX: number, dragY: number) => {
                        const otherCardsToMove = cardElements.filter(
                            (cardElement) =>
                                cardElement.column === card.column && cardElement.row > card.row
                        );

                        card.setToTop();
                        card.x = dragX;
                        card.y = dragY;

                        let index = 0;

                        for (const otherCard of otherCardsToMove) {
                            otherCard.x = dragX;
                            otherCard.y = dragY + spacingY * (index + 1);
                            index++;
                        }
                    })
                    .on(
                        "dragend",
                        (pointer: any, dragX: number, dragY: number, dropped: boolean) => {
                            card.setInteractive({ dropZone: true });
                            if (!dropped) {
                                card.x = card.input?.dragStartX || 0;
                                card.y = card.input?.dragStartY || 0;
                            }
                        }
                    )
                    .on("drop", (pointer: any, target: Phaser.GameObjects.Zone) => {
                        card.print();

                        if (target.x === card.input?.dragStartX) {
                            card.x = card.input?.dragStartX || 0;
                            card.y = card.input?.dragStartY || 0;
                            return;
                        }

                        // if (target.name === "OuterDropZone") {
                        //   card.x = target.x;
                        //   card.y = target.y;
                        //   return;
                        // }

                        const targetCard = cardElements.find(
                            (cardElement) =>
                                cardElement.x === target.x &&
                                cardElement.y === target.y - spacingY
                        );

                        if (!targetCard) {
                            return;
                        }

                        targetCard.print();

                        if (
                            targetCard.number !== card.number + 1 ||
                            targetCard.color === card.color
                        ) {
                            card.x = card.input?.dragStartX || 0;
                            card.y = card.input?.dragStartY || 0;
                            return;
                        }

                        card.x = target.x;
                        card.y = target.y;

                        const dropZoneToDecrease = Object.values(dropZones).find(
                            (dropZone) => dropZone.x === card.input?.dragStartX
                        );

                        const dropZoneToIncrease = Object.values(dropZones).find(
                            (dropZone) => dropZone.x === target.x
                        );

                        const cardToDecrease = Object.values(cardElements).find(
                            (cardElement) =>
                                cardElement.x === card.input?.dragStartX &&
                                cardElement.y === card.input?.dragStartY - spacingY
                        );

                        if (!dropZoneToDecrease || !dropZoneToIncrease) {
                            return;
                        }

                        if (!cardToDecrease) {
                            return;
                        }

                        dropZoneToIncrease
                            .setY(dropZoneToIncrease.y + spacingY)
                            .setBelow(card);
                        dropZoneToDecrease
                            .setY(dropZoneToDecrease.y - spacingY)
                            .setBelow(cardToDecrease);

                        if (!dropZoneToDecrease.input || !dropZoneToIncrease.input) {
                            return;
                        }

                        card.on("postupdate", () => {
                            console.log(`Card moved to ${card.x}, ${card.y}`);
                        });
                    });
            }
        }
    }
}