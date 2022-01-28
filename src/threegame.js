

  import * as THREE from 'three';

  import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
  import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
  import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
  import { RoughnessMipmapper } from 'three/examples/jsm/utils/RoughnessMipmapper.js';
  import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

  const environment    = new RoomEnvironment();

  let camera, scene, renderer;
  var headbone= null;
  let poscpy = new THREE.Vector3();

  let skelehelp = null;// new THREE.SkeletonHelper();

  init();
  render();

  function init() {

    const container = document.createElement( 'div' );
    document.body.appendChild( container );

    camera = new THREE.PerspectiveCamera( 105, window.innerWidth / window.innerHeight, 0.5, 50 );
    camera.position.set( -40.8, 0.6, 2.7 );

    scene = new THREE.Scene();


    new RGBELoader()
      .setPath( 'img/' )
      .load( 'royal_esplanade_1k.hdr', function ( texture ) {

        const pmremGenerator = new THREE.PMREMGenerator( renderer );
        pmremGenerator.compileEquirectangularShader();
        scene.environment    = pmremGenerator.fromScene( environment ).texture;

        texture.mapping = THREE.EquirectangularReflectionMapping;

        scene.background = texture;
        // scene.environment = texture;

        render();

        // model

        // use of RoughnessMipmapper is optional
        const roughnessMipmapper = new RoughnessMipmapper( renderer );

        const loader = new GLTFLoader().setPath( 'mod/' );
        loader.load( 'warrior.glb', function ( gltf ) {

          gltf.scene.traverse( function ( child ) {
            console.log(child);
            if(child.name === 'shoulderR') headbone = child;
            if ( child.isMesh ) {
              // roughnessMipmapper.generateMipm aps( child.material );
            }

          } );

          scene.add( gltf.scene );

          skelehelp = new THREE.SkeletonHelper(gltf.scene);
          scene.add(skelehelp);
          roughnessMipmapper.dispose();

          render();

        } );

      } );

    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1;
    renderer.outputEncoding = THREE.sRGBEncoding;
    container.appendChild( renderer.domElement );

    const controls = new OrbitControls( camera, renderer.domElement );
    controls.addEventListener( 'change', render ); // use if there is no animation loop
    controls.minDistance = 2;
    controls.maxDistance = 10;
    controls.target.set( 0, 0, - 0.2 );
    controls.update();

    window.addEventListener( 'resize', onWindowResize );

  }

  function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );

    render();

  }

  //
  var bpos = new THREE.Vector3();
  bpos.y=1;

  const geometry = new THREE.BoxGeometry( 1, 1, 1 );
  const material = new THREE.MeshBasicMaterial( {color: 0x00ff00} );
  const cube     = new THREE.Mesh( geometry, material );
  scene.add( cube );

  const circleGeo = new THREE.CircleGeometry( 5, 3);
  const circle    = new THREE.Mesh( circleGeo, material);
  // scene.add(circle);

  const orders = [
    'XYZ',
    'YZX',
    'ZXY',
    'XZY',
    'YXZ',
    'ZYX'
  ];
  var currOrder = 0;
  var upX=0;
  var upY=1;
  var upZ=0;
  window.addEventListener("keydown", e=>{
    switch(e.code){
      case "KeyA":  cube.position.x -= 1; break;
      case "KeyW":  cube.position.z -= 1; break;
      case "KeyS":  cube.position.z += 1; break;
      case "KeyD":  cube.position.x += 1; break;
      case "KeyQ":  cube.position.y += 1; break;
      case "KeyE":  cube.position.y -= 1; break;
      case "Digit1": upX++; if(upX==2)upX=-1; console.log(upX, upY, upZ); break;
      case "Digit2": upY++; if(upY==2)upY=-1; console.log(upX, upY, upZ); break;
      case "Digit3": upZ++; if(upZ==2)upZ=-1; console.log(upX, upY, upZ); break;
      case "Space":
        currOrder = (currOrder+1) % orders.length;
        console.log(orders[currOrder]);
        break;
      default: console.log(e);
    }
    render();
  })

  function render() {
    if(headbone && poscpy) {
      poscpy.copy( cube.position );
      // poscpy.clampScalar(-50, 50);

      headbone.rotation.order = orders[currOrder];
      headbone.up.set(upX, upY, upZ);
      headbone.lookAt(headbone.worldToLocal(poscpy) );
      headbone.rotateZ(6);

      circle.lookAt(poscpy);
      console.log(headbone.up, headbone.rotation);
    }
    if(bpos) {
      console.log(bpos);
    }
    renderer.render( scene, camera );

  }
