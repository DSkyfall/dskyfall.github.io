let xrButton = null;
let xrImmersiveRefSpace = null;
let xrInlineRefSpace = null;

function initXR() {
	gl = canvas.getContext('webgl', { xrCompatible: true });
	if (navigator.xr) {
		navigator.xr.isSessionSupported('immersive-vr').then((supported) => {
			setVREnabled(supported);
		});
		navigator.xr.requestSession('inline').then((session) => {
			inlineSession = session;
			onSessionStarted(session);
		});
	}
	else
	{
		alert("webxr not supported");
	}
}
function requestVR() {
	return navigator.xr.requestSession('immersive-vr').then((session) => {
		session.isImmersive = true;
		onSessionStarted(session);
	});
}
function onSessionStarted(session) {
	session.addEventListener('end', onSessionEnded);
	if (!gl) {
		function onResize() {
			canvas.width = canvas.clientWidth * window.devicePixelRatio;
			canvas.height = canvas.clientHeight * window.devicePixelRatio;
		}
		window.addEventListener('resize', onResize);
		onResize();
		addInlineViewListeners(canvas);
	}
	let glLayer = new XRWebGLLayer(session, gl);
	session.updateRenderState({
		baseLayer: glLayer
	});
	let refSpaceType = session.isImmersive ? 'local' : 'viewer';
	session.requestReferenceSpace(refSpaceType).then((refSpace) => {
		if (session.isImmersive) {
			xrImmersiveRefSpace = refSpace;
		} else {
			xrInlineRefSpace = refSpace;
		}
		session.requestAnimationFrame(onXRFrame);
	});
}
function onEndSession(session) {
	session.end();
}
function onSessionEnded(event) {
	if (event.session.isImmersive) {
		//xrButton.setSession(null);
	}
}
function transpose(m)
{
	let r = new Float32Array(16);
	for(let i =0; i<4; i++)
	{
		for(let j=0; j<4; j++)
		{
			r[i*4+j] = m[j*4+i];
		}
	}
}
function onXRFrame(t, frame) {
	let session = frame.session;
	let refSpace = session.isImmersive ? xrImmersiveRefSpace : xrInlineRefSpace;
	if (!session.isImmersive) {
		//refSpace = getAdjustedRefSpace(refSpace);
	}
	let pose = frame.getViewerPose(refSpace);
	session.requestAnimationFrame(onXRFrame);
	
	// context.vrGamepads = []
		// // Check for and respond to any gamepad state changes.
	// for (let source of session.inputSources) {
		// if (source.gamepad) {
			// let pose = frame.getPose(source.gripSpace, refSpace);
			
			// context.vrGamepads.push(source.gamepad)
			// //ProcessGamepad(source.gamepad, source.handedness, pose);
			// //pose.transform.matrix
		// }
	// }
	
	if (pose) {
		let glLayer = session.renderState.baseLayer;
		gl.bindFramebuffer(gl.FRAMEBUFFER, glLayer.framebuffer);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		update();
		for (let view of pose.views) {
			let viewport = glLayer.getViewport(view);
			gl.viewport(viewport.x, viewport.y,viewport.width, viewport.height);
			draw(transpose(view.transform.matrix), transpose(view.projectionMatrix));
		}
	}
}
let lookYaw = 0;
let lookPitch = 0;
const LOOK_SPEED = 0.0025;
function getAdjustedRefSpace(refSpace) {
	let invOrientation = quat.create();
	quat.rotateX(invOrientation, invOrientation, -lookPitch);
	quat.rotateY(invOrientation, invOrientation, -lookYaw);
	let xform = new XRRigidTransform(
			{x: 0, y: 0, z: 0},
			{x: invOrientation[0], y: invOrientation[1], z: invOrientation[2], w: invOrientation[3]});
	return refSpace.getOffsetReferenceSpace(xform);
}
function rotateView(dx, dy) {
	lookYaw += dx * LOOK_SPEED;
	lookPitch += dy * LOOK_SPEED;
	if (lookPitch < -Math.PI*0.5)
			lookPitch = -Math.PI*0.5;
	if (lookPitch > Math.PI*0.5)
			lookPitch = Math.PI*0.5;
}
function addInlineViewListeners(canvas) {
	canvas.addEventListener('mousemove', (event) => {
		if (event.buttons && 2) {
			rotateView(event.movementX, event.movementY);
		}
	});
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
				rotateView(touch.pageX - prevTouchX, touch.pageY - prevTouchY);
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
				rotateView(touch.pageX - prevTouchX, touch.pageY - prevTouchY);
				prevTouchX = touch.pageX;
				prevTouchY = touch.pageY;
			}
		}
	});
}