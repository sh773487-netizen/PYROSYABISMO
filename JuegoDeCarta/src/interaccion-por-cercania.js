import * as ecs from '@8thwall/ecs'

const AnimacionPorCercania = ecs.registerComponent({
  name: 'interaccion-por-cercania',
  schema: {
    objetivo1: ecs.eid,
    animacion1: ecs.string,
    objetivo2: ecs.eid,
    animacion2: ecs.string,
    animacionIdle: ecs.string,
    distanciaMaxima: ecs.f32,
  },
  schemaDefaults: {
    distanciaMaxima: 1.5,
  },
})

const modelosConAnimacionPorCercania = ecs.defineQuery([AnimacionPorCercania])

const estadoPorModelo = new Map()

const estaVisible = (world, eid) => !ecs.Hidden.has(world, eid)

const distanciaEntre = (world, eidA, eidB) => {
  const posA = world.transform.getWorldPosition(eidA)
  const posB = world.transform.getWorldPosition(eidB)
  const dx = posB.x - posA.x
  const dy = posB.y - posA.y
  const dz = posB.z - posA.z
  return Math.sqrt(dx * dx + dy * dy + dz * dz)
}

const reproducirAnimacion = (world, eid, nombreClip) => {
  if (!nombreClip) return
  ecs.GltfModel.mutate(world, eid, (cursor) => {
    cursor.animationClip = nombreClip
    cursor.time = 0
    cursor.paused = false
    return false
  })
}

const mirarHaciaHorizontal = (world, eidA, eidObjetivo) => {
  const posA = world.transform.getWorldPosition(eidA)
  const posB = world.transform.getWorldPosition(eidObjetivo)
  const dx = posB.x - posA.x
  const dz = posB.z - posA.z
  const angulo = Math.atan2(dx, dz)

  world.transform.setWorldQuaternion(eidA, {
    x: 0,
    y: Math.sin(angulo / 2),
    z: 0,
    w: Math.cos(angulo / 2),
  })
}

const comportamiento = (world) => {
  const modelos = modelosConAnimacionPorCercania(world)

  for (const eidA of modelos) {
    const dataA = AnimacionPorCercania.get(world, eidA)

    if (!estadoPorModelo.has(eidA)) {
      const q = world.transform.getWorldQuaternion(eidA)
      estadoPorModelo.set(eidA, {
        activo: null,
        original: {x: q.x, y: q.y, z: q.z, w: q.w},
      })
    }
    const estadoA = estadoPorModelo.get(eidA)

    const yoVisible = estaVisible(world, eidA)
    const tiene1 = !!dataA.objetivo1
    const tiene2 = !!dataA.objetivo2

    const cerca1 =
      yoVisible &&
      tiene1 &&
      estaVisible(world, dataA.objetivo1) &&
      distanciaEntre(world, eidA, dataA.objetivo1) <= dataA.distanciaMaxima

    const cerca2 =
      yoVisible &&
      tiene2 &&
      estaVisible(world, dataA.objetivo2) &&
      distanciaEntre(world, eidA, dataA.objetivo2) <= dataA.distanciaMaxima

    let activar = null
    if (cerca1 && cerca2) {
      const d1 = distanciaEntre(world, eidA, dataA.objetivo1)
      const d2 = distanciaEntre(world, eidA, dataA.objetivo2)
      activar = d1 <= d2 ? 'objetivo1' : 'objetivo2'
    } else if (cerca1) {
      activar = 'objetivo1'
    } else if (cerca2) {
      activar = 'objetivo2'
    }

    if (activar === 'objetivo1') {
      mirarHaciaHorizontal(world, eidA, dataA.objetivo1)
    } else if (activar === 'objetivo2') {
      mirarHaciaHorizontal(world, eidA, dataA.objetivo2)
    } else if (estadoA.activo !== null) {
      world.transform.setWorldQuaternion(eidA, estadoA.original)
    }

    if (activar !== estadoA.activo) {
      if (activar === 'objetivo1') {
        reproducirAnimacion(world, eidA, dataA.animacion1)
      } else if (activar === 'objetivo2') {
        reproducirAnimacion(world, eidA, dataA.animacion2)
      } else {
        reproducirAnimacion(world, eidA, dataA.animacionIdle)
      }
      estadoA.activo = activar
    }
  }
}

ecs.registerBehavior(comportamiento)