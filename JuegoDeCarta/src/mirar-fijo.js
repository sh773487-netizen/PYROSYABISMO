import * as ecs from '@8thwall/ecs'

const AnimacionPorCercania = ecs.registerComponent({
  name: 'mirar-fijo',
  schema: {
    objetivo1: ecs.eid,
    animacion1: ecs.string,
    objetivo2: ecs.eid,
    animacion2: ecs.string,
    animacionIdle: ecs.string,  
    distanciaMaxima: ecs.f32,
    boton: ecs.eid,
  },
  schemaDefaults: {
    distanciaMaxima: 1.5,
  },

  add: (world, component) => {
    if (component.schema.boton) {
      ecs.Hidden.set(world, component.schema.boton, {})
    }
  },
})

const modelosConAnimacionPorCercania = ecs.defineQuery([AnimacionPorCercania])

const estadoPorModelo = new Map()

const activosPorBoton = new Map()

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

const actualizarBoton = (world, eidBoton) => {
  if (!eidBoton) return
  const activos = activosPorBoton.get(eidBoton)
  const debeMostrarse = !!activos && activos.size > 0
  const estaOculto = ecs.Hidden.has(world, eidBoton)

  if (debeMostrarse && estaOculto) {
    ecs.Hidden.remove(world, eidBoton)
  } else if (!debeMostrarse && !estaOculto) {
    ecs.Hidden.set(world, eidBoton, {})
  }
}

const comportamiento = (world) => {
  const modelos = modelosConAnimacionPorCercania(world)

  for (const eidA of modelos) {
    const dataA = AnimacionPorCercania.get(world, eidA)

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

    const activoAnterior = estadoPorModelo.get(eidA) || null

    if (activar !== activoAnterior) {
      if (activar === null) {
        reproducirAnimacion(world, eidA, dataA.animacionIdle)
      }

      estadoPorModelo.set(eidA, activar)

      if (dataA.boton) {
        if (!activosPorBoton.has(dataA.boton)) {
          activosPorBoton.set(dataA.boton, new Set())
        }
        const conjunto = activosPorBoton.get(dataA.boton)

        if (activar !== null) {
          conjunto.add(eidA)
        } else {
          conjunto.delete(eidA)
        }

        actualizarBoton(world, dataA.boton)
      }
    }
  }
}

ecs.registerBehavior(comportamiento)

export const dispararAnimaciones = (world) => {
  for (const [eid, activar] of estadoPorModelo.entries()) {
    if (!activar) continue
    const data = AnimacionPorCercania.get(world, eid)
    const clip = activar === 'objetivo1' ? data.animacion1 : data.animacion2
    reproducirAnimacion(world, eid, clip)
  }
}