function frameWebVR()
{
	if(context.vrDisplay && context.vrDisplay.isPresenting)
	{
		context.vrDisplay.requestAnimationFrame(frameWebVR);
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
		window.requestAnimationFrame(frameWebVR);
	}
	
	
	gl.clearColor(0.0, 0.0, 0.0, 0.0);
  gl.enable(gl.DEPTH_TEST);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  update();
  
  if(context.vrDisplay && context.vrDisplay.isPresenting)
  {
	 context.vrDisplay.getFrameData(frameData);
	
	gl.viewport(0,0,canvas.width/2,canvas.height);
	draw(frameData.leftViewMatrix, frameData.leftProjectionMatrix);
	gl.viewport(canvas.width/2,0,canvas.width/2,canvas.height);
	draw(frameData.rightViewMatrix, frameData.rightProjectionMatrix);
	context.vrDisplay.submitFrame();
  }
  else
  {
	gl.viewport(0,0,canvas.width,canvas.height);
	draw(null, null);
  }
}

function initWebVR()
{
	gl = canvas.getContext('webgl');
	window.requestAnimationFrame(frameWebVR);
	if (navigator.getVRDisplays)
	{
		 navigator.getVRDisplays().then(function (displays) {
			if (displays.length > 0)
				setVREnabled(true);
		 });
	}
}

function requestVR()
{
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
	
	
	log("setupVR");
	 if (navigator.getVRDisplays) {
        frameData = new VRFrameData();
		log("getVRDisplays");

        navigator.getVRDisplays().then(function (displays) {
			if (displays.length > 0) {
				context.vrDisplay = displays[displays.length - 1];
				log("vrdisplay" + display.length);
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