import * as ecs from '@8thwall/ecs'

const BotonPorCercania = ecs.registerComponent({
  name: 'boton-por-cercania',
  schema: {
    personaje1: ecs.eid,       
    personaje2: ecs.eid,       
    distanciaMaxima: ecs.f32,  
  },
  schemaDefaults: {
    distanciaMaxima: 1.5,
  },

  add: (world, component) => {
    ecs.Hidden.set(world, component.eid, {})
  },
})

const botonesConCercania = ecs.defineQuery([BotonPorCercania])

const estadoPorBoton = new Map()

const comportamiento = (world) => {
  const botones = botonesConCercania(world)

  for (const eidBoton of botones) {
    const data = BotonPorCercania.get(world, eidBoton)

    if (!data.personaje1 || !data.personaje2) continue 

    const posA = world.transform.getWorldPosition(data.personaje1)
    const posB = world.transform.getWorldPosition(data.personaje2)

    const dx = posB.x - posA.x
    const dy = posB.y - posA.y
    const dz = posB.z - posA.z
    const distancia = Math.sqrt(dx * dx + dy * dy + dz * dz)

    const debeMostrarse = distancia <= data.distanciaMaxima
    const estaMostrado = estadoPorBoton.get(eidBoton) || false

    if (debeMostrarse && !estaMostrado) {
      ecs.Hidden.remove(world, eidBoton) 
      estadoPorBoton.set(eidBoton, true)
    } else if (!debeMostrarse && estaMostrado) {
      ecs.Hidden.set(world, eidBoton, {}) 
      estadoPorBoton.set(eidBoton, false)
    }
  }
}

ecs.registerBehavior(comportamiento)