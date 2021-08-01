const canvas = document.getElementById('canvas'); // canvas要素への参照の取得
const ctx = canvas.getContext('2d'); // コンテキストの取得

const RED = '#ff4b00'
const GREEN = '#03af7a'
const BLUE = '#005aff'
const BLACK = '#000'

ctx.strokeStyle = RED;
ctx.fillStyle = RED;
ctx.lineWidth = 4;

const MASU_NUM = 16;
const MASU_RADIUS = 20;
const MAP_CENTER = [canvas.width/2,canvas.height/2];
const MAP_RADIUS = canvas.width/3.2;
const PLAYER_NUM = 2;
const PLAYER_RADIUS = MASU_RADIUS * 0.5;

const UI_ALLOW_RADIUS = MAP_RADIUS * 1.5;
const UI_ALLOW_TIP_LENGTH = 10;

const FPS = 60;
const ANIMAION_PLAYER_MAX_TIME = 500;
const NPC_WAIT_TIME = 400+ANIMAION_PLAYER_MAX_TIME;

let map = []
let players = []
let dire = 1; // 駒の進行方向

let input_wait = 0;
let npc_event = null;
let goal_finish = 0;

let consecutive_wins = 0;

class Coma{
	constructor(No){
		this.No = No;
		this.pos = 0;
		this.ppos = 0;
		this.x = 0;
		this.y = 0;
		this.start_t = 0;
		this.elapsed_t = ANIMAION_PLAYER_MAX_TIME;
		this.last_move = 0;
	}

	init(){
		this.pos = 0;
		this.ppos = 0;
		this.x = 0;
		this.y = 0;
		this.start_t = 0;
		this.elapsed_t = ANIMAION_PLAYER_MAX_TIME;
		this.last_move = 0;
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
		this.ppos = this.pos;
		this.pos += d*dire;
		this.last_move = d*dire;
		console.log("dice:"+d*dire);
		this.pos = (this.pos+16)%MASU_NUM;

		// 止まったマスの効果
		map[this.pos].effect(this.No);
		this.x = map[this.pos].x;
		this.y = map[this.pos].y;

		this.start_t = Date.now();
		this.elapsed_t = 0;
	}
	animation(){
		if(this.elapsed_t<ANIMAION_PLAYER_MAX_TIME){
			let th = 2*Math.PI/MASU_NUM*this.last_move*this.elapsed_t/ANIMAION_PLAYER_MAX_TIME+(2*Math.PI*this.ppos/MASU_NUM+Math.PI/2);
			let x = MAP_CENTER[0]+MAP_RADIUS*Math.cos(th);
			let y = MAP_CENTER[1]+MAP_RADIUS*Math.sin(th);
			this.x = x;
			this.y = y;

			this.elapsed_t=Date.now()-this.start_t;
		}else{
			this.x = map[this.pos].x;
			this.y = map[this.pos].y;
		}
	}

	automove(){

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
		ctx.arc(this.x, this.y, PLAYER_RADIUS, 0, 2 * Math.PI);
		
		ctx.moveTo(this.x, this.y);
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

	effect(p_No){
		console.log("masu_id:"+this.id);
		switch(this.id){
			case 1:break;
			case 2:goal(p_No);break;
			case 3:dire *= -1;break;
			default:break;
		}
	}

	draw(){
		switch(this.id){
			case 1:ctx.fillStyle = BLACK;break;
			case 2:ctx.fillStyle = BLACK;break;
			case 3:ctx.fillStyle = GREEN;break;
			default:ctx.fillStyle = BLACK;break;
		}
		ctx.beginPath();
		ctx.arc(this.x, this.y, MASU_RADIUS/((this.id!=2)+1), 0, 2 * Math.PI); // (100, 50)の位置に半径30pxの円
		ctx.closePath();
		ctx.fill();
	}
}

class UI{
	static draw(){
		// 進行方向の矢印
		UI.write_allow();
		UI.write_remain_masu();
		UI.write_goal();
	}
	static write_allow(){
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
	}
	static write_remain_masu(){
		// ゴールまであと何マスか数える
		let n = Math.abs(Math.abs((MASU_NUM/2|0)-players[0].pos)-MASU_NUM*(((2*(players[0].pos<(MASU_NUM/2|0))-1)*dire<0)*(players[0].pos!=(MASU_NUM/2|0))));
		// ctx.fillStyle = BLACK;
		// ctx.fillText("あと"+n+"マス", MAP_CENTER[0], MAP_CENTER[1]-200);
		let remain_text = document.getElementById("remain");
		remain_text.innerHTML = "あと"+n+"マス";
	}
	static write_goal(){
		if(goal_finish){

		}
	}
}

function disp(){

	ctx.clearRect(0, 0, canvas.width, canvas.height);
	map.forEach(function(e){e.draw();});
	players.forEach(function(e){e.animation();e.draw();});
	UI.draw();
}

function goal(p_No){
	clearTimeout(npc_event);
	input_wait = 1;
	if(p_No==1){
		console.log("You win!");
		consecutive_wins++;
	}else{
		console.log("You lose...");
		consecutive_wins = 0;
	}
	goal_finish = 1;
}

function reset(){
	clearTimeout(npc_event);
	players.forEach(function(e){e.init();});
	goal_finish = 0;
	input_wait = 0;
	dire = 1;
	disp();
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
			if(goal_finish==0 && (event.key === 'd' || event.key === 'f')){
				npc_event = setTimeout('input_wait=0;players[1].move((Math.random()*2|0));disp();',NPC_WAIT_TIME);
			}
			
		}
		if (event.key === 'r') {
    		reset();
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
	setInterval(disp,1000/FPS);
}

main();