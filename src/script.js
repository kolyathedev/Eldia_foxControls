import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import * as dat from 'lil-gui'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'

/**
 * Base
 */
// Debug
const gui = new dat.GUI()

// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

/**
 * Models
 */
const dracoLoader = new DRACOLoader()
dracoLoader.setDecoderPath('/draco/')

const gltfLoader = new GLTFLoader()
gltfLoader.setDRACOLoader(dracoLoader)

let mixer = null

// to store the fox's local position
let foxPosition = new THREE.Vector3()
// to store the fox's rotation around the y axis
let foxRotateY = 0

let fox = new THREE.Object3D()
let action

gltfLoader.load('/models/Fox/glTF/Fox.gltf', (gltf) => {
	fox = gltf.scene
	fox.scale.set(0.025, 0.025, 0.025)
	fox.name = 'fox'
	fox.castShadow = true

	scene.add(fox)
	// const animate = () => {
	// 	gltf.scene.position.x = foxPosition.x
	// }
	// Animation
	mixer = new THREE.AnimationMixer(gltf.scene)
	action = mixer.clipAction(gltf.animations[1])
})

console.log(fox, 'fox')

// direction of fox

let direction = new THREE.Vector3()

fox.getWorldDirection(direction)

console.log(direction, 'direction')

// this gives us the world direction of the fox

// I need to make it so the axis rotates along with the rotation of the fox, and then the up and down arrows move it in that direction up and down.
// play around with getWorldPosition and convert to local position and move along that some how??

let worldPost = new THREE.Vector3()
fox.getWorldPosition(worldPost)
console.log(worldPost, 'worldPosition')
/**
 * Floor
 */
const floor = new THREE.Mesh(
	new THREE.PlaneGeometry(500, 500, 50, 50),
	new THREE.MeshStandardMaterial({
		color: '#444444',
		metalness: 0,
		roughness: 0.5,
		wireframe: true,
	})
)
floor.receiveShadow = true
floor.rotation.x = -Math.PI * 0.5
scene.add(floor)

/**
 * Lights
 */

const ambientLight = new THREE.AmbientLight(0xffffff, 0.8)
scene.add(ambientLight)

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6)
directionalLight.castShadow = true
directionalLight.shadow.mapSize.set(1024, 1024)
directionalLight.shadow.camera.far = 15
directionalLight.shadow.camera.left = -7
directionalLight.shadow.camera.top = 7
directionalLight.shadow.camera.right = 7
directionalLight.shadow.camera.bottom = -7
directionalLight.position.set(-5, 5, 0)
scene.add(directionalLight)

/**
 * Sizes
 */
const sizes = {
	width: window.innerWidth,
	height: window.innerHeight,
}

window.addEventListener('resize', () => {
	// Update sizes
	sizes.width = window.innerWidth
	sizes.height = window.innerHeight

	// Update camera
	camera.aspect = sizes.width / sizes.height
	camera.updateProjectionMatrix()

	// Update renderer
	renderer.setSize(sizes.width, sizes.height)
	renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(
	75,
	sizes.width / sizes.height,
	0.1,
	100
)
// camera.position.set(0, 3, -2)
// change camera to follow behind fox
camera.position.set(0, 3, -2)
scene.add(camera)

console.log(fox.position)
// Controls
const controls = new OrbitControls(camera, canvas)
controls.target.set(0, 1.5, 0)
controls.enableDamping = true

//

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
	canvas: canvas,
})
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

/**
 * Movement
 */

// first we're going to just try to move the fox without fixing the camera perspective behind it

// create some variables to change in response to a key down /up event

// add event conditions - each time a key is pressed it changes the Vector3 of the item position

// some how changing the x and z position to add= the direction seems to work. I literally guessed this and it seems to work. maybe when my brain is running normally I will understand why it works.

// create cameraRotateY to hold the rotation value of the camera round the fox when it turns right/left
let cameraRotateY = 0

const onKeyDown = function (event) {
	switch (event.code) {
		case 'ArrowUp':
		case 'KeyW':
			// increase x by 1
			fox.getWorldDirection(direction)

			foxPosition.x += direction.x
			foxPosition.z += direction.z
			action.play()
			// OPPURTUNITY TO PLAY WITH FADE IN/OUT ANIMATIONS HERE FOR SMOOTHER FEEL
			//https://threejs.org/docs/?q=animationMi#api/en/animation/AnimationAction

			console.log(foxPosition)

			break

		case 'ArrowLeft':
		case 'KeyA':
			// moveLeft -=1

			foxRotateY += Math.PI / 8
			cameraRotateY += Math.PI / 8
			fox.getWorldDirection(direction)

			console.log(direction)

			break

		case 'ArrowDown':
		case 'KeyS':
			// moveBackward
			fox.getWorldDirection(direction)

			foxPosition.x -= direction.x
			foxPosition.z -= direction.z

			// idea - could action.play() play the loop backwards to simulate walking backwards?

			console.log(foxPosition)

			break

		case 'ArrowRight':
		case 'KeyD':
			foxRotateY -= Math.PI / 8
			cameraRotateY -= Math.PI / 8
			fox.getWorldDirection(direction)

			console.log(direction)

			break
	}
}

const onKeyUp = function (event) {
	switch (event.code) {
		case 'ArrowUp':
		case 'KeyW':
			action.stop()
			break

		case 'ArrowLeft':
		case 'KeyA':
			break

		case 'ArrowDown':
		case 'KeyS':
			break

		case 'ArrowRight':
		case 'KeyD':
			break
	}
}

// link above functions to dom and user inputs

document.addEventListener('keydown', onKeyDown)
document.addEventListener('keyup', onKeyUp)

/**
 * Animate
 */

const clock = new THREE.Clock()
let previousTime = 0

const tick = () => {
	const elapsedTime = clock.getElapsedTime()
	const deltaTime = elapsedTime - previousTime
	previousTime = elapsedTime

	// Model animations
	if (mixer) {
		mixer.update(deltaTime)
	}

	// Update controls
	controls.update()

	// Update position of Fox
	fox.position.x = foxPosition.x
	fox.position.z = foxPosition.z
	fox.rotation.y = foxRotateY

	// console.log(moveForward)
	// update camera to follow fox postiion and controls to always target fox
	camera.position.x = fox.position.x - 2 * Math.PI * direction.x
	camera.position.z = fox.position.z - 2 - 2 * Math.PI * direction.z
	// this works in the x and z direction, ie when the fox moves horizontally but how to change cam position when fox rotates?

	// Infact it perhaps just needs to move arond the circumference of a circular space round the fox object.
	// so if we can get the coordinates round the fox  and change camera position based on the direction vector

	// console.log(camera.position)

	controls.target.set(fox.position.x, 1.5, fox.position.z)

	// Render
	renderer.render(scene, camera)

	// Call tick again on the next frame
	window.requestAnimationFrame(tick)
}

tick()
