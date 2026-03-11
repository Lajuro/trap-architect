import * as Phaser from "phaser";
import { GAME_WIDTH, GAME_HEIGHT, EDITOR_CANVAS_HEIGHT } from "./constants";
import { BootScene } from "./scenes/BootScene";
import { MenuScene } from "./scenes/MenuScene";
import { GameScene } from "./scenes/GameScene";
import { LevelSelectScene } from "./scenes/LevelSelectScene";
import { EditorScene } from "./scenes/EditorScene";

export function createPhaserGame(parent: HTMLElement): Phaser.Game {
  const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    parent,
    backgroundColor: "#0a0a0a",
    pixelArt: true,
    physics: {
      default: "arcade",
      arcade: {
        gravity: { x: 0, y: 0 },
        debug: false,
      },
    },
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    scene: [BootScene, MenuScene, LevelSelectScene, GameScene],
  };

  return new Phaser.Game(config);
}

export function createEditorGame(parent: HTMLElement): Phaser.Game {
  const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    width: GAME_WIDTH,
    height: EDITOR_CANVAS_HEIGHT,
    parent,
    backgroundColor: "#0a0a0a",
    pixelArt: true,
    physics: {
      default: "arcade",
      arcade: {
        gravity: { x: 0, y: 0 },
        debug: false,
      },
    },
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    scene: [BootScene, EditorScene],
  };

  return new Phaser.Game(config);
}
