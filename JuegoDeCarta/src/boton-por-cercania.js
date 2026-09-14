import * as ecs from '@8thwall/ecs'
import {dispararAnimaciones} from './interaccion-por-cercania'

ecs.registerComponent({
  name: 'boton-activar-animaciones',

  stateMachine: ({world, eid}) => {
    ecs.defineState('default')
      .initial()
      .listen(eid, 'click', () => {
        dispararAnimaciones(world)
      })
  },
})