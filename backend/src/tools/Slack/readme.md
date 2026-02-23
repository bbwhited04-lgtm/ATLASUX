>[!NOTE]
> This skill requires you to have a Slack app installed on your computer.
> Deeplinks are only supported on AnythingLLM Desktop - not the web app/docker version.

## Open Slack App

This is an agent skill for AnythingLLM that allows you to open Slack channels and send messages to them.

## Setup

1. Install the package by using its import ID from the AnythingLLM Community Hub and pasting that into the "Import ID" field in the AnythingLLM app.
2. Activate the skill by clicking the toggle button in the AnythingLLM app under the "Agent Skills" section.

## Usage

Once installed, you can ask the AnythingLLM app via `@agent` to open Slack channels and send messages to them using natural language.

~~~
@agent open the #general channel
> Will show link in UI to open Slack app on your computer.

@agent open slack
> Will open Slack app on your computer automatically if on AnythingLLM Desktop.
~~~
