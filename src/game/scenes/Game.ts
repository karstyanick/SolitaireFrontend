import Card from "../gameObjects/card";
import { FULL_DECK, SUITS } from "../const/deck";
const DEBUG = true;

export class SolitaireScene extends Phaser.Scene {
    allCards: string[]
    tableauZones: Phaser.GameObjects.Zone[]
    freeCellZones: Phaser.GameObjects.Zone[]

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
        this.load.image("background", "./assets/wood1.png")
        this.load.image("dropZoneImage", "./assets/dropzone.png")
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
        ).sort((a, b) => a.row - b.row);

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

        otherCardsToMove.forEach((otherCard, index) => {
            otherCard.x = dragX;
            otherCard.y = dragY + this.spacingY * (index + 1);
            otherCard.setToTop()
        });
    };

    dragend = function(this: { card: Card, cardElements: Card[], spacingY: number }, _pointer: any, _dragX: number, _dragY: number, dropped: boolean) {
        if (!dropped) {
            const otherCardsToMove = this.cardElements.filter(
                (cardElement) =>
                    cardElement.column === this.card.column && cardElement.row > this.card.row
            ).sort((a, b) => a.row - b.row);
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
        ).sort((a, b) => a.row - b.row);

        if (target.name.includes("Free")) {
            const cardAlreadyInThisCell = Boolean(this.cardElements.find(card => card.x == target.x && card.y == target.y));
            if (cardAlreadyInThisCell) {
                SolitaireScene.revertMove(this.card, otherCardsToMove, this.spacingY);
                return
            }
            this.card.updatePosition(target.x, target.y, -1, -1, "FreeCell");
            SolitaireScene.adjustDropZonesDecrease(this.dropZones, this.card, this.spacingY, otherCardsToMove, this.cardElements, this.graphics);
            return
        }

        if (target.name.includes("Tableau")) {
            let isValid = true;
            const cardAlreadyOnThisTableau = this.cardElements.filter(card => card.x == target.x && card.y == target.y).sort((a, b) => b.number - a.number)?.[0];

            if (cardAlreadyOnThisTableau) {
                isValid = this.card.suit == cardAlreadyOnThisTableau.suit && this.card.number == cardAlreadyOnThisTableau.number + 1;
            } else {
                isValid = this.card.number == 1
            }

            if (!isValid) {
                SolitaireScene.revertMove(this.card, otherCardsToMove, this.spacingY);
                return
            }

            this.card.updatePosition(target.x, target.y, -1, -1, "Tableau");
            SolitaireScene.adjustDropZonesDecrease(this.dropZones, this.card, this.spacingY, otherCardsToMove, this.cardElements, this.graphics);
            return
        }

        if (parseInt(target.name) === this.card.column) {
            SolitaireScene.revertMove(this.card, otherCardsToMove, this.spacingY);
            return;
        }

        const targetCard = this.cardElements.find(
            (cardElement) =>
                cardElement.x === target.x &&
                cardElement.y === target.y - this.spacingY
        );

        if (!targetCard) {
            this.card.updatePosition(target.x, target.y, parseInt(target.name), 0, "Board");

            otherCardsToMove.forEach((otherCard, index) => {
                otherCard.updatePosition(target.x, target.y + this.spacingY * (index + 1), parseInt(target.name), 0 + index + 1, "Board");
            });

            SolitaireScene.adjustDropZonesDecrease(this.dropZones, this.card, this.spacingY, otherCardsToMove, this.cardElements, this.graphics);
            SolitaireScene.adjustDropZoneIncrease(this.dropZones, this.card, target, this.spacingY, otherCardsToMove, this.graphics);
            SolitaireScene.drawDropZoneOutlines(this.dropZones, this.graphics)
            return;
        }

        if (
            targetCard.number !== this.card.number + 1 ||
            targetCard.color === this.card.color
        ) {
            SolitaireScene.revertMove(this.card, otherCardsToMove, this.spacingY);
            return;
        }

        this.card.updatePosition(target.x, target.y, targetCard.column, targetCard.row + 1, "Board");
        otherCardsToMove.forEach((otherCard, index) => {
            otherCard.updatePosition(target.x, target.y + this.spacingY * (index + 1), targetCard.column, targetCard.row + index + 2, "Board");
        });

        SolitaireScene.adjustDropZonesDecrease(this.dropZones, this.card, this.spacingY, otherCardsToMove, this.cardElements, this.graphics);
        SolitaireScene.adjustDropZoneIncrease(this.dropZones, this.card, target, this.spacingY, otherCardsToMove, this.graphics);
        SolitaireScene.drawDropZoneOutlines(this.dropZones, this.graphics)
        SolitaireScene.autofillTableau(this.cardElements, this.dropZones, this.spacingY, this.graphics);
    }

    static drawDropZoneOutlines(
        dropZones: { [key: string]: Phaser.GameObjects.Zone },
        graphics: Phaser.GameObjects.Graphics,
    ): void {
        if (DEBUG) {
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
    }

    static adjustDropZoneIncrease(dropZones: {
        [col: string]: Phaser.GameObjects.Zone;
    }, card: Card, target: Phaser.GameObjects.Zone, spacingY: number, otherCardsToMove: Card[], graphics: Phaser.GameObjects.Graphics) {
        const dropZoneToIncrease = Object.values(dropZones).find(
            (dropZone) => dropZone.x === target.x
        );

        if (!dropZoneToIncrease) {
            return;
        }

        dropZoneToIncrease
            .setY(dropZoneToIncrease.y + spacingY + (otherCardsToMove.length * spacingY))
            .setBelow(card);

        SolitaireScene.drawDropZoneOutlines(dropZones, graphics)
    }

    static adjustDropZonesDecrease(dropZones: {
        [col: string]: Phaser.GameObjects.Zone;
    }, card: Card, spacingY: number, otherCardsToMove: Card[], cardElements: Card[], graphics: Phaser.GameObjects.Graphics) {
        const dropZoneToDecrease = Object.values(dropZones).find(
            (dropZone) => dropZone.x === (card.input?.dragStartX || card.x)
        );

        if (!dropZoneToDecrease) {
            return;
        }

        const cardToDecrease = Object.values(cardElements).find(
            (cardElement) =>
                cardElement.x === card.input?.dragStartX &&
                cardElement.y === card.input?.dragStartY - spacingY - (otherCardsToMove.length * spacingY)
        );

        dropZoneToDecrease
            .setY(dropZoneToDecrease.y - spacingY - (otherCardsToMove.length * spacingY))

        if (cardToDecrease) {
            dropZoneToDecrease.setBelow(cardToDecrease)
        }

        SolitaireScene.drawDropZoneOutlines(dropZones, graphics)
    }

    createDropZone(x: number, y: number, width: number = 140, height: number = 190, name: string, permGraphics: Phaser.GameObjects.Graphics) {
        this.add.image(x, y, "dropZoneImage").setDisplaySize(width + 45, height + 55)
        const zone = this.add.zone(x, y, width, height)
            .setRectangleDropZone(width, height)
            .setName(name)
        if (zone.input && DEBUG) {
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

    static async autofillTableau(allCards: Card[], dropZones: { [key: string]: Phaser.GameObjects.Zone }, spacingY: number, graphics: Phaser.GameObjects.Graphics) {
        const cardsToCheck = allCards.filter(card => card.zoneType === "FreeCell");
        const lastRowCardPerColumn: { [column: string]: Card } = {};

        allCards.filter(card => card.zoneType === "Board").forEach(card => {
            const previousMaxRowCard = lastRowCardPerColumn[card.column]
            lastRowCardPerColumn[card.column] = previousMaxRowCard ? card.row > previousMaxRowCard.row ? card : previousMaxRowCard : card;
        })

        Object.values(lastRowCardPerColumn).forEach(card => cardsToCheck.push(card));

        console.log(`Hello ${JSON.stringify(cardsToCheck.map(card => card.name))}`);

        const cardsToPlace = [];

        for (const cardToCheck of cardsToCheck) {
            const checkTableau = this.checkTableau(cardToCheck, allCards);
            console.log(`Checking: ${cardToCheck.name}. Result: ${JSON.stringify(checkTableau)}`);
            if (checkTableau.canPlace && cardToCheck.number <= this.getMinTableau(allCards) + 1) {
                cardsToPlace.push({
                    card: cardToCheck,
                    positionX: checkTableau.positionX,
                    positionY: checkTableau.positionY
                })
            }
        }
        for (const cardToPlace of cardsToPlace) {
            SolitaireScene.adjustDropZonesDecrease(dropZones, cardToPlace.card, spacingY, [], allCards, graphics);
            cardToPlace.card.updatePositionWithAnimation(cardToPlace.positionX, cardToPlace.positionY, -1, -1, "Tableau");
            SolitaireScene.drawDropZoneOutlines(dropZones, graphics)
            await new Promise(resolve => setTimeout(resolve, 400));
        }

        if (cardsToPlace.length > 0) {
            setTimeout(() => SolitaireScene.autofillTableau(allCards, dropZones, spacingY, graphics), 400);
        }
    }

    static checkTableau(cardToCheck: Card, allCards: Card[]) {
        const tablea1Occupied = allCards.find(card => card.zoneType === "Tableau" && card.x === 1400);
        const tablea2Occupied = allCards.find(card => card.zoneType === "Tableau" && card.x === 1600);
        const tablea3Occupied = allCards.find(card => card.zoneType === "Tableau" && card.x === 1800);
        const tablea4Occupied = allCards.find(card => card.zoneType === "Tableau" && card.x === 2000);

        const firstFreeTableau = tablea1Occupied ? tablea2Occupied ? tablea3Occupied ? tablea4Occupied ? 1400 : 2000 : 1800 : 1600 : 1400;

        const tableauPosition = allCards.filter(card => card.zoneType === "Tableau" && card.suit === cardToCheck.suit);
        return {
            positionX: tableauPosition.length === 0 ? firstFreeTableau : tableauPosition[0].x,
            positionY: 200,
            canPlace: tableauPosition.length === 0 ? cardToCheck.number === 1 : tableauPosition.map(card => card.number).sort()[0] === cardToCheck.number - 1
        }
    }

    static getMinTableau(allCards: Card[]) {
        return allCards.filter(card => card.zoneType === "Tableau").map(card => card.number).sort()[0] || 0;
    }

    create() {
        const { width, height } = this.sys.game.canvas;

        this.add.tileSprite(
            0, 0, width, height,
            'background'
        )
            .setOrigin(0)
            .setDepth(-1);

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

        ["FreeCell1", "FreeCell2", "FreeCell3", "FreeCell4"].map((name, index) => this.createDropZone(500 + 200 * index, 200, 140, 190, name, permGraphics));
        ["Tableau1", "Tableau2", "Tableau3", "Tableau4"].map((name, index) => this.createDropZone(1400 + 200 * index, 200, 140, 190, name, permGraphics));

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
                }, DEBUG, "Board").setInteractive({ draggable: true });

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

        SolitaireScene.drawDropZoneOutlines(dropZones, graphics);
    }
}