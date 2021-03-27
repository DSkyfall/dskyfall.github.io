var setupContext = {}
var canvas;
var gl;
var time = 0.0;
var context = {};
var frameData;

function vec3Add(a,b)
{
	return [a[0]+b[0], a[1]+b[1], a[2]+b[2]];
}

function vec3Scale(a,s)
{
	return [a[0]*s, a[1]*s, a[2]*s];
}

function rotX(a)
{
	var c = Math.cos(a);
	var s = Math.sin(a);
	return {x:[1.0,0.0,0.0], y:[0.0, c, s], z:[0.0, -s, c]};
}

function rotY(a)
{
	var c = Math.cos(a);
	var s = Math.sin(a);
	return {x:[c,0.0,-s], y:[0.0, 1.0, 0.0], z:[s, 0.0, c]};
}

function rotZ(a)
{
	var c = Math.cos(a);
	var s = Math.sin(a);
	return {x:[c,s,0.0], y:[-s, c, 0.0], z:[0.0, 0.0, 1.0]};
}

function transform(t, v)
{
	return vec3Add(vec3Scale(t.x, v[0]), vec3Add(vec3Scale(t.y, v[1]), vec3Scale(t.z, v[2])));
}

function mulTransform(t1, t2)
{
	return {x:transform(t1, t2.x), y:transform(t1,t2.y), z:transform(t1,t2.z)};
}

function setup(canvasid)
{
	canvas = document.getElementById(canvasid);
	window.onresize = function() {
		canvas.width = window.innerWidth-canvas.offsetLeft;
		canvas.height = window.innerHeight-canvas.offsetTop;

		log("vrD " + context.vrDisplay + " isP " + (context.vrDisplay && context.vrDisplay.isPresenting));
		if (context.vrDisplay){// && context.vrDisplay.isPresenting) {
		log("vrResize");
			  var leftEye = context.vrDisplay.getEyeParameters("left");
			  var rightEye = context.vrDisplay.getEyeParameters("right");

			  canvas.width = Math.max(leftEye.renderWidth, rightEye.renderWidth) * 2;
			  log("renderWidth " + leftEye.renderWidth);
			  canvas.height = Math.max(leftEye.renderHeight, rightEye.renderHeight);
		} else {
			  canvas.width = canvas.offsetWidth * window.devicePixelRatio;
			  canvas.height = canvas.offsetHeight * window.devicePixelRatio;
		}
		log("canvas " + canvas.width + " " + canvas.height);
	}
		
	window.onresize();
	
	gl = canvas.getContext('experimental-webgl');
	var vertices = [
		-3,-3,-3,
		3,-3,3,
		0.0,3,0,
		
		-3,0,-3,
		0,-3,3,
		0,3,3,
		
		3,0,3,
		0,3,-3,
		0,-3,-3,
	]
	setupContext.vertex_buffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, setupContext.vertex_buffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
	gl.bindBuffer(gl.ARRAY_BUFFER, null);
	
	//Console.log("setup")
	
	window.onmousemove = function(e)
	{
		context.mouseX = e.clientX/canvas.width;
		context.mouseY = e.clientY/canvas.height;
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
	
	context.cameraPos = [0.0, 1.8, 0.0];
	context.cameraRight = [1.0, 0.0, 0.0];
	context.cameraUp = [0.0, 0.0, 1.0];
	context.cameraForward = [0.0, 1.0, 0.0];
	context.speed = 1.0;
	
	context.startTime = Date.now();
	context.time = context.startTime;
	
	context.controllers = [{position:[0.0, 0.0, 0.0], velocity:[0.0, 0.0, 0.0]}, {position:[0.0, 0.0, 0.0], velocity:[0.0, 0.0, 0.0]}];
}

function setupFullscreenShader(shaderid)
{
	
	var vertCode =
		'attribute vec3 coordinates;' +
		'varying vec2 coord;' +
		'void main(void) {' +
		' gl_Position = vec4(coordinates.xy, 0.0, 1.0);' +
		'  coord = coordinates.zy;' +
		'}';
	
	var vertShader = gl.createShader(gl.VERTEX_SHADER);
	gl.shaderSource(vertShader, vertCode);
	gl.compileShader(vertShader);
	if (!gl.getShaderParameter(vertShader, gl.COMPILE_STATUS)) {
		document.getElementById('info').innerHTML = "could not compile shader:" + gl.getShaderInfoLog(vertShader);
		throw "could not compile shader:" + gl.getShaderInfoLog(vertShader);
	}
	var fragCode = document.getElementById('shader-fs').text;
	var fragShader = gl.createShader(gl.FRAGMENT_SHADER);
	gl.shaderSource(fragShader, fragCode);
	gl.compileShader(fragShader);
	if (!gl.getShaderParameter(fragShader, gl.COMPILE_STATUS)) {
		document.getElementById('info').innerHTML = "could not compile shader:" + gl.getShaderInfoLog(fragShader);
		throw "could not compile shader:" + gl.getShaderInfoLog(fragShader);
	}
	var shaderProgram = gl.createProgram();
	gl.attachShader(shaderProgram, vertShader);
	gl.attachShader(shaderProgram, fragShader);
	gl.linkProgram(shaderProgram);
	//Console.log("shader");
	return shaderProgram;
}

function setupVR()
{
	log("setupVR");
	 if (navigator.getVRDisplays) {
        frameData = new VRFrameData();

        navigator.getVRDisplays().then(function (displays) {
			if (displays.length > 0) {
				context.vrDisplay = displays[displays.length - 1];
				log("vrdisplay");
				if (context.vrDisplay.capabilities.canPresent)
				{
					context.vrDisplay.requestPresent([{ source: canvas }]);
					log("requestPresent");
					window.onresize();					
					//context.vrDisplay.requestAnimationFrame(update);
				}
			}
		}).catch(function (err)
		{
			log("Error " + err);
		});
	}
}

function setPose(shaderProgram, m, p)
{
	var a = p[0];
	var c = p[5];
	var b = p[8];
	var d = p[9];

	/*var x = [m[0], m[1], m[2]];
	var y = [m[4], m[5], m[6]];
	var z = [m[8], m[9], m[10]];*/
	
	var x = [m[0], m[4], m[8]];
	var y = [m[1], m[5], m[9]];
	var z = [m[2], m[6], m[10]];
	var pos = [-m[12], -m[13]+1.8, -m[14]];
	pos = vec3Add(vec3Scale(x, -m[12]), vec3Add(vec3Scale(y, -m[13]), vec3Scale(z, -m[14])));
	pos[1] += 1.8;
	
	var right = vec3Scale(x, 1.0/a);
	var up = vec3Scale(y, 1.0/c);
	var forward = vec3Add(vec3Scale(z,-1.0), vec3Add(vec3Scale(x, b/a), vec3Scale(y, d/c)));
	
	//right = x;
	//up = y;
	//forward = vec3Scale(z, -1.0);
	

	var centerLoc = gl.getUniformLocation(shaderProgram, "cameraPos");
	gl.uniform3fv(centerLoc, pos);
	centerLoc = gl.getUniformLocation(shaderProgram, "cameraRight");
	gl.uniform3fv(centerLoc, right);
	centerLoc = gl.getUniformLocation(shaderProgram, "cameraUp");
	gl.uniform3fv(centerLoc, up);
	centerLoc = gl.getUniformLocation(shaderProgram, "cameraForward");
	gl.uniform3fv(centerLoc, forward);
}

var firstTime = 0;
function setupDrawFullscreen(shaderProgram)
{
	gl.useProgram(shaderProgram);
	
	var centerLoc = gl.getUniformLocation(shaderProgram, "center");
	gl.uniform2f(centerLoc, context.mouseX*2.0-1.0, 1.0-2.0*context.mouseY);
	
	centerLoc = gl.getUniformLocation(shaderProgram, "cameraPos");
	gl.uniform3fv(centerLoc, context.cameraPos);
	centerLoc = gl.getUniformLocation(shaderProgram, "cameraRight");
	gl.uniform3fv(centerLoc, context.cameraRight);
	centerLoc = gl.getUniformLocation(shaderProgram, "cameraUp");
	gl.uniform3fv(centerLoc, vec3Scale(context.cameraUp, canvas.height/canvas.width));
	centerLoc = gl.getUniformLocation(shaderProgram, "cameraForward");
	gl.uniform3fv(centerLoc, context.cameraForward);
	
	centerLoc = gl.getUniformLocation(shaderProgram, "time");
	gl.uniform1f(centerLoc, (context.time-context.startTime)*0.001);
 
  gl.bindBuffer(gl.ARRAY_BUFFER, setupContext.vertex_buffer);
  //gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
  var coord = gl.getAttribLocation(shaderProgram, "coordinates");
  gl.vertexAttribPointer(coord, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(coord);
  gl.clearColor(0.0, 0.0, 0.0, 0.0);
  gl.enable(gl.DEPTH_TEST);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  
  if(context.vrDisplay && context.vrDisplay.isPresenting)
  {
	 context.vrDisplay.getFrameData(frameData);
	
	gl.viewport(0,0,canvas.width/2,canvas.height);
	setPose(shaderProgram, frameData.leftViewMatrix, frameData.leftProjectionMatrix);
	gl.drawArrays(gl.TRIANGLES, 0, 3);
	gl.viewport(canvas.width/2,0,canvas.width/2,canvas.height);
	setPose(shaderProgram, frameData.rightViewMatrix, frameData.rightProjectionMatrix);
	gl.drawArrays(gl.TRIANGLES, 0, 3);
	context.vrDisplay.submitFrame();
  }
  else
  {
	gl.viewport(0,0,canvas.width,canvas.height);
	gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
}

function setConstant(shaderProgram, name, v)
{
	gl.useProgram(shaderProgram);
	var loc = gl.getUniformLocation(shaderProgram, name);
	if(v.length == 3)
		gl.uniform3fv(loc, v);
	else
		gl.uniform4fv(loc, v);		
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
	var trans = mulTransform(rotY((-context.mouseX*2.0+1.0)*Math.PI), rotX(1.0-context.mouseY*2.0));
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
		
		
	 if(context.vrDisplay && context.vrDisplay.isPresenting)
	{
		context.vrDisplay.requestAnimationFrame(update);
		context.vrDisplay.getFrameData(frameData);
		context.vrGamepads = [];

          var gamepads = navigator.getGamepads();
          for (var i = 0; i < gamepads.length; ++i) {
            var gamepad = gamepads[i];
            // The array may contain undefined gamepads, so check for that as
            // well as a non-null pose. VR clicker devices such as the Carboard
            // touch handler for Daydream have a displayId but no pose.
            if (gamepad) {
              if (gamepad.pose || gamepad.displayId)
                context.vrGamepads.push(gamepad);

              if ("hapticActuators" in gamepad && gamepad.hapticActuators.length > 0) {
                for (var j = 0; j < gamepad.buttons.length; ++j) {
                  if (gamepad.buttons[j].pressed) {
                    // Vibrate the gamepad using to the value of the button as
                    // the vibration intensity.
					//log("cont " + i + " button " + j);
                    gamepad.hapticActuators[0].pulse(gamepad.buttons[j].value, 100);
                    break;
                  }
                }
              }
            }
          }
		  
		  for(var i=0; i<2 && i<context.vrGamepads.length; i++)
		  {
			context.controllers[i].position = [context.vrGamepads[i].pose.position[0], context.vrGamepads[i].pose.position[1], context.vrGamepads[i].pose.position[2]];
			context.controllers[i].position[1] += 1.8;
			context.controllers[i].velocity = context.vrGamepads[i].pose.linearVelocity;
		  }
	}
	else
	{
		window.requestAnimationFrame(update);
	}
}