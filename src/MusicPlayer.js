//src : String
//volume : number from 0 to 1
//loop : boolean

import * as THREE         from 'https://cdn.skypack.dev/three@0.134.0';

let   sound       = new THREE.Audio(listener);
const audioLoader = new THREE.AudioLoader();
export default function playSound(listener, src, volume, loop){
  console.log("trying", src);
  audioLoader.load( src, function( buffer ) {
  	sound.setBuffer( buffer );
  	sound.setLoop( true );
  	sound.setVolume( 0.5 );
  	sound.play();
  });
}
