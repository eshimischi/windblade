import { Show } from 'solid-js'
import type { Element } from 'xast-util-from-xml/lib'
import type { Component } from 'solid-js'
import type { AddonXmlComponent, XmlComponent } from '../../../XmlComponent'
import { XmlContext, extendXmlContext } from '../../../XmlComponent'
import XmlChildren from '../../../XmlElement'
import Error from '../../../Error'
import { applyVars } from '../../../XmlVariables'

const Option: Component<{
  value: string
}> = (props) => {
  const value = () => applyVars(props.value)
  return (
    <option value={value()}>
      {value()}
    </option>
  )
}

const Xml: AddonXmlComponent = (props) => {
  return <>{(() => {
    switch (props.type) {
      case 'element':
        switch (props.name) {
          case 'option':
            return (
              <Show when={props.attributes?.value} keyed fallback={() => <Error>'option' requires a 'value' attribute</Error>}>
                {value => <Option value={value} />}
              </Show>
            )
        }
    }
  })()}</>
}

const main: XmlComponent<Element & {
  onChange: (value: string) => void
}> = (props) => {
  return (
    <XmlContext.Provider value={extendXmlContext([Xml])}>
      <select
        name="colors"
        class="size-b-full bg-accent-2 rounded-s.4 min-size-i-0 size-b-m.2 p-i-s.4 leading-s transition ease-out hover:highlight active:highlight+"
        onChange={({ target }) => props.onChange((target as HTMLSelectElement).value)}
      >
        <option value=""></option>
        <XmlChildren {...props} />
      </select>
    </XmlContext.Provider>
  )
}

export default main
