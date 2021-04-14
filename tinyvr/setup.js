
var canvas;
var gl;
var time = 0.0;
var context = {"yaw":0.0, "pitch":0.0};
var frameData;

function setup(canvasid)
{
	canvas = document.getElementById(canvasid);
	window.onresize = function() {
		canvas.width = window.innerWidth-canvas.offsetLeft;
		canvas.height = window.innerHeight-canvas.offsetTop;
	}
	window.onresize();
	
	
	
	//Console.log("setup")
	
	window.onmousemove = function(e)
	{
		context.mouseX = e.clientX/canvas.width;
		context.mouseY = e.clientY/canvas.height;
		if (event.buttons && 2) {
			context.yaw += event.movementX/canvas.width;
			context.pitch += event.movementY/canvas.width;
		}
	}
	
	window.onkeydown = function(e)
	{
		logF('keydown ' + e.keyCode);
		if(e.keyCode == 87 || e.keyCode == 38)
			context.forward = true;
		if(e.keyCode == 83 || e.keyCode == 40)
			context.backward = true;
		if(e.keyCode == 68 || e.keyCode == 39)
			context.right = true;
		if(e.keyCode == 65 || e.keyCode == 37)
			context.left = true;
	}
	
	window.onkeyup = function(e)
	{
		if(e.keyCode == 87 || e.keyCode == 38)
			context.forward = false;
		if(e.keyCode == 83 || e.keyCode == 40)
			context.backward = false;
		if(e.keyCode == 68 || e.keyCode == 39)
			context.right = false;
		if(e.keyCode == 65 || e.keyCode == 37)
			context.left = false;
	}
	
	let primaryTouch = undefined;
	let prevTouchX = undefined;
	let prevTouchY = undefined;
	canvas.addEventListener("touchstart", (event) => {
		if (primaryTouch == undefined) {
			let touch = event.changedTouches[0];
			primaryTouch = touch.identifier;
			prevTouchX = touch.pageX;
			prevTouchY = touch.pageY;
		}
	});
	canvas.addEventListener("touchend", (event) => {
		for (let touch of event.changedTouches) {
			if (primaryTouch == touch.identifier) {
				primaryTouch = undefined;
				context.yaw += (touch.pageX - prevTouchX)/canvas.width;
				context.pitch += (touch.pageY - prevTouchY)/canvas.height;
			}
		}
	});
	canvas.addEventListener("touchcancel", (event) => {
		for (let touch of event.changedTouches) {
			if (primaryTouch == touch.identifier) {
				primaryTouch = undefined;
			}
		}
	});
	canvas.addEventListener("touchmove", (event) => {
		for (let touch of event.changedTouches) {
			if (primaryTouch == touch.identifier) {
				context.yaw += (touch.pageX - prevTouchX)/canvas.width;
				context.pitch += (touch.pageY - prevTouchY)/canvas.height;
				prevTouchX = touch.pageX;
				prevTouchY = touch.pageY;
			}
		}
	});
}
	
	context.cameraPos = [0.0, 1.8, 0.0];
	context.cameraRight = [1.0, 0.0, 0.0];
	context.cameraUp = [0.0, 0.0, 1.0];
	context.cameraForward = [0.0, 1.0, 0.0];
	context.speed = 1.0;
	
	context.startTime = Date.now();
	context.time = context.startTime;
	
	context.controllers = [{position:[0.0, 0.0, 0.0], velocity:[0.0, 0.0, 0.0]}, {position:[0.0, 0.0, 0.0], velocity:[0.0, 0.0, 0.0]}];
}

function logMatrix(m)
{
	for(var i = 0; i<4; i++)
	{
		log(m[i].toFixed(3) + ', '  + m[4+i].toFixed(3) + ', ' + m[8+i].toFixed(3) + ', ' + m[12+i].toFixed(3));
	}
}

function log(text)
{
	document.getElementById('info').innerHTML += text + '<br>';
}

function logF(text)
{
	document.getElementById('infoFrame').innerHTML += text + '<br>';
}

function pretty(v)
{
	var s = '' + v[0].toFixed(3);
	for(var i=1; i<v.length; i++)
	{
		s = s + ', ' + v[i].toFixed(3);
	}
	return s;
}

function setupUpdate()
{
	var newTime = Date.now();
	context.delta = (newTime-context.time)*0.001;
	context.time = newTime;
	
	document.getElementById('infoFrame').innerHTML = '';
	var trans = mulTransform(rotY((-context.yaw*2.0+1.0)*Math.PI), rotX(1.0-context.pitch*2.0));
	//var trans = rotZ((context.mouseX*2.0-1.0)*Math.PI);
		
	context.cameraForward = vec3Scale(trans.z, -1.0);
	context.cameraUp = trans.y;
	context.cameraRight = trans.x;
	context.controllers[0].position = vec3Add(vec3Add(context.cameraForward, context.cameraPos), vec3Scale(context.cameraRight, -0.5));
	context.controllers[1].position = vec3Add(vec3Add(context.cameraForward, context.cameraPos), vec3Scale(context.cameraRight, 0.5));
	
	logF(' delta ' + context.delta);
	logF('p ' + pretty(context.cameraPos));
	logF('x ' + pretty(trans.x));
	logF('y ' + pretty(trans.y));
	logF('z ' + pretty(trans.z));
	
	var step = context.delta*context.speed*10.0;
	if(context.forward)
		context.cameraPos = vec3Add(context.cameraPos, vec3Scale(context.cameraForward, step));
	if(context.backward)
		context.cameraPos = vec3Add(context.cameraPos, vec3Scale(context.cameraForward, -step));
	if(context.right)
		context.cameraPos = vec3Add(context.cameraPos, vec3Scale(context.cameraRight, step));
	if(context.left)
		context.cameraPos = vec3Add(context.cameraPos, vec3Scale(context.cameraRight, -step));
}