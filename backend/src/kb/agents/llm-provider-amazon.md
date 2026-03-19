# LLM Provider Profile: Amazon (Nova & Titan)

## Company Background

Amazon entered the foundation model race through two paths: distributing third-party models via Amazon Bedrock (launched 2023) and building its own proprietary models under the Nova and Titan brands. While Bedrock made headlines by offering models from Anthropic, Meta, Mistral, and others through a unified API, Amazon quietly invested billions in developing competitive in-house models.

Amazon's AI efforts are led by its Artificial General Intelligence (AGI) team and Amazon Web Services (AWS). The company has invested over $4 billion in Anthropic and simultaneously developed its own model families. The Nova models, announced at AWS re:Invent 2024, represent Amazon's most serious push into competitive LLM territory.

Amazon's strategy is distinctive: rather than competing head-to-head with frontier models on raw benchmarks, Nova models are optimized for cost-efficiency, AWS ecosystem integration, and enterprise compliance. They are designed to be the default choice for the millions of businesses already running on AWS infrastructure.

The Titan family, Amazon's earlier model line, includes text generation, embedding, and image generation models. While less capable than Nova, Titan models continue to serve as cost-effective options for simpler tasks.

![Amazon Nova Logo](https://d2908q01vomqb2.cloudfront.net/da4b9237bacccdf19c0760cab7aec4a8359010b0/2024/12/03/amazon-nova-hero.png)

---

## Model Lineup

### Amazon Nova Pro

Nova Pro is Amazon's mid-tier model, balancing capability with cost-efficiency. It supports text, image, and video understanding in a single multimodal architecture.

| Specification | Details |
|---|---|
| Parameters | Not publicly disclosed |
| Context Window | 300,000 tokens |
| Modalities | Text, image, video (input); text (output) |
| Architecture | Transformer (proprietary) |
| Input Pricing | $0.80 per million tokens |
| Output Pricing | $3.20 per million tokens |
| Image Input | $0.0012 per image |
| Video Input | $0.0065 per second |

Nova Pro handles complex document analysis, multi-step reasoning, and long-context tasks. Its 300K context window accommodates entire codebases, lengthy legal documents, or extended conversation histories. The model processes up to 30-minute videos and can answer questions about visual content.

### Amazon Nova Lite

Nova Lite is optimized for high-throughput, cost-sensitive workloads. It provides fast inference with multimodal understanding at aggressive pricing.

| Specification | Details |
|---|---|
| Parameters | Not publicly disclosed |
| Context Window | 300,000 tokens |
| Modalities | Text, image, video (input); text (output) |
| Architecture | Transformer (proprietary) |
| Input Pricing | $0.06 per million tokens |
| Output Pricing | $0.24 per million tokens |
| Image Input | $0.00018 per image |
| Video Input | $0.00098 per second |

At $0.06 per million input tokens, Nova Lite is among the cheapest capable models available. It is Amazon's recommendation for tasks like content classification, entity extraction, and simple Q&A where latency and cost matter more than peak quality.

### Amazon Nova Micro

Nova Micro is a text-only model designed for maximum speed and minimum cost. It is the fastest model in the Nova family.

| Specification | Details |
|---|---|
| Parameters | Not publicly disclosed |
| Context Window | 128,000 tokens |
| Modalities | Text only |
| Architecture | Transformer (proprietary) |
| Input Pricing | $0.035 per million tokens |
| Output Pricing | $0.14 per million tokens |

Nova Micro targets high-volume, low-complexity tasks: classification, routing, summarization of short texts, and structured data extraction. Its sub-100ms latency makes it suitable for real-time applications.

### Amazon Nova Canvas

Nova Canvas is Amazon's image generation model, capable of producing photorealistic and artistic images from text prompts.

| Specification | Details |
|---|---|
| Max Resolution | 2048 x 2048 |
| Pricing | $0.04 per standard image |
| Features | Inpainting, outpainting, background removal, color conditioning |

### Amazon Nova Reel

Nova Reel generates short-form video from text descriptions, supporting up to 6-second clips at 1280x720 resolution.

| Specification | Details |
|---|---|
| Max Duration | 6 seconds |
| Resolution | 1280 x 720 |
| Pricing | $0.048 per second of video |

![Amazon Nova Model Family](https://d2908q01vomqb2.cloudfront.net/da4b9237bacccdf19c0760cab7aec4a8359010b0/2024/12/03/amazon-nova-family.png)

### Amazon Titan Models

The Titan family predates Nova and includes:

| Model | Type | Context | Pricing (Input/Output) |
|---|---|---|---|
| Titan Text Express | Text generation | 8,192 tokens | $0.20 / $0.60 per 1M |
| Titan Text Lite | Text generation | 4,096 tokens | $0.15 / $0.20 per 1M |
| Titan Embeddings v2 | Text embeddings | 8,192 tokens | $0.02 per 1M tokens |
| Titan Multimodal Embeddings | Image+text embeddings | 128 tokens + image | $0.0008 per image |
| Titan Image Generator v2 | Image generation | N/A | $0.01 per image |

---

## API Features

### Amazon Bedrock Integration

All Nova and Titan models are accessed exclusively through Amazon Bedrock, AWS's managed AI service. Bedrock provides:

- **Unified API** — Single endpoint for Amazon, Anthropic, Meta, Mistral, and other models
- **Model evaluation** — Built-in tools to compare model performance on your data
- **Guardrails** — Content filtering, PII detection, topic restrictions
- **Knowledge Bases** — Managed RAG with automatic chunking and vector storage
- **Agents** — Multi-step task orchestration with tool use

```python
import boto3

client = boto3.client('bedrock-runtime', region_name='us-east-1')

response = client.converse(
    modelId='amazon.nova-pro-v1:0',
    messages=[{
        'role': 'user',
        'content': [{'text': 'Analyze this document...'}]
    }]
)
```

### Bedrock Knowledge Bases

Amazon's managed RAG solution handles the entire pipeline: document ingestion (S3, Confluence, SharePoint, web crawling), chunking (fixed, semantic, hierarchical), embedding, vector storage (OpenSearch Serverless, Pinecone, Redis), and retrieval. It supports metadata filtering and hybrid search.

![Amazon Bedrock Architecture](https://d2908q01vomqb2.cloudfront.net/da4b9237bacccdf19c0760cab7aec4a8359010b0/2024/12/03/bedrock-knowledge-bases-architecture.png)

### Bedrock Guardrails

Configurable content policies that filter inputs and outputs across all models:
- **Content filters** — Hate, violence, sexual content, misconduct (adjustable thresholds)
- **Denied topics** — Custom topic restrictions (e.g., "do not discuss competitors")
- **Word filters** — Block specific terms or patterns
- **PII detection** — Automatically mask or block PII in inputs/outputs
- **Contextual grounding** — Check responses against provided context for hallucination

### Provisioned Throughput

For production workloads, Bedrock offers provisioned throughput with guaranteed capacity:
- 1-month or 6-month commitments
- Dedicated inference capacity
- Consistent latency under load
- Significant discounts over on-demand pricing

### Fine-Tuning

Nova Pro and Nova Lite support fine-tuning through Bedrock. Training data is uploaded to S3, and the fine-tuning job runs within your AWS account. The resulting custom model is private to your account and billed at a premium over the base model price.

---

## Benchmark Performance

### General Benchmarks

| Benchmark | Nova Pro | Nova Lite | Nova Micro | GPT-4o (ref) |
|---|---|---|---|---|
| MMLU | 73.1% | 64.5% | 58.7% | 85.7% |
| HumanEval | 69.5% | 57.3% | 48.2% | 90.2% |
| GSM8K | 82.4% | 71.6% | 65.3% | 95.8% |
| ARC-Challenge | 88.2% | 81.7% | 75.4% | 96.1% |

### Multimodal Benchmarks

| Benchmark | Nova Pro | Nova Lite | GPT-4o (ref) |
|---|---|---|---|
| MMMU | 52.1% | 43.8% | 69.1% |
| VQAv2 | 78.3% | 71.2% | 82.6% |
| TextVQA | 73.8% | 65.4% | 78.9% |

### Cost-Adjusted Performance

Where Nova models shine is cost-efficiency. At $0.06/$0.24, Nova Lite delivers roughly 75% of GPT-4o-mini's quality at 60% of the cost. For high-volume classification and extraction tasks, this translates to significant savings.

---

## Key Capabilities

### Video Understanding

Nova Pro and Nova Lite can process video inputs up to 30 minutes. The models extract visual information, transcribe speech, and answer questions about video content. Use cases include:
- Security footage analysis
- Meeting recording summarization
- Product demo content extraction
- Quality control in manufacturing

### AWS Ecosystem Integration

The deepest advantage of Nova models is their integration with the broader AWS stack:
- **S3** — Document storage and retrieval
- **Lambda** — Serverless inference triggers
- **Step Functions** — Multi-step AI workflows
- **CloudWatch** — Monitoring and logging
- **IAM** — Fine-grained access control
- **VPC** — Private network isolation
- **CloudTrail** — API call auditing

### Enterprise Compliance

Nova models inherit AWS's compliance certifications:
- SOC 1/2/3
- HIPAA eligible
- FedRAMP authorized
- PCI DSS compliant
- ISO 27001/27017/27018
- GDPR compliant

![AWS Compliance Certifications](https://d2908q01vomqb2.cloudfront.net/22d200f8670dbdb3e253a90eee5098477c95c23d/2024/01/aws-compliance-badges.png)

---

## Strengths

1. **AWS ecosystem integration** — For organizations already on AWS, Nova models plug directly into existing infrastructure with IAM, VPC, CloudWatch, and S3 integration requiring zero new tooling.

2. **Aggressive pricing** — Nova Lite at $0.06/$0.24 and Nova Micro at $0.035/$0.14 are among the cheapest capable models available from any major provider.

3. **Enterprise compliance out of the box** — SOC 2, HIPAA, FedRAMP, and PCI DSS compliance is inherited from the AWS platform, eliminating months of compliance work.

4. **Multimodal flexibility** — Text, image, and video understanding in a single model reduces the need to maintain separate pipelines for different content types.

5. **Managed RAG infrastructure** — Bedrock Knowledge Bases handle the entire RAG pipeline, from ingestion to retrieval, as a managed service — reducing engineering overhead significantly.

---

## Weaknesses

1. **Benchmark gap with frontier models** — Nova Pro scores 73.1% on MMLU versus 85.7% for GPT-4o. For tasks requiring peak reasoning capability, Nova is not the right choice.

2. **AWS lock-in** — Nova models are only available through Bedrock. Organizations not on AWS must adopt AWS infrastructure to use them, creating vendor dependency.

3. **Opaque model details** — Amazon does not disclose parameter counts, training data composition, or detailed architecture information, making independent evaluation difficult.

4. **Newer and less battle-tested** — Nova launched in December 2024. It lacks the years of production deployment experience that OpenAI and Anthropic models have accumulated.

5. **Limited community and third-party tooling** — Fewer open-source libraries, tutorials, and community resources compared to OpenAI or Hugging Face ecosystems.

---

## Best Use Cases

### High-Volume Document Processing
Nova Lite's low cost and 300K context window make it ideal for processing large volumes of documents — insurance claims, loan applications, medical records — where the task is structured extraction rather than open-ended reasoning.

### AWS-Native AI Applications
For organizations already running on AWS, Nova models eliminate the need for external API calls, network egress fees, and third-party data processing agreements. Everything stays within the AWS account.

### Video and Image Analysis at Scale
Nova Pro's multimodal capabilities enable automated analysis of visual content — product images, security footage, manufacturing inspection — at costs that make batch processing economically viable.

### Cost-Optimized Inference Tiers
A common pattern is tiering: Nova Micro for routing/classification, Nova Lite for standard tasks, Nova Pro for complex reasoning, with Bedrock's model evaluation helping determine which tier to use for each request.

### Regulated Industries
Healthcare, financial services, and government agencies that require HIPAA, SOC 2, or FedRAMP compliance can deploy Nova models with confidence that the infrastructure meets regulatory requirements.

![Amazon Bedrock Console](https://d2908q01vomqb2.cloudfront.net/da4b9237bacccdf19c0760cab7aec4a8359010b0/2024/12/03/bedrock-console-models.png)

---

## Pricing Summary (Early 2025)

| Model | Input (per 1M tokens) | Output (per 1M tokens) |
|---|---|---|
| Nova Pro | $0.80 | $3.20 |
| Nova Lite | $0.06 | $0.24 |
| Nova Micro | $0.035 | $0.14 |
| Titan Text Express | $0.20 | $0.60 |
| Titan Text Lite | $0.15 | $0.20 |
| Titan Embeddings v2 | $0.02 | N/A |

Bedrock offers on-demand pricing (pay per token) and provisioned throughput (reserved capacity with discounts). Free tier: limited free tokens for the first 2 months.

---

## Video Resources

1. [AWS re:Invent 2024 — Introducing Amazon Nova Foundation Models (YouTube)](https://www.youtube.com/watch?v=8jKKoMYaKJ4)
2. [Building RAG Applications with Amazon Bedrock Knowledge Bases — Full Tutorial (YouTube)](https://www.youtube.com/watch?v=9Rl0l8sinYs)

---

## References

1. AWS Documentation — Amazon Nova Models. [https://docs.aws.amazon.com/bedrock/latest/userguide/nova-models.html](https://docs.aws.amazon.com/bedrock/latest/userguide/nova-models.html)
2. AWS Bedrock Pricing. [https://aws.amazon.com/bedrock/pricing/](https://aws.amazon.com/bedrock/pricing/)
3. AWS Blog — Introducing Amazon Nova (December 2024). [https://aws.amazon.com/blogs/aws/introducing-amazon-nova/](https://aws.amazon.com/blogs/aws/introducing-amazon-nova/)
4. AWS Documentation — Amazon Bedrock Guardrails. [https://docs.aws.amazon.com/bedrock/latest/userguide/guardrails.html](https://docs.aws.amazon.com/bedrock/latest/userguide/guardrails.html)
5. AWS Documentation — Amazon Bedrock Knowledge Bases. [https://docs.aws.amazon.com/bedrock/latest/userguide/knowledge-base.html](https://docs.aws.amazon.com/bedrock/latest/userguide/knowledge-base.html)
