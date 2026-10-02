const { parser, url } = require('./3cat.cat.config.js')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
dayjs.extend(utc)

const date = dayjs.utc('2026-10-03', 'YYYY-MM-DD').startOf('d')
const channel = { site_id: 'tv3', xmltv_id: 'TV3.es' }
const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.json'), 'utf8')

it('can generate valid url', () => {
  expect(url({ channel, date })).toBe(
    'https://api.3cat.cat/v2/graellatvfutur?_format=json&canal=CAD_TV3&data_emissio=03/10/2026&pagina=1&sdom=img&version=2.0&master=yes'
  )
})

it('fails on unknown channels', () => {
  expect(() => url({ channel: { site_id: 'nope' }, date })).toThrow()
})

it('can parse response', () => {
  const results = parser({ content }).map(p => ({
    ...p,
    start: p.start.toJSON(),
    stop: p.stop.toJSON()
  }))

  expect(results.length).toBe(3)
  // sorted by start, Europe/Madrid (CEST, UTC+2) converted to UTC
  expect(results[0]).toMatchObject({
    title: 'Pel·lícula',
    sub_title: 'Assassinats a Chantilly',
    description: 'Una amazona apareix assassinada.',
    icon: 'https://img.3cat.cat/multimedia/jpg/6/9/1751006637696.jpg',
    start: '2026-10-02T22:03:35.000Z',
    stop: '2026-10-03T04:00:00.000Z'
  })
  expect(results[1]).toMatchObject({
    title: 'Notícies 3CatInfo',
    sub_title: null,
    description: 'Espai informatiu.',
    start: '2026-10-03T04:00:00.000Z',
    stop: '2026-10-03T20:05:29.000Z'
  })
  // the last one of the day runs until midnight
  expect(results[2]).toMatchObject({
    title: 'Col·lapse',
    start: '2026-10-03T20:05:29.000Z',
    stop: '2026-10-03T22:00:00.000Z'
  })
})

it('can handle empty guide', () => {
  expect(parser({ content: '' })).toMatchObject([])
  expect(parser({ content: '{"resposta":{"status":"OK"}}' })).toMatchObject([])
})
