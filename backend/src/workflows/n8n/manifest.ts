export type N8nWorkflowDef = {
  id: string;
  name: string;
  category: string;
  file: string; // repo-relative path
  webhookPath?: string | null;
};

export const n8nWorkflows: N8nWorkflowDef[] = [
  {
    id: "N8N-analytics_competitor_price_scrapper",
    name: "Competitor Price Scraper",
    category: "analytics",
    file: "workflows/n8n/analytics/competitor_price_scrapper.json",
    webhookPath: null,
  },
  {
    id: "N8N-atlas_ATLAS_orchestrator_FULL_email_endpoint",
    name: "ATLAS Orchestrator - FULL (Email Endpoint)",
    category: "atlas",
    file: "workflows/n8n/ATLAS_orchestrator_FULL_email_endpoint.json",
    webhookPath: null,
  },
  {
    id: "N8N-content_creation_youtube2blog",
    name: "YouTube Transcript to Blog",
    category: "content_creation",
    file: "workflows/n8n/content_creation/youtube2blog.json",
    webhookPath: null,
  },
  {
    id: "N8N-devops_github_jenkins",
    name: "GitHub Commit Jenkins",
    category: "devops",
    file: "workflows/n8n/devops/github_jenkins.json",
    webhookPath: null,
  },
  {
    id: "N8N-education_quiz_auto_grader",
    name: "Quiz Auto Grader",
    category: "education",
    file: "workflows/n8n/education/quiz_auto_grader.json",
    webhookPath: null,
  },
  {
    id: "N8N-healthcare_appointment_notification",
    name: "Appointment WhatsApp Notify",
    category: "healthcare",
    file: "workflows/n8n/healthcare/appointment_notification.json",
    webhookPath: null,
  },
  {
    id: "N8N-hr_job_application_parser",
    name: "New Job Application Parser",
    category: "hr",
    file: "workflows/n8n/hr/job_application_parser.json",
    webhookPath: null,
  },
  {
    id: "N8N-media_ad_campain_alert",
    name: "Ad Campaign Performance Alert",
    category: "media",
    file: "workflows/n8n/media/ad_campain_alert.json",
    webhookPath: null,
  },
  {
    id: "N8N-media_tv_rating_trents",
    name: "TV Rating Trend Report",
    category: "media",
    file: "workflows/n8n/media/tv_rating_trents.json",
    webhookPath: null,
  },
  {
    id: "N8N-social_media_auto_dm_twitter_new_follower",
    name: "Auto-DM New Twitter Followers",
    category: "social_media",
    file: "workflows/n8n/social_media/auto_dm_twitter_new_follower.json",
    webhookPath: null,
  },
  {
    id: "N8N-social_media_auto_blogpost_linkedin_twitter",
    name: "Auto-post Blogs to LinkedIn and Twitter",
    category: "social_media",
    file: "workflows/n8n/social_media/auto_blogpost_linkedin_twitter.json",
    webhookPath: null,
  },
  {
    id: "N8N-social_media_Auto_Publish_Web_Articles_as_Social_Posts_for_X_LinkedIn_Reddit_Threads_with_Gemini_AI",
    name: "Auto-Publish Web Articles as Social Posts for X, LinkedIn, Reddit & Threads with Gemini AI",
    category: "social_media",
    file: "workflows/n8n/social_media/Auto-Publish Web Articles as Social Posts for X, LinkedIn, Reddit & Threads with Gemini AI.json",
    webhookPath: null,
  },
  {
    id: "N8N-social_media_Automated_Instagram_comment_response_with_DMs_Google_Sheets_tracking",
    name: "Automated Instagram comment response with DMs & Google Sheets tracking",
    category: "social_media",
    file: "workflows/n8n/social_media/Automated Instagram comment response with DMs & Google Sheets tracking.json",
    webhookPath: null,
  },
  {
    id: "N8N-social_media_Automated_LinkedIn_content_creation_with_GPT_4_and_DALL_E_for_scheduled_posts",
    name: "Automated LinkedIn content creation with GPT-4 and DALL-E for scheduled posts",
    category: "social_media",
    file: "workflows/n8n/social_media/Automated LinkedIn content creation with GPT-4 and DALL-E for scheduled posts.json",
    webhookPath: null,
  },
  {
    id: "N8N-social_media_Bulk_Auto_Publish_Videos_to_Social_Networks_with_AI_Copy_and_Client_Approval",
    name: "My workflow 2",
    category: "social_media",
    file: "workflows/n8n/social_media/Bulk Auto-Publish Videos to Social Networks with AI Copy and Client Approval.json",
    webhookPath: null,
  },
  {
    id: "N8N-social_media_Bulk_auto_publish_videos_to_social_networks_with_AI_copy_and_client_approval",
    name: "My workflow 3",
    category: "social_media",
    file: "workflows/n8n/social_media/Bulk auto-publish videos to social networks with AI copy and client approval.json",
    webhookPath: null,
  },
  {
    id: "N8N-social_media_pinterest",
    name: "Pinterest Publish - Webhook \u2192 Pinterest API (template)",
    category: "social_media",
    file: "workflows/n8n/social_media/pinterest.json",
    webhookPath: null,
  },
  {
    id: "N8N-social_media_Publish_image_video_to_multiple_social_media_X_Instagram_Facebook_and_more",
    name: "Publish image & video to multiple social media (X, Instagram, Facebook and more)",
    category: "social_media",
    file: "workflows/n8n/social_media/Publish image & video to multiple social media (X, Instagram, Facebook and more).json",
    webhookPath: null,
  },
  {
    id: "N8N-social_media_multipass",
    name: "Publish image & video to multiple social media (X, Instagram, Facebook and more)",
    category: "social_media",
    file: "workflows/n8n/social_media/multipass.json",
    webhookPath: null,
  },
  {
    id: "N8N-social_media_Tumblr",
    name: "Tumblr",
    category: "social_media",
    file: "workflows/n8n/social_media/Tumblr.json",
    webhookPath: null,
  },
  {
    id: "N8N-social_media_Tumblr_original",
    name: "Tumblr",
    category: "social_media",
    file: "workflows/n8n/social_media/Tumblr_original.json",
    webhookPath: null,
  },
  {
    id: "N8N-social_media_tumblr_publish",
    name: "Tumblr Publish (Atlas)",
    category: "social_media",
    file: "workflows/n8n/social_media/tumblr_publish.json",
    webhookPath: null,
  },
  {
    id: "N8N-social_media_Universal_Social_Media_Content_Generator_with_AI",
    name: "Universal Social Media Content Generator with AI",
    category: "social_media",
    file: "workflows/n8n/social_media/Universal Social Media Content Generator with AI.json",
    webhookPath: null,
  },
  {
    id: "N8N-social_media_Automate_Multi_Platform_Social_Media_Content_Creation_with_AI",
    name: "\u2728\ud83e\udd16Automate Multi-Platform Social Media Content Creation with AI",
    category: "social_media",
    file: "workflows/n8n/social_media/✨🤖Automate Multi-Platform Social Media Content Creation with AI.json",
    webhookPath: null,
  },
];

export default n8nWorkflows;