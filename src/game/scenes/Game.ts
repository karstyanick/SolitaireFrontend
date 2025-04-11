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

    dragStart = function(this: Card) {
        this.setInteractive({ dropZone: false });
    }

    drag = function(this: { card: Card, cardElements: Card[], spacingY: number }, _pointer: any, dragX: number, dragY: number) {
        const otherCardsToMove = this.cardElements.filter(
            (cardElement) =>
                cardElement.column === this.card.column && cardElement.row > this.card.row
        );

        this.card.setToTop();
        this.card.x = dragX;
        this.card.y = dragY;

        let index = 0;

        for (const otherCard of otherCardsToMove) {
            otherCard.x = dragX;
            otherCard.y = dragY + this.spacingY * (index + 1);
            index++;
        }
    };

    dragend = function(this: Card, _pointer: any, _dragX: number, _dragY: number, dropped: boolean) {
        this.setInteractive({ dropZone: true });
        if (!dropped) {
            this.x = this.input?.dragStartX || 0;
            this.y = this.input?.dragStartY || 0;
        }
    }

    drop = function(this: {
        card: Card, cardElements: Card[], spacingY: number, dropZones: {
            [col: string]: Phaser.GameObjects.Zone;
        }
    }, _pointer: any, target: Phaser.GameObjects.Zone) {

        if (target.x === this.card.input?.dragStartX) {
            this.card.x = this.card.input?.dragStartX || 0;
            this.card.y = this.card.input?.dragStartY || 0;
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
            this.card.x = this.card.input?.dragStartX || 0;
            this.card.y = this.card.input?.dragStartY || 0;
            return;
        }

        this.card.x = target.x;
        this.card.y = target.y;

        const dropZoneToDecrease = Object.values(this.dropZones).find(
            (dropZone) => dropZone.x === this.card.input?.dragStartX
        );

        const dropZoneToIncrease = Object.values(this.dropZones).find(
            (dropZone) => dropZone.x === target.x
        );

        const cardToDecrease = Object.values(this.cardElements).find(
            (cardElement) =>
                cardElement.x === this.card.input?.dragStartX &&
                cardElement.y === this.card.input?.dragStartY - this.spacingY
        );

        if (!dropZoneToDecrease || !dropZoneToIncrease) {
            return;
        }

        if (!cardToDecrease) {
            return;
        }

        dropZoneToIncrease
            .setY(dropZoneToIncrease.y + this.spacingY)
            .setBelow(this.card);
        dropZoneToDecrease
            .setY(dropZoneToDecrease.y - this.spacingY)
            .setBelow(cardToDecrease);

        if (!dropZoneToDecrease.input || !dropZoneToIncrease.input) {
            return;
        }
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
                    .on("dragend", this.dragend)
                    .on("drop", this.drop, { card, cardElements, spacingY, dropZones });
            };
        }
    }
}