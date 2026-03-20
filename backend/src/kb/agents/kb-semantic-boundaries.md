# Semantic Boundary Detection for Knowledge Base Segmentation

## Introduction

The quality of a retrieval-augmented generation system depends fundamentally on where documents are split. Split in the wrong place and you create chunks that mix unrelated concepts, losing retrieval precision. Split correctly and each chunk becomes a focused, self-contained unit of knowledge that an AI agent can retrieve and reason over with confidence. Semantic boundary detection moves beyond naive character or paragraph splitting to identify the actual topic transitions within documents — using structural analysis, statistical algorithms, and embedding-based similarity to find the natural seams in text. This article covers the algorithms, implementation patterns, and quality metrics that separate amateur chunking from production-grade document segmentation.

## Document Structure Analysis

### Structural Signals

Well-formatted documents provide explicit boundary signals that should be the first line of defense in any segmentation pipeline:

- **Headers** (H1-H6 in HTML, `#` in Markdown): The strongest boundary signal. A new header almost always introduces a new topic.
- **Paragraph breaks** (double newlines): Moderate boundary signal. New paragraphs often shift subtopics within a broader section.
- **List boundaries**: The start and end of bulleted or numbered lists form natural chunk edges.
- **Code block delimiters**: Code fences (```) mark transitions between prose and code that should rarely be split.
- **Horizontal rules / section dividers**: Explicit author-placed boundaries.

```python
import re
from dataclasses import dataclass

@dataclass
class StructuralSegment:
    text: str
    level: int  # Header level (1-6) or 0 for body text
    header: str  # Section header text
    segment_type: str  # "header_section", "paragraph", "code_block", "list"

def extract_structural_segments(markdown: str) -> list[StructuralSegment]:
    """Parse markdown into structural segments based on headers."""
    segments = []
    current_header = ""
    current_level = 0
    current_text = []

    for line in markdown.split("\n"):
        header_match = re.match(r'^(#{1,6})\s+(.+)$', line)
        if header_match:
            # Save accumulated text as a segment
            if current_text:
                segments.append(StructuralSegment(
                    text="\n".join(current_text),
                    level=current_level,
                    header=current_header,
                    segment_type="header_section"
                ))
                current_text = []
            current_level = len(header_match.group(1))
            current_header = header_match.group(2)
        current_text.append(line)

    # Don't forget the last segment
    if current_text:
        segments.append(StructuralSegment(
            text="\n".join(current_text),
            level=current_level,
            header=current_header,
            segment_type="header_section"
        ))

    return segments
```

### Hierarchical Segmentation

Documents have hierarchical structure: H1 sections contain H2 subsections, which contain H3 sub-subsections. A hierarchical segmentation preserves this nesting, enabling retrieval at different granularity levels:

```python
def hierarchical_chunk(segments: list[StructuralSegment],
                       max_chunk_tokens: int = 500) -> list[dict]:
    """Create chunks that respect header hierarchy."""
    chunks = []

    for segment in segments:
        text = segment.text
        token_count = len(text.split())  # Approximate

        if token_count <= max_chunk_tokens:
            # Segment fits in one chunk — use as-is
            chunks.append({
                "text": text,
                "header_path": segment.header,
                "level": segment.level,
            })
        else:
            # Segment too large — split at paragraph boundaries
            paragraphs = text.split("\n\n")
            current_chunk = []
            current_tokens = 0

            for para in paragraphs:
                para_tokens = len(para.split())
                if current_tokens + para_tokens > max_chunk_tokens and current_chunk:
                    chunks.append({
                        "text": "\n\n".join(current_chunk),
                        "header_path": segment.header,
                        "level": segment.level,
                    })
                    current_chunk = []
                    current_tokens = 0
                current_chunk.append(para)
                current_tokens += para_tokens

            if current_chunk:
                chunks.append({
                    "text": "\n\n".join(current_chunk),
                    "header_path": segment.header,
                    "level": segment.level,
                })

    return chunks
```

## Topic Segmentation Algorithms

### TextTiling

TextTiling, introduced by Marti Hearst in 1997, is the foundational algorithm for topic boundary detection in text. It works by measuring lexical cohesion between adjacent blocks of text using term frequency patterns.

**Algorithm:**
1. Divide text into pseudo-sentences (fixed-length token sequences)
2. Compute vocabulary overlap between adjacent blocks using a sliding window
3. Calculate a "depth score" at each position (how much the similarity drops relative to surrounding peaks)
4. Boundaries are placed at positions where depth scores exceed a threshold

```python
from nltk.tokenize import TextTilingTokenizer

tokenizer = TextTilingTokenizer(
    w=20,   # Window size (pseudo-sentence length)
    k=10,   # Block size for similarity comparison
)

# Returns text segments split at detected topic boundaries
segments = tokenizer.tokenize(long_document)
```

**Strengths:** Fast, no external model required, well-studied.
**Weaknesses:** Relies on word repetition patterns (fails when topics use different vocabulary for the same concept), no semantic understanding, sensitive to parameter tuning.

### TopicTiling

TopicTiling (Riedl & Biemann, 2012) improves on TextTiling by replacing raw word frequencies with topic model assignments. Each sentence is represented by its dominant LDA topic, and boundaries are detected where the topic assignment shifts.

**Algorithm:**
1. Train an LDA topic model on the document corpus
2. Assign topic distributions to each sentence
3. Compare adjacent sentence topic distributions
4. Place boundaries where topic distributions diverge significantly

```python
from gensim import corpora, models
from gensim.parsing.preprocessing import preprocess_string

# Train LDA model
texts = [preprocess_string(doc) for doc in corpus]
dictionary = corpora.Dictionary(texts)
bow_corpus = [dictionary.doc2bow(text) for text in texts]
lda_model = models.LdaModel(bow_corpus, num_topics=20, id2word=dictionary)

# Get topic distribution for each sentence
def get_sentence_topic(sentence):
    bow = dictionary.doc2bow(preprocess_string(sentence))
    return lda_model.get_document_topics(bow)

# Detect boundaries where dominant topic changes
sentences = document.split(". ")
topics = [get_sentence_topic(s) for s in sentences]
boundaries = []
for i in range(1, len(topics)):
    if dominant_topic(topics[i]) != dominant_topic(topics[i-1]):
        boundaries.append(i)
```

**Strengths:** Captures semantic topic shifts, not just vocabulary changes.
**Weaknesses:** Requires pre-trained topic model, LDA topics may not align with intuitive document sections.

## Embedding-Based Boundary Detection

### Sentence Embedding Similarity

The most effective modern approach: embed each sentence, compute similarity between consecutive sentences, and place boundaries where similarity drops sharply.

```python
from sentence_transformers import SentenceTransformer
import numpy as np

model = SentenceTransformer("all-MiniLM-L6-v2")

def detect_semantic_boundaries(text: str,
                                threshold_percentile: float = 85) -> list[int]:
    """Detect topic boundaries using embedding similarity drops."""
    # Split into sentences
    sentences = text.replace("\n", " ").split(". ")
    sentences = [s.strip() for s in sentences if len(s.strip()) > 10]

    # Embed all sentences
    embeddings = model.encode(sentences)

    # Compute cosine similarity between consecutive sentences
    similarities = []
    for i in range(len(embeddings) - 1):
        sim = np.dot(embeddings[i], embeddings[i+1]) / (
            np.linalg.norm(embeddings[i]) * np.linalg.norm(embeddings[i+1])
        )
        similarities.append(sim)

    # Detect boundaries at significant similarity drops
    threshold = np.percentile(
        [1 - s for s in similarities],
        threshold_percentile
    )

    boundaries = []
    for i, sim in enumerate(similarities):
        if (1 - sim) > threshold:
            boundaries.append(i + 1)

    return boundaries

def segment_by_boundaries(text: str, boundaries: list[int]) -> list[str]:
    """Split text into segments at detected boundaries."""
    sentences = text.replace("\n", " ").split(". ")
    segments = []
    start = 0
    for boundary in boundaries:
        segment = ". ".join(sentences[start:boundary]) + "."
        segments.append(segment.strip())
        start = boundary
    # Last segment
    if start < len(sentences):
        segments.append(". ".join(sentences[start:]) + ".")
    return segments
```

### Windowed Similarity with Smoothing

Raw sentence-to-sentence similarity is noisy. A more robust approach averages similarity over a window of sentences, smoothing out local variations:

```python
def windowed_similarity(embeddings: np.ndarray, window: int = 3) -> list[float]:
    """Compute smoothed similarity between windowed groups of sentences."""
    n = len(embeddings)
    similarities = []

    for i in range(window, n - window):
        # Average embedding of sentences before position i
        left = np.mean(embeddings[i-window:i], axis=0)
        # Average embedding of sentences after position i
        right = np.mean(embeddings[i:i+window], axis=0)
        # Cosine similarity between left and right context
        sim = np.dot(left, right) / (np.linalg.norm(left) * np.linalg.norm(right))
        similarities.append(sim)

    return similarities
```

### Adaptive Thresholding

Rather than a fixed percentile threshold, adaptive methods adjust the boundary detection sensitivity based on local statistics:

- **Standard deviation method:** A boundary is detected when the similarity drop exceeds `mean - k * std` (typically k=1.5)
- **Gradient method:** Boundaries at positions where the derivative of the similarity curve is most negative
- **Interquartile range:** Boundaries where similarity drops below `Q1 - 1.5 * IQR`

## Cross-Reference Preservation During Splitting

### The Problem

Documents contain internal cross-references: "as described in Section 3.2," "see the table above," "the aforementioned policy." When chunking splits these references from their targets, the resulting chunks contain dangling pointers that confuse retrieval and generation.

### Solutions

**Reference resolution before chunking:** Resolve internal references to their full form before splitting. "As described above" becomes "As described in the Pricing Structure section."

```python
def resolve_internal_references(text: str) -> str:
    """Replace vague references with explicit ones."""
    # Pattern: "as mentioned/described/discussed above/below/earlier"
    sections = extract_sections(text)

    # Build a map of concepts to their defining sections
    concept_sections = {}
    for section in sections:
        key_concepts = extract_key_concepts(section.text)
        for concept in key_concepts:
            concept_sections[concept] = section.header

    # Replace vague references
    # This is a simplified example; production systems use LLM-based resolution
    resolved = text
    for concept, section in concept_sections.items():
        resolved = re.sub(
            rf'(as (?:mentioned|described|discussed) (?:above|earlier|previously))',
            f'as described in the "{section}" section',
            resolved,
            count=1
        )

    return resolved
```

**Metadata linking:** Store chunk relationships (prev/next, parent/child, references) as metadata so the retrieval system can fetch linked chunks.

**Context injection:** Prepend each chunk with a brief context string: "[From: Pricing Structure > Enterprise Tier] The annual license fee is..."

## Handling Tables, Code Blocks, and Mixed Content

### Tables

Tables should never be split across chunks. A table row without its header row is meaningless. Strategies:

1. **Keep tables intact:** If a table fits within the chunk size limit, include it as a single chunk
2. **Serialize tables:** Convert tables to natural language sentences for embedding
3. **Row-level chunking with header:** Each row becomes a chunk with the header row prepended

```python
def chunk_table(markdown_table: str) -> list[str]:
    """Split a markdown table into row-level chunks with headers."""
    lines = markdown_table.strip().split("\n")
    header = lines[0]
    separator = lines[1] if len(lines) > 1 and re.match(r'^[\|\-\s:]+$', lines[1]) else None
    data_start = 2 if separator else 1

    chunks = []
    for row in lines[data_start:]:
        chunk = f"{header}\n{separator}\n{row}" if separator else f"{header}\n{row}"
        chunks.append(chunk)

    return chunks
```

### Code Blocks

Code should be chunked at logical boundaries: function definitions, class definitions, or complete blocks. Never split mid-function.

```python
import tree_sitter_python as tspython
from tree_sitter import Language, Parser

PY_LANGUAGE = Language(tspython.language())
parser = Parser(PY_LANGUAGE)

def chunk_python_by_functions(source_code: str) -> list[str]:
    """Split Python code into function/class-level chunks."""
    tree = parser.parse(bytes(source_code, "utf8"))
    root = tree.root_node

    chunks = []
    for child in root.children:
        if child.type in ("function_definition", "class_definition", "decorated_definition"):
            chunk_text = source_code[child.start_byte:child.end_byte]
            chunks.append(chunk_text)

    return chunks
```

### Mixed Content (Prose + Code + Tables)

Documents with mixed content types require a multi-pass approach:

1. **First pass:** Identify content type regions (prose, code, table, list)
2. **Second pass:** Apply type-specific chunking to each region
3. **Third pass:** Merge undersized chunks with their neighbors if they share a content type

## Quality Metrics

### Retrieval Precision vs Chunk Granularity

The fundamental trade-off in semantic boundary detection: finer granularity improves precision (the retrieved chunk is more relevant) but reduces recall (more chunks means more chances to miss the best one) and increases storage costs.

**Measurement approach:**
1. Create a golden evaluation set: 100+ question-answer pairs with the source passage identified
2. Chunk the corpus with different strategies
3. For each question, retrieve top-k chunks and measure:
   - **Precision@k:** What fraction of retrieved chunks contain the answer?
   - **Recall@k:** Did any retrieved chunk contain the answer?
   - **MRR (Mean Reciprocal Rank):** How high is the first relevant chunk ranked?

### Boundary Quality Metrics

**WindowDiff** (Pevzner & Hearst, 2002): Measures disagreement between predicted and reference segmentations by sliding a window across both and counting mismatches. Lower is better.

```python
def window_diff(predicted: list[int], reference: list[int],
                window_size: int) -> float:
    """Compute WindowDiff metric for segmentation quality."""
    n = max(max(predicted), max(reference)) + 1
    pred_boundaries = set(predicted)
    ref_boundaries = set(reference)

    mismatches = 0
    total = 0

    for i in range(n - window_size):
        pred_count = sum(1 for b in pred_boundaries if i < b <= i + window_size)
        ref_count = sum(1 for b in ref_boundaries if i < b <= i + window_size)
        if pred_count != ref_count:
            mismatches += 1
        total += 1

    return mismatches / total if total > 0 else 0
```

**Pk metric:** Probability that two positions drawn from the same segment are classified as being in different segments (or vice versa). Lower is better.

### Practical Evaluation Pipeline

```python
def evaluate_chunking_strategy(
    documents: list[str],
    golden_qa_pairs: list[dict],  # [{question, answer, source_passage}]
    chunking_fn: callable,
    embedding_fn: callable,
    top_k: int = 5
) -> dict:
    """Evaluate a chunking strategy against golden QA pairs."""
    # Chunk all documents
    all_chunks = []
    for doc in documents:
        all_chunks.extend(chunking_fn(doc))

    # Embed chunks
    chunk_embeddings = embedding_fn([c["text"] for c in all_chunks])

    # Evaluate retrieval quality
    precision_scores = []
    recall_scores = []
    mrr_scores = []

    for qa in golden_qa_pairs:
        query_embedding = embedding_fn([qa["question"]])[0]
        # Find top-k most similar chunks
        similarities = cosine_similarity_matrix(query_embedding, chunk_embeddings)
        top_indices = np.argsort(similarities)[-top_k:][::-1]

        # Check if any retrieved chunk contains the answer
        hits = [qa["source_passage"] in all_chunks[i]["text"] for i in top_indices]
        precision_scores.append(sum(hits) / top_k)
        recall_scores.append(1 if any(hits) else 0)
        if any(hits):
            mrr_scores.append(1 / (hits.index(True) + 1))
        else:
            mrr_scores.append(0)

    return {
        "precision@k": np.mean(precision_scores),
        "recall@k": np.mean(recall_scores),
        "mrr": np.mean(mrr_scores),
        "avg_chunk_size": np.mean([len(c["text"].split()) for c in all_chunks]),
        "total_chunks": len(all_chunks),
    }
```

## Conclusion

Semantic boundary detection transforms document chunking from a mechanical text-splitting operation into an intelligent segmentation process that respects document structure, topic boundaries, and content type. The progression from fixed-size splitting through recursive character splitting to embedding-based semantic chunking represents increasing quality at increasing cost. For production knowledge bases, the most effective approach combines structural analysis (headers, paragraphs) as the primary boundary signal with embedding-based similarity as a secondary signal for long, unstructured sections. The key metric is not chunk count or average chunk size but retrieval precision on a representative evaluation set — the ultimate measure of whether your segmentation serves your AI agents well.

## Media

1. https://upload.wikimedia.org/wikipedia/commons/thumb/d/d5/Precision_and_recall.svg/400px-Precision_and_recall.svg.png — Precision and recall trade-off diagram applicable to chunking granularity decisions
2. https://upload.wikimedia.org/wikipedia/commons/thumb/e/e8/Cosine_similarity.svg/400px-Cosine_similarity.svg.png — Cosine similarity measurement used in embedding-based boundary detection
3. https://upload.wikimedia.org/wikipedia/commons/thumb/a/af/Kernel_density.svg/400px-Kernel_density.svg.png — Kernel density estimation illustrating similarity score distributions for threshold selection
4. https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/Hierarchical_clustering_diagram.svg/400px-Hierarchical_clustering_diagram.svg.png — Hierarchical clustering showing multi-level document segmentation
5. https://upload.wikimedia.org/wikipedia/commons/thumb/3/3b/Parsing-Example.svg/400px-Parsing-Example.svg.png — Parse tree structure representing hierarchical document organization

## Videos

1. https://www.youtube.com/watch?v=8OJC21T2SL4 — "Chunking Strategies for LLM Applications" by Greg Kamradt covering semantic and structural chunking approaches
2. https://www.youtube.com/watch?v=n7dOYeIECmA — "Advanced RAG: Optimizing Retrieval with Semantic Chunking" by James Briggs demonstrating embedding-based segmentation

## References

1. Hearst, M. A. (1997). "TextTiling: Segmenting Text into Multi-Paragraph Subtopic Passages." Computational Linguistics, 23(1), 33-64. https://aclanthology.org/J97-1003/
2. Riedl, M. & Biemann, C. (2012). "TopicTiling: A Text Segmentation Algorithm based on LDA." Proceedings of ACL 2012 Student Research Workshop. https://aclanthology.org/W12-3307/
3. Pevzner, L. & Hearst, M. A. (2002). "A Critique and Improvement of an Evaluation Metric for Text Segmentation." Computational Linguistics, 28(1), 19-36. https://aclanthology.org/J02-1002/
4. LangChain Documentation. "Semantic Chunking." https://python.langchain.com/docs/how_to/semantic-chunker/
