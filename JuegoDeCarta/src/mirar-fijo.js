import * as ecs from '@8thwall/ecs'

const MirarFijo = ecs.registerComponent({
  name: 'mirar-fijo',
  schema: {
    distanciaMaxima: ecs.f32, 
  },
  schemaDefaults: {
    distanciaMaxima: 1.5,
  },
})

const modelosConMirarFijo = ecs.defineQuery([MirarFijo])

const comportamientoMirarFijo = (world) => {
  const modelos = modelosConMirarFijo(world)

  for (const eidA of modelos) {
    const dataA = MirarFijo.get(world, eidA)
    const posA = world.transform.getWorldPosition(eidA)

    let masCercanoEid = null
    let distanciaMinima = Infinity

    for (const eidB of modelos) {
      if (eidA === eidB) continue

      const posB = world.transform.getWorldPosition(eidB)
      const dx = posA.x - posB.x
      const dy = posA.y - posB.y
      const dz = posA.z - posB.z
      const distancia = Math.sqrt(dx * dx + dy * dy + dz * dz)

      if (distancia <= dataA.distanciaMaxima && distancia < distanciaMinima) {
        distanciaMinima = distancia
        masCercanoEid = eidB
      }
    }

    if (masCercanoEid !== null) {
      world.transform.lookAt(eidA, masCercanoEid)
    }
  }
}

ecs.registerBehavior(comportamientoMirarFijo)