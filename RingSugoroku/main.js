const canvas = document.getElementById('canvas'); // canvas要素への参照の取得
const ctx = canvas.getContext('2d'); // コンテキストの取得

const _sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const RED = '#f00'
const GREEN = '#0f0'
const BLUE = '#00f'
const BLACK = '#000'

ctx.strokeStyle = RED;
ctx.fillStyle = RED;
ctx.lineWidth = 2;

const MASU_NUM = 16;
const MASU_RADIUS = 10;
const MAP_CENTER = [300,300];
const MAP_RADIUS = 100;
const PLAYER_NUM = 2;
const PLAYER_RADIUS = MASU_RADIUS * 0.5;

const UI_ALLOW_RADIUS = MAP_RADIUS * 1.5;
const UI_ALLOW_TIP_LENGTH = 10;

let map = []
let players = []
let dire = 1; // 駒の進行方向

let input_wait = 0;

class Coma{
	constructor(No){
		this.No = No;
		this.pos = 0;
	}

	move(dice){
		let d;
		// 0なら1~3,1なら4~6マス進める
		if(dice != 0){
			d = (Math.random()*3|0)+4;
		}
		else{
			d = (Math.random()*3|0)+1;
		}
		this.pos += d*dire;
		console.log("dice:"+d*dire);
		this.pos = (this.pos+16)%MASU_NUM;

		// 止まったマスの効果
		map[this.pos].effect();
	}

	draw(){
		if(this.No == 1){
			ctx.strokeStyle = RED;
			ctx.fillStyle = RED;
		}
		else if(this.No == 2){
			ctx.strokeStyle = BLUE;
			ctx.fillStyle = BLUE;
		}
		ctx.beginPath();
		ctx.arc(map[this.pos].x, map[this.pos].y, PLAYER_RADIUS, 0, 2 * Math.PI);
		
		ctx.moveTo(map[this.pos].x, map[this.pos].y);
		ctx.lineTo(MAP_CENTER[0],MAP_CENTER[1]);
		//ctx.closePath();
		ctx.fill();
		ctx.stroke();
	}
}

class Masu{
	constructor(x,y,No,id){
		this.x = x;
		this.y = y;
		this.No = No;
		this.id = id; // 0:none 1:start 2:goal 3:reverse
	}

	effect(){
		console.log("masu_id:"+this.id);
		switch(this.id){
			case 1:break;
			case 2:goal();break;
			case 3:dire *= -1;break;
			default:break;
		}
	}

	draw(){
		switch(this.id){
			case 1:ctx.fillStyle = BLACK;break;
			case 2:ctx.fillStyle = BLUE;break;
			case 3:ctx.fillStyle = GREEN;break;
			default:ctx.fillStyle = BLACK;break;
		}
		ctx.beginPath();
		ctx.arc(this.x, this.y, MASU_RADIUS/((this.id==0)+1), 0, 2 * Math.PI); // (100, 50)の位置に半径30pxの円
		ctx.closePath();
		ctx.fill();
	}
}

class UI{
	static draw(){
		// 進行方向の矢印
		ctx.strokeStyle = GREEN;
		ctx.fillStyle = GREEN;

		// 矢印-弧
		ctx.beginPath();
		ctx.arc(MAP_CENTER[0], MAP_CENTER[1], UI_ALLOW_RADIUS, Math.PI/4+Math.PI/2, 3 * Math.PI/4+Math.PI/2);
		ctx.stroke();
		ctx.beginPath();
		ctx.arc(MAP_CENTER[0], MAP_CENTER[1], UI_ALLOW_RADIUS, Math.PI/4-Math.PI/2, Math.PI/4);
		ctx.stroke();

		// 矢印-先端
		// sct:節
		let sct_th = (dire+2) * Math.PI/4+Math.PI/2;
		let sct_x = MAP_CENTER[0]+UI_ALLOW_RADIUS*Math.cos(sct_th);
		let sct_y = MAP_CENTER[1]+UI_ALLOW_RADIUS*Math.sin(sct_th);
		let alw_l_th = sct_th-dire*Math.PI/2+Math.PI/4;
		let alw_r_th = sct_th-dire*Math.PI/2-Math.PI/4;
		ctx.beginPath();
		ctx.moveTo(sct_x+UI_ALLOW_TIP_LENGTH*Math.cos(alw_l_th),sct_y+UI_ALLOW_TIP_LENGTH*Math.sin(alw_l_th));
		ctx.lineTo(sct_x,sct_y);
		ctx.lineTo(sct_x+UI_ALLOW_TIP_LENGTH*Math.cos(alw_r_th),sct_y+UI_ALLOW_TIP_LENGTH*Math.sin(alw_r_th));
		ctx.stroke();

		sct_th = Math.PI/4-Math.PI/2*(dire<0);
		sct_x = MAP_CENTER[0]+UI_ALLOW_RADIUS*Math.cos(sct_th);
		sct_y = MAP_CENTER[1]+UI_ALLOW_RADIUS*Math.sin(sct_th);
		alw_l_th = sct_th-dire*Math.PI/2+Math.PI/4;
		alw_r_th = sct_th-dire*Math.PI/2-Math.PI/4;
		ctx.beginPath();
		ctx.moveTo(sct_x+UI_ALLOW_TIP_LENGTH*Math.cos(alw_l_th),sct_y+UI_ALLOW_TIP_LENGTH*Math.sin(alw_l_th));
		ctx.lineTo(sct_x,sct_y);
		ctx.lineTo(sct_x+UI_ALLOW_TIP_LENGTH*Math.cos(alw_r_th),sct_y+UI_ALLOW_TIP_LENGTH*Math.sin(alw_r_th));
		ctx.stroke();
		console.log("UI")
	}

}

function disp(){
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	map.forEach(function(e){e.draw();});
	players.forEach(function(e){e.draw();});
	UI.draw();
}

function goal(){
	console.log("goal");
}

// document.getElementById("button").onclick = function() {
// 	players[0].move();
// 	disp();
// };

// キーボード入力
document.body.addEventListener('keydown',
	event => {
		if(input_wait == 0 && (event.key === 'd' || event.key === 'f')){
			if (event.key === 'd') {
	        	players[0].move(0);
			}
			else if(event.key === 'f'){
				players[0].move(1);
			}
			disp();
			input_wait = 1;

			// NPC
			setTimeout('players[1].move((Math.random()*2|0));input_wait=0;disp();',200);
			
		}

		
		
	});

function main(){
	for(let i=0; i<PLAYER_NUM; i++){
		players.push(new Coma(i+1));
	}
	// マスを設定し、連結してマップを作成
	for (let i=0; i<MASU_NUM; i++){
		let th = 2*Math.PI*i/MASU_NUM+Math.PI/2;
		let x = MAP_CENTER[0]+MAP_RADIUS*Math.cos(th);
		let y = MAP_CENTER[1]+MAP_RADIUS*Math.sin(th);
		//console.log(x,y);
		map.push(new Masu(x,y,i+1,0));

		// マスにマスの種類の識別子を与える
		if(i==0){
			map[i].id = 1;
		}else if(i==(MASU_NUM/2|0)){
			map[i].id = 2;
		}else if(i==(MASU_NUM/4|0)*3 || i==(MASU_NUM/4|0)){
			map[i].id = 3;
		}
	}

	// マス描画
	disp();
}

main();