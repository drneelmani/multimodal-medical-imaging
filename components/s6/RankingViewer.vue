<script setup lang="ts">
import { computed, ref } from 'vue'
import { useStep } from '../../composables/useStep'
import run from '../../data/runs/biomedclip_ranking.json'

// Artifact 18 — real BiomedCLIP ranking of candidate descriptions for real X-rays. Scores are
// recomputed in the page from the saved 512-number fingerprints, so switching descriptions on and off
// re-ranks live. Step 1: scores appear; step 2: sorted into a ranking. A toggle shows the same scores
// after softmax with the model's own logit scale: they add to 100% but are not calibrated. clicks: 2
const { step } = useStep(2)
const thumbs = import.meta.glob('../../data/imaging/thumbs/rank_*.png', { eager: true, import: 'default' }) as Record<string, string>
const LABEL: Record<string, string> = { 'lidc-dx': 'Our patient' }
const name = (im: typeof run.images[number]) => LABEL[im.id] ?? `IU: ${im.mesh?.[0].split('/')[0].toLowerCase()}`
const which = ref(0)
const on = ref(run.candidates.map(() => true))
const dot = (a: number[], b: number[]) => a.reduce((s, v, i) => s + v * b[i], 0)
const pct = ref(false)
const SCALE = run.provenance.logit_scale
const rows = computed(() => {
  const img = run.images[which.value].embedding
  const r = run.candidates.map((c, i) => ({ c, i, s: dot(img, run.text_embeddings[i]) / Math.sqrt(dot(img, img) * dot(run.text_embeddings[i], run.text_embeddings[i])), p: 0 }))
    .filter(x => on.value[x.i])
  // Softmax over the descriptions shown, as CLIP-style models do
  const m = Math.max(...r.map(x => x.s))
  const e = r.map(x => Math.exp((x.s - m) * SCALE)), z = e.reduce((a, b) => a + b, 0)
  r.forEach((x, k) => { x.p = e[k] / z })
  return step.value >= 2 ? [...r].sort((a, b) => b.s - a.s) : r
})
const width = (r: { s: number, p: number }) => pct.value ? Math.max(1, r.p * 100) : Math.min(100, Math.max(2, ((r.s - lo) / (hi - lo)) * 100))
const lo = 0.05, hi = 0.5
const short = (s: string) => s.replace('a chest X-ray showing ', '…').replace(/ \(.*\)/, '')
</script>

<template>
  <div class="rv2">
    <div class="left">
      <img :src="thumbs[`../../data/imaging/${run.images[which].thumb}`]" alt="X-ray being ranked">
      <div class="pick">
        <button v-for="(im, i) in run.images" :key="im.id" class="chip" :aria-pressed="which === i" @click="which = i">{{ name(im) }}</button>
      </div>
      <p class="truth">{{ run.images[which].truth }}</p>
      <p v-if="which === 0" class="gloss"><strong>Nodule:</strong> a small, rounded spot in the lung (up to 3 cm); it may be cancer or harmless.</p>
    </div>
    <div class="right">
      <div v-if="step >= 1" class="mode">
        <button class="chip" :aria-pressed="!pct" @click="pct = false">Cosine score</button>
        <button class="chip" :aria-pressed="pct" @click="pct = true">As percentages (softmax)</button>
      </div>
      <TransitionGroup tag="div" name="rk" class="bars">
        <div v-for="(r, k) in rows" :key="r.c" class="row" :class="{ top: step >= 2 && k === 0 }">
          <button class="tog" :aria-pressed="on[r.i]" :aria-label="`Remove ${r.c}`" @click="on[r.i] = false">×</button>
          <span class="c">{{ short(r.c) }}</span>
          <span class="track"><span class="fill" :class="{ p: pct }" :style="{ width: step >= 1 ? `${width(r)}%` : '0%' }" /></span>
          <strong class="s">{{ step >= 1 ? (pct ? `${(r.p * 100).toFixed(0)}%` : r.s.toFixed(3)) : '' }}</strong>
        </div>
      </TransitionGroup>
      <p v-if="step >= 1" class="why">{{ pct ? `Softmax (× ${SCALE.toFixed(0)}, the model’s own scale) makes tiny gaps look decisive. The percentages add to 100% over the descriptions we offered; they are not the chance of disease.` : 'Cosine score: how closely the image and the sentence point the same way, from −1 to 1. Only the order matters.' }}</p>
    </div>
    <button v-if="on.some(x => !x)" class="chip reset" @click="on = run.candidates.map(() => true)">Show all descriptions</button>
  </div>
</template>

<style scoped>
.rv2 { display: grid; grid-template-columns: 230px 1fr; gap: 28px; align-items: start; position: relative; }
.left img { width: 230px; height: 170px; object-fit: cover; border-radius: var(--radius); background: var(--image-mat); }
.pick { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 8px; }
.pick .chip { padding: 3px 8px; font-size: 13px; }
.truth { font-size: 14px; color: var(--ink-2); margin: 6px 0 0; line-height: 1.25; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.right { display: flex; flex-direction: column; gap: 10px; }
.mode { display: flex; gap: 6px; }
.mode .chip { padding: 4px 11px; font-size: 14px; }
.bars { display: flex; flex-direction: column; gap: 4px; }
.gloss { font-size: 13px; margin: 6px 0 0; line-height: 1.25; padding: 5px 7px; background: var(--accent-tint); border-radius: 4px; }
.why { font-size: 14px; color: var(--ink-2); margin: 0; line-height: 1.3; min-height: 36px; }
.fill.p { background: #b45309; }
.row { display: grid; grid-template-columns: 26px 1fr 170px 62px; gap: 10px; align-items: center; padding: 3px 6px; border-radius: 4px; }
.row.top { background: var(--accent-tint); }
.c { font-size: 17px; }
.track { height: 16px; background: var(--stage); border-radius: 3px; overflow: hidden; }
.fill { display: block; height: 100%; background: var(--accent); transition: width 0.6s var(--ease); }
.s { font: 600 16px var(--font-mono); text-align: right; }
.tog { width: 24px; height: 24px; border-radius: 50%; border: 1px solid var(--rule-strong); background: var(--surface); cursor: pointer; color: var(--ink-3); }
.rk-move { transition: transform 0.6s var(--ease); }
.reset { position: absolute; right: 0; bottom: -40px; padding: 4px 10px; font-size: 14px; }
</style>
