var shader;
var ws = null;
var connected = false;
var sphereCount = 0;
var sphereArray = new ArrayBuffer(0);
var sphereColorArray = new ArrayBuffer(0);

function setupWebSocket()
{
  if ("WebSocket" in window)
  {
    try
    {
		 ws = new WebSocket("ws://192.168.1.60:8001");
		 ws.binaryType = "arraybuffer";
		 ws.onopen = function()
		 {
			connected = true;
			ws.send("Join");
		 };
		 ws.onmessage = function (event) 
		 { 
			if(event.data instanceof ArrayBuffer)
			{
				var ints = new Int32Array(event.data);
				var buffer = event.data.slice(4);
				if(ints[0] == 0)
				{	
					sphereArray = buffer;
				}
				else
				{
					sphereColorArray = buffer;
				}
					
				sphereCount = buffer.byteLength/16;
			}
			else
			{
				if(event.data.lastIndexOf("msg", 0) == 0)
				{
					log(event.data.substr(4));
				}
			}
		 };
		 ws.onclose = function()
		 { 
			alert("Connection is closed...");
			connected = false;
		 };
		 
			//setInterval(Update, 30);
     
     }
     catch(exception)
     {
		connected = false;
        alert(exception);
     }
  }
  else
  {
		connected = false;
		alert("WebSocket NOT supported by your Browser!");
	}
}

function init()
{
	setup('canvas');
	//initWebVR();
	//initWebgl();
	initXR();
	setupWebgl();
	shader = setupFullscreenShader('shader-fs');
	setupWebSocket();
	
}

var shotPos = [0.0, 1.5, -3.0];
var shotSpeed = [0.0, 0.0, 0.0];

function pushArray(a, b)
{
	for(var i=0; i<b.length; i++)
	{
		a.push(b[i]);
	}
}

function update()
{
	setupUpdate();
		
	if(context.vrGamepads && context.vrGamepads[1])
	{
		if(context.vrGamepads[1].buttons[1].pressed)
		{
			shotPos = vec3Scale(context.controllers[1].position, 1.0);
			shotSpeed = vec3Scale(context.controllers[1].velocity, 1.0);
			var o = context.vrGamepads[0].pose.orientation;
			shotSpeed = [2.0*o[0]*o[2] + 2.0*o[3]*o[1], 2*o[1]*o[2] - 2.0*o[3]*o[0], 1 - 2.0*o[0]*o[0] - 2.0*o[1]*o[1]];
		}
	}

	gl.useProgram(shader);
	gl.uniform1i(gl.getUniformLocation(shader, "sphereCount"), sphereCount);
	setConstant(shader, "spheres",  new Float32Array(sphereArray));
	setConstant(shader, "sphereColors",  new Float32Array(sphereColorArray));
	logF(sphereCount);
	var floats = new Float32Array(sphereArray);
	logF(floats.length);
	for(var i=0; i<floats.length; i++)
	{
		logF(floats[i]);
	}
	
	var buffer = new ArrayBuffer(20);
        const view = new Float32Array(buffer);
		view[0] = context.cameraPos[0];
		view[1] = context.cameraPos[1];
		view[2] = context.cameraPos[2];
        view[3] = context.mouseX;
        view[4] = context.mouseY;

	if (connected)
		ws.send(buffer);
}

function draw()
{
	drawFullscreen(shader);
}