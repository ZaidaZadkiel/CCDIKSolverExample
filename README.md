# tjsgame

HOW to use THREE.CCDIKSolver

1. the format is designed around a specific format, which i do not know so expect weirdness
2. this was mostly revengd from the threejs source and figuring it along the way

how to set up the blender armature
1. make a chain linked with proper parenting to make the body bones. It is useful to give the bones adequate names.
2. add a floating disconnected bone to make the IK target to which it will be solved
3. add mesh with vertex groups named to the corresponding bone, these are the vertexes which will be modified from the bone position/rotation
4. add armature deform parenting mesh to the armature

The blender armature is not compatible with the gltf with bones, so you can ignore bone's IK inside blender

You have to "reconstruct" the armature relations in code

> CCDIKSolver( mesh : SkinnedMesh, iks : Array )

**mesh** is like: ```gltf.scene.children[index_of_any_mesh_parented_to_armature]```  
if you have a weird setup, this is the mesh group that will be affected by the armature, it doesnt seem to make a difference which mesh it is as long as it is parented to the armature.


**iks** is an object you need to build through the code:  
all the numbers represent the index of the ```mesh.skeleton.bones[]``` property, which should be the parented armature inside blender.  
Note that the order might change depending on you adding or removing objects in blender, so its better to use an algorithm to search the index by name or other way

**target** is the floating bone to which the solver will try to reach  
**effector** is the last bone that is going to point towards the object, the tip of the tentacle or limb  
**links** is an array of objects, it has more properties but i dont use them here. The only relevant property is index, which is the index in mesh.skeleton.bone for this specific bone.

Also note that the order the links are given is from tip to base, so your chain is usually like
```name:"bone.000", child -> name:"bone.001", child -> name: "bone.002", child -> null```
so links should be ```{index: 2, index: 1, index: 0}```

```
bones = [
   /* first ik chain to solve */
   {
     target: 7,   // the index for the floating bone is 7
     effector: 6, // the index for the tip of the chain is 6
     links: [
       { index: 6 },
       { index: 5 },
       { index: 4 },
       { index: 3 },
       { index: 2 },
       { index: 1 },
       { index: 0 },  // the base for the chain is index 0
     ],
     iteration: 5,
     // minAngle: 0.0,
     // maxAngle: 1.0,
   },
   /* second ik chain to solve */
   {
     target: 7,
     effector: 3,
     links: [
       { index: 2 },
       { index: 1 },
       { index: 0 },
     ],
     iteration: 5,
     // minAngle: 0.0,
     // maxAngle: 1.0,
   }

 ];
```
