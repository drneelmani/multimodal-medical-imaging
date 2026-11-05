// Where to get every dataset and model the deck uses. Listed in a slide's `links:` frontmatter and
// shown as clickable chips in its footer. All URLs opened and checked on 2026-11-05.
export interface Link {
  key: string
  label: string
  kind: 'data' | 'model'
  url: string
}

export const links: Link[] = [
  // Datasets behind the deck's images and runs
  { key: 'lidc', label: 'LIDC-IDRI', kind: 'data', url: 'https://www.cancerimagingarchive.net/collection/lidc-idri/' },
  { key: 'upenn', label: 'UPENN-GBM', kind: 'data', url: 'https://www.cancerimagingarchive.net/collection/upenn-gbm/' },
  { key: 'cmmd', label: 'CMMD', kind: 'data', url: 'https://www.cancerimagingarchive.net/collection/cmmd/' },
  { key: 'liverus', label: 'B-mode-and-CEUS-Liver', kind: 'data', url: 'https://www.cancerimagingarchive.net/collection/b-mode-and-ceus-liver/' },
  { key: 'petct', label: 'FDG-PET-CT-Lesions', kind: 'data', url: 'https://www.cancerimagingarchive.net/collection/fdg-pet-ct-lesions/' },
  { key: 'iu', label: 'IU X-rays (Open-i)', kind: 'data', url: 'https://openi.nlm.nih.gov/' },
  { key: 'crc', label: 'CRC-VAL-HE-7K', kind: 'data', url: 'https://zenodo.org/records/1214456' },
  { key: 'hc18', label: 'HC18', kind: 'data', url: 'https://zenodo.org/records/1327317' },
  { key: 'aimi', label: 'AIMI tumour outlines', kind: 'data', url: 'https://doi.org/10.5281/zenodo.8345959' },
  { key: 'fives', label: 'FIVES', kind: 'data', url: 'https://doi.org/10.6084/m9.figshare.19688169' },
  // Datasets the models were trained on (for the model cards)
  { key: 'pmc15m', label: 'PMC-15M (paper)', kind: 'data', url: 'https://arxiv.org/abs/2303.00915' },
  { key: 'mimiccxr', label: 'MIMIC-CXR', kind: 'data', url: 'https://physionet.org/content/mimic-cxr/2.1.0/' },
  { key: 'medsamdata', label: 'MedSAM data (paper)', kind: 'data', url: 'https://doi.org/10.1038/s41467-024-44824-z' },
  { key: 'totalsegdata', label: 'TotalSegmentator dataset', kind: 'data', url: 'https://zenodo.org/records/10047292' },
  { key: 'llavameddata', label: 'LLaVA-Med data (paper)', kind: 'data', url: 'https://arxiv.org/abs/2306.00890' },
  { key: 'medgemmadata', label: 'MedGemma report', kind: 'data', url: 'https://arxiv.org/abs/2507.05201' },
  // Models
  { key: 'biomedclip', label: 'BiomedCLIP', kind: 'model', url: 'https://huggingface.co/microsoft/BiomedCLIP-PubMedBERT_256-vit_base_patch16_224' },
  { key: 'clip', label: 'CLIP ViT-L/14', kind: 'model', url: 'https://huggingface.co/openai/clip-vit-large-patch14' },
  { key: 'medsam', label: 'MedSAM', kind: 'model', url: 'https://github.com/bowang-lab/MedSAM' },
  { key: 'totalseg', label: 'TotalSegmentator', kind: 'model', url: 'https://github.com/wasserth/TotalSegmentator' },
  { key: 'chexzero', label: 'CheXzero', kind: 'model', url: 'https://github.com/rajpurkarlab/CheXzero' },
  { key: 'medclip', label: 'MedCLIP', kind: 'model', url: 'https://github.com/RyanWangZf/MedCLIP' },
  { key: 'llavamed', label: 'LLaVA-Med', kind: 'model', url: 'https://github.com/microsoft/LLaVA-Med' },
  { key: 'medgemma', label: 'MedGemma', kind: 'model', url: 'https://huggingface.co/google/medgemma-4b-it' },
  { key: 'resnet50', label: 'ResNet-50 (timm)', kind: 'model', url: 'https://huggingface.co/timm/resnet50.a1_in1k' },
]

export const linkByKey = new Map(links.map(l => [l.key, l]))
