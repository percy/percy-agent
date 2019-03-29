import {expect} from 'chai'
import * as sinon from 'sinon'
import PercyAgent from '../../src/percy-agent-client/percy-agent'
import Constants from '../../src/services/constants'
import { htmlWithoutSelector } from '../helpers/html-string'

describe('serializeInputElements', () => {
  const subject: PercyAgent = new PercyAgent({ handleAgentCommunication: false })

  it('serializes text input elements', () => {
    const inputName = document.getElementById('testInputText') as HTMLInputElement
    inputName.value = 'test input value'
    const domSnapshot = subject.snapshot('test snapshot')

    expect(domSnapshot).to.contain('test input value')
  })

  it('serializes checkbox elements', () => {
    const inputName = document.getElementById('testCheckbox') as HTMLInputElement
    inputName.checked = true

    const domSnapshot = subject.snapshot('test snapshot')

    expect(domSnapshot).to.contain('checked')
  })

  it('serializes radio button elements', () => {
    const inputName = document.getElementById('testRadioButton') as HTMLInputElement
    inputName.checked = true

    const domSnapshot = subject.snapshot('test snapshot')

    expect(domSnapshot).to.contain('checked')
  })

  it('cleans up after itself', () => {
    const preSnapshotHTML = htmlWithoutSelector(document, '#mocha')

    subject.snapshot('test snapshot')

    const postSnapshotHTML = htmlWithoutSelector(document, '#mocha')

    expect(postSnapshotHTML).to.eq(preSnapshotHTML)
    expect(postSnapshotHTML).to.not.contain('data-percy-input-serialized')
    expect(postSnapshotHTML).to.not.contain('checked')
  })
})
