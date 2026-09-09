import * as ecs from '@8thwall/ecs'

const AnimacionPorCercania = ecs.registerComponent({
  name: 'mirar-fijo',
  schema: {
    objetivo1: ecs.eid,       
    animacion1: ecs.string,    
    objetivo2: ecs.eid,        
    animacion2: ecs.string,    
    distanciaMaxima: ecs.f32,  
    boton: ecs.eid,            
  },
  schemaDefaults: {
    distanciaMaxima: 1.5,
  },

  add: (world, component) => {
    const eidBoton = component.schema.boton
    if (!eidBoton) return

    ecs.Hidden.set(world, eidBoton, {})

    if (!botonesConListener.has(eidBoton)) {
      botonesConListener.add(eidBoton)
      world.events.addListener(eidBoton, ecs.input.UI_CLICK, () => {
        dispararAnimacionesActivas(world)
      })
    }
  },
})

const modelosConAnimacionPorCercania = ecs.defineQuery([AnimacionPorCercania])

const estadoPorModelo = new Map()

const activosPorBoton = new Map()

const botonesConListener = new Set()

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

const dispararAnimacionesActivas = (world) => {
  const modelos = modelosConAnimacionPorCercania(world)

  for (const eid of modelos) {
    const activar = estadoPorModelo.get(eid)
    if (!activar) continue

    const data = AnimacionPorCercania.get(world, eid)

    if (activar === 'objetivo1') {
      reproducirAnimacion(world, eid, data.animacion1)
    } else if (activar === 'objetivo2') {
      reproducirAnimacion(world, eid, data.animacion2)
    }
  }
}

const comportamiento = (world) => {
  const modelos = modelosConAnimacionPorCercania(world)

  for (const eidA of modelos) {
    const dataA = AnimacionPorCercania.get(world, eidA)

    const tiene1 = !!dataA.objetivo1
    const tiene2 = !!dataA.objetivo2

    const distancia1 = tiene1 ? distanciaEntre(world, eidA, dataA.objetivo1) : Infinity
    const distancia2 = tiene2 ? distanciaEntre(world, eidA, dataA.objetivo2) : Infinity

    const cerca1 = tiene1 && distancia1 <= dataA.distanciaMaxima
    const cerca2 = tiene2 && distancia2 <= dataA.distanciaMaxima

    let activar = null
    if (cerca1 && cerca2) {
      activar = distancia1 <= distancia2 ? 'objetivo1' : 'objetivo2'
    } else if (cerca1) {
      activar = 'objetivo1'
    } else if (cerca2) {
      activar = 'objetivo2'
    }

    const activoAnterior = estadoPorModelo.get(eidA) || null

    if (activar !== activoAnterior) {
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