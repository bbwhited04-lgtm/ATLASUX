# Biology & Medicine — Advanced / PhD-Level Reference

> Companion to biology_medicine_reference.md. Covers graduate and research-level
> topics: Structural Biology, Advanced Molecular Biology, Genomics, Systems Biology,
> Advanced Immunology, Pharmacology, Clinical Medicine, Bioinformatics

---

## 1. Advanced Molecular Biology

### Chromatin and Epigenetics
- **Histone code**: Combinatorial modifications dictate transcriptional state
  - H3K4me3: Active promoters
  - H3K27me3: Polycomb repression (PRC2 catalyzes)
  - H3K9me3: Heterochromatin (HP1 binding)
  - H3K27ac: Active enhancers
  - H3K36me3: Transcription elongation, marks gene bodies
- **Chromatin remodelers**: SWI/SNF (BAF/PBAF), ISWI, CHD, INO80 — ATP-dependent nucleosome repositioning
- **DNA methylation**: DNMT1 (maintenance), DNMT3a/b (de novo), TET enzymes (demethylation via 5hmC)
- **CpG islands**: ~70% of promoters, generally unmethylated in active genes
- **X-inactivation**: XIST lncRNA coats one X chromosome, recruits PRC2 for silencing
- **Imprinting disorders**: Prader-Willi (paternal 15q11-13 deletion), Angelman (maternal UBE3A loss)
- **Phase separation**: Liquid-liquid phase separation (LLPS) in nuclear organization
  - Mediator and RNA Pol II form condensates at super-enhancers

### Transcription (Advanced)
- **Enhancer-promoter communication**: Chromatin looping (cohesin, CTCF), enhancer RNA (eRNA)
- **Transcription elongation**: P-TEFb phosphorylates Pol II CTD Ser2, releases promoter-proximal pause
- **Promoter-proximal pausing**: NELF and DSIF hold Pol II ~30-60 bp downstream of TSS
- **Splicing**: Spliceosome (U1, U2, U4, U5, U6 snRNPs), branch point, SR proteins, hnRNPs
  - Alternative splicing: Exon skipping, intron retention, alt 5'/3' splice sites, mutually exclusive exons
  - ~95% of human multi-exon genes undergo alternative splicing
- **RNA modifications**: m⁶A (most abundant mRNA modification, METTL3/14 writers, FTO/ALKBH5 erasers, YTHDF readers), pseudouridine, m⁵C

### Non-coding RNAs
- **miRNA**: ~22 nt, loaded into RISC/AGO, targets 3' UTR for translational repression/mRNA degradation
  - Biogenesis: pri-miRNA → (Drosha/DGCR8) → pre-miRNA → (Dicer) → mature miRNA
- **lncRNA**: >200 nt, diverse mechanisms — scaffolding (HOTAIR), decoys, guides (XIST), enhancer-like
- **circRNA**: Circular, sponge miRNAs, some translated, derived from back-splicing
- **piRNA**: ~26-31 nt, PIWI-interacting, transposon silencing in germline, ping-pong amplification
- **rRNA modifications**: Guide snoRNAs (C/D box: 2'-O-methylation, H/ACA box: pseudouridylation)

### DNA Repair
| Pathway | Damage Type | Key Proteins |
|---|---|---|
| Base excision repair (BER) | Oxidation, alkylation, deamination | DNA glycosylases, APE1, Pol β, XRCC1 |
| Nucleotide excision repair (NER) | Bulky adducts, UV dimers | XPA-XPG, ERCC1, TFIIH |
| Mismatch repair (MMR) | Replication errors | MSH2/6 (MutSα), MLH1/PMS2 (MutLα) |
| Homologous recombination (HR) | DSBs (S/G2 phase) | MRN complex, BRCA1/2, RAD51 |
| Non-homologous end joining (NHEJ) | DSBs (any phase) | Ku70/80, DNA-PKcs, Ligase IV |
| Translesion synthesis (TLS) | Replication past damage | Pol η, Pol ζ, REV1 |

### CRISPR-Cas Systems
- **Type II (Cas9)**: tracrRNA + crRNA → sgRNA, PAM = 5'-NGG-3' (SpCas9)
  - DSB at target, repaired by NHEJ (indels) or HDR (precise editing with donor template)
- **Type V (Cas12a/Cpf1)**: T-rich PAM (5'-TTTV-3'), staggered cut, processes own crRNA
- **Type VI (Cas13)**: RNA-targeting, collateral cleavage (basis for SHERLOCK diagnostics)
- **Base editors**: dCas9-deaminase fusions, C→T (CBE) or A→G (ABE) without DSB
- **Prime editing**: pegRNA + nCas9-RT fusion, write new DNA at target (search-and-replace)
- **Off-target effects**: Mismatch tolerance, chromosomal translocations, GUIDE-seq/CIRCLE-seq detection

---

## 2. Structural Biology

### Protein Structure Determination
- **X-ray crystallography**: Bragg's law (nλ = 2d sinθ), phase problem (molecular replacement, MAD, MIR)
  - Resolution: <2.0 Å (atomic), 2-3 Å (backbone + large side chains), >3 Å (fold level)
- **Cryo-EM**: Single-particle analysis, resolution revolution (~2-3 Å routinely)
  - Advantages: No crystallization, native-like conditions, heterogeneity analysis
  - CTF (contrast transfer function) correction essential
- **NMR**: Solution structure, dynamics, NOE distance restraints, chemical shift perturbation
  - Suited for proteins <30-40 kDa (conventional), TROSY extends to ~100 kDa
- **AlphaFold2**: Deep learning protein structure prediction, accuracy at experimental level for many targets

### Protein Folding
- **Levinthal's paradox**: Random search of conformational space would take astronomical time
- **Folding funnel**: Energy landscape, funnel-shaped, native state at minimum
- **Chaperones**: HSP70 (binds hydrophobic stretches), HSP60/GroEL-GroES (cage for folding), HSP90 (client maturation)
- **Unfolded protein response (UPR)**: IRE1, PERK, ATF6 sensors in ER detect misfolded proteins
- **Prions**: PrP^Sc (misfolded) templates PrP^C → PrP^Sc conversion; TSEs (CJD, BSE, scrapie)
- **Intrinsically disordered proteins (IDPs)**: Lack stable 3D structure, function via disorder (p53 TAD, FUS, TDP-43)

### Structural Motifs and Domains
- **Rossmann fold**: βαβαβ, binds NAD/FAD cofactors
- **TIM barrel**: (βα)₈, found in many enzymes (triosephosphate isomerase)
- **Immunoglobulin fold**: β-sandwich, basis of antibodies, cell adhesion molecules
- **Zinc finger**: C₂H₂ or C₄ coordination, DNA-binding transcription factors
- **Coiled coil**: α-helices wrapped around each other, heptad repeat (abcdefg, a/d hydrophobic)
- **SH2/SH3 domains**: SH2 binds phosphotyrosine, SH3 binds proline-rich motifs

---

## 3. Genomics and Bioinformatics

### Sequencing Technologies
- **Sanger**: Dideoxy chain termination, gold standard for accuracy, ~800 bp reads
- **Illumina**: Sequencing by synthesis, short reads (150-300 bp), very high throughput
- **PacBio (HiFi)**: Single-molecule real-time, long reads (10-25 kb), circular consensus for accuracy
- **Oxford Nanopore**: Measures current changes as DNA passes through pore, ultra-long reads (>100 kb), direct RNA sequencing

### Genome Analysis
- **Genome assembly**: de novo (overlap-layout-consensus, de Bruijn graphs) vs reference-guided
- **GWAS**: Genome-wide association study, Manhattan plots, significance threshold p < 5×10⁻⁸
  - Linkage disequilibrium: Association of nearby variants; complicates causal variant identification
- **Polygenic risk scores**: Aggregate effect of many small-effect variants
- **ENCODE**: Encyclopedia of DNA Elements, catalogued ~80% of genome has biochemical function (controversial)
- **eQTL**: Expression quantitative trait loci — variants associated with gene expression levels

### Single-Cell Genomics
- **scRNA-seq**: Droplet-based (10x Genomics) or plate-based (Smart-seq2)
  - UMAP/t-SNE for dimensionality reduction and visualization
  - Pseudotime: Order cells along developmental trajectory (Monocle, RNA velocity)
- **scATAC-seq**: Chromatin accessibility at single-cell level
- **Spatial transcriptomics**: Visium (10x), MERFISH, Slide-seq — gene expression with spatial context
- **Cell atlases**: Human Cell Atlas project, comprehensive cell type catalogues

### Phylogenomics
- **Maximum likelihood**: Probabilistic model of sequence evolution, find tree maximizing P(data|tree)
- **Bayesian (MrBayes, BEAST)**: Posterior distribution over trees, MCMC sampling
- **Coalescent theory**: Gene trees within species tree, incomplete lineage sorting
- **Molecular clock**: Rate calibration from fossils, relaxed clocks (allow rate variation)

---

## 4. Advanced Immunology

### T Cell Biology
- **T cell receptor (TCR)**: αβ or γδ heterodimer, V(D)J recombination generates diversity (~10¹⁵-10¹⁸ potential TCRs)
- **MHC restriction**: TCR recognizes peptide-MHC complex, not free antigen
- **Thymic selection**: Positive selection (must bind MHC) then negative selection (must not bind self-peptide too strongly)
- **T cell subsets**:
  - Th1: IFN-γ, IL-2, T-bet → intracellular pathogens
  - Th2: IL-4, IL-5, IL-13, GATA3 → helminths, allergy
  - Th17: IL-17, RORγt → extracellular bacteria, fungi, autoimmunity
  - Treg: FoxP3, IL-10, TGF-β → suppression, tolerance
  - Tfh: BCL6, IL-21 → germinal center help for B cells
  - CD8+ cytotoxic: Perforin/granzyme, FasL → kill infected/tumor cells
- **T cell exhaustion**: Chronic antigen → PD-1, LAG-3, TIM-3 upregulation, reduced effector function
  - Checkpoint blockade: Anti-PD-1 (pembrolizumab), anti-CTLA-4 (ipilimumab) for cancer immunotherapy

### B Cell Biology and Antibody Engineering
- **V(D)J recombination**: RAG1/2 enzymes, combinatorial + junctional diversity
- **Affinity maturation**: Somatic hypermutation (AID enzyme) in germinal centers + selection
- **Class switch recombination**: AID-mediated, switch regions, IgM → IgG/A/E directed by cytokines
- **Monoclonal antibody production**: Hybridoma (Köhler/Milstein), phage display, transgenic mice
- **Antibody engineering**: ScFv, Fab, bispecific, nanobodies (VHH from camelids), ADCs (antibody-drug conjugates)
- **CAR-T cells**: Chimeric antigen receptor — scFv + CD3ζ + costimulatory domains (CD28, 4-1BB)
  - FDA-approved for B-cell malignancies (tisagenlecleucel, axicabtagene ciloleucel)

### Innate Immunity (Advanced)
- **Pattern recognition**: TLRs (TLR4: LPS, TLR3: dsRNA, TLR9: CpG DNA), RIG-I/MDA5 (cytosolic RNA), cGAS-STING (cytosolic DNA)
- **Inflammasome**: NLRP3 senses danger signals → caspase-1 activation → IL-1β/IL-18 maturation → pyroptosis
- **Complement system**: Classical (antibody), lectin (MBL), alternative (spontaneous C3 hydrolysis) → MAC (C5b-9)
- **Trained immunity**: Epigenetic reprogramming of innate cells (monocytes) for enhanced secondary response

---

## 5. Advanced Pharmacology

### Pharmacokinetics (ADME)
- **Absorption**: Bioavailability F = AUC_oral/AUC_IV, affected by first-pass metabolism
- **Distribution**: V_d = Dose/C_plasma; high V_d = tissue-sequestered; low V_d = plasma-confined
  - V_d > 40L → extensive tissue binding (e.g., amiodarone V_d ≈ 60 L/kg)
- **Metabolism**:
  - Phase I: CYP450 enzymes (CYP3A4 metabolizes ~50% of drugs, CYP2D6 ~25%)
  - Phase II: Conjugation (glucuronidation, sulfation, acetylation, glutathione)
  - Prodrugs: Require metabolic activation (codeine → morphine via CYP2D6)
- **Excretion**: Renal (GFR + tubular secretion - reabsorption), hepatic (biliary)
- **Half-life**: t₁/₂ = 0.693·V_d/CL; steady state at ~5 half-lives
- **Clearance**: CL = Rate of elimination / C_plasma = Dose·F/AUC

### Pharmacodynamics (Advanced)
- **Receptor theory**: Occupancy theory (Clark), operational model (Black-Leff)
- **Spare receptors**: Maximal response achieved before full receptor occupancy
- **Desensitization**: Receptor phosphorylation (GRK), β-arrestin recruitment, internalization
- **Inverse agonist**: Reduces constitutive receptor activity below basal (distinct from antagonist)
- **Allosteric modulation**: PAM (positive allosteric modulator), NAM (negative), silent allosteric modulator

### Drug Development
- **HTS**: High-throughput screening of compound libraries
- **SAR**: Structure-activity relationships, medicinal chemistry optimization
- **ADMET prediction**: In silico tools, Lipinski's Rule of Five (MW ≤ 500, LogP ≤ 5, HBD ≤ 5, HBA ≤ 10)
- **Clinical trials**: Phase I (safety, PK, ~20-80), Phase II (efficacy, dosing, ~100-300), Phase III (large-scale, ~1000-3000), Phase IV (post-marketing)
- **Biologics**: Monoclonal antibodies, fusion proteins, gene/cell therapies, RNA therapeutics

---

## 6. Cancer Biology

### Hallmarks of Cancer (Hanahan & Weinberg)
1. Sustaining proliferative signaling
2. Evading growth suppressors
3. Resisting cell death
4. Enabling replicative immortality (telomerase)
5. Inducing angiogenesis
6. Activating invasion and metastasis
7. Reprogramming energy metabolism (Warburg effect)
8. Evading immune destruction
- Enabling characteristics: Genome instability, tumor-promoting inflammation

### Oncogenes and Tumor Suppressors
| Gene | Type | Cancer | Mechanism |
|---|---|---|---|
| RAS (KRAS, NRAS, HRAS) | Oncogene | Pancreatic, colorectal, lung | Constitutive GTPase signaling |
| BRAF | Oncogene | Melanoma (V600E) | Constitutive MAPK activation |
| HER2/ERBB2 | Oncogene | Breast | Amplification, receptor overexpression |
| MYC | Oncogene | Burkitt lymphoma | Transcription factor amplification |
| BCR-ABL | Oncogene | CML | Constitutive tyrosine kinase (Philadelphia chromosome) |
| TP53 | Tumor suppressor | ~50% of all cancers | Cell cycle arrest, apoptosis, "guardian of genome" |
| RB1 | Tumor suppressor | Retinoblastoma | Cell cycle G1/S checkpoint |
| BRCA1/2 | Tumor suppressor | Breast, ovarian | Homologous recombination repair |
| APC | Tumor suppressor | Colorectal | Wnt pathway regulation |
| PTEN | Tumor suppressor | Many | PI3K/AKT pathway negative regulator |

### Targeted Therapies
- **Imatinib**: BCR-ABL tyrosine kinase inhibitor (CML)
- **Trastuzumab**: Anti-HER2 antibody (breast cancer)
- **Vemurafenib**: BRAF V600E inhibitor (melanoma)
- **Osimertinib**: EGFR T790M inhibitor (NSCLC)
- **Olaparib**: PARP inhibitor, synthetic lethality with BRCA1/2 loss
- **Immune checkpoint inhibitors**: Anti-PD-1/PD-L1, anti-CTLA-4

---

## 7. Neuroscience (Advanced)

### Synaptic Transmission
- **Vesicle cycle**: Docking (Munc18/syntaxin) → Priming (Munc13, SNARE complex assembly) → Fusion (Ca²⁺ → synaptotagmin triggers) → Endocytosis (clathrin-mediated)
- **SNARE complex**: v-SNARE (synaptobrevin/VAMP) + t-SNAREs (syntaxin-1 + SNAP-25)
- **Neurotransmitter release**: Ca²⁺ entry through P/Q-type or N-type channels → <1 ms delay
- **Quantal release**: Vesicles release fixed amounts (quanta), mEPSPs as building blocks

### Synaptic Plasticity
- **LTP (long-term potentiation)**: High-frequency stimulation → NMDAR activation → Ca²⁺ influx → CaMKII → AMPAR insertion
  - Early LTP: Post-translational (minutes-hours), late LTP: requires transcription/translation (hours-days)
- **LTD (long-term depression)**: Low-frequency → modest Ca²⁺ → calcineurin/PP1 → AMPAR internalization
- **STDP (spike-timing-dependent plasticity)**: Pre before post → LTP, post before pre → LTD
- **Metaplasticity**: BCM theory, sliding threshold for LTP/LTD based on recent activity

### Neural Coding
- **Rate coding**: Information in firing rate (Hz)
- **Temporal coding**: Information in spike timing (phase precession in hippocampus)
- **Population coding**: Information distributed across neuronal ensemble
- **Place cells**: Fire at specific spatial locations (O'Keefe, hippocampus)
- **Grid cells**: Hexagonal firing pattern (Moser & Moser, entorhinal cortex)
- **Predictive coding**: Brain generates predictions, signals prediction errors

### Neurodegenerative Disease Mechanisms
- **Alzheimer's**: Aβ plaques (APP processing by β/γ-secretase), tau tangles (hyperphosphorylation), neuroinflammation
- **Parkinson's**: α-synuclein aggregation (Lewy bodies), dopaminergic neuron loss in substantia nigra
- **ALS**: TDP-43 aggregation (most cases), SOD1 mutations (familial), C9orf72 repeat expansion
- **Prion diseases**: PrP^Sc templated misfolding, spongiform encephalopathy
- **Common themes**: Protein aggregation, proteostasis failure, neuroinflammation, mitochondrial dysfunction

---

## 8. Microbiology (Advanced)

### Bacterial Pathogenesis
- **Type III secretion system (T3SS)**: Needle-like apparatus, injects effectors directly into host cell (Salmonella, Yersinia, Pseudomonas)
- **Type IV secretion system (T4SS)**: Conjugation/effector delivery (Agrobacterium, H. pylori, Legionella)
- **Quorum sensing**: Cell-density-dependent gene regulation (AHL in Gram-negatives, autoinducing peptides in Gram-positives)
- **Biofilm formation**: Attachment → microcolony → maturation → dispersal; extracellular matrix (EPS)
- **Two-component signaling**: Histidine kinase (sensor) + response regulator; >30 systems in E. coli
- **Phase variation**: Stochastic ON/OFF switching of gene expression (e.g., pili, flagella) for immune evasion

### Virology
- **Baltimore classification**: Based on genome type and replication strategy
  - I: dsDNA (herpes), II: ssDNA (parvo), III: dsRNA (reo), IV: (+)ssRNA (corona, flavi), V: (-)ssRNA (influenza, Ebola), VI: ssRNA-RT (HIV), VII: dsDNA-RT (HBV)
- **HIV lifecycle**: gp120/gp41 binding (CD4 + CCR5/CXCR4) → fusion → RT → integration (integrase) → transcription → assembly → budding
  - ART: NRTIs, NNRTIs, protease inhibitors, integrase inhibitors, entry inhibitors
- **Influenza**: Segmented genome (8 segments), antigenic drift (point mutations) vs shift (reassortment)
- **SARS-CoV-2**: Spike protein binds ACE2, furin cleavage site enhances entry, mRNA vaccines (Pfizer/Moderna)
- **Bacteriophage**: T4 (lytic), λ (lysogenic/lytic switch — cI/Cro decision circuit)

### Antibiotic Resistance
- **Mechanisms**: Target modification (PBP alteration), efflux pumps (RND family), enzymatic inactivation (β-lactamases), reduced permeability (porin loss)
- **β-lactamases**: TEM, SHV (ESBLs), KPC (carbapenemases), NDM-1 (metallo-β-lactamase)
- **MRSA**: mecA gene encodes PBP2a with low affinity for β-lactams
- **VRE**: vanA/vanB operons remodel peptidoglycan terminus (D-Ala-D-Ala → D-Ala-D-Lac)
- **Horizontal gene transfer**: Conjugation (plasmids), transformation (free DNA), transduction (phage)
