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