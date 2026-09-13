const onxrloaded = () => {
  XR8.XrController.configure({
    imageTargetData: [
      require('../image-targets/Targeta.json'),
      require('../image-targets/Targeta2.json'),
      require('../image-targets/Habitat.json'),
      require('../image-targets/Habitat2.json'),
      require('../image-targets/Targeta3.json')
    ],
  })
}
window.XR8 ? onxrloaded() : window.addEventListener('xrloaded', onxrloaded)