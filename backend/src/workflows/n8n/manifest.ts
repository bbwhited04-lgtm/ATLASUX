export type N8nWorkflowDef = {
  id: string;
  name: string;
  category: string;
  file: string; // repo-relative path (relative to backend/src and copied to dist)
  webhookPath?: string | null;
};

// Auto-generated from src/workflows/n8n/**/*.json (keep deterministic; avoid manual edits).
export const n8nWorkflows: N8nWorkflowDef[] = [
  {
    id: "N8N-analytics_competitor_price_scrapper",
    name: "Competitor Price Scraper",
    category: "analytics",
    file: "workflows/n8n/analytics/competitor_price_scrapper.json",
    webhookPath: "competitor-price-scraper",
  },
  {
    id: "N8N-content_creation_youtube2blog",
    name: "YouTube Transcript to Blog",
    category: "content_creation",
    file: "workflows/n8n/content_creation/youtube2blog.json",
    webhookPath: "youtube-transcript-to-blog",
  },
  {
    id: "N8N-devops_github_jenkins",
    name: "GitHub Commit Jenkins",
    category: "devops",
    file: "workflows/n8n/devops/github_jenkins.json",
    webhookPath: "github-commit-jenkins",
  },
  {
    id: "N8N-education_quiz_auto_grader",
    name: "Quiz Auto Grader",
    category: "education",
    file: "workflows/n8n/education/quiz_auto_grader.json",
    webhookPath: "quiz-auto-grader",
  },
  {
    id: "N8N-healthcare_appointment_notification",
    name: "Appointment WhatsApp Notify",
    category: "healthcare",
    file: "workflows/n8n/healthcare/appointment_notification.json",
    webhookPath: "appointment-whatsapp-notify",
  },
  {
    id: "N8N-hr_job_application_parser",
    name: "New Job Application Parser",
    category: "hr",
    file: "workflows/n8n/hr/job_application_parser.json",
    webhookPath: "new-job-application-parser",
  },
  {
    id: "N8N-media_ad_campain_alert",
    name: "Ad Campaign Performance Alert",
    category: "media",
    file: "workflows/n8n/media/ad_campain_alert.json",
    webhookPath: "ad_campaign_performance_alert",
  },
  {
    id: "N8N-media_tv_rating_trents",
    name: "TV Rating Trend Report",
    category: "media",
    file: "workflows/n8n/media/tv_rating_trents.json",
    webhookPath: "tv_rating_trend_report",
  },
  {
    id: "N8N-social_media_auto_dm_twitter_new_follower",
    name: "Auto-DM New Twitter Followers",
    category: "social_media",
    file: "workflows/n8n/social_media/auto_dm_twitter_new_follower.json",
    webhookPath: "auto-dm-new-twitter-followers",
  },
  {
    id: "N8N-social_media_auto_blogpost_linkedin_twitter",
    name: "Auto-post Blogs to LinkedIn and Twitter",
    category: "social_media",
    file: "workflows/n8n/social_media/auto_blogpost_linkedin_twitter.json",
    webhookPath: "auto-post-blogs-to-linkedin-and-twitter",
  },
  {
    id: "N8N-social_media_auto_publish_web_articles_as_social_posts_for_x_linkedin_reddit_threads_with_gemini_ai",
    name: "Auto-Publish Web Articles as Social Posts for X, LinkedIn, Reddit & Threads with Gemini AI",
    category: "social_media",
    file: "workflows/n8n/social_media/Auto-Publish Web Articles as Social Posts for X, LinkedIn, Reddit & Threads with Gemini AI.json",
  },
  {
    id: "N8N-social_media_automated_instagram_comment_response_with_dms_google_sheets_tracking",
    name: "Automated Instagram comment response with DMs & Google Sheets tracking",
    category: "social_media",
    file: "workflows/n8n/social_media/Automated Instagram comment response with DMs & Google Sheets tracking.json",
  },
  {
    id: "N8N-social_media_automated_linkedin_content_creation_with_gpt_4_and_dall_e_for_scheduled_posts",
    name: "Automated LinkedIn content creation with GPT-4 and DALL-E for scheduled posts",
    category: "social_media",
    file: "workflows/n8n/social_media/Automated LinkedIn content creation with GPT-4 and DALL-E for scheduled posts.json",
  },
  {
    id: "N8N-social_media_bulk_auto_publish_videos_to_social_networks_with_ai_copy_and_client_approval",
    name: "My workflow 2",
    category: "social_media",
    file: "workflows/n8n/social_media/Bulk Auto-Publish Videos to Social Networks with AI Copy and Client Approval.json",
  },
  {
    id: "N8N-social_media_bulk_auto_publish_videos_to_social_networks_with_ai_copy_and_client_approval_2",
    name: "My workflow 3",
    category: "social_media",
    file: "workflows/n8n/social_media/Bulk auto-publish videos to social networks with AI copy and client approval.json",
  },
  {
    id: "N8N-social_media_pinterest",
    name: "Pinterest Publish - Webhook \u2192 Pinterest API (template)",
    category: "social_media",
    file: "workflows/n8n/social_media/pinterest.json",
    webhookPath: "pinterest-publish",
  },
  {
    id: "N8N-social_media_multipass",
    name: "Publish image & video to multiple social media (X, Instagram, Facebook and more)",
    category: "social_media",
    file: "workflows/n8n/social_media/multipass.json",
  },
  {
    id: "N8N-social_media_publish_image_video_to_multiple_social_media_x_instagram_facebook_and_more",
    name: "Publish image & video to multiple social media (X, Instagram, Facebook and more)",
    category: "social_media",
    file: "workflows/n8n/social_media/Publish image & video to multiple social media (X, Instagram, Facebook and more).json",
  },
  {
    id: "N8N-social_media_tumblr",
    name: "Tumblr",
    category: "social_media",
    file: "workflows/n8n/social_media/Tumblr.json",
  },
  {
    id: "N8N-social_media_tumblr_original",
    name: "Tumblr",
    category: "social_media",
    file: "workflows/n8n/social_media/Tumblr_original.json",
  },
  {
    id: "N8N-social_media_tumblr_publish",
    name: "Tumblr Publish (Atlas)",
    category: "social_media",
    file: "workflows/n8n/social_media/tumblr_publish.json",
    webhookPath: "atlas-tumblr-publish",
  },
  {
    id: "N8N-social_media_universal_social_media_content_generator_with_ai",
    name: "Universal Social Media Content Generator with AI",
    category: "social_media",
    file: "workflows/n8n/social_media/Universal Social Media Content Generator with AI.json",
  },
  {
    id: "N8N-social_media_automate_multi_platform_social_media_content_creation_with_ai",
    name: "\u2728\ud83e\udd16Automate Multi-Platform Social Media Content Creation with AI",
    category: "social_media",
    file: "workflows/n8n/social_media/✨🤖Automate Multi-Platform Social Media Content Creation with AI.json",
  },
];
