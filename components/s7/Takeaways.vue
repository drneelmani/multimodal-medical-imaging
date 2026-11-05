<script setup lang="ts">
import { useStep } from '../../composables/useStep'
import ColabLink from '../ui/ColabLink.vue'

// Slide 58 — what to remember, and where research is needed. clicks: 1
const { step } = useStep(1)
</script>

<template>
  <div class="tk">
    <div>
      <h3>Remember</h3>
      <ol>
        <li>Multimodal AI turns images and words into comparable numbers</li>
        <li>DICOM details (units, slice order, windows) change the results</li>
        <li>Scores change with the prompt wording, the image preparation and new data</li>
        <li>A score is not a diagnosis; validate locally, keep a clinician in charge</li>
      </ol>
    </div>
    <div class="rv" :class="{ on: step >= 1 }">
      <h3>Open research questions</h3>
      <ol>
        <li>Models trained and tested on Indian patients and scanners</li>
        <li>Coping with missing MRI sequences and missing records</li>
        <li>Calibrated scores: a score of 0.8 should be right 80% of the time</li>
        <li>Checking generated reports, sentence by sentence</li>
      </ol>
      <div class="try"><ColabLink which="dicom" label="Try the DICOM notebook in Colab" qr /></div>
    </div>
  </div>
</template>

<style scoped>
.tk { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; }
h3 { font-size: var(--fs-lead) !important; color: var(--accent) !important; margin-bottom: 14px !important; }
ol { font-size: var(--fs-label); padding-left: 1.2em; }
li { margin-bottom: 10px !important; line-height: 1.3; }
.try { margin-top: 10px; }
</style>
