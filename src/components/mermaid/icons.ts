import {
  CLOSE_ICON,
  COPY_ICON,
  DOWNLOAD_ICON,
  EXPAND_ICON,
  FIT_ICON,
  PAN_DOWN_ICON,
  PAN_LEFT_ICON,
  PAN_RIGHT_ICON,
  PAN_UP_ICON,
  strokeIconMarkup,
  ZOOM_IN_ICON,
  ZOOM_OUT_ICON
} from "../../lib/svg-icons.ts";

/**
 * Inline SVG controls for the diagram dialog and the expand button. Stroke
 * icons use `currentColor` so button styles drive the color.
 */

export const zoomInIcon = strokeIconMarkup(ZOOM_IN_ICON);
export const zoomOutIcon = strokeIconMarkup(ZOOM_OUT_ICON);
export const fitIcon = strokeIconMarkup(FIT_ICON);
export const closeIcon = strokeIconMarkup(CLOSE_ICON);
export const copyIcon = strokeIconMarkup(COPY_ICON);
export const downloadIcon = strokeIconMarkup(DOWNLOAD_ICON);
export const panUpIcon = strokeIconMarkup(PAN_UP_ICON);
export const panDownIcon = strokeIconMarkup(PAN_DOWN_ICON);
export const panLeftIcon = strokeIconMarkup(PAN_LEFT_ICON);
export const panRightIcon = strokeIconMarkup(PAN_RIGHT_ICON);
export const expandIcon = strokeIconMarkup(EXPAND_ICON);
