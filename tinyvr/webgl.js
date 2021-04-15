var setupContext = {}
var gl = null;

function setupWebgl()
{
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
}

function setConstant(shaderProgram, name, v)
{
	if(v.length == 0)
		return;
	gl.useProgram(shaderProgram);
	var loc = gl.getUniformLocation(shaderProgram, name);
	if(v.length == 3)
		gl.uniform3fv(loc, v);
	else
		gl.uniform4fv(loc, v);		
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

function drawFullscreen(shaderProgram, viewMatrix, projectionMatrix)
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
	
	if(viewMatrix && projectionMatrix)
	{
		setPose(shaderProgram, viewMatrix, projectionMatrix);
	}
	gl.drawArrays(gl.TRIANGLES, 0, 3);
 
}

function frameWebgl()
{
	window.requestAnimationFrame(frameWebgl);

	gl.clearColor(0.0, 0.0, 0.0, 0.0);
	gl.enable(gl.DEPTH_TEST);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	gl.viewport(0,0,canvas.width,canvas.height);
	update();
	draw(null, null);
}

function initWebgl()
{
	gl = canvas.getContext('webgl');
	window.requestAnimationFrame(frameWebgl);
}