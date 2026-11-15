import fs from "node:fs/promises";
import path from "node:path";
import { Resvg } from "@resvg/resvg-js";
import satori, { type Font } from "satori";
import { truncateText } from "./text-fit.ts";

const WIDTH = 1200;
const HEIGHT = 630;
const PADDING = 72;
const AVATAR_SIZE = 80;
const TITLE_MAX_CHARS = 72;
const DESCRIPTION_MAX_CHARS = 200;

const COLORS = {
  background: "#f8f9fa",
  text: "#212529",
  muted: "#6c757d"
} as const;

const FONT_DIR = path.join(
  process.cwd(),
  "node_modules/@fontsource/fira-sans/files"
);
const PROFILE_PATH = path.join(process.cwd(), "src/assets/profile.jpeg");

const FONT_FILES = [
  { file: "fira-sans-latin-400-normal.woff", weight: 400 },
  { file: "fira-sans-latin-600-normal.woff", weight: 600 }
] as const;

export type SocialImageInput = {
  title: string;
  description: string;
  authorName: string;
};

type SocialImageAssets = {
  fonts: Font[];
  profileDataUri: string;
};

type LayoutNode = {
  type: string;
  props: Record<string, unknown>;
};

let assetsPromise: Promise<SocialImageAssets> | null = null;

function loadAssets(): Promise<SocialImageAssets> {
  assetsPromise ??= Promise.all([
    Promise.all(
      FONT_FILES.map(async ({ file, weight }) => ({
        name: "Fira Sans",
        data: await fs.readFile(path.join(FONT_DIR, file)),
        weight,
        style: "normal" as const
      }))
    ),
    fs
      .readFile(PROFILE_PATH)
      .then((buffer) => `data:image/jpeg;base64,${buffer.toString("base64")}`)
  ])
    .then(([fonts, profileDataUri]) => ({ fonts, profileDataUri }))
    .catch((error: unknown) => {
      assetsPromise = null;
      throw error;
    });

  return assetsPromise;
}

function buildLayout(
  input: SocialImageInput,
  assets: SocialImageAssets
): LayoutNode {
  const title = truncateText(input.title, TITLE_MAX_CHARS);
  const description = truncateText(input.description, DESCRIPTION_MAX_CHARS);

  return {
    type: "div",
    props: {
      style: {
        width: `${WIDTH}px`,
        height: `${HEIGHT}px`,
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: `${PADDING}px`,
        backgroundColor: COLORS.background,
        color: COLORS.text,
        fontFamily: "Fira Sans"
      },
      children: [
        {
          type: "div",
          props: {
            style: {
              display: "flex",
              flexDirection: "column",
              gap: "20px",
              maxWidth: "1000px"
            },
            children: [
              {
                type: "div",
                props: {
                  style: {
                    display: "flex",
                    fontSize: "56px",
                    fontWeight: 600,
                    lineHeight: 1.15,
                    letterSpacing: "-0.02em"
                  },
                  children: title
                }
              },
              {
                type: "div",
                props: {
                  style: {
                    display: "flex",
                    maxWidth: "980px",
                    fontSize: "28px",
                    lineHeight: 1.4,
                    color: COLORS.muted
                  },
                  children: description
                }
              }
            ]
          }
        },
        {
          type: "div",
          props: {
            style: {
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              gap: "20px"
            },
            children: [
              {
                type: "div",
                props: {
                  style: {
                    display: "flex",
                    width: `${AVATAR_SIZE}px`,
                    height: `${AVATAR_SIZE}px`,
                    flexShrink: 0,
                    overflow: "hidden",
                    borderRadius: "50%"
                  },
                  children: {
                    type: "img",
                    props: {
                      src: assets.profileDataUri,
                      width: AVATAR_SIZE,
                      height: AVATAR_SIZE,
                      style: {
                        width: `${AVATAR_SIZE}px`,
                        height: `${AVATAR_SIZE}px`,
                        borderRadius: "50%"
                      }
                    }
                  }
                }
              },
              {
                type: "div",
                props: {
                  style: {
                    display: "flex",
                    fontSize: "28px",
                    fontWeight: 600
                  },
                  children: input.authorName
                }
              }
            ]
          }
        }
      ]
    }
  };
}

/**
 * Render the per-post social image as a 1200x630 PNG. The layout uses the
 * site palette and Fira Sans, truncates text at word boundaries, and keeps the
 * square profile photo uncropped inside a circular mask.
 */
export async function renderSocialImage(
  input: SocialImageInput
): Promise<Uint8Array> {
  const assets = await loadAssets();
  const svg = await satori(buildLayout(input, assets) as Parameters<typeof satori>[0], {
    width: WIDTH,
    height: HEIGHT,
    fonts: assets.fonts
  });
  const png = new Resvg(svg, {
    fitTo: { mode: "width", value: WIDTH }
  })
    .render()
    .asPng();

  return new Uint8Array(png);
}
