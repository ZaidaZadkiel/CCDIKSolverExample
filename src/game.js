

  import * as THREE from 'three';

  import { OrbitControls }      from 'three/examples/jsm/controls/OrbitControls.js';
  import { GLTFLoader }         from 'three/examples/jsm/loaders/GLTFLoader.js';
  import { RGBELoader }         from 'three/examples/jsm/loaders/RGBELoader.js';
  import { RoughnessMipmapper } from 'three/examples/jsm/utils/RoughnessMipmapper.js';
  import { RoomEnvironment }    from 'three/examples/jsm/environments/RoomEnvironment.js';
  import { CCDIKSolver }        from 'three/examples/jsm/animation/CCDIKSolver.js';

  const clock = new THREE.Clock();
  let delta = 1;
  let camera, scene, renderer;
  const environment = new RoomEnvironment();
  var m = THREE.MathUtils;
  let bones     = [];
  let targets   = {};
  let meshes    = {};
  let solver    = null;
  let skeleton  = null;
  let iktargets = [];
  let empties   = [];


  init();

  //
  var bpos = new THREE.Vector3();
  bpos.y=1;

  const geometry = new THREE.BoxGeometry( 0.5, 0.5, 0.5 );
  const material = new THREE.MeshPhongMaterial({color: 0xffffff, map: THREE.ImageUtils.loadTexture("img/800px_COLOURBOX6678562.jpg")});
  const cube     = new THREE.Mesh( geometry, material );
  scene.add( cube );

  const tinycube = new THREE.BoxGeometry( 0.25, 0.25, 0.25 );
  const marks = [];
  const spots = [];


  const circleGeo = new THREE.CircleGeometry( 5, 3);
  const circle    = new THREE.Mesh( circleGeo, material);
  // scene.add(circle);

  const map = new THREE.TextureLoader().load( 'img/TexturesCom_FloorStreets0070_1_seamless_S.jpg' );
  const spriteMat = new THREE.SpriteMaterial( { map: map } );

  const sprite = new THREE.Sprite( spriteMat );
  scene.add( sprite );

  var ambientLight = new THREE.AmbientLight(0x404040);
  scene.add(ambientLight);
  var dirLight = new THREE.DirectionalLight(0xffffff, 0.5);
  dirLight.position.set( -0.25, 1, 1 ).normalize();
  scene.add(dirLight);
  var hemiLight = new THREE.HemisphereLight(0xffffff, 0x000000, 0.5);
  // scene.add(hemiLight);

  const planeGeo = new THREE.PlaneGeometry(10, 10);
  const plane = new THREE.Mesh(planeGeo, material);
  plane.rotation.x=-1.6;
  plane.position.y=-0.5;
  // scene.add(plane);


  var textElem;

  function init() {

    const container = document.createElement( 'div' );
    document.body.appendChild( container );
    textElem = document.createElement('div');
    document.body.appendChild(textElem);
    textElem.innerHTML = "loler";
    textElem.style="position:absolute; left:0px; top:0px; font-family:monospace; line-height: 1.2;"

    camera = new THREE.PerspectiveCamera( 105, window.innerWidth / window.innerHeight, 0.5, 50 );
    camera.position.set( 40.8, 40.6, 42.7 );

    scene = new THREE.Scene();

    // new RGBELoader()
    //   .setPath( 'img/' )
    //   .load( 'royal_esplanade_1k.hdr', function ( texture ) {
    //
    //     const pmremGenerator = new THREE.PMREMGenerator( renderer );
    //     pmremGenerator.compileEquirectangularShader();
    //     scene.environment    = pmremGenerator.fromScene( environment ).texture;
    //
    //     texture.mapping = THREE.EquirectangularReflectionMapping;
    //
    //     scene.background = new THREE.Color("rgb(25, 0, 25)");
    //     // scene.environment = texture;
    //
    //     render();
    //
    //     // model
    //
    //     // use of RoughnessMipmapper is optional
    //     const roughnessMipmapper = new RoughnessMipmapper( renderer );
    //
    //
    //   } );

    const loader = new GLTFLoader().setPath( 'mod/' );
    loader.load( 'mostrodefuego_separated.glb', function ( gltf ) {

      let arrayBones = [];
      gltf.scene.traverse( function ( child ) {
        // console.log("child",child.name, child.type);

        if ( child.isMesh ) {
          meshes[child.name] = child;
        }
        if ( child.type==="Bone" ) {
          targets[child.name] = child;
          arrayBones.push(child);
        }
        if(child.name.startsWith("Empty")){
          empties.push(child);
          let m = new THREE.Mesh(tinycube, material);
          child.getWorldPosition(m.position);
          spots.push(m)
          scene.add(m);
        }
      } );

      targets.Base.add(spots[0]);
      targets.Base.add(spots[1]);
      targets.Base.add(spots[2]);
      targets.Base.add(spots[3]);

      console.log({empties});
      // meshes.Body.visible = false;
      let tentacles = [
        "FrontBL",
        "FrontBR",
        "BackBL",
        "BackBR"
      ];
      let groups    = [ [],[],[],[] ];
      let effectors = [];
      let links     = [ [],[],[],[] ];
      let baseindex=-1;
      arrayBones.forEach((bone, bi) => {
        // console.log("test", bone)
        if(bone.name=="Base") baseindex=bi;
        for (var i = 0; i < tentacles.length; i++) {
          if(bone.name.startsWith(tentacles[i])){
            if(bone.name.endsWith("5")){
              effectors[i] = bi;
              // groups[i].push(bi);
            }
            else
            if(bone.name.endsWith("Target")){
              iktargets[i] =bi;
            } else {
              console.log(tentacles[i], bone.name);
              groups[i].push(bi);
            }
          }
        }
      });
      iktargets.push(baseindex);
      console.log("groups",groups);
      console.log("iktargets",iktargets);
      console.log("effectors",effectors);

      // targets
      let bones = [];
      tentacles.forEach((g, i) => {
        // activeTarget = i;
        let bonedata = {
          target   : iktargets[i],
          effector : effectors[i],
          links    : groups[i].reverse().map( x=>{
            // console.log(arrayBones[x])
            return {index: x} }
          ),
          iteration: 5
        }
        let m = new THREE.Mesh(tinycube, material);
        arrayBones[iktargets[i]].getWorldPosition(m.position);
        marks.push(m)
        scene.add(m);
        console.log(bonedata)
        bones.push(bonedata);
      });


      // bones = [
      //   {
      //     target: 7,
      //     effector: 6,
      //     links: [
      //       // { index: 5 },
      //       // { index: 6 },
      //       // { index: 7 },
      //       // { index: 7 },
      //       { index: 6 },
      //       { index: 5 },
      //       { index: 4 },
      //       { index: 3 },
      //       { index: 2 },
      //       { index: 1 },
      //       { index: 0 },
      //       // { index: 3 },
      //     ],
      //     iteration: 5,
      //     // minAngle: 0.0,
      //     // maxAngle: 1.0,
      //   },
      //   // {
      //   //   target: 7,
      //   //   effector: 3,
      //   //   links: [
      //   //     // { index: 4 },
      //   //     // { index: 3 },
      //   //     { index: 2 },
      //   //     { index: 1 },
      //   //     { index: 0 },
      //   //     // { index: 8 },
      //   //     // { index: 9 },
      //   //     // { index: 10 }
      //   //   ],
      //   //   iteration: 5,
      //   //   // minAngle: 0.0,
      //   //   // maxAngle: 1.0,
      //   // }
      //
      // ];

      skeleton = meshes.TentacleFrontR.skeleton;

      // skeleton.bones.forEach((item, i) => {
      //   let m = new THREE.Mesh(tinycube, material);
      //   marks.push(m);
      //   scene.add(m);
      // });



      console.log(meshes.TentacleFrontR)
      console.log(skeleton)
      console.log(skeleton.bones)

      bones.forEach((b, i)=>{
        console.table({
          target_i:   b.target,
          target:     skeleton.bones[b.target].name,
          effector_i: b.effector,
          effector:   skeleton.bones[b.effector].name,
        })
        for (var l in b.links) {
          console.log(skeleton.bones[b.links[l].index].name)
        }
      })
      // cube.rotation.copy(skeleton.bones[bones[0].target].rotation);
      // skeleton.bones[bones[0].target].getWorldPosition(cube.position);

      solver = new CCDIKSolver(meshes.TentacleFrontR, bones);

      scene.add( gltf.scene );

      const helper = new THREE.SkeletonHelper( gltf.scene);
      scene.add( helper );

      pos0 = skeleton.bones[bones[0].target].position;
      // pos1 = skeleton.bones[bones[1].target].position;
      // skelehelp = new THREE.SkeletonHelper(gltf.scene);
      // scene.add(skelehelp);
      // roughnessMipmapper.dispose();
    } );

    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1;
    renderer.outputEncoding = THREE.sRGBEncoding;
    container.appendChild( renderer.domElement );

    const controls = new OrbitControls( camera, renderer.domElement );
    // controls.addEventListener( 'change', render ); // use if there is no animation loop
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


  }

  let force       = 0;
  let forceTarget = 0;

  let activeTarget=0;
  let targetIndices=[1,0];
  window.addEventListener("keydown", e=>{
    switch(e.code){
      case "KeyA":  skeleton.bones[iktargets[activeTarget]].position.x -= 0.5; break;
      case "KeyW":  skeleton.bones[iktargets[activeTarget]].position.z -= 0.5; break;
      case "KeyD":  skeleton.bones[iktargets[activeTarget]].position.x += 0.5; break;
      case "KeyQ":  skeleton.bones[iktargets[activeTarget]].position.y += 0.5; break;
      case "KeyS":  skeleton.bones[iktargets[activeTarget]].position.z += 0.5; break;
      case "KeyE":  skeleton.bones[iktargets[activeTarget]].position.y -= 0.5; break;
      case "KeyL":
        // skeleton.bones[bones[activeTarget].target].position.set(0,0,0);
        force       = 0.6;
        forceTarget = 0.1;
        frames = 0;
        console.log(force);
        break;
      case "Space":
      // console.log("active:",   activeTarget, skeleton.bones[bones[activeTarget].target].name);
        activeTarget = (activeTarget+1) % iktargets.length;
        console.log("active:",   activeTarget, skeleton.bones[iktargets[activeTarget]] );
        skeleton.bones[iktargets[activeTarget]].getWorldPosition(cube.position);
        // skeleton.bones[bones[activeTarget].target].getWorldPosition(cube.position);
        // console.log("effector:", skeleton.bones[bones[activeTarget].effector].name);
        break;
      default: console.log(e);
    }

    // render();
  })

let maxforce=0;
let maxy=0;
let pos0;
let pos1;
let frames=0;
let yspeed = 0;
  function render() {
    requestAnimationFrame(render);
    delta = clock.getDelta();
    if(skeleton){
      if(marks[activeTarget]) skeleton.bones[iktargets[activeTarget]].getWorldPosition(marks[activeTarget].position);

      // if(empties) {
      //   empties.forEach((empty, i) => {
      //     // console.log(spots[i].position)
      //     spots[i].position.copy(empty.position);
      //     spots[i].position.y+=0.1;
      //   });
      // }

      // skeleton.bones[bones[activeTarget].target].position.copy(cube.position);
      // skeleton.bones[iktargets[activeTarget]].position.copy()
      // pos0.x += m.randFloat(-0.01, 0.01);
      // if(forceTarget>0 && force<forceTarget) force+=0.1
      // if(force      >0) force       =  force+forceTarget;
      // if(forceTarget>0) forceTarget -= 0.001;
      let targ = skeleton.bones[iktargets[activeTarget]];
      if(targ.position.y>0) yspeed += delta;
      if(force > 0) force -= delta;
      targ.translateY(force - (yspeed+(20*delta)));
      if(targ.position.y < 0) {
        targ.position.y=0;
        yspeed = 0;
        force = 0;
      }
      // pos0 = skeleton.bones[iktargets[activeTarget]].position;
      // if(pos0.y>0) yspeed += delta;
      // pos0.y += force;//force; //m.randFloat(-0.01, 0.01);
      // pos0.y -= yspeed+(19*delta);//force; //m.randFloat(-0.01, 0.01);

      // pos0.z += m.randFloat(-0.01, 0.01);

      // if(force > 0) {
      //   force -= delta;
      //   frames++;
      // }
      // if(force < 0) force = 0.0;

      // if(pos0.y<0) {
      //   pos0.y=0;
      //   force = 0;
      //   yspeed = 0;
      // }

      // pos1.x += m.randFloat(-0.01, 0.01);
      // pos1.y += m.randFloat(-0.01, 0.01);
      // pos1.z += m.randFloat(-0.01, 0.01);
      // if(pos1.y<0) pos1.y=0;

      if(force  > maxforce) maxforce = force;
      if(pos0.y > maxy)    maxy = pos0.y;

      // skeleton.bones[bones[activeTarget].target].getWorldPosition(cube.position);

      // textElem.innerHTML = `<pre>
      //   0: ${skeleton.bones[bones[0].target].name}
      //   x: ${pos0.x.toFixed(2).padStart(6, " ")}
      //   y: ${pos0.y.toFixed(2).padStart(6, " ")}
      //   z: ${pos0.z.toFixed(2).padStart(6, " ")}
      //   force: ${force}
      //   delta: ${delta.toFixed(5).padStart(6, " ")}
      //   maxforcde: ${maxforce}
      //   maxy: ${maxy}
      //   frames: ${frames}
      //   </pre>
      // `;

    }



    bones.forEach((b, i)=>{
      skeleton.bones[b.target  ].getWorldPosition(marks[b.target  ].position);
      skeleton.bones[b.effector].getWorldPosition(marks[b.effector].position);
      let n = 0;
      for (var l in b.links) {
        skeleton.bones[b.links[l].index].getWorldPosition(marks[n].position);
        n++;
      }
    })

    if(solver) {
      // console.log("updating");
      solver.update();
    }
    renderer.render( scene, camera );

  }
 render();
