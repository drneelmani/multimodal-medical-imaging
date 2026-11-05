---
layout: opener
section: 4
---

# How are medical images stored?

<p>DICOM, the standard hospital file format, stores the image with its units, position and patient details.</p>

<!--
**Time:** ~0.5 min
**Objective:** Pose the question Part 4 answers.
**Background:** DICOM (Digital Imaging and Communications in Medicine) is the worldwide standard for medical image files and for sending them between scanners, archives (PACS) and viewers. Every hospital scanner produces it.
**Say:** Every model we have seen needs images as input. In a hospital, those images live in DICOM files. Understanding DICOM is what separates a demo that works on a website from one that works on real data.
**Transition:** What is DICOM, and why not just use JPEG?
**Sources:** None — section opener.
-->

---
section: 4
layout: artifact
clicks: 2
tag: real-data
tagText: 'one CT file of LIDC-IDRI-0001'
sources: [dicomstandard, lidc2015data]
links: [lidc]
---

::title::
# A DICOM file stores the image and facts about it

::default::
<DicomVsPng />

<!--
**Time:** ~1.5 min
**Objective:** Explain why medicine uses DICOM rather than ordinary image files.
**Background:** A DICOM file = header (hundreds of 'tags', each with a number like (0028,0030) and a name like PixelSpacing) + pixel data. A PNG keeps only the picture, so size in mm, units and patient position are lost.
**Say:** On the left, a slice saved as an ordinary picture: brightness from 0 to 255, no units, no size, no position. [click] On the right, the same slice as it really arrived: a DICOM file. Alongside the pixels it carries tags: who the patient is, how the scan was made, where the slice sits in the body, and how to turn the stored numbers into real units. Our file has 89 tags. [click] The pixel values are in Hounsfield units, and each pixel is 0.7 millimetres wide. The pixels take 99.6% of the file; the tags are tiny but essential.
**Example:** A photograph versus a photograph with its full lab notebook stapled on.
**Try / Notice:** None.
**Ask:** What could go wrong if a model is trained on JPEG copies of DICOM images?
**Caveat:** DICOM (Digital Imaging and Communications in Medicine) is also a network protocol for sending images between machines; we focus on the file.
**Transition:** One file is one image. How are files organised?
**Sources:** dicomstandard — the standard; lidc2015data — the file.
-->

---
section: 4
layout: artifact
clicks: 3
tag: real-data
tagText: 'LIDC-IDRI-0001 as stored at TCIA'
sources: [dicomstandard, lidc2015data, fedorov2018lidcdicom, clark2013tcia]
links: [lidc]
---

::title::
# DICOM levels: patient, study, series, file

::default::
<DicomHierarchy />

<!--
**Time:** ~2 min
**Objective:** Explain the DICOM hierarchy with a real patient.
**Background:** *Study* = one examination (one visit to one scanner, e.g. a chest CT). *Series* = one set of images within it (one MRI sequence, or one CT reconstruction). *Instance* = one file (usually one slice). Each level has a globally unique ID (UID). Software uses these UIDs, not file names.
**Say:** DICOM organises images in four levels. At the top, the patient. [click] A study is one visit to the scanner: our patient has two, a chest CT and a chest X-ray. [click] A series is one set of images made together. The CT study holds the CT images, plus four outline series and four rating series added later by four radiologists. [click] And at the bottom, instances: one file each. The CT series is 133 files, one per slice.
**Example:** Patient = a folder per person; study = one appointment; series = one stack; instance = one page.
**Try / Notice:** Click any box to see its details on the right.
**Ask:** Why might a model need to know which series to use?
**Caveat:** Study dates in this dataset are shifted to 1 January 2000 as part of de-identification. Long identifiers (UIDs) are shortened for display.
**Transition:** What is inside one of those files?
**Sources:** dicomstandard; lidc2015data; fedorov2018lidcdicom — the outline and rating series; clark2013tcia — TCIA, the archive.
-->

---
section: 4
layout: artifact
clicks: 3
tag: real-data
tagText: 'tags read from one CT file of LIDC-IDRI-0001'
sources: [dicomstandard, lidc2015data]
links: [lidc]
---

::title::
# What the tags in a DICOM file record

::default::
<DicomTags />

<!--
**Time:** ~1.5 min
**Objective:** Show real metadata and its privacy implications.
**Background:** Who: patient tags (here emptied or coded; dates shifted by the archive). How: scanner settings (kVp = X-ray tube voltage, slice thickness in mm). Where: ImagePositionPatient and ImageOrientationPatient in millimetres in the patient's own coordinate system (x to the patient's left, y to the back, z to the head). How to read: RescaleSlope/Intercept, PhotometricInterpretation, window.
**Say:** These are real tags from our patient's file, in four groups. The first group is about who: name, birth date and accession number are empty, the patient ID is a code, and the date is shifted. That was done by the archive before release; in a hospital file, these fields hold real identities. [click] How it was acquired: GE scanner, 120 kV, 2.5 mm slices. [click] Where in space: 512 by 512 pixels, each 0.70 mm, and the exact position of this slice. [click] And how to read the pixels: 16 bits, and a slope and intercept, which we need on the next slide.
**Example:** The privacy group is why you must never email a hospital DICOM file without de-identifying it.
**Try / Notice:** Click the group buttons to move between them.
**Ask:** Which of these would you remove before sharing data?
**Caveat:** De-identification is more than blanking tags: identities can also hide in burned-in text, in private tags, or in a face reconstructed from a head CT.
**Transition:** Next, we open real DICOM files and read their tags live.
**Sources:** dicomstandard; lidc2015data.
-->

---
section: 4
layout: artifact
clicks: 5
tag: real-data
tagText: 'real DICOM files (teaching copies of public TCIA data)'
sources: [dicomstandard, lidc2015data, bakas2021upenndata, cmmd2021data, eisenbrey2021liverus, gatidis2022fdgpetct]
links: [lidc, upenn, cmmd, liverus, petct]
---

::title::
# Open a real DICOM file

::default::
<DicomViewer />

<!--
**Time:** ~2.5 min
**Objective:** Show real DICOM files from six kinds of scanner, read live in the browser.
**Background:** Modality codes: CT, DX (digital X-ray), MR (MRI), MG (mammogram), PT (PET), US (ultrasound). *Pixel size* = mm per pixel (lets you measure). *BitsStored* = grey levels stored. *MONOCHROME1* = high values shown dark (X-ray film convention); MONOCHROME2 = high values bright. *BQML* = PET units, becquerels per millilitre. Level/Width = the display window (next slides).
**Say:** Until now we looked at pictures made from DICOM files. This viewer opens the files themselves. A CT slice: 512 by 512, 16-bit, values in Hounsfield units, the scanner named in the file. [click] A chest X-ray: no units, just relative brightness. [click] An MRI slice: also no standard units, which is why MRI needs careful normalisation. [click] A mammogram. [click] A PET slice: its unit is becquerels per millilitre, radioactivity. [click] And an ultrasound file holds 21 frames, a video. Every line on the right is read from the file at this moment.
**Example:** The same viewer works for any uncompressed DICOM file you have on your laptop.
**Try / Notice:** Click the scan buttons; drag Level and Width; press "Download this .dcm" to take the file home; "Open your own .dcm" reads a file locally, nothing is uploaded. To test it, download four sample files (CT abdomen, MRI with contrast, mammogram, PET; from TCIA) from https://drneelmani.github.io/multimodal-medical-imaging/dicom/samples/dicom-samples.zip before the session; their source shows under the image when opened.
**Ask:** Which of these modalities do you use, and which tags would you check first?
**Caveat:** These are teaching copies: private tags removed, some pixels downsampled, every change recorded inside the file (DerivationDescription). Compressed DICOM files (JPEG inside) are not supported by this simple viewer. Never open real patient files on a shared or public computer.
**Transition:** Back to one of those numbers: stored values versus real units.
**Sources:** dicomstandard; lidc2015data; bakas2021upenndata; cmmd2021data; eisenbrey2021liverus; gatidis2022fdgpetct.
-->

---
section: 4
layout: artifact
clicks: 2
tag: real-data
tagText: 'stored values of our patient’s CT'
sources: [dicomstandard, lidc2015data]
links: [lidc]
---

::title::
# Stored pixel values are converted to real units

::default::
<StoredVsDisplayed />

<!--
**Time:** ~1.5 min
**Objective:** Show that the number stored in a CT file becomes a real unit (HU) only through a rule written in the file.
**Background:** *Hounsfield unit (HU)*: CT's physical scale of how strongly tissue blocks X-rays, defined so that water = 0 and air = −1000. Typical values: lung about −900 to −500, fat −100 to −50, soft tissue and blood +20 to +80, contrast-filled vessels +150 to +400, bone +400 and above. Files store unsigned integers, so the header gives slope and intercept to convert back. Why it matters: the same tissue has the same HU on any calibrated CT, so a rule like 'fat is below −50' works everywhere. Values between about −500 and −150 at the edge of the lung are not a tissue: the pixel straddles air and tissue (the 'partial volume' effect); the slide labels them 'lung edge'. Zoom with the wheel or the + button to show the nodule's values.
**Say:** Point anywhere on the scan to read the number stored in the file. At the centre of the nodule it is 1,107. On its own, that number means nothing. [click] The file also stores a rule: multiply by 1 and subtract 1,024. The result is in Hounsfield units: 83, which is soft tissue. [click] On the scale, air is −1000, water 0, fat a little below zero, bone several hundred. The same tissue gives the same value on every CT scanner, which is why software and models can use fixed thresholds.
**Example:** Like a thermometer reading that needs a conversion formula printed on its side.
**Try / Notice:** Move the pointer over air, lung, the nodule and bone; watch the units change.
**Ask:** If a model is fed stored values from one scanner and HU from another, what happens?
**Caveat:** For CT the conversion gives physical units; MRI values have no standard units and vary between scanners.
**Transition:** A screen cannot show 4,000 different values. Which HU should be black and which white? That is windowing.
**Sources:** dicomstandard — rescale slope and intercept, window tags; lidc2015data.
-->

---
section: 4
layout: artifact
clicks: 3
tag: real-data
tagText: 'Hounsfield units of our patient’s CT slice'
sources: [lidc2015data]
links: [lidc]
---

::title::
# Windowing controls which tissues are visible

::default::
<WindowingSlider />

<!--
**Time:** ~2.5 min
**Objective:** Explain window level and width with real HU data.
**Background:** A screen shows 256 greys but CT spans about 4,000 HU. *Level* = the HU at mid-grey; *width* = the HU range spread from black to white. Standard presets: lung (level −600, width 1500), soft tissue (40, 400), bone (400, 1800). Radiologists flip between them; an AI model sees only whatever window the preprocessing chose.
**Say:** A CT slice holds values from about −1000 to over 1,000 HU, but a screen shows only 256 greys. The window picks which part of the range to spread across those greys. Showing everything, the lungs and soft tissue look flat. [click] The lung window, level −600, width 1,500: now the lung detail and the nodule's spiky edges appear. [click] Soft tissue, level 40, width 400: the heart, vessels and the nodule's solid core. [click] Bone: the spine and ribs. Same numbers in the file every time; only the display changed. A model must be given the right window, or the full range.
**Example:** Like adjusting brightness and contrast, but in real units.
**Try / Notice:** Drag Level and Width; watch the blue band on the histogram move over the tissue labels.
**Ask:** Predict, then reveal: which window will show the lung nodule best?
**Caveat:** Preset values vary between institutions; these are common choices. Window values stored in a file can also be wrong: our X-ray file carries CT lung-window values (−600 / 1600). Applied as written, the window covers −1,400 to 200, but the X-ray's stored values run from about 200 to 14,500, so the whole image is drawn white. Check the window before trusting it.
**Transition:** One slice is one picture. CT is a whole volume.
**Sources:** lidc2015data — the HU values.
-->

---
section: 4
layout: artifact
clicks: 2
tag: real-data
tagText: 'LIDC-IDRI-0001 CT volume, resampled to 2.5 mm'
sources: [dicomstandard, lidc2015data]
links: [lidc]
---

::title::
# Slices sorted by position form a 3D volume

::default::
<VolumeExplorer />

<!--
**Time:** ~2 min
**Objective:** Explain slice ordering and 3D geometry; show multiplanar views.
**Background:** *Axial* = horizontal slices as scanned, viewed from the feet; *coronal* = from the front; *sagittal* = from the side. Slice spacing here is 2.5 mm. Sort by ImagePositionPatient (mm), never by file name or InstanceNumber. The buttons save the three views as a PNG and the volume as NIfTI (.nii; 8-bit, values approximate HU clipped to −1000…600), the research format opened by 3D Slicer, ITK-SNAP or nibabel.
**Say:** A CT is 133 slices, 2.5 mm apart. [click] But look at the file names: file 1 is slice 80, file 2 is slice 52. File names do not tell you where a slice is. Software must sort by the position stored in each file. Get this wrong and the body is scrambled. [click] Once stacked correctly, the volume can be cut in any direction: across, as scanned; from the front, coronal; and from the side, sagittal. The yellow lines show where the three cuts meet, on the nodule.
**Example:** A sliced loaf of bread dropped on the floor: you need the slice positions to rebuild it.
**Try / Notice:** Drag the three sliders, or click the axial view to move the crosshair.
**Ask:** Why do coronal views look blurrier than axial ones here?
**Caveat:** For display, the volume was resampled to 2.5 mm cubes in the notebook; the original pixels are 0.70 mm in-plane. The orientation tags also matter: not every scan is axial.
**Transition:** MRI adds another twist: many kinds of image of the same slice.
**Sources:** dicomstandard — ImagePositionPatient and orientation; lidc2015data.
-->

---
section: 4
layout: artifact
clicks: 3
tag: real-data
tagText: 'UPENN-GBM-00001, four sequences registered'
sources: [bakas2021upenndata, bakas2022upenn, vanoss2024aimi]
links: [upenn, aimi]
---

::title::
# MRI sequences show different tissue properties

::default::
<MriSequences />

<!--
**Time:** ~1.5 min
**Objective:** Explain why MRI comes as several sequences and why that matters for AI.
**Background:** MRI signal depends on how fast hydrogen nuclei recover after a radio pulse (T1 and T2 relaxation). *T1*: fat bright, water dark, good anatomy. *T1 + contrast*: gadolinium injected into a vein leaks where the blood–brain barrier is broken, so the tumour's active edge lights up. *T2*: water bright. *FLAIR*: T2 with normal brain fluid (CSF) made dark, so swelling (oedema) stands out. The tumour is a *glioblastoma*, the commonest aggressive brain cancer in adults: an enhancing rim, a dead (necrotic) core, and swelling around it. It is in the right temporal lobe: image left = patient's right. Press 'Show where the tumour is' for an AI outline (AIMI). MRI values have no standard units, so models normalise each scan.
**Say:** This is a different patient: a brain tumour from another public collection. MRI does not take one picture; it takes several, each tuned to a different tissue property. T1 shows anatomy. [click] T1 after contrast injection: leaky vessels and the tumour's edge light up. [click] T2: fluid is bright, so the swelling around the tumour shows. [click] FLAIR: like T2, but normal fluid is made dark, so the swelling stands out. A model that expects FLAIR but is given T2 is looking at a different picture.
**Example:** Like photographing the same street in daylight, at night and in infrared.
**Try / Notice:** Use the slider to wipe between the current sequence and the previous one.
**Ask:** If a hospital names its series differently, how would software know which is FLAIR?
**Caveat:** The four series were registered (aligned) to the T1 series in our notebook, and the slice was chosen by eye through the lesion. Diffusion-weighted imaging (DWI) is another common sequence, not shown.
**Transition:** Other scanners store other things: an ultrasound file is a video.
**Sources:** bakas2021upenndata — the data; bakas2022upenn — the collection.
-->

---
section: 4
layout: artifact
clicks: 2
tag: real-data
tagText: 'real multi-frame ultrasound DICOM, B-mode-and-CEUS-Liver'
sources: [eisenbrey2021liverus, dicomstandard]
links: [liverus]
---

::title::
# An ultrasound file can contain a video

::default::
<UltrasoundCine />

<!--
**Time:** ~1.5 min
**Objective:** Show multi-frame DICOM: ultrasound clips are videos with timing in their tags.
**Background:** Ultrasound sends sound pulses (a few MHz) and maps the echoes; *B-mode* = the normal greyscale picture. *CEUS* (contrast-enhanced ultrasound) uses injected microbubbles that light up blood flow, shown here beside the B-mode image. *Cine* = a stored video loop; FrameTime (ms) gives the speed. Quality depends on the operator.
**Say:** This is one DICOM file from a liver ultrasound. It is not a picture but a film: many frames, and a tag that says how far apart they are. [click] Play it. On the left, the normal grey ultrasound; on the right, the same view after a contrast agent was injected: the dark lesion and the vessels fill differently over time. [click] Side by side in every frame. A model reading ultrasound must decide which frames to use, or use them all.
**Example:** Like a video file that carries its own frame rate.
**Try / Notice:** Drag the frame slider; the time since the start updates from the FrameTime tag.
**Ask:** Which frame would you give to a model, and why?
**Caveat:** Teaching copy: every 5th frame of the original 105, downsampled, header band blacked out. The original frame interval was 107 ms.
**Transition:** Mammograms carry their own context in tags too.
**Sources:** eisenbrey2021liverus — the clip; dicomstandard — multi-frame attributes.
-->

---
section: 4
layout: artifact
clicks: 2
tag: real-data
tagText: 'CMMD mammogram (DICOM) and its clinical table'
sources: [cmmd2021data]
links: [cmmd]
---

::title::
# A mammogram file and its clinical table

::default::
<MammoTags />

<!--
**Time:** ~1.5 min
**Objective:** Show context stored inside DICOM tags and alongside them in a clinical table.
**Background:** A mammogram is a low-dose X-ray of the breast. Each breast is imaged twice: *CC* (cranio-caudal, from above) and *MLO* (medio-lateral oblique, from the side at an angle). ImageLaterality = L or R. The CMMD table gives biopsy-confirmed benign/malignant and *molecular subtype* (Luminal A/B, HER2-positive, triple-negative), which decides treatment. Mammograms are often MONOCHROME1.
**Say:** A real mammogram from a public Chinese collection. The file records which breast it is, the right one, in the ImageLaterality tag. Notice it does not record the view; not every file is complete. [click] The dataset adds a table: age 85, a mass, malignant on biopsy, subtype Luminal B. [click] Image plus table is the simplest multimodal input. And the subtype came from a biopsy; no picture alone would give it.
**Example:** A model that ignores laterality could mix up left and right breasts in a follow-up comparison.
**Try / Notice:** The "not recorded" view.
**Ask:** Which tags would you check before trusting a dataset?
**Caveat:** Teaching copy downsampled 4×. CMMD images are stored at 8 bits; many clinical mammograms use more.
**Transition:** PET goes further: its tags are needed to compute the number itself.
**Sources:** cmmd2021data — images and clinical table.
-->

---
section: 4
layout: artifact
clicks: 3
tag: real-data
tagText: 'real PET DICOM, FDG-PET-CT-Lesions'
sources: [gatidis2022fdgpetct, boellaard2015petguideline]
links: [petct]
---

::title::
# PET values converted to SUV using the file’s tags

::default::
<SuvFromTags />

<!--
**Time:** ~2 min
**Objective:** Show a calculation that is impossible without DICOM metadata.
**Background:** *FDG* = glucose with a radioactive fluorine-18 atom; cancer cells use much more glucose than most tissue, so FDG collects there. *Becquerel (Bq)* = one radioactive decay per second; MBq = one million. Pixels are activity concentration in Bq per ml. *Decay*: fluorine-18 halves every 109.8 minutes (its half-life, read from the file), so activity at scan = injected × 2^(−minutes / 109.8). *SUV* (standardised uptake value) = concentration ÷ (dose ÷ body weight), unitless, taking 1 g of tissue as 1 ml. SUV 1 = the body average; tumours are well above it. SUVmax = the hottest voxel.
**Say:** This is a real PET slice through a lung cancer. The pixels are radioactivity: becquerels per millilitre. Point at the tumour and you get tens of thousands. That number depends on how much tracer was given and when, so it cannot be compared between patients. [click] The file tells us what we need: the tracer, FDG, 300 megabecquerels injected at 9:10; the scan started an hour later; the patient weighed 61 kilograms. [click] FDG decays with a half-life of 110 minutes, so about 205 megabecquerels were left at the scan. [click] Divide by that dose per gram of body weight and we get the standardised uptake value, SUV. On this slice the hottest point is about 14; across the whole tumour in 3D, 18.
**Example:** Like converting a raw count to a per-capita rate before comparing two cities.
**Try / Notice:** Point at the tumour, then at normal tissue; after the last click the readout shows SUV.
**Ask:** What happens to SUV if the injection time is entered wrongly?
**Caveat:** This is body-weight SUV, decay-corrected to the series start (the file's DecayCorrection = START). Guidelines standardise these steps; differences between centres change SUV.
**Transition:** Finally, how a DICOM image becomes a model's input.
**Sources:** gatidis2022fdgpetct — the data; boellaard2015petguideline — SUV standardisation.
-->

---
section: 4
layout: artifact
clicks: 3
tag: real-data
tagText: 'our patient’s X-ray at each preparation step'
sources: [zhang2025biomedclip, lidc2015data]
links: [lidc, biomedclip]
---

::title::
# What each preparation step keeps and loses

::default::
<PrepPipeline />

<!--
**Time:** ~1.5 min
**Objective:** Show the preparation pipeline from DICOM to model input, and what is lost.
**Background:** Each step is a design decision: 14-bit → 8-bit loses grey levels; windowing hides values outside the window; resizing to 224 × 224 loses fine detail; three colour channels are copies of one grey channel. Small nodules can disappear in this process.
**Say:** Here is exactly what happened to our patient's X-ray before BiomedCLIP saw it. One: the DICOM pixels, 14-bit, 2022 pixels square. [click] Two: windowed to 8 bits, the 256 grey levels a picture can hold. [click] Three: resized to 224 by 224, the model's fixed input. That throws away almost 99% of the pixels, and the size in millimetres. [click] Four: normalised to the range of numbers the model was trained on. Each step is a choice, and each loses something. Small findings can vanish at step three.
**Example:** Photocopying a photocopy: each copy is fine for some purposes and useless for others.
**Try / Notice:** The red "lost" line under each step.
**Ask:** Which step worries you most for a 5 mm nodule?
**Caveat:** Different models need different preparation; always follow the model's documented preprocessing. The notebook does these steps in code.
**Transition:** With images ready, where are these models being applied?
**Sources:** zhang2025biomedclip — the model's input size and normalisation; lidc2015data — the X-ray.
-->
