import * as THREE from './three.js/build/three.module.js'
import Stats from './three.js/examples/jsm/libs/stats.module.js';
import { Octree } from './three.js/examples/jsm/math/Octree.js';
import { Capsule } from './three.js/examples/jsm/math/Capsule.js';


var clock = new THREE.Clock();
var blocker = document.getElementById("blocker")
var scene = new THREE.Scene();
scene.background = new THREE.Color( 0x88ccff );

var camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
camera.rotation.order = 'YXZ';

var ambientlight = new THREE.AmbientLight( 0x6688cc );
scene.add( ambientlight );

var dirlight = new THREE.DirectionalLight( 0xff9999, 1 );
dirlight.position.set( - 1, 1, 2 );
scene.add( dirlight );


var renderer = new THREE.WebGLRenderer( { antialias: true } );
renderer.setPixelRatio( window.devicePixelRatio );
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.VSMShadowMap;

var container = document.getElementById( 'container' );

container.appendChild( renderer.domElement );

var stats = new Stats();
stats.domElement.style.position = 'absolute';
stats.domElement.style.top = '0px';

container.appendChild( stats.domElement );

var GRAVITY = 30;
var STEPS_PER_FRAME = 5;

var BoxGeometry = new THREE.BoxGeometry(6, 1,6)
var BoxMaterial = new THREE.MeshPhongMaterial({ color: 0xaaff77, wireframe: false });
var BoxMaterial2 = new THREE.MeshPhongMaterial({ color: 0xffffff, wireframe: false });
var Box1 = new THREE.Mesh(BoxGeometry, BoxMaterial);
Box1.receiveShadow = true;


var box2 = new THREE.Mesh(BoxGeometry, BoxMaterial);
box2.receiveShadow = true;
box2.position.z = -8

var box3 = new THREE.Mesh(BoxGeometry, BoxMaterial);
box3.receiveShadow = true;
box3.position.z = -20
box3.position.y = 2

var box4 = new THREE.Mesh(BoxGeometry, BoxMaterial);
box4.receiveShadow = true;
box4.position.z = -30
box4.position.y = 4.5

var box5 = new THREE.Mesh(BoxGeometry, BoxMaterial2);
box5.receiveShadow = true;
box5.position.z = -46
box5.position.y = 0


var octree = new Octree();
var playerCollider = new Capsule( new THREE.Vector3( 0, 0.35, 0 ), new THREE.Vector3( 0, 1, 0 ), 0.35 );
var playerVelocity = new THREE.Vector3();
var playerDirection = new THREE.Vector3();
var playerOnFloor = false;
var keyStates = {};


document.addEventListener( 'keydown', ( event ) => {
    keyStates[ event.code ] = true;
} );

document.addEventListener( 'keyup', ( event ) => {

    keyStates[ event.code ] = false;

} );

document.addEventListener( 'mousedown', () => {
    document.body.requestPointerLock();
    mouseTime = performance.now();
} );


function playerCollisions() {

    var result = octree.capsuleIntersect( playerCollider );
    playerOnFloor = false;

    if ( result ) {

        playerOnFloor = result.normal.y > 0;

        if ( ! playerOnFloor ) {

            playerVelocity.addScaledVector( result.normal, - result.normal.dot( playerVelocity ) );

        }

        playerCollider.translate( result.normal.multiplyScalar( result.depth ) );

    }

}

function updatePlayer( deltaTime ) {
    var damping = Math.exp( - 4 * deltaTime ) - 1;

    if ( ! playerOnFloor ) {

        playerVelocity.y -= GRAVITY * deltaTime;
        damping *= 0.1;

    }

    playerVelocity.addScaledVector( playerVelocity, damping );

    var deltaPosition = playerVelocity.clone().multiplyScalar( deltaTime );
    playerCollider.translate( deltaPosition );

    playerCollisions();

    camera.position.copy( playerCollider.end );

    if(camera.position.z < -46){
        finished()
    }
}
function finished(){
    blocker.style.display = "inline"
    document.getElementById("timer").style.display = 'none'
    document.getElementById("timeelapsed").style.display = 'inline'
    document.getElementById("title").innerHTML = "FINISH"
}
function getForwardVector() {

    camera.getWorldDirection( playerDirection );
    playerDirection.y = 0;
    playerDirection.normalize();

    return playerDirection;

}

function getSideVector() {

    camera.getWorldDirection( playerDirection );
    playerDirection.y = 0;
    playerDirection.normalize();
    playerDirection.cross( camera.up );

    return playerDirection;

}

function controls( deltaTime ) {

    var speedDelta = deltaTime * ( playerOnFloor ? 25 : 8 );
    if ( keyStates[ 'KeyW' ] ) {
        playerVelocity.add( getForwardVector().multiplyScalar( speedDelta ) );
    }

    if ( keyStates[ 'KeyS' ] ) {
        playerVelocity.add( getForwardVector().multiplyScalar( - speedDelta ) );
    }

    if ( keyStates[ 'KeyA' ] ) {
        playerVelocity.add( getSideVector().multiplyScalar( - speedDelta ) );
    }

    if ( keyStates[ 'KeyD' ] ) {
        playerVelocity.add( getSideVector().multiplyScalar( speedDelta ) );
    }
    if ( keyStates[ 'ArrowLeft' ] ) {
        camera.rotation.y -= -1/100
    }
    if ( keyStates[ 'ArrowRight' ] ) {
        camera.rotation.y -= 1/100
    }
    if ( playerOnFloor ) {
        if ( keyStates[ 'Space' ] ) {
            playerVelocity.y = 15;
        }
    }
    if(keyStates[ 'Enter' ] && blocker.style.display == 'inline'){
        location.reload()
    }

}


var objects = [
    box2,
    Box1,
    box3,
    box4,
    box5,

]

objects.forEach(object => {
    scene.add(object)
    octree.fromGraphNode( object );
});
animate();


function teleportPlayerIfOob(){
    if (camera.position.y <= -25){
        playerCollider.start.set( 0, 0.35, 0 );
        playerCollider.end.set( 0, 1, 0 );
        playerCollider.radius =  0.35;
        camera.position.copy( playerCollider.end );
        camera.rotation.set( 0, 0, 0 );
       gameover();
    }
}

function gameover(){
    blocker.style.display = 'inline'
    document.getElementById("timer").style.display = 'none'
}

function timer(){
    var time =60 - Math.round(clock.elapsedTime)
    document.getElementById("timer").innerHTML = ""
    document.getElementById("timer").innerHTML = time
    if(time < 0){
        gameover();
    }
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );
}
window.addEventListener( 'resize', onWindowResize );
function animate() {

    var deltaTime = Math.min( 0.05, clock.getDelta() ) / STEPS_PER_FRAME;
    for ( var i = 0; i < STEPS_PER_FRAME; i ++ ) {
        controls( deltaTime );
        updatePlayer( deltaTime );
        timer()
        teleportPlayerIfOob();
    }

    renderer.render( scene, camera );
    stats.update();
    requestAnimationFrame( animate );

}