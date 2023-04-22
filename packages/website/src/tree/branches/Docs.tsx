import type { Component, JSXElement } from 'solid-js'
import { For, Show, createEffect, createResource, createSignal, on } from 'solid-js'
import { Dialog, DialogOverlay, DialogPanel } from 'solid-headless'
import Button from '@ui/primitives/Button'
import type { CompiledDocumentationTree, DocumentationPage } from '@windblade/unocss-docs'
import type { Params } from '@solidjs/router'
import { Route, useLocation, useMatch, useParams } from '@solidjs/router'
import Progress from '@ui/primitives/Progress'

import Index from './Docs/Index'
import DocPage from './Docs/components/Page'

import Nav from '~/components/DocsNav'
import docsStore from '~/stores/docsStore'
import { LocalLink, Outlet, Page } from '~/lib/rotuer'
import type { Module, ModuleId } from '~/api'

const Layout: Component<{
  tree: CompiledDocumentationTree
  moduleId: ModuleId
}> = (props) => {
  const [containerSize, setContainerSize] = createSignal(0)
  const [drawerSize, setDrawerSize] = createSignal(0)
  const [drawerOpen, setDrawerOpen] = createSignal(false)
  const [drawerFlat, setDrawerFlat] = createSignal(false)

  let container: HTMLDivElement | undefined
  let drawer: HTMLElement | undefined

  const containerResizeObserver = new ResizeObserver(([entry]) => {
    setContainerSize(entry.borderBoxSize[0].inlineSize)
  })
  const drawerResizeObserver = new ResizeObserver(([entry]) => {
    setDrawerSize(entry.borderBoxSize[0].inlineSize)
  })

  createEffect(async () => {
    containerResizeObserver.disconnect()
    if (!container)
      return
    containerResizeObserver.observe(container)
  })
  createEffect(async () => {
    drawerResizeObserver.disconnect()
    if (!drawer)
      return
    drawerResizeObserver.observe(drawer)
  })

  createEffect(() => {
    setDrawerFlat(containerSize() >= drawerSize() * 4)
  })

  const drawerVisible = () => drawerOpen() || drawerFlat()

  const nav = <Nav
    tree={props.tree}
    class="p-m.2 overflow-auto border-solid border-0 border-ie-px border-color-fg-5 size-i-max size-b-full"
    ref={drawer}
    settings={{
      leafActive: path => !!useMatch(() => `/${path.join('/')}`)(),
      leafAs: p => (
        <LocalLink
          style="none"
          href={`/docs/${props.moduleId}/${p.path.join('/')}`}
          onClick={() => setDrawerOpen(false)}
          class={p.class}
        >
          {p.children}
        </LocalLink>
      ),
    }}
  />

  return (
    <div class="size-i-full size-b-full flex flex-col" ref={container}>
      <Show when={!drawerFlat()}>
        <div class="relative flex gap-s items-center p-s.4 p-i-m.2 border-solid border-0 border-be-px border-color-fg-5">
          <Button onClick={() => setDrawerOpen(!drawerOpen())} class="p-s.6 rounded-full" style="half">
            <div class={`i-mdi-menu ${!drawerOpen() ? 'opacity-s' : 'opacity-zero'} transition`} />
            <div class={`i-mdi-backburger ${drawerOpen() ? 'opacity-s' : 'opacity-zero'} transition absolute`} />
          </Button>
          <div class="flex flex-wrap gap-s.4 text-fg-3">
            <For each={decodeURIComponent(useLocation().pathname).split('/').slice(3)}>
              {(crumb, i) => <>
                <div class={`${i() === 0 ? '' : 'text-fg-1 font-semibold'}`}>{crumb}</div>
                {i() === 0 && <div class="i-mdi-chevron-right" />}
              </>}
            </For>
          </div>
        </div>
      </Show>

      <div class={`size-b-full flex relative ${drawerFlat() ? 'flex-row' : 'flex-col'}`}>
        <Show
          when={!drawerFlat()}
          fallback={<aside>{nav}</aside>}
        >
          <Dialog isOpen={drawerVisible()} onClose={() => setDrawerOpen(false)} style="z-index: 1;" unmount={false} title="Navigation drawer">
            <Show when={drawerOpen() && !drawerFlat()}>
              <DialogOverlay class="absolute inset-0" onClick={() => setDrawerOpen(false)} />
            </Show>
            <DialogPanel class={`bg-normal-3 transition-transform ease-out ${drawerFlat() ? 'relative' : 'absolute inset-b-0 inset-is-0'}`} style={`transform: translateX(${drawerVisible() ? '0' : '-100%'})`}>
              {nav}
            </DialogPanel>
          </Dialog>
        </Show>

        <Outlet
          class={`flex-1 transition-all ${(drawerOpen() && !drawerFlat()) ? 'blur-s.2 opacity-s.4' : ''}`}
          as={props => <main class={props.class}>{props.children}</main>}
        />
      </div>
    </div>
  )
}

const MaybeLayout: Component = () => {
  const params = useParams<{ moduleId: ModuleId }>()
  const [mdle, { refetch }] = createResource(() => docsStore.getModuleById(params.moduleId))

  return (
    <Page class="[*]:absolute flex justify-center items-center">
      <Show
        when={!mdle.loading}
        fallback={<Progress />}
      >
        <Show
          when={mdle()?.success}
          fallback={
            <div>
              Error loading module with ID '{params.moduleId}'
              <div class="flex flex-wrap justify-between gap-s.4 m-bs-s">
                <Button style="half" onClick={refetch}>Retry</Button>
                <LocalLink style="secondary" href="/docs">Back to all docs</LocalLink>
              </div>
            </div>
          }
        >
          <Layout tree={(mdle() as { value: Module }).value.docs} moduleId={params.moduleId} />
        </Show>
      </Show>
    </Page>
  )
}

const NotFound: Component = () => (
  <Page class="p-m.2 flex gap-s text-m.2 items-center font-bold">
    <div class="i-mdi-arrow-left" />
    Select something
  </Page>
)

const navigateDocTree = (docs: CompiledDocumentationTree, path: string[], i = 0): DocumentationPage | CompiledDocumentationTree | undefined => {
  const nav = path[i]

  if (!nav)
    return docs

  const child = docs.find(val => val.name === decodeURIComponent(nav))?.value

  if (Array.isArray(child))
    return navigateDocTree(child, path, ++i)

  return child
}

const MaybeDocPage: Component = () => {
  const params = useParams<{
    moduleId: ModuleId
    l1: string
    l2: string
    l3: string
    l4: string
    l5: string
    l6: string
  }>()
  const [mdle] = createResource(() => docsStore.getModuleById(params.moduleId))

  return (
    <Show
      when={!mdle.loading}
      fallback={<Page>Loading...</Page>}
    >
      <Show
        when={!mdle.error}
        fallback={<Page>Error</Page>}
      >
        <Show
          when={mdle()}
          fallback={<Page>No data</Page>}
          keyed
        >
          {(md) => {
            if (md.success) {
              const title = decodeURIComponent(params.l6 ?? params.l5 ?? params.l4 ?? params.l3 ?? params.l2 ?? params.l1)
              const value = navigateDocTree(md.value.docs, [params.l1, params.l2, params.l3, params.l4, params.l5, params.l6])

              if (typeof value !== 'string')
                return <Page>This page doesn't exist</Page>

              return <DocPage page={value} title={title} />
            }
            else {
              return <Page>Error</Page>
            }
          }}
        </Show>
      </Show>
    </Show>
  )
}

/** Re-renders when contents of `useParams()` update. */
const RematchDynamic: Component<{
  component: Component
  on?: (params: Params) => any
}> = (props) => {
  const params = useParams()
  const [page, setPage] = createSignal<JSXElement>()

  const paramSignal = () => props.on ? props.on(params) : Object.values(params)

  createEffect(on(paramSignal, () => {
    setPage(<props.component />)
  }))

  return page
}

const Main: Component = () => (
  <Route path="/docs">
    <Route path="/" component={Index} />
    <Route path="/:moduleId" component={MaybeLayout}>
      <Route path="/*" component={NotFound} />
      <Route path="/:l1/:l2?/:l3?/:l4?/:l5?/:l6?" element={<RematchDynamic component={MaybeDocPage}/>} />
    </Route>
  </Route>
)

export default Main
