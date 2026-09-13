import * as ecs from '@8thwall/ecs'
import {dispararAnimaciones} from './mirar-fijo'

ecs.registerComponent({
  name: 'boton-por-cercania',

  stateMachine: ({world, eid}) => {
    ecs.defineState('default')
      .initial()
      .listen(eid, ecs.input.UI_CLICK, () => {
        dispararAnimaciones(world)
      })
  },
})