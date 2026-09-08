/** El servidor de MSW, uno por corrida.
 *
 *  Se levanta en `tests/setup.ts` y se resetea entre pruebas, así que un
 *  `server.use()` de una prueba no se filtra a la siguiente.
 */
import { setupServer } from 'msw/node'
import { handlers } from './handlers'

export const server = setupServer(...handlers)
