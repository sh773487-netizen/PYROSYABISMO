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

const estadoPorModelo = new Map()

const comportamientoMirarFijo = (world) => {
  const modelos = modelosConMirarFijo(world)

  for (const eidA of modelos) {
    if (!estadoPorModelo.has(eidA)) {
      const q = world.transform.getWorldQuaternion(eidA)
      estadoPorModelo.set(eidA, {
        mirando: false,
        original: {x: q.x, y: q.y, z: q.z, w: q.w},
      })
    }

    const estadoA = estadoPorModelo.get(eidA)
    const dataA = MirarFijo.get(world, eidA)
    const posA = world.transform.getWorldPosition(eidA)

    let masCercanoEid = null
    let distanciaMinima = Infinity

    for (const eidB of modelos) {
      if (eidA === eidB) continue

      const posB = world.transform.getWorldPosition(eidB)
      const dx = posB.x - posA.x
      const dy = posB.y - posA.y
      const dz = posB.z - posA.z
      const distancia = Math.sqrt(dx * dx + dy * dy + dz * dz)

      if (distancia <= dataA.distanciaMaxima && distancia < distanciaMinima) {
        distanciaMinima = distancia
        masCercanoEid = eidB
      }
    }

    if (masCercanoEid !== null) {
      const posB = world.transform.getWorldPosition(masCercanoEid)
      const dx = posB.x - posA.x
      const dz = posB.z - posA.z
      const angulo = Math.atan2(dx, dz)

      world.transform.setWorldQuaternion(eidA, {
        x: 0,
        y: Math.sin(angulo / 2),
        z: 0,
        w: Math.cos(angulo / 2),
      })

      estadoA.mirando = true
    } else if (estadoA.mirando) {
      world.transform.setWorldQuaternion(eidA, estadoA.original)
      estadoA.mirando = false
    }
  }
}

ecs.registerBehavior(comportamientoMirarFijo)