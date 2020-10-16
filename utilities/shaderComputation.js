/* 
A more versatile version of the computational renderer class for Three.js.

Notes from setting up the fluid simulation:
- The setting of 'variables' and buffers feels both confusing and magical.
- Input textures are fixed? 
I think you have to create a specific named buffer in the bank of buffers, 
then set the inputs to a specific shader step by the string name of the buffer.
Whatever it is exactly, in effect you can end up copy/pasting the same shaders for different steps with only the input textures' names changed.

Notes from BookClubb:
- Sometimes you'll want to sample the output of a fragment shader into a vertex shader, not just vice versa!

There are two pieces to the process: the shaders and the textures. 
The shaders need to be composable, ie. their functions need to be made reusable by other shaders.
The textures need to tie the functions together. They should be easy to assign as inputs and outputs to shaders,
as well as intermediate values (output of one shader, input to the next in a process).

Questions/Comments:
- Is there a base class in Three to inherit from?
- Should each shader be its own object with input and output textures?
- Should I try to implement some two-buffer swapping mechanism for repeated steps? Would it make sense for that to be part of a separate texture variable class?
- The swapping/two-buffer setup is only needed for feedback scenarios, where the same texture is used as input and output.
*/

import * as THREE from 'three'

class ShaderComputation {}

class ComputeTexture {
  constructor() {
    this.textureA = new THREE.Texture()
    this.textureB = null
  }
  swap() {
    if (this.textureB) {
      const tempTexture = this.textureA
      this.textureA = this.textureB
      this.textureB = tempTexture
    }
  }
}
