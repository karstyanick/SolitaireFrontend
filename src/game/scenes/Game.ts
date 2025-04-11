import Card from "../gameObjects/card";
import { FULL_DECK, SUITS } from "../const/deck";

export class SolitaireScene extends Phaser.Scene {
    allCards: string[]

    constructor() {
        super({ key: "SolitaireScene" });
        this.allCards = [...FULL_DECK];
    }

    preload() {
        for (const suit of SUITS) {
            for (let j = 1; j <= 13; j++) {
                this.load.image(
                    `${suit}${j}`,
                    `./assets/cards/card${suit}${j}.png`
                );
            }
        }
    }

    static revertMove(card: Card, otherCardsToMove: Card[], spacingY: number) {
        const dragStartX = card.input?.dragStartX || 0;
        const dragStartY = card.input?.dragStartY || 0;

        card.x = dragStartX
        card.y = dragStartY;

        let index = 0

        for (const otherCard of otherCardsToMove) {
            otherCard.x = dragStartX;
            otherCard.y = (dragStartY) + spacingY * (index + 1);
            index++
        }
    }

    dragStart = function(this: Card) {
        this.setInteractive({ dropZone: false });
    }

    drag = function(this: { card: Card, cardElements: Card[], spacingY: number }, _pointer: any, dragX: number, dragY: number) {
        const otherCardsToMove = this.cardElements.filter(
            (cardElement) =>
                cardElement.column === this.card.column && cardElement.row > this.card.row
        );

        const canMovePile = otherCardsToMove.reduce(
            (previousValue, currentValue) => {
                return {
                    card: currentValue,
                    isValid: previousValue.isValid && previousValue.card.color != currentValue.color && previousValue.card.number == currentValue.number + 1
                }
            }
            , { card: this.card, isValid: true }
        ).isValid;

        if (!canMovePile) {
            return
        }

        this.card.x = dragX;
        this.card.y = dragY;
        this.card.setToTop()
        let index = 0;

        for (const otherCard of otherCardsToMove) {
            otherCard.x = dragX;
            otherCard.y = dragY + this.spacingY * (index + 1);
            otherCard.setToTop()
            index++;
        }
    };

    dragend = function(this: { card: Card, cardElements: Card[], spacingY: number }, _pointer: any, _dragX: number, _dragY: number, dropped: boolean) {
        if (!dropped) {
            const otherCardsToMove = this.cardElements.filter(
                (cardElement) =>
                    cardElement.column === this.card.column && cardElement.row > this.card.row
            );
            SolitaireScene.revertMove(this.card, otherCardsToMove, this.spacingY);
        }
    }

    drop = function(this: {
        card: Card, cardElements: Card[], spacingY: number, dropZones: {
            [col: string]: Phaser.GameObjects.Zone;
        }, graphics: Phaser.GameObjects.Graphics
    }, _pointer: any, target: Phaser.GameObjects.Zone) {

        const otherCardsToMove = this.cardElements.filter(
            (cardElement) =>
                cardElement.column === this.card.column && cardElement.row > this.card.row
        );
        if (target.name.includes("Free")) {
            this.card.x = target.x
            this.card.y = target.y
            this.card.row = -1;
            this.card.column = -1
            const dropZoneToDecrease = Object.values(this.dropZones).find(
                (dropZone) => dropZone.x === this.card.input?.dragStartX
            );

            const cardToDecrease = Object.values(this.cardElements).find(
                (cardElement) =>
                    cardElement.x === this.card.input?.dragStartX &&
                    cardElement.y === this.card.input?.dragStartY - this.spacingY - (otherCardsToMove.length * this.spacingY)
            );

            if (!dropZoneToDecrease) {
                return;
            }

            if (!cardToDecrease) {
                return;
            }

            dropZoneToDecrease
                .setY(dropZoneToDecrease.y - this.spacingY - (otherCardsToMove.length * this.spacingY))
                .setBelow(cardToDecrease);
            SolitaireScene.drawDropZoneOutlines(this.dropZones, this.graphics)
            return
        }

        if (target.x === this.card.input?.dragStartX) {
            SolitaireScene.revertMove(this.card, otherCardsToMove, this.spacingY);
            return;
        }

        const targetCard = this.cardElements.find(
            (cardElement) =>
                cardElement.x === target.x &&
                cardElement.y === target.y - this.spacingY
        );

        if (!targetCard) {
            return;
        }

        if (
            targetCard.number !== this.card.number + 1 ||
            targetCard.color === this.card.color
        ) {
            SolitaireScene.revertMove(this.card, otherCardsToMove, this.spacingY);
            return;
        }

        this.card.x = target.x;
        this.card.y = target.y;
        this.card.row = targetCard.row + 1;
        this.card.column = targetCard.column;
        this.card.setToTop()

        let index = 1;
        for (const otherCard of otherCardsToMove) {
            otherCard.x = target.x;
            otherCard.y = target.y + this.spacingY * index;
            otherCard.row = targetCard.row + index + 1;
            otherCard.column = targetCard.column;
            otherCard.setToTop()
            index++
        }

        const dropZoneToDecrease = Object.values(this.dropZones).find(
            (dropZone) => dropZone.x === this.card.input?.dragStartX
        );

        const dropZoneToIncrease = Object.values(this.dropZones).find(
            (dropZone) => dropZone.x === target.x
        );

        const cardToDecrease = Object.values(this.cardElements).find(
            (cardElement) =>
                cardElement.x === this.card.input?.dragStartX &&
                cardElement.y === this.card.input?.dragStartY - this.spacingY - (otherCardsToMove.length * this.spacingY)
        );

        if (!dropZoneToDecrease || !dropZoneToIncrease) {
            return;
        }

        if (!cardToDecrease) {
            return;
        }

        dropZoneToIncrease
            .setY(dropZoneToIncrease.y + this.spacingY + (otherCardsToMove.length * this.spacingY))
            .setBelow(this.card);
        dropZoneToDecrease
            .setY(dropZoneToDecrease.y - this.spacingY - (otherCardsToMove.length * this.spacingY))
            .setBelow(cardToDecrease);

        SolitaireScene.drawDropZoneOutlines(this.dropZones, this.graphics)
    }

    static drawDropZoneOutlines(
        dropZones: { [key: string]: Phaser.GameObjects.Zone },
        graphics: Phaser.GameObjects.Graphics,
    ): void {
        // Clear any previous drawings
        graphics.clear();
        // Set the line style: 2px thickness, red color, opacity of 1
        graphics.lineStyle(2, 0xff0000, 1);

        Object.values(dropZones).forEach((zone: Phaser.GameObjects.Zone) => {
            // Adjust x and y assuming zone.x and zone.y represent the center of the zone.
            graphics.strokeRect(
                zone.x - zone.width / 2,
                zone.y - zone.height / 2,
                zone.width,
                zone.height
            );
        });
    }

    createDropZone(x: number, y: number, width: number = 140, height: number = 190, name: string, permGraphics: Phaser.GameObjects.Graphics) {
        const zone = this.add.zone(x, y, width, height)
            .setRectangleDropZone(width, height)
            .setName(name)
        if (zone.input) {
            permGraphics.lineStyle(2, 0xffff00);
            permGraphics.strokeRect(
                zone.x - zone.input.hitArea.width / 2,
                zone.y - zone.input.hitArea.height / 2,
                zone.input.hitArea.width,
                zone.input.hitArea.height
            );
        }
        return zone;
    }

    create() {

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

        const permGraphics = this.add.graphics();

        ["FreeCell1", "FreeCell2", "FreeCell3", "FreeCell4"].map((name, index) => this.createDropZone(400 + 200 * index, 200, 140, 190, name, permGraphics));
        ["Tableau1", "Tableau2", "Tableau3", "Tableau4"].map((name, index) => this.createDropZone(1500 + 200 * index, 200, 140, 190, name, permGraphics));

        const graphics = this.add.graphics();

        for (let row = 0; row < rows; row++) {
            if (row === 6) {
                cardsPerRow = 4;
            }
            for (let col = 0; col < cardsPerRow; col++) {
                let x = offsetX + col * spacingX;
                let y = offsetY + row * spacingY;

                const randomIndex = Phaser.Math.RND.between(0, this.allCards.length - 1);
                const randomCard = this.allCards.splice(randomIndex, 1)[0];

                const card: Card = new Card(this, x, y, randomCard, randomCard, {
                    column: col,
                    row: row,
                    lastInColumn: (row === 6 && col < 4) || (row === 5 && col >= 4),
                }).setInteractive({ draggable: true });

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

                card.on("dragstart", this.dragStart)
                    .on("drag", this.drag, { card, cardElements, spacingY })
                    .on("dragend", this.dragend, { card, cardElements, spacingY })
                    .on("drop", this.drop, { card, cardElements, spacingY, dropZones, graphics });
            };
        }
    }
}