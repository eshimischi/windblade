import { Component, createEffect, createSignal, For, on, Show } from "solid-js";
import { html, css } from "js-beautify";
import hljs from "highlight.js";
import type { docs } from "@windblade/unocss";
import themeStore, { hues } from "~/stores/themeStore";
import uno from "~/unocss";
import UnilityButton from "./components/UtilityButton";

const Main: Component<{
  ruleGroup: docs.rules.DocumentedRuleGroup
}> = (props) => {
  const [selectedI, setSelectedI] = createSignal(-1);
  const [selected, setSelected] = createSignal<string | undefined>(undefined);
  const [shadowRoot, setShadowRoot] = createSignal<ShadowRoot>();
  const [preview, setPreview] = createSignal<{ html: string; css: string; fullCss: string }>();

  // Preview container ref
  let previewContainer: HTMLDivElement | undefined;

  // Keep shadowRoot in sync with container ref
  createEffect(on(
    () => selected(),
    () => {
      if (!previewContainer) {
        setShadowRoot(undefined);
        return;
      }

      if (shadowRoot()) return;

      setShadowRoot(previewContainer.attachShadow({ mode: "open" }));
    }
  ));

  // Keep preview in sync with selected
  createEffect(async () => {
    const html = docs().preview?.(selected() ?? "") ?? "";
    const css = (await uno.generate(html, { safelist: false, preflights: false, minify: true })).css;
    const fullCss = (await uno.generate(html)).css;
    setPreview({ html, css, fullCss });
  });

  // Keep preview dom in sync with preview
  createEffect(() => {
    const root = shadowRoot();
    if (!root) return;
    const p = preview();
    if (!p) return;
    const { html, css, fullCss } = p;
    root.innerHTML = `
      <div
        id="root"
        class="scheme-${themeStore.scheme()}"
        style="--hue: ${hues.dark + 180}; display: flex; align-items: center; justify-content: center;"
      >
        <style>${fullCss.replaceAll(":root", ":where(#root)")}</style>
        ${html}
      </div>`;
  });

  const docs = () => props.ruleGroup.docs;

  const styles = {
    tr: "border border-color-transparent border-be-color-fg-5",
    th: "p-b-s.6 text-start",
    h3: "font-bold text-(s+s.2)",
    h4: "font-bold",
  };

  return (
    <div class="size-b-full overflow-auto">
      <div class="flex flex-col gap-s p-m.2">
        <h2 class="text-fg-1 font-bold text-m.2">{docs().title}</h2>
        <p class="text-fg-3 font-semibold">{docs().description}</p>

        {docs().preview && <>
          <h3 class={styles.h3}>Try it</h3>
          <table class="border-collapse">
            <thead class="font-semibold">
              <tr class={styles.tr}>
                <th class={`${styles.th} p-ie-s`}>Selected</th>
                <th class={`${styles.th} size-i-full`}>Utility</th>
              </tr>
            </thead>
            <tbody>
              <For each={docs().utilities}>
                {(utility, i) => (
                  <tr class={styles.tr} >
                    <td>
                      <div class="m-auto i-mdi-check transition ease-linear" style={`opacity: ${selectedI() === i() ? 1 : 0};`} />
                    </td>
                    <td class="p-b-s">
                      <UnilityButton
                        utility={utility}
                        onClick={(util) => {
                          setSelectedI(i);
                          setSelected(util);
                        }}
                      />
                    </td>
                  </tr>
                )}
              </For>
            </tbody>
          </table>

          <Show when={selected()}>
            <h4 class={styles.h4}>Preview</h4>
            <div class="bg-def2 rounded-s p-m.2 overflow-auto" ref={previewContainer} />

            <h4 class={styles.h4}>HTML</h4>
            <pre
              class="block bg-srf p-s rounded-s leading-(s+s.4)"
              innerHTML={hljs.highlight(html(preview()?.html ?? ""), { language: "xml" }).value.replaceAll(selected() ?? "", `<span class="current-utility">${selected()}</span>`)}
            />

            <h4 class={styles.h4}>Generated CSS</h4>
            <pre
              class="css block bg-srf p-s rounded-s leading-(s+s.4)"
              innerHTML={hljs.highlight(css(preview()?.css ?? ""), { language: "css" }).value}
            />

          </Show>
        </>}
      </div>
    </div>
  );
};

export default Main;
