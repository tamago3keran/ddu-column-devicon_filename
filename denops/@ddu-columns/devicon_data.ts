import { Denops, fn } from "https://deno.land/x/ddu_vim@v2.8.3/deps.ts";
import { extname } from "https://deno.land/std@0.185.0/path/mod.ts";
import { getDeviconList } from './devicon_list.ts';

type DeviconData = {
  icon: string;
  color: string;
  cterm_color: string;
  name: string;
}

export const getDevicon = (args: {
  fileName: string;
}): string => {
  const iconData = getDeviconData({ fileName: args.fileName });
  return iconData.icon;
}

export const setDeviconColor = async (args: {
  denops: Denops;
  fileName: string;
  highlights: Array<object>;
  col: number;
  width: number;
  color: string;
}): string => {
  const {denops, fileName, highlights, col, width, color} = args;
  const iconData = getDeviconData({ fileName: fileName });
  if (!iconData) return;

  const hl_group = `ddu_column_${iconData.name}`;
  highlights.push({
    name: "column-icons-icon",
    hl_group: hl_group,
    col: col,
    width: width,
  });

  const iconColor = color ?? iconData.color;
  denops.cmd(`hi default ${hl_group} guifg=${iconColor}`);
}

const getDeviconData = (args: {
  fileName: string;
}): DeviconData => {
  const {fileName} = args;
  const devicons = getDeviconList();
  return (devicons[fileName] ?? devicons[extname(fileName).substring(1)]) ?? devicons["default"];
}
