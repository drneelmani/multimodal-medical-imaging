# Presenter primer: the medicine behind the slides

For a presenter from computer science. Each slide's speaker notes have a **Background** line with the same information in context; this page collects it in one place. Slide numbers are the page numbers in the browser address bar (the cover is page 1).

## Units you will say out loud

| Unit | What it measures | Why this unit | Typical values | Slides |
|---|---|---|---|---|
| **HU** (Hounsfield unit) | How strongly tissue blocks X-rays on CT | Defined so that water = 0 and air = −1000 on every calibrated scanner, so a threshold such as "fat is below −50" works everywhere | Air −1000 · lung −900 to −500 · fat −100 to −50 · soft tissue, blood +20 to +80 · contrast-filled vessels +150 to +400 · bone +400 and above | 38, 39, 59, 66 |
| **Level / width** | The display window: the HU at mid-grey, and the HU range spread from black to white | A screen shows 256 greys; CT spans about 4,000 HU | Lung −600 / 1500 · soft tissue 40 / 400 · bone 400 / 1800 | 39, 59 |
| **mm** (pixel size, slice spacing) | Size of one pixel; distance between slices | Lets you measure; without it nothing can be measured in mm | CT 0.7 mm pixels, 2.5 mm slices; PET 2 mm pixels | 37, 40, 67 |
| **ml, L, cm³** | Volume | 1 ml = 1 cm³; 1 L = 1,000 ml. Volume = voxels in the outline × the volume of one voxel | Our patient's lungs 3.7 L, heart 370 ml; nodule about 6–7 ml | 48, 63, 66 |
| **cm²** | Area on one slice | Pixel count × pixel area | Lung on one slice 332 cm² | 66 |
| **Bq/ml**, **MBq** | PET: radioactivity per millilitre of tissue; MBq = one million decays per second | What the PET scanner actually measures | Tens of thousands of Bq/ml in the tumour; 300 MBq injected | 44, 49 |
| **Half-life** | Time for radioactivity to halve | The tracer (fluorine-18) decays during the hour between injection and scan | 109.8 min for F-18 (read from the file) | 44 |
| **SUV** | PET uptake relative to the body average: concentration ÷ (dose ÷ weight), unitless | Removes the effect of dose, timing and body size so scans can be compared | 1 = body average; our tumour's maximum 18.1 | 44, 49, 67 |
| **Cosine score** | Similarity of two embeddings, −1 to 1 | How CLIP-style models compare an image with a sentence | Matching pairs often only 0.3–0.5; only the order matters | 61 |
| **Softmax %** | Cosine scores × the model's scale (85), turned into shares that add to 100% | What the model is trained with | Exaggerates tiny gaps; not the chance of disease | 61, 62 |
| **Dice** | Overlap of two outlines: 2 × shared area ÷ both areas | Standard way to compare a segmentation with an expert's | 1 = identical; experts among themselves 0.84–0.90 here | 27, 64 |
| **AUROC** | Chance that a random case scores above a random normal | Threshold-free summary of a classifier | 0.5 = chance, 1 = perfect; 0.90 here | 26 |

## Words you will meet

**Anatomy and findings**
- **Nodule**: a small, rounded spot in the lung, up to 3 cm across; above 3 cm it is a **mass** (Fleischner glossary). It may be cancer or harmless scar. Our patient's is about 3 cm in the **left lower lobe** (right lung: three lobes; left lung: two).
- **Spiculated**: spiky edge, a warning sign for cancer.
- **Cardiomegaly**: enlarged heart. **Pleural effusion**: fluid between the lung and the chest wall. **Pneumothorax**: air outside the lung, which collapses it. **Pneumonia/consolidation**: infection, seen as white patches.
- **Glioblastoma**: the commonest aggressive brain cancer in adults, with an **enhancing rim** (active edge), a **necrotic core** (dead tissue) and **oedema** (swelling) around it. Ours is in the right temporal lobe.
- **Biopsy**: a tissue sample examined under a microscope; the only proof of cancer.

**Directions and views**
- **Axial** (horizontal slices, viewed from the feet), **coronal** (from the front), **sagittal** (from the side).
- Radiological convention: the patient's **right is on the viewer's left**.
- DICOM patient coordinates in mm: x towards the patient's left, y towards the back, z towards the head.
- Mammogram views: **CC** (cranio-caudal, from above) and **MLO** (medio-lateral oblique, from the side at an angle).

**Scanners and images**
- **X-ray**: one projection image. **CT**: X-rays from all round, computed into slices in HU. **MRI**: magnet and radio waves, no radiation, no standard units. **Ultrasound**: sound echoes, live; **B-mode** = normal greyscale; **CEUS** = with microbubble contrast; **cine** = a video loop. **PET**: shows where a radioactive tracer collects. **Mammogram**: low-dose breast X-ray. **Fundus photo**: the back of the eye. **H&E pathology**: tissue stained purple (nuclei) and pink.
- **MRI sequences**: **T1** (fat bright, water dark; anatomy), **T1 + contrast** (gadolinium shows where the blood–brain barrier is broken: the tumour's edge), **T2** (water bright), **FLAIR** (T2 with normal brain fluid made dark, so swelling stands out).
- **FDG**: glucose carrying radioactive fluorine-18; cancer cells use more glucose. Normal high uptake: brain, heart, kidneys, bladder (FDG leaves in the urine).
- **MIP** (maximum-intensity projection): for each line of sight the brightest value is kept; a whole-body summary that does not change with the slice.

**DICOM**
- **Patient → study** (one examination) **→ series** (one set of images, e.g. one MRI sequence) **→ instance** (one file, usually one slice). Each level has a unique ID (UID).
- **Tags**: named fields in the header, e.g. PixelSpacing, RescaleSlope, RescaleIntercept, ImagePositionPatient, PhotometricInterpretation. **MONOCHROME1** = high values shown dark (X-ray film convention).
- **Modality codes**: CT, DX (digital X-ray), MR, MG (mammogram), PT (PET), US, SEG (outline), SR (structured report).
- **PACS**: the hospital image archive. **NIfTI** (.nii): a simple research format for 3D volumes.

**Reports and evaluation**
- A radiology report has **Findings** (what is seen) and **Impression** (the conclusion).
- **Sensitivity**: share of real cases caught. **Specificity**: share of normals cleared.
- **Calibration**: among cases scored 0.8, about 80% truly have the condition. Contrastive scores are not calibrated.
- **Domain shift**: a new scanner, setting or hospital changes the images and can lower accuracy without warning.

## Where the data and models come from

Every slide that uses a dataset or model has clickable chips at the top right ("DATA …", "MODEL …"). Slide 32 links each model to its page and its training data. The DICOM viewer (slide 37) offers four sample `.dcm` files to test "Open your own .dcm", with their sources.
