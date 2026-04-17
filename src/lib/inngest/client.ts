import { Inngest } from 'inngest'

export const inngest = new Inngest({
  id: 'content-factory',
  name: 'ContentFactory',
  eventKey: process.env['INNGEST_EVENT_KEY'],
})
