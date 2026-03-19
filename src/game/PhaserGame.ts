import * as Phaser from "phaser";
import { GAME_WIDTH, GAME_HEIGHT, EDITOR_CANVAS_HEIGHT } from "./constants";
import { BootScene } from "./scenes/BootScene";
import { MenuScene } from "./scenes/MenuScene";
import { GameScene } from "./scenes/GameScene";
import { LevelSelectScene } from "./scenes/LevelSelectScene";
import { EditorScene } from "./scenes/EditorScene";
import { LobbyScene } from "./scenes/LobbyScene";

export function createPhaserGame(parent: HTMLElement, options?: { startScene?: string }): Phaser.Game {
  const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    parent,
    backgroundColor: "#0a0a0a",
    pixelArt: true,
    fps: {
      target: 60,
      forceSetTimeOut: false,
    },
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

  const game = new Phaser.Game(config);
  if (options?.startScene) {
    game.registry.set("startScene", options.startScene);
  }
  return game;
}

export function createEditorGame(parent: HTMLElement): Phaser.Game {
  const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    width: GAME_WIDTH,
    height: EDITOR_CANVAS_HEIGHT,
    parent,
    backgroundColor: "#08080e",
    pixelArt: true,
    fps: {
      target: 60,
      forceSetTimeOut: false,
    },
    physics: {
      default: "arcade",
      arcade: {
        gravity: { x: 0, y: 0 },
        debug: false,
      },
    },
    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.NO_CENTER,
    },
    scene: [BootScene, EditorScene, GameScene],
  };

  return new Phaser.Game(config);
}

export function createLobbyGame(parent: HTMLElement): Phaser.Game {
  const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    parent,
    transparent: true,
    pixelArt: true,
    fps: {
      target: 30,
      forceSetTimeOut: false,
    },
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    scene: [LobbyScene],
  };

  return new Phaser.Game(config);
}
