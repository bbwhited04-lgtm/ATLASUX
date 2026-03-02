# Linguistics Reference — HLE Benchmark Knowledge Base

> Linguistics questions appear across Humanities (8%) and as standalone.
> Covers: Phonetics, Phonology, Morphology, Syntax, Semantics, Pragmatics,
> Historical Linguistics, Sociolinguistics, Typology, Computational Linguistics

---

## 1. Phonetics

### Articulatory Phonetics — Consonants
| Place | Bilabial | Labiodental | Dental | Alveolar | Postalveolar | Retroflex | Palatal | Velar | Uvular | Pharyngeal | Glottal |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Plosive | p b | | | t d | | ʈ ɖ | c ɟ | k ɡ | q ɢ | | ʔ |
| Nasal | m | ɱ | | n | | ɳ | ɲ | ŋ | ɴ | | |
| Trill | ʙ | | | r | | | | | ʀ | | |
| Tap/Flap | | ⱱ | | ɾ | | ɽ | | | | | |
| Fricative | ɸ β | f v | θ ð | s z | ʃ ʒ | ʂ ʐ | ç ʝ | x ɣ | χ ʁ | ħ ʕ | h ɦ |
| Lateral fric. | | | | ɬ ɮ | | | | | | | |
| Approximant | | ʋ | | ɹ | | ɻ | j | ɰ | | | |
| Lateral appr. | | | | l | | ɭ | ʎ | ʟ | | | |

### Vowel Space (Cardinal Vowels)
- **Front unrounded**: i, e, ɛ, a
- **Front rounded**: y, ø, œ
- **Central**: ɨ, ə (schwa), ɐ
- **Back rounded**: u, o, ɔ
- **Back unrounded**: ɯ, ɤ, ɑ
- **Height**: Close, close-mid, open-mid, open
- **Backness**: Front, central, back
- **Rounding**: Rounded vs unrounded

### Acoustic Phonetics
- **Formants**: Resonant frequencies of the vocal tract
  - F1 correlates with vowel height (low F1 = close vowels)
  - F2 correlates with vowel backness (high F2 = front vowels)
  - F3 correlates with rhoticity and lip rounding
- **Voice Onset Time (VOT)**: Time between release of stop and onset of voicing
  - Negative VOT: prevoiced (e.g., French /b/)
  - Short positive VOT: voiceless unaspirated (e.g., French /p/)
  - Long positive VOT: voiceless aspirated (e.g., English /pʰ/)
- **Spectrogram**: Time × frequency × amplitude visualization

---

## 2. Phonology

### Distinctive Features (Chomsky & Halle, SPE tradition)
- **[±voice]**: Vocal fold vibration
- **[±sonorant]**: Spontaneous voicing (nasals, liquids, glides, vowels = [+son])
- **[±continuant]**: Airflow continues through oral cavity (fricatives, vowels = [+cont])
- **[±nasal]**: Lowered velum
- **[±coronal]**: Tongue blade/tip articulation
- **[±anterior]**: Articulation at or forward of alveolar ridge

### Phonological Processes
- **Assimilation**: Sound becomes more like neighboring sound
  - Place assimilation: /n/ → [ŋ] before /k/ (e.g., "bank")
  - Voicing assimilation: /z/ → [s] after voiceless (e.g., "cats")
  - Nasal assimilation: /n/ → [m] before /p,b/ (e.g., "input")
- **Dissimilation**: Sound becomes less like neighboring sound (Latin *peregrīnus > pilgrim)
- **Lenition**: Weakening (stop → fricative → approximant → ∅)
- **Fortition**: Strengthening (opposite of lenition)
- **Metathesis**: Reordering of segments (Old English *brid > bird)
- **Epenthesis**: Insertion of segment (Latin *schola > Spanish *escuela*)
- **Deletion/Elision**: Loss of segment
- **Palatalization**: /k/ → /tʃ/ before front vowels (common cross-linguistically)
- **Vowel harmony**: Vowels in a word agree in feature (Turkish, Finnish, Hungarian)

### Phonological Frameworks
- **Structuralist (Prague School)**: Phonemes as bundles of distinctive features, minimal pairs
- **Generative (SPE, 1968)**: Ordered rules mapping underlying to surface forms
- **Autosegmental**: Features on separate tiers, association lines (Goldsmith 1976)
  - Tone: H, L on tonal tier, linked to TBUs (tone-bearing units)
  - OCP (Obligatory Contour Principle): Adjacent identical elements prohibited
- **Optimality Theory (OT)**: Ranked violable constraints (Prince & Smolensky 1993)
  - **Faithfulness**: Input-output identity (MAX, DEP, IDENT)
  - **Markedness**: Structural well-formedness (NOCODA, ONSET, *COMPLEX)
  - GEN generates candidates, EVAL selects optimal by ranked constraints
  - Typology from constraint re-ranking

### Syllable Structure
- **Onset**: Initial consonant(s), universally preferred
- **Nucleus**: Vowel (obligatory in most theories)
- **Coda**: Final consonant(s), marked cross-linguistically
- **Sonority Sequencing Principle**: Sonority rises to nucleus, falls in coda
  - Scale: stops < fricatives < nasals < liquids < glides < vowels
- **Maximal Onset Principle**: Assign consonants to onset of following syllable when possible

### Prosody
- **Stress**: Prominence via duration, pitch, intensity
  - Weight-sensitive: Heavy syllables (CVC, CVV) attract stress
  - Quantity-insensitive: Stress assigned regardless of weight
- **Tone**: Pitch distinguishes lexical meaning (Mandarin 4 tones, Cantonese 6)
  - Contour tones: Rising, falling, fall-rise
  - Register tones: Level pitch distinctions (H, M, L)
- **Intonation**: Sentence-level pitch patterns (questions, declarations)
  - ToBI (Tones and Break Indices): H*, L*, L+H*, H+L* pitch accents

---

## 3. Morphology

### Morpheme Types
- **Free morphemes**: Can stand alone (cat, run, big)
- **Bound morphemes**: Must attach to another morpheme
  - **Prefix**: un-, re-, pre-
  - **Suffix**: -ness, -ing, -ed
  - **Infix**: Tagalog *-um-* (sulat → sumulat)
  - **Circumfix**: German ge-...-t (spielen → gespielt)
- **Root**: Core lexical meaning
- **Stem**: Root + derivational affixes (base for inflection)

### Morphological Typology
- **Isolating (analytic)**: One morpheme per word (Mandarin, Vietnamese)
- **Agglutinative**: Clear morpheme boundaries, one meaning per affix (Turkish, Swahili, Japanese)
- **Fusional (inflectional)**: Affixes encode multiple categories simultaneously (Latin, Russian)
- **Polysynthetic**: Single word encodes what other languages express in a sentence (Mohawk, Yupik)

### Derivation vs Inflection
- **Derivation**: Changes meaning or category (happy → unhappy, happy → happiness)
- **Inflection**: Grammatical function, no category change (walk → walks, walked, walking)
- Derivation is typically closer to root; inflection is outer layer

### Key Concepts
- **Allomorphy**: Multiple surface forms of a morpheme (English plural: -s, -z, -ɪz)
- **Suppletion**: Completely irregular allomorphy (go/went, good/better)
- **Portmanteau**: Single morph expressing multiple morphemes (French *au* = à + le)
- **Zero morpheme**: Category marked by absence (sheep → sheep, plural = ∅)
- **Morphophonology**: Phonological alternations conditioned by morphology (knife/knives, /f/ → /v/)

---

## 4. Syntax

### Phrase Structure
- **X-bar theory**: XP → Spec, X'; X' → X, Complement
  - Every phrase has a head, optional specifier and complement
- **CP** (Complementizer Phrase): Force, finiteness, clause typing
- **IP/TP** (Inflectional/Tense Phrase): Tense, agreement, subject position
- **VP** (Verb Phrase): Verb and its arguments
- **DP** (Determiner Phrase): Determiners as heads of nominal phrases (Abney 1987)

### Movement
- **Wh-movement**: Wh-phrases move to Spec-CP (What did you see _?)
- **Head movement**: V-to-T (French: verb raises past adverbs), T-to-C (subject-aux inversion)
- **NP/DP-movement**: Passivization (The book was read _), raising (John seems _ to be happy)
- **Successive-cyclic movement**: Through intermediate Spec-CP positions
- **Islands**: Constraints on extraction
  - Complex NP Constraint: *Who did you read [the book that _ wrote]?
  - Adjunct island: *What did you leave [before finishing _]?
  - Coordinate Structure Constraint: *What did you buy [_ and a book]?
  - Subject island: *Who did [a picture of _] fall?

### Binding Theory (Chomsky 1981)
- **Principle A**: Anaphors (himself, each other) must be bound in their local domain
- **Principle B**: Pronouns (he, she) must be free in their local domain
- **Principle C**: R-expressions (proper names, full DPs) must be free everywhere
- **C-command**: α c-commands β if α's sister dominates β

### Theta Theory
- **Theta roles**: Agent, Patient/Theme, Experiencer, Goal, Source, Instrument, Benefactive
- **Theta Criterion**: Each argument gets exactly one theta role; each theta role assigned to exactly one argument
- **Argument structure**: Transitivity, ditransitives, unaccusatives vs unergatives

### Minimalist Program (Chomsky 1995+)
- **Merge**: Fundamental operation combining two syntactic objects
  - External Merge: Combines separate items
  - Internal Merge: Moves constituent (displacement)
- **Agree**: Feature checking between probe and goal
- **Phase Theory**: CP and vP are phases (Spell-Out domains)
- **Economy**: Derivations must be minimal (Shortest Move, Last Resort)

### Word Order Typology
- **SVO**: English, Mandarin, French, Swahili
- **SOV**: Japanese, Korean, Turkish, Hindi (most common type)
- **VSO**: Arabic, Irish, Welsh
- **VOS**: Malagasy, Fijian
- **Greenberg's universals**: Correlations between word order and other properties
  - SOV tends to have postpositions, Adj-N, Gen-N
  - SVO tends to have prepositions, N-Adj, N-Gen

---

## 5. Semantics

### Formal Semantics
- **Compositionality (Frege)**: Meaning of whole = function of meanings of parts + structure
- **Denotation**: Extension of an expression (set of entities, truth values)
- **Sense vs Reference**: Intension (meaning) vs extension (what it picks out)
- **Lambda calculus**: λx.P(x) — function abstraction for compositional semantics
  - λ-reduction: (λx.P(x))(a) = P(a)

### Quantification
- **Generalized quantifiers**: ⟦every⟧ = λP.λQ.∀x[P(x)→Q(x)]
- **Scope ambiguity**: "Every student read a book" — ∀>∃ vs ∃>∀
- **Donkey sentences**: "Every farmer who owns a donkey beats it" — dynamic binding

### Tense, Aspect, Modality
- **Tense**: Temporal location (past, present, future)
- **Aspect**: Internal structure of events
  - Perfective: Bounded, completed (He ran)
  - Imperfective: Ongoing, habitual (He was running, He runs every day)
  - **Vendler classes**: States, Activities, Accomplishments, Achievements
    - State: know, believe (no endpoint, no process)
    - Activity: run, swim (process, no endpoint)
    - Accomplishment: build a house (process + endpoint)
    - Achievement: arrive, find (instantaneous endpoint)
- **Modality**: Possibility/necessity
  - Epistemic: What might be true (He might be home)
  - Deontic: What is permitted/obligated (You must leave)
  - Possible worlds semantics: ◇P iff P is true in some accessible world

### Lexical Semantics
- **Hyponymy**: "dog" is a hyponym of "animal"
- **Synonymy**: Near-identical meaning (big/large)
- **Antonymy**: Opposites (hot/cold — gradable; alive/dead — complementary)
- **Polysemy**: One word, related meanings (bank: riverbank, financial institution)
- **Homophony**: Same pronunciation, unrelated meanings (bank₁, bank₂)
- **Thematic roles**: Agent, Patient, Theme, Experiencer, Goal, Source

---

## 6. Pragmatics

### Grice's Maxims (Cooperative Principle)
- **Quality**: Be truthful, have evidence
- **Quantity**: Be as informative as needed, not more
- **Relation**: Be relevant
- **Manner**: Be clear, brief, orderly, unambiguous
- **Implicature**: Meaning inferred from maxim violation/exploitation
  - Scalar implicature: "some" implicates "not all"

### Speech Act Theory (Austin, Searle)
- **Locutionary act**: The utterance itself
- **Illocutionary act**: The intended force (asserting, requesting, promising, threatening)
- **Perlocutionary act**: The effect on the hearer
- **Indirect speech acts**: "Can you pass the salt?" = request, not question about ability
- **Felicity conditions**: Conditions for successful speech act

### Presupposition
- **Existential**: "The king of France is bald" presupposes France has a king
- **Triggers**: Definite descriptions, factive verbs (know, realize), clefts, change-of-state
- **Projection problem**: How presuppositions survive embedding under negation, conditionals
- **Accommodation**: Hearer accepts presupposed content to maintain coherence

### Relevance Theory (Sperber & Wilson)
- Communication aims to maximize relevance (cognitive effect vs processing effort)
- Replaces Gricean maxims with a single cognitive principle

---

## 7. Historical Linguistics

### Sound Change
- **Grimm's Law**: PIE stops → Germanic fricatives (p→f, t→θ, k→h; b→p, d→t, g→k; bʰ→b, dʰ→d, gʰ→g)
- **Verner's Law**: Exception to Grimm's — voiceless fricatives voiced when preceding syllable was unstressed in PIE
- **Great Vowel Shift**: English ~1400-1700, systematic raising of long vowels
  - /iː/ → /aɪ/ (bite), /uː/ → /aʊ/ (house), /eː/ → /iː/ (meet)
- **Neogrammarian hypothesis**: Sound change is regular and exceptionless (within defined environment)
- **Lexical diffusion**: Sound change spreads word by word (counter-hypothesis)

### Reconstruction
- **Comparative method**: Systematic comparison of cognates to reconstruct proto-language
  - Regular sound correspondences → proto-phoneme
  - Directionality: natural vs unnatural changes
- **Internal reconstruction**: Using alternations within one language to infer earlier states
- **Glottochronology**: Estimating time depth from lexical retention rate (controversial)

### Major Language Families
| Family | ~Speakers | Major Branches |
|---|---|---|
| Indo-European | ~3.2B | Germanic, Romance, Slavic, Indo-Iranian, Celtic, Hellenic |
| Sino-Tibetan | ~1.3B | Sinitic (Mandarin), Tibeto-Burman |
| Niger-Congo | ~700M | Atlantic-Congo (Bantu), Mande |
| Afroasiatic | ~500M | Semitic (Arabic, Hebrew), Berber, Cushitic, Chadic |
| Austronesian | ~400M | Malayo-Polynesian, Formosan |
| Dravidian | ~250M | Tamil, Telugu, Kannada, Malayalam |
| Turkic | ~200M | Turkish, Azerbaijani, Uzbek, Kazakh |
| Japonic | ~130M | Japanese, Ryukyuan |
| Koreanic | ~80M | Korean |
| Uralic | ~25M | Finnic (Finnish, Estonian), Ugric (Hungarian) |

### Grammaticalization
- Lexical item → grammatical function (full verb → auxiliary → affix)
- Unidirectionality hypothesis: Content → function (rarely reverses)
- Examples: English "going to" (motion verb → future marker), Latin *ille* (demonstrative → French *le* article)

---

## 8. Sociolinguistics

### Variation
- **Dialect vs language**: "A language is a dialect with an army and a navy" (Weinreich)
- **Sociolect**: Variety associated with social class
- **Register**: Variation by context/formality
- **Code-switching**: Alternating between languages/varieties in conversation
- **Diglossia (Ferguson)**: Two varieties in complementary distribution (H: formal, L: informal)

### Language Change & Contact
- **Pidgin**: Simplified contact language, no native speakers
- **Creole**: Nativized pidgin with full grammar
- **Substrate/superstrate**: Influence of subordinate/dominant language in contact
- **Sprachbund**: Languages sharing features through contact, not genealogy (Balkan sprachbund)

### Language Death & Revitalization
- ~7,000 languages currently; ~40% endangered
- **Language shift**: Community transitions to dominant language
- **Language revitalization**: Hebrew (successful revival), Irish, Hawaiian

---

## 9. Typology & Universals

### Morphosyntactic Alignment
- **Nominative-accusative**: S and A grouped (most European languages)
- **Ergative-absolutive**: S and P grouped (Basque, Dyirbal, many Austronesian)
- **Split ergativity**: Ergative in some contexts, accusative in others (Hindi: tense-based split)
- **Active-stative**: Alignment based on agentivity, not syntactic role

### Relative Clause Typology (Keenan & Comrie)
- **Accessibility hierarchy**: Subject > Direct Object > Indirect Object > Oblique > Genitive > Object of Comparison
- Languages can relativize positions at top of hierarchy; if a position is accessible, all higher positions must be too

### Implicational Universals (Greenberg)
- If a language has nasal vowels, it also has oral vowels
- If a language has fricatives, it also has stops
- If a language has dual number, it also has plural
- If a language has trial number, it also has dual

---

## 10. Writing Systems

### Types
- **Logographic**: One symbol ≈ one morpheme (Chinese characters)
- **Syllabary**: One symbol = one syllable (Japanese kana, Cherokee)
- **Alphabet**: One symbol ≈ one phoneme (Latin, Cyrillic, Greek)
- **Abjad**: Consonants only, vowels optional (Arabic, Hebrew)
- **Abugida**: Consonant + inherent vowel, diacritics modify (Devanagari, Ge'ez)
- **Featural**: Symbols encode phonetic features (Korean Hangul)

### Historical Writing
- **Cuneiform** (~3400 BCE): Sumerian, later Akkadian — oldest writing system
- **Egyptian hieroglyphs** (~3200 BCE): Logographic + phonetic
- **Chinese** (~1200 BCE): Oracle bones, continuous tradition
- **Decipherment**: Rosetta Stone (Egyptian), Linear B (Ventris, 1952 — Mycenaean Greek), still undeciphered: Linear A, Indus script, Proto-Elamite
