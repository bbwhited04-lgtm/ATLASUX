/ Documentation: https://docs.anythingllm.com/agent/custom/introduction

/**
 * @typedef {Object} AnythingLLM
 * @property {('docker'|'desktop')} runtime - The runtime environment.
 * @property {import('./plugin.json')} config - your plugin's config
 * @property {function(string|Error): void} logger - Logging function
 * @property {function(string): void} introspect - Print a string to the UI while agent skill is running
 * @property {{getLinkContent: function(url): Promise<{success: boolean, content: string}>}} webScraper - Scrape a website easily to bypass user-agent restrictions.
 */

/** @type {AnythingLLM} */
module.exports.runtime = {
  /**
   * @param {import('./plugin.json')['entrypoint']['params']} args - Arguments passed to the agent skill - defined in plugin.json
   */
  handler: async function (args = {}) {
    const callerId = `${this.config.name}-v${this.config.version}`;
    this.logger(`Calling ${callerId}...`);
    this.introspect(`Calling ${callerId}...`);
    try {
      if (args?.channel) {
        const link = new URL("https://slack.com/app_redirect");
        link.searchParams.set("channel", args.channel);

        if (this.runtime === "desktop") {
          open(link.toString());
          return `Opened ${args.channel} in Slack.`;
        }
        return `Display this link to the user in markdown [${args.channel}](${link.toString()}).`;
      }

      if (this.runtime !== "desktop") throw new Error("Deeplink to Slack is only supported on the AnythingLLM desktop application.");
      const link = new URL("slack://");
      open(link.toString());
      return "Opened Slack.";
    } catch (e) {
      this.logger(e)
      this.introspect(
        `${callerId} failed to execute. Reason: ${e.message}`
      );
      return `Failed to execute agent skill. Error ${e.message}`;
    }
  }
};