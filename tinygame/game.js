var shader;

function init()
{
	setup('canvas');
	shader = setupFullscreenShader('shader-fs');
	window.requestAnimationFrame(update);
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
	//window.requestAnimationFrame(update);
	setupUpdate();
	
	var spheres = [];
	var sphereColors = [];
	
	pushArray(spheres, [0.0, 0.0, 0.0, 1.0]);
	pushArray(sphereColors, [1.0, 1.0, 0.0, 1.0]);
	
	pushArray(spheres, context.controllers[0].position);
	spheres.push(0.1);
	pushArray(sphereColors, [1.0, 0.0, 0.0, 1.0]);
	
	pushArray(spheres, context.controllers[1].position);
	spheres.push(0.1);
	pushArray(sphereColors, [0.0, 0.0, 1.0, 1.0]);
	
	shotPos = vec3Add(shotPos, vec3Scale(shotSpeed, context.delta));
	if(shotPos[1] < 0.1 && shotSpeed[1] < 0.0)
	{
		shotSpeed[1] = -shotSpeed[1];
	}
	if(context.vrGamepads && context.vrGamepads[1])
	{
		if(context.vrGamepads[1].buttons[1].pressed)
		{
			shotPos = vec3Scale(context.controllers[1].position, 1.0);
			shotSpeed = vec3Scale(context.controllers[1].velocity, 1.0);
		}
	}	
	if(context.vrGamepads && context.vrGamepads[0])
	{
		if(context.vrGamepads[0].buttons[1].pressed)
		{
			var o = context.vrGamepads[0].pose.orientation;
			shotSpeed = [2.0*o[0]*o[2] + 2.0*o[3]*o[1], 2*o[1]*o[2] - 2.0*o[3]*o[0], 1 - 2.0*o[0]*o[0] - 2.0*o[1]*o[1]];
			//shotSpeed = [2.0*o[1]*o[3] - 2.0*o[0]*o[2], 2*o[2]*o[3] + 2.0*o[0]*o[1], 1 - 2.0*o[1]*o[1] - 2.0*o[2]*o[2]];
			log(pretty(shotSpeed));
			shotPos = vec3Scale(context.controllers[0].position, 1.0);
			shotSpeed = vec3Scale(shotSpeed, -100.0);
		}
	}	
	
	pushArray(spheres, shotPos);
	spheres.push(0.1);
	pushArray(sphereColors, [0.0, 1.0, 0.0, 1.0]);
	
	while(spheres.length < 64)
	{
		spheres.push(0.0);
		sphereColors.push(0.0);
	}
	
	setConstant(shader, "spheres",  new Float32Array(spheres));
	setConstant(shader, "sphereColors",  new Float32Array(sphereColors));
	setupDrawFullscreen(shader);	
}