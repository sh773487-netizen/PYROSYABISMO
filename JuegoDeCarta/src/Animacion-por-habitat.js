import * as ecs from '@8thwall/ecs'

const AnimacionPorHabitat = ecs.registerComponent({
  name: 'animacion-por-habitat',
  schema: {
    habitat1: ecs.eid,             
    animacionHabitat1: ecs.string, 
    habitat2: ecs.eid,             
    animacionHabitat2: ecs.string, 
    distanciaMaxima: ecs.f32,      
  },
  schemaDefaults: {
    distanciaMaxima: 1.5,
  },
})

const modelosConAnimacionPorHabitat = ecs.defineQuery([AnimacionPorHabitat])

const estadoPorModelo = new Map()

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

const comportamiento = (world) => {
  const modelos = modelosConAnimacionPorHabitat(world)

  for (const eidA of modelos) {
    const dataA = AnimacionPorHabitat.get(world, eidA)

    const tiene1 = !!dataA.habitat1
    const tiene2 = !!dataA.habitat2

    const distancia1 = tiene1 ? distanciaEntre(world, eidA, dataA.habitat1) : Infinity
    const distancia2 = tiene2 ? distanciaEntre(world, eidA, dataA.habitat2) : Infinity

    const cerca1 = tiene1 && distancia1 <= dataA.distanciaMaxima
    const cerca2 = tiene2 && distancia2 <= dataA.distanciaMaxima

    let activar = null
    if (cerca1 && cerca2) {
      activar = distancia1 <= distancia2 ? 'habitat1' : 'habitat2'
    } else if (cerca1) {
      activar = 'habitat1'
    } else if (cerca2) {
      activar = 'habitat2'
    }

    const activoAnterior = estadoPorModelo.get(eidA) || null

    if (activar !== activoAnterior) {
      if (activar === 'habitat1') {
        reproducirAnimacion(world, eidA, dataA.animacionHabitat1)
      } else if (activar === 'habitat2') {
        reproducirAnimacion(world, eidA, dataA.animacionHabitat2)
      }
      estadoPorModelo.set(eidA, activar)
    }
  }
}

ecs.registerBehavior(comportamiento)