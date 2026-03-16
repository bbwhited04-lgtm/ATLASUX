import React from "react";
import { Composition } from "remotion";
import { LucyInboundCall } from "./LucyInboundCall";
import { MercerOutboundCall } from "./MercerOutboundCall";
import { SlackIntegration } from "./SlackIntegration";
import { ZoomIntegration } from "./ZoomIntegration";
import { MultiLanguage } from "./MultiLanguage";
import { LucyAnimated } from "./LucyAnimated";

const FPS = 30;

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="LucyInboundCall"
        component={LucyInboundCall}
        durationInFrames={Math.ceil(28.5 * FPS)}
        fps={FPS}
        width={1920}
        height={1080}
      />
      <Composition
        id="MercerOutboundCall"
        component={MercerOutboundCall}
        durationInFrames={Math.ceil(28.5 * FPS)}
        fps={FPS}
        width={1920}
        height={1080}
      />
      <Composition
        id="SlackIntegration"
        component={SlackIntegration}
        durationInFrames={Math.ceil(26 * FPS)}
        fps={FPS}
        width={1920}
        height={1080}
      />
      <Composition
        id="ZoomIntegration"
        component={ZoomIntegration}
        durationInFrames={Math.ceil(25 * FPS)}
        fps={FPS}
        width={1920}
        height={1080}
      />
      <Composition
        id="MultiLanguage"
        component={MultiLanguage}
        durationInFrames={Math.ceil(26 * FPS)}
        fps={FPS}
        width={1920}
        height={1080}
      />
      <Composition
        id="LucyAnimated"
        component={LucyAnimated}
        durationInFrames={Math.ceil(30 * FPS)}
        fps={FPS}
        width={1920}
        height={1080}
      />
    </>
  );
};
