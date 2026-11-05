<script setup lang="ts">
import eict from '../assets/logos/eict-iitr.png'
import srhu from '../assets/logos/srhu-naac.png'
import iitr from '../assets/logos/iit-roorkee.png'

// Institutional cover, matching the AI-model-evaluation deck's cover (logos, session title, centre,
// presenter, affiliation, date, navy band), in the E&ICT Academy IIT Roorkee colours: navy #1E3A8A,
// blue #2563EB, logo green #04A545 (from eict.iitr.ac.in). Built on that deck's 1280×720 canvas and scaled to
// this deck's 980px canvas so proportions match exactly. Text comes from frontmatter.
// `programme` is the event line above the title; `band` is the white text in the navy band.
withDefaults(defineProps<{
  session?: string
  heading?: string
  date?: string
  programme?: string
  band?: string
}>(), { session: '', heading: '', date: '', programme: '', band: '' })
</script>

<template>
  <div class="slidev-layout icover">
    <div class="cv">
      <div class="cvlogos">
        <span class="cvlogo l"><img :src="eict" alt="E&amp;ICT Academy, IIT Roorkee"></span>
        <span class="cvlogo c"><img :src="srhu" alt="Swami Rama Himalayan University — NAAC A+"></span>
        <span class="cvlogo r"><img :src="iitr" alt="Indian Institute of Technology Roorkee"></span>
      </div>

      <div v-if="programme" class="cvprog">{{ programme }}</div>
      <h1 class="cvtitle"><span v-if="session" class="cvsession">{{ session }}: </span>{{ heading }}</h1>

      <div class="cvcentre">Center for Artificial Intelligence Research</div>
      <div class="cvname">Prof. (Dr.) Neel Mani</div>
      <div class="cvaff">
        <span>PhD (DCU, Ireland), Post Doc(UCD, Ireland)</span>
        <span>Department of Computer Science &amp; Engineering</span>
        <span>School of Science &amp; Technology</span>
        <span>Swami Rama Himalayan University (SRHU)</span>
        <span>Dehradun - 248016</span>
      </div>
      <div v-if="date" class="cvdate">{{ date }}</div>

      <span class="cvmark"><img :src="srhu" alt="SRHU — NAAC A+"></span>
      <span class="cvband"><span v-if="band">{{ band }}</span></span>
      <slot />
    </div>
  </div>
</template>

<style scoped>
/* 'Inter Cover' is defined in styles/cover-fonts.css. */

.icover { height: 100%; padding: 0; background: #fff; overflow: hidden; position: relative; }
/* Source deck canvas is 1280×720; this deck is 980 wide → 0.765625. */
.cv {
  position: absolute; left: 0; top: 0;
  width: 1280px; height: 720px; zoom: 0.765625;
  display: flex; flex-direction: column; align-items: center; text-align: center;
  padding: 14px 26px 0; box-sizing: border-box;
  font-family: 'Inter Cover', Inter, system-ui, sans-serif; color: #0E161E;
}
.cvlogos { width: 100%; display: flex; align-items: flex-start; justify-content: space-between; gap: 24px; flex: none; }
.cvlogo { display: flex; align-items: flex-start; min-height: 150px; flex: none; }
.cvlogo.l img { height: 104px; width: auto; margin-top: 22px; }
.cvlogo.c img { height: 172px; width: auto; }
.cvlogo.r img { height: 140px; width: auto; }
.cvprog {
  margin-top: 10px; flex: none; font-size: 21px; font-weight: 600; letter-spacing: 0.01em; color: #037A33;
  padding: 6px 22px; border: 2px solid #04A545; border-radius: 999px; background: #ECFDF5;
}
.cvtitle {
  font-family: 'Inter Cover', Inter, system-ui, sans-serif; font-size: 44px; font-weight: 700;
  letter-spacing: -0.012em; line-height: 1.15; color: #1E3A8A; margin: 18px 0 0; max-width: 1100px; flex: none;
}
.cvcentre {
  font-family: Georgia, 'Times New Roman', serif; font-size: 27px; line-height: 1.2; color: #0E161E;
  margin-top: 44px; padding: 0 32px 9px; border-bottom: 3px solid #04A545; flex: none;
}
.cvname { font-size: 22px; font-weight: 700; color: #1E3A8A; margin-top: 10px; flex: none; }
.cvaff {
  display: flex; flex-direction: column; gap: 3px; margin-top: 5px; flex: none;
  font-size: 14.5px; font-weight: 700; color: #2563EB; line-height: 1.35;
}
.cvdate { font-size: 21px; font-weight: 700; color: #1E3A8A; margin-top: 12px; flex: none; padding: 4px 18px; border-left: 4px solid #04A545; border-right: 4px solid #04A545; }
.cvband {
  position: absolute; left: 285px; right: 0; bottom: 0; height: 44px; background: linear-gradient(90deg, #0A033C 0%, #1E3A8A 45%, #2563EB 100%);
  display: flex; align-items: center; justify-content: center; padding: 0 24px;
  color: #fff; font-size: 16px; font-weight: 600; letter-spacing: 0.01em; white-space: nowrap;
}
.cvmark { position: absolute; left: 18px; bottom: 12px; }
.cvmark img { height: 66px; width: auto; }
</style>
