import { Hex, Grid } from 'honeycomb-grid'
import { SVG, Svg } from '@svgdotjs/svg.js'
import { Client } from 'boardgame.io/client';
import { Paradox, StoneColor, Stone } from './Game';

function parseId(id: string): number[] | null {
  return id.split('_').splice(1, 2).map(x => parseInt(x)) || null;
}

function getCellValue(grid: Grid<Hex>, stones: Stone[], q: number, r: number): StoneColor | null | undefined {
  if (grid.getHex([q, r])) {
    return stones.filter(s => s.q === q && s.r === r).pop()?.color || null;
  } else {
    return undefined;
  }
}

class GameClient {
  debug: boolean;
  client: any;
  grid: Grid<Hex>;
  rootElement: any;
  svg: Svg;

  constructor(rootElement, debug = false) {
    this.debug = debug;
    this.client = Client({ game: Paradox, debug: debug });
    this.client.start();
    const deserializedGrid = JSON.parse(this.client.getState().G.grid);
    this.grid = Grid.fromJSON(deserializedGrid);
    this.rootElement = rootElement;
    this.svg = SVG().addTo(this.rootElement).size('100%', '100%');
    this.createBoard();
    this.createExtraControls();
    this.attachListeners();
    this.client.subscribe(state => this.update(state));
  }

  createBoard() {
    this.grid.forEach(hex => {
      // create a polygon from a hex's corner points
      const polygon = this.svg
        .polygon(hex.corners.map(({ x, y }) => [x, y]).reduce((a, b) => a.concat(b), []))
        .fill('#C4A484')
        .stroke({ width: 3, color: '#999' })
        .attr({ id: `hex_${hex.q}_${hex.r}`, class: 'hex', });

      this.svg.group().add(polygon);
    });

    if (this.debug) {
      // show q_r coordinates for each cell
      this.grid.forEach(hex => {
        const text = this.svg
          .plain(`${hex.q}_${hex.r}`)
          .stroke({ color: "red", width: 1 })
          .attr({ x: hex.corners[0].x, y: hex.corners[0].y, });
        this.svg.group().add(text);
      });
    }
  }

  createExtraControls() {
    // let undoBtn = this.rootElement.appendChild(document.createElement('button'));
    // undoBtn.id = "undoBtn";
    // undoBtn.type = "button";
    // undoBtn.textContent = "Undo";

    let clearBtn = this.rootElement.appendChild(document.createElement('button'));
    clearBtn.id = "clearBtn";
    clearBtn.type = "button";
    clearBtn.textContent = "Clear Selection";
  }

  attachListeners() {
    const cells = this.rootElement.querySelectorAll('.hex');

    const handleCellClick = event => {
      const id = parseId(event.target.id);
      this.client.moves.clickCell(id);
    };
    cells.forEach(cell => {
      cell.onclick = handleCellClick;
    });

    // this.rootElement.querySelector('#undoBtn').onclick = event=>this.client.moves.undo();
    this.rootElement.querySelector('#clearBtn').onclick = event => this.client.moves.clear();
  }

  update(state) {
    this.rootElement.querySelector('header').innerText = `Player ${state.ctx.currentPlayer} (${state.G.players[state.ctx.currentPlayer].color}) Turn`;
    const cells = this.rootElement.querySelectorAll('.hex');

    cells.forEach(cell => {
      const cellId = parseId(cell.id)!;
      const cellValue = getCellValue(this.grid, state.G.stones, cellId[0], cellId[1]);
      // console.debug(cellId, cellValue);
      cell.style.fill = cellValue !== null ? cellValue : '';
      cell.style.stroke = '#999';
    });

    // let hex = [3, 3];
    // this.rootElement.querySelector(`#hex_3_3`).style.fill = "green";
    // let n = this.grid.neighborOf(hex, Direction.SE);
    // console.log(n);
    // this.rootElement.querySelector(`#hex_${n.q}_${n.r}`).style.fill = "red";

    this.rootElement.querySelectorAll(".selected_hex").forEach(c => c.parentNode.removeChild(c));
    this.rootElement.querySelectorAll(".winning_hex").forEach(c => c.parentNode.removeChild(c));

    if (state.ctx.gameover) {
      console.log("game over", state.ctx.gameover);
      this.rootElement.querySelector("header").innerText = `player ${state.ctx.gameover.winner} (${state.ctx.gameover.color}) wins`;

      this.rootElement.querySelectorAll(".winning_hex").forEach(c => c.parentNode.removeChild(c));
      state.ctx.gameover.winning_line.map(h => this.grid.getHex(h)).forEach(hex => {
        const polygon = this.svg
          .polygon(hex.corners.map(({ x, y }) => `${x},${y}`))
          .fill("none")
          .stroke({ width: 3, color: 'yellow' })
          .attr({ class: 'winning_hex', });

        this.svg.group().add(polygon);
      });
    } else {
      state.G.current.map(s => this.grid.getHex(state.G.stones[s])).forEach(hex => {
        const polygon = this.svg
          .polygon(hex.corners.map(({ x, y }) => `${x},${y}`))
          .fill("none")
          .stroke({ width: 3, color: 'green' })
          .attr({ class: 'selected_hex', });

        this.svg.group().add(polygon);
      });
    }
  }
}

const appElement = document.getElementById('app');
const app = new GameClient(appElement);
